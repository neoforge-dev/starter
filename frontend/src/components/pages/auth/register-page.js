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

export class RegisterPage extends LitElement {
  static properties = {
    loading: { type: Boolean },
    error: { type: String },
  };

  static styles = [baseStyles, authStyles];

  constructor() {
    super();
    this.loading = false;
    this.error = "";
  }

  async _handleSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const name = formData.get("name");
    const email = formData.get("email");
    const password = formData.get("password");
    const confirmPassword = formData.get("confirmPassword");

    // Basic validation
    if (!name || !email || !password || !confirmPassword) {
      this.error = "Please fill in all fields";
      return;
    }

    if (password !== confirmPassword) {
      this.error = "Passwords do not match";
      return;
    }

    if (password.length < 8) {
      this.error = "Password must be at least 8 characters long";
      return;
    }

    try {
      this.loading = true;
      this.error = "";
      await authService.register({
        name,
        email,
        password,
      });
      showToast(
        "Registration successful! Please check your email to verify your account.",
        "success"
      );
      window.location.href = "/auth/login";
    } catch (error) {
      this.error = error.message || "Failed to register. Please try again.";
      showToast(this.error, "error");
    } finally {
      this.loading = false;
    }
  }

  render() {
    return html`
      <div class="auth-page">
        <neo-card class="auth-card">
          <h1>Create Account</h1>
          <p class="auth-subtitle">Join NeoForge today</p>

          ${this.error
            ? html` <div class="error-message">${this.error}</div> `
            : ""}

          <form @submit=${this._handleSubmit}>
            <div class="form-group">
              <neo-input
                type="text"
                name="name"
                label="Full Name"
                placeholder="Enter your full name"
                required
                autocomplete="name"
              ></neo-input>
            </div>

            <div class="form-group">
              <neo-input
                type="email"
                name="email"
                label="Email"
                placeholder="Enter your email"
                required
                autocomplete="email"
              ></neo-input>
            </div>

            <div class="form-group">
              <neo-input
                type="password"
                name="password"
                label="Password"
                placeholder="Create a password"
                required
                minlength="8"
                autocomplete="new-password"
              ></neo-input>
            </div>

            <div class="form-group">
              <neo-input
                type="password"
                name="confirmPassword"
                label="Confirm Password"
                placeholder="Confirm your password"
                required
                minlength="8"
                autocomplete="new-password"
              ></neo-input>
            </div>

            <div class="form-group">
              <label class="terms">
                <input type="checkbox" name="terms" required />
                I agree to the
                <a href="/terms" target="_blank">Terms of Service</a>
                and
                <a href="/privacy" target="_blank">Privacy Policy</a>
              </label>
            </div>

            <neo-button
              type="submit"
              variant="primary"
              ?loading=${this.loading}
              style="width: 100%"
            >
              ${this.loading ? "Creating Account..." : "Create Account"}
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
}

customElements.define("register-page", RegisterPage);
