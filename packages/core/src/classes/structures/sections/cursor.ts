import { Table } from '../../table';
import { Structure, StructureResult } from '../structure';

export class Cursor implements Structure {
  constructor(private readonly field: string, private readonly value: any) {}

  get(table: Table, idx: number = 0): StructureResult {
    const key = 'cursor';
    const param = `${key}_${idx}`;
    return {
      query: `${key}:$${param}`,
      vars: { initial_value: { [this.field]: this.value } },
      paramKey: param,
      paramType: `[${table.table}_cursor_input]!`,
      type: 'cursor',
    };
  }
}
