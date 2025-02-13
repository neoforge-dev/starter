import {
  LitElement,
  html,
} from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";

export class PageNotFound extends LitElement {
  render() {
    return html`<h1>404 - Page Not Found</h1>`;
  }
}
customElements.define("page-not-found", PageNotFound);
