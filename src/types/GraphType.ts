import DataType from '../data_types/DataType';
import { uuidv7 } from 'uuidv7';
import GraphViewer from '../access_control/GraphViewer';
import GoatDatabase, { TABLES } from '../client/GoatDatabase';
import TypeRegistry from '../client/TypeRegistry';
import { GraphEdgeConfig } from './GraphEdge';
import { convertToUnderscore } from '../utils/StringUtils';
import GraphSelectAllQuery from './queries/GraphSelectAllQuery';
import GraphIDQuery from './queries/GraphIDQuery';
import GraphIndexQuery, { IndexQuery } from './queries/GraphIndexQuery';
import Logger from '../utils/Logger';
import Rule from '../access_control/rules/Rule';
import PermissionEvaluator from '../access_control/PermissionEvaluator';
import GraphEdgeQuery from './queries/GraphEdgeQuery';

type Metadata = {
  id: string;
  created_time: Date;
  modified_time: Date;
  creator_id: string;
};

type EdgeData = {
  id1: string;
  id2: string;
  assoc_type_name: string;
  id2_type: string;
  creator_id: string | null | undefined;
  created_at: string;
  updated_at: string;
};

/**
 * A set of rules to be evaluated on each type of action.
 */
type AccessControlConfiguration = {
  /**
   * The rules to be evaluated when an object is created.
   */
  onCreate?: Rule[];

  /**
   * The rules to be evaluated when objects of this type are queried.
   */
  onQuery?: Rule[];

  /**
   * The rules to be evaluated when an existing object is updated.
   */
  onUpdate?: Rule[];

  /**
   * The rules to be evaluated when an existing object is deleted.
   */
  onDelete?: Rule[];
};

abstract class GraphType<
  TData,
  TEdges extends Record<string, GraphType<any>> = {}
