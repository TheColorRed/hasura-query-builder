import { Settings } from './connections/connections';
import { JsonConstructor } from './data-types/json';
import type { InsertConflict } from './model';
import { QueryBuilder } from './query-builder';
import { InsertObjects } from './structures/sections/objects-insert';
import { UpdateObjects } from './structures/sections/objects-update';
import { OnConflict } from './structures/sections/on-conflict';
import { Direction, SortFields } from './structures/sections/order';
import { CompoundPrimaryKeyKeyValues, CompoundPrimaryKeyNames, PrimaryKeyValue } from './structures/sections/primary';
import { SelectField } from './structures/sections/select';
import { TableParams } from './structures/sections/table-params';
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
 * * `transaction` &ndash; Executes a group of queries or mutations as a transaction.
 */
export type QueryType = 'select' | 'insert' | 'update' | 'delete' | 'transaction';

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
   * **Note:** These fields cannot be used at the database level, such as in a `where` clause.
   */
  attributes?: AttributesType<this>;
  /** Settings for the model. */
  settings?: Settings;
  /** The Hasura role to use for the model. */
  role?: string;
}
export abstract class BaseModel {
  /** The name of the table that this model relates to. */
  abstract readonly table: string;
  /** The fields that are within the table. */
  abstract readonly fields: Fields<any>;
  /** The builder that the model is working with. */
  protected tableRef!: Table;
  /** The build type. */
  private _queryType: QueryType = 'select';
  records?: InsertObjects | UpdateObjects;
  /** What to do when there is a conflict. */
  conflict?: OnConflict;
  /** The options for the query. Note: This is only used in the root query. */
  queryOptions: QueryOptions = {};
  /** The fields that should be added that are not in the model. */
  private addSelects: SelectField = [];
  /** The type of build (`select`, `insert`, `update`, `delete`, `upsert`). */
  get queryType() {
    return this._queryType;
  }
  /** Whether or not this is a query (`select`). */
  get isQuery() {
    return this.queryType === 'select';
  }
  /** Whether or not this is a mutation (`insert`, `update`, `delete`, `upsert`). */
  get isMutation() {
    return this.queryType !== 'select';
  }
  /**
   * @internal
   * Finds a record by primary key.
   * @param model The model to use.
   * @param primary The primary key values.
   */
  protected static _find<T extends BaseModel>(model: T, ...primary: PrimaryKeyValue[]) {
    if (typeof model.primary === 'undefined') throw Error(`No primary key set on model "${model.table}"`);
    if (
      // The primary key is an array.
      (Array.isArray(model.primary) && primary.length !== model.primary.length) ||
      // The primary key is a string.
      (!Array.isArray(model.primary) && typeof primary[0] === 'string')
    )
      throw Error(`Key/Value count miss-match on model "${model.constructor.name}"`);

    const fields = typeof model.primary === 'string' ? [model.primary] : model.primary;
    const map = fields.reduce<CompoundPrimaryKeyKeyValues>((acc, val, idx) => {
      acc[val] = primary[idx] as string | number;
      return acc;
    }, {});
    model.tableRef = new Table(`${model.table}_by_pk`).primary(map);
    model.tableRef.model = model;
    return model;
  }
  /**
   * @internal
   * An empty table blueprint for all records.
   * @param model The model to use.
   */
  protected static _all<T extends BaseModel, K extends keyof Fields<BaseModel>>(
    model: T,
    field: K,
    key: string,
    value: any
  ): BaseModel;
  protected static _all<T extends BaseModel, K extends keyof Fields<BaseModel>>(
    model: T,
    field: K,
    value: Fields<BaseModel>[K]
  ): BaseModel;
  protected static _all<T extends BaseModel>(model: T, fields: HasuraWhere): BaseModel;
  protected static _all<T extends BaseModel>(model: T): BaseModel;
  protected static _all<T extends BaseModel>(model: T, ...where: [T, string, any] | [T, any] | [HasuraWhere] | []) {
    model.tableRef = new Table(model.table);
    model.tableRef.model = model;
    if (where.length > 0) {
      // @ts-ignore
      model.tableRef.where(...where);
    }
    return model;
  }
  /**
   * @internal
   * An empty table blueprint for calling a table as a function.
   * This is usually used for custom functions and procedures.
   * @param model The model to use to call the function.
   */
  protected static _call<T extends BaseModel, U extends object = {}>(model: T, parameters: U) {
    model.tableRef = new Table(model.table);
    model.tableRef.procedureParameters = new TableParams(parameters);
    model.tableRef.model = model;
    return model;
  }
  /**
   * @internal
   * Creates a transaction for the given models.
   * @param models The models to create a transaction for.
   */
  protected static _transaction<T extends BaseModel>(...models: T[]) {
    models.forEach(q => q.setTableInformation(q.tableRef));
    const result = new QueryBuilder({ tables: models.map(q => q.tableRef), type: 'transaction' });
    return result.build();
  }
  /**
   * @internal
   * An empty table blueprint for a single record.
   */
  protected static _first<T extends BaseModel>(model: T, field: string, value: any) {
    model.tableRef = new Table(model.table).where({ [field]: { _eq: value } }).limit(1);
    model.tableRef.model = model;
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
    model.tableRef = new Table(model.table);
    model._queryType = 'insert';
    model.tableRef.model = model;
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
    model.tableRef = new Table(model.table);
    model._queryType = 'update';
    model.tableRef.model = model;
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
    model.tableRef = new Table(model.table);
    model._queryType = 'delete';
    model.tableRef.model = model;
    return model;
  }
  /**
   * Creates a new table blueprint.
   * @param name The name of the table.
   * @param alias The alias of the table.
   */
  clone<T extends this>(name?: string, alias?: string) {
    const base = Object.assign(Object.create(Object.getPrototypeOf(this)), this) as T;
    // @ts-ignore
    base.table = name ?? this.table;
    base.tableRef = base.tableRef.clone(name ?? this.table, alias);
    return base;
  }
  /**
   * Gets the builder.
   */
  getTable() {
    return this.tableRef;
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
    const table = args[0] instanceof Table ? args[0] : this.tableRef;
    const buildOptions = (args[0] instanceof Table ? args[1] : args[0]) as object;
    if (!table.model) throw new Error('Model not set on builder.');
    this.setTableInformation(table, buildOptions);
    return new QueryBuilder({ tables: table, type: this._queryType, queryOptions: this.queryOptions }).build();
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
    this.tableRef.where(...(args as [HasuraWhere]));
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
    this.tableRef.or(builder);
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
    this.tableRef.and(builder);
    return this;
  }
  /**
   * Where a field does not contain `null`.
   * This can be used for checking if a nested object does exists.
   * @param fields The field to compare.
   */
  whereTruthy<K extends keyof Fields<this>>(...fields: K[]) {
    this.tableRef.whereTruthy(...(fields as string[]));
    return this;
  }
  /**
   * Where a field does contain `null`.
   * This can be used for checking if a nested object does not exist.
   * @param fields The field to compare.
   */
  whereFalsy<K extends keyof Fields<this>>(...fields: K[]) {
    this.tableRef.whereFalsy(...(fields as string[]));
    return this;
  }
  /**
   * Selects a custom list of fields. This will overwrite the fields defined on the model.
   * @param fields The additional fields to select on the model.
   */
  select(...fields: SelectField) {
    this.tableRef.select(...fields);
    return this;
  }
  /**
   * Adds additional fields to the models select. This will not override the default fields but instead will add to them.
   * @param fields The additional fields to select on the model.
   */
  addSelect(...fields: SelectField) {
    this.addSelects.push(...fields);
    return this;
  }
  /**
   * Sets the order and direction of the query using a single field.
   * @param field The field to order by.
   * @param direction The direction to order by.
   * @example
   * Users.all().order('first', 'asc')
   */
  order(field: string, direction: Direction): this;
  /**
   * Sets the order and direction of the query using multiple fields.
   * @param order An object of fields and directions.
   * @example
   * Users.all().order({ first: 'asc', last: 'desc' })
   */
  order(order: { [key: string]: Direction }): this;
  /**
   * Sets the order and direction of the query using multiple fields.
   * @param order An array of objects of fields and directions.
   * @example
   * Users.all().order([{ first: 'asc' }, { last: 'desc' }])
   */
  order(order: SortFields[]): this;
  order(...order: [{ [key: string]: Direction }] | [SortFields[]] | [string, Direction]) {
    let newOrder = order[0] as { [key: string]: Direction };
    if (Array.isArray(order) && typeof order[0] === 'string') {
      const key = order[0];
      newOrder = { [key]: <Direction>order[1] };
    }
    this.tableRef.order(newOrder);
    return this;
  }
  /**
   * Sets the distinct fields for the query.
   * @param fields The fields to group by.
   */
  distinct(...fields: string[]) {
    this.tableRef.distinct(...fields);
    return this;
  }
  /**
   * Sets the limit for the query.
   * @param limit The number of rows to return.
   * @param offset The offset to start at.
   */
  limit(limit: number, offset: number = 0) {
    this.tableRef.limit(limit, offset);
    return this;
  }
  /**
   * Sets the offset for the query.
   * @param offset The offset to start at.
   */
  offset(offset: number) {
    this.tableRef.offset(offset);
    return this;
  }
  /**
   * Sets an alias for the table.
   * @param name The table alias.
   */
  alias(name: string) {
    this.tableRef.alias = name;
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
    this.tableRef.callbackMap.push(callback as any);
    return this;
  }
  /**
   * Creates a cursor on a subscription from an initial point in time.
   * @param field The initial field.
   * @param value The value for the field.
   */
  cursor<K extends keyof Fields<this>>(size: number, field: K, value: Fields<this>[K]) {
    this.tableRef.cursor(size, field as string, value);
    return this;
  }

