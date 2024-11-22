import GraphViewer from '../../access_control/GraphViewer';
import PermissionEvaluator, {
  Action,
} from '../../access_control/PermissionEvaluator';
import AllowEverytime from '../../access_control/rules/AllowEverytime';
import DenyIf from '../../access_control/rules/DenyIf';
import Rule from '../../access_control/rules/Rule';
import GraphType from '../../types/GraphType';

const DenyIfValueIsEvenNumber: Rule = DenyIf(
  (viewer, object) => object.get('value') % 2 == 0
);
const DenyIfViewerHasPseudonym: Rule = DenyIf(
  (viewer, object) => viewer.getPseudonym() != null
);

class TestObject extends GraphType<{
  value: number;
}> {
  TYPE_NAME = 'test';
  getInitialValue() {
    return {
      value: 0,
    };
  }

  getAccessRules() {
    return {
      onCreate: [
        DenyIfValueIsEvenNumber,
        DenyIfViewerHasPseudonym,
        AllowEverytime,
      ],
      onQuery: [
        DenyIfValueIsEvenNumber,
        DenyIfViewerHasPseudonym,
        AllowEverytime,
      ],
      onUpdate: [
        DenyIfValueIsEvenNumber,
        DenyIfViewerHasPseudonym,
        AllowEverytime,
      ],
      onDelete: [
        DenyIfValueIsEvenNumber,
        DenyIfViewerHasPseudonym,
        AllowEverytime,
      ],
    };
  }
}

const ACTIONS: Action[] = ['create', 'delete', 'read', 'update'];

describe('DenyIf rule', () => {
  test('fails when object condition evaluates to true', () => {
    const user = new GraphViewer(true, '12345', []);
    const object = TestObject.create(user).set('value', 8);

    ACTIONS.forEach((action) => {
      const evaluator = new PermissionEvaluator(object, action, user);
      expect(evaluator.canPerformAction()).toBe(false);
      expect(() => {
        evaluator.enforceCanPerformAction();
      }).toThrow();
    });
  });

  test('fails when viewer condition evaluates to true', () => {
    const user = new GraphViewer(true, '12345', [], [], 'Aegon Targaryen');

    const object = TestObject.create(user).set('value', 9);

    ACTIONS.forEach((action) => {
      const evaluator = new PermissionEvaluator(object, action, user);
      expect(evaluator.canPerformAction()).toBe(false);
      expect(() => {
        evaluator.enforceCanPerformAction();
      }).toThrow();
    });
  });

  test('passes when custom conditions evaluates to false', () => {
    const user = new GraphViewer(true, '12345', []);
    const object = TestObject.create(user).set('value', 9);

    ACTIONS.forEach((action) => {
      const evaluator = new PermissionEvaluator(object, action, user);
      expect(evaluator.canPerformAction()).toBe(true);
      expect(() => {
        evaluator.enforceCanPerformAction();
      }).not.toThrow();
    });
  });
});
