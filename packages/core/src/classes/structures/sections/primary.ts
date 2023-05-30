import { Table } from '../../table';
import { Structure, StructureResult } from '../structure';

export interface CompoundPrimaryKeyKeyValues {
  [key: string]: string | number;
}

export type CompoundPrimaryKeyNames = string[] | string;
export type CompoundPrimaryKeyValues = (string | number)[];

export type PrimaryKey = CompoundPrimaryKeyKeyValues | string | number;
export type PrimaryKeyValue = CompoundPrimaryKeyValues | string | number;

export class Primary implements Structure {
  constructor(private readonly keys: CompoundPrimaryKeyKeyValues) {}

  get(builder: Table, idx: number): StructureResult {
    const intType = 'Int';
    const key = 'primary';
    const param = `${key}_${idx}`;
    const keyVal = Object.entries(this.keys);

    const params = keyVal.map((_, idx) => `${param}_${idx}`);
    const types = keyVal.map(([_, val]) => (typeof val === 'string' ? 'String!' : `${intType}!`));
    const vars = keyVal.reduce<{ [key: string]: string | number }>((acc, [key, val], idx) => {
      const paramKey = `${param}_${idx}`;
      acc[paramKey] = val;
      return acc;
    }, {});
    const query = keyVal
      .reduce<string[]>((acc, [key], idx) => {
        const paramKey = `${param}_${idx}`;
        return acc.concat([`${key}:$${paramKey}`]);
      }, [])
      .join(',');

    // debug.logAndExit(params, types, query, vars);
    return {
      paramKey: params,
      paramType: types,
      query: query,
      vars: vars,
      type: 'primary',
    };
  }

  clone() {
    return new Primary(this.keys);
  }
}
