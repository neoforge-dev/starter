import { LitElement, html, css, TemplateResult, CSSResultGroup } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { baseStyles } from "../../styles/base.js";
import { authService } from "../../services/auth.js";
import type { ApiResponse } from "../../types/api.d.ts";

interface SignupSuccessEvent extends CustomEvent {
  detail: {
    email: string;
    message?: string;
  };
}

interface SignupErrorEvent extends CustomEvent {
  detail: {
    message: string;
    code?: string;
  };
}

interface FieldValidationState {
  isValid: boolean;
  error?: string;
}

interface FormValidationState {
  name: FieldValidationState;
  email: FieldValidationState;
  password: FieldValidationState;
  confirmPassword: FieldValidationState;
}

@customElement('signup-form')
export class SignupForm extends LitElement {
  @property({ type: String })
  email = '';

  @property({ type: String })
  password = '';

  @property({ type: String })
  confirmPassword = '';

  @property({ type: String })
  name = '';

  @property({ type: Boolean })
  signupComplete = false;

  @state()
  private _isLoading = false;

  @state()
  private _error = '';

  @state()
  private _validation: FormValidationState = {
    name: { isValid: true },
    email: { isValid: true },
    password: { isValid: true },
    confirmPassword: { isValid: true }
  };

  @state()
  private _passwordStrength: 'weak' | 'medium' | 'strong' | '' = '';

  @state()
  private _showPassword = false;

  @state()
  private _showConfirmPassword = false;

  static override styles: CSSResultGroup = [
    baseStyles,
    css`
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
        color: var(--text-secondary, #6b7280);
        font-size: 0.875rem;
        font-weight: 500;
      }

      .input-container {
        position: relative;
        display: flex;
        align-items: center;
      }

      input {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid var(--border-color, #e2e8f0);
        border-radius: 4px;
        background: var(--surface-color, #ffffff);
        color: var(--text-color, #000000);
        font-size: 1rem;
        transition: all 0.2s ease;
      }

      input.password-input {
        padding-right: 3rem;
      }

      input:focus {
        outline: none;
        border-color: var(--primary-color, #3b82f6);
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      }

      input.invalid {
        border-color: var(--error-color, #ef4444);
      }

      input.invalid:focus {
        box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
      }

      input.valid {
        border-color: var(--success-color, #10b981);
      }

      .toggle-password {
        position: absolute;
        right: 0.75rem;
        background: none;
        border: none;
        color: var(--text-secondary, #6b7280);
        cursor: pointer;
        padding: 0.25rem;
        border-radius: 2px;
        font-size: 0.875rem;
        min-width: 44px;
        min-height: 44px;
        display: flex;
        align-items: center;
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

      button[type="submit"] {
        width: 100%;
        padding: 0.75rem;
        background: var(--primary-color, #3b82f6);
        color: white;
        border: none;
        border-radius: 4px;
        font-weight: 500;
        font-size: 1rem;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        min-height: 48px;
      }

      button[type="submit"]:hover:not(:disabled) {
        background: var(--primary-dark, #2563eb);
        transform: translateY(-1px);
      }

      button[type="submit"]:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        transform: none;
      }

      button[type="submit"]:focus {
        outline: 2px solid var(--primary-color, #3b82f6);
        outline-offset: 2px;
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
        margin-bottom: 0.5rem;
      }

      .field-success {
        color: var(--success-color, #10b981);
        font-size: 0.875rem;
        margin-top: 0.25rem;
        margin-bottom: 0.5rem;
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

      .password-requirements {
        margin-top: 0.5rem;
        font-size: 0.875rem;
        color: var(--text-secondary, #6b7280);
      }

      .password-requirements ul {
        list-style: none;
        padding: 0;
        margin: 0.5rem 0 0;
      }

      .password-requirements li {
        padding: 0.25rem 0;
        position: relative;
        padding-left: 1.5rem;
      }

      .password-requirements li::before {
        content: "•";
        position: absolute;
        left: 0;
        color: var(--text-secondary, #6b7280);
      }

      .password-requirements li.valid::before {
        content: "✓";
        color: var(--success-color, #10b981);
        font-weight: bold;
      }

      .success-message {
        text-align: center;
        padding: 2rem;
        background: var(--surface-color, #ffffff);
        border-radius: 8px;
        border: 1px solid var(--border-color, #e2e8f0);
      }

      .success-message .icon {
        font-size: 48px;
        color: var(--success-color, #10b981);
        margin-bottom: 1rem;
        display: block;
      }

      .success-message .title {
        font-size: 1.5rem;
        font-weight: 600;
        margin-bottom: 1rem;
        color: var(--text-color, #000000);
      }

      .success-message .message {
        color: var(--text-secondary, #6b7280);
        margin-bottom: 1.5rem;
        line-height: 1.6;
      }

      .success-message .email-highlight {
        font-weight: 600;
        color: var(--primary-color, #3b82f6);
      }

      .verification-button {
        background: var(--primary-color, #3b82f6);
        color: white;
        border: none;
        padding: 0.75rem 1.5rem;
        border-radius: 4px;
        cursor: pointer;
        font-size: 1rem;
        font-weight: 500;
        transition: all 0.2s ease;
        text-decoration: none;
        display: inline-block;
      }

      .verification-button:hover {
        background: var(--primary-dark, #2563eb);
        transform: translateY(-1px);
      }

      .verification-button:focus {
        outline: 2px solid var(--primary-color, #3b82f6);
        outline-offset: 2px;
      }

      /* Accessibility improvements */
      @media (prefers-reduced-motion: reduce) {
        * {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
      }

      /* High contrast mode */
      @media (prefers-contrast: high) {
        input {
          border-width: 2px;
        }
        
        button {
          border: 2px solid transparent;
        }
      }
    `
  ];

