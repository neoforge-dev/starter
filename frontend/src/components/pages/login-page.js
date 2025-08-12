import {   html, css   } from 'lit';
import { BaseComponent } from "../base-component.js";
import { baseStyles } from "../styles/base.js";
import "../auth/login-form.js";

export class LoginPage extends BaseComponent {
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

  constructor() {
    super();
    this.errorMessage = "";
  }

  render() {
    return html`
      <h1>Login</h1>
      <login-form
        .isLoading=${this.isLoading}
        .errorMessage=${this.errorMessage}
        @login-success=${this._handleLoginSuccess}
        @login-error=${this._handleLoginError}
      ></login-form>
    `;
  }

  _handleLoginSuccess(e) {
    this.dispatchEvent(new CustomEvent("login-success", { detail: e.detail }));
  }

  _handleLoginError(e) {
    this.errorMessage = e.detail.message;
    this.requestUpdate();
  }
}

customElements.define("login-page", LoginPage);
