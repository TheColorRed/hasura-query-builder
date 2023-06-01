# Hasura Query Builder

## Introduction

Hasura Query Builder is a UI component that allows you to build GraphQL queries and mutations in JavaScript and TypeScript. It is built for use with [Hasura GraphQL Engine](https://hasura.io/docs/latest/graphql/core/index.html).

## Installation

```bash
npm install @hasura-query-builder/core
```

## Usage

There are two ways that the query builder can be used:

- By creating a model and setting the model's properties, then just querying against the model.
- By creating a table and building a query from it.

### Setting up connections

Calling `Connections.create()` will set up the connections that will be used by the query builder. The connections are used to determine which connection to use when building a query. The connections are also used to determine the default connection to use when no connection is specified. Make sure to call `Connections.create()` before making an http request.

```typescript
import { Connections } from '@hasura-query-builder/core';

Connections.create({
  connections: {
    // The default connection when no connection is specified.
    // Note: The "default" connection is required. All other connections are optional.
    default: {
      url: new URL('https://example/v1/graphql'),
      headers: {
        'my-header': 'abc123',
      },
    },
    // Use the defaults for the public connection.
    public: new URL('https://example/v1/graphql'),
  },
});
```

### Basic query generation

When you are not using one of the plugins, you have to manually make the http request. However, when using a plugin, the http request logic is handled for you.

<!-- prettier-ignore -->
```typescript
import { QueryBuilder, Table } from '@hasura-query-builder/core';

const users = new Table('users').select(['id', 'name']).where({ id: { _eq: 1 } });
const build = new QueryBuilder(users).baseSelect.build();

// make the http request
```

### Using a Model

When using a Model, the table and fields are automatically set when the query is made with the query builder (These can be overridden with the `table()` and `select()` methods on the model). We also don't need to call the `QueryBuilder.baseSelect.build()` method because the query builder will automatically call it for us when we call one of the request methods.

```typescript
import { Model } from '@hasura-query-builder/core';

class User extends Model {
  override table = 'users';
  override fields = {
    id: Number(),
    name: String(),
  };

  // Get a user by id.
  // This model is not modifiable outside of the method since "get()" is called, we can only subscribe to it.
  static getUser(id: number) {
    return this.all()
      .where({ id: { _eq: id } })
      .get();
  }

  // Get users older than 18.
  // This model is modifiable outside of the method since "get()" is not called.
  static getAdults() {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 18);
    return this.all().where({
      dob: { _gte: date },
    });
  }
}
```

We can now use the model to make queries. We do so by calling the model statically and either calling one of the pre-defined methods or by calling one of the custom methods we defined in the model.

To trigger a query, a `trigger` method must be called. The `trigger` method can be one that is found in [this list](#model-trigger-methods) or it can be a custom method that was defined in the model.

```typescript
// Get a user by id using the static method.
User.getUser(1).subscribe(result => console.log(result));

// Get users older than 18 using the static method.
// Then make sure those users are "male".
User.getAdults()
  .where('gender', 'male')
  .get()
  .subscribe(result => console.log(result));

// Getting our own fields.
User.all()
  .select('id', 'name', 'dob')
  .where('id', 1)
  .get()
  .subscribe(result => console.log(result));

// Getting our own fields on a different table.
User.all()
  .select('id', 'name', 'dob')
  .table('users2')
  .where('id', 1)
  .get()
  .subscribe(result => console.log(result));
```

## Model Overrides

| Property   | Type        | Description                                                           | required |
| ---------- | ----------- | --------------------------------------------------------------------- | -------- |
| table      | string      | The name of the table.                                                | Yes      |
| fields     | object      | An object containing the fields of the table.                         | Yes      |
| primary    | string      | The name of the primary key.                                          | No       |
| connection | string      | The name of the connection to use.                                    | No       |
| expand     | Model/Table | Adds the parent model as a child property.                            | No       |
| attributes | object      | An object containing functions that return values for virtual fields. | No       |

### Field Overrides

When defining a field, the type should be assigned to that field. Which can accept different types of values.

<!-- prettier-ignore -->
```typescript
import { Json } from '@hasura-query-builder/core';

export class Child extends Model {
  // Override the table name and fields.
}

export class Example extends Model {
  override fields = {
    id: Number(),            // This field is a number.
    name: String(),          // This field is a string.
    is_active: Boolean(),    // This field is a boolean.
    data: Json({             // This field is a json object.
      a: String(),           // The json object has field called "a" that is a string.
      b: Number(),           // The json object has field called "b" that is a number.
    }),
    model: Child             // This field is a child model.
    table: new Table('info') // This field is a table.
      .select('id', 'name')
      .where({ id: { _eq: 1 } }),
  };
}
```

## Model Initiation Methods

Initiation methods only initiate a query type, such as `select`, `insert`, `update`, or `delete`. They do not trigger the query. To trigger the query, a [trigger method](#model-trigger-methods) must be called.

| Method Name | Description                                               |
| ----------- | --------------------------------------------------------- |
| `all()`     | Creates a query that gets all the records from the table. |
| `find()`    | Creates a query that gets a record by the primary key.    |
| `call()`    | Creates a table with custom parameters.                   |
| `insert()`  | Creates a query that inserts a record.                    |
| `update()`  | Creates a query that updates a record.                    |
| `delete()`  | Creates a query that deletes a record.                    |

<!-- prettier-ignore -->
```typescript
export class Example extends Model {
  override fields = {
    id: Number(),
    name: String(),
  };
}

// Get all the records from the table.
Example.all();
// Get a record by the primary key.
Example.find(1);
// Call a table with custom parameters.
Example.call({ param1: 1, param2: 'test' });
// Insert a record.
Example.insert({ name: 'test' });
// Insert multiple records.
Example.insert([{ name: 'test' }, { name: 'test2' }]);
// Insert a record and update fields on conflict.
Example.insert(
  [{ name: 'test' }, { name: 'test2' }],
  { constraint: 'example_pk', fields: ['name'] }
);
// Update records.
// **NOTE:** This will throw an error if no where clause or primary key is defined.
Example.update({ name: 'test' });
// Delete records.
// **NOTE:** This will throw an error if no where clause or primary key is defined.
Example.delete();
```

## Table Builder Methods

These methods can be used on both the model and table classes. They create a query that gets built when one one of the [trigger methods](#model-trigger-methods) is called.

| Method Name     | Description                                              |
| --------------- | -------------------------------------------------------- |
| `alias()`       | Sets the alias for the table.                            |
| `select()`      | Sets the fields to select.                               |
| `where()`       | Sets the where clause.                                   |
| `or()`          | Creates a grouped or clause within the where clause.     |
| `and()`         | Creates a grouped and clause within the where clause.    |
| `whereFalsy()`  | Sets a where clause where a field contains null.         |
| `whereTruthy()` | Sets a where clause where a field does not contain null. |
| `order()`       | Sets the order by clause.                                |
| `limit()`       | Sets the limit clause.                                   |
| `offset()`      | Sets the offset clause.                                  |
| `paginate()`    | Sets the pagination options.                             |
| `distinct()`    | Sets the distinct clause.                                |
| `field()`       | Creates one or more fields using a function.             |
| `cursor()`      | Creates a cursor for the table.                          |

```typescript
export class Example extends Model {}

// Selecting fields.
Example.all().select('id', 'name');
// Setting the where clause using an object.
Example.all().where({ id: { _eq: 1 } });
// Setting the where clause with an is equal operator.
// Calling `where` multiple times is equivalent to using an `and` operator.
Example.all().where('id', 1).where('gender', 'male');
// Setting the where clause with greater than or equal operator.
Example.all().where('id', '_gte', 1);
// Setting an or clause creates:
// { _or: [{ first: 'Bill' }, { first: 'Sue' }] }
Example.all().or(builder => builder.where('first', 'Bill').where('first', 'Sue'));
// Setting an and clause creates:
// { _and: [{ first: 'Bill' }, { last: 'Smith' }] }
Example.all().and(builder => builder.where('first', 'Bill').where('last', 'Smith'));
// Setting a falsy where clause.
Example.all().whereFalsy('id', 'name');
// Setting a truthy where clause.
Example.all().whereTruthy('id', 'name');
// Setting the order by clause.
Example.all().order('id', 'desc');
// Setting the limit clause.
Example.all().limit(10);
// Setting the limit and offset clause.
Example.all().limit(10, 10);
// Setting the offset clause.
Example.all().offset(10);
// Setting the distinct clause.
Example.all().distinct('first', 'last');
// Setting additional fields.
Example.all().field(row => ({ full_name: `${row.first} ${row.last}` }));
```

### Pagination

The pagination method returns a pagination object that can be used to paginate the results by calling one of the following methods:

| Method Name  | Description                        |
| ------------ | ---------------------------------- |
| `first()`    | Gets the first page of results.    |
| `previous()` | Gets the previous page of results. |
| `next()`     | Gets the next page of results.     |
| `last()`     | Gets the last page of results.     |
| `page()`     | Gets a specific page of results.   |

```typescript
export class Example extends Model {
  override table = 'example';
  // override fields = { ... };
}

const paginator = Example.all()
  .where({ gender: { _eq: 'female' } })
  .paginate({ resultsPerPage: 10 });

paginator.page$.subscribe(page => {
  console.log(page);
});

// Call one of the following methods to get the results for the desired page:
// **NOTE:** The paginator will not automatically call the first page.
// **NOTE:** You must call `first()`, `last()`, or `page()` to get the initial page data.
// Go to the first page.
paginator.first();
// Go to the previous page.
paginator.previous();
// Go to the next page.
paginator.next();
// Go to the last page.
paginator.last();
// Go to a specific page.
paginator.page(5);
```

## Model Trigger Methods

These methods tell the builder what style of query to build. The builder will then build the query and emit the results.

**Note:** The requests do not get called until `.subscribe()` is called on the observable.

**Note:** Mutations should call `save()` to execute the mutation, and queries can call any of the other trigger methods.

| Method Name     | Description                                                                                     |
| --------------- | ----------------------------------------------------------------------------------------------- |
| `find()`        | Finds a record by the primary key.                                                              |
| `get()`         | Gets an array of results.                                                                       |
| `first()`       | Gets the first result that was found as an object.                                              |
| `stream()`      | Gets an array of results. The observable will then emit the items one at a time.                |
| `chunk()`       | Emits the result in chunks of `x` items.                                                        |
| `lazy()`        | Emits the result in chunks of `x` items. The observable will then emit the items one at a time. |
| `value()`       | Gets the value of the first found row of a specific field.                                      |
| `values()`      | Gets the values of a specific field from all of the found results.                              |
| `count()`       | Gets the number of results that were found.                                                     |
| `max()`         | Gets the maximum value of one or more fields.                                                   |
| `min()`         | Gets the minimum value of one or more fields.                                                   |
| `sum()`         | Gets the sum of one or more fields.                                                             |
| `avg()`         | Gets the average of one or more fields.                                                         |
| `exists()`      | Gets a boolean value indicating that a value exists for the query.                              |
| `doesntExist()` | Gets a boolean value indicating that a value does not exist for the query.                      |
| `save()`        | Creates a mutation that will `insert`, `update`, or `delete` a record.                          |

```typescript
export class Example extends Model {
  override table = 'example';
  // override fields = { ... };
}

// Get an array of records.
Example.all().get();
// Get an array of records that match the where clause.
Example.all().where('age' '_gte', 18).get();
// Get the first record.
Example.all().first();
// Get the first record that matches the where clause.
Example.all().where('id', 1).first();
// Stream the results one at a time.
Example.all().stream();
// Stream the results in chunks of 10.
Example.all().chunk(10);
// Stream the results in chunks of 10 and emit each item one at a time.
Example.all().lazy(10);
// Get the `id` field of the first found result.
Example.all().value('id');
// Get the `id` field of all found results.
Example.all().values('id');
// Get the count of all rows.
Example.all().count();
// Get the maximum value of the `id` field.
Example.all().max('id', 'age');
// Get the minimum value of the `id` field.
Example.all().min('id', 'age');
// Get the sum of the `id` field.
Example.all().sum('id', 'age');
// Get the average of the `id` field.
Example.all().avg('id', 'age');
// Get a boolean value indicating that a value exists for the query.
Example.all().where('id', 1752).exists();
// Get a boolean value indicating that a value does not exist for the query.
Example.all().where('id', 2865).doesntExist();
// Insert a record.
Example.insert({ first: 'John', last: 'Doe' }).save();
// Update a record.
Example.update({ first: 'John', last: 'Doe' }).where('id', 1).save();
// Delete a record.
Example.delete().where('id', 1).save();
```
