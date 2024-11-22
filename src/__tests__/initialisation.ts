import GoatDatabase from '../client/GoatDatabase';

describe('Database initialisation', () => {
  let db: GoatDatabase;

  beforeEach(() => {
    db = new GoatDatabase({
      storage: {
        client: 'sqlite3',
        useNullAsDefault: true,
        connection: {
          filename: ':memory:',
        },
      },

      types: [],
    });
  });

  afterEach(() => {
    db.closeDatabaseConnection();
  });

  test('works without errors', async () => {
    await db.initialise();
  });

  test('does not allow table access without initialisation', () => {
    expect(db.objects).toThrow();
  });
});
