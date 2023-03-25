import { EMPTY, Observable, of } from 'rxjs';
import { concatMap, expand, map, skip, switchMap, takeWhile, tap } from 'rxjs/operators';
import { customFields } from '../functions/custom-fields';
import { PrimaryKeyValue } from '../interfaces/api';
import { BaseModel, Fields, FieldsResult, Newable } from './base-model';
import { BuildOptions, QueryBody } from './structures/structure';
import { SubscriptionRef } from './subscription-ref';
import { Table } from './table';

export interface CustomWindow extends Window {
  /**
   * @internal
   *
   * Makes a Hasura query or mutation.
   */
  hasuraHttpRequest<T = unknown>(body: QueryBody): Observable<T>;
  /**
   * @internal
   *
   * Starts a Hasura query subscription.
   */
  hasuraWsRequest<T = unknown>(body: QueryBody): Observable<{ id: string; data: T }>;
  /**
   * @internal
   *
   * Closes a Hasura subscription
   * @param id The subscription id.
   */
  hasuraWsClose(id: string): boolean;
}
export declare let global: { window: CustomWindow };

export interface InsertConflict {
  /** The name of the primary or unique key that this applies to. */
  constraint: string;
  /** A list of fields that will be updated if the constraint has a conflict. */
  fields: string[];
}

// export abstract class Model<
//   T extends InstanceType<typeof BaseModel> = InstanceType<typeof BaseModel>,
//   K extends Fields<T> = Fields<T>
// > extends BaseModel {
export abstract class Model extends BaseModel {
  isSubscription = false;

  // constructor(fields: { [P in keyof Partial<K>]: K[P] }) {
  //   super();
  // }

  set<K extends Fields<this>>(fields: { [P in keyof Partial<K>]: K[P] } | { [P in keyof Partial<K>]: K[P] }[]) {
    if (!Array.isArray(fields)) fields = [fields];
    return this;
  }

  private request<T = Fields<this>, U = Observable<T> | Observable<{ id: string; data: T }>>(
    body: QueryBody
  ): U | typeof EMPTY {
    if (typeof global.window !== 'undefined') {
      if (!this.isSubscription && typeof global.window.hasuraHttpRequest === 'function') {
        return global.window.hasuraHttpRequest(body) as any;
      } else if (this.isSubscription && typeof global.window.hasuraWsRequest === 'function') {
        return global.window.hasuraWsRequest(body) as any;
      }
    }
    return EMPTY;
  }

