import { Table } from '../table';
import { BaseQuery } from './base-query';
import { Limit } from './sections/limit';
import { Order } from './sections/order';
import { Select } from './sections/select';
import { Where } from './sections/where';
import { BaseStructure, BuildOptions, QueryBody } from './structure';

export interface SelectOptions {
  table: string;
  selects: Select[];
  operation?: string;
  where?: Where[];
  order?: Order;
  limit?: Limit;
}

/**
 * The base class for doing a search.
 */
export class BaseSelect extends BaseQuery implements BaseStructure {
  /**
   * Construct a query to get all results.
   * @param nested Whether or not this query is nested within another query
   * @param compact Whether or not this query should be compact (Only needed on outer query).
   */
  build(): QueryBody {
    // console.debug(options);
    const options = this.tables[0].buildOptions;
    const { queryParamsString, queryParamsVariables } = this.getRootQueryParamsInfo();
    const queryOrSub = options?.type === 'subscription' ? 'subscription' : 'query';
    const prefix =
      (options?.nested ?? false) === false ? `${queryOrSub} ${this.operation ?? ''} ${queryParamsString} {` : '';

    const query = (builder: Table, idx: number) => {
      return BaseSelect.getSelectQuery(builder, idx, this, options);
    };

    return this.getQueryBody(prefix, query, queryParamsVariables, options);
  }

  static getSelectQuery(builder: Table, idx: number, base: BaseQuery, options: BuildOptions) {
    const hasTableOverride = !!options.table?.name || !!options.table?.alias;
    let name = builder.table;
    if (hasTableOverride) {
      if (options.table?.name && options.table?.alias) {
        name = `${options.table.alias}:${options.table.name}`;
      } else if (options.table?.name) {
        name = options.table.name;
      }
    } else {
      name = builder.alias.length > 0 ? `${builder.alias}:${builder.table}` : builder.table;
    }

    const data = base.tableData(builder, idx);
    return `${name}${data.tableParams}{
        ${data.select}
      }`;
  }

  first(connection: string) {
    // this.options.limit = new Limit(1);
    return this.build();
  }
}
