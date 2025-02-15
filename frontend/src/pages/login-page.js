import { LitElement, html, css } from "lit";
import { customElement } from "lit/decorators.js";
import { baseStyles } from "../styles/base.js";

@customElement("login-page")
export class LoginPage extends LitElement {
  static styles = [
    baseStyles,
    css`
      :host {
        display: block;
        padding: var(--spacing-lg);
      }

      .login-container {
        max-width: 400px;
        margin: 0 auto;
        padding: var(--spacing-lg);
        border-radius: var(--border-radius);
        box-shadow: var(--shadow-md);
      }

      h1 {
        font-size: var(--font-size-xl);
        margin-bottom: var(--spacing-lg);
        text-align: center;
      }

      .login-form {
        display: grid;
        gap: var(--spacing-md);
      }

      .form-footer {
        margin-top: var(--spacing-md);
        text-align: center;
      }
    `,
  ];

  render() {
    return html`
      <div class="login-container">
        <h1>Login</h1>
        <div class="login-form">
          <input type="email" placeholder="Email" />
          <input type="password" placeholder="Password" />
          <button>Sign In</button>
          <div class="form-footer">
            <a href="/register">Don't have an account? Sign up</a>
          </div>
        </div>
      </div>
    `;
  }
}
