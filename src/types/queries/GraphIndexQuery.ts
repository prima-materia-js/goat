import { Knex } from 'knex';
import type GraphType from '../GraphType';
import GraphObjectQuery from './GraphObjectQuery';
import { convertToUnderscore } from '../../utils/StringUtils';
import GoatDatabase, { TABLES } from '../../client/GoatDatabase';
import GraphViewer from '../../access_control/GraphViewer';

export type IndexQuery = {
  operation: '==' | 'in_array' | 'in_range' | 'like';
  value: any;
};

class GraphIndexQuery<
  TObjectType extends GraphType<any>
> extends GraphObjectQuery<TObjectType, TObjectType[]> {
  index: string;
  indexQuery: IndexQuery;

  constructor(
    objectConstructor: () => TObjectType,
    index: string,
    indexQuery: IndexQuery,
    viewer?: GraphViewer
  ) {
    super(objectConstructor, viewer);

    this.index = index;
    this.indexQuery = indexQuery;
  }

  constructQuery(): Knex.QueryBuilder<any, any> {
    const indexTable = `index__${convertToUnderscore(this.getTypeName())}__${
      this.index
    }`;
    const query = this.getBaseTypeQuery().innerJoin(
      indexTable,
      `${this.getDatabase().getTableNameForObject(this.getTypeName())}.id`,
      `${indexTable}.id`
    );

    switch (this.indexQuery.operation) {
      case '==':
        query.where('key', this.indexQuery.value);
        break;
      case 'in_array':
        query.whereIn('key', this.indexQuery.value);
        break;
      case 'in_range':
        query.whereBetween('key', this.indexQuery.value);
        break;
      case 'like':
        query.whereLike('key', this.indexQuery.value);
        break;
    }

    return query;
  }

  getFinalResult(results: TObjectType[]): TObjectType[] {
    return results;
  }
}

export default GraphIndexQuery;
