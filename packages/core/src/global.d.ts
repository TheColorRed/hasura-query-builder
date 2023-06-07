interface HasuraFileReader {
  /**
   * List of cached files.
   */
  files: Map<string, string>;
  /**
   * Reads a file from disk or from a URL.
   * @param file The file to be read from disk or from a URL.
   */
  read(file: string | URL): Observable<string>;
}
interface CustomWindow extends Window {
  /**
   * @internal
   *
   * Makes a Hasura query or mutation.
   */
  hasuraHttpRequest<T = unknown>(body: QueryBody, options?: RequestOptions): Observable<T>;
  /**
   * @internal
   *
   * Starts a Hasura query subscription.
   */
  hasuraWsRequest<T = unknown>(body: QueryBody, options?: RequestOptions): Observable<{ id: string; data: T }>;
  /**
   * @internal
   *
   * Closes a Hasura subscription
   * @param id The subscription id.
   */
  hasuraWsClose(id: string): boolean;

  hasuraFileReader: HasuraFileReader;
}
declare let global: { window: CustomWindow };
