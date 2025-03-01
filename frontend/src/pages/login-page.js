import {  html, css  } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";
import {
  BaseComponent,
  defineComponent,
} from "../components/base-component.js";
import { baseStyles } from "../styles/base.js";

/**
 * @element login-page
 * @description Login page component with authentication form
 */
@defineComponent("login-page")
export class LoginPage extends BaseComponent {
  static properties = {
    loading: { type: Boolean, state: true },
    error: { type: String, state: true },
    emailError: { type: String, state: true },
    passwordError: { type: String, state: true },
    rememberUser: { type: Boolean },
    isValidToken: { type: Boolean },
    token: { type: String },
    showForgotPassword: { type: Boolean, state: true },
    showPassword: { type: Boolean, state: true },
    sessionTimeout: { type: Boolean, state: true },
    timeoutMessage: { type: String, state: true },
  };

  static styles = [
    baseStyles,
    css`
      :host {
        display: block;
        padding: var(--spacing-xl);
        max-width: 400px;
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

      .form-field {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-xs);
        position: relative;
      }

      label {
        font-weight: 500;
        color: var(--text-color);
      }

      input {
        padding: var(--spacing-sm);
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius);
        font-size: 1rem;
      }

      button {
        padding: var(--spacing-sm);
        background-color: var(--primary-color);
        color: white;
        border: none;
        border-radius: var(--border-radius);
        font-size: 1rem;
        cursor: pointer;
        transition: background-color 0.2s;
      }

      button:hover {
        background-color: var(--primary-color-dark);
      }

      .error-message,
      .email-error,
      .password-error {
        color: var(--error-color);
        font-size: 0.875rem;
      }

      .loading-spinner {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 200px;
      }

      .error-container {
        color: var(--error-color);
        text-align: center;
        margin: var(--spacing-md) 0;
      }

      .login-form,
      .reset-form {
        display: grid;
        gap: var(--spacing-md);
      }

      .password-requirements {
        display: none;
        position: absolute;
        top: 100%;
        left: 0;
        background: var(--surface-color);
        padding: var(--spacing-sm);
        border-radius: var(--border-radius);
        font-size: 0.875rem;
        box-shadow: var(--shadow-sm);
        z-index: 1;
      }

      .password-requirements.visible {
        display: block;
      }

      .password-strength {
        height: 4px;
        margin-top: var(--spacing-xs);
        border-radius: var(--border-radius);
        transition: background-color 0.2s;
      }

      .password-strength.weak {
        background-color: var(--error-color);
      }

      .password-strength.medium {
        background-color: var(--warning-color);
      }

      .password-strength.strong {
        background-color: var(--success-color);
      }

      .social-login {
        display: grid;
        gap: var(--spacing-sm);
        margin: var(--spacing-md) 0;
      }

      .google-login,
      .github-login {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: var(--spacing-sm);
        padding: var(--spacing-sm);
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius);
        background: var(--surface-color);
        cursor: pointer;
      }

      .toggle-password {
        position: absolute;
        right: var(--spacing-sm);
        top: 50%;
        transform: translateY(-50%);
        background: none;
        border: none;
        cursor: pointer;
        color: var(--text-color-light);
      }

      .forgot-password {
        color: var(--primary-color);
        text-decoration: none;
        cursor: pointer;
      }

      .forgot-password:hover {
        text-decoration: underline;
      }

      .timeout-message {
        color: var(--warning-color);
        text-align: center;
        margin: var(--spacing-md) 0;
      }

      @media (max-width: 768px) {
        :host {
          padding: var(--spacing-md);
        }

        .page-container {
          padding: var(--spacing-sm);
        }
      }
    `,
  ];

  constructor() {
    super();
    this.loading = false;
    this.error = "";
    this.emailError = "";
    this.passwordError = "";
    this.rememberUser = false;
    this.isValidToken = false;
    this.token = null;
    this.showForgotPassword = false;
    this.showPassword = false;
    this.sessionTimeout = false;
    this.timeoutMessage = "";
  }

  connectedCallback() {
    super.connectedCallback();
    this._loadRememberedEmail();
    this._validateToken();
  }

  _loadRememberedEmail() {
    const rememberedEmail = localStorage.getItem("remembered_email");
    if (rememberedEmail) {
      const emailInput = this.shadowRoot?.querySelector('input[type="email"]');
      if (emailInput) {
        emailInput.value = rememberedEmail;
        this.rememberUser = true;
      }
    }
  }

