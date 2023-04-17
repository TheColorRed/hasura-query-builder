import type { OutgoingHttpHeaders } from 'http';
/**
 * The connection information for a single connection.
 */
export interface ConnectionInfo {
  /**
   * The url endpoint to connect to.
   */
  url: URL;
  /**
   * Optional headers to send with each request.
   */
  headers?: OutgoingHttpHeaders;
}
/**
 * An object containing the default connection and a list of all other connections.
 */
export interface ConnectionsInformation {
  /**
   * The default connection. This is the connection that will be used if no connection is specified.
   */
  default: ConnectionInfo | URL;
  /**
   * A list of connections. The key is the name of the connection to use when specifying a connection.
   */
  [key: string]: ConnectionInfo | URL;
}
/**
 * The configuration for the connections.
 */
export interface ConnectionConfiguration {
  /**
   * The default connection and a list of all other connections.
   */
  connections: ConnectionsInformation;
  /**
   * The network settings for how the connections should behave.
   */
  settings?: NetworkSettings;
}

export interface NetworkSettings {
  /**
   * Whether or not to log the network request and response information.
   */
  logging?: boolean;
}

export class Connections {
  /** An instance of the singleton connection class. */
  static instance: Connections;
  /** The list of configurations. */
  private readonly connections: Map<string, URL | ConnectionInfo>;
  private readonly settings: NetworkSettings;
  /**
   * @internal
   * DO NOT USE: Used to create a singleton instance.
   * @example
   * Connections.create({ default: new URL('/v1/graphql', 'https://my-database.com') });
   * @param configuration The configuration.
   */
  private constructor(configuration: ConnectionConfiguration) {
    const result = Object.entries(configuration.connections).reduce<[string, URL | ConnectionInfo][]>(
      (acc, [key, val]) => acc.concat([[key, val]]),
      []
    );
    this.connections = new Map<string, URL | ConnectionInfo>(result);
    this.settings = { logging: false, ...(configuration.settings ?? {}) };
  }
  /**
   * Creates a configuration with the endpoints that can be used to make requests.
   * * `default` is required. This is the default connection to use if one hasn't been provided.
   * @example
   * Connections.create({
   *   connections: {
   *     default: new URL('/v1/graphql', 'https://my-database.com'),
   *     other: new URL('/v1/graphql', 'https://my-other-database.com'),
   *   },
   *   settings: {
   *     logging: true
   *   }
   * });
   *
   * export class Users extends Model {
   *   connection = 'other'
   * }
   * @param config The configuration.
   */
  static create(config: ConnectionConfiguration) {
    if (typeof this.instance !== 'undefined') {
      throw new Error('The connections have already been defined.');
    } else {
      this.instance = new Connections(config);
    }
  }
  /**
   * Adds or updates a connection.
   * @param key The key to add or update.
   * @param endpoint The endpoint or connection info.
   */
  static set(key: string, endpoint: ConnectionInfo) {
    if (typeof this.instance === 'undefined') {
      throw new Error(
        'A connection has not been created. Use `Connections.create()` before adding additional connections.'
      );
    }
    this.instance.connections.set(key, endpoint);
  }
  /**
   * Gets a connection from list of connections.
   * @param connectionId The connection key.
   */
  static get(connectionId: string) {
    return Connections.instance.connections.get(connectionId);
  }
  static setting<T extends keyof NetworkSettings>(name: T): NetworkSettings[T] {
    return Connections.instance.settings[name];
  }
  /**
   * Checks if a connection exists.
   * @param connectionId The connection key.
   */
  static has(connectionId: string) {
    return Connections.instance.connections.has(connectionId);
  }
  /**
   * Deletes a connection.
   * @param connectionId The connection key.
   */
  static delete(connectionId: string) {
    return Connections.instance.connections.delete(connectionId);
  }
}
