/**
 * RegisterPage Component - VANILLA JAVASCRIPT VERSION
 * Uses atomic design components (Button, Input, Card, FormField)
 */
export class RegisterPage extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.loading = false;
    this.error = '';
    this.nameError = '';
    this.emailError = '';
    this.passwordError = '';
    this.confirmPasswordError = '';
  }

  connectedCallback() {
    this.render();
    this.attachEventListeners();
  }

  render() {
    const styles = `
      :host {
        display: block;
        min-height: 100vh;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1rem;
      }

      .auth-container {
        max-width: 400px;
        width: 100%;
      }

      .auth-header {
        text-align: center;
        margin-bottom: 2rem;
      }

      .auth-title {
        font-size: 2rem;
        font-weight: 700;
        color: white;
        margin: 0 0 0.5rem 0;
      }

      .auth-subtitle {
        color: rgba(255, 255, 255, 0.8);
        margin: 0;
        font-size: 1rem;
      }

      .error-message {
        background: #fee2e2;
        color: #dc2626;
        padding: 0.75rem;
        border-radius: 6px;
        margin-bottom: 1rem;
        font-size: 0.875rem;
        border: 1px solid #fecaca;
      }

      .auth-footer {
        text-align: center;
        margin-top: 2rem;
        padding-top: 2rem;
        border-top: 1px solid rgba(255, 255, 255, 0.2);
      }

      .auth-footer p {
        color: rgba(255, 255, 255, 0.8);
        margin: 0;
        font-size: 0.875rem;
      }

      .auth-footer a {
        color: #93c5fd;
        text-decoration: none;
      }

      .auth-footer a:hover {
        color: white;
        text-decoration: underline;
      }

      .terms-container {
        margin-bottom: 1.5rem;
      }

      .terms-label {
        display: flex;
        align-items: flex-start;
        gap: 0.5rem;
        color: white;
        font-size: 0.875rem;
        cursor: pointer;
        line-height: 1.4;
      }

      .terms-label input[type="checkbox"] {
        width: 1rem;
        height: 1rem;
        margin-top: 0.125rem;
        accent-color: #2563eb;
        flex-shrink: 0;
      }

      .terms-text {
        margin: 0;
      }

      .terms-link {
        color: #93c5fd;
        text-decoration: none;
      }

      .terms-link:hover {
        color: white;
        text-decoration: underline;
      }

      .terms-error {
        color: #ef4444;
        font-size: 0.875rem;
        margin-top: 0.25rem;
        display: block;
      }
    `;

    this.shadowRoot.innerHTML = `
      <style>${styles}</style>
      <div class="auth-container">
        <div class="auth-header">
          <h1 class="auth-title">Create Account</h1>
          <p class="auth-subtitle">Join NeoForge today</p>
        </div>

        <neo-card shadow="medium" padding="large">
          ${this.error ? `<div class="error-message">${this.error}</div>` : ''}

          <form id="register-form">
            <neo-form-field
              id="name-field"
              label="Full Name"
              type="text"
              placeholder="Enter your full name"
              required
              ${this.nameError ? `error="${this.nameError}"` : ''}
              ${this.loading ? 'disabled' : ''}
            ></neo-form-field>

            <neo-form-field
              id="email-field"
              label="Email"
              type="email"
              placeholder="Enter your email"
              required
              ${this.emailError ? `error="${this.emailError}"` : ''}
              ${this.loading ? 'disabled' : ''}
            ></neo-form-field>

            <neo-form-field
              id="password-field"
              label="Password"
              type="password"
              placeholder="Create a password"
              required
              ${this.passwordError ? `error="${this.passwordError}"` : ''}
              ${this.loading ? 'disabled' : ''}
            ></neo-form-field>

            <neo-form-field
              id="confirm-password-field"
              label="Confirm Password"
              type="password"
              placeholder="Confirm your password"
              required
              ${this.confirmPasswordError ? `error="${this.confirmPasswordError}"` : ''}
              ${this.loading ? 'disabled' : ''}
            ></neo-form-field>

            <div class="terms-container">
              <label class="terms-label">
                <input type="checkbox" name="terms" required ${this.loading ? 'disabled' : ''} />
                <div class="terms-text">
                  I agree to the
                  <a href="/terms" class="terms-link" target="_blank">Terms of Service</a>
                  and
                  <a href="/privacy" class="terms-link" target="_blank">Privacy Policy</a>
                </div>
              </label>
              ${this.error && this.error.includes('terms') ? '<span class="terms-error">You must accept the terms and conditions</span>' : ''}
            </div>

            <neo-button
              type="submit"
              variant="primary"
              size="large"
              ${this.loading ? 'loading' : ''}
              style="width: 100%"
            >
              ${this.loading ? 'Creating Account...' : 'Create Account'}
            </neo-button>
          </form>

          <div class="auth-footer">
            <p>
              Already have an account?
              <a href="/auth/login">Sign in</a>
            </p>
          </div>
        </neo-card>
      </div>
    `;
  }

  attachEventListeners() {
    const form = this.shadowRoot.getElementById('register-form');
    if (form) {
      form.addEventListener('submit', this.handleSubmit.bind(this));
    }
  }

  async handleSubmit(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const name = formData.get('name');
    const email = formData.get('email');
    const password = formData.get('password');
    const confirmPassword = formData.get('confirmPassword');
    const termsAccepted = formData.get('terms');

    if (!this.validateForm(name, email, password, confirmPassword, termsAccepted)) {
      return;
    }

    try {
      this.loading = true;
      this.error = '';
      this.render();

      // Simulate API call - replace with actual auth service
      await new Promise(resolve => setTimeout(resolve, 1000));

      // For now, just redirect to login
      window.location.href = '/auth/login?registered=true';

    } catch (error) {
      this.error = error.message || 'Failed to register. Please try again.';
      this.render();
    } finally {
      this.loading = false;
      this.render();
    }
  }

  validateForm(name, email, password, confirmPassword, termsAccepted) {
    let isValid = true;

    // Reset errors
    this.nameError = '';
    this.emailError = '';
    this.passwordError = '';
    this.confirmPasswordError = '';

    // Name validation
    if (!name || !name.trim()) {
      this.nameError = 'Full name is required';
      isValid = false;
    } else if (name.trim().length < 2) {
      this.nameError = 'Full name must be at least 2 characters';
      isValid = false;
    }

    // Email validation
    if (!email) {
      this.emailError = 'Email is required';
      isValid = false;
    } else if (!this.isValidEmail(email)) {
      this.emailError = 'Please enter a valid email address';
      isValid = false;
    }

    // Password validation
    if (!password) {
      this.passwordError = 'Password is required';
      isValid = false;
    } else if (password.length < 8) {
      this.passwordError = 'Password must be at least 8 characters long';
      isValid = false;
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(password)) {
      this.passwordError = 'Password must contain uppercase, lowercase, number, and special character';
      isValid = false;
    }

    // Confirm password validation
    if (!confirmPassword) {
      this.confirmPasswordError = 'Please confirm your password';
      isValid = false;
    } else if (password !== confirmPassword) {
      this.confirmPasswordError = 'Passwords do not match';
      isValid = false;
    }

    // Terms validation
    if (!termsAccepted) {
      this.error = 'You must accept the terms and conditions to continue';
      isValid = false;
    }

    this.render();
    return isValid;
  }

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

customElements.define('register-page', RegisterPage);