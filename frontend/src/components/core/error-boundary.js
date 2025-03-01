import {  LitElement, html, css  } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";
import { baseStyles } from "../styles/base.js";

/**
 * Error boundary component for handling component loading and runtime errors
 * @customElement error-boundary
 */
export class ErrorBoundary extends LitElement {
  static properties = {
    hasError: { type: Boolean, state: true },
    error: { type: Object, state: true },
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
        background: var(--color-error-bg);
        border: 1px solid var(--color-error-border);
        border-radius: var(--radius-md);
        padding: var(--spacing-lg);
        text-align: center;
        color: var(--color-error-text);
      }

      .error-icon {
        font-size: 2rem;
        margin-bottom: var(--spacing-md);
      }

      .error-message {
        margin-bottom: var(--spacing-lg);
      }

      .retry-button {
        background: var(--color-primary);
        color: white;
        border: none;
        padding: var(--spacing-sm) var(--spacing-lg);
        border-radius: var(--radius-sm);
        cursor: pointer;
        transition: background var(--transition-fast);
      }

      .retry-button:hover {
        background: var(--color-primary-dark);
      }

      .error-details {
        margin-top: var(--spacing-lg);
        padding: var(--spacing-md);
        background: var(--color-error-details-bg);
        border-radius: var(--radius-sm);
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
    this.retry = null;

    // Listen for component loading errors
    this._handleComponentError = this._handleComponentError.bind(this);
    window.addEventListener("component-load-error", this._handleComponentError);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener(
      "component-load-error",
      this._handleComponentError
    );
  }

  _handleComponentError(event) {
    const { error, tagName } = event.detail;
    this.hasError = true;
    this.error = error;
    this.retry = () => {
      this.hasError = false;
      this.error = null;
      // Attempt to reload the component
      const element = document.createElement(tagName);
      this.parentElement.replaceChild(element, this);
    };
    this.requestUpdate();
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
          <p>There was an error loading this component.</p>
        </div>
        ${this.retry
          ? html`
              <button class="retry-button" @click=${this.retry}>
                Try Again
              </button>
            `
          : null}
        ${this.error
          ? html`
              <div class="error-details">
                <strong>Error:</strong>
                <pre>${this.error.message}</pre>
              </div>
            `
          : null}
      </div>
    `;
  }
}

customElements.define("error-boundary", ErrorBoundary);
