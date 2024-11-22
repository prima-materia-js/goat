import type GraphType from './GraphType';

export type GraphEdgeConfig<TData> = {
  connectedType: new () => GraphType<any>;

  undirected?: boolean;

  oneToOneEdge?: boolean;

  connectedIDField?: keyof TData;
};
