import SystemViewer from '../SystemViewer';
import AllowIf from './AllowIf';
import Rule from './Rule';

const AllowIfSystemViewer: Rule = AllowIf((viewer) => {
  if (viewer.hasRole(SystemViewer.getSystemUserRoleKey())) {
    return true;
  }

  return null;
});

export default AllowIfSystemViewer;
