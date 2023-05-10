import { InsertConflict } from './model';
import { QueryBuilder } from './query-builder';
import { InsertObjects } from './structures/sections/objects-insert';
import { UpdateObjects } from './structures/sections/objects-update';
import { OnConflict } from './structures/sections/on-conflict';
import { Direction, SortFields } from './structures/sections/order';
import { CompoundPrimaryKeyKeyValues, CompoundPrimaryKeyNames, PrimaryKeyValue } from './structures/sections/primary';
import { WhereGroup } from './structures/sections/where';
import { BuildOptions, HasuraWhere, HasuraWhereComparison, QueryBody, QueryOptions } from './structures/structure';
import { Table } from './table';

/**
 * The fields that describe the Model.
 */
export type Fields<T extends BaseModel> = {
  [K in keyof T['fields']]: T['fields'][K] extends BaseModel ? Fields<T['fields'][K]> : T['fields'][K];
};
/**
 * The dynamically created fields for the Model.
 */
export type Attributes<T extends BaseModel> = { [K in keyof T['attributes']]: T['attributes'][K] };
/**
 * A database row that is described by combining the fields and attributes.
 */
export type FieldsResult<T extends BaseModel = BaseModel, U = Fields<T> & Attributes<T>> = {
  [P in keyof U]: U[P];
};
export type AttributesType<A extends BaseModel, B = any> = { [key: string]: <T extends FieldsResult<A>>(row: T) => B };
/**
 * An object that can be instantiated with the `new` keyword.
 */
export type Newable<T> = new (...args: any[]) => T;
export type ValueOf<T> = T[keyof T];

/**
 * The type of query to be executed.
 * * `select` &ndash; Selects items from a database table.
 * * `insert` &ndash; Inserts items into a database table.
 * * `update` &ndash; Updates items in a database table.
 * * `delete` &ndash; Deletes items from a database table.
 * * `upsert` &ndash; Inserts items into a database table, a conflict will result in an update.
 */
export type BuildType = 'select' | 'insert' | 'update' | 'delete' | 'upsert';

