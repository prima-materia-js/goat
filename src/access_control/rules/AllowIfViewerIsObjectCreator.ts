import Rule from './Rule';

const AllowIfViewerIsObjectCreator: Rule = (viewer, object) => {
  if (object.getMetadata('creator_id') === viewer.getID()) {
    return true;
  }

  return null;
};

export default AllowIfViewerIsObjectCreator;
