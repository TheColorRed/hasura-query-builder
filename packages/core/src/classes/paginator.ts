import { EMPTY, Observable, ReplaySubject, of, pipe } from 'rxjs';
import { concatMap, exhaustMap, map, tap } from 'rxjs/operators';
import { request } from '../functions/http-request';
import { BaseModel } from './base-model';
import { QueryBuilder } from './query-builder';
import { Table } from './table';

export interface Page<T> {
  totalResults: number;
  totalPages: number;
  resultsPerPage: number;
  currentPage: number;
  isFirstPage: boolean;
  isLastPage: boolean;
  results: T[];
}

export interface PaginationConfig {
  /** The number of results to show per page. Defaults to 10. */
  resultsPerPage?: number;
  /** The model to use for the query. */
  model?: BaseModel;
  /** The type of pagination to use. Defaults to 'classic'. */
  type?: 'classic' | 'cursor';
}

export type Action = 'first' | 'last' | 'next' | 'prev' | 'page';

export class Paginator<T, U = { [key: string]: T[] }> {
  private readonly pageSubject = new ReplaySubject<Page<T>>(1);
  /** The results for the current page. */
  readonly page$ = this.pageSubject.pipe(tap(() => (this.hasRun = true)));
  /** Whether or not the paginator has run at least once. */
  private hasRun = false;

  #page = {
    totalResults: 0,
    totalPages: 0,
    resultsPerPage: 10,
    currentPage: 1,
    isFirstPage: true,
    isLastPage: false,
    results: [],
  } as Page<T>;
  /** A clone of the table. */
  #table: Table;

  constructor(table: Table, private config?: PaginationConfig) {
    this.#table = table.clone();
    this.#page.resultsPerPage = config?.resultsPerPage ?? 10;
    this.#getQueryStats();
    this.#table.limit(this.#page.resultsPerPage, 0);
  }
  /**
   * Navigates to the first page. If the current page is the first page, this method does nothing.
   */
  first() {
    return this.#build('first');
  }
  /**
   * Navigates to the last page. If the current page is the last page, this method does nothing.
   */
  last() {
    return this.#build('last');
  }
  /**
   * Navigates to the next page. If the current page is the last page, this method does nothing.
   */
  next() {
    return this.#build('next');
  }
  /**
   * Navigates to the previous page. If the current page is the first page, this method does nothing.
   */
  previous() {
    return this.#build('prev');
  }
  /**
   * Navigates to a specific page.
   * @param index The page number to go to.
   */
  page(index: number) {
    return this.#build('page', index);
  }

  #build(action: Action, index?: number) {
    let process: Observable<any>;
    if (this.hasRun) {
      process = of(this.#page.totalResults).pipe(this.#applyAction(action, index) as any);
    } else {
      const stats = this.#getQueryStats();
      process = stats.pipe(this.#applyAction(action, index) as any);
    }
    return process.subscribe();
  }

  #applyAction(action: Action, index?: number) {
    return pipe(
      exhaustMap<number, Observable<any>>(page =>
        of(page).pipe(
          tap(() => action === 'prev' && this.#page.currentPage--),
          tap(() => action === 'next' && this.#page.currentPage++),
          tap(() => action === 'first' && (this.#page.currentPage = 1)),
          tap(() => action === 'last' && (this.#page.currentPage = this.#page.totalPages)),
          tap(() => action === 'page' && (this.#page.currentPage = index ?? 0)),
          tap(() => (this.#page.isLastPage = this.#page.currentPage === this.#page.totalPages)),
          tap(() => (this.#page.isFirstPage = this.#page.currentPage === 1)),
          tap(() =>
            this.#table.limit(this.#page.resultsPerPage, (this.#page.currentPage - 1) * this.#page.resultsPerPage)
          ),
          concatMap(() => this.#getResults(this.#table)),
          map<T[], Page<T>>(r => ({ ...this.#page, results: r })),
          tap<Page<T>>(r => this.pageSubject.next(r))
        )
      )
    );
  }

  #getQueryStats() {
    const name = `${this.#table.table}_aggregate`;
    const clone = this.#table.clone(name).select('aggregate{count}').limit('reset');
    const qb = new QueryBuilder(clone, undefined, this.config?.model?.queryOptions);
    const r = qb.build();
    if (typeof global.window !== 'undefined') {
      return request<{ [key: string]: { aggregate: { count: number } } }>(r, clone.model?.queryOptions).pipe(
        tap(res => (this.#page.totalResults = res[name].aggregate.count)),
        tap(() => (this.#page.totalPages = Math.ceil(this.#page.totalResults / this.#page.resultsPerPage)))
      );
    }
    return EMPTY;
  }

  #getResults(table: Table): Observable<T[]> {
    const clone = table.clone();
    if (clone.model instanceof BaseModel) {
      const builder = clone.model.getTable();
      if (builder.selects.length === 0 || typeof builder.selects === 'undefined') {
        clone.select(...(builder.model?.getFields(builder.model.fields) ?? []));
      }
    }
    const qb = new QueryBuilder(clone, undefined, this.config?.model?.queryOptions);
    const r = qb.build();
    return request<U>(r, clone.model?.queryOptions).pipe(map((res: any) => res[clone.table]));
  }
}
