import GraphViewer from '../GraphViewer';
import type GraphType from '../../types/GraphType';
import Rule from './Rule';

const AllowIf: (lambda: Rule) => Rule = (lambda: Rule) => {
  const rule: Rule = (viewer: GraphViewer, object: GraphType<any>) => {
    if (lambda(viewer, object) === true) return true;

    return null;
  };
  return rule;
};

export default AllowIf;
