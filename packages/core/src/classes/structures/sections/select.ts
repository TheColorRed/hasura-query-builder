import { BaseModel } from '../../base-model';
import { Model } from '../../model';
import { QueryBuilder } from '../../query-builder';
import { Table } from '../../table';
import { Structure, StructureResult } from '../structure';

export interface SelectFields {
  [key: string]: Table;
}

export type SelectField = (string | BaseModel | (Table | typeof Model)[])[];

export class Select implements Structure {
  constructor(private readonly select: SelectField) {}
  private isTableArray(item: any): item is Table[] {
    return Array.isArray(item) && item.every((i: any) => i instanceof Table);
  }
  private isBaseModelArray(item: any): item is BaseModel[] {
    return Array.isArray(item) && item.every((i: any) => i instanceof BaseModel);
  }
  get(): StructureResult {
    const fields: string[] = this.select.reduce<string[]>((acc, field) => {
      if (typeof field === 'string') {
        return acc.concat(field.split(/,|\n/));
      } else if (this.isTableArray(field)) {
        const items = field.map((builder: Table) => {
          builder.setBuildOptions({ nested: true });
          // console.debug('field', new QueryBuilder(builder).build().query);
          return new QueryBuilder(builder).build().query;
        });
        return acc.concat(items);
      } else if (field instanceof Model) {
        const builder = field.getBuilder();
        builder.setBuildOptions({ nested: true });
        return acc.concat(new QueryBuilder(builder).build().query);
      } else if (this.isBaseModelArray(field)) {
        const items = (field as BaseModel[]).map(model => {
          const builder = model.getBuilder();
          builder.setBuildOptions({ nested: true });
          return new QueryBuilder(builder).build().query;
        });
        return acc.concat(items);
      }
      return acc;
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

  clone() {
    return new Select(this.select);
  }
}
