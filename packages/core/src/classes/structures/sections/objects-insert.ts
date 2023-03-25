import { Table } from '../../table';
import { Structure, StructureResult } from '../structure';

export class InsertObjects implements Structure {
  constructor(public readonly objects: any[]) {}

  get(table: Table, idx: number = 0): StructureResult {
    const key = 'insert_object';
    const param = `${key}_${idx}`;
    return {
      query: `objects:$${param}`,
      vars: this.objects,
      paramKey: param,
      paramType: `[${table.table}_insert_input!]!`,
      type: 'objects',
    };
  }
}
