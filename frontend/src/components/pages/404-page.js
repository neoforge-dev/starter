import { 
  LitElement,
  html,
 } from 'lit';

export class PageNotFound extends LitElement {
  render() {
    return html`<h1>404 - Page Not Found</h1>`;
  }
}
customElements.define("page-not-found", PageNotFound);
