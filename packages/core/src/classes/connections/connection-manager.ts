import { QueryBody } from '../structures/structure';
import { ConnectionInfo, Connections } from './connections';

export interface InfoResponse<H = { [key: string]: string }> {
  headers: H;
  url: URL;
  query: string;
  connection: ConnectionInfo | URL;
}

export class ConnectionManager {
  static getRequestInformation<H = { [key: string]: string }>(
    body: QueryBody,
    requestType: 'http' | 'socket' = 'http'
  ): InfoResponse<H> {
    // Check to make sure that the connections were setup.
    if (typeof Connections.instance === 'undefined')
      throw new Error('There are no connections setup. Use `Connections.create()` before making a query.');

    // Get the hasura query for the request.
    const query = JSON.stringify(body);

    // Get the url from a connection name.
    const connectionName = body.connection ?? 'default';
    const connection = Connections.get(connectionName);
    if (typeof connection === 'undefined') throw new Error(`Could not find the connection "${connectionName}"`);
    let url = connection instanceof URL ? connection : 'url' in connection ? connection.url : undefined;
    if (typeof url === 'undefined') throw new Error(`Could not construct a valid url.`);
    if (requestType === 'socket') url = new URL(url.toString().replace(/^http(s)?/, 'ws$1'));

    const isWindow =
      (typeof global !== 'undefined' && typeof global.window !== 'undefined') || typeof window !== 'undefined';
    const headers = (
      isWindow && requestType === 'http'
        ? this.getBrowserHeaders(connection, query)
        : this.getHeaders(connection, query)
    ) as H;

    return { query, connection, url, headers };
  }
  /**
   * Gets the header information
   * @param connection The connection for getting the headers
   * @param query The query information.
   */
  private static getHeaders(connection: URL | ConnectionInfo, query: string) {
    const globalHeaders = Connections.instance.headers ?? {};
    const userHeaders = ('headers' in connection ? connection.headers : {}) ?? {};
    const baseHeaders = {
      'content-length': query.length,
      'content-type': 'application/json; charset=utf-8',
    };
    const headers = Object.assign({}, globalHeaders, userHeaders, baseHeaders);
    // Remove undefined headers.
    Object.keys(headers).forEach(key => typeof headers[key] === 'undefined' && delete headers[key]);
    return headers;
  }
  /**
   * Get the header information for a browser request.
   * @param connection
   * @param query
   */
  private static getBrowserHeaders(connection: URL | ConnectionInfo, query: string) {
    const headers: { [key: string]: string } = {};
    Object.entries(this.getHeaders(connection, query)).forEach(([key, val]) => {
      headers[key] = val?.toString() ?? '';
    });
    return headers;
  }
}
