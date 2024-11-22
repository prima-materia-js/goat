import Rule from './Rule';

const DenyIfLoggedOut: Rule = (viewer) => {
  if (!viewer.getIsLoggedIn()) {
    return false;
  }

  return null;
};

export default DenyIfLoggedOut;
