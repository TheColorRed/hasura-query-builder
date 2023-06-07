import { EMPTY, Observable } from 'rxjs';
import { QueryBody, QueryOptions } from '../classes/structures/structure';
import { isBrowser } from './helpers';

/**
 * Makes a request to the server.
 * @param body The query body to be sent to the server.
 * @param isSubscription Whether the request is a subscription or not.
 */
export function request<T>(body: QueryBody, requestOptions: QueryOptions = {}) {
  if (isBrowser()) {
    return browserRequest<T>(body, requestOptions);
  }
  return EMPTY;
}

/**
 * Makes a request to the server in a browser.
 * @param body The query body to be sent to the server.
 * @param isSubscription Whether the request is a subscription or not.
 */
export function browserRequest<T>(body: QueryBody, options: QueryOptions = {}): Observable<T> | typeof EMPTY {
  const win = (typeof global !== 'undefined' ? global.window : window) as CustomWindow;
  if (!options.isSubscription && typeof win.hasuraHttpRequest === 'function') {
    return win.hasuraHttpRequest<T>(body, options);
  } else if (options.isSubscription && typeof win.hasuraWsRequest === 'function') {
    return win.hasuraWsRequest<T>(body, options);
  }
  return EMPTY;
}
