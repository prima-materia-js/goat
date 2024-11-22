# Getting started

## Installing

Install GOAT from the `@prima-materia/goat` library:

```bash
$ npm install @prima-materia/goat
```

You'll also need to install the appropriate drivers for the storage layer of your choice. You can pick any of the adapters [supported by Knex](https://knexjs.org/guide/#node-js). For example, if you're using SQLite, you can use:

```bash
$ npm install sqlite3
```

## Create a GOAT database

In this guide, you'll implement the data model for a basic task tracker. This guide will use TypeScript for code examples.

First, initialise a GOAT database:

```ts
import { GoatDatabase } from '@prima-materia/goat';

const db = new GoatDatabase({
  storage: {
    client: 'sqlite3',
    useNullAsDefault: true,
    connection: {
      filename: './example.sqlite',
    },
  },

  types: [],
});
```

The `storage` parameter should define how to connect to the underlying database. Use the configuration parameters as appropriate for the adapter of your choice. Refer to the [Knex documentation](https://knexjs.org/guide/#configuration-options) for more information on how to configure this.

The `types` parameter is an array of object types this database should support. You can set this to an empty array for now and come back to it later once you've created an object type.

## Creating an object type

### Type definitions

Let's start by defining the `User` object, with two fields: a username and an email address. In TypeScript, this will look like this:

```ts
interface IUserData {
  username: string;
  email: string;
}
```

Then, create a class extending `GraphType`. You'll need to implement the `TYPE_NAME` field (which is a unique name for this object type) and the `getInitialData()` method (which returns the default state of a newly-created object of this type).

```ts
import { GraphType } from '@prima-materia/goat';

class User extends GraphType<IUserData> {
  TYPE_NAME = 'User';

  getInitialValue() {
    return {
      username: '',
      email: '',
    };
  }
}
```

### Indexes

In GOAT, objects can be queried by their IDs by default. To query objects by another field, you'll need to create an index on that field by specifying it in the `getIndexedFields()` method. In this case, you'll want to create an index on the `username` field so that users can be queried by their username.

```ts
getIndexedFields(): (keyof IUserData)[] {
  return ['username'];
}
```

### Associations

Next, let's create a `TodoItem` type, which includes a task title and a flag indicating if the task bas been done:

```ts
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
```

Then, update the `User` class to add an edge to the `TodoItem` type. You'll need to add the edges in the class's generic type, and define a new `getEdgeConfigs()` method. The edge config returned by this method will specify what object type this edge will connect to.

```ts
class User extends GraphType<IUserData, { tasks: TodoItem }> {
  // ... ...

  getEdgeConfigs() {
    return {
      tasks: {
        connectedType: TodoItem,
      },
    };
  }
}
```

### Add types to the database

Before you can use the `User` and `TodoItem` types, you need to add then to the `types` array:

```ts
const db = new GoatDatabase({
  // ... other configuration parameters ...

  types: [User, TodoItem],
});
```

## Using GOAT objects

At this point, you should have implemented the `User` and `TodoItem` object types, and created the GOAT database. Click below to view the full source code.

<details>
  <summary>Full source code</summary>
  
  ```ts
  import { GoatDatabase, GraphType } from '@prima-materia/goat';

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

  class User extends GraphType<IUserData, { tasks: TodoItem }> {
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

    getEdgeConfigs() {
      return {
        tasks: {
          connectedType: TodoItem,
        },
      };
    }
  }

  const db = new GoatDatabase({
    storage: {
      client: 'sqlite3',
      useNullAsDefault: true,
      connection: {
        filename: './example.sqlite',
      },
    },

    types: [User, TodoItem],
  });
```  
</details>

### Creating objects

To create a new `User` object, call `User.create()`. This returns a new instance of a User object, using which you can update fields using the `set(<field name>, <value>)` method. When you're done, call the `save()` method to save changes to the database. Note that all of these methods are chainable:

```ts
const user = await User.create()
  .set('username', 'testuser1')
  .set('email', 'test@example.com')
  .save();
```

### Querying objects

#### Querying by ID

To query an object by its ID, use the `getByID(<id>)` method:

```ts
const user = await User.getByID(userID);
```

You can read fields on the queried object by calling the `get(<field>)` method. You can get an object's ID by calling `getID()`;

```ts
const emailAddress = user.get('email');
const userID = user.getID();
```

#### Querying by indexed field

To query an object by a field that has been indexed, use `queryBy(<field name>, <query>)`:

```ts
const results = await User.queryBy<User, IUserData>('username', {
  operation: '==',
  value: 'testuser1',
});
```

When performing an index query, an array of objects will be returned. If you attempt to query by a field that has not been indexed, an error will be thrown.

### Updating objects

To update an object's fields, use the `set(<field>, <value>)` method. 

```ts
await user.set('email', 'newemail@example.com').save();
```

Note that calling `get()` will only return saved values; if you update a field with a new value, calling `get()` on that field will return the old value until you call `save()`:

```ts
const user = await User.create().set('email', 'old@example.com').save();

user.set('email', 'new@example.com');
console.log(user.get('email')); // This logs "old@example.com".

await user.save();
console.log(user.get('email')); // This logs "new@example.com".
```

### Deleting objects

To delete an object, use `delete()`:

```ts
await user.delete();
```

### Adding edges

You can add edges to an object by calling `addEdge()` (to create a single edge) or `addEdges()` (to create multiple edges at once):

```ts
const todoItem = await TodoItem.create()
  .set('title', 'Do something')
  .save();

await user.addEdge('tasks', todoItem);
```

You can also create the destination objects while creating the edge; the objects will be automatically saved to the database before the edges are created.

```ts
await user.addEdges('tasks', [
  TodoItem.create().set('title', 'Do something'),
  TodoItem.create().set('title', 'Do something different'),
]);
```

### Querying edges

To query an edge, use `queryEdges(<edge name>)`:

```ts
const tasks = await user.queryEdges('tasks');
```

### Removing edges

You can delete edges using the `deleteEdge()` or `deleteEdges()` methods:

```ts
await user.deleteEdge('tasks', todoItem);
```

This will remove the edge between the source and destination object, but keep the destination object intact. To remove both the edge and the destination object, set the optional third parameter to true:

```ts
await user.deleteEdge('tasks', todoItem, true); // This will delete todoItem.
```

## Next steps

This guide contains a basic approach to working with objects and associations using GOAT. To learn how to use more advanced features, such as access control permissions, validation or undirected edges, check out the `advanced` folder.