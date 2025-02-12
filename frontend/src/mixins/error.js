import { dedupeMixin } from "/vendor/lit-core.min.js";
import { html } from "/vendor/lit-core.min.js";

/**
 * Error handling mixin for Lit components
 * @param {typeof LitElement} superClass
 */
const ErrorMixin = (superClass) =>
  class extends superClass {
    static properties = {
      ...superClass.properties,
      error: { type: Object },
      errorMessage: { type: String },
      showError: { type: Boolean },
      errorTimeout: { type: Number },
    };

    constructor() {
      super();
      this.error = null;
      this.errorMessage = "";
      this.showError = false;
      this.errorTimeout = 5000; // 5 seconds
      this._errorTimeoutId = null;
    }

    /**
     * Set error state
     * @param {Error|string} error - Error object or message
     * @param {number} [timeout] - Optional custom timeout
     */
    setError(error, timeout = this.errorTimeout) {
      this.error = error instanceof Error ? error : new Error(error);
      this.errorMessage = error instanceof Error ? error.message : error;
      this.showError = true;

      // Clear any existing timeout
      if (this._errorTimeoutId) {
        clearTimeout(this._errorTimeoutId);
      }

      // Auto-hide error after timeout if timeout > 0
      if (timeout > 0) {
        this._errorTimeoutId = setTimeout(() => {
          this.clearError();
        }, timeout);
      }

      // Dispatch error event
      this.dispatchEvent(
        new CustomEvent("error", {
          detail: { error: this.error },
          bubbles: true,
          composed: true,
        })
      );
    }

    /**
     * Clear error state
     */
    clearError() {
      this.error = null;
      this.errorMessage = "";
      this.showError = false;

      if (this._errorTimeoutId) {
        clearTimeout(this._errorTimeoutId);
        this._errorTimeoutId = null;
      }
    }

    /**
     * Handle async operation with error handling
     * @param {Function} fn - Async function to execute
     * @param {Object} options - Options for error handling
     * @param {string} [options.loadingMessage] - Loading message
     * @param {string} [options.errorMessage] - Error message prefix
     * @param {number} [options.errorTimeout] - Custom error timeout
     * @returns {Promise<any>}
     */
    async withErrorHandling(
      fn,
      {
        loadingMessage = "Loading...",
        errorMessage = "An error occurred: ",
        errorTimeout = this.errorTimeout,
      } = {}
    ) {
      try {
        // Check if component has loading mixin
        if (this.startLoading) {
          this.startLoading(loadingMessage);
        }

        const result = await fn();
        return result;
      } catch (error) {
        const message = `${errorMessage}${error.message || error}`;
        this.setError(message, errorTimeout);
        throw error;
      } finally {
        if (this.stopLoading) {
          this.stopLoading();
        }
      }
    }

    /**
     * Render error template
     * @returns {import('lit').TemplateResult}
     */
    renderError() {
      if (!this.showError) return null;

      return html`
        <div class="error-container" role="alert">
          <div class="error-icon">⚠️</div>
          <div class="error-message">${this.errorMessage}</div>
          <button class="error-close" @click=${this.clearError}>×</button>
        </div>
      `;
    }

    /**
     * Set error timeout duration
     * @param {number} timeout - Timeout in milliseconds
     */
    setErrorTimeout(timeout) {
      if (typeof timeout === "number" && timeout >= 0) {
        this.errorTimeout = timeout;
      }
    }

    disconnectedCallback() {
      super.disconnectedCallback?.();
      if (this._errorTimeoutId) {
        clearTimeout(this._errorTimeoutId);
        this._errorTimeoutId = null;
      }
    }
  };

export const Error = dedupeMixin(ErrorMixin);