export interface BaseModel {
  /**
   * The primary key for the table.
   * This can either be a single column (string) or a compound column (array of strings).
   */
  primary?: CompoundPrimaryKeyNames;
  /** The connection identifier. */
  connection?: string | 'default';
  /** Selects parent models. */
  expand?: Newable<BaseModel> | BaseModel | Table;
  /**
   * Fields that are generated at runtime for the model.
   *
   * **Note:** These fields cannot be used at the database level.
   */
  attributes?: AttributesType<this>;
}
export abstract class BaseModel {
  /** The name of the table that this model relates to. */
  abstract readonly table: string;
  /** The fields that are within the table. */
  abstract readonly fields: Fields<any>;
  /** The builder that the model is working with. */
  protected builder!: Table;
  /** The build type. */
  private _buildType: BuildType = 'select';
  records?: InsertObjects | UpdateObjects;
  conflict?: OnConflict;
  queryOptions?: QueryOptions;
  /** The type of build (`select`, `insert`, `update`, `delete`, `upsert`). */
  get buildType() {
    return this._buildType;
  }
  /** Whether or not this is a query (`select`). */
  get isQuery() {
    return this.buildType === 'select';
  }
  /** Whether or not this is a mutation (`insert`, `update`, `delete`, `upsert`). */
  get isMutation() {
    return this.buildType !== 'select';
  }
  /**
   * @internal
   * Finds a record by primary key.
   * @param model The model to use.
   * @param primary The primary key values.
   */
  protected static _find<T extends BaseModel>(model: T, ...primary: PrimaryKeyValue[]) {
    if (typeof model.primary === 'undefined') throw Error(`No primary key set on model "${model.table}"`);
    if (primary.length !== model.primary.length)
      throw Error(`Key/Value count miss-match on model "${model.constructor.name}"`);

    const fields = typeof model.primary === 'string' ? [model.primary] : model.primary;
    const map = fields.reduce<CompoundPrimaryKeyKeyValues>((acc, val, idx) => {
      acc[val] = primary[idx] as string | number;
      return acc;
    }, {});
    model.builder = new Table(`${model.table}_by_pk`).primary(map);
    model.builder.model = model;
    return model;
  }
  /**
   * @internal
   * An empty table blueprint for all records.
   * @param model The model to use.
   */
  protected static _all<T extends BaseModel>(model: T) {
    model.builder = new Table(model.table);
    model.builder.model = model;
    return model;
  }
  /**
   * @internal
   * An empty table blueprint for a single record.
   */
  protected static _first<T extends BaseModel>(model: T, field: string, value: any) {
    model.builder = new Table(model.table).where({ [field]: { _eq: value } }).limit(1);
    model.builder.model = model;
    return model;
  }
  /**
   * @internal
   * An empty table blueprint for inserting one or more records.
   *
   * A few things to note:
   * * `save()` must be called to execute the query.
   * * All query statement types are ignored such as `where`, `limit`, `offset`, etc.
   *
   * @param model The model to use.
   * @param records The records to insert.
   * @param onConflict The conflict to handle.
   */
  protected static _insert<T extends BaseModel, K extends Fields<T>>(
    model: T,
    records: { [P in keyof Partial<K>]: Fields<T>[P] } | { [P in keyof Partial<K>]: Fields<T>[P] }[],
    onConflict?: InsertConflict
  ) {
    model.builder = new Table(model.table);
    model._buildType = 'insert';
    model.builder.model = model;
    model.records = new InsertObjects(Array.isArray(records) ? records : [records]);
    model.conflict =
      typeof onConflict !== 'undefined' ? new OnConflict(onConflict.constraint, onConflict.fields) : undefined;
    return model;
  }
  /**
   * @internal
   * An empty table blueprint for updating records.
   *
   * A few things to note:
   * * `save()` must be called to execute the query.
   * * All query statement types except for `where` is ignored.
   *
   * @param model The model to use.
   * @param records The records to update.
   */
  protected static _update<T extends BaseModel, K extends Fields<T>>(
    model: T,
    records: { [P in keyof Partial<K>]: K[P] }
  ) {
    model.builder = new Table(model.table);
    model._buildType = 'update';
    model.builder.model = model;
    model.records = new UpdateObjects(records);
    return model;
  }
  /**
   * @internal
   * An empty table blueprint for deleting records.
   *
   * A few things to note:
   * * `save()` must be called to execute the query.
   * * All query statement types except for `where` is ignored.
   *
   * @param model The model to use.
   */
  protected static _delete<T extends BaseModel>(model: T) {
    model.builder = new Table(model.table);
    model._buildType = 'delete';
    model.builder.model = model;
    return model;
  }
  /**
   * Gets the builder.
   */
  getBuilder() {
    return this.builder;
  }
  /**
   * @internal
   * Builds a query using the current model.
   * @param builder The table to build.
   * @param options The options for the builder.
   */
  build(builder: Table, options?: BuildOptions): QueryBody;
  /**
   * @internal
   * Builds a query using the current model.
   * @param options The options for the builder.
   */
  build(options?: BuildOptions): QueryBody;
  build(...args: [Table, object?] | [object?]) {
    const builder = args[0] instanceof Table ? args[0] : this.builder;
    builder.setBuildOptions({ ...(args[0] instanceof Table ? args[1] : args[0]) });
    if (builder.selects.length === 0 || typeof builder.selects === 'undefined') {
      builder.select(...this.getFields());
    }
    return new QueryBuilder({ tables: builder, type: this._buildType, queryOptions: this.queryOptions }).build();
  }

