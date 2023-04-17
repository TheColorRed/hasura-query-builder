import { Table } from '../table';
import { BaseQuery } from './base-query';
import { BaseStructure, BuildOptions, QueryBody } from './structure';

/**
 * The base class for doing a search.
 */
export class BaseInsert extends BaseQuery implements BaseStructure {
  build(options?: BuildOptions): QueryBody {
    const { queryParamsString, queryParamsVariables } = this.getRootQueryParamsInfo();
    const prefix =
      (options?.nested ?? false) === false ? `mutation ${this.operation ?? ''} ${queryParamsString} {` : '';

    const query = (builder: Table, idx: number) => {
      const name = builder.alias.length > 0 ? `${builder.alias}:insert_${builder.table}` : `insert_${builder.table}`;
      const data = this.tableData(builder, idx);
      return `${name}${data.tableParams}{
        affected_rows,
        returning {
          ${data.select}
        }
      }`;
    };

    return this.getQueryBody(prefix, query, queryParamsVariables, options);
  }
}
