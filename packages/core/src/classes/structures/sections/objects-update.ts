import { Table } from '../../table';
import { Structure, StructureResult } from '../structure';

export class UpdateObjects implements Structure {
  constructor(public readonly objects: any) {}

  get(table: Table, idx: number = 0): StructureResult {
    const key = 'update_object';
    const param = `${key}_${idx}`;
    return {
      query: `_set:$${param}`,
      vars: this.objects,
      paramKey: param,
      paramType: `${table.table}_set_input`,
      type: 'objects',
    };
  }

  clone() {
    return new UpdateObjects(this.objects);
  }
}
