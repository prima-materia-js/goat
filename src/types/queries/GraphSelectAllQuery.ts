import { Knex } from 'knex';
import type GraphType from '../GraphType';
import GraphObjectQuery from './GraphObjectQuery';

class GraphSelectAllQuery<
  TObjectType extends GraphType<any>
> extends GraphObjectQuery<TObjectType, TObjectType[]> {
  constructQuery(): Knex.QueryBuilder<any, any> {
    return this.getBaseTypeQuery();
  }

  getFinalResult(results: TObjectType[]): TObjectType[] {
    return results;
  }
}

export default GraphSelectAllQuery;
