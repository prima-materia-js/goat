import { Knex } from 'knex';
import type GraphType from '../GraphType';
import GraphObjectQuery from './GraphObjectQuery';
import GraphViewer from '../../access_control/GraphViewer';

class GraphIDQuery<TObjectType extends GraphType<any>> extends GraphObjectQuery<
  TObjectType,
  TObjectType | null
> {
  id: string;
  protected getOnlyFirstResult: boolean = true;

  constructor(
    objectConstructor: () => TObjectType,
    id: string,
    viewer?: GraphViewer
  ) {
    super(objectConstructor, viewer);

    this.id = id;
  }

  constructQuery(): Knex.QueryBuilder<any, any> {
    return this.getBaseTypeQuery().where('id', this.id);
  }

  getFinalResult(results: TObjectType[]): TObjectType | null {
    return results.length > 0 ? results[0] : null;
  }
}

export default GraphIDQuery;
