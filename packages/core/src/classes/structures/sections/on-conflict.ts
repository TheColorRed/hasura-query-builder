import { Table } from '../../table';
import { Structure, StructureResult } from '../structure';

export class OnConflict implements Structure {
  constructor(public readonly constraint: string, public readonly fields: string[]) {}

  get(table: Table, idx: number = 0): StructureResult {
    const key = 'on_conflict';
    const param = `${key}_${idx}`;
    return {
      query: `on_conflict:$${param}`,
      vars: { update_columns: this.fields, constraint: this.constraint },
      paramKey: param,
      paramType: `${table.table}_on_conflict!`,
      type: 'on-conflict',
    };
  }
}
