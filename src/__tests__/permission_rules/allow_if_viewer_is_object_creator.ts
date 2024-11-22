import GraphViewer from '../../access_control/GraphViewer';
import PermissionEvaluator, {
  Action,
} from '../../access_control/PermissionEvaluator';
import AllowEverytime from '../../access_control/rules/AllowEverytime';

import AllowIfViewerIsObjectCreator from '../../access_control/rules/AllowIfViewerIsObjectCreator';
import DenyEverytime from '../../access_control/rules/DenyEverytime';
import SystemViewer from '../../access_control/SystemViewer';
import GraphType from '../../types/GraphType';

class TestObject extends GraphType<{}> {
  TYPE_NAME = 'test';
  getInitialValue() {
    return {};
  }

  getAccessRules() {
    return {
      onCreate: [AllowEverytime],
      onQuery: [AllowIfViewerIsObjectCreator, DenyEverytime],
      onUpdate: [AllowIfViewerIsObjectCreator, DenyEverytime],
      onDelete: [AllowIfViewerIsObjectCreator, DenyEverytime],
    };
  }
}

const ACTIONS: Action[] = ['delete', 'read', 'update'];

describe('AllowIfViewerIsObjectCreator rule', () => {
  let creator: GraphViewer;
  let object: TestObject;

  beforeEach(() => {
    creator = new GraphViewer(true, '123456789', []);
    object = TestObject.create(creator);
  });

  test('fails with logged out users', () => {
    const viewer = new GraphViewer(false, null, []);
    ACTIONS.forEach((action) => {
      const evaluator = new PermissionEvaluator(object, action, viewer);
      expect(evaluator.canPerformAction()).toBe(false);
      expect(() => {
        evaluator.enforceCanPerformAction();
      }).toThrow();
    });
  });

  test('fails with different logged in users', () => {
    const viewer = new GraphViewer(true, '987654321', []);
    ACTIONS.forEach((action) => {
      const evaluator = new PermissionEvaluator(object, action, viewer);
      expect(evaluator.canPerformAction()).toBe(false);
      expect(() => {
        evaluator.enforceCanPerformAction();
      }).toThrow();
    });
  });

  test('fails with no viewer', () => {
    ACTIONS.forEach((action) => {
      const evaluator = new PermissionEvaluator(object, action);
      expect(evaluator.canPerformAction()).toBe(false);
      expect(() => {
        evaluator.enforceCanPerformAction();
      }).toThrow();
    });
  });

  test('fails with system viewers', () => {
    const viewer = new SystemViewer();
    ACTIONS.forEach((action) => {
      const evaluator = new PermissionEvaluator(object, action, viewer);
      expect(evaluator.canPerformAction()).toBe(false);
      expect(() => {
        evaluator.enforceCanPerformAction();
      }).toThrow();
    });
  });

  test('passes with object creator', () => {
    ACTIONS.forEach((action) => {
      const evaluator = new PermissionEvaluator(object, action, creator);
      expect(evaluator.canPerformAction()).toBe(true);
      expect(() => {
        evaluator.enforceCanPerformAction();
      }).not.toThrow();
    });
  });
});
