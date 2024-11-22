import type GoatDatabase from './GoatDatabase';
import type GraphType from '../types/GraphType';

class TypeRegistry {
  static dbregistry: {
    [type: string]: GoatDatabase;
  } = {};

  static registerDatabase(typeName: string, database: GoatDatabase) {
    TypeRegistry.dbregistry[typeName] = database;
  }

  static getDatabaseForType(typeName: string): GoatDatabase {
    const db = TypeRegistry.dbregistry[typeName];
    if (db == null) {
      throw new Error(`Type ${typeName} is not registered.`);
    }

    return db;
  }
}

export default TypeRegistry;
