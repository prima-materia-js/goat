import GoatDatabase, { GoatDatabaseConfig } from './client/GoatDatabase';
import { LogLevel } from './utils/Logger';
import GraphType from './types/GraphType';
import { GraphEdgeConfig } from './types/GraphEdge';

import Types from './data_types';
import DataType from './data_types/DataType';

import Rules from './access_control/rules/Rules';
import Rule from './access_control/rules/Rule';
import GraphViewer from './access_control/GraphViewer';
import SystemViewer from './access_control/SystemViewer';

const lib = {
  GoatDatabase,
  GraphType,
  Types,
  DataType,
  Rules,
  GraphViewer,
  SystemViewer,
  LogLevel,
};
export default lib;

export {
  GoatDatabase,
  GoatDatabaseConfig,
  GraphType,
  GraphEdgeConfig,
  Types,
  DataType,
  Rules,
  Rule,
  GraphViewer,
  SystemViewer,
  LogLevel,
};
