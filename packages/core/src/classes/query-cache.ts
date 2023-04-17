import { Observable } from 'rxjs';

export interface CacheData<T> {
  context: any;
  expiration: Date;
  data?: T;
}

export class QueryCache<T> {
  /**
   * The cached data.
   */
  private readonly cache: Map<string, CacheData<T>> = new Map();
  constructor(
    /** The maximum age of cached data in minutes. */
    private readonly maxAge: number = 30
  ) {}
  /**
   * Gets cached data.
   * @param key The key to get the cached data.
   * @example
   * const cache = new Cache();
   * cache.set('key1', 'value1');
   * cache.set('key2', 'value2');
   * cache.get('key1'); // 'value1'
   */
  get(key: string, fromObject = true) {
    const value = this.cache.get(key);
    // console.debug('Cache value', value);
    if (typeof value !== 'undefined') {
      // Convert array of arrays to object
      if (fromObject && Array.isArray(value.context)) {
        value.context = Object.fromEntries(value.context) as T;
      }
    }
    return value;
  }
  /**
   * Gets all cached data as an array.
   * @example
   * const cache = new Cache();
   * cache.set('key1', 'value1');
   * cache.set('key2', 'value2');
   * cache.toArray(); // [['key1', 'value1'], ['key2', 'value2']]
   */
  toArray(): [string, T][] {
    return [...this.cache].map(([key, value]) => [key, JSON.parse(value.context)]);
  }
  /**
   * Gets all cached keys.
   * @example
   * const cache = new Cache();
   * cache.set('key1', 'value1');
   * cache.set('key2', 'value2');
   * cache.keys(); // ['key1', 'key2']
   */
  keys(): string[] {
    return [...this.cache.keys()];
  }
  /**
   * Gets all cached values.
   * @example
   * const cache = new Cache();
   * cache.set('key1', 'value1');
   * cache.set('key2', 'value2');
   * cache.values(); // ['value1', 'value2']
   */
  values(): T[] {
    return [...this.cache.values()].map(i => i.context);
  }
  /**
   * Gets cached data or the default value if the cached data is not found.
   * @param key The key to get the cached data.
   * @param defaultValue The default value to return if the cached data is not found.
   * @param cacheOnDefault Whether to cache the default value if the cached data is not found. Defaults to true.
   * @example
   * const cache = new Cache();
   * cache.set('key1', 'value1');
   * cache.getOrDefault('key1', 'value2'); // 'value1'
   * cache.getOrDefault('key2', 'value2'); // 'value2'
   */
  getOrDefault(key: string, defaultValue: T) {
    if (!this.contains(key)) {
      this.set(key, defaultValue);
    }
    return this.get(key)!;
  }
  /**
   * Gets all cached data that starts with the prefix.
   * @param prefix The prefix to get the cached data.
   * @example
   * const cache = new Cache();
   * cache.set('key1', 'value1');
   * cache.set('key2', 'value2');
   * cache.set('test', 'value3');
   * cache.getByPrefix('key'); // ['value1', 'value2']
   */
  getByPrefix(prefix: string): T[] {
    const values: T[] = [];
    for (const [key, value] of this.cache) {
      if (key.startsWith(prefix)) {
        values.push(value.context);
      }
    }
    return values;
  }
  /**
   * Sets, adds, or updates the cached data by the key.
   * @param key The key to set the cached data.
   * @param value The value to set the cached data.
   * @example
   * const cache = new Cache();
   * cache.set('key1', 'value1');
   * cache.set('key2', 'value2');
   * cache.toArray(); // [['key1', 'value1'], ['key2', 'value2']]
   */
  set(key: string, value: T, sort = true): void {
    if (sort && typeof value === 'object' && value !== null && !Array.isArray(value)) {
      value = this.#sortObject(value, []) as T;
    }
    this.cache.set(key, { context: value, expiration: new Date(Date.now() + this.maxAge * 60000) });
  }
  /**
   * Creates a hash from the value and sets the value to the hash.
   * @param value The value to create a hash from.
   */
  createFromValue(value: T): Observable<{ key: string; value: CacheData<T> }> {
    return new Observable(subscriber => {
      if (typeof value === 'object' && value !== null) {
        value = this.#sortObject(value, []) as T;
      }
      crypto.subtle
        .digest('SHA-256', new TextEncoder().encode(JSON.stringify(value)))
        .then(hash => {
          return Array.from(new Uint8Array(hash))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
        })
        .then(hash => {
          if (this.contains(hash)) {
            const value = this.get(hash) as CacheData<T>;
            subscriber.next({ key: hash, value });
            subscriber.complete();
            return;
          }
          const data = this.getOrDefault(hash, value);
          subscriber.next({ key: hash, value: data });
          subscriber.complete();
        });
    });
  }
  /**
   * Fills the cache with the data.
   * @param data The data to fill the cache with.
   * @example
   * const cache = new Cache();
   * cache.fill([['key1', 'value1'], ['key2', 'value2']]);
   * cache.toArray(); // [['key1', 'value1'], ['key2', 'value2']]
   */
  fill(data: [string, T][], sort = true): void {
    this.clear();
    for (let [key, value] of data) {
      if (sort && typeof value === 'object' && value !== null) {
        value = this.#sortObject(value, []) as T;
      }
      this.set(key, value);
    }
  }
  /**
   * Checks if the cached data exists.
   * @param key The key to check if the cached data exists.
   * @example
   * const cache = new Cache();
   * cache.set('key1', 'value1');
   * cache.set('key2', 'value2');
   * cache.contains('key1'); // true
   * cache.contains('key3'); // false
   */
  contains(key: string): boolean {
    return this.cache.has(key);
  }
  /**
   * Deletes the cached data contained by the key.
   * @param key The key to delete the cached data.
   * @example
   * const cache = new Cache();
   * cache.set('key1', 'value1');
   * cache.set('key2', 'value2');
   * cache.delete('key1'); // Deletes the cached data contained by the key 'key1'.
   * cache.toArray(); // [['key2', 'value2']]
   */
  delete(key: string): void {
    this.cache.delete(key);
  }
  /**
   * Deletes all cached data.
   * @example
   * const cache = new Cache();
   * cache.set('key1', 'value1');
   * cache.set('key2', 'value2');
   * cache.toArray(); // [['key1', 'value1'], ['key2', 'value2']]
   * cache.clear(); // Deletes all cached data.
   * cache.toArray(); // []
   */
  clear(): void {
    this.cache.clear();
  }
  /**
   * Deletes the cached data contained by the value.
   * @param value The value to delete the cached data.
   * @example
   * const cache = new Cache();
   * cache.set('key1', 'value1');
   * cache.set('key2', 'value2');
   * cache.deleteByValue('value1'); // Deletes the cached data contained by the value 'value1'.
   * cache.toArray(); // [['key2', 'value2']]
   */
  deleteByValue(value: T): void {
    for (const [key, val] of this.cache) {
      if (val === value) {
        this.cache.delete(key);
      }
    }
  }
  /**
   * Deletes the cached data that starts with the prefix.
   * @param prefix The prefix to delete the cached data.
   * @example
   * const cache = new Cache();
   * cache.set('key1', 'value1');
   * cache.set('key2', 'value2');
   * cache.set('test', 'value3');
   * cache.deleteByPrefix('key'); // Deletes the cached data that starts with the prefix 'key'.
   * cache.toArray(); // [['test', 'value3']]
   */
  deleteByPrefix(prefix: string): void {
    for (const [key] of this.cache) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }
  /**
   * Checks to see if the cached data is expired based on the max age of the cache.
   * @param data The data to check if it is expired.
   */
  isExpired(data: CacheData<T>): boolean {
    return data.expiration.getTime() < Date.now();
  }
  /**
   * Updates the cache data that is returned from the query.
   * @param cache The cache that will be updated.
   * @param data The new query response data.
   */
  updateData(cache: CacheData<T>, data: T): void {
    cache.data = data;
  }
  /**
   * Updates the expiration of the cache data.
   * @param cache The cache that will be updated.
   */
  updateExpiration(cache: CacheData<T>): void {
    cache.expiration = new Date(Date.now() + this.maxAge * 60000);
  }
  /**
   * Sorts the object by the keys so the keys are always in the same order.
   */
  #sortObject(obj: { [key: string]: any }, result: [string, T][]): [string, T][] {
    const keys = Object.keys(obj).sort();
    for (const key of keys) {
      const value = obj[key];
      if (typeof value === 'object' && value !== null) {
        this.#sortObject(value, result);
      } else {
        result.push([key, value as T]);
      }
    }
    return result;
  }
}
