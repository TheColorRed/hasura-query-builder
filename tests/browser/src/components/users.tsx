import { of } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { UsersModel } from '../models/users.model';

interface UserRow {
  first: string;
  last: string;
  id: number;
}

customElements.define(
  'app-users',
  class Users extends HTMLElement {
    paginator = UsersModel.all().options({ cache: true }).paginate<UserRow>({ resultsPerPage: 20 });

    css = document.createElement('style');

    shadow = this.attachShadow({ mode: 'open' }).append(
      <div className="users">
        <div id="content"></div>
        <div className="actions">
          <button disabled id="first" onclick={() => this.paginator.first()}>
            First
          </button>
          <button disabled id="prev" onclick={() => this.paginator.previous()}>
            Prev
          </button>
          <div className="stats">
            <span id="page">0</span>
            <span>of</span>
            <span id="total">0</span>
          </div>
          <button disabled id="next" onclick={() => this.paginator.next()}>
            Next
          </button>
          <button disabled id="last" onclick={() => this.paginator.last()}>
            Last
          </button>
        </div>
      </div>
    );

    content = this.shadowRoot?.querySelector('#content') as HTMLDivElement;
    firstButton = this.shadowRoot?.querySelector('button[id="first"]') as HTMLButtonElement;
    prevButton = this.shadowRoot?.querySelector('button[id="prev"]') as HTMLButtonElement;
    nextButton = this.shadowRoot?.querySelector('button[id="next"]') as HTMLButtonElement;
    lastButton = this.shadowRoot?.querySelector('button[id="last"]') as HTMLButtonElement;
    pageSpan = this.shadowRoot?.querySelector('span[id="page"]') as HTMLSpanElement;
    totalSpan = this.shadowRoot?.querySelector('span[id="total"]') as HTMLSpanElement;

    page = this.paginator.page$.pipe(
      switchMap(page =>
        of(page.results).pipe(
          tap(() => (this.content.innerHTML = '')),
          switchMap(i => i),
          tap(user => {
            this.content.appendChild(<app-user user={user.id + '. ' + user.first}></app-user>);
            this.prevButton.disabled = page.isFirstPage;
            this.nextButton.disabled = page.isLastPage;
            this.firstButton.disabled = page.isFirstPage;
            this.lastButton.disabled = page.isLastPage;
            this.pageSpan.innerText = page.currentPage.toString();
            this.totalSpan.innerText = page.totalPages.toString();
          })
        )
      )
    );
    // .subscribe();

    connectedCallback() {
      // this.cache.fill([['first', { first: 'Ralph', last: 'Johnson', age: 25, email: 'example@example.com' }]]);
      // console.debug(this.cache.get('first'));

      UsersModel.all().cursor(10, 'id', 1).get().subscribe(console.debug);

      // this.paginator.first();
      this.css.textContent = `
      .users {
        width: 250px;
        display: flex;
        flex-direction: column;
        gap: 20px;
      }
      .stats {
        display: flex;
        gap: 10px;
      }
      .actions {
        display: flex;
        justify-content: space-between;
      }
      `;
      this.shadowRoot?.prepend(this.css);

      // Raw.file<{ users: { first: string }[] }>('/users.gql')
      //   .pipe(
      //     switchMap(i => i.users),
      //     tap(user => this.appendChild(<app-user user={user.first}></app-user>))
      //   )
      //   .subscribe();

      // UsersModel.delete().where('first', 'Ralph').save().subscribe();
      // new UsersModel().populateUsers().subscribe();
      // UsersModel.all().where('first', '_ilike', 'Ryan%').values('first').subscribe(console.debug);
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
