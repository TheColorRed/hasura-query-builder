import { Model } from '@hasura-query-builder/core';
import { names } from './users.data';

export class UsersModel extends Model {
  override readonly table = 'users';
  override readonly primary = ['id'];
  override readonly fields = {
    /** The users automatically generated id. */
    id: 0,
    /** The users first name. */
    first: String(),
    /** The users last name. */
    last: '',
  };
  override readonly attributes = {
    /** The users full name combining their first and last names. */
    full: row => `${row.first} ${row.last}`,
    /** A random unique id. */
    uuid: () => crypto.randomUUID(),
    /** A base64 value combining the full name and unique id. */
    base64: row => btoa(row.full + row.uuid),
  };

  /**
   * Gets all users from the database.
   * @returns A list of users.
   */
  getUsers() {
    return (
      UsersModel.all()
        // .order('last', 'desc')
        // .field(row => ({
        //   full: `${row.first} ${row.last}`,
        // }))
        // .field(row => ({
        //   uuid: `${row.first}-${row.last}-${row.id}`,
        // }))
        // .where('first', '_ilike', 's%')
        // .where('last', '_ilike', 't%')
        // .or(builder => builder.where('id', '_eq', 1).where('first', 'Billy').where('id', '_gt', 3))
        .cursor(10, 'id', 10)
        .watch()
      // .pipe(tap(() => console.debug('hi')))
    );
  }
  /**
   * Get a user by their id.
   */
  getUser(id: number) {
    return UsersModel.find(id).first();
  }
  deleteUserByFirst(first: string) {
    return UsersModel.delete().where('first', first).save();
  }
  /**
   * Adds multiple users to the database with random first and last names.
   */
  populateUsers() {
    return UsersModel.insert(names).save();
  }
}
