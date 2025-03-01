import { LitElement, html } from "lit";

export class HomePage extends LitElement {
  render() {
    return html`<div>Home Page</div>`;
  }
}

customElements.define("home-page", HomePage);
