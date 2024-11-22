import knex from 'knex';
import GraphType from '../types/GraphType';
import TypeRegistry from './TypeRegistry';
import { convertToUnderscore } from '../utils/StringUtils';
import Logger, { LogLevel } from '../utils/Logger';

export type StorageMode = 'single_table' | 'multi_table';

/**
 * Configuration for the GOAT database.
 */
export type GoatDatabaseConfig = {
  /**
   * The storage layer to use for this database. Use [Knex connection settings](https://knexjs.org/guide/#configuration-options).
   */
  storage: knex.Knex.Config;

  /**
   * The types this database supports. Types should extend the GraphType class.
   */
  types: (new (...args: any[]) => GraphType<any>)[];

  /**
   * How objects should be stored in the database. Set this to 'single_table' (the default) to store all objects in a single database table. Use
   * 'multi_table' to store objects in multiple type-specific tables. The latter can be useful if you need to export or query objects of specific types
   * without using GOAT.
   */
  storageMode?: StorageMode;

  /**
   * The minimum severity level at which to print logs to the console. Available levels are (from highest to lowest) Error, Warning, Info and Debug.
   * Defaults to Error.
   */
  minimumLogLevel?: LogLevel;
};

export const TABLES = {
  OBJECTS: 'objects',
  ASSOCIATIONS: 'associations',
};

/**
 * A GOAT database instance.
 */
class GoatDatabase {
  private _config: GoatDatabaseConfig;
  private _db: knex.Knex | null = null;
  private _storageMode: StorageMode;
  graph: { [key: string]: new (...args: any[]) => GraphType<any> } = {};

  constructor(config: GoatDatabaseConfig) {
    this._config = config;
    this._storageMode = config.storageMode ?? 'single_table';
    Logger.initializeLogging(config.minimumLogLevel ?? LogLevel.Error);
  }

  /**
   * Initialises the graph database, creating any necessary tables. Run this method before performing any other operations.
   */
  async initialise() {
    this._config.types.forEach((type) => {
      this._registerType(type);
    });

    this._db = knex(this._config.storage);

    await this._createDefaultTables();
    await this._createIndexTables();
    if (this._storageMode === 'multi_table') {
      await this._createTypeSpecificTables();
    }
  }

  async closeDatabaseConnection() {
    this._db?.destroy();
  }

  private async _createTableIfNotExists(
    tableName: string,
    builder: (table: knex.Knex.CreateTableBuilder) => any
  ) {
    if (this._db == null) {
      throw new Error(
        'Goat database has not yet been initialised. Ensure you have configured a valid storage layer.'
      );
    }

    const tableExists = await this._db.schema.hasTable(tableName);
    if (!tableExists) {
      await this._db.schema.createTable(tableName, builder);
      Logger.info(`Created database table: ${tableName}`);
    } else {
      Logger.debug(`✓ Required table exists: ${tableName}`);
    }
  }

  private async _createDefaultTables() {
    await this._createTableIfNotExists(TABLES.OBJECTS, (table) => {
      table.string('id', 128).primary();
      table.unique('id');
      table.string('type_name', 128);
      table.integer('visibility');
      table.string('creator_id', 128);
      table.text('data');
      table.timestamps();
    });

    await this._createTableIfNotExists(TABLES.ASSOCIATIONS, (table) => {
      table.string('id1', 128);
      table.index('id1');
      table.string('id2', 128);
      table.index('id2');
      table.string('assoc_type_name', 128);
      table.string('id2_type', 128);
      table.string('creator_id', 128);
      table.timestamps();
    });
  }

  private async _createIndexTables() {
    return await Promise.all(
      Object.keys(this.graph).map(
        async (typeName) =>
          await this._createIndexTablesForType(new this.graph[typeName]())
      )
    );
  }

  private async _createTypeSpecificTables() {
    return await Promise.all(
      Object.keys(this.graph).map(
        async (typeName) =>
          await this._createTableIfNotExists(typeName, (table) => {
            table.string('id', 128).primary();
            table.unique('id');
            table.string('type_name', 128);
            table.integer('visibility');
            table.string('creator_id', 128);
            table.text('data');
            table.timestamps();
          })
      )
    );
  }

  private async _createIndexTablesForType(type: GraphType<any>) {
    if (this._db == null) return;

    const indexes = type.getIndexedFields();
    if (indexes.length === 0) return;

    await Promise.all(
      indexes.map(async (index) => {
        return await this._createTableIfNotExists(
          `index__${convertToUnderscore(type.TYPE_NAME)}__${index.toString()}`,
          (table) => {
            table.text('key');
            table.index('key');
            table.string('id', 128);
          }
        );
      })
    );
  }

  table(tableName: string) {
    if (this._db == null) {
      throw new Error(
        'Goat database has not yet been initialised. Ensure you have configured a valid storage layer and called the initialise() function.'
      );
    }

    return this._db(tableName);
  }

  getTableNameForObject(typeName: string) {
    return this._storageMode === 'single_table' ? TABLES.OBJECTS : typeName;
  }

  objects(typeName: string) {
    return this.table(this.getTableNameForObject(typeName));
  }

  associations() {
    return this.table(TABLES.ASSOCIATIONS);
  }

  /**
   * Register an object type on the graph.
   * @param type The type class (extending GraphType) that you want to register.
   */
  private _registerType<TData, T extends GraphType<TData>>(
    type: new (...args: any[]) => T
  ) {
    const typeName = new type().TYPE_NAME;
    this.graph[typeName] = type;
    TypeRegistry.registerDatabase(typeName, this);
    Logger.info(`Registered type: ${typeName}`);
  }
}

export default GoatDatabase;