  _validateToken() {
    if (this.token) {
      this.isValidToken =
        /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_.+/=]*$/.test(this.token);
    }
  }

  validateForm() {
    let isValid = true;
    this.emailError = "";
    this.passwordError = "";

    const emailInput = this.shadowRoot.querySelector('input[type="email"]');
    const passwordInput = this.shadowRoot.querySelector(
      'input[type="password"]'
    );

    if (!emailInput?.value) {
      this.emailError = "Email is required";
      isValid = false;
    } else if (!emailInput.validity.valid) {
      this.emailError = "Please enter a valid email address";
      isValid = false;
    }

    if (!passwordInput?.value) {
      this.passwordError = "Password is required";
      isValid = false;
    }

    return isValid;
  }

  async _handleSubmit(e) {
    e.preventDefault();
    this.error = "";

    if (!this.validateForm()) {
      return;
    }

    const emailInput = this.shadowRoot.querySelector('input[type="email"]');
    const passwordInput = this.shadowRoot.querySelector(
      'input[type="password"]'
    );

    if (!emailInput || !passwordInput) {
      this.error = "Form inputs not found";
      return;
    }

    try {
      this.loading = true;
      const result = await window.auth.login({
        email: emailInput.value,
        password: passwordInput.value,
      });

      if (this.rememberUser) {
        localStorage.setItem("remembered_email", emailInput.value);
      }

      this.dispatchEvent(
        new CustomEvent("login-success", {
          detail: result,
          bubbles: true,
          composed: true,
        })
      );
    } catch (error) {
      this.error = error.message;
    } finally {
      this.loading = false;
    }
  }

  async _handleResetPassword(e) {
    e.preventDefault();
    const emailInput = this.shadowRoot.querySelector("#reset-email");

    if (!emailInput?.value) {
      this.emailError = "Email is required";
      return;
    }

    try {
      this.loading = true;
      await window.auth.resetPassword(emailInput.value);
      this.dispatchEvent(
        new CustomEvent("reset-requested", {
          detail: { email: emailInput.value },
          bubbles: true,
          composed: true,
        })
      );
      this.showForgotPassword = false;
    } catch (error) {
      this.error = error.message;
    } finally {
      this.loading = false;
    }
  }

  _togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  _handlePasswordFocus() {
    const requirements = this.shadowRoot.querySelector(
      ".password-requirements"
    );
    if (requirements) {
      requirements.classList.add("visible");
    }
  }

  _handlePasswordBlur() {
    const requirements = this.shadowRoot.querySelector(
      ".password-requirements"
    );
    if (requirements) {
      requirements.classList.remove("visible");
    }
  }

  _checkPasswordStrength(password) {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const isLongEnough = password.length >= 8;

    const score = [
      hasUpperCase,
      hasLowerCase,
      hasNumbers,
      hasSpecialChar,
      isLongEnough,
    ].filter(Boolean).length;

    return score < 3 ? "weak" : score < 4 ? "medium" : "strong";
  }

  _handlePasswordInput(e) {
    const password = e.target.value;
    const strengthIndicator =
      this.shadowRoot.querySelector(".password-strength");
    if (strengthIndicator) {
      strengthIndicator.className = `password-strength ${this._checkPasswordStrength(
        password
      )}`;
    }
  }

  render() {
    if (this.loading) {
      return html`
        <div class="loading-spinner">
          <neo-icon name="loading" size="32"></neo-icon>
        </div>
      `;
    }

    if (this.showForgotPassword) {
      return html`
        <div class="reset-form">
          <h1>Reset Password</h1>
          ${this.error
            ? html`<div class="error-container">${this.error}</div>`
            : ""}
          <form @submit=${this._handleResetPassword}>
            <div class="form-field">
              <label for="reset-email">Email</label>
              <input
                type="email"
                id="reset-email"
                required
                aria-label="Email address for password reset"
              />
              ${this.emailError
                ? html`<div class="email-error">${this.emailError}</div>`
                : ""}
            </div>
            <button type="submit">Reset Password</button>
            <a
              class="forgot-password"
              @click=${() => (this.showForgotPassword = false)}
              >Back to Login</a
            >
          </form>
        </div>
      `;
    }

    return html`
      <div class="login-form">
        <h1>Login</h1>
        ${this.error
          ? html`<div class="error-container">${this.error}</div>`
          : ""}
        ${this.sessionTimeout
          ? html`<div class="timeout-message">${this.timeoutMessage}</div>`
          : ""}
        <form @submit=${this._handleSubmit} role="form">
          <div class="form-field">
            <label for="email">Email</label>
            <input
              type="email"
              id="email"
              required
              aria-label="Email address"
            />
            ${this.emailError
              ? html`<div class="email-error">${this.emailError}</div>`
              : ""}
          </div>
          <div class="form-field">
            <label for="password">Password</label>
            <input
              type="${this.showPassword ? "text" : "password"}"
              id="password"
              required
              aria-label="Password"
              @focus=${this._handlePasswordFocus}
              @blur=${this._handlePasswordBlur}
              @input=${this._handlePasswordInput}
            />
            <button
              type="button"
              class="toggle-password"
              @click=${this._togglePasswordVisibility}
              aria-label="Toggle password visibility"
            >
              <neo-icon
                name="${this.showPassword ? "eye-off" : "eye"}"
              ></neo-icon>
            </button>
            ${this.passwordError
              ? html`<div class="password-error">${this.passwordError}</div>`
              : ""}
            <div class="password-strength"></div>
            <div class="password-requirements">
              <p>Password must contain:</p>
              <ul>
                <li>At least 8 characters</li>
                <li>Uppercase and lowercase letters</li>
                <li>Numbers</li>
                <li>Special characters</li>
              </ul>
            </div>
          </div>
          <div class="form-field">
            <label>
              <input
                type="checkbox"
                class="remember-me"
                .checked=${this.rememberUser}
                @change=${(e) => (this.rememberUser = e.target.checked)}
              />
              Remember me
            </label>
          </div>
          <button type="submit">Login</button>
          <a
            class="forgot-password"
            @click=${() => (this.showForgotPassword = true)}
          >
            Forgot Password?
          </a>
        </form>
      </div>
    `;
  }
}
