# Advanced type features

## Field validation

You can define field validation to perform validation on values set on objects using the `set()` method. To add a validator, implement the `getValidators()` method in the type class:

```ts
import { GraphType, Types } from '@prima-materia/goat';

class TodoItem extends GraphType<ITodoItemData> {
  TYPE_NAME = 'TodoItem';

  getInitialValue(): ITodoItemData {
    return {
      title: '',
      isCompleted: false,
    };
  }

  getValidators() {
    return {
      title: new Types.StringType().shouldBeNonEmpty(),
    };
  }
}
```

The following types are supported:

### `StringType`

A `StringType` represents a string value. You can use the following modifiers:

| Modifier                 | What it does                                                                             |
| ------------------------ | ---------------------------------------------------------------------------------------- |
| `shouldBeNonNull()`      | Prevents you from calling the setter with a null/undefined value.                        |
| `shouldBeNonEmpty()`     | Prevents you from calling the setter with an empty string or a string with blank spaces. |
| `shouldHaveMaxLength(i)` | Enforces the value passed to the setter cannot be longer than `i`.                       |
| `shouldDefaultTo(s)`     | If the value isn't set, uses `s` as the default value.                                   |

### `IntegerType`

An `IntegerType` represents an integer value. If the number should contain decimals use `FloatType`. The following modifiers are available:

| Modifier                    | What it does                                                         |
| --------------------------- | -------------------------------------------------------------------- |
| `shouldBeNonNull()`         | Prevents you from calling the setter with a null/undefined value.    |
| `shouldDefaultTo(i)`        | If the value isn't set, uses `i` as the default value.               |
| `shouldHaveMinimumValue(x)` | Prevents the value passed to the setter from being smaller than `x`. |
| `shouldHaveMaximumValue(x)` | Prevents the value passed to the setter from being larger than `x`.  |

### `FloatType`

A `FloatType` represents a floating-point value. The modifiers are identical to `IntegerType`.

### `BooleanType`

A `BooleanType` represents a boolean value. The available modifiers are:

| Modifier             | What it does                                                      |
| -------------------- | ----------------------------------------------------------------- |
| `shouldBeNonNull()`  | Prevents you from calling the setter with a null/undefined value. |
| `shouldDefaultTo(b)` | If the value isn't set, uses `b` as the default value.            |

### `EnumType`

An `EnumType` represents an enumeration, allowing you to choose from a pre-defined set of values. The modifiers are:

| Modifier             | What it does                                                                        |
| -------------------- | ----------------------------------------------------------------------------------- |
| `shouldBeNonNull()`  | Prevents you from calling the setter with a null/undefined value.                   |
| `shouldBeOneOf(a)`   | Enforces that the value passed to the setter is one of the values in the array `a`. |
| `shouldDefaultTo(o)` | If the value isn't set, uses `o` as the default value.                              |

### `DateTimeType`

A `DateTimeType` represents a Date value. The available modifiers are:

| Modifier             | What it does                                                      |
| -------------------- | ----------------------------------------------------------------- |
| `shouldBeNonNull()`  | Prevents you from calling the setter with a null/undefined value. |
| `shouldDefaultTo(d)` | If the value isn't set, uses `d` as the default value.            |

## Events

Events are callback functions that you can implement on your type class that will be invoked when operations are performed on an object of that type. This can be useful when implementing logging or analytics.

The following events are supported:

| Method                              | Description                                                                                                                                                                               |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onBeforeCreate(viewer, changeset)` | Invoked **before** an object is saved for the first time. The `changeset` parameter contains the object data that will be saved.                                                          |
| `onAfterCreate(viewer)`             | Invoked **after** an object has been saved for the first time.                                                                                                                            |
| `onBeforeUpdate(viewer, changeset)` | Invoked **before** an existing object is saved. The changeset contains the object data to be saved.                                                                                       |
| `onAfterUpdate(viewer)`             | Invoked **after** an existing object has been modified and saved.                                                                                                                         |
| `onBeforeDelete(viewer)`            | Invoked **before** an object is to be deleted. At the point this event is invoked, `delete()` has been called on the object, but the deletion has not yet been committed to the database. |
