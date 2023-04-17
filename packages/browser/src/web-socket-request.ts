import { ConnectionManager, QueryBody } from '@hasura-query-builder/core';
import { EMPTY, Observable, of, switchMap } from 'rxjs';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';

// declare let window: CustomWindow;
/** A message from Hasura to keep the connection alive. */
interface HasuraWebSocketKeepAlive {
  type: 'ka';
}
/** A message from Hasura saying the the request is complete. */
interface HasuraWebSocketComplete {
  id: string;
  type: 'complete' | 'stop';
}
/** A message from Hasura with the data that was requested. */
interface HasuraWebSocketData<T> {
  id: string;
  payload: { data: T };
  type: 'data';
}
/** A message to Hasura to initialize a connection. The first message sent. */
interface HasuraWebSocketInit {
  payload: { headers: object; lazy: boolean };
  type: 'connection_init';
}
interface HasuraWebSocketAccepted {
  type: 'connection_ack';
}
/** The query to watch for changes with. Executed after the init as the second message. */
interface HasuraWebSocketQuery {
  id: string;
  payload: { connection: string; query: string; variables: object };
  type: 'start';
}

export type SocketMessages<T> =
  | HasuraWebSocketInit
  | HasuraWebSocketAccepted
  | HasuraWebSocketQuery
  | HasuraWebSocketData<T>
  | HasuraWebSocketComplete;
const sockets: Map<string, WebSocketSubject<SocketMessages<any>>> = new Map();

global.window.hasuraWsRequest = <T = unknown>(body: QueryBody): Observable<{ id: string; data: T }> => {
  const { query, url, headers } = ConnectionManager.getRequestInformation<{ [key: string]: string }>(body, 'socket');
  const subject = webSocket({
    url: url.toString(),
    protocol: ['Sec-WebSocket-Protocol', 'graphql-ws'],
  }) as WebSocketSubject<SocketMessages<T>>;

  const id = crypto.randomUUID();
  sockets.set(id, subject);

  const dataResponse = subject.multiplex(
    () => {
      delete headers['content-length'];
      return {
        payload: { headers, lazy: true },
        type: 'connection_init',
      };
    },
    () => ({ id, type: 'stop' }),
    data => (data.type === 'data' && data.id === id) || data.type === 'connection_ack'
  );

  return dataResponse.pipe(
    switchMap(response => {
      if (response.type === 'data') {
        return of({ id, data: response.payload.data });
      } else if (response.type === 'connection_ack') {
        subject.next({ id, payload: JSON.parse(query), type: 'start' });
      }
      return EMPTY;
    })
  );
};
/**
 * Closes a subscription
 * @param id The subscription id.
 */
global.window.hasuraWsClose = (id: string) => {
  const subject = sockets.get(id);
  if (typeof subject === 'undefined') return false;

  subject.next({ id, type: 'stop' });
  subject.complete();

  return sockets.delete(id);
};
