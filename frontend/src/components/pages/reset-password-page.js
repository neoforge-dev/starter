import {   LitElement, html, css   } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";
import { baseStyles } from "../styles/base.js";

export class ResetPasswordPage extends LitElement {
  static styles = [
    baseStyles,
    css`
      :host {
        display: block;
        padding: var(--spacing-xl);
        max-width: 600px;
        margin: auto;
        text-align: center;
      }
      h1 {
        margin-bottom: var(--spacing-lg);
        color: var(--text-color);
      }
    `,
  ];

  render() {
    return html`
      <h1>Reset Password</h1>
      <p>Please enter your new password.</p>
      <!-- Future implementation of reset-password form -->
    `;
  }
}

customElements.define("reset-password-page", ResetPasswordPage);
