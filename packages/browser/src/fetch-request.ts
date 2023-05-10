import { ConnectionManager, Connections, QueryBody, QueryCache } from '@hasura-query-builder/core';
// import { debug } from '@hasura-query-builder/core/debug';
import { Observable, iif, of, switchMap, tap } from 'rxjs';
import { fromFetch } from 'rxjs/fetch';

const queryCache = new QueryCache();

global.window.hasuraHttpRequest = <T = unknown>(body: QueryBody): Observable<T> => {
  const { query, url, headers } = ConnectionManager.getRequestInformation<Headers>(body);

  const logging = Connections.setting('logging', body.connection) ?? false;
  console.debug('logging', logging);
  const useCache = body.queryOptions?.cache ?? true;
  const additionalHeaders = body.queryOptions?.headers ?? {};
  Object.entries(additionalHeaders).forEach(([key, value]) => headers.set(key, value));

  return queryCache.createFromValue(body).pipe(
    // tap(cached => console.debug('Cached value', cached.value.data)),
    switchMap(cached =>
      iif(
        () => useCache && typeof cached.value.data !== 'undefined' && !queryCache.isExpired(cached.value),
        of(cached.value.data as T),
        fromFetch<T>(url.toString(), {
          headers: headers,
          method: 'post',
          body: query,
          selector: resp => resp.json().then(resp => resp['data']),
        }).pipe(
          tap(resp => queryCache.updateData(cached.value, resp)),
          tap(() => queryCache.updateExpiration(cached.value))
        )
      )
    )
  );
};
