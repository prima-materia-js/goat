import GraphViewer from '../../access_control/GraphViewer';
import PermissionEvaluator, {
  Action,
} from '../../access_control/PermissionEvaluator';
import AllowEverytime from '../../access_control/rules/AllowEverytime';
import GraphType from '../../types/GraphType';

class TestObject extends GraphType<{}> {
  TYPE_NAME = 'test';
  getInitialValue() {
    return {};
  }

  getAccessRules() {
    return {
      onCreate: [AllowEverytime],
      onQuery: [AllowEverytime],
      onUpdate: [AllowEverytime],
      onDelete: [AllowEverytime],
    };
  }
}

const ACTIONS: Action[] = ['create', 'delete', 'read', 'update'];

describe('AllowEverytime rule', () => {
  let object = new TestObject();

  test('passes with logged out users', () => {
    const viewer = new GraphViewer(false, null, []);
    ACTIONS.forEach((action) => {
      const evaluator = new PermissionEvaluator(object, action, viewer);
      expect(evaluator.canPerformAction()).toBe(true);
      expect(() => {
        evaluator.enforceCanPerformAction();
      }).not.toThrow();
    });
  });

  test('passes with logged in users', () => {
    const viewer = new GraphViewer(true, '123456789', []);
    ACTIONS.forEach((action) => {
      const evaluator = new PermissionEvaluator(object, action, viewer);
      expect(evaluator.canPerformAction()).toBe(true);
      expect(() => {
        evaluator.enforceCanPerformAction();
      }).not.toThrow();
    });
  });

  test('passes with no viewer', () => {
    ACTIONS.forEach((action) => {
      const evaluator = new PermissionEvaluator(object, action);
      expect(evaluator.canPerformAction()).toBe(true);
      expect(() => {
        evaluator.enforceCanPerformAction();
      }).not.toThrow();
    });
  });
});
