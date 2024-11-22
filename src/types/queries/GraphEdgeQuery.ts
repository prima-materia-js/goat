import GraphViewer from '../../access_control/GraphViewer';
import PermissionEvaluator from '../../access_control/PermissionEvaluator';
import { TABLES } from '../../client/GoatDatabase';
import TypeRegistry from '../../client/TypeRegistry';
import { convertToUnderscore } from '../../utils/StringUtils';
import { GraphEdgeConfig } from '../GraphEdge';
import GraphType from '../GraphType';
import GraphIDQuery from './GraphIDQuery';

export type GraphEdgeQueryParams = {
  source: GraphType<any>;
  edgeName: string;
  edgeConfig: GraphEdgeConfig<any>;
  inverse?: boolean;
  inverseTypeName?: string;
};

class GraphEdgeQuery<TObjectType extends GraphType<any>> {
  private _viewer: GraphViewer | undefined;
  private _params: GraphEdgeQueryParams;

  constructor(viewer: GraphViewer | undefined, params: GraphEdgeQueryParams) {
    this._viewer = viewer;
    this._params = params;
  }

  private async _queryResults(): Promise<TObjectType[]> {
    const db = TypeRegistry.getDatabaseForType(this._params.source.TYPE_NAME);
    const Type = this._params.edgeConfig.connectedType as new () => TObjectType;
    const connectedTypeName = new Type().TYPE_NAME;

    if (
      this._params.edgeConfig.oneToOneEdge == true &&
      this._params.edgeConfig.connectedIDField != null
    ) {
      // Edge is stored in a field. Get the ID from the field and query the object.
      const connectedObjectID = this._params.source.get(
        this._params.edgeConfig.connectedIDField
      );
      if (connectedObjectID == null) return [];

      const objectQuery = new GraphIDQuery(
        () => new Type(),
        connectedObjectID.toString(),
        this._viewer
      );
      const result = await objectQuery.fetch();
      return result != null ? [result] : [];
    }

    const results = await db
      .objects(connectedTypeName)
      .innerJoin(
        TABLES.ASSOCIATIONS,
        this._params.inverse
          ? `${TABLES.ASSOCIATIONS}.id1`
          : `${TABLES.ASSOCIATIONS}.id2`,
        `${db.getTableNameForObject(connectedTypeName)}.id`
      )
      .where(this._params.inverse ? 'id2' : 'id1', this._params.source.getID())
      .andWhere('assoc_type_name', this._getEdgeKey(this._params.edgeName));

    return results
      .map((result) => {
        const obj = new Type();
        obj.initializeFromExistingData(
          result.id,
          result.data,
          result.creator_id,
          new Date(result.created_at),
          new Date(result.updated_at),
          this._viewer
        );

        return obj;
      })
      .filter((object) =>
        new PermissionEvaluator(object, 'read', this._viewer).canPerformAction()
      );
  }

  private _getEdgeKey(edgeName: string) {
    return `${convertToUnderscore(
      this._params.inverseTypeName != null
        ? this._params.inverseTypeName
        : this._params.source.TYPE_NAME
    )}__${edgeName.toString()}`;
  }

  then(resolve: (value: TObjectType[]) => void): void {
    this._queryResults().then(resolve);
  }

  async getFirst(): Promise<TObjectType | null> {
    const allResults = await this._queryResults();
    return allResults.length > 0 ? allResults[0] : null;
  }

  async getFirstN(n: number): Promise<TObjectType[]> {
    const allResults = await this._queryResults();
    return allResults.slice(0, n);
  }
}

export default GraphEdgeQuery;
