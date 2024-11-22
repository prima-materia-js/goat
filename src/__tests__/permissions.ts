import GraphType from '../types/GraphType';
import Rules from '../access_control/rules/Rules';
import GoatDatabase from '../client/GoatDatabase';
import GraphViewer from '../access_control/GraphViewer';
import { IndexQuery } from '../types/queries/GraphIndexQuery';

interface ITodoItemData {
  title: string;
}

class TodoItem extends GraphType<ITodoItemData> {
  TYPE_NAME = 'TodoItem';

  getInitialValue() {
    return {
      title: '',
    };
  }

  getIndexedFields(): (keyof ITodoItemData)[] {
    return ['title'];
  }

  getAccessRules() {
    return {
      onCreate: [Rules.DenyIfLoggedOut, Rules.AllowEverytime],
      onQuery: [Rules.DenyIfLoggedOut, Rules.AllowEverytime],
      onUpdate: [Rules.DenyIfLoggedOut, Rules.AllowEverytime],
      onDelete: [Rules.DenyIfLoggedOut, Rules.AllowEverytime],
    };
  }
}

class PrivateTodoItem extends GraphType<ITodoItemData> {
  TYPE_NAME = 'PrivateTodoItem';

  getInitialValue() {
    return {
      title: '',
    };
  }

  getAccessRules() {
    return {
      onCreate: [Rules.DenyIfLoggedOut, Rules.AllowEverytime],
      onQuery: [Rules.AllowIfViewerIsObjectCreator, Rules.DenyEverytime],
      onUpdate: [Rules.AllowIfViewerIsObjectCreator, Rules.DenyEverytime],
      onDelete: [Rules.AllowIfViewerIsObjectCreator, Rules.DenyEverytime],
    };
  }
}

class ReadonlyTodoItem extends GraphType<ITodoItemData> {
  TYPE_NAME = 'ReadonlyTodoItem';

  getInitialValue() {
    return {
      title: '',
    };
  }

  getAccessRules() {
    return {
      onCreate: [Rules.DenyIfLoggedOut, Rules.AllowEverytime],
      onQuery: [Rules.DenyIfLoggedOut, Rules.AllowEverytime],
      onUpdate: [Rules.AllowIfViewerIsObjectCreator, Rules.DenyEverytime],
      onDelete: [Rules.AllowIfViewerIsObjectCreator, Rules.DenyEverytime],
    };
  }
}

describe('Permissions', () => {
  let db: GoatDatabase;
  let loggedOutUser = new GraphViewer(false, null, []);
  let user1 = new GraphViewer(true, '11111', []);
  let user2 = new GraphViewer(true, '22222', []);

  beforeEach(async () => {
    db = new GoatDatabase({
      storage: {
        client: 'sqlite3',
        useNullAsDefault: true,
        connection: {
          filename: ':memory:',
        },
      },

      types: [TodoItem, PrivateTodoItem, ReadonlyTodoItem],
    });

    await db.initialise();
  });

  afterEach(async () => {
    await db.closeDatabaseConnection();
  });

  test('enforces permissions on creation via constructor', async () => {
    await expect(
      new TodoItem(loggedOutUser).set('title', 'do something').save()
    ).rejects.toThrow();
    await expect(
      new TodoItem().set('title', 'do something').save()
    ).rejects.toThrow();
    await expect(
      new TodoItem(user1).set('title', 'do something').save()
    ).resolves.not.toThrow();
  });

  test('enforces permissions on creation via .create()', async () => {
    await expect(
      TodoItem.create(loggedOutUser).set('title', 'do something').save()
    ).rejects.toThrow();
    await expect(
      TodoItem.create().set('title', 'do something').save()
    ).rejects.toThrow();
    await expect(
      TodoItem.create(user1).set('title', 'do something').save()
    ).resolves.not.toThrow();
  });

  test('enforces permissions on querying via getByID', async () => {
    const todoItem = await new TodoItem(user1)
      .set('title', 'do something')
      .save();

    await expect(TodoItem.getByID(todoItem.getID())).rejects.toThrow();
    await expect(
      TodoItem.getByID(todoItem.getID(), loggedOutUser)
    ).rejects.toThrow();
    await expect(
      TodoItem.getByID(todoItem.getID(), user1)
    ).resolves.not.toThrow();
  });

  test('enforces permissions on querying via queryByID', async () => {
    const todoItem = await new TodoItem(user1)
      .set('title', 'do something')
      .save();

    await expect(TodoItem.queryByID(todoItem.getID())).resolves.toBeNull();
    await expect(
      TodoItem.queryByID(todoItem.getID(), loggedOutUser)
    ).resolves.toBeNull();
    await expect(
      TodoItem.queryByID(todoItem.getID(), user1)
    ).resolves.not.toBeNull();
  });

  test('enforces permissions on querying all', async () => {
    await new TodoItem(user1).set('title', 'do something').save();

    await expect(TodoItem.queryAll()).resolves.toHaveLength(0);
    await expect(TodoItem.queryAll(loggedOutUser)).resolves.toHaveLength(0);
    await expect(TodoItem.queryAll(user1)).resolves.toHaveLength(1);
  });

  test('filters items when querying all', async () => {
    await new PrivateTodoItem(user1).set('title', 'item 1').save();
    await new PrivateTodoItem(user2).set('title', 'item 2').save();
    await new PrivateTodoItem(user2).set('title', 'item 3').save();

    await expect(PrivateTodoItem.queryAll()).resolves.toHaveLength(0);
    await expect(PrivateTodoItem.queryAll(loggedOutUser)).resolves.toHaveLength(
      0
    );
    await expect(PrivateTodoItem.queryAll(user1)).resolves.toHaveLength(1);
    await expect(PrivateTodoItem.queryAll(user2)).resolves.toHaveLength(2);
  });

  test('enforces permissions on querying by index', async () => {
    await new TodoItem(user1).set('title', 'do something').save();
    const query: IndexQuery = {
      operation: '==',
      value: 'do something',
    };

    await expect(TodoItem.queryBy('title', query)).resolves.toHaveLength(0);
    await expect(
      TodoItem.queryBy('title', query, loggedOutUser)
    ).resolves.toHaveLength(0);
    await expect(TodoItem.queryBy('title', query, user1)).resolves.toHaveLength(
      1
    );
  });

  test('enforces permissions on update', async () => {
    const todoItem = await new ReadonlyTodoItem(user1)
      .set('title', 'do something')
      .save();

    let item = await ReadonlyTodoItem.getByID(todoItem.getID(), user1);
    await expect(item.set('title', 'do nothing').save()).resolves.not.toThrow();

    item = await ReadonlyTodoItem.getByID(todoItem.getID(), user2);
    await expect(item.set('title', 'do nothing').save()).rejects.toThrow();
  });

  test('enforces permissions on deletion via object', async () => {
    const todoItem = await new ReadonlyTodoItem(user1)
      .set('title', 'do something')
      .save();

    let item = await ReadonlyTodoItem.getByID(todoItem.getID(), user2);
    await expect(item.delete()).rejects.toThrow();

    item = await ReadonlyTodoItem.getByID(todoItem.getID(), user1);
    await expect(item.delete()).resolves.not.toThrow();
  });

  test('enforces permissions on deletion via deleteWithID', async () => {
    const todoItem = await new ReadonlyTodoItem(user1)
      .set('title', 'do something')
      .save();

    await expect(
      ReadonlyTodoItem.deleteWithID(todoItem.getID(), user2)
    ).rejects.toThrow();
    await expect(
      ReadonlyTodoItem.deleteWithID(todoItem.getID(), user1)
    ).resolves.not.toThrow();
  });
});
