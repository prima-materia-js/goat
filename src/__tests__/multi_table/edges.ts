import GoatDatabase from '../../client/GoatDatabase';
import { GraphEdgeConfig } from '../../types/GraphEdge';
import GraphType from '../../types/GraphType';

interface ITodoItemData {
  title: string;
}

class TodoItem extends GraphType<ITodoItemData, { relatedItems: TodoItem }> {
  TYPE_NAME = 'TodoItem';

  getInitialValue() {
    return {
      title: '',
    };
  }

  getEdgeConfigs() {
    return {
      relatedItems: {
        connectedType: TodoItem,
        undirected: true,
      },
    };
  }
}

interface ITodoListData {
  listName: string;
}

class TodoList extends GraphType<
  ITodoListData,
  {
    items: TodoItem;
    invalidUndirectedEdges: TodoItem;
  }
> {
  TYPE_NAME = 'TodoList';

  getInitialValue() {
    return {
      listName: '',
    };
  }

  getEdgeConfigs() {
    return {
      items: {
        connectedType: TodoItem,
      },
      invalidUndirectedEdges: {
        connectedType: TodoItem,
        undirected: true,
      },
    };
  }
}

describe('Edges (multi-table mode)', () => {
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

      types: [TodoItem, TodoList],

      storageMode: 'multi_table',
    });

    await db.initialise();
  });

  afterEach(() => {
    db.closeDatabaseConnection();
  });

  test('can save edges to existing objects', async () => {
    const todoList = await TodoList.create()
      .set('listName', 'Example list')
      .save();
    const todoItem = await TodoItem.create()
      .set('title', 'Do something')
      .save();

    await todoList.addEdge('items', todoItem);
  });

  test('can save edges to newly-created objects', async () => {
    const todoList = await TodoList.create()
      .set('listName', 'Example list')
      .save();

    const todoItem = TodoItem.create().set('title', 'Do something');

    await todoList.addEdge('items', todoItem);

    const queried = await TodoItem.queryByID(todoItem.getID());
    expect(queried).not.toBeNull();
  });

  test('saving edges to updated objects saves changes', async () => {
    const todoList = await TodoList.create()
      .set('listName', 'Example list')
      .save();

    const todoItem = await TodoItem.create()
      .set('title', 'Do something')
      .save();

    todoItem.set('title', 'Read a book');

    await todoList.addEdge('items', todoItem);

    const queried = await TodoItem.queryByID(todoItem.getID());
    expect(queried?.get('title')).toBe('Read a book');
  });

  test('can query edges', async () => {
    const todoList = await TodoList.create()
      .set('listName', 'Example list')
      .save();
    const todoItem = await TodoItem.create()
      .set('title', 'Do something')
      .save();

    await todoList.addEdge('items', todoItem);

    const edges = await todoList.queryEdges('items');
    expect(edges.length).toBe(1);
  });

  test('can query edges to multiple connected nodes', async () => {
    const todoList = await TodoList.create()
      .set('listName', 'Example list')
      .save();

    await todoList.addEdges('items', [
      TodoItem.create().set('title', 'Item A'),
      TodoItem.create().set('title', 'Item B'),
    ]);
    await TodoItem.create().set('title', 'Item C').save();

    const edges = await todoList.queryEdges('items');
    expect(edges.length).toBe(2);

    const itemTitles = edges.map((item) => item.get('title'));
    expect(itemTitles).toContain('Item A');
    expect(itemTitles).toContain('Item B');
    expect(itemTitles).not.toContain('Item C');
  });

  test('can delete single edge by object reference', async () => {
    const todoList = await TodoList.create()
      .set('listName', 'Example list')
      .save();
    const todoItem = await TodoItem.create().set('title', 'Item A').save();
    await todoList.addEdge('items', todoItem);

    const edgeCountBefore = await todoList.queryEdges('items');
    expect(edgeCountBefore.length).toBe(1);

    await todoList.deleteEdge('items', todoItem);
    const edgeCountAfter = await todoList.queryEdges('items');
    expect(edgeCountAfter.length).toBe(0);
  });

  test('can delete single edge by ID', async () => {
    const todoList = await TodoList.create()
      .set('listName', 'Example list')
      .save();
    const todoItem = await TodoItem.create().set('title', 'Item A').save();
    await todoList.addEdge('items', todoItem);

    const edgeCountBefore = await todoList.queryEdges('items');
    expect(edgeCountBefore.length).toBe(1);

    await todoList.deleteEdge('items', todoItem.getID());
    const edgeCountAfter = await todoList.queryEdges('items');
    expect(edgeCountAfter.length).toBe(0);
  });

  test('can delete multiple edges', async () => {
    const todoList = await TodoList.create()
      .set('listName', 'Example list')
      .save();
    const todoItemA = await TodoItem.create().set('title', 'Item A').save();
    const todoItemB = await TodoItem.create().set('title', 'Item B').save();
    await todoList.addEdges('items', [todoItemA, todoItemB]);

    const edgeCountBefore = await todoList.queryEdges('items');
    expect(edgeCountBefore.length).toBe(2);

    await todoList.deleteEdges('items', [todoItemA, todoItemB]);
    const edgeCountAfter = await todoList.queryEdges('items');
    expect(edgeCountAfter.length).toBe(0);
  });

  test('can partially delete edges', async () => {
    const todoList = await TodoList.create()
      .set('listName', 'Example list')
      .save();
    const todoItemA = await TodoItem.create().set('title', 'Item A').save();
    const todoItemB = await TodoItem.create().set('title', 'Item B').save();
    await todoList.addEdges('items', [todoItemA, todoItemB]);

    const edgeCountBefore = await todoList.queryEdges('items');
    expect(edgeCountBefore.length).toBe(2);

    await todoList.deleteEdges('items', [todoItemA]);
    const edgeCountAfter = await todoList.queryEdges('items');
    expect(edgeCountAfter.length).toBe(1);
  });

  test('can delete edges with either IDs or objects', async () => {
    const todoList = await TodoList.create()
      .set('listName', 'Example list')
      .save();
    const todoItemA = await TodoItem.create().set('title', 'Item A').save();
    const todoItemB = await TodoItem.create().set('title', 'Item B').save();
    await todoList.addEdges('items', [todoItemA, todoItemB]);

    const edgeCountBefore = await todoList.queryEdges('items');
    expect(edgeCountBefore.length).toBe(2);

    await todoList.deleteEdges('items', [todoItemA, todoItemB.getID()]);
    const edgeCountAfter = await todoList.queryEdges('items');
    expect(edgeCountAfter.length).toBe(0);
  });

  test('can optionally delete connected objects when deleting edge', async () => {
    const todoList = await TodoList.create()
      .set('listName', 'Example list')
      .save();
    const todoItemA = await TodoItem.create().set('title', 'Item A').save();
    const todoItemB = await TodoItem.create().set('title', 'Item B').save();
    await todoList.addEdges('items', [todoItemA, todoItemB]);

    const edgeCount1 = await todoList.queryEdges('items');
    expect(edgeCount1.length).toBe(2);

    await todoList.deleteEdge('items', todoItemA);
    const edgeCount2 = await todoList.queryEdges('items');
    expect(edgeCount2.length).toBe(1);
    const queried1 = await TodoItem.queryByID(todoItemA.getID());
    expect(queried1).not.toBeNull();

    await todoList.deleteEdge('items', todoItemB, true);
    const edgeCount3 = await todoList.queryEdges('items');
    expect(edgeCount3.length).toBe(0);
    const queried2 = await TodoItem.queryByID(todoItemB.getID());
    expect(queried2).toBeNull();
  });

  test('disallows undirected edges referencing another type', async () => {
    const todoList = await TodoList.create()
      .set('listName', 'Example list')
      .save();
    const todoItemA = await TodoItem.create().set('title', 'Item A').save();

    expect(
      todoList.addEdge('invalidUndirectedEdges', todoItemA)
    ).rejects.toThrow();
  });

  test('undirected edges are created correctly', async () => {
    const todoItemA = await TodoItem.create().set('title', 'Item A').save();
    const todoItemB = await TodoItem.create().set('title', 'Item B').save();

    await todoItemA.addEdge('relatedItems', todoItemB);
    const queriedFromA = await todoItemA.queryEdges('relatedItems');
    const queriedFromB = await todoItemB.queryEdges('relatedItems');

    expect(queriedFromA.length).toBe(queriedFromB.length);
  });

  test('deleting an undirected edge deletes both inbound and outbound edges', async () => {
    const todoItemA = await TodoItem.create().set('title', 'Item A').save();
    const todoItemB = await TodoItem.create().set('title', 'Item B').save();

    await todoItemA.addEdge('relatedItems', todoItemB);
    let queriedFromA = await todoItemA.queryEdges('relatedItems');
    let queriedFromB = await todoItemB.queryEdges('relatedItems');

    expect(queriedFromA.length).toBe(1);
    expect(queriedFromB.length).toBe(1);

    await todoItemA.deleteEdge('relatedItems', todoItemB);
    queriedFromA = await todoItemA.queryEdges('relatedItems');
    queriedFromB = await todoItemB.queryEdges('relatedItems');

    expect(queriedFromA.length).toBe(0);
    expect(queriedFromB.length).toBe(0);
  });
});
