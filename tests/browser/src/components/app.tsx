export class App extends HTMLElement {
  connectedCallback() {
    this.appendChild(<app-users></app-users>);
  }
}
customElements.define('app-root', App);
