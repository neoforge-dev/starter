import { LitElement, html, css } from "lit";
import { baseStyles } from "../styles/base.js";
import "../components/auth/verify-email.js";

export class VerifyEmailPage extends LitElement {
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
      <h1>Verify Your Email</h1>
      <verify-email></verify-email>
    `;
  }
}

customElements.define("verify-email-page", VerifyEmailPage);
