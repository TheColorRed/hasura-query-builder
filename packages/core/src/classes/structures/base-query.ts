import { Table } from '../table';
import { Where } from './sections/where';
import { BuildOptions, QueryBody, StructureResult } from './structure';

export interface QueryParam {
  /** The param var for the query. */
  param: string | string[];
  /** The variable name in the variables. */
  var: string | string[];
  /** The type of variable. */
  type: string | string[];
  /** The data to be sent. */
  data: any;
}

export abstract class BaseQuery {
  constructor(protected readonly tables: Table[], protected readonly operation: string = '') {}
  /**
   * @internal
   * Build the query.
   * @param builder The table builder.
   * @param idx The index of the table in the query.
   */
  tableData(builder: Table, idx: number) {
    const select = builder.selects.map(s => s.get().query).join(',');
    const primaryKey = builder.primaryKey?.get(builder, idx);
    const where = builder.wheres.map(s => s.get(builder, idx));
    const order = builder.orders?.get(builder, idx);
    const limit = builder.limits?.get(builder, idx);
    const offset = builder.offsets?.get(builder, idx);
    const distinct = builder.distinctOpts?.get(builder, idx);
    const objects = builder.model?.records?.get(builder, idx);
    const conflict = builder.model?.conflict?.get(builder, idx);
    const cursor = builder.cursors?.get(builder, idx);
    const batch = builder.batchSize?.get(builder, idx);
    const tblParams = builder.procedureParameters?.get(builder, idx);

    const pkOrWhere = typeof primaryKey !== 'undefined' ? primaryKey.query : where?.[idx]?.query ?? '';

    const whereParams = [
      objects?.query,
      conflict?.query,
      limit?.query,
      offset?.query,
      distinct?.query,
      pkOrWhere,
      order?.query,
      cursor?.query,
      batch?.query,
      tblParams?.query,
    ].filter(param => typeof param === 'string' && param.length > 0);

    const tableParams = whereParams.join('')?.length > 0 ? `(${whereParams.join(',')})` : '';

    return {
      select,
      tableParams,
    };
  }
  /**
   * Get query parameter information.
   */
  protected rootQueryParamsList(): QueryParam[][] {
    return this.tables.map((builder, idx) => {
      return (
        [
          // A where can be added to a query many times unlike the others, so we access it differently.
          Where.toResult(builder, idx),
          builder.primaryKey?.get(builder, idx),
          builder.limits?.get(builder, idx),
          builder.offsets?.get(builder, idx),
          builder.orders?.get(builder, idx),
          builder.distinctOpts?.get(builder, idx),
          builder.model?.records?.get(builder, idx),
          builder.model?.conflict?.get(builder, idx),
          builder.cursors?.get(builder, idx),
          builder.batchSize?.get(builder, idx),
          builder.procedureParameters?.get(builder, idx),
        ]
          // Remove the structures that are undefined aka they are not a StructureResult.
          .filter((i): i is StructureResult => typeof i !== 'undefined' && Object.keys(i).length > 0)
          .map(itm => {
            let param: string | string[] =
              typeof itm.paramKey === 'string' ? `$${itm.paramKey}` : itm.paramKey.map(i => `$${i}`);
            if (itm.type === 'where' && Object.keys(itm).length > 0) param = `$where_${idx}`;
            else if (itm.type === 'primary')
              param = typeof itm.paramKey === 'string' ? `$${itm.paramKey}` : itm.paramKey.map(i => `$${i}`);

            return {
              param: param,
              var: itm.paramKey,
              type: itm.paramType,
              data: itm.vars,
            };
          })
      );
    });
  }
  /**
   * Get the root variables string and the parameters object to go with it.
   * @example
   * {
   *   queryParamsString: '($where_0:users_bool_exp,$limit_0:Int)',
   *   queryParamsVariables: { where_0: { first: { _eq: 'Billy' } }, limit_0: 10 }
   * }
   */
  protected getRootQueryParamsInfo() {
    const queryParams = this.rootQueryParamsList();
    const queryParamsString = queryParams
      .map(query =>
        query.map(param => {
          if (typeof param.param === 'string') return `${param.param}:${param.type}`;
          else if (Array.isArray(param.param))
            return param.param.map((val, idx) => `${val}:${param.type[idx]}`).join(',');
          return '';
        })
      )
      .filter(param => param.length > 0)
      .join(',');
    const queryParamsVariables = queryParams.reduce<{ [key: string]: any }>((acc, val) => {
      val.forEach(p => {
        if (typeof p.var === 'string') acc[p.var] = p.data;
        else acc = { ...acc, ...p.data };
      });
      return acc;
    }, {});

    return { queryParamsString: queryParamsString.length > 0 ? `(${queryParamsString})` : '', queryParamsVariables };
  }
  /**
   * Compacts the string by removing 2+ spaces.
   * @param query The query string.
   * @param compact Whether or not to compact the string.
   */
  protected compact(query: string, compact: boolean) {
    if (!compact) return query;
    return query.replace(/\s\s+/g, '');
  }
  /**
   * Get the query body.
   * @param prefix The prefix to add to the query.
   * @param query The query to create.
   * @param queryParamsVariables The variables to add to the query.
   * @param options The options to use.
   */
  protected getQueryBody(
    prefix: string,
    query: (builder: Table, idx: number) => string,
    queryParamsVariables: {
      [key: string]: any;
    },
    options?: BuildOptions
  ): QueryBody {
    return {
      ...(this.operation && { operationName: this.operation }),
      query: this.compact(
        `${prefix}
          ${this.tables.map(query).join(',')}
        ${prefix.length > 0 ? '}' : ''}`,
        options?.compact ?? true
      ),
      variables: queryParamsVariables,
      // connection: options?.connection ?? 'default',
      queryOptions: options?.queryOptions,
    };
  }
}
