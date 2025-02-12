import { LitElement, html, css } from "/vendor/lit-core.min.js";
import { baseStyles } from "../styles/base.js";
import "../components/auth/login-form.js";

export class LoginPage extends LitElement {
  static styles = [
    baseStyles,
    css`
      :host {
        display: block;
        padding: var(--spacing-xl);
        max-width: 600px;
        margin: 0 auto;
      }
      h1 {
        text-align: center;
        margin-bottom: var(--spacing-lg);
        color: var(--text-color);
      }
    `,
  ];

  render() {
    return html`
      <h1>Login</h1>
      <login-form></login-form>
    `;
  }
}

customElements.define("login-page", LoginPage);
