/**
 * LoginPage Component - VANILLA JAVASCRIPT VERSION
 * Uses atomic design components (Button, Input, Card, FormField)
 */
export class LoginPage extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.loading = false;
    this.error = '';
    this.emailError = '';
    this.passwordError = '';
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

      .form-actions {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
      }

      .remember-me {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: white;
        font-size: 0.875rem;
        cursor: pointer;
      }

      .remember-me input[type="checkbox"] {
        width: 1rem;
        height: 1rem;
        accent-color: #2563eb;
      }

      .forgot-password {
        color: #93c5fd;
        text-decoration: none;
        font-size: 0.875rem;
      }

      .forgot-password:hover {
        color: white;
        text-decoration: underline;
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
    `;

    this.shadowRoot.innerHTML = `
      <style>${styles}</style>
      <div class="auth-container">
        <div class="auth-header">
          <h1 class="auth-title">Welcome Back</h1>
          <p class="auth-subtitle">Sign in to your account</p>
        </div>

        <neo-card shadow="medium" padding="large">
          ${this.error ? `<div class="error-message">${this.error}</div>` : ''}

          <form id="login-form">
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
              placeholder="Enter your password"
              required
              ${this.passwordError ? `error="${this.passwordError}"` : ''}
              ${this.loading ? 'disabled' : ''}
            ></neo-form-field>

            <div class="form-actions">
              <label class="remember-me">
                <input type="checkbox" name="remember" ${this.loading ? 'disabled' : ''} />
                Remember me
              </label>
              <a href="/auth/forgot-password" class="forgot-password">Forgot password?</a>
            </div>

            <neo-button
              type="submit"
              variant="primary"
              size="large"
              ${this.loading ? 'loading' : ''}
              style="width: 100%"
            >
              ${this.loading ? 'Signing in...' : 'Sign In'}
            </neo-button>
          </form>

          <div class="auth-footer">
            <p>
              Don't have an account?
              <a href="/auth/register">Create one</a>
            </p>
          </div>
        </neo-card>
      </div>
    `;
  }

  attachEventListeners() {
    const form = this.shadowRoot.getElementById('login-form');
    if (form) {
      form.addEventListener('submit', this.handleSubmit.bind(this));
    }
  }

  async handleSubmit(e) {
    e.preventDefault();

    const emailField = this.shadowRoot.getElementById('email-field');
    const passwordField = this.shadowRoot.getElementById('password-field');

    const email = emailField.getValue();
    const password = passwordField.getValue();

    if (!this.validateForm(email, password)) {
      return;
    }

    try {
      this.loading = true;
      this.error = '';
      this.render();

      // Simulate API call - replace with actual auth service
      await new Promise(resolve => setTimeout(resolve, 1000));

      // For now, just redirect to dashboard
      window.location.href = '/dashboard';

    } catch (error) {
      this.error = error.message || 'Failed to login. Please try again.';
      this.render();
    } finally {
      this.loading = false;
      this.render();
    }
  }

  validateForm(email, password) {
    let isValid = true;
    this.emailError = '';
    this.passwordError = '';

    if (!email) {
      this.emailError = 'Email is required';
      isValid = false;
    } else if (!this.isValidEmail(email)) {
      this.emailError = 'Please enter a valid email address';
      isValid = false;
    }

    if (!password) {
      this.passwordError = 'Password is required';
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

customElements.define('login-page', LoginPage);