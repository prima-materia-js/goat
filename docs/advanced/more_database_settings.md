# More database settings

## Storage mode

By default, GOAT stores data in two tables - an `objects` table storing all graph objects, and an `associations` table storing edges between objects. (Additional tables may be created if you add indexes.)

You can change how object data is stored by setting the `storageMode` key in the configuration when creating the `GoatDatabase` instance. The supported values are:

- `single_table`: _(Default)_ All graph objects are stored in a single `objects` table.
- `multi_table`: Each graph object type is stored in its own table using the `TYPE_NAME` value. For example, graph objects of a type with `TYPE_NAME = 'User'` will be stored in a table named "User".

For example:

```ts
import { GoatDatabase } from `@prima-materia/goat`;

const db = new GoatDatabase({
  /// ... other settings ...

  storageMode: 'multi_table',
});
```

## Logging level

GOAT logs warnings or errors by default. You can change the logging level to also log informational or debug messages, or to only log errors. Set the `minimumLogLevel` parameter in the GoatDatabase configuration to one of:

- `LogLevel.Debug`: Log all messages, including debugging messages. _(Not recommended for production.)_
- `LogLevel.Info`: Log informational, warning and error messages. _(Not recommended for production.)_
- `LogLevel.Warn`: _(Default)_ Log warning and error messages.
- `LogLevel.Error`: Log only error messages.

For example:

```ts
import { GoatDatabase, LogLevel } from `@prima-materia/goat`;

const db = new GoatDatabase({
  /// ... other settings ...

  minimumLogLevel: LogLevel.Info,
});
```
