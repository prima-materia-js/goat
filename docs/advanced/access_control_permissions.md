# Access control permissions

The Access Control Permissions feature in GOAT allows you to define rules that restrict Create, Read, Update, and Delete operations based on user or object attributes.

## Defining rules

Access control rules are defined within each object type by implementing the `getAccessRules()` method. This method returns an object specifying the rules for different operations, such as creation, querying, updating, and deletion.

```ts
import { GraphType, Rules } from '@prima-materia/goat';

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

  getAccessRules() {
    return {
      onCreate: [Rules.DenyIfLoggedOut, Rules.AllowEverytime],
      onQuery: [Rules.AllowIfViewerIsObjectCreator, Rules.DenyEverytime],
      onUpdate: [Rules.AllowIfViewerIsObjectCreator, Rules.DenyEverytime],
      onDelete: [Rules.AllowIfViewerIsObjectCreator, Rules.DenyEverytime],
    };
  }
}
```

Access control rules are evaluated in order until a decision is returned. Each rule returns one of three possible results:

- a `true` boolean value determines that the operation should be permitted
- a `false` boolean value determines that the operation should be disallowed
- a `null` value indicates that the current rule does not return a final decision, and that the next rule in the list should be evaluted

### Best practices

If none of the rules return a result (i.e. all rules return `null`), the operation will be allowed by default. A secure way to define access control rules is to first list rules that allow the operation if a condition is met, and end the list with a `DenyEverytime` rule.

### Available rules

GOAT provides some basic rules out of the box:

| Rule                         | Behaviour                                                                                                                       |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| AllowEverytime               | Always allows the operation.                                                                                                    |
| AllowIfViewerIsObjectCreator | Allows the operation if the user performing the operation is also the user who created the object.                              |
| AllowIfSystemViewer          | Allows the operation if the operation is being performed by a system viewer (see below for more information on system viewers). |
| DenyEverytime                | Always disallows the operation.                                                                                                 |
| DenyIfLoggedOut              | Disallows the operation if the operation is being performed by a logged-out user, or if no viewer is specified.                 |

### Writing custom rules

GOAT provides `AllowIf` and `DenyIf` rules that let you write your own custom rules. These take a predicate function and will allow or deny the operation if the predicate returns a true value.

```ts
// ...
onCreate: [
  Rules.DenyIfLoggedOut,
  // Prevent an object being created if `isCompleted` is set to true.
  Rules.DenyIf((viewer, object) => object.get('isCompleted') === true),
  Rules.AllowEverytime,
],
// ...
```

When writing custom rules, the predicate function takes two parameters: the first parameter is the viewer performing the operation (see below for more detail on Viewers), while the second parameter is the object the operation is being performed on.

## Viewers

## GraphViewer

In order for access control rules to work correctly, you must specify a viewer when performing any operation with objects in GOAT.

To create a viewer, use the `GraphViewer` class:

```ts
const viewer = new GraphViewer(
  true, // Whether the user is logged in
  '12345', // A unique ID representing this user, such as a username
  [], // A list of roles held by this user
  [], // (optional) A list of arbitrary string values that can be evaluated by custom rules
  'Test User' // (optional) A pseudonym, such as a display name
);
```

Provide the viewer when creating or querying objects:

```ts
const todoItem = await TodoItem.create(viewer)
  .set('title', 'Do something')
  .save();

const todoItem = await TodoItem.getByID('exampleid', viewer);
```

As updating or deleting an object requires the object to be first queried, the viewer used to query the object will be used for those operations.

If no viewer is specified, the operation is performed as though a logged-out user is performing the action.

## SystemViewer

A SystemViewer represents a non-human identity such as a script or automated job querying the database. When using SystemViewers, you should also configure access control rules appropriately to grant access - for example, by using the `AllowIfSystemViewer` rule.
