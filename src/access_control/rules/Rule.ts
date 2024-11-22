import GraphViewer from '../GraphViewer';
import type GraphType from '../../types/GraphType';

/**
 * A rule defines whether an action can or cannot be performed. A rule may also defer to the next available rule by returning a null value.
 */
type Rule = (viewer: GraphViewer, object: GraphType<any>) => boolean | null;

export default Rule;