> {
  abstract TYPE_NAME: string;
  protected metadata: Metadata;
  protected data: TData;
  private _isNewObject: boolean = false;
  private _mutableData: TData;
  private _dirtyFields: Array<keyof TData> = [];
  private _isDeleted: boolean = false;
  private _viewer?: GraphViewer;

  /**
   * Creates a new instance of this type.
   * @param viewer A GraphViewer representing the identity creating this object.
   * @param objectData The data being loaded into this object. You shouldn't have to set this.
   */
  constructor(
    viewer?: GraphViewer,
    objectData?: { data: TData; metadata: Metadata }
  ) {
    this._viewer = viewer;

    if (objectData == null) {
      this._isNewObject = true;

      const initialData = this.getInitialValue();
      this.data = initialData;
      this._mutableData = initialData;
      this.metadata = {
        id: uuidv7(),
        created_time: new Date(),
        modified_time: new Date(),
        creator_id: viewer?.getID() ?? '',
      };
    } else {
      this.data = objectData.data;
      this._mutableData = objectData.data;
      this.metadata = objectData.metadata;
    }
  }

  initializeFromExistingData(
    id: string,
    payload: string,
    creatorID: string,
    createdTime: Date,
    modifiedTime: Date,
    viewer?: GraphViewer
  ): this {
    this.data = JSON.parse(payload);
    this.metadata = {
      id,
      creator_id: creatorID,
      created_time: createdTime,
      modified_time: modifiedTime,
    };
    this._viewer = viewer;
    this._isNewObject = false;
    return this;
  }

  abstract getInitialValue(): TData;

  getValidators(): { [name: string]: DataType } {
    return {};
  }

  getEdgeConfigs(): { [K in keyof TEdges]: GraphEdgeConfig<TData> } {
    return {} as { [K in keyof TEdges]: GraphEdgeConfig<TData> };
  }

  getIndexedFields(): (keyof TData)[] {
    return [];
  }

  /**
   * Configure the access control rules to be evaluated when operations are performed on this type.
   */
  getAccessRules(): AccessControlConfiguration {
    return {};
  }

  private _getEdgeKey<Key extends keyof TEdges>(edgeName: Key) {
    return `${convertToUnderscore(this.TYPE_NAME)}__${edgeName.toString()}`;
  }

  /**
   * Adds edges between this object and another object. If the destination object has
   * unsaved changes, it will first be saved.
   * @param edgeName The name of the edge to create.
   * @param object The object to create an edge to.
   */
  async addEdge<Key extends keyof TEdges, EdgeType extends TEdges[Key]>(
    edgeName: Key,
    object: EdgeType
  ) {
    return await this.addEdges(edgeName, [object]);
  }

  /**
   * Adds edges between this object and the specified objects. If any of the destination objects have
   * unsaved changes, they will first be saved.
   * @param edgeName The name of the edge to create.
   * @param objects The objects to create edges to.
   */
  async addEdges<Key extends keyof TEdges, EdgeType extends TEdges[Key]>(
    edgeName: Key,
    objects: EdgeType[]
  ) {
    if (objects.length === 0) return;

    new PermissionEvaluator(
      this,
      'update',
      this._viewer
    ).enforceCanPerformAction();

    let isUndirectedEdge = false;
    const edgeConfig = this.getEdgeConfigs()[edgeName.toString()];
    if (edgeConfig.oneToOneEdge === true) {
      if (objects.length > 1) {
        throw new Error(
          `The edge ${edgeName.toString()} is defined as a one-to-one edge, but an attempt was made to add ${
            objects.length
          } edges.`
        );
      }

      const connectedIDField = edgeConfig.connectedIDField;
      if (connectedIDField != null) {
        // Store the edge's ID in a field
        // @ts-ignore Validate the type and field definition at runtime.
        await this.set(connectedIDField, objects[0]!.getID().toString()).save();
        return;
      } else {
        // Create an edge, but as this is a 1-1 edge, remove any existing edges of this type.
        await this._deleteAllEdgesOfType(edgeName);
      }
    }

    if (edgeConfig != null) {
      isUndirectedEdge = edgeConfig.undirected === true;
    }

    // Validate that undirected edges reference the same type
    if (
      isUndirectedEdge &&
      objects.some((object) => object.TYPE_NAME !== this.TYPE_NAME)
    ) {
      throw new Error(
        `The edge '${edgeName.toString()}' is undirected and must reference objects of the same type ('${
          this.TYPE_NAME
        }').'`
      );
    }

    // Apply changes to any unsaved objects
    const dirtyObjects = objects.filter((object) => object.hasUnsavedChanges());
    if (dirtyObjects.length > 0) {
      await Promise.all(
        dirtyObjects.map(async (object) => {
          await object.save();
        })
      );
    }

    // Create outbound edge from this object to the specified objects
    const ts = new Date();
    const db = TypeRegistry.getDatabaseForType(this.TYPE_NAME);
    const edgeData: EdgeData[] = [];
    objects.forEach((obj) => {
      edgeData.push({
        id1: this.getID(),
        id2: obj.getID(),
        assoc_type_name: this._getEdgeKey(edgeName),
        id2_type: obj.TYPE_NAME,
        creator_id: this._viewer?.getID(),
        created_at: ts.toJSON(),
        updated_at: ts.toJSON(),
      });

      if (isUndirectedEdge) {
        edgeData.push({
          id1: obj.getID(),
          id2: this.getID(),
          assoc_type_name: this._getEdgeKey(edgeName),
          id2_type: obj.TYPE_NAME,
          creator_id: this._viewer?.getID(),
          created_at: ts.toJSON(),
          updated_at: ts.toJSON(),
        });
      }
    });

    // TODO: Handle inverse edges

    await db.associations().insert(edgeData);
  }

  /**
   * Queries edges of a particular type from this object and returns connected objects.
   * @param edgeName The name of the edge type to query.
   */
  queryEdges<Key extends keyof TEdges, EdgeType extends TEdges[Key]>(
    edgeName: Key
  ): GraphEdgeQuery<EdgeType> {
    return new GraphEdgeQuery(this._viewer, {
      edgeConfig: this.getEdgeConfigs()[edgeName],
      edgeName: edgeName.toString(),
      source: this,
    });
  }

  static queryInverseOfEdge<
    T extends GraphType<any>,
    TConnectedType extends GraphType<any>
  >(
    this: new (viewer?: GraphViewer) => T,
    edgeName: string,
    connectedObject: TConnectedType,
    viewer?: GraphViewer
  ): GraphEdgeQuery<T> {
    const type = new this();
    const edgeConfig = (type.getEdgeConfigs() as any)[edgeName];
    if (edgeConfig == null) {
      throw new Error(
        `Edge '${edgeName}' not found on object type ${type.TYPE_NAME}.`
      );
    }

    return new GraphEdgeQuery(viewer, {
      edgeConfig,
      edgeName: edgeName.toString(),
      source: connectedObject,
      inverse: true,
      inverseTypeName: type.TYPE_NAME,
    });
  }

  /**
   * Deletes edges between this object and connected objects.
   * @param edgeName The name of the edge type to delete.
   * @param objects The connected objects to remove the edge for. Either the object or its ID can be passed here.
   * @param alsoDeleteObjects Whether to also delete the connected objects themselves in addition to deleting the edge. Defaults to false.
   */
  async deleteEdges<Key extends keyof TEdges, EdgeType extends TEdges[Key]>(
    edgeName: Key,
    objects: Array<EdgeType | string>,
    alsoDeleteObjects: boolean = false
  ) {
    new PermissionEvaluator(
      this,
      'update',
      this._viewer
    ).enforceCanPerformAction();

    if (objects.length == 0) return;

    const edgeConfig = this.getEdgeConfigs()[edgeName.toString()];
    const isUndirectedEdge = edgeConfig.undirected === true;
    const db = TypeRegistry.getDatabaseForType(this.TYPE_NAME);
    const Type = this.getEdgeConfigs()[edgeName].connectedType;

    const targetNodeIDs = objects.map((obj) => {
      if (obj.constructor.name === 'String') {
        return obj.toString();
      } else {
        return (obj as EdgeType).getID();
      }
    });

    if (
      edgeConfig.oneToOneEdge === true &&
      edgeConfig.connectedIDField != null
    ) {
      // Edge's connected object ID is stored in a field. Unset this field, optionally deleting the connected object.
      const connectedObjectID = this.get(edgeConfig.connectedIDField);
      if (
        connectedObjectID == null ||
        targetNodeIDs.includes(connectedObjectID.toString()) === false
      )
        return;

      if (alsoDeleteObjects) {
        await db
          .objects(new Type().TYPE_NAME)
          .where('id', connectedObjectID)
          .delete();
      }
      // @ts-ignore ID fields must be nullable strings.
      await this.set(edgeConfig.connectedIDField, null).save();
      return;
    }

    await db
      .associations()
      .whereIn('id2', targetNodeIDs)
      .andWhere('id1', this.getID())
      .andWhere('assoc_type_name', this._getEdgeKey(edgeName))
      .delete();

    if (isUndirectedEdge) {
      await db
        .associations()
        .whereIn('id1', targetNodeIDs)
        .andWhere('id2', this.getID())
        .andWhere('assoc_type_name', this._getEdgeKey(edgeName))
        .delete();
    }

    if (alsoDeleteObjects) {
      await db
        .objects(new Type().TYPE_NAME)
        .whereIn('id', targetNodeIDs)
        .delete();
    }
  }

  /**
   * Deletes an edge between this object and a connected object.
   * @param edgeName The name of the edge type to delete.
   * @param object The connected object to remove the edge for. Either the object or its ID can be passed here.
   * @param alsoDeleteObject Whether to also delete the connected object itself in addition to deleting the edge. Defaults to false.
   */
  async deleteEdge<Key extends keyof TEdges, EdgeType extends TEdges[Key]>(
    edgeName: Key,
    object: EdgeType | string,
    alsoDeleteObject: boolean = false
  ) {
    return await this.deleteEdges(edgeName, [object], alsoDeleteObject);
  }

  private async _deleteAllEdgesOfType<Key extends keyof TEdges>(edgeName: Key) {
    const db = TypeRegistry.getDatabaseForType(this.TYPE_NAME);
    await db
      .associations()
      .andWhere('id1', this.getID())
      .andWhere('assoc_type_name', this._getEdgeKey(edgeName))
      .delete();
  }

  /**
   * Get the ID of this object.
   */
  getID() {
    return this.metadata.id;
  }

  /**
   * Gets metadata about this object.
   */
  getMetadata<Key extends keyof Metadata>(key: Key) {
    return this.metadata[key];
  }

  /**
   * Gets the value of a field in this object.
   * @param key The name of the field.
   * @param includeUnsavedChanges Whether to return changes that have been made to fields using `set()` before saving.
   */
  get<Key extends keyof TData>(
    key: Key,
    includeUnsavedChanges: boolean = false
  ) {
    if (this._isDeleted) {
      throw new Error(`Object with ID '${this.getID()}' has been deleted.`);
    }

    return this._dirtyFields.includes(key) && includeUnsavedChanges
      ? this._mutableData[key]
      : this.data[key];
  }

  set<Key extends keyof TData, Value extends TData[Key]>(
    key: Key,
    value: Value
  ): this {
    if (this._isDeleted) {
      throw new Error(`Object with ID '${this.getID()}' has been deleted.`);
    }

    const validator = this.getValidators()[key.toString()];
    if (validator != null) {
      if (!validator.isValid(value)) {
        throw new Error(
          `[GOAT] Validation error: Value '${value}' is not valid for field '${key.toString()}'.`
        );
      }
    }

    this._mutableData[key] = value;
    this._dirtyFields.push(key);
    return this;
  }

  /**
   * Whether this object has unsaved changes.
   */
  hasUnsavedChanges() {
    return this._isNewObject || this._dirtyFields.length > 0;
  }

  /**
   * Gets the names of fields that have been modified but not saved.
   */
  getModifiedFields() {
    return this._dirtyFields;
  }

  _debugMutationData() {
    if (this._dirtyFields.length === 0) {
      console.log('No modified data');
    }

    console.log(`Modified data: ${JSON.stringify(this._mutableData)}`);
  }

  /**
   * Creates a new instance of this type.
   * @param viewer A GraphViewer representing the identity creating this object.
   */
  static create<T extends GraphType<any>>(
    this: new (viewer?: GraphViewer) => T,
    viewer?: GraphViewer
  ): T {
    return new this(viewer);
  }

  /**
   * Used to create an instance of this object from a database row.
   * @ignore This is meant for internal use only!
   */
  static _createFromRawData<T extends GraphType<any>>(
    this: new () => T,
    result: any
  ): T {
    const obj = new this();
    obj.data = JSON.parse(result.data);
    obj.metadata = {
      id: result.id,
      creator_id: result.creator_id,
      created_time: new Date(result.created_at),
      modified_time: new Date(result.updated_at),
    };

    return obj;
  }

  /**
   * Saves any unsaved changes made to this object's fields.
   */
  async save(): Promise<this> {
    if (this._isDeleted) {
      throw new Error(`Object with ID '${this.getID()}' has been deleted.`);
    }

    const payload = { ...this.data };
    this._dirtyFields.forEach((field) => {
      payload[field] = this._mutableData[field];
    });

    if (this._isNewObject) {
      new PermissionEvaluator(
        this,
        'create',
        this._viewer
      ).enforceCanPerformAction();

      await this.onBeforeCreate(this._viewer, { ...payload });
    } else {
      new PermissionEvaluator(
        this,
        'update',
        this._viewer
      ).enforceCanPerformAction();

      await this.onBeforeUpdate(this._viewer, { ...payload });
    }

    const db = TypeRegistry.getDatabaseForType(this.TYPE_NAME);

    // Recompute the payload in case things have been changed in events
    this._dirtyFields.forEach((field) => {
      payload[field] = this._mutableData[field];
    });

    let isCreation = false;
    if (this._isNewObject) {
      isCreation = true;
      await this._saveNew(db, payload);
    } else {
      await this._saveExisting(db, payload);
    }

    this._isNewObject = false;
    this.data = payload;
    this._dirtyFields = [];

    await this._createIndexes(db);

    if (isCreation) {
      await this.onAfterCreate(this._viewer);
    } else {
      await this.onAfterUpdate(this._viewer);
    }

    return this;
  }

  private async _saveNew(db: GoatDatabase, payload: TData) {
    const ts = new Date();
    this.metadata.created_time = ts;
    this.metadata.modified_time = ts;

    await db.objects(this.TYPE_NAME).insert({
      id: this.metadata.id,
      type_name: this.TYPE_NAME,
      visibility: 1,
      creator_id: this.metadata.creator_id,
      data: JSON.stringify(payload),
      created_at: this.metadata.created_time.toJSON(),
      updated_at: this.metadata.modified_time.toJSON(),
    });
  }

  private async _saveExisting(db: GoatDatabase, payload: TData) {
    this.metadata.modified_time = new Date();

    await db
      .objects(this.TYPE_NAME)
      .update({
        data: JSON.stringify(payload),
        updated_at: this.metadata.modified_time.toJSON(),
      })
      .where('id', this.getID());
  }

  private async _createIndexes(db: GoatDatabase) {
    const indexedFields = this.getIndexedFields();
    if (indexedFields.length === 0) return;

    await Promise.all(
      indexedFields.map(async (index) => await this._createIndex(index, db))
    );
  }

  private async _createIndex(index: keyof TData, db: GoatDatabase) {
    await this._deleteIndex(index, db);
    const tableName = `index__${convertToUnderscore(
      this.TYPE_NAME
    )}__${index.toString()}`;
    await db.table(tableName).insert({
      key: this.get(index),
      id: this.getID(),
    });
  }

  private async _deleteIndex(index: keyof TData, db: GoatDatabase) {
    const tableName = `index__${convertToUnderscore(
      this.TYPE_NAME
    )}__${index.toString()}`;
    await db.table(tableName).where('id', this.getID()).delete();
  }

  /**
   * Gets an object by its ID. Throws an error if an object with this ID doesn't exist.
   * Use `queryByID` if you want to return a null value on non-existent IDs.
   */
  static async getByID<T extends GraphType<any>>(
    this: new () => T,
    id: string,
    viewer?: GraphViewer
  ): Promise<T> {
    const query = new GraphIDQuery<T>(() => new this(), id, viewer);
    const result = await query.fetch();
    if (result == null) {
      throw new Error(
        `No valid object of type ${query.getTypeName()} found with ID '${id}'.`
      );
    }

    return result;
  }

  /**
   * Gets an object by its ID. Returns null if an object with this ID doesn't exist.
   * Use `getByID` if you want to throw an error on non-existent IDs.
   */
  static async queryByID<T extends GraphType<any>>(
    this: new () => T,
    id: string,
    viewer?: GraphViewer
  ): Promise<T | null> {
    const query = new GraphIDQuery<T>(() => new this(), id, viewer);
    return await query.fetch();
  }

  /**
   * Queries all objects of this type.
   *
   * **Warning:** This is potentially a very expensive operation. Use sparingly, if at all. Consider alternative approaches, such as index-based queries.
   */
  static async queryAll<T extends GraphType<any>>(
    this: new () => T,
    viewer?: GraphViewer
  ): Promise<Array<T>> {
    const query = new GraphSelectAllQuery<T>(() => new this(), viewer);
    return await query.fetch();
  }

  static async queryBy<T extends GraphType<any>, TData>(
    this: new () => T,
    field: keyof TData,
    query: IndexQuery,
    viewer?: GraphViewer
  ): Promise<Array<T>> {
    const inst = new this();
    if (!inst.getIndexedFields().includes(field)) {
      throw new Error(
        `Querying by field '${field.toString()}' on type '${
          inst.TYPE_NAME
        }' is not supported as this is not an indexed field. To query by a field, create an index by adding it in the getIndexedFields() method.`
      );
    }

    const indexQuery = new GraphIndexQuery(
      () => new this(),
      field.toString(),
      query,
      viewer
    );
    return await indexQuery.fetch();
  }

  /**
   * Deletes an object from the database by its ID.
   * @param id The ID of the object to be deleted.
   * @param viewer A GraphViewer representing the identity performing the deletion.
   */
  static async deleteWithID<T extends GraphType<any>>(
    this: new () => T,
    id: string,
    viewer?: GraphViewer
  ) {
    const obj = await new GraphIDQuery<T>(() => new this(), id, viewer).fetch();
    if (obj == null) return;

    await obj.delete();
  }

  /**
   * Deletes this object from the database. You will not be able to interact with this object after it's deleted.
   */
  async delete() {
    if (this._isNewObject) {
      return;
    }

    new PermissionEvaluator(
      this,
      'delete',
      this._viewer
    ).enforceCanPerformAction();

    await this.onBeforeDelete(this._viewer);

    const db = TypeRegistry.getDatabaseForType(this.TYPE_NAME);
    await db
      .objects(this.TYPE_NAME)
      .where({
        id: this.getID(),
        type_name: this.TYPE_NAME,
      })
      .del();

    const indexes = this.getIndexedFields();
    await Promise.all(
      indexes.map(async (index) => {
        const tableName = `index__${convertToUnderscore(
          this.TYPE_NAME
        )}__${index.toString()}`;
        await db.table(tableName).where('id', this.getID()).delete();
      })
    );

    this.data = this.getInitialValue();
    this._dirtyFields = [];
    this._mutableData = this.data;
    this._isDeleted = true;
  }

  async onBeforeCreate(viewer: GraphViewer | undefined, changeset: TData) {}

  async onAfterCreate(viewer: GraphViewer | undefined) {}

  async onBeforeUpdate(viewer: GraphViewer | undefined, changeset: TData) {}

  async onAfterUpdate(viewer: GraphViewer | undefined) {}

  async onBeforeDelete(viewer: GraphViewer | undefined) {}
}

export default GraphType;
