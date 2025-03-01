import {  html, css  } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";
import { BaseComponent } from "../components/base-component.js";
import { baseStyles } from "../styles/base.js";

/**
 * @element registration-page
 * @description Registration page component with sign-up form
 */
export class RegistrationPage extends BaseComponent {
  static properties = {
    loading: { type: Boolean, state: true },
    error: { type: String, state: true },
    formData: { type: Object, state: true },
  };

  static styles = [
    baseStyles,
    css`
      :host {
        display: block;
        padding: 2rem;
      }

      .registration-page {
        max-width: 400px;
        margin: 0 auto;
      }

      .form-group {
        margin-bottom: 1rem;
      }

      label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 500;
      }

      input {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid var(--color-border);
        border-radius: var(--radius-sm);
        font-size: 1rem;
      }

      button {
        width: 100%;
        padding: 0.75rem;
        background: var(--color-primary);
        color: white;
        border: none;
        border-radius: var(--radius-sm);
        font-size: 1rem;
        font-weight: 500;
        cursor: pointer;
      }

      button:disabled {
        opacity: 0.7;
        cursor: not-allowed;
      }

      .error-message {
        color: var(--color-error);
        margin-top: 0.5rem;
        font-size: 0.875rem;
      }

      .social-login {
        margin-top: 2rem;
        text-align: center;
      }

      .social-button {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        width: 100%;
        padding: 0.75rem;
        margin-bottom: 1rem;
        background: var(--color-surface);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-sm);
        cursor: pointer;
      }

      .social-button:hover {
        background: var(--color-surface-hover);
      }
    `,
  ];

  constructor() {
    super();
    this.loading = false;
    this.error = null;
    this.formData = {};
    this.handleEvent = this.handleEvent.bind(this);
  }

  handleEvent(event) {
    if (event.type === "submit") {
      this.handleSubmit(event);
    } else if (event.type === "input") {
      this.handleInput(event);
    }
  }

  handleInput(event) {
    const { name, value } = event.target;
    this.formData = {
      ...this.formData,
      [name]: value,
    };
  }

  async handleSubmit(event) {
    event.preventDefault();
    this.loading = true;
    this.error = null;

    try {
      // Validate email availability
      const emailAvailable = await window.auth.checkEmailAvailability(
        this.formData.email
      );
      if (!emailAvailable) {
        throw new Error("Email is already registered");
      }

      // Validate password strength
      const passwordValidation = await window.auth.validatePassword(
        this.formData.password
      );
      if (!passwordValidation.isValid) {
        throw new Error("Password does not meet requirements");
      }

      // Register user
      const result = await window.auth.register(this.formData);
      if (result.success) {
        // Send verification email
        await window.auth.sendVerificationEmail(this.formData.email);

        this.dispatchEvent(
          new CustomEvent("registration-success", {
            detail: { email: this.formData.email },
            bubbles: true,
            composed: true,
          })
        );
      }
    } catch (error) {
      this.error = error.message;
    } finally {
      this.loading = false;
    }
  }

  async handleSocialLogin(provider) {
    this.loading = true;
    this.error = null;

    try {
      const result = await (provider === "google"
        ? window.auth.registerWithGoogle()
        : window.auth.registerWithGithub());

      this.dispatchEvent(
        new CustomEvent("registration-success", {
          detail: { user: result.user },
          bubbles: true,
          composed: true,
        })
      );
    } catch (error) {
      this.error = error.message;
    } finally {
      this.loading = false;
    }
  }

  render() {
    return html`
      <div class="registration-page">
        <h1>Create an Account</h1>
        <form class="registration-form" @submit=${this.handleEvent}>
          <div class="form-group">
            <label for="name">Full Name</label>
            <input
              type="text"
              id="name"
              name="name"
              required
              @input=${this.handleEvent}
              ?disabled=${this.loading}
            />
          </div>
          <div class="form-group">
            <label for="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              required
              @input=${this.handleEvent}
              ?disabled=${this.loading}
            />
          </div>
          <div class="form-group">
            <label for="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              required
              minlength="8"
              @input=${this.handleEvent}
              ?disabled=${this.loading}
            />
          </div>
          <div class="form-group">
            <label for="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              required
              @input=${this.handleEvent}
              ?disabled=${this.loading}
            />
          </div>
          ${this.error
            ? html`<div class="error-message">${this.error}</div>`
            : ""}
          <button type="submit" ?disabled=${this.loading}>
            ${this.loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <div class="social-login">
          <p>Or sign up with</p>
          <button
            class="social-button"
            @click=${() => this.handleSocialLogin("google")}
            ?disabled=${this.loading}
          >
            <img src="/assets/google-icon.svg" alt="Google" />
            Continue with Google
          </button>
          <button
            class="social-button"
            @click=${() => this.handleSocialLogin("github")}
            ?disabled=${this.loading}
          >
            <img src="/assets/github-icon.svg" alt="GitHub" />
            Continue with GitHub
          </button>
        </div>
      </div>
    `;
  }
}

// Register the component if it hasn't been registered yet
if (!customElements.get("registration-page")) {
  customElements.define("registration-page", RegistrationPage);
}
