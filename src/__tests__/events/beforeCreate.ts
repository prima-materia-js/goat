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

  async onBeforeCreate(
    viewer: GraphViewer | undefined,
    changeset: ITodoItemData
  ): Promise<void> {
    this.set(
      'title',
      `[${changeset.priority.toUpperCase()}] ${changeset.title}`
    );
  }
}

describe('onBeforeCreate event', () => {
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

  test('beforeCreate event is invoked on creation', async () => {
    const todo = await TodoItem.create()
      .set('title', 'Do something')
      .set('priority', 'high')
      .save();

    expect(todo.get('title')).toContain('[HIGH]');
  });
});
