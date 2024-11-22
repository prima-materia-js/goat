# GOAT

GOAT is a graph database layer where data is represented as nodes, with edges representing relationships between nodes. The name GOAT is an acronym for Graph Objects, Associations and Types. GOAT is a runtime object graph mapping (OGM) layer, supporting multiple database engines as its underlying storage layer.

### The internal bits

GOAT stores all data as _objects_ (nodes) or _associations_ (edges), and uses two tables to store these. Within each object, the data is stored as JSON. Before choosing to use GOAT, think about whether a graph database is ideal for your use case. Graph databases make sense when you don't need to perform lookups a lot, and your objects are connected from a single starting node.

For example, a simplified data model for a task tracker could be:

```
    User --has--> tasks --has--> comments
     |              |-----has--> activity
     |
     |-----has--> projects --has--> tasks
    ...
```

Here, the only lookup needed is for `User` which gets queried by user ID (based on the currently logged-in user). All other objects (`Tasks`, `Projects`, `Comments`, etc.) are connected to the user via some relationship, and can be fetched through those edges. On the other hand, a graph database wouldn't be ideal for a wiki where you may need to do lookups on page content.
