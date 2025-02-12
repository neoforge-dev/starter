import { LitElement, html, css } from "lit";
import { authService } from "../services/auth.js";

export class LoginForm extends LitElement {
  static properties = {
    isLoading: { type: Boolean },
    errorMessage: { type: String },
  };

  static styles = css`
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
      color: var(--text-color);
      font-weight: 500;
    }

    input {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #e2e8f0;
      border-radius: 4px;
      font-size: 1rem;
      transition: border-color 0.2s;
    }

    input:focus {
      outline: none;
      border-color: var(--primary-color);
      box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
    }

    button {
      width: 100%;
      padding: 0.75rem;
      background-color: var(--primary-color);
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 1rem;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    button:hover {
      background-color: var(--secondary-color);
    }

    button:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }

    .error {
      color: #e53e3e;
      margin-top: 0.5rem;
      font-size: 0.875rem;
    }

    .loading {
      opacity: 0.7;
      pointer-events: none;
    }

    .forgot-password {
      display: block;
      text-align: right;
      color: var(--primary-color);
      text-decoration: none;
      font-size: 0.875rem;
      margin-top: 0.5rem;
    }

    .forgot-password:hover {
      text-decoration: underline;
    }

    .links {
      margin-top: 1.5rem;
      text-align: center;
    }

    .links a {
      color: var(--primary-color);
      text-decoration: none;
    }

    .links a:hover {
      text-decoration: underline;
    }
  `;

  constructor() {
    super();
    this.isLoading = false;
    this.errorMessage = "";
  }

  async handleSubmit(e) {
    e.preventDefault();
    this.isLoading = true;
    this.errorMessage = "";

    const formData = new FormData(e.target);
    const email = formData.get("email");
    const password = formData.get("password");

    try {
      await authService.login(email, password);
      this.dispatchEvent(new CustomEvent("success"));
    } catch (error) {
      this.errorMessage = error.message || "Login failed. Please try again.";
    } finally {
      this.isLoading = false;
    }
  }

  render() {
    return html`
      <form
        @submit=${this.handleSubmit}
        class="${this.isLoading ? "loading" : ""}"
      >
        <div class="form-group">
          <label for="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            required
            autocomplete="email"
            ?disabled=${this.isLoading}
          />
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            required
            autocomplete="current-password"
            ?disabled=${this.isLoading}
          />
          <a href="/forgot-password" class="forgot-password"
            >Forgot password?</a
          >
        </div>

        ${this.errorMessage
          ? html`<div class="error">${this.errorMessage}</div>`
          : ""}

        <button type="submit" ?disabled=${this.isLoading}>
          ${this.isLoading ? "Logging in..." : "Log In"}
        </button>

        <div class="links">
          <a
            href="#"
            @click=${() =>
              this.dispatchEvent(new CustomEvent("switch-to-signup"))}
          >
            Don't have an account? Sign up
          </a>
        </div>
      </form>
    `;
  }
}

customElements.define("login-form", LoginForm);
