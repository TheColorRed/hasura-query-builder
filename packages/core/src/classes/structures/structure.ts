import { Table } from '../table';

export type StructureType =
  | 'cursor'
  | 'batch'
  | 'distinct'
  | 'limit'
  | 'objects'
  | 'offset'
  | 'on-conflict'
  | 'order'
  | 'primary'
  | 'raw'
  | 'select'
  | 'where';

export interface StructureResult {
  /** The query string. */
  query: string;
  /** The variable data. */
  vars: any;
  /** The param key without the leading "$". */
  paramKey: string | string[];
  /** The param data type. */
  paramType: string | string[];
  /** The type of structure. */
  type: StructureType;
}

export interface Structure {
  get(table: Table, idx: number): StructureResult | undefined;
}

export interface QueryBody {
  query: string;
  operationName?: string;
  variables?: object;
  connection?: string | 'default';
}

export interface BuildOptions {
  connection?: string;
  nested?: boolean;
  compact?: boolean;
  type?: 'query' | 'mutation' | 'subscription';
}

export interface BaseStructure {
  build(options?: BuildOptions): QueryBody;
}

export interface HasuraWhereComparison {
  /** Case sensitive comparison where value `a` equals value `b`. */
  _eq?: {};
  /** Case sensitive comparison where value `a` does not equals value `b`. */
  _neq?: {};
  /** Greater than comparison. */
  _gt?: number;
  /** Greater than or equal to comparison. */
  _gte?: number;
  /** Less than comparison. */
  _lt?: number;
  /** Less than or equal to comparison. */
  _lte?: number;
  /**
   * Case insensitive like comparison (use `%` for wild cards).
   * Can also be used for case insensitive `_eq`.
   */
  _ilike?: string;
  /**
   * Case insensitive not like comparison (use `%` for wild cards).
   * Can also be used for case insensitive `_neq`.
   */
  _nilike?: {};
  /**
   * Case sensitive like comparison (use `%` for wild cards).
   */
  _like?: string;
  /**
   * Case sensitive not like comparison (use `%` for wild cards).
   */
  _nlike?: string;
  /**
   * Compares if item is in an array of items.
   * @example
   * { first: { _in: ["Billy", "Bob", "Joe"] } }
   */
  _in?: (string | number)[];
  /**
   * Compares if item is not in an array of items.
   * @example
   * { first: { _nin: ["Billy", "Bob", "Joe"] } }
   */
  _nin?: (string | number)[];
  /**
   * Tests an item to see if it is null.
   * @example
   * { first: { _is_null: true } }
   * { first: { _is_null: false } }
   */
  _is_null?: boolean;
  /**
   * Tests if items are similar.
   * @example
   * // `first` name starts with `A` or `B`.
   * { first: { _similar: "(A|B)%" } }
   */
  _similar?: string;
  /**
   * Tests if items are not similar.
   * @example
   * // `first` name does not starts with `A` or `B`.
   * { first: { _similar: "(A|B)%" } }
   */
  _nsimilar?: string;
  /**
   * Tests for a case sensitive regular expression.
   */
  _regex?: string;
  /**
   * Tests for an case sensitive regular expression that does not match.
   */
  _nregex?: string;
  /**
   * Tests for a case insensitive sensitive regular expression.
   */
  _iregex?: string;
  /**
   * Tests for an case insensitive regular expression that does not match.
   */
  _niregex?: string;

  // [key: string]: IGraphQLWhere | {};

  _contains?: {};
  _contained_in?: {};
  _has_key?: {};
  _has_keys_any?: {};
  _has_keys_all?: {};

  _st_contains?: {};
  _st_crosses?: {};
  _st_equals?: {};
  _st_intersects?: {};
  _st_3d_intersects?: {};
  _st_overlaps?: {};
  _st_touches?: {};
  _st_within?: {};
  _st_d_within?: {};
  _st_3d_d_within?: {};
  _st_intersects_rast?: {};

  _ancestor?: {};
  _ancestor_any?: {};
  _descendant?: {};
  _descendant_any?: {};
  _matches?: {};
  _matches_any?: {};
  _matches_fulltext?: {};
}

export interface HasuraWhereJoin {
  _and?: HasuraWhere[];
  _not?: HasuraWhere | HasuraWhere[];
  _or?: HasuraWhere[];
}

export type HasuraWhere = {
  [key: string]: HasuraWhereComparison | {};
} & HasuraWhereJoin;
