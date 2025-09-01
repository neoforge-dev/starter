import { LitElement, html, css } from 'lit';
import { BaseComponent } from '../base-component.js';
import { authService } from '../../services/auth.js';

/**
 * Modern Registration Form Component
 * Provides a professional registration interface with validation and email verification
 */
export class RegisterForm extends BaseComponent {
  static properties = {
    email: { type: String },
    password: { type: String },
    confirmPassword: { type: String },
    fullName: { type: String },
    loading: { type: Boolean },
    error: { type: String },
    success: { type: String },
    emailError: { type: String },
    passwordError: { type: String },
    confirmPasswordError: { type: String },
    fullNameError: { type: String },
    acceptTerms: { type: Boolean },
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

    .password-strength {
      margin-top: 0.5rem;
      font-size: 0.75rem;
    }

    .password-strength.weak {
      color: var(--error-color, #dc3545);
    }

    .password-strength.medium {
      color: var(--warning-color, #ffc107);
    }

    .password-strength.strong {
      color: var(--success-color, #28a745);
    }

    .checkbox-group {
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
      margin-bottom: 1.5rem;
      padding: 0.75rem;
      background: var(--background-light, #f8f9fa);
      border-radius: 8px;
      border: 1px solid var(--border-color, #e0e0e0);
    }

    .checkbox-group input[type="checkbox"] {
      width: auto;
      margin: 0;
      margin-top: 0.125rem;
    }

    .checkbox-group label {
      margin: 0;
      font-weight: normal;
      font-size: 0.875rem;
      line-height: 1.4;
    }

    .checkbox-group label a {
      color: var(--tenant-primary-color, var(--primary-color, #007bff));
      text-decoration: none;
    }

    .checkbox-group label a:hover {
      text-decoration: underline;
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
    this.confirmPassword = '';
    this.fullName = '';
    this.loading = false;
    this.error = '';
    this.success = '';
    this.emailError = '';
    this.passwordError = '';
    this.confirmPasswordError = '';
    this.fullNameError = '';
    this.acceptTerms = false;
  }

  validateForm() {
    let isValid = true;
    this.emailError = '';
    this.passwordError = '';
    this.confirmPasswordError = '';
    this.fullNameError = '';

    // Full name validation
    if (!this.fullName.trim()) {
      this.fullNameError = 'Full name is required';
      isValid = false;
    } else if (this.fullName.trim().length < 2) {
      this.fullNameError = 'Full name must be at least 2 characters';
      isValid = false;
    }

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
    } else if (this.password.length < 8) {
      this.passwordError = 'Password must be at least 8 characters';
      isValid = false;
    } else if (!this.isStrongPassword(this.password)) {
      this.passwordError = 'Password must contain uppercase, lowercase, and number';
      isValid = false;
    }

    // Confirm password validation
    if (!this.confirmPassword) {
      this.confirmPasswordError = 'Please confirm your password';
      isValid = false;
    } else if (this.password !== this.confirmPassword) {
      this.confirmPasswordError = 'Passwords do not match';
      isValid = false;
    }

    // Terms acceptance validation
    if (!this.acceptTerms) {
      this.error = 'Please accept the Terms of Service and Privacy Policy';
      isValid = false;
    }

    this.requestUpdate();
    return isValid;
  }

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  isStrongPassword(password) {
    // At least one uppercase, one lowercase, one number
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    return hasUpper && hasLower && hasNumber;
  }

  getPasswordStrength() {
    if (!this.password) return { strength: '', text: '' };

    let score = 0;
    if (this.password.length >= 8) score++;
    if (/[A-Z]/.test(this.password)) score++;
    if (/[a-z]/.test(this.password)) score++;
    if (/\d/.test(this.password)) score++;
    if (/[^A-Za-z0-9]/.test(this.password)) score++;

    if (score < 2) return { strength: 'weak', text: 'Weak' };
    if (score < 4) return { strength: 'medium', text: 'Medium' };
    return { strength: 'strong', text: 'Strong' };
  }

  async handleSubmit(e) {
    e.preventDefault();

    if (!this.validateForm()) {
      return;
    }

    this.loading = true;
    this.error = '';
    this.success = '';
    this.requestUpdate();

    try {
      const result = await authService.signup(this.email, this.password, {
        full_name: this.fullName.trim(),
      });

      this.success = 'Account created successfully! Please check your email to verify your account.';
      this.error = '';

      // Clear form
      this.email = '';
      this.password = '';
      this.confirmPassword = '';
      this.fullName = '';
      this.acceptTerms = false;

      this.dispatchCustomEvent('registration-success', { result });
    } catch (error) {
      this.error = error.message || 'Registration failed. Please try again.';
      this.success = '';
      this.dispatchCustomEvent('registration-error', { error });
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
    } else if (field === 'confirmPassword') {
      this.confirmPasswordError = '';
    } else if (field === 'fullName') {
      this.fullNameError = '';
    }
    this.requestUpdate();
  }

  render() {
    const passwordStrength = this.getPasswordStrength();

    return html`
      <div class="auth-card">
        <div class="logo">
          <h1>Create Account</h1>
          <p>Join ${this.tenant?.name || 'NeoForge'} and start building</p>
        </div>

        ${this.error ? html`
          <div class="alert error">
            ${this.error}
          </div>
        ` : ''}

        ${this.success ? html`
          <div class="alert success">
            ${this.success}
          </div>
        ` : ''}

        <form @submit=${this.handleSubmit}>
          <div class="form-group">
            <label for="fullName">Full Name</label>
            <input
              type="text"
              id="fullName"
              .value=${this.fullName}
              @input=${(e) => this.handleInputChange('fullName', e.target.value)}
              class=${this.fullNameError ? 'error' : ''}
              placeholder="Enter your full name"
              autocomplete="name"
              required
            />
            ${this.fullNameError ? html`<span class="error-message">${this.fullNameError}</span>` : ''}
          </div>

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
              placeholder="Create a strong password"
              autocomplete="new-password"
              required
            />
            ${this.passwordError ? html`<span class="error-message">${this.passwordError}</span>` : ''}
            ${this.password && passwordStrength.text ? html`
              <div class="password-strength ${passwordStrength.strength}">
                Password strength: ${passwordStrength.text}
              </div>
            ` : ''}
          </div>

          <div class="form-group">
            <label for="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              .value=${this.confirmPassword}
              @input=${(e) => this.handleInputChange('confirmPassword', e.target.value)}
              class=${this.confirmPasswordError ? 'error' : ''}
              placeholder="Confirm your password"
              autocomplete="new-password"
              required
            />
            ${this.confirmPasswordError ? html`<span class="error-message">${this.confirmPasswordError}</span>` : ''}
          </div>

          <div class="checkbox-group">
            <input
              type="checkbox"
              id="acceptTerms"
              .checked=${this.acceptTerms}
              @change=${(e) => this.acceptTerms = e.target.checked}
              required
            />
            <label for="acceptTerms">
              I accept the <a href="/terms" target="_blank">Terms of Service</a> and
              <a href="/privacy" target="_blank">Privacy Policy</a>
            </label>
          </div>

          <button
            type="submit"
            class="btn btn-primary"
            ?disabled=${this.loading}
          >
            ${this.loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div class="links">
          <span>Already have an account?</span>
          <span class="separator">•</span>
          <a href="/auth/login">Sign in instead</a>
        </div>
      </div>
    `;
  }
}

customElements.define('register-form', RegisterForm);