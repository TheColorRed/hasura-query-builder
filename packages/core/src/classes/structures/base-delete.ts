import { Table } from '../table';
import { BaseQuery } from './base-query';
import { BaseStructure, QueryBody } from './structure';

/**
 * The base class for doing a search.
 */
export class BaseDelete extends BaseQuery implements BaseStructure {
  build(): QueryBody {
    const options = this.tables[0].buildOptions;
    const { queryParamsString, queryParamsVariables } = this.getRootQueryParamsInfo();
    const prefix =
      (options?.nested ?? false) === false ? `mutation ${this.operation ?? ''} ${queryParamsString} {` : '';

    const query = (builder: Table, idx: number) => {
      return BaseDelete.getDeleteQuery(builder, idx, this);
    };

    return this.getQueryBody(prefix, query, queryParamsVariables, options);
  }

  static getDeleteQuery(builder: Table, idx: number, base: BaseQuery) {
    const name = builder.alias.length > 0 ? `${builder.alias}:delete_${builder.table}` : `delete_${builder.table}`;
    const data = base.tableData(builder, idx);
    return `${name}${data.tableParams}{
        affected_rows
        ${
          data.select.length > 0
            ? `,returning {
          ${data.select}
        }`
            : ''
        }
      }`;
  }
}
