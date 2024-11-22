import knex from 'knex';
import TypeRegistry from '../../client/TypeRegistry';
import type GraphType from '../GraphType';
import type GoatDatabase from '../../client/GoatDatabase';
import GraphViewer from '../../access_control/GraphViewer';
import PermissionEvaluator from '../../access_control/PermissionEvaluator';

abstract class GraphObjectQuery<
  TObjectType extends GraphType<any>,
  TResult = TObjectType | null | TObjectType[]
> {
  protected getOnlyFirstResult: boolean = false;
  objectConstructor: () => TObjectType;
  private _viewer?: GraphViewer;

  constructor(objectConstructor: () => TObjectType, viewer?: GraphViewer) {
    this.objectConstructor = objectConstructor;
    this._viewer = viewer;
  }

  abstract constructQuery(): knex.Knex.QueryBuilder;

  abstract getFinalResult(results: TObjectType[]): TResult;

  getTypeName(): string {
    return this.objectConstructor().TYPE_NAME;
  }

  protected getDatabase(): GoatDatabase {
    return TypeRegistry.getDatabaseForType(this.getTypeName());
  }

  getBaseTypeQuery(): knex.Knex.QueryBuilder {
    const typeName = this.getTypeName();
    return TypeRegistry.getDatabaseForType(typeName)
      .objects(typeName)
      .where('type_name', typeName);
  }

  private applyPermissionRuleFilter(results: TObjectType[]): TObjectType[] {
    return results.filter((object) =>
      new PermissionEvaluator(object, 'read', this._viewer).canPerformAction()
    );
  }

  async fetch(): Promise<TResult> {
    const query = this.constructQuery();
    const results = await query;

    let resultObjects = results.map((result: any) =>
      this.objectConstructor().initializeFromExistingData(
        result.id,
        result.data,
        result.creator_id,
        new Date(result.created_at),
        new Date(result.updated_at),
        this._viewer
      )
    );
    resultObjects = this.applyPermissionRuleFilter(resultObjects);

    return this.getFinalResult(resultObjects);
  }
}

export default GraphObjectQuery;
