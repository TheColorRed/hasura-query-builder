import { Table } from '../../table';
import { Structure, StructureResult } from '../structure';

export class TableParams implements Structure {
  constructor(private readonly params: { [key: string]: any }) {}
  get(table: Table, idx: number): StructureResult {
    const params = this.getParams(idx);
    return {
      query: this.getQueryString(params),
      vars: this.getQueryVars(params),
      paramKey: params.keys,
      paramType: params.types,
      type: 'table-params',
    };
  }

  private getParams(tableIdx: number) {
    const params = Object.entries(this.params);
    const keys: string[] = [];
    const originalKeys: string[] = [];
    const types: string[] = [];
    params.forEach(([key, value]) => {
      originalKeys.push(key);
      keys.push(`${key}_${tableIdx}`);
      if (typeof value === 'string') {
        types.push('String!');
      } else if (typeof value === 'number' && value.toString().includes('.')) {
        types.push('Float!');
      } else if (typeof value === 'number') {
        types.push('Int!');
      } else if (typeof value === 'boolean') {
        types.push('Boolean!');
      } else if (Array.isArray(value) && typeof value[0] === 'string') {
        types.push('[String!]!');
      } else if (Array.isArray(value) && typeof value[0] === 'number' && value[0].toString().includes('.')) {
        types.push('[Float!]!');
      } else if (Array.isArray(value) && typeof value[0] === 'number') {
        types.push('[Int!]!');
      }
    });
    return { keys, originalKeys, types };
  }

  private getQueryVars(params: { keys: string[]; originalKeys: string[]; types: string[] }) {
    const vars: { [key: string]: any } = {};
    params.originalKeys.forEach((key, idx) => {
      vars[params.keys[idx]] = this.params[key];
    });
    return vars;
  }

  private getQueryString(params: { keys: string[]; originalKeys: string[]; types: string[] }) {
    return params.originalKeys.map((key, idx) => `${key}:$${params.keys[idx]}`).join(',');
  }

  clone() {
    return new TableParams(this.params);
  }
}
