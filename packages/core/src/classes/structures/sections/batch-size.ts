import { Table } from '../../table';
import { Structure, StructureResult } from '../structure';

export class BatchSize implements Structure {
  constructor(private readonly size: number) {}

  get(table: Table, idx: number = 0): StructureResult {
    const key = 'batch_size';
    const param = `${key}_${idx}`;
    return {
      query: `${key}:$${param}`,
      vars: this.size,
      paramKey: param,
      paramType: `Int!`,
      type: 'batch',
    };
  }

  clone() {
    return new BatchSize(this.size);
  }
}
