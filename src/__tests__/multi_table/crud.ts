import GoatDatabase from '../../client/GoatDatabase';
import GraphType from '../../types/GraphType';

interface ITodoItemData {
  title: string;
  isCompleted: boolean;
}

class TodoItem extends GraphType<ITodoItemData> {
  TYPE_NAME = 'TodoItem';

  getInitialValue(): ITodoItemData {
    return {
      title: '',
      isCompleted: false,
    };
  }
}

interface IUserData {
  username: string;
  email: string;
}

class User extends GraphType<IUserData> {
  TYPE_NAME = 'User';

  getInitialValue() {
    return {
      username: '',
      email: '',
    };
  }

  getIndexedFields(): (keyof IUserData)[] {
    return ['username'];
  }
}

describe('Database initialisation (multi-table storage)', () => {
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

      storageMode: 'multi_table',
    });

    await db.initialise();
  });

  afterEach(async () => {
    await db.closeDatabaseConnection();
  });

  test('can create and save new objects', async () => {
    const todo = new TodoItem().set('title', 'Do something');
    await todo.save();
  });

  test('can query saved objects', async () => {
    const todo = new TodoItem().set('title', 'Do something');
    await todo.save();

    const queried = await TodoItem.getByID(todo.getID());
    expect(queried.get('title')).toBe('Do something');
  });

  test('getByID throws on non-existent IDs', async () => {
    expect(TodoItem.getByID('INVALID-ID')).rejects.toThrow();
  });

  test('queryByID returns null on non-existent IDs', async () => {
    const result = await TodoItem.queryByID('INVALID-ID');
    expect(result).toBeNull();
  });

  test('can update objects', async () => {
    const todo = new TodoItem().set('title', 'Do something');
    await todo.save();

    expect(todo.get('isCompleted')).toBeFalsy();

    await todo.set('isCompleted', true).save();

    const queried = await TodoItem.getByID(todo.getID());
    expect(queried.get('isCompleted')).toBeTruthy();
  });

  test('returns original values in getters unless specified', async () => {
    const titles = {
      old: 'Meow like a cat',
      new: 'Bark like a dog',
    };
    const todo = new TodoItem().set('title', titles.old);
    await todo.save();

    todo.set('title', titles.new);
    expect(todo.get('title')).toBe(titles.old);
    expect(todo.get('title', true)).toBe(titles.new);
  });

  test('can delete objects by reference', async () => {
    const todo = new TodoItem().set('title', 'Do something');
    await todo.save();
    const todoID = todo.getID();

    await todo.delete();

    expect(TodoItem.getByID(todoID)).rejects.toThrow();
  });

  test('can delete objects by ID', async () => {
    const todo = new TodoItem().set('title', 'Do something');
    await todo.save();
    const todoID = todo.getID();

    await TodoItem.deleteWithID(todoID);

    expect(TodoItem.getByID(todoID)).rejects.toThrow();
  });

  test('deleted objects can no longer be used', async () => {
    const todo = new TodoItem().set('title', 'Do something');
    await todo.save();

    await todo.delete();

    expect(() => {
      todo.set('isCompleted', true);
    }).toThrow();
    expect(todo.save()).rejects.toThrow();
  });

  test('queryAll returns all objects of type', async () => {
    await new TodoItem().set('title', 'Item 1').save();
    await new TodoItem().set('title', 'Item 2').save();
    await new TodoItem().set('title', 'Item 3').save();
    await new TodoItem().set('title', 'Item 4').save();
    await new TodoItem().set('title', 'Item 5').save();

    const queried = await TodoItem.queryAll();
    expect(queried.length).toBe(5);
  });

  test('querying by index works', async () => {
    const user1 = await new User()
      .set('username', 'User 1')
      .set('email', 'test1@example.com')
      .save();
    const user2 = await new User()
      .set('username', 'User 2')
      .set('email', 'test2@example.com')
      .save();

    const queried = await User.queryBy<User, IUserData>('username', {
      operation: '==',
      value: 'User 1',
    });
    expect(queried.length).toBe(1);
    expect(queried[0].getID()).toBe(user1.getID());
  });

  test('indexes are updated on mutation', async () => {
    const user1 = await new User()
      .set('username', 'User 1')
      .set('email', 'test1@example.com')
      .save();

    let queried = await User.queryBy<User, IUserData>('username', {
      operation: '==',
      value: 'User 1',
    });
    expect(queried.length).toBe(1);

    await user1.set('username', 'User X').save();

    queried = await User.queryBy<User, IUserData>('username', {
      operation: '==',
      value: 'User 1',
    });
    expect(queried.length).toBe(0);
    queried = await User.queryBy<User, IUserData>('username', {
      operation: '==',
      value: 'User X',
    });
    expect(queried.length).toBe(1);
  });

  test('indexes are deleted on object deletion', async () => {
    const user1 = await new User()
      .set('username', 'User 1')
      .set('email', 'test1@example.com')
      .save();

    let queried = await User.queryBy<User, IUserData>('username', {
      operation: '==',
      value: 'User 1',
    });
    expect(queried.length).toBe(1);

    await user1.delete();

    queried = await User.queryBy<User, IUserData>('username', {
      operation: '==',
      value: 'User 1',
    });
    expect(queried.length).toBe(0);
  });

  test('querying by non-indexed field fails', async () => {
    const user1 = await new User()
      .set('username', 'User 1')
      .set('email', 'test1@example.com')
      .save();

    expect(
      User.queryBy<User, IUserData>('email', {
        operation: '==',
        value: 'test@example.com',
      })
    ).rejects.toThrow();
  });
});
