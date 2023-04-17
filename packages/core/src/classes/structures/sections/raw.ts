import { Table } from '../../table';
import { Structure, StructureResult } from '../structure';

export class Raw implements Structure {
  constructor(public readonly data: string, public readonly vars?: any) {}
  get(table: Table, idx: number): StructureResult {
    const key = 'limit';
    const param = `${key}_${idx}`;
    return {
      query: this.data,
      vars: this.vars,
      paramKey: param,
      paramType: '',
      type: 'raw',
    };
  }

  clone() {
    return new Raw(this.data, this.vars);
  }
}
