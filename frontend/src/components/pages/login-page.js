import {  html, css  } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";
import { BaseComponent } from "../base-component.js";
import { baseStyles } from "../styles/base.js";
import "../components/auth/login-form.js";

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
      form {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-md);
      }
      .error-message {
        color: var(--error-color);
        margin-top: var(--spacing-sm);
      }
      .field-error {
        color: var(--error-color);
        font-size: 0.875rem;
        margin-top: var(--spacing-xs);
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
      <form @submit=${this._handleSubmit}>
        <div class="form-field">
          <label for="email">Email</label>
          <input type="email" id="email" name="email" required />
          <div class="field-error"></div>
        </div>
        <div class="form-field">
          <label for="password">Password</label>
          <input type="password" id="password" name="password" required />
          <div class="field-error"></div>
        </div>
        ${this.errorMessage
          ? html`<div class="error-message">${this.errorMessage}</div>`
          : ""}
        <button type="submit">Login</button>
      </form>
    `;
  }

  async _handleSubmit(e) {
    e.preventDefault();
    this.errorMessage = "";

    const email = this.shadowRoot.querySelector("#email").value;
    const password = this.shadowRoot.querySelector("#password").value;

    try {
      await this.authService.login(email, password);
    } catch (error) {
      this.errorMessage = error.message;
      this.requestUpdate();
    }
  }
}

customElements.define("login-page", LoginPage);
