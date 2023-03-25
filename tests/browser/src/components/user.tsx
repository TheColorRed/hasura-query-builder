export class User extends HTMLElement {
  user: string | number = '';

  connectedCallback() {
    this.append(<div>{this.user.toString()}</div>);
  }
}
customElements.define('app-user', User);
