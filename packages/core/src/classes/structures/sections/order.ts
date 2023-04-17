import { Table } from '../../table';
import { Structure, StructureResult } from '../structure';

export type Direction = 'asc' | 'desc' | 'asc_nulls_first' | 'asc_nulls_last' | 'desc_nulls_first' | 'desc_nulls_last';

// export enum Direction {
//   Asc = 'asc',
//   Desc = 'desc',
//   AscNullFirst = 'asc_nulls_first',
//   AscNullLast = 'asc_nulls_last',
//   DescNullFirst = 'desc_nulls_first',
//   DescNullLast = 'desc_nulls_last',
// }

export interface SortFields {
  [key: string]: Direction;
}

export class Order implements Structure {
  private readonly fieldsArr?: SortFields[];
  private readonly fieldsObj?: SortFields;
  /**
   * Adds fields as an object query.
   * @param fields The fields to add.
   * @example
   * ```gql
   * query {
   *   users(order_by: {first:asc, last:desc}) {
   *     first, last
   *   }
   * }
   * ```
   */
  constructor(fields: SortFields);
  /**
   * Adds fields as an array query.
   * @param fields The fields to add.
   * @example
   * ```gql
   * query {
   *   users(order_by: [{first: asc}, {last: desc}]) {
   *     first, last
   *   }
   * }
   * ```
   */
  constructor(fields: SortFields[]);
  constructor(fields: SortFields | SortFields[]) {
    if (Array.isArray(fields)) {
      this.fieldsArr = fields;
    } else {
      this.fieldsObj = fields;
    }
  }

  get(builder: Table, idx: number): StructureResult | undefined {
    const key = 'order_by';
    const param = `${key}_${idx}`;
    if (typeof this.fieldsArr !== 'undefined') {
      return {
        paramKey: param,
        paramType: `[${builder.table}_order_by!]`,
        query: `${key}:$${param}`,
        vars: this.fieldsArr,
        type: 'order',
      };
    } else if (typeof this.fieldsObj !== 'undefined') {
      return {
        paramKey: param,
        paramType: `[${builder.table}_order_by!]`,
        query: `${key}:$${param}`,
        vars: this.fieldsObj,
        type: 'order',
      };
    }
    return undefined;
  }

  clone() {
    if (Array.isArray(this.fieldsArr)) {
      return new Order(this.fieldsArr);
    } else if (typeof this.fieldsObj !== 'undefined') {
      return new Order(this.fieldsObj);
    }
    throw new Error('Invalid order by fields');
  }
}
