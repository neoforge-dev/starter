import { dedupeMixin } from "/vendor/lit-core.min.js";
import { html } from "/vendor/lit-core.min.js";
import { css } from "/vendor/lit-core.min.js";

/**
 * Loading mixin for Lit components
 * @param {typeof LitElement} superClass
 */
const LoadingMixin = (superClass) =>
  class extends superClass {
    static properties = {
      ...superClass.properties,
      loading: { type: Boolean, reflect: true },
      loadingMessage: { type: String },
      loadingDelay: { type: Number },
      loadingType: { type: String }, // 'spinner' | 'skeleton' | 'overlay' | 'dots' | 'pulse'
      skeletonTemplate: { type: Object },
    };

    constructor() {
      super();
      this.loading = false;
      this.loadingMessage = "Loading...";
      this.loadingDelay = 300;
      this.loadingType = "spinner";
      this._loadingTimeout = null;
      this.skeletonTemplate = null;
    }

    /**
     * Start loading state with optional delay
     * @param {string} [message] - Optional loading message
     */
    startLoading(message) {
      if (message) {
        this.loadingMessage = message;
      }

      // Clear any existing timeout
      if (this._loadingTimeout) {
        clearTimeout(this._loadingTimeout);
      }

      // Set loading state after delay to prevent flashing
      this._loadingTimeout = setTimeout(() => {
        this.loading = true;
        this.dispatchEvent(
          new CustomEvent("loading-started", {
            bubbles: true,
            composed: true,
          })
        );
      }, this.loadingDelay);
    }

    /**
     * Stop loading state
     */
    stopLoading() {
      // Clear timeout if it exists
      if (this._loadingTimeout) {
        clearTimeout(this._loadingTimeout);
        this._loadingTimeout = null;
      }

      // Reset loading state
      this.loading = false;
      this.dispatchEvent(
        new CustomEvent("loading-stopped", {
          bubbles: true,
          composed: true,
        })
      );
    }

    /**
     * Execute a function with loading state
     * @param {Function} fn - Function to execute
     * @param {string} [message] - Optional loading message
     * @returns {Promise<any>}
     */
    async withLoading(fn, message) {
      try {
        this.startLoading(message);
        const result = await fn();
        return result;
      } finally {
        this.stopLoading();
      }
    }

    /**
     * Render loading template based on loading type
     * @returns {import('lit').TemplateResult}
     */
    renderLoading() {
      if (!this.loading) return null;

      switch (this.loadingType) {
        case "skeleton":
          return this.renderSkeleton();
        case "overlay":
          return this.renderOverlay();
        case "dots":
          return this.renderDots();
        case "pulse":
          return this.renderPulse();
        case "spinner":
        default:
          return this.renderSpinner();
      }
    }

    /**
     * Render spinner loading template
     * @returns {import('lit').TemplateResult}
     */
    renderSpinner() {
      return html`
        <div class="loading-container">
          <div class="loading-spinner"></div>
          <div class="loading-message">${this.loadingMessage}</div>
        </div>
      `;
    }

    /**
     * Render skeleton loading template
     * @returns {import('lit').TemplateResult}
     */
    renderSkeleton() {
      if (this.skeletonTemplate) {
        return this.skeletonTemplate();
      }

      // Default skeleton template
      return html`
        <div class="skeleton-container">
          <div class="skeleton skeleton-text title"></div>
          <div class="skeleton skeleton-text subtitle"></div>
          ${Array(3)
            .fill()
            .map(() => html` <div class="skeleton skeleton-text body"></div> `)}
        </div>
      `;
    }

    /**
     * Render overlay loading template
     * @returns {import('lit').TemplateResult}
     */
    renderOverlay() {
      return html`
        <div class="loading-overlay">
          <div class="loading-container">
            <div class="loading-spinner"></div>
            <div class="loading-message">${this.loadingMessage}</div>
          </div>
        </div>
      `;
    }

    /**
     * Render dots loading template
     * @returns {import('lit').TemplateResult}
     */
    renderDots() {
      return html`
        <div class="loading-dots">
          <div></div>
          <div></div>
          <div></div>
        </div>
      `;
    }

    /**
     * Render pulse loading template
     * @returns {import('lit').TemplateResult}
     */
    renderPulse() {
      return html`<div class="loading-pulse"></div>`;
    }

    /**
     * Set loading type
     * @param {'spinner' | 'skeleton' | 'overlay' | 'dots' | 'pulse'} type
     */
    setLoadingType(type) {
      if (["spinner", "skeleton", "overlay", "dots", "pulse"].includes(type)) {
        this.loadingType = type;
      }
    }

    /**
     * Set custom skeleton template
     * @param {Function} template - Function that returns TemplateResult
     */
    setSkeletonTemplate(template) {
      if (typeof template === "function") {
        this.skeletonTemplate = template;
      }
    }

    /**
     * Check if component is in loading state
     * @returns {boolean}
     */
    isLoading() {
      return this.loading;
    }

    /**
     * Set loading delay
     * @param {number} delay - Delay in milliseconds
     */
    setLoadingDelay(delay) {
      if (typeof delay === "number" && delay >= 0) {
        this.loadingDelay = delay;
      }
    }

    disconnectedCallback() {
      super.disconnectedCallback?.();
      if (this._loadingTimeout) {
        clearTimeout(this._loadingTimeout);
        this._loadingTimeout = null;
      }
    }

    static styles = [
      superClass.styles || [],
      css`
        .loading-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid currentColor;
          border-right-color: transparent;
          border-radius: 50%;
          animation: spin 0.75s linear infinite;
        }

        .loading-dots {
          display: flex;
          gap: 4px;
        }

        .loading-dots div {
          width: 4px;
          height: 4px;
          background: currentColor;
          border-radius: 50%;
          animation: dots 1s infinite;
        }

        .loading-dots div:nth-child(2) {
          animation-delay: 0.2s;
        }
        .loading-dots div:nth-child(3) {
          animation-delay: 0.4s;
        }

        .loading-pulse {
          width: 20px;
          height: 20px;
          background: currentColor;
          border-radius: 50%;
          animation: pulse 1s ease-in-out infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes dots {
          0%,
          100% {
            transform: scale(0.5);
            opacity: 0.5;
          }
          50% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes pulse {
          0% {
            transform: scale(0.8);
            opacity: 0.5;
          }
          50% {
            transform: scale(1);
            opacity: 1;
          }
          100% {
            transform: scale(0.8);
            opacity: 0.5;
          }
        }
      `,
    ];
  };

export const Loading = dedupeMixin(LoadingMixin);
