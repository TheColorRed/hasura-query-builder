import { BuildType } from './base-model';
import { BaseDelete } from './structures/base-delete';
import { BaseInsert } from './structures/base-insert';
import { BaseSelect } from './structures/base-select';
import { BaseUpdate } from './structures/base-update';
import { QueryOptions } from './structures/structure';
import { Table } from './table';
export interface ConstructorOptions {
  /** The builders that will be generated for this operation. */
  tables: Table[] | Table;
  /** A name for the operation. */
  operation?: string;
  /** The type of query to build. */
  type?: BuildType;
  /** The options for the query. */
  queryOptions?: QueryOptions;
}
/**
 * Constructs a query based on the data set from a query builder.
 */
export class QueryBuilder {
  private builders: Table[] = [];
  private operation: string = '';
  private buildType: BuildType = 'select';
  private queryOptions?: QueryOptions;
  /** The base select query builder to build select statements. */
  get baseSelect() {
    return new BaseSelect(this.builders, this.operation);
  }
  /** The base insert query builder to build insert statements. */
  get baseInsert() {
    return new BaseInsert(this.builders, this.operation);
  }
  /** The base update query builder to build update statements. */
  get baseUpdate() {
    return new BaseUpdate(this.builders, this.operation);
  }
  /** The base delete query builder to build delete statements. */
  get baseDelete() {
    return new BaseDelete(this.builders, this.operation);
  }
  constructor(options: ConstructorOptions);
  constructor(table: Table, operation?: string, queryOptions?: QueryOptions);
  constructor(...args: [Table, string?, QueryOptions?] | [ConstructorOptions]) {
    // NOTE: Using `args[0] instanceof Table` causes webpack circular dependency error.
    if (!('tables' in args[0])) {
      this.builders = [args[0]];
      this.operation = args[1] ?? '';
      this.queryOptions = args[2];
    } else if ('tables' in args[0]) {
      this.builders = !Array.isArray(args[0].tables) ? [args[0].tables] : args[0].tables;
      this.operation = args[1] ?? '';
      this.buildType = args[0]?.type ?? 'select';
      this.queryOptions = args[0]?.queryOptions;
    }
  }
  /**
   * @internal
   * Construct a query to get all results.
   * @param nested Whether or not this query is nested.
   * @param compact Whether or not to compact the query.
   */
  build() {
    // options = { ...options, queryOptions: { ...this.queryOptions } };
    switch (this.buildType) {
      case 'insert':
        return this.baseInsert.build();
      case 'update':
        return this.baseUpdate.build();
      case 'delete':
        return this.baseDelete.build();
      case 'select':
      default:
        return this.baseSelect.build();
    }
  }
}
