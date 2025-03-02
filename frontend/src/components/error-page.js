import {
  html,
  css,
} from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";
import { BaseComponent, defineComponent } from "./base-component.js";
import { baseStyles } from "../styles/base.js";

/**
 * @element neo-error-page
 * @description Error page component for displaying error messages
 */
export class ErrorPage extends BaseComponent {
  static get properties() {
    return {
      code: { type: String },
      message: { type: String },
      description: { type: String },
    };
  }

  static get styles() {
    return [
      baseStyles,
      css`
        :host {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          padding: var(--spacing-xl);
          text-align: center;
          background: var(--surface-color);
        }

        .error-container {
          max-width: 600px;
          margin: 0 auto;
        }

        .error-code {
          font-size: 8rem;
          font-weight: 700;
          color: var(--color-primary);
          margin: 0;
          line-height: 1;
          opacity: 0.5;
        }

        .error-message {
          font-size: 2rem;
          font-weight: 500;
          color: var(--text-color);
          margin: var(--spacing-md) 0;
        }

        .error-description {
          font-size: 1.125rem;
          color: var(--text-color-light);
          margin-bottom: var(--spacing-lg);
        }

        .home-button {
          display: inline-flex;
          align-items: center;
          padding: var(--spacing-sm) var(--spacing-md);
          background: var(--color-primary);
          color: white;
          text-decoration: none;
          border-radius: var(--border-radius);
          font-weight: 500;
          transition: background 0.2s ease;
        }

        .home-button:hover {
          background: var(--color-primary-dark);
        }

        .home-button neo-icon {
          margin-right: var(--spacing-xs);
        }

        @media (max-width: 768px) {
          .error-code {
            font-size: 6rem;
          }

          .error-message {
            font-size: 1.5rem;
          }

          .error-description {
            font-size: 1rem;
          }
        }
      `,
    ];
  }

  constructor() {
    super();
    this.code = "404";
    this.message = "Page Not Found";
    this.description =
      "The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.";
  }

  render() {
    return html`
      <div class="error-container">
        <h1 class="error-code">${this.code}</h1>
        <h2 class="error-message">${this.message}</h2>
        <p class="error-description">${this.description}</p>
        <a href="/" class="home-button">
          <neo-icon icon="home"></neo-icon>
          Back to Home
        </a>
      </div>
    `;
  }
}

if (!customElements.get("neo-error-page")) {
  customElements.define("neo-error-page", ErrorPage);
}
