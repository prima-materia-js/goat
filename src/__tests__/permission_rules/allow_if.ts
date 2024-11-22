import GraphViewer from '../../access_control/GraphViewer';
import PermissionEvaluator, {
  Action,
} from '../../access_control/PermissionEvaluator';
import AllowIf from '../../access_control/rules/AllowIf';
import DenyEverytime from '../../access_control/rules/DenyEverytime';
import Rule from '../../access_control/rules/Rule';
import GraphType from '../../types/GraphType';

const AllowIfValueIsEvenNumber: Rule = AllowIf(
  (viewer, object) => object.get('value') % 2 == 0
);
const AllowIfViewerHasPseudonym: Rule = AllowIf(
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
        AllowIfValueIsEvenNumber,
        AllowIfViewerHasPseudonym,
        DenyEverytime,
      ],
      onQuery: [
        AllowIfValueIsEvenNumber,
        AllowIfViewerHasPseudonym,
        DenyEverytime,
      ],
      onUpdate: [
        AllowIfValueIsEvenNumber,
        AllowIfViewerHasPseudonym,
        DenyEverytime,
      ],
      onDelete: [
        AllowIfValueIsEvenNumber,
        AllowIfViewerHasPseudonym,
        DenyEverytime,
      ],
    };
  }
}

const ACTIONS: Action[] = ['create', 'delete', 'read', 'update'];

describe('AllowIf rule', () => {
  test('passes when object condition evaluates to true', () => {
    const user = new GraphViewer(true, '12345', []);
    const object = TestObject.create(user).set('value', 8);

    ACTIONS.forEach((action) => {
      const evaluator = new PermissionEvaluator(object, action, user);
      expect(evaluator.canPerformAction()).toBe(true);
      expect(() => {
        evaluator.enforceCanPerformAction();
      }).not.toThrow();
    });
  });

  test('fails when object condition evaluates to false', () => {
    const user = new GraphViewer(true, '12345', []);
    const object = TestObject.create(user).set('value', 9);

    ACTIONS.forEach((action) => {
      const evaluator = new PermissionEvaluator(object, action, user);
      expect(evaluator.canPerformAction()).toBe(false);
      expect(() => {
        evaluator.enforceCanPerformAction();
      }).toThrow();
    });
  });

  test('passes when viewer condition evaluates to true', () => {
    const user = new GraphViewer(true, '12345', [], [], 'Aegon Targaryen');

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
