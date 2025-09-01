import {
  LitElement,
  html,
 } from 'lit';
import { baseStyles } from "../../styles/base.js";
import { authStyles } from "../../styles/auth.js";
import { authService } from "../../services/auth.ts";
import { showToast } from "../../components/ui/toast/index.js";
import "../../components/ui/button.js";
import "../../components/ui/input.js";
import "../../components/ui/card.js";

export class LoginPage extends LitElement {
  static properties = {
    loading: { type: Boolean },
    error: { type: String },
    emailError: { type: String },
    passwordError: { type: String },
  };

  static styles = [baseStyles, authStyles];

  constructor() {
    super();
    this.loading = false;
    this.error = "";
    this.emailError = "";
    this.passwordError = "";
  }

  validateForm(email, password) {
    let isValid = true;
    this.emailError = "";
    this.passwordError = "";

    if (!email) {
      this.emailError = "Email is required";
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      this.emailError = "Please enter a valid email address";
      isValid = false;
    }

    if (!password) {
      this.passwordError = "Password is required";
      isValid = false;
    }

    return isValid;
  }

  async _handleSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const email = formData.get("email");
    const password = formData.get("password");

    if (!this.validateForm(email, password)) {
      return;
    }

    try {
      this.loading = true;
      this.error = "";
      await authService.login(email, password);
      showToast("Successfully logged in!", "success");
      window.location.href = "/dashboard";
    } catch (error) {
      this.error = error.message || "Failed to login. Please try again.";
      showToast(this.error, "error");
    } finally {
      this.loading = false;
    }
  }

  render() {
    return html`
      <div class="auth-page">
        <neo-card class="auth-card">
          <h1>Welcome Back</h1>
          <p class="auth-subtitle">Sign in to your account</p>

          ${this.error
            ? html` <div class="error-message">${this.error}</div> `
            : ""}

          <form @submit=${this._handleSubmit}>
            <div class="form-group">
              <neo-input
                type="email"
                name="email"
                label="Email"
                placeholder="Enter your email"
                required
                autocomplete="email"
                ?disabled=${this.loading}
              ></neo-input>
              ${this.emailError
                ? html`<div class="field-error">${this.emailError}</div>`
                : ""}
            </div>

            <div class="form-group">
              <neo-input
                type="password"
                name="password"
                label="Password"
                placeholder="Enter your password"
                required
                autocomplete="current-password"
                ?disabled=${this.loading}
              ></neo-input>
              ${this.passwordError
                ? html`<div class="field-error">${this.passwordError}</div>`
                : ""}
            </div>

            <div class="form-actions">
              <label class="remember-me">
                <input type="checkbox" name="remember" />
                Remember me
              </label>
              <a href="/auth/forgot-password" class="forgot-password">
                Forgot password?
              </a>
            </div>

            <neo-button
              type="submit"
              variant="primary"
              ?loading=${this.loading}
              ?disabled=${this.loading}
              style="width: 100%"
            >
              ${this.loading ? "Signing in..." : "Sign In"}
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
}

customElements.define("login-page", LoginPage);
