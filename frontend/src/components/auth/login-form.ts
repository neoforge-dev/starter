import { LitElement, html, css, TemplateResult, CSSResultGroup } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { authService } from "../../services/auth.js";
import type { User } from "../../types/api.d.ts";

interface LoginSuccessEvent extends CustomEvent {
  detail: {
    email: string;
    user?: User;
  };
}

interface LoginErrorEvent extends CustomEvent {
  detail: {
    message: string;
    code?: string;
  };
}

interface RememberMeChangeEvent extends CustomEvent {
  detail: {
    checked: boolean;
  };
}

@customElement('login-form')
export class LoginForm extends LitElement {
  @property({ type: Boolean })
  isLoading = false;

  @property({ type: String })
  errorMessage = "";

  @state()
  private _isPasswordVisible = false;

  @state()
  private _rememberMe = false;

  @state()
  private _fieldErrors: Record<string, string> = {};

  @state()
  private _passwordStrength: 'weak' | 'medium' | 'strong' | '' = '';

  static override styles: CSSResultGroup = css`
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
      font-size: 0.875rem;
    }

    input {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #e2e8f0;
      border-radius: 4px;
      font-size: 1rem;
      transition: border-color 0.2s, box-shadow 0.2s;
      background: var(--surface-1, #ffffff);
      color: var(--text-1, #000000);
    }

    input:focus {
      outline: none;
      border-color: var(--primary-color, #3b82f6);
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    input:invalid {
      border-color: var(--error-color, #ef4444);
    }

    input:invalid:focus {
      box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
    }

    button {
      width: 100%;
      padding: 0.75rem;
      background-color: var(--primary-color, #3b82f6);
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 1rem;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.2s, transform 0.1s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }

    button:hover:not(:disabled) {
      background-color: var(--primary-color-dark, #2563eb);
      transform: translateY(-1px);
    }

    button:active:not(:disabled) {
      transform: translateY(0);
    }

    button:disabled {
      background-color: var(--disabled-color, #9ca3af);
      cursor: not-allowed;
      transform: none;
    }

    button:focus {
      outline: 2px solid var(--primary-color, #3b82f6);
      outline-offset: 2px;
    }

    .error-message {
      color: var(--error-color, #ef4444);
      font-size: 0.875rem;
      margin-top: 0.5rem;
      padding: 0.5rem;
      background: rgba(239, 68, 68, 0.1);
      border-radius: 4px;
      border-left: 3px solid var(--error-color, #ef4444);
    }

    .field-error {
      color: var(--error-color, #ef4444);
      font-size: 0.875rem;
      margin-top: 0.25rem;
    }

    .loading-spinner {
      display: inline-block;
      width: 1.25rem;
      height: 1.25rem;
      border: 2px solid transparent;
      border-radius: 50%;
      border-top-color: currentColor;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }

    .password-container {
      position: relative;
      display: flex;
      align-items: center;
    }

    .password-input {
      padding-right: 3rem;
    }

    .toggle-password {
      position: absolute;
      right: 0.75rem;
      background: none;
      border: none;
      color: var(--text-color-secondary, #6b7280);
      cursor: pointer;
      padding: 0.25rem;
      border-radius: 2px;
      font-size: 0.875rem;
      width: auto;
      height: auto;
      display: flex;
      align-items: center;
      min-width: 44px;
      min-height: 44px;
      justify-content: center;
    }

    .toggle-password:hover {
      color: var(--text-color, #000000);
      background: rgba(0, 0, 0, 0.05);
    }

    .toggle-password:focus {
      outline: 2px solid var(--primary-color, #3b82f6);
      outline-offset: 1px;
    }

    .password-requirements {
      margin-top: 0.5rem;
      font-size: 0.875rem;
      color: var(--text-color-secondary, #6b7280);
    }

    .password-strength {
      margin-top: 0.25rem;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .password-strength.weak {
      color: var(--error-color, #ef4444);
    }

    .password-strength.medium {
      color: var(--warning-color, #f59e0b);
    }

    .password-strength.strong {
      color: var(--success-color, #10b981);
    }

    .forgot-password {
      display: block;
      text-align: right;
      margin-top: 0.5rem;
      color: var(--primary-color, #3b82f6);
      text-decoration: none;
      font-size: 0.875rem;
    }

    .forgot-password:hover {
      text-decoration: underline;
    }

    .forgot-password:focus {
      outline: 2px solid var(--primary-color, #3b82f6);
      outline-offset: 2px;
      border-radius: 2px;
    }

    .remember-me {
      display: flex;
      align-items: center;
      margin-top: 1rem;
      font-size: 0.875rem;
      gap: 0.5rem;
    }

    .remember-me input[type="checkbox"] {
      width: auto;
      margin: 0;
      min-width: 18px;
      min-height: 18px;
    }

    .remember-me label {
      margin: 0;
      cursor: pointer;
      user-select: none;
    }

    .timeout-message {
      color: var(--warning-color, #f59e0b);
      font-size: 0.875rem;
      margin-top: 1rem;
      text-align: center;
      padding: 0.5rem;
      background: rgba(245, 158, 11, 0.1);
      border-radius: 4px;
    }

    /* High contrast mode support */
    @media (prefers-contrast: high) {
      input {
        border-width: 2px;
      }

      button {
        border: 2px solid transparent;
      }
    }

    /* Reduced motion support */
    @media (prefers-reduced-motion: reduce) {
      * {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }
    }

    /* Dark mode support */
    @media (prefers-color-scheme: dark) {
      :host {
        --surface-1: #1f2937;
        --text-1: #f9fafb;
        --text-color: #f9fafb;
        --text-color-secondary: #d1d5db;
        --primary-color: #60a5fa;
        --primary-color-dark: #3b82f6;
        --error-color: #f87171;
        --success-color: #34d399;
        --warning-color: #fbbf24;
        --disabled-color: #6b7280;
      }

      input {
        border-color: #4b5563;
        background: #374151;
      }
    }
  `;