  /**
   * Uses a connection setup through the `Connections` class other than the default.
   * @param name The name of the connection to use.
   * @example
   * Connections.create({
   *   connections: {
   *     default: {
   *       url: new URL('https://example.app/v1/graphql')
   *     },
   *     second: {
   *       url: new URL('https://another-example.app/v1/graphql')
   *     },
   *   },
   * });
   *
   * Users.connection('second').all().get();
   */
  static connection<T extends Model>(this: Newable<T>, name: string) {
    const model = new this();
    model.connection = name;
    return {
      find: (...primary: [PrimaryKeyValue, ...PrimaryKeyValue[]]) => BaseModel._find(model, ...primary),
      all: () => BaseModel._all(model),
      insert: (fields: any) => BaseModel._insert(model, fields),
      update: (fields: any) => BaseModel._update(model, fields),
    };
  }
  /** The name of the table that this model relates to. */
  abstract override readonly table: string;
  /** Fields that are in the database table. */
  abstract override readonly fields: Fields<any>;
  /**
   * Retrieve a record from the table by its primary key.
   * @param primary The primary key. This can be a single value or a compound value.
   * @example
   * Users.find(1).first().subscribe();
   */
  static find<T extends Model>(this: Newable<T>, ...primary: [PrimaryKeyValue, ...PrimaryKeyValue[]]): T {
    const model = new this();
    return BaseModel._find(model, ...primary);
  }
  /**
   * Retrieve all the records from the table.
   *
   * * Use `Model#get()` to get all the results in one request.
   * * Use `Model#first()` to get the first result.
   * * Use `Model#chunk()` to get results in smaller result sets.
   * * **Note:** The number of results may be limited by the table permissions.
   * @example
   * Users.all().get().subscribe();
   * Users.all().first().subscribe();
   * Users.all().chunk(10).subscribe();
   */
  static all<T extends Model>(this: Newable<T>): T {
    const model = new this();
    return BaseModel._all(model);
  }
  /**
   * Inserts items into the table using the model.
   *
   * A few things to note:
   * * `save()` must be called to make the request to Hasura to insert the items.
   * * All query statements are ignored such as `where`, `limit`, `offset`, `order by`, `distinct`, etc.
   *
   * @param records Inserts items into the table.
   * @example
   * // Insert a single record where the first name is 'John'.
   * Users.insert({ firstName: 'John' }).save().subscribe();
   *
   * // Insert two records where one record has a first name of 'John' and the other has a first name of 'Jane'.
   * Users.insert([{ firstName: 'John' }, { firstName: 'Jane' }]).save().subscribe();
   */
  static insert<T extends Model, K extends keyof Fields<T>>(
    this: Newable<T>,
    records: { [P in K]: Fields<BaseModel>[P] } | { [P in K]: Fields<BaseModel>[P] }[],
    onConflict?: InsertConflict
  ): T {
    const model = new this();
    return BaseModel._insert(model, records, onConflict) as T;
  }
  /**
   * Updates items in the table using the model.
   *
   * A few things to note:
   * * `save()` must be called to make the request to Hasura to update the items.
   * * All query statements are ignored except for `where`.
   *
   * **Note:** `save()` must be called to make the request to Hasura to update the items.
   * @param values The new values that will be set if the record exists.
   * @example
   * // Update all records where if the users last name is 'Doe', then set the first name to 'John'.
   * Users.update({ firstName: 'John' }).where('lastName', 'Doe').save().subscribe();
   */
  static update<T extends Model, K extends Fields<T>>(this: Newable<T>, values: { [P in keyof Partial<K>]: K[P] }): T {
    const model = new this();
    return BaseModel._update(model, values);
  }
  /**
   * Deletes items from the table using the model.
   *
   * A few things to note:
   * * `save()` must be called to make the request to Hasura to delete the items.
   * * All query statements are ignored except for `where`.
   *
   * **Note:** `save()` must be called to make the request to Hasura to delete the items.
   * @example
   * // Delete all records where the users first name is 'John'.
   * Users.delete().where('firstName', 'John').save().subscribe();
   */
  static delete<T extends Model>(this: Newable<T>): T {
    const model = new this();
    return BaseModel._delete(model);
  }
  /**
   * Builds the query and makes the request.
   * @param builder The builder to use to create the query. Defaults to `this`.
   */
  makeRequest<T extends FieldsResult<this>>(builder?: Table, options?: BuildOptions) {
    const body = typeof builder === 'undefined' ? this.build(options) : this.build(builder, options);
    return this.request<T>(body);
  }
  /**
   * Emits all the results as an array of items.
   * @example
   * // Get a user by their primary key.
   * Users.find(123).get().pipe(tap(console.log)).subscribe();
   *
   * // Gets all the users (may be limited by the table permissions).
   * Users.all().get().pipe(tap(console.log)).subscribe();
   */
  get() {
    const unique = typeof this.builder.primaryKey !== 'undefined' ? '_by_pk' : '';
    const table = this.builder.alias.length > 0 ? this.builder.alias : `${this.table}${unique}`;
    return (this.makeRequest() as Observable<FieldsResult<this>>).pipe(
      map((val: any): FieldsResult<this>[] => {
        return Array.isArray(val[table]) ? val[table] : [val[table]];
      }),
      customFields(this.builder, this.attributes)
    ) as Observable<FieldsResult<this>[]>;
  }
  /**
   * Emits the results as a stream of items. This is the same as `Model#get()` but emits each item one at a time.
   *
   * @example
   * // Performs a Model#get() and emits each item one at a time.
   * Users.all().stream().pipe(tap(console.log)).subscribe();
   */
  stream() {
    return this.get().pipe(switchMap(item => item as FieldsResult<this>[]));
  }
  /**
   * A quick way to grab fields from the database.
   * @param fields The fields to grab from the database.
   * @example
   * // Get the first and last name of all users.
   * Users.all().pluck('first', 'last').get().pipe(tap(console.log)).subscribe();
   *
   * // Similar to this:
   * Users.all().select('first', 'last').get().pipe(tap(console.log)).subscribe();
   */
  pluck<K extends keyof Fields<this>>(...fields: K[]) {
    const { clone, table } = this.#clone(this.builder);
    clone.select(...(fields as string[]));
    return (this.makeRequest(clone) as Observable<FieldsResult<this>>).pipe(
      map(response => response[table]),
      customFields(clone, this.attributes)
    );
  }
  /**
   * Emits the first found item from the database.
   * This is an optimized version of `Model#get()` that only returns the first item. It also returns an object instead of an array.
   *
   * @example
   * // ❌ This is how `Model#all()` would be implemented to do the same thing as `Model#first()`.
   * Users.all().limit(1).get().pipe(map(items => items[0]), tap(console.log)).subscribe();
   *
   * // ✅ Get the first user.
   * Users.all().first().pipe(tap(console.log)).subscribe();
   *
   * // ✅ Get a user with a primary key of 1.
   * Users.find(1).first().pipe(tap(console.log)).subscribe();
   */
  first() {
    const clone = this.builder.clone();
    if (typeof this.builder.primaryKey === 'undefined') clone.limit(1);
    const unique = typeof clone.primaryKey !== 'undefined' ? '_by_pk' : '';
    const table = clone.alias.length > 0 ? clone.alias : `${this.table}${unique}`;
    return (this.makeRequest(clone) as Observable<FieldsResult<this>>).pipe(
      map((result: any) => {
        // map((result: any): { [P in keyof K]: K[P] } => {
        const data = result[table];
        return Array.isArray(data) ? data[0] ?? {} : data;
      }),
      customFields(clone, this.attributes)
    ) as Observable<FieldsResult<this>>;
  }
  /**
   * Gets the value of the first found row for a particular field.
   * @param field The field to get the value for.
   * @example
   * // Get the first name of the first user.
   * // Example Output: 'Sally'
   * Users.all().value('first').subscribe();
   *
   * // This way would return an object with the first name as a property.
   * // Example Output: { first: 'Sally' }
   * Users.all().select('first').first().pipe(tap(console.log)).subscribe();
   */
  value<K extends keyof Fields<this>>(field: K) {
    const { clone, table } = this.#clone(this.builder);
    clone.select(field as string);
    clone.limit(1);
    return (this.makeRequest(clone) as Observable<FieldsResult<this>>).pipe(
      map(response => response?.[table]?.[0]?.[field])
    );
  }
  /**
   * Gets the values of a particular field for each found row. Emits each value one at a time to the observable.
   * @param field The field to get the values for.
   * @example
   * // Get the first names of all users.
   * // Example Output: 'Sally', 'Bob', 'Jane'
   * Users.all().values('first').pipe(tap(console.log)).subscribe();
   */
  values<K extends keyof Fields<this>>(field: K) {
    const { clone, table } = this.#clone(this.builder);
    clone.select(field as string);
    return (this.makeRequest(clone) as Observable<FieldsResult<this>>).pipe(
      map(response => response?.[table]?.map((item: FieldsResult<this>) => item[field])),
      switchMap(items => items)
    );
  }
  /**
   * Gets a count of the number of items that match the query.
   * @example
   * // Get the number of users.
   * Users.all().count().pipe(tap(console.log)).subscribe();
   */
  count() {
    const { clone, table } = this.#clone(this.builder, `${this.table}_aggregate`);
    clone.select(`aggregate{count}`);
    type Count = Observable<{ [key: string]: { aggregate: { count: number } } }>;
    return (this.makeRequest(clone) as Count).pipe(map(response => response[table].aggregate.count));
  }
  /**
   * Gets the max value of one or more fields for each field.
   * @param fields The fields to get the max value of.
   * @example
   * // Get the max age of all users.
   * // Example Output: 65
   * Users.all().max('age').pipe(tap(console.log)).subscribe();
   */
  max<K extends keyof Fields<this>>(...fields: K[]) {
    const { clone, table } = this.#clone(this.builder, `${this.table}_aggregate`);
    clone.select(`aggregate{max{${fields.join(',')}}}`);
    type Max = Observable<{ [key: string]: { aggregate: { max: { [key: string]: any } } } }>;
    return (this.makeRequest(clone) as Max).pipe(map(response => response[table].aggregate.max));
  }
  /**
   * Gets the min value of one or more fields for each field.
   * @param fields The fields to get the min value of.
   * @example
   * // Get the min age of all users.
   * // Example Output: 18
   * Users.all().min('age').pipe(tap(console.log)).subscribe();
   */
  min<K extends keyof Fields<this>>(...fields: K[]) {
    const { clone, table } = this.#clone(this.builder, `${this.table}_aggregate`);
    clone.select(`aggregate{min{${fields.join(',')}}}`);
    type Min = Observable<{ [key: string]: { aggregate: { min: { [key: string]: any } } } }>;
    return (this.makeRequest(clone) as Min).pipe(map(response => response[table].aggregate.min));
  }
  /**
   * Gets the sum value of one or more fields for each field.
   * @param fields The fields to get the sum value of (numeric fields only).
   * @example
   * // Get the sum of all user ages.
   * // Example Output: 30
   * Users.all().sum('age').pipe(tap(console.log)).subscribe();
   */
  sum<K extends keyof Fields<this>>(...fields: K[]) {
    const { clone, table } = this.#clone(this.builder, `${this.table}_aggregate`);
    clone.select(`aggregate{sum{${fields.join(',')}}}`);
    type Sum = Observable<{ [key: string]: { aggregate: { sum: { [key: string]: any } } } }>;
    return (this.makeRequest(clone) as Sum).pipe(map(response => response[table].aggregate.sum));
  }
  /**
   * Gets the average value of one or more fields for each field.
   * @param fields The fields to get the average value of (numeric fields only).
   * @example
   * // Get the average age of all users.
   * // Example Output: 30
   * Users.all().avg('age').subscribe();
   */
  avg<K extends keyof Fields<this>>(...fields: K[]) {
    const { clone, table } = this.#clone(this.builder, `${this.table}_aggregate`);
    clone.select(`aggregate{avg{${fields.join(',')}}}`);
    type Avg = Observable<{ [key: string]: { aggregate: { avg: { [key: string]: any } } } }>;
    return (this.makeRequest(clone) as Avg).pipe(map(response => response[table].aggregate.avg));
  }
  /**
   * Checks to see if an item exists in the database.
   * @example
   * // Check to see if a user exists.
   * Users.all().where('id', 1).exists().pipe(
   *   filter(exists => exists),
   *   tap(() => console.log('User exists!'))
   * ).subscribe();
   */
  exists() {
    return this.count().pipe(map(count => count > 0));
  }
  /**
   * Checks to see if an item does not exists in the database.
   * @example
   * // Check to see if a user does not exist.
   * Users.all().where('id', 1).doesntExist().pipe(
   *   filter(doesntExist => doesntExist),
   *   tap(() => console.log('User does not exist!'))
   * ).subscribe();
   */
  doesntExist() {
    return this.exists().pipe(map(exists => !exists));
  }
  /**
   * Makes multiple http requests if needed until all results are returned.
   * This is useful if you attempt to load hundreds of thousands of records that could cause network or memory issues when using `Model#get()`.
   * @param size The maximum number of items to return.
   * @example
   * // Get all users, but only 100 at a time.
   * // Example Output: [{first: 'John'}, {first: 'Jane'}, ...], [{first: 'Billy'}, {first: 'Sally'}, ...], ...
   * Users.all().select('first').chunk(100).pipe(
   *   tap(users => console.log(users))
   * ).subscribe();
   */
  chunk(size: number) {
    // Clone the current builder and make changes on the clone.
    const clone = this.builder.clone();
    const table = clone.alias.length > 0 ? clone.alias : clone.table;
    clone.limit(size, 0);

    return of({ results: {}, body: {}, offset: 0 }).pipe(
      expand(params =>
        of(params).pipe(
          map(() => {
            // Update the clone offset.
            clone.offset(params.offset);
            // Build the query and create a new offset to be passed back to expand.
            return { offset: params.offset + size };
          }),
          // Make the query and add the results to the previous params that were set in expand.
          concatMap(result =>
            (this.makeRequest(clone) as Observable<any>).pipe(map(results => ({ ...result, result: results })))
          )
        )
      ),
      // The first emitted item of expand will fail, so skip it.
      skip(1),
      // Take items until the result set is less than the size.
      takeWhile(results => results.result[table].length === size, true),
      map(results => results.result[table]),
      customFields(clone, this.attributes)
    );
  }
  /**
   * Makes multiple http requests if needed until all results are returned and emits each row one at a time.
   *
   * @param size The number of items per chunk.
   *
   * @see {@link chunk()}
   * @example
   * // Chunk all users into groups of 100 and emit each user one at a time.
   * // Example Output: {first: 'John'}, {first: 'Jane'}, {first: 'Billy'}, {first: 'Sally'}, ...
   * Users.all().select('first').lazy(100).pipe(
   *   tap(user => console.log(user))
   * ).subscribe();
   */
  lazy(size: number = 100) {
    return this.chunk(size).pipe(switchMap(items => items as FieldsResult<this>[]));
  }
  /**
   * Creates a database subscription and watches for changes.
   * @example
   * // Watch for changes to all users.
   * Users.all().select('first').watch().pipe(
   *   tap(users => console.log(users))
   * ).subscribe();
   */
  watch() {
    this.isSubscription = true;
    const ref = new SubscriptionRef<this>(this, this.builder);
    type SubFields = FieldsResult<this>;
    (this.makeRequest(ref.clone, { type: 'subscription' }) as Observable<{ id: string; data: SubFields }>)
      .pipe(
        tap(data => {
          if (typeof ref.id === 'undefined') ref.id = data.id;
        }),
        tap(data => ref.next(data.data))
      )
      .subscribe();
    return ref;
  }
  /**
   * Saves the data and gets the results. This will only return the fields that were affected by the insert, update, or delete.
   */
  save<K extends keyof Fields<this>>() {
    const table = this.builder.alias.length > 0 ? this.builder.alias : `${this.buildType}_${this.table}`;
    return (this.makeRequest() as Observable<FieldsResult<this>>).pipe(
      map((val: any): { [P in keyof K]: K[P] }[] => {
        return Array.isArray(val[table].returning) ? val[table].returning : [val[table].returning];
      })
    );
  }

  #clone(table: Table, name?: string) {
    const tableName = typeof name === 'undefined' ? table.table : name;
    const clone = table.clone(tableName);
    const tblName = clone.alias.length > 0 ? clone.alias : tableName;
    clone.alias = tblName;
    return { clone, table: tblName };
  }
}
