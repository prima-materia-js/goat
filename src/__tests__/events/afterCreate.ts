import GraphViewer from '../../access_control/GraphViewer';
import GoatDatabase from '../../client/GoatDatabase';
import GraphType from '../../types/GraphType';

interface ITodoItemData {
  title: string;
  priority: 'low' | 'mid' | 'high';
  isCompleted: boolean;
}

class TodoItem extends GraphType<ITodoItemData> {
  TYPE_NAME = 'TodoItem';

  getInitialValue(): ITodoItemData {
    return {
      title: '',
      priority: 'mid',
      isCompleted: false,
    };
  }

  async onAfterCreate(viewer: GraphViewer | undefined): Promise<void> {
    await this.set('priority', 'high').save();
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

  test('afterCreate event is invoked after creation', async () => {
    const todo = await TodoItem.create()
      .set('title', 'Do something')
      .set('priority', 'low')
      .save();

    const queried = await TodoItem.getByID(todo.getID());
    expect(queried.get('priority')).toBe('high');
  });
});