  constructor() {
    super();
    this.isLoading = false;
    this.errorMessage = "";
  }

  private _validatePassword(password: string): 'weak' | 'medium' | 'strong' | '' {
    if (password.length === 0) return '';

    const hasMinLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const criteriaCount = [hasMinLength, hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar]
      .filter(Boolean).length;

    if (criteriaCount >= 4) return 'strong';
    if (criteriaCount >= 2) return 'medium';
    return 'weak';
  }

  private _handlePasswordInput(e: Event): void {
    const target = e.target as HTMLInputElement;
    const password = target.value;
    this._passwordStrength = this._validatePassword(password);

    // Clear password field error when user starts typing
    if (this._fieldErrors['password']) {
      this._fieldErrors = { ...this._fieldErrors };
      delete this._fieldErrors['password'];
      this.requestUpdate();
    }
  }

  private _handleEmailInput(e: Event): void {
    const target = e.target as HTMLInputElement;
    const email = target.value;

    // Clear email field error when user starts typing
    if (this._fieldErrors['email']) {
      this._fieldErrors = { ...this._fieldErrors };
      delete this._fieldErrors['email'];
      this.requestUpdate();
    }

    // Clear general error when user modifies form
    if (this.errorMessage) {
      this.errorMessage = '';
    }
  }

  private _togglePassword(): void {
    const passwordInput = this.shadowRoot?.querySelector("#password") as HTMLInputElement;
    if (passwordInput) {
      this._isPasswordVisible = !this._isPasswordVisible;
      passwordInput.type = this._isPasswordVisible ? "text" : "password";
    }
  }

  private _showForgotPassword(e: Event): void {
    e.preventDefault();
    this.dispatchEvent(new CustomEvent("show-forgot-password"));
  }

  private _handleRememberMe(e: Event): void {
    const target = e.target as HTMLInputElement;
    this._rememberMe = target.checked;
    this.dispatchEvent(
      new CustomEvent("remember-me-change", {
        detail: { checked: this._rememberMe },
      }) as RememberMeChangeEvent
    );
  }

