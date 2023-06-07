import { Table } from '../table';
import { BaseDelete } from './base-delete';
import { BaseInsert } from './base-insert';
import { BaseQuery } from './base-query';
import { BaseSelect } from './base-select';
import { BaseUpdate } from './base-update';
import { BaseStructure, QueryBody } from './structure';

/**
 * The base class for doing a search.
 */
export class BaseTransaction extends BaseQuery implements BaseStructure {
  build(): QueryBody {
    const options = this.tables[0].buildOptions;
    const { queryParamsString, queryParamsVariables } = this.getRootQueryParamsInfo();
    const validQuery = this.tables.every(table => table.model?.queryType === 'select');
    const validMutation = this.tables.every(table => table.model?.queryType !== 'select');

    if (validQuery === false && validMutation === false) {
      this.tables.forEach(table => console.debug(table.model?.queryType));
      throw new Error('Invalid query type. All queries must either be all "read" or all "write".');
    }

    const rootType = validQuery ? 'query' : 'mutation';
    const prefix =
      (options?.nested ?? false) === false ? `${rootType} ${this.operation ?? ''} ${queryParamsString} {` : '';

    const query = (table: Table, idx: number) => {
      const queryType = table.model?.queryType ?? 'select';
      if (queryType === 'insert') {
        return BaseInsert.getInsertQuery(table, idx, this);
      } else if (queryType === 'update') {
        return BaseUpdate.getUpdateQuery(table, idx, this);
      } else if (queryType === 'delete') {
        return BaseDelete.getDeleteQuery(table, idx, this);
      } else {
        return BaseSelect.getSelectQuery(table, idx, this, options);
      }
    };

    return this.getQueryBody(prefix, query, queryParamsVariables, options);
  }
}
