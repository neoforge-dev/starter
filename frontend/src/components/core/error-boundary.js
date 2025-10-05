import { LitElement, html, css } from 'lit';
import { baseStyles } from "../styles/base.js";
import { Logger } from "../../utils/logger.js";

/**
 * Comprehensive error boundary component for handling runtime errors
 * Catches unhandled promise rejections, global errors, and component errors
 * @customElement error-boundary
 */
export class ErrorBoundary extends LitElement {
  static properties = {
    hasError: { type: Boolean, state: true },
    error: { type: Object, state: true },
    errorInfo: { type: Object, state: true },
    retry: { type: Function },
  };

  static styles = [
    baseStyles,
    css`
      :host {
        display: block;
        padding: var(--spacing-md);
      }

      .error-container {
        background: var(--color-error-bg, #fee);
        border: 1px solid var(--color-error-border, #fcc);
        border-radius: var(--radius-md, 8px);
        padding: var(--spacing-lg, 1.5rem);
        text-align: center;
        color: var(--color-error-text, #c00);
      }

      .error-icon {
        font-size: 2rem;
        margin-bottom: var(--spacing-md, 1rem);
      }

      .error-message {
        margin-bottom: var(--spacing-lg, 1.5rem);
      }

      .error-actions {
        display: flex;
        gap: var(--spacing-md, 1rem);
        justify-content: center;
        margin-top: var(--spacing-lg, 1.5rem);
      }

      .retry-button {
        background: var(--color-primary);
        color: white;
        border: none;
        padding: var(--spacing-sm, 0.5rem) var(--spacing-lg, 1.5rem);
        border-radius: var(--radius-sm, 4px);
        cursor: pointer;
        transition: background var(--transition-fast);
      }

      .retry-button:hover {
        background: var(--color-primary-dark);
      }

      .reload-button {
        background: var(--color-secondary, #666);
        color: white;
        border: none;
        padding: var(--spacing-sm, 0.5rem) var(--spacing-lg, 1.5rem);
        border-radius: var(--radius-sm, 4px);
        cursor: pointer;
        transition: background var(--transition-fast);
      }

      .reload-button:hover {
        background: var(--color-secondary-dark, #444);
      }

      .error-details {
        margin-top: var(--spacing-lg, 1.5rem);
        padding: var(--spacing-md, 1rem);
        background: var(--color-error-details-bg, rgba(0, 0, 0, 0.1));
        border-radius: var(--radius-sm, 4px);
        text-align: left;
        font-family: monospace;
        font-size: 0.9em;
        overflow-x: auto;
      }
    `,
  ];

  constructor() {
    super();
    this.hasError = false;
    this.error = null;
    this.errorInfo = null;
    this.retry = null;

    // Bind methods for event listeners
    this._handleComponentError = this._handleComponentError.bind(this);
    this._handleUnhandledRejection = this._handleUnhandledRejection.bind(this);
    this._handleGlobalError = this._handleGlobalError.bind(this);

    // Listen for component loading errors
    window.addEventListener("component-load-error", this._handleComponentError);
  }

  connectedCallback() {
    super.connectedCallback();

    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', this._handleUnhandledRejection);

    // Catch global errors
    window.addEventListener('error', this._handleGlobalError);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener("component-load-error", this._handleComponentError);
    window.removeEventListener('unhandledrejection', this._handleUnhandledRejection);
    window.removeEventListener('error', this._handleGlobalError);
  }

  _handleUnhandledRejection(event) {
    this._captureError(event.reason, { type: 'unhandledRejection' });
    event.preventDefault();
  }

  _handleGlobalError(event) {
    this._captureError(event.error || new Error(event.message), {
      type: 'globalError',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    });
    event.preventDefault();
  }

  _handleComponentError(event) {
    const { error, tagName } = event.detail;
    this._captureError(error, { type: 'componentError', tagName });

    this.retry = () => {
      this.hasError = false;
      this.error = null;
      this.errorInfo = null;
      // Attempt to reload the component
      const element = document.createElement(tagName);
      this.parentElement.replaceChild(element, this);
    };
  }

  _captureError(error, info) {
    this.error = error;
    this.errorInfo = info;
    this.hasError = true;

    // Log to monitoring service
    Logger.error('Error boundary caught error:', {
      error: error?.message || error,
      stack: error?.stack,
      info
    });

    // Dispatch event for parent components
    this.dispatchEvent(new CustomEvent('error-caught', {
      detail: { error, info },
      bubbles: true,
      composed: true
    }));
  }

  _handleReset() {
    this.error = null;
    this.errorInfo = null;
    this.hasError = false;
    this.retry = null;
    this.dispatchEvent(new CustomEvent('error-reset', { bubbles: true, composed: true }));
  }

  _handleReload() {
    window.location.reload();
  }

  render() {
    if (!this.hasError) {
      return html`<slot></slot>`;
    }

    return html`
      <div class="error-container">
        <div class="error-icon">⚠️</div>
        <div class="error-message">
          <h3>Something went wrong</h3>
          <p>${this.errorInfo?.type === 'componentError'
            ? 'There was an error loading this component.'
            : 'An unexpected error occurred.'}</p>
        </div>
        <div class="error-actions">
          ${this.retry
            ? html`
                <button class="retry-button" @click=${this.retry}>
                  Try Again
                </button>
              `
            : html`
                <button class="retry-button" @click=${this._handleReset}>
                  Reset
                </button>
              `}
          <button class="reload-button" @click=${this._handleReload}>
            Reload Page
          </button>
        </div>
        ${this.error
          ? html`
              <div class="error-details">
                <strong>Error:</strong>
                <pre>${this.error?.message || 'Unknown error'}</pre>
              </div>
            `
          : null}
      </div>
    `;
  }
}

customElements.define("error-boundary", ErrorBoundary);
