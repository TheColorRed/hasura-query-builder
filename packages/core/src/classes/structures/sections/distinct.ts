import { Table } from '../../table';
import { Structure, StructureResult } from '../structure';

export class Distinct implements Structure {
  constructor(private readonly distinct: string[]) {}

  get(table: Table, idx: number = 0): StructureResult {
    const key = 'distinct_on';
    const param = `${key}_${idx}`;
    return {
      query: `${key}:$${param}`,
      vars: this.distinct,
      paramKey: param,
      paramType: `[${table.table}_select_column!]`,
      type: 'distinct',
    };
  }
}
