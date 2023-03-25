import { Table } from '../../table';
import { HasuraWhere, Structure, StructureResult } from '../structure';

export type WhereGroup = (builder: Table) => Table;

export class Where implements Structure {
  constructor(private readonly where: HasuraWhere) {}
  get(table: Table, idx: number): StructureResult {
    const key = 'where';
    const param = `${key}_${idx}`;
    return {
      query: `where:$${key}_${idx}`,
      vars: this.where,
      paramKey: param,
      paramType: Where.getTableParamType(table),
      type: 'where',
    };
  }

  static toResult(table: Table, idx: number) {
    if (table.wheres.length === 0) return {};
    return {
      type: 'where',
      paramType: Where.getTableParamType(table),
      paramKey: `where_${idx}`,
      vars: (table.wheres.map(s => s.get(table, idx).vars) ?? []).reduce((acc, val) => Object.assign(acc, val), {}),
    };
  }

  static getTableParamType(table: Table) {
    return table.table.replace(/_aggregate$/, '') + '_bool_exp!';
  }
}

export class WhereOr implements Structure {
  /**
   *
   * @param callback The callback to execute.
   * @param table A temporary table to store the where clause without anything else.
   */
  constructor(private readonly callback: WhereGroup, private readonly table: Table) {}
  get(table: Table, idx: number): StructureResult {
    this.table.wheres = [];
    const r = this.callback(this.table);

    const where = { _or: [] } as { _or: any[] };
    r.wheres.map(w => w.get(table, idx)).forEach(itm => where._or.push(itm.vars));

    const key = 'where';
    const param = `${key}_${idx}`;
    return {
      query: `where:$${key}_${idx}`,
      vars: where,
      paramKey: param,
      paramType: Where.getTableParamType(table),
      type: 'where',
    };
  }
}

export class WhereAnd implements Structure {
  constructor(private readonly callback: WhereGroup, private readonly table: Table) {}
  get(table: Table, idx: number): StructureResult {
    this.table.wheres = [];
    const r = this.callback(this.table);

    const where = { _and: [] } as { _and: any[] };
    r.wheres.map(w => w.get(table, idx)).forEach(itm => where._and.push(itm.vars));

    const key = 'where';
    const param = `${key}_${idx}`;
    return {
      query: `where:$${key}_${idx}`,
      vars: where,
      paramKey: param,
      paramType: Where.getTableParamType(table),
      type: 'where',
    };
  }
}
