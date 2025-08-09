import { 
  LitElement,
  html,
  css,
 } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";
import { baseStyles } from "../../styles/base.js";
import { AppError, ErrorType } from "../../services/error-service.js";

/**
 * @element neo-error-page
 * @description Error page component for displaying error messages with customizable appearance and behavior
 * @property {String} code - Error code to display (e.g., "404", "500")
 * @property {String} message - Main error message to display
 * @property {String} description - Detailed description of the error
 * @property {Object} error - Error object with type and details
 * @property {Boolean} showDetails - Whether to show detailed error information
 * @fires {CustomEvent} retry - Fired when the retry button is clicked
 */
export class ErrorPage extends LitElement {
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
        padding: var(--spacing-xl, 2rem);
        text-align: center;
        background: var(--surface-color, #ffffff);
      }

      .error-container {
        max-width: 600px;
        margin: 0 auto;
        animation: fade-in 0.3s ease-out;
      }

      .error-code {
        font-size: 8rem;
        font-weight: 700;
        color: var(--color-primary, #3f51b5);
        margin: 0;
        line-height: 1;
        opacity: 0.5;
      }

      .error-title {
        font-size: 2rem;
        font-weight: 500;
        color: var(--text-color, #333333);
        margin: var(--spacing-md, 1rem) 0;
      }

      .error-message {
        font-size: 1.5rem;
        font-weight: 500;
        color: var(--text-color, #333333);
        margin: var(--spacing-md, 1rem) 0;
      }

      .error-description {
        font-size: 1.125rem;
        color: var(--text-color-light, #666666);
        margin-bottom: var(--spacing-lg, 1.5rem);
        line-height: var(--line-height-relaxed, 1.6);
      }

      .error-icon {
        font-size: 2rem;
        margin-bottom: var(--spacing-md, 1rem);
        color: var(--error-color, #f44336);
      }

      .error-details {
        margin-top: var(--spacing-lg, 1.5rem);
        padding: var(--spacing-md, 1rem);
        background: var(--surface-color, #f5f5f5);
        border-radius: var(--border-radius, 4px);
        text-align: left;
        font-family: var(--font-family-mono, monospace);
        white-space: pre-wrap;
        word-break: break-word;
        overflow-x: auto;
      }

      .error-details[hidden] {
        display: none;
      }

      .button-group {
        display: flex;
        gap: var(--spacing-md, 1rem);
        justify-content: center;
        margin-top: var(--spacing-lg, 1.5rem);
      }

      .retry-button,
      .home-button {
        display: inline-flex;
        align-items: center;
        padding: var(--spacing-sm, 0.5rem) var(--spacing-md, 1rem);
        background: var(--color-primary, #3f51b5);
        color: white;
        text-decoration: none;
        border-radius: var(--border-radius, 4px);
        font-weight: 500;
        transition: background 0.2s ease;
        border: none;
        cursor: pointer;
      }

      .retry-button:hover,
      .home-button:hover {
        background: var(--color-primary-dark, #303f9f);
      }

      .details-toggle {
        background: none;
        border: none;
        color: var(--color-primary, #3f51b5);
        cursor: pointer;
        text-decoration: underline;
        padding: 0;
        font-size: 0.875rem;
      }

      .details-toggle:hover {
        color: var(--color-primary-dark, #303f9f);
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

  /**
   * Get error title based on error type
   * @returns {string}
   * @private
   */
  _getErrorTitle() {
    if (!this.error) return this.message;

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
          return "Unexpected Error";
      }
    }

    return this.error.message || "Unexpected Error";
  }

  /**
   * Get user-friendly error message
   * @returns {string}
   * @private
   */
  _getErrorMessage() {
    if (!this.error) {
      return this.message;
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
   * Get error icon based on error type
   * @returns {string}
   * @private
   */
  _getErrorIcon() {
    if (!this.error) return "question-circle";

    if (this.error instanceof AppError) {
      switch (this.error.type) {
        case ErrorType.VALIDATION:
          return "exclamation-circle";
        case ErrorType.NETWORK:
          return "wifi-off";
        case ErrorType.AUTH:
          return "lock";
        case ErrorType.API:
          return "server";
        default:
          return "alert-circle";
      }
    }

    return "error";
  }

  /**
   * Handle retry button click
   * @private
   */
  _handleRetry() {
    this.dispatchEvent(
      new CustomEvent("retry", {
        detail: { error: this.error },
        bubbles: true,
        composed: true,
      })
    );
  }

  /**
   * Handle toggle details button click
   * @private
   */
  _handleToggleDetails() {
    this.showDetails = !this.showDetails;
  }

  /**
   * Handle return home button click
   * @private
   */
  _handleReturnHome() {
    window.location.href = "/";
  }

  render() {
    const title = this._getErrorTitle();
    const icon = this._getErrorIcon();
    const message = this._getErrorMessage();

    return html`
      <div class="error-container">
        <h1 class="error-code">${this.code}</h1>
        <span class="material-icons error-icon">${icon}</span>
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
                  <span class="material-icons">refresh</span>
                  Retry
                </button>
                <a href="/" class="home-button">
                  <span class="material-icons">home</span>
                  Back to Home
                </a>
              </div>
            `
          : html`
              <a href="/" class="home-button">
                <span class="material-icons">home</span>
                Back to Home
              </a>
            `}
      </div>
    `;
  }
}

customElements.define("neo-error-page", ErrorPage);

// Export a helper function to create and show error pages programmatically
export function showErrorPage(container, options = {}) {
  const errorPage = document.createElement("neo-error-page");

  // Set properties from options
  if (options.code) errorPage.code = options.code;
  if (options.message) errorPage.message = options.message;
  if (options.description) errorPage.description = options.description;
  if (options.error) errorPage.error = options.error;

  // Clear container and append error page
  if (container) {
    container.innerHTML = "";
    container.appendChild(errorPage);
  } else {
    document.body.appendChild(errorPage);
  }

  return errorPage;
}
