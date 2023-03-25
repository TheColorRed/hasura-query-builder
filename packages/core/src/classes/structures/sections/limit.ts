import { Table } from '../../table';
import { Structure, StructureResult } from '../structure';

export class Limit implements Structure {
  constructor(public readonly limit: number) {}

  get(table: Table, idx: number = 0): StructureResult {
    const key = 'limit';
    const param = `${key}_${idx}`;
    return {
      query: `${key}:$${param}`,
      vars: this.limit,
      paramKey: param,
      paramType: 'Int',
      type: 'limit',
    };
  }
}
