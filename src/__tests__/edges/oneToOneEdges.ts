import GoatDatabase from '../../client/GoatDatabase';
import GraphType from '../../types/GraphType';

interface IUserData {
  displayName: string;
}

class User extends GraphType<IUserData> {
  TYPE_NAME = 'User';

  getInitialValue(): IUserData {
    return {
      displayName: '',
    };
  }
}

interface ITodoItemData {
  title: string;
  owner_id: string | null;
}

class TodoItem extends GraphType<
  ITodoItemData,
  { relatedItems: TodoItem; owner: User; assignee: User }
> {
  TYPE_NAME = 'TodoItem';

  getInitialValue() {
    return {
      title: '',
      owner_id: null,
    };
  }

  getEdgeConfigs() {
    return {
      relatedItems: {
        connectedType: TodoItem,
        undirected: true,
      },
      owner: {
        connectedType: User,
        oneToOneEdge: true,
        connectedIDField: 'owner_id' as keyof ITodoItemData,
      },
      assignee: {
        connectedType: User,
        oneToOneEdge: true,
      },
    };
  }
}

describe('One-to-one edges', () => {
  let db: GoatDatabase;

  beforeEach(async () => {
    db = new GoatDatabase({
      storage: {
        client: 'sqlite3',
        useNullAsDefault: true,
        connection: {
          filename: ':memory:',
        },
      },

      types: [TodoItem, User],
    });

    await db.initialise();
  });

  afterEach(() => {
    db.closeDatabaseConnection();
  });

  test('Edge with field is set', async () => {
    const user = await User.create().set('displayName', 'Test User').save();
    const todo = await TodoItem.create().set('title', 'Do something').save();

    await todo.addEdge('owner', user);
    expect(todo.get('owner_id')).toBe(user.getID());
  });

  test('Edge with field can be queried', async () => {
    const user = await User.create().set('displayName', 'Test User').save();
    const todo = await TodoItem.create().set('title', 'Do something').save();

    await todo.addEdge('owner', user);

    const queriedTodo = await TodoItem.getByID(todo.getID());
    const queriedEdges = await queriedTodo.queryEdges('owner');
    expect(queriedEdges).toHaveLength(1);
    expect(queriedEdges[0].getID()).toBe(user.getID());
  });

  test('Querying unset field-backed edge returns empty result set', async () => {
    const todo = await TodoItem.create().set('title', 'Do something').save();
    const queried = await todo.queryEdges('owner');
    expect(queried).toHaveLength(0);
  });

  test('Edge with association is set', async () => {
    const user = await User.create().set('displayName', 'Test User').save();
    const todo = await TodoItem.create().set('title', 'Do something').save();

    await todo.addEdge('assignee', user);
    const queried = await todo.queryEdges('assignee');
    expect(queried).toHaveLength(1);
    expect(queried[0].getID()).toBe(user.getID());
  });

  test('Edge with field can be deleted', async () => {
    const user = await User.create().set('displayName', 'Test User').save();
    const todo = await TodoItem.create().set('title', 'Do something').save();

    await todo.addEdge('owner', user);

    await todo.deleteEdge('owner', user);
    expect(todo.get('owner_id')).not.toBe(user.getID());
  });

  test('Deleting unset field-backed edge does nothing', async () => {
    const user = await User.create().set('displayName', 'Test User').save();
    const todo = await TodoItem.create().set('title', 'Do something').save();
    await expect(todo.deleteEdge('owner', user)).resolves.not.toThrow();
  });

  test('Deleting field-backed edge and connected object works', async () => {
    const user = await User.create().set('displayName', 'Test User').save();
    const todo = await TodoItem.create().set('title', 'Do something').save();
    await todo.addEdge('owner', user);

    await todo.deleteEdge('owner', user, true);

    const queried = await User.queryByID(user.getID());
    expect(queried).toBeNull();
  });

  test('Deleting field-backed edge with a different object does nothing', async () => {
    const user1 = await User.create().set('displayName', 'Test User 1').save();
    const user2 = await User.create().set('displayName', 'Test User 2').save();
    const todo = await TodoItem.create().set('title', 'Do something').save();

    await todo.addEdge('owner', user1);
    expect(todo.get('owner_id')).toBe(user1.getID());

    await todo.deleteEdge('owner', user2);
    expect(todo.get('owner_id')).toBe(user1.getID());
  });

  test('Edge with association can be deleted', async () => {
    const user = await User.create().set('displayName', 'Test User').save();
    const todo = await TodoItem.create().set('title', 'Do something').save();

    await todo.addEdge('assignee', user);

    await todo.deleteEdge('assignee', user);
    const queried = await todo.queryEdges('assignee');
    expect(queried).toHaveLength(0);
  });

  test('Updating field-backed edge works', async () => {
    const user1 = await User.create().set('displayName', 'Test User 1').save();
    const user2 = await User.create().set('displayName', 'Test User 2').save();
    const todo = await TodoItem.create().set('title', 'Do something').save();

    await todo.addEdge('owner', user1);
    expect(todo.get('owner_id')).toBe(user1.getID());

    await todo.addEdge('owner', user2);
    expect(todo.get('owner_id')).toBe(user2.getID());
  });

  test('Updating association-backed edge works', async () => {
    const user1 = await User.create().set('displayName', 'Test User 1').save();
    const user2 = await User.create().set('displayName', 'Test User 2').save();
    const todo = await TodoItem.create().set('title', 'Do something').save();

    await todo.addEdge('assignee', user1);
    let queried = await todo.queryEdges('assignee');
    expect(queried).toHaveLength(1);
    expect(queried[0].getID()).toBe(user1.getID());

    await todo.addEdge('assignee', user2);
    queried = await todo.queryEdges('assignee');
    expect(queried).toHaveLength(1);
    expect(queried[0].getID()).toBe(user2.getID());
  });
});
