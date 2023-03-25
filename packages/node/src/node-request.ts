import { ConnectionManager, Connections, QueryBody } from '@hasura-query-builder/core';
import { debug } from '@hasura-query-builder/core/debug';
import chalk from 'chalk';
import * as http from 'http';
import * as https from 'https';
import { Observable } from 'rxjs';

export function hasuraHttpRequest<T = unknown>(body: QueryBody) {
  const { query, url, headers } = ConnectionManager.getRequestInformation<http.OutgoingHttpHeaders>(body);
  const hr = new Array(process.stdout.columns).fill('-').join('');
  const logging = Connections.setting('logging') ?? false;

  // Do som logging if logging is enabled.
  if (logging === true) {
    debug.log('URL:');
    debug.log(hr);
    debug.log(url.toString());
    debug.log(hr);
    debug.log('Headers:');
    debug.log(hr);
    debug.log(headers);
    debug.log(hr);
    debug.log('Request:');
    debug.log(hr);
    debug.log(JSON.parse(query));
    debug.log(hr);
  }

  // Return an observable to make the request.
  return new Observable<T>(sub => {
    const requestType = url.protocol === 'http:' ? http : https;
    const r = requestType.request({
      hostname: url.hostname,
      path: url.pathname,
      method: 'post',
      headers,
    });
    r.write(query);
    r.end();
    r.on('response', r => {
      r.on('error', e => logging === true && debug.log('err'));
      r.on('data', d => {
        const response = JSON.parse(d.toString());
        // Log debugging info if logging is enabled.
        if (logging === true) {
          debug.log('Response:');
          debug.log(hr);
          if ('errors' in response) debug.error(chalk.red(JSON.stringify(response['errors'], undefined, 2)));
          else debug.log(JSON.stringify(response['data'], undefined, 2));
          debug.log(hr);
        }

        if ('errors' in response) sub.error(response['errors']);
        else sub.next(response['data']);
        sub.complete();
      });
    });
  });
}