  getFields(fields: Fields<any>) {
    const data: { fields: string[]; tables: Table[] } = { fields: [], tables: [] };
    Object.entries(fields).forEach(([key, builder]) => {
      if (
        typeof builder === 'string' ||
        typeof builder === 'number' ||
        typeof builder === 'boolean' ||
        builder instanceof JsonConstructor
      )
        data.fields.push(key);
      // Return the table
      else if (builder instanceof Table) {
        data.tables.push(builder);
      }
      // The builder is an instance of the BaseModel.
      // Add the fields to the existing builder if needed.
      else if (builder instanceof BaseModel) {
        if (builder.tableRef.selects.length === 0 || typeof builder.tableRef.selects === 'undefined') {
          builder.select(...Object.keys(builder.fields));
        }
        data.tables.push(builder.getTable());
      }
      // The builder is just a reference to a class.
      // Create the class and add select fields if they haven't been set.
      else {
        // console.debug('class', builder);
        const builderInstance = (builder as any).all() as BaseModel;
        builderInstance.tableRef.setBuildOptions({ nested: true, table: { name: key, alias: key } });
        if (builderInstance.tableRef.selects.length === 0 || typeof builderInstance.tableRef.selects === 'undefined') {
          const keys = Object.keys(builderInstance.fields) as (string | BaseModel)[];
          const entries = Object.entries(builderInstance.fields);
          entries.forEach(([k, value]) => {
            if (value.prototype instanceof BaseModel) {
              const idx = keys.findIndex(key => k === key);
              const model = new value.prototype.constructor() as BaseModel;
              model.tableRef = new Table(model.table);
              model.select(...model.getFields(model.fields));
              idx > -1 && keys.splice(idx, 1, model);
            }
          });
          builderInstance.select(...keys);
        }
        data.tables.push(builderInstance.getTable());
      }
    });
    return [...data.fields, data.tables];
  }

  private setTableInformation(table: Table, buildOptions?: BuildOptions) {
    const model = table.model!;
    table.setBuildOptions({ ...buildOptions });

    if (table.selects.length === 0 || typeof table.selects === 'undefined') {
      const fields = model.getFields(model.fields);
      table.select(...fields);
    }
    if (table instanceof Table && model.addSelects.length > 0) {
      const fields = model.getAdditionalFields(model.addSelects);
      table.select(...fields);
    }
  }

  private getAdditionalFields(fields: SelectField) {
    const data: { fields: string[]; tables: Table[] } = { fields: [], tables: [] };
    fields.forEach(select => {
      if (typeof select === 'string') {
        data.fields.push(select);
      } else if (select instanceof Table) {
        data.tables.push(select);
      } else if (select instanceof BaseModel) {
        if (select.tableRef.selects.length === 0 || typeof select.tableRef.selects === 'undefined') {
          select.select(...Object.keys(select.fields));
        }
        data.tables.push(select.getTable());
      }
    });
    return [...data.fields, data.tables];
  }
}
