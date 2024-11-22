import AllowEverytime from './AllowEverytime';
import AllowIf from './AllowIf';
import AllowIfSystemViewer from './AllowIfSystemViewer';
import AllowIfViewerIsObjectCreator from './AllowIfViewerIsObjectCreator';
import DenyEverytime from './DenyEverytime';
import DenyIf from './DenyIf';
import DenyIfLoggedOut from './DenyIfLoggedOut';

const Rules = {
  AllowEverytime,
  AllowIf,
  AllowIfSystemViewer,
  AllowIfViewerIsObjectCreator,

  DenyEverytime,
  DenyIf,
  DenyIfLoggedOut,
};

export default Rules;