  private _validateForm(email: string, password: string): boolean {
    const errors: Record<string, string> = {};

    // Email validation
    if (!email) {
      errors['email'] = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors['email'] = "Please enter a valid email address";
    }

    // Password validation
    if (!password) {
      errors['password'] = "Password is required";
    } else if (password.length < 8) {
      errors['password'] = "Password must be at least 8 characters long";
    }

    this._fieldErrors = errors;
    return Object.keys(errors).length === 0;
  }

  private async _handleSubmit(e: Event): Promise<void> {
    e.preventDefault();
    this.errorMessage = "";

    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    // Validate form
    if (!this._validateForm(email, password)) {
      return;
    }

    try {
      this.isLoading = true;

      const user = await authService.login(email, password, this._rememberMe);

      this.dispatchEvent(
        new CustomEvent("login-success", {
          detail: { email, user },
          bubbles: true,
          composed: true,
        }) as LoginSuccessEvent
      );

      // Clear form
      form.reset();
      this._fieldErrors = {};
      this._passwordStrength = '';

    } catch (error) {
      const message = error instanceof Error ? error.message : "Login failed";
      this.errorMessage = message;

      this.dispatchEvent(
        new CustomEvent("login-error", {
          detail: { message },
          bubbles: true,
          composed: true,
        }) as LoginErrorEvent
      );
    } finally {
      this.isLoading = false;
    }
  }

  override render(): TemplateResult {
    return html`
      <form
        @submit=${this._handleSubmit}
        id="login-form"
        role="form"
        aria-label="Login form"
        novalidate
      >
        <div class="form-group">
          <label for="email">Email Address</label>
          <input
            type="email"
            id="email"
            name="email"
            data-testid="login-email"
            required
            autocomplete="email"
            aria-describedby=${this._fieldErrors['email'] ? "email-error" : ""}
            aria-invalid=${this._fieldErrors['email'] ? "true" : "false"}
            @input=${this._handleEmailInput}
          />
          ${this._fieldErrors['email']
            ? html`<div class="field-error" id="email-error" role="alert">${this._fieldErrors['email']}</div>`
            : ""}
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <div class="password-container">
            <input
              type="password"
              id="password"
              name="password"
              data-testid="login-password"
              required
              class="password-input"
              autocomplete="current-password"
              minlength="8"
              aria-describedby="password-requirements ${this._fieldErrors['password'] ? "password-error" : ""}"
              aria-invalid=${this._fieldErrors['password'] ? "true" : "false"}
              @input=${this._handlePasswordInput}
            />
            <button
              type="button"
              class="toggle-password"
              @click=${this._togglePassword}
              aria-label=${this._isPasswordVisible ? "Hide password" : "Show password"}
              tabindex="0"
            >
              ${this._isPasswordVisible ? "Hide" : "Show"}
            </button>
          </div>
          ${this._fieldErrors['password']
            ? html`<div class="field-error" id="password-error" role="alert">${this._fieldErrors['password']}</div>`
            : ""}
          <div class="password-requirements" id="password-requirements">
            Password must be at least 8 characters long
          </div>
          ${this._passwordStrength
            ? html`<div class="password-strength ${this._passwordStrength}">
                Password strength: ${this._passwordStrength}
              </div>`
            : ""}
        </div>

        <div class="remember-me">
          <input
            type="checkbox"
            id="remember-me"
            @change=${this._handleRememberMe}
            .checked=${this._rememberMe}
          />
          <label for="remember-me">Remember me for 30 days</label>
        </div>

        ${this.errorMessage
          ? html`<div class="error-message" data-testid="error" role="alert">${this.errorMessage}</div>`
          : ""}

        <button type="submit" data-testid="login-button" ?disabled=${this.isLoading}>
          ${this.isLoading
            ? html`<span class="loading-spinner" aria-hidden="true"></span>Signing in...`
            : "Sign In"}
        </button>

        <a
          href="#"
          class="forgot-password"
          @click=${this._showForgotPassword}
          role="button"
        >
          Forgot password?
        </a>
      </form>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'login-form': LoginForm;
  }
}
