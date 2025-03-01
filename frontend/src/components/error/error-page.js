import {  LitElement, html, css  } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";
import { baseStyles } from "../../styles/base.js";
import { AppError, ErrorType } from "../../services/error-service.js";

/**
 * Error page component
 * @element neo-error-page
 */
export class ErrorPage extends LitElement {
  static properties = {
    error: { type: Object },
  };

  static styles = [
    baseStyles,
    css`
      :host {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        padding: var(--spacing-lg);
        background: var(--background-color);
      }

      .error-container {
        max-width: 600px;
        text-align: center;
        animation: fade-in 0.3s ease-out;
      }

      .error-icon {
        font-size: 64px;
        color: var(--error-color);
        margin-bottom: var(--spacing-lg);
      }

      .error-title {
        font-size: var(--font-size-3xl);
        font-weight: var(--font-weight-bold);
        color: var(--text-color);
        margin-bottom: var(--spacing-md);
      }

      .error-message {
        font-size: var(--font-size-lg);
        color: var(--text-secondary);
        margin-bottom: var(--spacing-xl);
        line-height: var(--line-height-relaxed);
      }

      .error-details {
        font-family: var(--font-family-mono);
        font-size: var(--font-size-sm);
        color: var(--text-tertiary);
        background: var(--surface-color);
        padding: var(--spacing-md);
        border-radius: var(--radius-md);
        margin-bottom: var(--spacing-xl);
        text-align: left;
        overflow-x: auto;
      }

      .error-actions {
        display: flex;
        gap: var(--spacing-md);
        justify-content: center;
      }

      .button {
        padding: var(--spacing-sm) var(--spacing-lg);
        border-radius: var(--radius-md);
        font-weight: var(--font-weight-medium);
        transition: all var(--transition-normal);
        cursor: pointer;
      }

      .button-primary {
        background: var(--primary-color);
        color: white;
        border: none;
      }

      .button-primary:hover {
        background: var(--primary-dark);
      }

      .button-secondary {
        background: transparent;
        color: var(--text-color);
        border: 1px solid var(--border-color);
      }

      .button-secondary:hover {
        background: var(--surface-color);
      }

      @keyframes fade-in {
        from {
          opacity: 0;
          transform: translateY(-20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .error-container {
          animation: none;
        }
      }
    `,
  ];

  constructor() {
    super();
    this.error = null;
  }

  /**
   * Get user-friendly error message
   * @returns {string}
   * @private
   */
  _getErrorMessage() {
    if (!this.error) {
      return "An unknown error occurred";
    }

    if (this.error instanceof AppError) {
      switch (this.error.type) {
        case ErrorType.VALIDATION:
          return "Please check your input and try again";
        case ErrorType.NETWORK:
          return "Unable to connect to the server. Please check your internet connection";
        case ErrorType.AUTH:
          return "You need to be logged in to access this page";
        case ErrorType.API:
          return (
            this.error.message ||
            "An error occurred while processing your request"
          );
        default:
          return this.error.message || "An unexpected error occurred";
      }
    }

    return this.error.message || "An unexpected error occurred";
  }

  /**
   * Get error title based on error type
   * @returns {string}
   * @private
   */
  _getErrorTitle() {
    if (!this.error) {
      return "Error";
    }

    if (this.error instanceof AppError) {
      switch (this.error.type) {
        case ErrorType.VALIDATION:
          return "Validation Error";
        case ErrorType.NETWORK:
          return "Network Error";
        case ErrorType.AUTH:
          return "Authentication Error";
        case ErrorType.API:
          return "API Error";
        default:
          return "Error";
      }
    }

    return "Error";
  }

  /**
   * Get error icon based on error type
   * @returns {string}
   * @private
   */
  _getErrorIcon() {
    if (!this.error) {
      return "error";
    }

    if (this.error instanceof AppError) {
      switch (this.error.type) {
        case ErrorType.VALIDATION:
          return "warning";
        case ErrorType.NETWORK:
          return "wifi_off";
        case ErrorType.AUTH:
          return "lock";
        case ErrorType.API:
          return "cloud_off";
        default:
          return "error";
      }
    }

    return "error";
  }

  /**
   * Handle retry button click
   * @private
   */
  _handleRetry() {
    window.location.reload();
  }

  /**
   * Handle return home button click
   * @private
   */
  _handleReturnHome() {
    window.location.href = "/";
  }

  render() {
    return html`
      <div class="error-container">
        <span class="material-icons error-icon">${this._getErrorIcon()}</span>

        <h1 class="error-title">${this._getErrorTitle()}</h1>

        <p class="error-message">${this._getErrorMessage()}</p>

        ${this.error?.details
          ? html`
              <pre class="error-details">
            <code>${JSON.stringify(this.error.details, null, 2)}</code>
          </pre
              >
            `
          : null}

        <div class="error-actions">
          <button class="button button-primary" @click=${this._handleRetry}>
            Try Again
          </button>
          <button
            class="button button-secondary"
            @click=${this._handleReturnHome}
          >
            Return Home
          </button>
        </div>
      </div>
    `;
  }
}
