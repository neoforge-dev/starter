import { LitElement, html, css } from "lit";
import { authService } from "../services/auth.js";

export class LoginForm extends LitElement {
  static properties = {
    isLoading: { type: Boolean },
    errorMessage: { type: String },
  };

  static styles = css`
    :host {
      display: block;
      max-width: 400px;
      margin: 0 auto;
      padding: 2rem;
    }

    .form-group {
      margin-bottom: 1.5rem;
    }

    label {
      display: block;
      margin-bottom: 0.5rem;
      color: var(--text-color);
      font-weight: 500;
    }

    input {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #e2e8f0;
      border-radius: 4px;
      font-size: 1rem;
      transition: border-color 0.2s;
    }

    input:focus {
      outline: none;
      border-color: var(--primary-color);
      box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
    }

    button {
      width: 100%;
      padding: 0.75rem;
      background-color: var(--primary-color);
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 1rem;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    button:hover {
      background-color: var(--primary-color-dark);
    }

    button:disabled {
      background-color: var(--disabled-color);
      cursor: not-allowed;
    }

    .error-message {
      color: var(--error-color);
      font-size: 0.875rem;
      margin-top: 0.5rem;
    }

    .field-error {
      color: var(--error-color);
      font-size: 0.875rem;
      margin-top: 0.25rem;
    }

    .loading-spinner {
      display: inline-block;
      width: 1.5rem;
      height: 1.5rem;
      border: 2px solid var(--primary-color);
      border-radius: 50%;
      border-top-color: transparent;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }

    .password-requirements {
      margin-top: 0.5rem;
      font-size: 0.875rem;
      color: var(--text-color-secondary);
    }

    .password-strength {
      margin-top: 0.25rem;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .password-strength.weak {
      color: var(--error-color);
    }

    .password-strength.medium {
      color: var(--warning-color);
    }

    .password-strength.strong {
      color: var(--success-color);
    }

    .toggle-password {
      position: absolute;
      right: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      color: var(--text-color-secondary);
      cursor: pointer;
      padding: 0.25rem;
    }

    .toggle-password:hover {
      color: var(--text-color);
    }

    .forgot-password {
      display: block;
      text-align: right;
      margin-top: 0.5rem;
      color: var(--primary-color);
      text-decoration: none;
      font-size: 0.875rem;
    }

    .forgot-password:hover {
      text-decoration: underline;
    }

    .remember-me {
      display: flex;
      align-items: center;
      margin-top: 1rem;
      font-size: 0.875rem;
    }

    .remember-me input[type="checkbox"] {
      width: auto;
      margin-right: 0.5rem;
    }

    .timeout-message {
      color: var(--warning-color);
      font-size: 0.875rem;
      margin-top: 1rem;
      text-align: center;
    }
  `;

  constructor() {
    super();
    this.isLoading = false;
    this.errorMessage = "";
  }

  render() {
    return html`
      <form
        @submit=${this._handleSubmit}
        id="login-form"
        role="form"
        aria-label="Login form"
      >
        <div class="form-group">
          <label for="email">Email</label>
          <input type="email" id="email" name="email" data-testid="login-email" required />
          <div class="field-error" id="email-error"></div>
        </div>
        <div class="form-group">
          <label for="password">Password</label>
          <div style="position: relative;">
            <input type="password" id="password" name="password" data-testid="login-password" required />
            <button
              type="button"
              class="toggle-password"
              @click=${this._togglePassword}
            >
              ${this._isPasswordVisible ? "Hide" : "Show"}
            </button>
          </div>
          <div class="field-error" id="password-error"></div>
          <div class="password-requirements">
            Password must be at least 8 characters long
          </div>
          <div class="password-strength"></div>
        </div>
        ${this.errorMessage
          ? html`<div class="error-message" data-testid="error">${this.errorMessage}</div>`
          : ""}
        <button type="submit" data-testid="login-button" ?disabled=${this.isLoading}>
          ${this.isLoading
            ? html`<span class="loading-spinner"></span>`
            : "Login"}
        </button>
        <a href="#" class="forgot-password" @click=${this._showForgotPassword}>
          Forgot password?
        </a>
        <div class="remember-me">
          <input
            type="checkbox"
            id="remember-me"
            @change=${this._handleRememberMe}
          />
          <label for="remember-me">Remember me</label>
        </div>
      </form>
    `;
  }

  _isPasswordVisible = false;

  _togglePassword() {
    const passwordInput = this.shadowRoot.querySelector("#password");
    this._isPasswordVisible = !this._isPasswordVisible;
    passwordInput.type = this._isPasswordVisible ? "text" : "password";
    this.requestUpdate();
  }

  _showForgotPassword(e) {
    e.preventDefault();
    this.dispatchEvent(new CustomEvent("show-forgot-password"));
  }

  _handleRememberMe(e) {
    this.dispatchEvent(
      new CustomEvent("remember-me-change", {
        detail: { checked: e.target.checked },
      })
    );
  }

  async _handleSubmit(e) {
    e.preventDefault();
    this.errorMessage = "";

    const email = this.shadowRoot.querySelector("#email").value;
    const password = this.shadowRoot.querySelector("#password").value;

    try {
      this.isLoading = true;
      this.requestUpdate();

      await authService.login(email, password);

      this.dispatchEvent(
        new CustomEvent("login-success", {
          detail: { email },
        })
      );
    } catch (error) {
      this.errorMessage = error.message;
      this.dispatchEvent(
        new CustomEvent("login-error", {
          detail: { message: error.message },
        })
      );
    } finally {
      this.isLoading = false;
      this.requestUpdate();
    }
  }
}

customElements.define("login-form", LoginForm);
