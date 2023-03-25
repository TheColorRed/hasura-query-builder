import { Table } from '../table';
import { BaseQuery } from './base-query';
import { BaseStructure, BuildOptions, QueryBody } from './structure';

/**
 * The base class for doing a search.
 */
export class BaseUpdate extends BaseQuery implements BaseStructure {
  build(options?: BuildOptions): QueryBody {
    const { queryParamsString, queryParamsVariables } = this.getRootQueryParamsInfo();
    const prefix =
      (options?.nested ?? false) === false ? `mutation ${this.operation ?? ''} ${queryParamsString} {` : '';

    const query = (builder: Table, idx: number) => {
      const name = builder.alias.length > 0 ? `${builder.alias}:update_${builder.table}` : `update_${builder.table}`;
      const data = this.tableData(builder, idx);
      return `${name}${data.tableParams}{
        affected_rows,
        returning {
          ${data.select}
        }
      }`;
    };

    return {
      ...(this.operation && { operationName: this.operation }),
      query: this.compact(
        `${prefix}
          ${this.builders.map(query).join(',')}
        ${prefix.length > 0 ? '}' : ''}`,
        options?.compact ?? true
      ),
      variables: queryParamsVariables,
      connection: options?.connection ?? 'default',
    };
  }
}
