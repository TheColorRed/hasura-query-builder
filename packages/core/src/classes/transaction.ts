import { Observable } from 'rxjs';
import { request } from '../functions/http-request';
import { BaseModel } from './base-model';
import { QueryBuilder } from './query-builder';
import { QueryBody, QueryOptions } from './structures/structure';

export class Transaction {
  /**
   * Creates a transaction to be used with multiple models.
   * @param models The models to use for the transaction.
   */
  static create<T extends BaseModel>(...models: (T | undefined)[]) {
    const baseModels = models.filter(q => typeof q !== 'undefined') as BaseModel[];
    baseModels.forEach(q => q['setTableInformation'](q['tableRef']));
    const result = new QueryBuilder({ tables: baseModels.map(q => q['tableRef']), type: 'transaction' });
    return new Transaction(result.build());
  }

  private constructor(private readonly queryBody: QueryBody) {}
  /**
   * Commits the transaction.
   * @param queryOptions The options to use for the query.
   */
  commit<T extends BaseModel, U = Observable<T> | Observable<{ id: string; data: T }>>(queryOptions?: QueryOptions) {
    return request(this.queryBody, queryOptions) as U;
  }
}
