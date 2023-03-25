import { QueryBuilder } from '../../query-builder';
import type { Table } from '../../table';
import { Structure, StructureResult } from '../structure';

export interface SelectFields {
  [key: string]: Table;
}

export class Select implements Structure {
  constructor(private readonly select: (string | Table[])[]) {}
  get(): StructureResult {
    const fields: string[] = this.select.reduce<string[]>((acc, field) => {
      if (typeof field === 'string') {
        return acc.concat(field.split(/,|\n/));
      } else {
        const items = field.map(builder => new QueryBuilder(builder).build({ nested: true }).query);
        return acc.concat(items);
      }
    }, []);

    let query = fields
      .map(field => field.trim())
      .join(',')
      .replace(/,,+/g, ',')
      .replace(/,$/, '');

    return {
      paramKey: '',
      paramType: '',
      query: query,
      vars: '',
      type: 'select',
    };
  }
}
