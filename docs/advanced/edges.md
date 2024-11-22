# Edges / associations

There are three types of associations in GOAT:

1. **one-to-many association**: this is the default type of edge and represents a relationship where one source object has a directed edge to many destination objects. For example, one User can be assigned many TodoItem objects.
2. **undirected association**: this also represents a one-to-many relationship, but one where the logical relationship is bi-directional. For example, if you have a TodoItem object and are implementing the ability to group related TodoItem objects, you can implement this as undirected `relatedItems` edges.
3. **one-to-one association**: this represents a one-to-one relationship. For example, a User might only have a single TodoItem set as an `activeTask`.

Regardless of the type of association, the methods to add or remove edges remain the same (with the exception that attempting to create multiple edges using `addEdges()` with a one-to-one association will result in an error).

## One-to-many association

To create a one-to-many association, define the edges in the class's generic type, and in the `getEdgeConfigs()` method:

```ts
class User extends GraphType<IUserData, { assignedTasks: TodoItem }> {
  // ... ...

  getEdgeConfigs() {
    return {
      assignedTasks: {
        connectedType: TodoItem,
      },
    };
  }
}
```

## Undirected association

Undirected associations represent two-way, bi-directional relationships. Undirected associations MUST connect to an object of the same type. If an object A adds an edge to object B, a corresponding edge from B to A will also be created.

To create an undirected association, set `undirected: true` in the `getEdgeConfigs()` method:

```ts
class TodoItem extends GraphType<ITodoItemData, { relatedTasks: TodoItem }> {
  TYPE_NAME = 'TodoItem';

  getInitialValue(): ITodoItemData {
    return {
      title: '',
      isCompleted: false,
    };
  }

  getEdgeConfigs() {
    return {
      relatedTasks: {
        connectedType: TodoItem,
        undirected: true,
      },
    };
  }
}
```

## One-to-one association

To create a one-to-one association, set `oneToOneEdge: true` in the `getEdgeConfigs()` method:

```ts
class User extends GraphType<IUserData, { activeTask: TodoItem }> {
  // ... ...

  getEdgeConfigs() {
    return {
      activeTask: {
        connectedType: TodoItem,
        oneToOneEdge: true,
      },
    };
  }
}
```

You can also choose to store the destination object's ID in a field on the object. This can be more efficient, reducing the number of joins when querying. To do this, add a field to store the ID (allowing nullable string values), and add the `connectedIDField` parameter to the edge config, referencing the field:

```ts
interface IUserData {
  // ... other fields ...
  activeTaskID: string | null;
}

class User extends GraphType<IUserData, { activeTask: TodoItem }> {
  // ... ...

  getEdgeConfigs() {
    return {
      activeTask: {
        connectedType: TodoItem,
        oneToOneEdge: true,
        connectedIDField: 'activeTaskID' as keyof IUserData,
      },
    };
  }
}
```