  /**
   * Where a field successfully compares against a value.
   * @param field The field to compare.
   * @param key The comparison operator to use.
   * @param value The value that the field should evaluate with.
   */
  where<K extends keyof Fields<this>>(field: K, key: '_is_null', value: boolean): this;
  where<K extends keyof Fields<this>>(field: K, key: keyof HasuraWhereComparison, value: Fields<this>[K]): this;
  /**
   * Where a field is equal to a value.
   *
   * Shorthand for `qb.where('x', '_eq', 'y')`
   * @param field The field to compare.
   * @param value The value that the field should be.
   */
  where<K extends keyof Fields<this>>(field: K, value: Fields<this>[K]): this;
  /**
   * Where fields compare against a value.
   * @param fields The comparisons.
   */
  where(fields: HasuraWhere): this;
  where<T extends this>(...args: [T, string, any] | [T, any] | [HasuraWhere]) {
    this.builder.where(...(args as [HasuraWhere]));
    return this;
  }
  /**
   * Creates grouped `or` clause for a where statement.
   * @example
   * Users.all()
   *   .or(builder => builder.where('first', 'Bill').where('first', 'Sue'))
   * // Result:
   * // _or: [{ first: { _eq: 'Bill' } }, { first: { _eq: 'Sue' } }]
   * @param builder The callback for the group.
   */
  or(builder: WhereGroup) {
    this.builder.or(builder);
    return this;
  }
  /**
   * Creates grouped `and` clause for a where statement.
   * @example
   * Users.all()
   *   .and(builder => builder.where('first', 'Bill').where('last', 'Smith'))
   * // Result:
   * // _and: [{ first: { _eq: 'Bill' } }, { last: { _eq: 'Smith' } }]
   * @param builder The callback for the group.
   */
  and(builder: WhereGroup) {
    this.builder.and(builder);
    return this;
  }
  /**
   * Where a field does not contain `null`.
   * This can be used for checking if a nested object does exists.
   * @param fields The field to compare.
   */
  whereTruthy<K extends keyof Fields<this>>(...fields: K[]) {
    this.builder.whereTruthy(...(fields as string[]));
    return this;
  }
  /**
   * Where a field does contain `null`.
   * This can be used for checking if a nested object does not exist.
   * @param fields The field to compare.
   */
  whereFalsy<K extends keyof Fields<this>>(...fields: K[]) {
    this.builder.whereFalsy(...(fields as string[]));
    return this;
  }
  /**
   * Selects additional fields that are not defined in the model.
   * @param fields The additional fields to select on the model.
   */
  select(...fields: (string | Table[])[]) {
    this.builder.select(...fields);
    return this;
  }

  order(field: string, direction: Direction): this;
  order(order: { [key: string]: Direction }): this;
  order(order: SortFields[]): this;
  order(...order: [{ [key: string]: Direction }] | [SortFields[]] | [string, Direction]) {
    let newOrder = order[0] as { [key: string]: Direction };
    if (Array.isArray(order) && typeof order[0] === 'string') {
      const key = order[0];
      newOrder = { [key]: <Direction>order[1] };
    }
    this.builder.order(newOrder);
    return this;
  }

  distinct(...fields: string[]) {
    this.builder.distinct(...fields);
    return this;
  }

  limit(limit: number, offset: number = 0) {
    this.builder.limit(limit, offset);
    return this;
  }

  offset(offset: number) {
    this.builder.offset(offset);
    return this;
  }

  alias(name: string) {
    this.builder.alias = name;
    return this;
  }
  /**
   * Creates one or more fields using a callback.
   * This function will be executed on all returned rows.
   * @param callback The callback for mapping values to a field.
   * @example
   * Users.all()
   *   .field(row => ({ full: `${row.first} ${row.last}`, slug: `${row.first}-${row.last}-${row.id}` }))
   *   .pluck('first', 'last', 'id');
   * // [{
   * //   id: 1,
   * //   first: 'Billy',
   * //   last: 'Bob',
   * //   full: 'Billy Bob',
   * //   slug: 'Billy-Bob-1'
   * // }]
   */
  field<T extends Fields<this>, U>(callback: (row: T) => { [key: string]: U }) {
    this.builder.callbackMap.push(callback as any);
    return this;
  }
  /**
   * Creates a cursor on a subscription from an initial point in time.
   * @param field The initial field.
   * @param value The value for the field.
   */
  cursor<K extends keyof Fields<this>>(size: number, field: K, value: Fields<this>[K]) {
    this.builder.cursor(size, field as string, value);
    return this;
  }

  getFields() {
    const data: { fields: string[]; tables: Table[] } = { fields: [], tables: [] };
    Object.entries(this.fields).forEach(([key, builder]) => {
      if (typeof builder === 'string' || typeof builder === 'number' || typeof builder === 'boolean')
        data.fields.push(key);
      // Return the table
      else if (builder instanceof Table) data.tables.push(builder);
      // The builder is an instance of the BaseModel.
      // Add the fields to the existing builder if needed.
      else if (builder instanceof BaseModel) {
        if (builder.builder.selects.length === 0 || typeof builder.builder.selects === 'undefined') {
          builder.select(...Object.keys(builder.fields));
        }
        data.tables.push(builder.getBuilder());
      }
      // The builder is just a reference to a class.
      // Create the class and add select fields if they haven't been set.
      else {
        const i = (builder as any).all() as BaseModel;
        i.builder.setBuildOptions({ nested: true, table: { name: key, alias: key } });
        // i.alias(key);
        if (i.builder.selects.length === 0 || typeof i.builder.selects === 'undefined') {
          i.select(...Object.keys(i.fields));
        }
        data.tables.push(i.getBuilder());
      }
    });
    return [...data.fields, data.tables];
  }
}
