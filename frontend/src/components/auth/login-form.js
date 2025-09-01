import { LitElement, html, css } from 'lit';
import { BaseComponent } from '../base-component.js';
import { authService } from '../../services/auth.js';

/**
 * Modern Login Form Component
 * Provides a professional login interface with validation and error handling
 */
export class LoginForm extends BaseComponent {
  static properties = {
    email: { type: String },
    password: { type: String },
    loading: { type: Boolean },
    error: { type: String },
    emailError: { type: String },
    passwordError: { type: String },
    rememberMe: { type: Boolean },
  };

  static styles = css`
    :host {
      display: block;
      max-width: 400px;
      margin: 0 auto;
      padding: 2rem;
    }

    .auth-card {
      background: var(--card-background, #ffffff);
      border: 1px solid var(--border-color, #e0e0e0);
      border-radius: 12px;
      padding: 2rem;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .logo {
      text-align: center;
      margin-bottom: 2rem;
    }

    .logo h1 {
      color: var(--tenant-primary-color, var(--primary-color, #007bff));
      margin: 0;
      font-size: 1.5rem;
      font-weight: 600;
    }

    .form-group {
      margin-bottom: 1.5rem;
    }

    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
      color: var(--text-primary, #333333);
      font-size: 0.875rem;
    }

    .form-group input {
      width: 100%;
      padding: 0.75rem;
      border: 2px solid var(--border-color, #e0e0e0);
      border-radius: 8px;
      font-size: 1rem;
      transition: border-color 0.2s ease;
      box-sizing: border-box;
    }

    .form-group input:focus {
      outline: none;
      border-color: var(--tenant-primary-color, var(--primary-color, #007bff));
      box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
    }

    .form-group input.error {
      border-color: var(--error-color, #dc3545);
    }

    .error-message {
      color: var(--error-color, #dc3545);
      font-size: 0.75rem;
      margin-top: 0.25rem;
      display: block;
    }

    .checkbox-group {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1.5rem;
    }

    .checkbox-group input[type="checkbox"] {
      width: auto;
      margin: 0;
    }

    .checkbox-group label {
      margin: 0;
      font-weight: normal;
      font-size: 0.875rem;
    }

    .btn {
      width: 100%;
      padding: 0.75rem 1rem;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      margin-bottom: 1rem;
    }

    .btn-primary {
      background: var(--tenant-primary-color, var(--primary-color, #007bff));
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      opacity: 0.9;
      transform: translateY(-1px);
    }

    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-secondary {
      background: transparent;
      color: var(--tenant-primary-color, var(--primary-color, #007bff));
      border: 2px solid var(--tenant-primary-color, var(--primary-color, #007bff));
    }

    .btn-secondary:hover {
      background: var(--tenant-primary-color, var(--primary-color, #007bff));
      color: white;
    }

    .divider {
      text-align: center;
      margin: 1.5rem 0;
      position: relative;
      color: var(--text-secondary, #666666);
      font-size: 0.875rem;
    }

    .divider::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 0;
      right: 0;
      height: 1px;
      background: var(--border-color, #e0e0e0);
      z-index: 1;
    }

    .divider span {
      background: var(--card-background, #ffffff);
      padding: 0 1rem;
      position: relative;
      z-index: 2;
    }

    .links {
      text-align: center;
      margin-top: 1.5rem;
    }

    .links a {
      color: var(--tenant-primary-color, var(--primary-color, #007bff));
      text-decoration: none;
      font-size: 0.875rem;
    }

    .links a:hover {
      text-decoration: underline;
    }

    .links .separator {
      margin: 0 0.5rem;
      color: var(--text-secondary, #666666);
    }

    .loading {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      color: var(--text-secondary, #666666);
    }

    .alert {
      padding: 0.75rem;
      border-radius: 8px;
      margin-bottom: 1rem;
      font-size: 0.875rem;
    }

    .alert.error {
      background: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
    }

    .alert.success {
      background: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
    }
  `;

  constructor() {
    super();
    this.email = '';
    this.password = '';
    this.loading = false;
    this.error = '';
    this.emailError = '';
    this.passwordError = '';
    this.rememberMe = false;
  }

  async connectedCallback() {
    super.connectedCallback();
    // Check if user is already logged in
    if (authService.isAuthenticated()) {
      this.dispatchCustomEvent('login-success');
    }
  }

  validateForm() {
    let isValid = true;
    this.emailError = '';
    this.passwordError = '';

    // Email validation
    if (!this.email) {
      this.emailError = 'Email is required';
      isValid = false;
    } else if (!this.isValidEmail(this.email)) {
      this.emailError = 'Please enter a valid email address';
      isValid = false;
    }

    // Password validation
    if (!this.password) {
      this.passwordError = 'Password is required';
      isValid = false;
    } else if (this.password.length < 6) {
      this.passwordError = 'Password must be at least 6 characters';
      isValid = false;
    }

    this.requestUpdate();
    return isValid;
  }

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  async handleSubmit(e) {
    e.preventDefault();

    if (!this.validateForm()) {
      return;
    }

    this.loading = true;
    this.error = '';
    this.requestUpdate();

    try {
      const user = await authService.login(this.email, this.password);

      if (this.rememberMe) {
        // Set longer-lived token for "Remember Me"
        localStorage.setItem('remember_me', 'true');
      }

      this.dispatchCustomEvent('login-success', { user });
    } catch (error) {
      this.error = error.message || 'Login failed. Please try again.';
      this.dispatchCustomEvent('login-error', { error });
    } finally {
      this.loading = false;
      this.requestUpdate();
    }
  }

  handleInputChange(field, value) {
    this[field] = value;
    // Clear field-specific errors on input
    if (field === 'email') {
      this.emailError = '';
    } else if (field === 'password') {
      this.passwordError = '';
    }
    this.requestUpdate();
  }

  render() {
    return html`
      <div class="auth-card">
        <div class="logo">
          <h1>Welcome Back</h1>
          <p>Sign in to your ${this.tenant?.name || 'NeoForge'} account</p>
        </div>

        ${this.error ? html`
          <div class="alert error">
            ${this.error}
          </div>
        ` : ''}

        <form @submit=${this.handleSubmit}>
          <div class="form-group">
            <label for="email">Email Address</label>
            <input
              type="email"
              id="email"
              .value=${this.email}
              @input=${(e) => this.handleInputChange('email', e.target.value)}
              class=${this.emailError ? 'error' : ''}
              placeholder="Enter your email"
              autocomplete="email"
              required
            />
            ${this.emailError ? html`<span class="error-message">${this.emailError}</span>` : ''}
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <input
              type="password"
              id="password"
              .value=${this.password}
              @input=${(e) => this.handleInputChange('password', e.target.value)}
              class=${this.passwordError ? 'error' : ''}
              placeholder="Enter your password"
              autocomplete="current-password"
              required
            />
            ${this.passwordError ? html`<span class="error-message">${this.passwordError}</span>` : ''}
          </div>

          <div class="checkbox-group">
            <input
              type="checkbox"
              id="rememberMe"
              .checked=${this.rememberMe}
              @change=${(e) => this.rememberMe = e.target.checked}
            />
            <label for="rememberMe">Remember me</label>
          </div>

          <button
            type="submit"
            class="btn btn-primary"
            ?disabled=${this.loading}
          >
            ${this.loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div class="links">
          <a href="/auth/forgot-password">Forgot your password?</a>
          <span class="separator">•</span>
          <a href="/auth/register">Create an account</a>
        </div>
      </div>
    `;
  }
}

customElements.define('login-form', LoginForm);