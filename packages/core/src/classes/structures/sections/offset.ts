import { Table } from '../../table';
import { Structure, StructureResult } from '../structure';

export class Offset implements Structure {
  constructor(private readonly offset: number) {}

  get(table: Table, idx: number): StructureResult {
    const key = 'offset';
    const param = `${key}_${idx}`;
    return {
      query: `${key}:$${param}`,
      vars: this.offset,
      paramKey: param,
      paramType: 'Int',
      type: 'offset',
    };
  }
}