  constructor() {
    super();
    this.email = '';
    this.password = '';
    this.confirmPassword = '';
    this.name = '';
    this.signupComplete = false;
  }

  private _validateName(name: string): FieldValidationState {
    if (!name.trim()) {
      return { isValid: false, error: "Name is required" };
    }
    if (name.trim().length < 2) {
      return { isValid: false, error: "Name must be at least 2 characters" };
    }
    return { isValid: true };
  }

  private _validateEmail(email: string): FieldValidationState {
    if (!email) {
      return { isValid: false, error: "Email is required" };
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { isValid: false, error: "Please enter a valid email address" };
    }
    return { isValid: true };
  }

  private _validatePassword(password: string): FieldValidationState {
    if (!password) {
      return { isValid: false, error: "Password is required" };
    }
    if (password.length < 8) {
      return { isValid: false, error: "Password must be at least 8 characters" };
    }
    
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    const strength = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar]
      .filter(Boolean).length;
    
    if (strength < 2) {
      return { 
        isValid: false, 
        error: "Password must include uppercase, lowercase, numbers, and special characters" 
      };
    }
    
    return { isValid: true };
  }

  private _validateConfirmPassword(password: string, confirmPassword: string): FieldValidationState {
    if (!confirmPassword) {
      return { isValid: false, error: "Please confirm your password" };
    }
    if (password !== confirmPassword) {
      return { isValid: false, error: "Passwords do not match" };
    }
    return { isValid: true };
  }

  private _calculatePasswordStrength(password: string): 'weak' | 'medium' | 'strong' | '' {
    if (!password) return '';
    
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

  private _handleNameInput(e: Event): void {
    const target = e.target as HTMLInputElement;
    this.name = target.value;
    this._validation.name = this._validateName(this.name);
    this.requestUpdate();
  }

  private _handleEmailInput(e: Event): void {
    const target = e.target as HTMLInputElement;
    this.email = target.value;
    this._validation.email = this._validateEmail(this.email);
    this.requestUpdate();
  }

  private _handlePasswordInput(e: Event): void {
    const target = e.target as HTMLInputElement;
    this.password = target.value;
    this._passwordStrength = this._calculatePasswordStrength(this.password);
    this._validation.password = this._validatePassword(this.password);
    
    // Re-validate confirm password if it has been entered
    if (this.confirmPassword) {
      this._validation.confirmPassword = this._validateConfirmPassword(
        this.password, 
        this.confirmPassword
      );
    }
    
    this.requestUpdate();
  }

  private _handleConfirmPasswordInput(e: Event): void {
    const target = e.target as HTMLInputElement;
    this.confirmPassword = target.value;
    this._validation.confirmPassword = this._validateConfirmPassword(
      this.password, 
      this.confirmPassword
    );
    this.requestUpdate();
  }

  private _togglePasswordVisibility(field: 'password' | 'confirmPassword'): void {
    if (field === 'password') {
      this._showPassword = !this._showPassword;
      const input = this.shadowRoot?.querySelector('#password') as HTMLInputElement;
      if (input) {
        input.type = this._showPassword ? 'text' : 'password';
      }
    } else {
      this._showConfirmPassword = !this._showConfirmPassword;
      const input = this.shadowRoot?.querySelector('#confirm-password') as HTMLInputElement;
      if (input) {
        input.type = this._showConfirmPassword ? 'text' : 'password';
      }
    }
  }

  private _validateAllFields(): boolean {
    this._validation = {
      name: this._validateName(this.name),
      email: this._validateEmail(this.email),
      password: this._validatePassword(this.password),
      confirmPassword: this._validateConfirmPassword(this.password, this.confirmPassword)
    };

    return Object.values(this._validation).every(field => field.isValid);
  }

  private async _handleSubmit(e: Event): Promise<void> {
    e.preventDefault();
    this._error = '';

    // Validate all fields
    if (!this._validateAllFields()) {
      return;
    }

    try {
      this._isLoading = true;
      
      const response: ApiResponse = await authService.signup(this.email, this.password, {
        name: this.name
      });

      this.signupComplete = true;

      this.dispatchEvent(
        new CustomEvent("signup-success", {
          detail: { 
            email: this.email, 
            message: response.message 
          },
          bubbles: true,
          composed: true,
        }) as SignupSuccessEvent
      );

    } catch (error) {
      const message = error instanceof Error ? error.message : "Signup failed";
      this._error = message;
      
      this.dispatchEvent(
        new CustomEvent("signup-error", {
          detail: { message },
          bubbles: true,
          composed: true,
        }) as SignupErrorEvent
      );
    } finally {
      this._isLoading = false;
    }
  }

  private _navigateToVerification(): void {
    const url = `/verify-email?email=${encodeURIComponent(this.email)}`;
    window.location.href = url;
  }

  override render(): TemplateResult {
    if (this.signupComplete) {
      return html`
        <div class="success-message">
          <span class="icon" aria-hidden="true">📧</span>
          <h2 class="title">Check Your Email</h2>
          <div class="message">
            We've sent a verification link to 
            <span class="email-highlight">${this.email}</span>.<br>
            Please check your inbox and click the link to complete your registration.
          </div>
          <div class="message">
            Didn't receive the email? You can request a new verification link on the verification page.
          </div>
          <button 
            type="button"
            class="verification-button"
            @click=${this._navigateToVerification}
          >
            Go to Verification Page
          </button>
        </div>
      `;
    }

    return html`
      <form @submit=${this._handleSubmit} novalidate>
        <div class="form-group">
          <label for="name">Full Name *</label>
          <input
            type="text"
            id="name"
            data-testid="name-input"
            .value=${this.name}
            @input=${this._handleNameInput}
            placeholder="Enter your full name"
            ?disabled=${this._isLoading}
            class=${!this._validation.name.isValid && this.name ? 'invalid' : 
                   this._validation.name.isValid && this.name ? 'valid' : ''}
            required
            autocomplete="name"
            aria-describedby=${!this._validation.name.isValid ? "name-error" : ""}
            aria-invalid=${!this._validation.name.isValid ? "true" : "false"}
          />
          ${!this._validation.name.isValid && this._validation.name.error
            ? html`<div class="field-error" id="name-error" role="alert">${this._validation.name.error}</div>`
            : this._validation.name.isValid && this.name
            ? html`<div class="field-success">✓ Valid name</div>`
            : ''}
        </div>

        <div class="form-group">
          <label for="email">Email Address *</label>
          <input
            type="email"
            id="email"
            data-testid="email-input"
            .value=${this.email}
            @input=${this._handleEmailInput}
            placeholder="Enter your email"
            ?disabled=${this._isLoading}
            class=${!this._validation.email.isValid && this.email ? 'invalid' : 
                   this._validation.email.isValid && this.email ? 'valid' : ''}
            required
            autocomplete="email"
            aria-describedby=${!this._validation.email.isValid ? "email-error" : ""}
            aria-invalid=${!this._validation.email.isValid ? "true" : "false"}
          />
          ${!this._validation.email.isValid && this._validation.email.error
            ? html`<div class="field-error" id="email-error" role="alert">${this._validation.email.error}</div>`
            : this._validation.email.isValid && this.email
            ? html`<div class="field-success">✓ Valid email</div>`
            : ''}
        </div>

        <div class="form-group">
          <label for="password">Password *</label>
          <div class="input-container">
            <input
              type="password"
              id="password"
              data-testid="password-input"
              .value=${this.password}
              @input=${this._handlePasswordInput}
              placeholder="Create a password"
              ?disabled=${this._isLoading}
              class="password-input ${!this._validation.password.isValid && this.password ? 'invalid' : 
                     this._validation.password.isValid && this.password ? 'valid' : ''}"
              required
              minlength="8"
              autocomplete="new-password"
              aria-describedby="password-requirements ${!this._validation.password.isValid ? "password-error" : ""}"
              aria-invalid=${!this._validation.password.isValid ? "true" : "false"}
            />
            <button
              type="button"
              class="toggle-password"
              @click=${() => this._togglePasswordVisibility('password')}
              aria-label=${this._showPassword ? "Hide password" : "Show password"}
            >
              ${this._showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          ${!this._validation.password.isValid && this._validation.password.error
            ? html`<div class="field-error" id="password-error" role="alert">${this._validation.password.error}</div>`
            : ''}
          ${this._passwordStrength
            ? html`<div class="password-strength ${this._passwordStrength}">
                Password strength: ${this._passwordStrength}
              </div>`
            : ''}
          <div class="password-requirements" id="password-requirements">
            <div>Password must include:</div>
            <ul>
              <li class=${/[a-z]/.test(this.password) ? 'valid' : ''}>At least one lowercase letter</li>
              <li class=${/[A-Z]/.test(this.password) ? 'valid' : ''}>At least one uppercase letter</li>
              <li class=${/\d/.test(this.password) ? 'valid' : ''}>At least one number</li>
              <li class=${this.password.length >= 8 ? 'valid' : ''}>At least 8 characters long</li>
            </ul>
          </div>
        </div>

        <div class="form-group">
          <label for="confirm-password">Confirm Password *</label>
          <div class="input-container">
            <input
              type="password"
              id="confirm-password"
              data-testid="confirm-password-input"
              .value=${this.confirmPassword}
              @input=${this._handleConfirmPasswordInput}
              placeholder="Confirm your password"
              ?disabled=${this._isLoading}
              class="password-input ${!this._validation.confirmPassword.isValid && this.confirmPassword ? 'invalid' : 
                     this._validation.confirmPassword.isValid && this.confirmPassword ? 'valid' : ''}"
              required
              autocomplete="new-password"
              aria-describedby=${!this._validation.confirmPassword.isValid ? "confirm-password-error" : ""}
              aria-invalid=${!this._validation.confirmPassword.isValid ? "true" : "false"}
            />
            <button
              type="button"
              class="toggle-password"
              @click=${() => this._togglePasswordVisibility('confirmPassword')}
              aria-label=${this._showConfirmPassword ? "Hide password confirmation" : "Show password confirmation"}
            >
              ${this._showConfirmPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          ${!this._validation.confirmPassword.isValid && this._validation.confirmPassword.error
            ? html`<div class="field-error" id="confirm-password-error" role="alert">${this._validation.confirmPassword.error}</div>`
            : this._validation.confirmPassword.isValid && this.confirmPassword
            ? html`<div class="field-success">✓ Passwords match</div>`
            : ''}
        </div>

        ${this._error 
          ? html`<div class="error-message" data-testid="error" role="alert">${this._error}</div>`
          : ''}

        <button type="submit" data-testid="register-button" ?disabled=${this._isLoading}>
          ${this._isLoading 
            ? html`<span class="loading-spinner" aria-hidden="true"></span>Creating Account...`
            : 'Create Account'}
        </button>
      </form>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'signup-form': SignupForm;
  }
}