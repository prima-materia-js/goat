import GraphViewer from '../../access_control/GraphViewer';
import PermissionEvaluator, {
  Action,
} from '../../access_control/PermissionEvaluator';
import AllowIfSystemViewer from '../../access_control/rules/AllowIfSystemViewer';
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
      onCreate: [AllowIfSystemViewer, DenyEverytime],
      onQuery: [AllowIfSystemViewer, DenyEverytime],
      onUpdate: [AllowIfSystemViewer, DenyEverytime],
      onDelete: [AllowIfSystemViewer, DenyEverytime],
    };
  }
}

const ACTIONS: Action[] = ['create', 'delete', 'read', 'update'];

describe('AllowIfSystemViewer rule', () => {
  let object = new TestObject();

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

  test('fails with logged in users', () => {
    const viewer = new GraphViewer(true, '123456789', []);
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

  test('passes with system viewer', () => {
    const viewer = new SystemViewer();
    ACTIONS.forEach((action) => {
      const evaluator = new PermissionEvaluator(object, action, viewer);
      expect(evaluator.canPerformAction()).toBe(true);
      expect(() => {
        evaluator.enforceCanPerformAction();
      }).not.toThrow();
    });
  });
});
