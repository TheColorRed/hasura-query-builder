import { UsersModel } from '../models/users.model';

customElements.define(
  'app-users',
  class Users extends HTMLElement {
    // override shadowRoot = this.attachShadow({ mode: 'closed' });
    connectedCallback() {
      // UsersModel.delete().where('first', 'Ralph').save().subscribe();
      // new UsersModel().populateUsers().subscribe();
      UsersModel.all().where('first', '_ilike', 'Ryan%').values('first').subscribe(console.debug);
      // UsersModel.all().where('first', 'Ralph').get().subscribe();

      // UsersModel.update({ first: 'John', last: 'Doe' });
      // const sub = UsersModel.all().getUsers();
      // // sub.updated$.pipe(tap(() => (this.innerHTML = ''))).subscribe();
      // sub.state$.pipe(tap(user => this.appendChild(<app-user user={user.full}></app-user>))).subscribe();
      // sub.closed$.pipe(tap(() => console.debug('subscription closed.'))).subscribe();

      // const sub = UsersModel.all().watch();

      // sub.updated$
      //   .pipe(
      //     tap(() => (this.innerHTML = '')),
      //     tap(() => sub.close())
      //   )
      //   .subscribe();
      // sub.state$.pipe(tap(user => this.appendChild(<app-user user={user.full}></app-user>))).subscribe();
      // sub.closed$.pipe(tap(() => console.debug('subscription closed.'))).subscribe();
    }
  }
);
