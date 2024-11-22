import type GraphType from '../types/GraphType';
import Logger from '../utils/Logger';
import GraphViewer from './GraphViewer';
import Rule from './rules/Rule';

export type Action = 'create' | 'read' | 'update' | 'delete';

class PermissionEvaluator {
  viewer: GraphViewer;
  action: Action;
  object: GraphType<any>;
  rules: Rule[];

  constructor(object: GraphType<any>, action: Action, viewer?: GraphViewer) {
    this.viewer = viewer ?? new GraphViewer(false, null, []);
    this.object = object;
    this.action = action;

    switch (action) {
      case 'create':
        this.rules = object.getAccessRules().onCreate ?? [];
        break;
      case 'read':
        this.rules = object.getAccessRules().onQuery ?? [];
        break;
      case 'update':
        this.rules = object.getAccessRules().onUpdate ?? [];
        break;
      case 'delete':
        this.rules = object.getAccessRules().onDelete ?? [];
        break;
    }
  }

  canPerformAction(): boolean {
    if (this.rules.length === 0) return true;

    for (let i = 0; i < this.rules.length; i++) {
      const decision = this.rules[i](this.viewer, this.object);
      Logger.debug(
        `Permission evaluation for '${
          this.action
        }' on '${this.object.getID()}': Rule ${i} = ${decision ?? 'skip'}`
      );
      if (decision != null) {
        return decision;
      }
    }

    return true;
  }

  enforceCanPerformAction() {
    if (!this.canPerformAction()) {
      throw new Error(
        `Insufficient permission: Viewer with ID ${
          this.viewer?.getID() ?? 'null'
        } cannot perform action ${this.action} on type ${
          this.object.constructor.name
        }.`
      );
    }
  }
}

export default PermissionEvaluator;
