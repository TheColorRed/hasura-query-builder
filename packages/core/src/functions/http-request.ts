import { EMPTY, Observable } from 'rxjs';
import { QueryBody } from '../classes/structures/structure';
import { isBrowser } from './helpers';

/**
 * Makes a request to the server.
 * @param body The query body to be sent to the server.
 * @param isSubscription Whether the request is a subscription or not.
 */
export function request<T>(body: QueryBody, isSubscription = false) {
  if (isBrowser()) {
    return browserRequest<T>(body, isSubscription);
  }
  return EMPTY;
}

/**
 * Makes a request to the server in a browser.
 * @param body The query body to be sent to the server.
 * @param isSubscription Whether the request is a subscription or not.
 */
export function browserRequest<T>(body: QueryBody, isSubscription = false): Observable<T> | typeof EMPTY {
  const win = (typeof global !== 'undefined' ? global.window : window) as CustomWindow;
  if (!isSubscription && typeof win.hasuraHttpRequest === 'function') {
    return win.hasuraHttpRequest<T>(body);
  } else if (isSubscription && typeof win.hasuraWsRequest === 'function') {
    return win.hasuraWsRequest<T>(body);
  }
  return EMPTY;
}
