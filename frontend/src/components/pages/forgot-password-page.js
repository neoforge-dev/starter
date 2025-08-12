import {   LitElement, html, css   } from 'lit';
import { baseStyles } from "../styles/base.js";

export class ForgotPasswordPage extends LitElement {
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
      <h1>Forgot Password</h1>
      <p>Please enter your email to receive a password reset link.</p>
      <!-- Future implementation of forgot-password form -->
    `;
  }
}

customElements.define("forgot-password-page", ForgotPasswordPage);
