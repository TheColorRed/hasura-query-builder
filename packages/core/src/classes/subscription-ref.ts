import { of, ReplaySubject, Subject } from 'rxjs';
import { finalize, map, switchMap, take } from 'rxjs/operators';
import { customFields } from '../functions/custom-fields';
import { BaseModel, FieldsResult } from './base-model';
import { Model } from './model';
import { Table } from './table';
// declare let window: CustomWindow;

export class SubscriptionRef<T extends BaseModel = BaseModel, U extends FieldsResult<T> = FieldsResult<T>> {
  private table: string;
  #clone: Table;
  /** The cloned table. */
  get clone() {
    return this.#clone;
  }
  /** @internal */
  id?: string;

  private readonly state = new ReplaySubject<U>(1);
  private readonly closed = new Subject<void>();
  /** Emits when a new request is made. */
  updated$ = this.state.asObservable();
  /** Emits after update is emitted and pipes each item to the source. */
  state$ = this.updated$.pipe(
    map((val: any): FieldsResult<T>[] => {
      return Array.isArray(val[this.table]) ? val[this.table] : [val[this.table]];
    }),
    switchMap(a => of(a).pipe(customFields(this.clone, this.model.attributes))),
    switchMap(items => items as FieldsResult<T>[]),
    finalize(() => console.debug('close'))
  );
  /** Emits when the subscription is closed. */
  closed$ = this.closed.pipe(take(1));

  constructor(private readonly model: Model, private readonly builder: Table) {
    this.#clone = this.builder.clone();
    const stream = typeof this.clone.cursors !== 'undefined' ? '_stream' : '';
    stream.length > 0 && (this.#clone.table = `${model.table}${stream}`);

    this.table = this.clone.alias.length > 0 ? this.clone.alias : `${model.table}${stream}`;
  }
  /**
   * Closes the Hasura subscription.
   */
  close() {
    if (typeof this.id === 'undefined') return;
    if (global.window.hasuraWsClose(this.id)) {
      this.closed.next();
    }
  }
  /**
   * @internal
   * The next data to be sent to the observable.
   */
  next(data: U) {
    this.state.next(data);
  }
}
