import { ConnectionManager, Connections, CustomWindow, QueryBody } from '@hasura-query-builder/core';
// import { debug } from '@hasura-query-builder/core/debug';
import { Observable } from 'rxjs';
import { fromFetch } from 'rxjs/fetch';

declare let window: CustomWindow;

window.hasuraHttpRequest = <T = unknown>(body: QueryBody): Observable<T> => {
  const { query, url, headers } = ConnectionManager.getRequestInformation<Headers>(body);

  const logging = Connections.setting('logging') ?? false;

  return fromFetch(url.toString(), {
    headers: headers,
    method: 'post',
    body: query,
    selector: resp => resp.json().then(resp => resp['data']),
  });

  // return new Observable<T>(sub => {
  //   fetch(url, { method: 'post', body: query, headers })
  //     .then(resp => resp.json())
  //     .then(response => {
  //       if (logging === true) {
  //         if ('errors' in response) console.error(response['errors']);
  //       }

  //       if ('errors' in response) sub.error(response['errors']);
  //       else sub.next(response['data']);
  //       sub.complete();
  //     });
  // });
};
