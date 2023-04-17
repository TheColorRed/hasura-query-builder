import { BaseModel } from './base-model';
import { BatchSize } from './structures/sections/batch-size';
import { Cursor } from './structures/sections/cursor';
import { Distinct } from './structures/sections/distinct';
import { Limit } from './structures/sections/limit';
import { Offset } from './structures/sections/offset';
import type { SortFields } from './structures/sections/order';
import { Direction, Order } from './structures/sections/order';
import { CompoundPrimaryKeyKeyValues, Primary } from './structures/sections/primary';
import { Select } from './structures/sections/select';
import { Where, WhereAnd, WhereGroup, WhereOr } from './structures/sections/where';
import { HasuraWhere, HasuraWhereComparison } from './structures/structure';

export class Table<T extends object = object> {
  /** The query selects. */
  selects: Select[] = [];
  /** The query connection name. */
  connectionName: string | undefined = 'default';
  /** The query where statements. */
  wheres: (Where | WhereOr | WhereAnd)[] = [];
  /** The query primary key. */
  primaryKey?: Primary;
  /** The query order by statement. */
  orders?: Order;
  /** The query cursor. */
  cursors?: Cursor;
  /** The query batch size. */
  batchSize?: BatchSize;
  /** The query distinct statement. */
  distinctOpts?: Distinct;
  /** The query limit statement. */
  limits?: Limit;
  /** The query offset statement. */
  offsets?: Offset;
  /** The query table name. */
  table!: string;
  /** The query table alias. */
  alias = '';
  /** @internal The query dynamic select fields. */
  callbackMap: (<T, U extends { [key: string]: any }>(row: T) => U)[] = [];
  /** @internal The model reference if there is one. */
  model?: BaseModel;
  /**
   * Creates a new query on a single table.
   * @param name The name of the table.
   * * `string` &ndash; The name of the table.
   * * `string:string` &ndash; The table alias followed by the database table name.
   * @example
   * // A table named 'users'.
   * new Table('users');
   * @example
   * // A table that is named 'usr' but is outputted as 'users'.
   * new Table('users:usr');
   */
  constructor(name: string, alias = '') {
    this.table = name;
    this.alias = alias;
  }
  /**
   * Uses a specific connection for the query.
   * @param connection The name of the connection.
   */
  connection(connection: string) {
    this.connectionName = connection;
    return this;
  }
  /**
   * Selects fields from the current table.
   * @param fields The fields to select. Child tables can be selected by passing an object of query builders.
   * * `string` &ndash; The name of the field.
   * * `string:string` &ndash; The field alias followed by the database field name.
   * * `[Table, Table]` &ndash; An array of query builders.
   * @example
   * // A query that is inserted into another query.
   * bio.select('dob', 'bio');
   * users.select('first', 'last', [bio]);
   * @example
   * // A field that is named 'date_of_birth' but is outputted as 'dob'.
   * bio.select('dob:date_of_birth')
   */
  select(...fields: (string | Table[])[]) {
    this.selects.push(new Select(fields));
    return this;
  }
  /**
   * Where a field successfully compares against a value.
   * @param field The field to compare.
   * @param key The comparison operator to use.
   * @param value The value that the field should evaluate with.
   */
  where(field: string, key: keyof HasuraWhereComparison, value: any): this;
  /**
   * Where a field is equal to a value.
   *
   * Shorthand for `qb.where('x', '_eq', 'y')`
   * @param field The field to compare.
   * @param value The value that the field should be.
   */
  where(field: string, value: any): this;
  /**
   * Where fields compare against a value.
   * @param fields The comparisons.
   */
  where(fields: HasuraWhere): this;
  where(...args: [string, string, any] | [string, any] | [HasuraWhere]) {
    if (args.length === 1) {
      this.wheres.push(new Where(args[0]));
    } else if (args.length === 2) {
      const col = args[0];
      this.wheres.push(new Where({ [col]: { _eq: args[1] } }));
    } else if (args.length === 3) {
      const col = args[0];
      const operator = args[1];
      this.wheres.push(new Where({ [col]: { [operator]: args[2] } }));
    }
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
    const tbl = new Table(this.table, this.alias);
    this.wheres.push(new WhereOr(builder, tbl));
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
    const tbl = new Table(this.table, this.alias);
    this.wheres.push(new WhereAnd(builder, tbl));
    return this;
  }
  /**
   * Where a field does not contain `null`.
   * @param fields The field to compare.
   */
  whereTruthy(...fields: string[]) {
    fields.forEach(f => this.wheres.push(new Where({ [f]: {} })));
    return this;
  }
  /**
   * Where a field does contain `null`.
   * @param fields The field to compare.
   */
  whereFalsy(...fields: string[]) {
    fields.forEach(f => this.wheres.push(new Where({ _not: { [f]: {} } })));
    return this;
  }
  /**
   * Sets a limit for the query and optionally an offset.
   * @param limit The number of items to return. If `reset` is passed, the limit is cleared.
   * @param offset The zero based offset where to start returning results; Default = 0. If `reset` is passed, the offset is cleared.
   */
  limit(limit: number | 'reset', offset: number | 'reset' = 0) {
    // Reset the limit so that there is no limit.
    if (limit === 'reset' || offset === 'reset') {
      if (limit === 'reset') this.limits = undefined;
      if (offset === 'reset') this.offsets = undefined;
      return this;
    }
    this.limits = new Limit(limit);
    this.offset(offset);
    return this;
  }
  /**
   * Sets an offset for the query.
   * @param offset The zero based offset where to start returning results. If `reset` is passed, the offset is cleared.
   */
  offset(offset: number | 'reset') {
    if (offset === 'reset') {
      this.offsets = undefined;
      return this;
    }
    this.offsets = new Offset(offset);
    return this;
  }
  /**
   * Sets the primary key for the query.
   * @param keys The primary key to use for the query. This can be a single value or an array of values for a compound primary key.
   */
  primary(keys: CompoundPrimaryKeyKeyValues) {
    this.primaryKey = new Primary(keys);
    return this;
  }
  /**
   * Adds an order by clause to the query.
   * @param fields The field or fields to order by.
   */
  order(fields: SortFields): this;
  /**
   * Adds an order by clause to the query.
   * @param fields The field or fields to order by.
   */
  order(fields: SortFields[]): this;
  order(fields: { [key: string]: Direction } | SortFields[]) {
    this.orders = Array.isArray(fields) ? new Order(fields) : new Order(fields);
    return this;
  }
  /**
   * Adds a distinct clause to the query.
   * @param field The field or fields to order by.
   */
  distinct(...field: string[]) {
    this.distinctOpts = new Distinct(field);
    return this;
  }
  /**
   * Adds a cursor to the query.
   * @param size The number of items to return.
   * @param field The field to use for the cursor.
   * @param value The value to use for the cursor.
   */
  cursor(size: number, field: string, value: any) {
    this.cursors = new Cursor(field, value);
    this.batchSize = new BatchSize(size);
    return this;
  }
  /**
   * Clones the current table into a new table.
   */
  clone(): Table;
  /**
   * Clones the current table into a new table.
   * @param name The name of the the new table.
   * @param alias An alias for the new table.
   */
  clone(name: string, alias?: string): Table;
  clone(...args: [string, string?] | []) {
    const table = Object.assign(Object.create(Object.getPrototypeOf(this)), this) as Table;

    if (typeof this.model !== 'undefined') {
      table.selects = this.selects.map(s => s.clone());
      table.wheres = this.wheres.map(w => w.clone());
      table.orders = this.orders?.clone();
      table.limits = this.limits?.clone();
      table.offsets = this.offsets?.clone();
      table.primaryKey = this.primaryKey?.clone();
      table.distinctOpts = this.distinctOpts?.clone();
      table.cursors = this.cursors?.clone();
      table.batchSize = this.batchSize?.clone();
    }

    if (args.length === 1) {
      table.table = args[0];
    }
    if (args.length === 2 && typeof args[1] === 'string') {
      table.alias = args[1];
    }

    return table;
  }
}
