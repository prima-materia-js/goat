import GraphViewer from '../../access_control/GraphViewer';
import GoatDatabase from '../../client/GoatDatabase';
import GraphType from '../../types/GraphType';

interface ITodoItemData {
  title: string;
  priority: 'low' | 'mid' | 'high';
  isCompleted: boolean;
}

const callback = jest.fn(() => {});

class TodoItem extends GraphType<ITodoItemData> {
  TYPE_NAME = 'TodoItem';

  getInitialValue(): ITodoItemData {
    return {
      title: '',
      priority: 'mid',
      isCompleted: false,
    };
  }

  async onAfterUpdate(viewer: GraphViewer | undefined): Promise<void> {
    callback();
  }
}

describe('onAfterCreate event', () => {
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

      types: [TodoItem],
    });

    await db.initialise();
  });

  afterEach(async () => {
    await db.closeDatabaseConnection();
  });

  test('afterUpdate event is invoked after creation', async () => {
    const todo = await TodoItem.create()
      .set('title', 'Do something')
      .set('priority', 'low')
      .save();

    expect(callback).not.toHaveBeenCalled();

    await todo.set('title', 'Do something more').save();

    expect(callback).toHaveBeenCalled();
  });
});
