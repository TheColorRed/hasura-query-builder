// import { Direction, QueryBuilder, Table } from '@hasura-query-builder/core';
import { Connections, Model } from '@hasura-query-builder/core';
import { concatMap, delay, of, tap } from 'rxjs';
// const products = new Table('products').select('name', 'description').where({ name: { _neq: '' } });
// const bio = new Table('bio').select('bio');

// const users = new Table('users')
//   .select('first', 'last')
//   // .select('first', 'last', [products, bio])
//   .order([{ first: Direction.Asc }, { last: Direction.Asc }])
//   // .where('name', '_is_null', 'cat')
//   .where('first', 'Ryan');
// // .where({ products: {} });

// const query = new QueryBuilder(users).get();
// const query = new QueryBuilder({ tables: [users, bio, products], operation: 'UserQuery' }).get();

Connections.create({
  connections: {
    default: {
      url: new URL('https://busy-boxer-29.hasura.app/v1/graphql'),
      headers: {
        'x-hasura-admin-secret': '3x0v59po46zqTZXgEf8clpw8WbbSE0Ka4S3pYOs1c3zKV71wffsOa6wlBNVnse3P',
      },
    },
  },
  // settings: { logging: true },
});

Connections.set('monkey', {
  url: new URL('https://busy-boxer-29.hasura.app/v1/graphql'),
  headers: {},
});

export class Bio extends Model {
  override table = 'bio';
  override fields = { user_id: Number(), bio: String() };
  override primary = ['id'];
}

export class Users extends Model {
  override table = 'users';
  override fields = { id: Number(), first: String(), last: String(), bio: Bio };
  override primary = ['id'];
}

// const user = Users.all().succession();
// const upsert = new Users().set({ first: '123', last: '123' }).upsert();

// from(user)
Users.connection('default')
  .all()
  .succession()
  .pipe(
    // tap(() => debug.logAndExit('hi')),
    concatMap(i => of(i).pipe(delay(500))),
    tap(i => console.log(i.bio ?? 'none'))
  )
  .subscribe();

// const test = Users.all()
//   .where('id', 1)
//   // .where('first', 'Ryan')
//   // .whereTruthy('bio')
//   // .whereTruthy('bio')
//   // .select('first', 'last')
//   // .order('first', Direction.Asc)
//   // .distinct('first')
//   // .order([{ last: Direction.Asc }])
//   // .limit(1)
//   .exists()
//   .pipe(tap(i => console.log(i)))
//   .subscribe();
// test.set('first', 'Naddy').set('last', 'Ryan');
// console.log(test);
// const query = new QueryBuilder(test['builder']).get();
// console.log(query.variables);
