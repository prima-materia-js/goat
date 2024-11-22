import GraphViewer from '../GraphViewer';
import type GraphType from '../../types/GraphType';
import Rule from './Rule';

const DenyIf: (lambda: Rule) => Rule = (lambda: Rule) => {
  const rule: Rule = (viewer: GraphViewer, object: GraphType<any>) => {
    if (lambda(viewer, object) === true) return false;

    return null;
  };
  return rule;
};

export default DenyIf;
