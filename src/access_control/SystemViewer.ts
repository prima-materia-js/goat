import GraphViewer from './GraphViewer';

/**
 * Represents a non-human identity such as a script or automated job querying the database.
 */
class SystemViewer extends GraphViewer {
  constructor() {
    super(true, null, [SystemViewer.getSystemUserRoleKey()]);
  }

  static getSystemUserRoleKey() {
    return '__system_user__';
  }
}

export default SystemViewer;
