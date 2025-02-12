import { LitElement, html, css } from "/vendor/lit-core.min.js";
import { baseStyles } from "../styles/base.js";

export class StatusPage extends LitElement {
  static styles = [
    baseStyles,
    css`
      :host {
        display: block;
        padding: var(--spacing-xl);
        text-align: center;
      }
      h1 {
        color: var(--text-color);
        margin-bottom: var(--spacing-lg);
      }
    `,
  ];

  render() {
    return html`
      <h1>System Status</h1>
      <p>All systems are operational.</p>
    `;
  }
}

customElements.define("status-page", StatusPage);
