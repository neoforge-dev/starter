import {
  html,
  css,
} from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";
import { BaseComponent } from "./base-component.js";
import { baseStyles } from "../styles/base.js";
import { AppError, ErrorType } from "../services/error-service.js";

/**
 * @element neo-error-page
 * @description Error page component for displaying error messages
 */
export class ErrorPage extends BaseComponent {
  static properties = {
    code: { type: String },
    message: { type: String },
    description: { type: String },
    error: { type: Object },
    showDetails: { type: Boolean, state: true },
  };

  static styles = [
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

      .error-title {
        font-size: 2rem;
        font-weight: 500;
        color: var(--text-color);
        margin: var(--spacing-md) 0;
      }

      .error-message {
        font-size: 1.5rem;
        font-weight: 500;
        color: var(--text-color);
        margin: var(--spacing-md) 0;
      }

      .error-description {
        font-size: 1.125rem;
        color: var(--text-color-light);
        margin-bottom: var(--spacing-lg);
      }

      .error-icon {
        font-size: 2rem;
        margin-bottom: var(--spacing-md);
      }

      .error-details {
        margin-top: var(--spacing-lg);
        padding: var(--spacing-md);
        background: var(--color-surface);
        border-radius: var(--border-radius);
        text-align: left;
        font-family: monospace;
        white-space: pre-wrap;
        word-break: break-word;
      }

      .error-details[hidden] {
        display: none;
      }

      .button-group {
        display: flex;
        gap: var(--spacing-md);
        justify-content: center;
        margin-top: var(--spacing-lg);
      }

      .retry-button,
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
        border: none;
        cursor: pointer;
      }

      .retry-button:hover,
      .home-button:hover {
        background: var(--color-primary-dark);
      }

      .details-toggle {
        background: none;
        border: none;
        color: var(--color-primary);
        cursor: pointer;
        text-decoration: underline;
        padding: 0;
        font-size: 0.875rem;
      }

      .details-toggle:hover {
        color: var(--color-primary-dark);
      }

      @media (max-width: 768px) {
        .error-code {
          font-size: 6rem;
        }

        .error-title {
          font-size: 1.75rem;
        }

        .error-message {
          font-size: 1.25rem;
        }

        .error-description {
          font-size: 1rem;
        }

        .button-group {
          flex-direction: column;
        }
      }
    `,
  ];

  constructor() {
    super();
    this.code = "404";
    this.message = "Page Not Found";
    this.description =
      "The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.";
    this.error = null;
    this.showDetails = false;
  }

  _getErrorTitle() {
    if (!this.error) return this.message;
    switch (this.error.type) {
      case ErrorType.VALIDATION:
        return "Validation Error";
      case ErrorType.NETWORK:
        return "Network Error";
      case ErrorType.API:
        return "API Error";
      default:
        return "Unexpected Error";
    }
  }

  _getErrorIcon() {
    if (!this.error) return "question-circle";
    switch (this.error.type) {
      case ErrorType.VALIDATION:
        return "exclamation-circle";
      case ErrorType.NETWORK:
        return "wifi-off";
      case ErrorType.API:
        return "server";
      default:
        return "alert-circle";
    }
  }

  _handleRetry() {
    this.dispatchEvent(
      new CustomEvent("retry", {
        detail: { error: this.error },
        bubbles: true,
        composed: true,
      })
    );
  }

  _handleToggleDetails() {
    this.showDetails = !this.showDetails;
  }

  render() {
    const title = this._getErrorTitle();
    const icon = this._getErrorIcon();

    return html`
      <div class="error-container">
        <h1 class="error-code">${this.code}</h1>
        <neo-icon class="error-icon" icon="${icon}"></neo-icon>
        <h2 class="error-title">${title}</h2>
        <p class="error-description">${this.description}</p>

        ${this.error
          ? html`
              <button
                class="details-toggle"
                @click=${this._handleToggleDetails}
              >
                ${this.showDetails ? "Hide Details" : "Show Details"}
              </button>
              <div class="error-details" ?hidden=${!this.showDetails}>
                ${this.error.details
                  ? JSON.stringify(this.error.details, null, 2)
                  : ""}
              </div>
              <div class="button-group">
                <button class="retry-button" @click=${this._handleRetry}>
                  <neo-icon icon="refresh"></neo-icon>
                  Retry
                </button>
                <a href="/" class="home-button">
                  <neo-icon icon="home"></neo-icon>
                  Back to Home
                </a>
              </div>
            `
          : html`
              <a href="/" class="home-button">
                <neo-icon icon="home"></neo-icon>
                Back to Home
              </a>
            `}
      </div>
    `;
  }
}
