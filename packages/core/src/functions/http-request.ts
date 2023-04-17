import { EMPTY, Observable } from 'rxjs';
import { QueryBody } from '../classes/structures/structure';

/**
 * Makes a request to the server.
 * @param body The query body to be sent to the server.
 * @param isSubscription Whether the request is a subscription or not.
 */
export function request<T>(body: QueryBody, isSubscription = false) {
  if (typeof global.window !== 'undefined') {
    return browserRequest<T>(body, isSubscription);
  }
  return EMPTY;
}

/**
 * Makes a request to the server in the browser.
 * @param body The query body to be sent to the server.
 * @param isSubscription Whether the request is a subscription or not.
 */
export function browserRequest<T>(body: QueryBody, isSubscription = false): Observable<T> | typeof EMPTY {
  if (!isSubscription && typeof global.window.hasuraHttpRequest === 'function') {
    return global.window.hasuraHttpRequest<T>(body);
  } else if (isSubscription && typeof global.window.hasuraWsRequest === 'function') {
    return global.window.hasuraWsRequest<T>(body);
  }
  return EMPTY;
}
