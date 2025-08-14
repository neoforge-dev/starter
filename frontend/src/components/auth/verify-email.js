import { LitElement, html, css } from "lit";
import { baseStyles } from "../../styles/base.js";
import { LoadingMixin, ErrorMixin } from "../../styles/base.js";
import { authService } from "../../services/auth.ts";

export class VerifyEmail extends LoadingMixin(ErrorMixin(LitElement)) {
  static properties = {
    token: { type: String },
    email: { type: String },
    verificationSent: { type: Boolean },
    verificationSuccess: { type: Boolean }
  };

  static styles = [
    baseStyles,
    css`
      :host {
        display: block;
        max-width: 600px;
        margin: 0 auto;
        padding: var(--spacing-xl);
      }

      .container {
        text-align: center;
      }

      .icon {
        font-size: 64px;
        margin-bottom: var(--spacing-lg);
        color: var(--primary-color);
      }

      .title {
        font-size: var(--text-2xl);
        font-weight: var(--font-bold);
        margin-bottom: var(--spacing-md);
        color: var(--text-color);
      }

      .message {
        font-size: var(--text-lg);
        color: var(--text-secondary);
        margin-bottom: var(--spacing-xl);
        line-height: 1.6;
      }

      .email {
        font-weight: var(--font-semibold);
        color: var(--text-color);
      }

      .actions {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-md);
        max-width: 300px;
        margin: 0 auto;
      }

      button {
        width: 100%;
        padding: var(--spacing-sm) var(--spacing-md);
        border: none;
        border-radius: var(--radius-md);
        font-weight: var(--font-medium);
        cursor: pointer;
        transition: all var(--transition-normal);
      }

      .primary {
        background: var(--primary-color);
        color: white;
      }

      .primary:hover {
        background: var(--primary-dark);
      }

      .secondary {
        background: var(--surface-color);
        border: 1px solid var(--border-color);
        color: var(--text-color);
      }

      .secondary:hover {
        background: var(--surface-hover);
      }

      button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .success .icon {
        color: var(--success-color);
      }

      .error-message {
        color: var(--error-color);
        margin: var(--spacing-md) 0;
      }
    `
  ];

  constructor() {
    super();
    const urlParams = new URLSearchParams(window.location.search);
    this.token = urlParams.get('token');
    this.email = urlParams.get('email') || '';
    this.verificationSent = false;
    this.verificationSuccess = false;
  }

  async connectedCallback() {
    super.connectedCallback();
    if (this.token) {
      this.verifyEmail();
    }
  }

  async verifyEmail() {
    try {
      this.loading = true;
      this.error = '';
      
      await authService.verifyEmail(this.token);
      this.verificationSuccess = true;
      
      // Clear the URL parameters
      window.history.replaceState({}, '', '/verify-email');
    } catch (error) {
      this.error = error.message;
    } finally {
      this.loading = false;
    }
  }

  async resendVerification() {
    if (!this.email) {
      this.error = 'Please enter your email address';
      return;
    }

    try {
      this.loading = true;
      this.error = '';
      
      await authService.resendVerification(this.email);
      this.verificationSent = true;
    } catch (error) {
      this.error = error.message;
    } finally {
      this.loading = false;
    }
  }

  render() {
    if (this.loading) {
      return html`
        <div class="container">
          <span class="material-icons icon">hourglass_empty</span>
          <div class="title">Verifying Email</div>
          <div class="message">Please wait while we verify your email address...</div>
        </div>
      `;
    }

    if (this.verificationSuccess) {
      return html`
        <div class="container success">
          <span class="material-icons icon">check_circle</span>
          <div class="title">Email Verified!</div>
          <div class="message">
            Your email has been successfully verified. You can now log in to your account.
          </div>
          <div class="actions">
            <button class="primary" @click=${() => window.location.href = '/login'}>
              Log In
            </button>
          </div>
        </div>
      `;
    }

    if (this.verificationSent) {
      return html`
        <div class="container">
          <span class="material-icons icon">mark_email_read</span>
          <div class="title">Verification Email Sent</div>
          <div class="message">
            We've sent a new verification link to <span class="email">${this.email}</span>.<br>
            Please check your inbox and click the link to verify your email address.
          </div>
          <div class="actions">
            <button class="secondary" @click=${() => this.verificationSent = false}>
              Try Another Email
            </button>
          </div>
        </div>
      `;
    }

    return html`
      <div class="container">
        <span class="material-icons icon">mail</span>
        <div class="title">Verify Your Email</div>
        <div class="message">
          ${this.token ? 
            'The verification link appears to be invalid or has expired. Please request a new verification link.' :
            'Enter your email address below and we\'ll send you a verification link.'}
        </div>

        ${this.error ? html`
          <div class="error-message">${this.error}</div>
        ` : ''}

        <div class="actions">
          <input
            type="email"
            .value=${this.email || ''}
            @input=${(e) => this.email = e.target.value}
            placeholder="Enter your email address"
            ?disabled=${this.loading}
          >
          <button 
            class="primary"
            @click=${this.resendVerification}
            ?disabled=${this.loading}
          >
            Send Verification Link
          </button>
          <button 
            class="secondary"
            @click=${() => window.location.href = '/login'}
          >
            Back to Login
          </button>
        </div>
      </div>
    `;
  }
}

customElements.define('verify-email', VerifyEmail); 