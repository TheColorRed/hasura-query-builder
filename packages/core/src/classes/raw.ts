import { EMPTY, exhaustMap, map, Observable } from 'rxjs';
// import { global } from '../global';
import { QueryBody } from './structures/structure';

// import  { CustomWindow as global } from './model';

export class Raw {
  constructor(private readonly query: string, private readonly vars?: object) {}

  private static request(body: QueryBody) {
    if (typeof global.window !== 'undefined') {
      if (typeof global.window.hasuraHttpRequest === 'function') {
        return global.window.hasuraHttpRequest(body) as any;
      }
    }
    return EMPTY;
  }

  /**
   * Executes a query on the database using a query string.
   * @param query The query string to be executed.
   * @param vars The variables to be used in the query.
   */
  static query<T extends object>(query: string, variables?: T) {
    const queryBody: QueryBody = {
      query,
      variables,
    };
    return this.request(queryBody);
    // return new Raw(query, vars);
  }
  /**
   * Loads a query from a file and executes it on the database.
   * @param file The file path to the query to be executed.
   * @param vars The variables to be used in the query.
   */
  static file<T extends any = object, U = any>(file: string, variables?: U): Observable<T> {
    let url = typeof file === 'string' ? new URL(file, global.window.location.href) : file;
    return global.window.hasuraFileReader.read(url).pipe(
      map(query => ({ query, ...{ variables } } as QueryBody)),
      exhaustMap(body => global.window.hasuraHttpRequest(body))
    );
  }
  /**
   * Executes a subscription on the database using a query string.
   * @param subscription The subscription string to be executed.
   * @param vars The variables to be used in the subscription.
   */
  static subscription<T extends object>(subscription: string, vars?: T) {
    // return new Raw(subscription, vars);
  }
}
