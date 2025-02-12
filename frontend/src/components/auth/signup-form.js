import { LitElement, html, css } from "../../../vendor/lit-core.min.js";
import { baseStyles } from "../../styles/base.js";
import { LoadingMixin, ErrorMixin } from "../../styles/base.js";
import { authService } from "../../services/auth.js";

export class SignupForm extends LoadingMixin(ErrorMixin(LitElement)) {
  static properties = {
    email: { type: String },
    password: { type: String },
    confirmPassword: { type: String },
    name: { type: String },
    signupComplete: { type: Boolean }
  };

  static styles = [
    baseStyles,
    css`
      :host {
        display: block;
      }

      .form-group {
        margin-bottom: var(--spacing-md);
      }

      label {
        display: block;
        margin-bottom: var(--spacing-xs);
        color: var(--text-secondary);
        font-size: var(--text-sm);
      }

      input {
        width: 100%;
        padding: var(--spacing-sm);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        background: var(--surface-color);
        color: var(--text-color);
        transition: all var(--transition-normal);
      }

      input:focus {
        outline: none;
        border-color: var(--primary-color);
        box-shadow: 0 0 0 2px rgba(var(--primary-color), 0.1);
      }

      button {
        width: 100%;
        padding: var(--spacing-sm);
        background: var(--primary-color);
        color: white;
        border: none;
        border-radius: var(--radius-md);
        font-weight: var(--font-medium);
        cursor: pointer;
        transition: all var(--transition-normal);
      }

      button:hover {
        background: var(--primary-dark);
      }

      button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .error-message {
        color: var(--error-color);
        font-size: var(--text-sm);
        margin-top: var(--spacing-xs);
      }

      .success-message {
        text-align: center;
        padding: var(--spacing-lg);
      }

      .success-message .icon {
        font-size: 48px;
        color: var(--success-color);
        margin-bottom: var(--spacing-md);
      }

      .success-message .title {
        font-size: var(--text-xl);
        font-weight: var(--font-semibold);
        margin-bottom: var(--spacing-md);
      }

      .success-message .message {
        color: var(--text-secondary);
        margin-bottom: var(--spacing-lg);
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

  async handleSubmit(e) {
    e.preventDefault();

    // Validate form
    if (!this.email || !this.password || !this.confirmPassword || !this.name) {
      this.error = 'All fields are required';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.error = 'Passwords do not match';
      return;
    }

    if (this.password.length < 8) {
      this.error = 'Password must be at least 8 characters long';
      return;
    }

    try {
      this.loading = true;
      this.error = '';
      
      await authService.signup(this.email, this.password, {
        name: this.name
      });

      this.signupComplete = true;
    } catch (error) {
      this.error = error.message;
    } finally {
      this.loading = false;
    }
  }

  render() {
    if (this.signupComplete) {
      return html`
        <div class="success-message">
          <span class="material-icons icon">mark_email_read</span>
          <div class="title">Check Your Email</div>
          <div class="message">
            We've sent a verification link to <strong>${this.email}</strong>.<br>
            Please check your inbox and click the link to complete your registration.
          </div>
          <div class="message">
            Didn't receive the email? You can request a new verification link on the verification page.
          </div>
          <button @click=${() => window.location.href = '/verify-email'}>
            Go to Verification Page
          </button>
        </div>
      `;
    }

    return html`
      <form @submit=${this.handleSubmit}>
        <div class="form-group">
          <label for="name">Full Name</label>
          <input
            type="text"
            id="name"
            .value=${this.name}
            @input=${(e) => this.name = e.target.value}
            placeholder="Enter your full name"
            ?disabled=${this.loading}
          >
        </div>

        <div class="form-group">
          <label for="email">Email Address</label>
          <input
            type="email"
            id="email"
            .value=${this.email}
            @input=${(e) => this.email = e.target.value}
            placeholder="Enter your email"
            ?disabled=${this.loading}
          >
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <input
            type="password"
            id="password"
            .value=${this.password}
            @input=${(e) => this.password = e.target.value}
            placeholder="Create a password"
            ?disabled=${this.loading}
          >
        </div>

        <div class="form-group">
          <label for="confirm-password">Confirm Password</label>
          <input
            type="password"
            id="confirm-password"
            .value=${this.confirmPassword}
            @input=${(e) => this.confirmPassword = e.target.value}
            placeholder="Confirm your password"
            ?disabled=${this.loading}
          >
        </div>

        ${this.error ? html`
          <div class="error-message">${this.error}</div>
        ` : ''}

        <button type="submit" ?disabled=${this.loading}>
          ${this.loading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>
    `;
  }
}

customElements.define("signup-form", SignupForm);
