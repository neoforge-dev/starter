import { html, css } from "lit";
import { BaseComponent } from "./base-component.js";
import { baseStyles } from "./styles/base.js";

/**
 * Base page component that provides common functionality for all page components
 * Extends BaseComponent for lifecycle management and adds page-specific features.
 * 
 * Features:
 * - Standard page layout and container
 * - Loading state management
 * - Error handling with user-friendly display
 * - Form validation utilities
 * - Common styling patterns
 * - Responsive design helpers
 * - Toast notification integration
 */
export class BasePageComponent extends BaseComponent {
  static properties = {
    loading: { type: Boolean },
    error: { type: String },
    pageTitle: { type: String },
    containerClass: { type: String },
    maxWidth: { type: String },
  };

  static styles = [
    baseStyles,
    css`
      :host {
        display: block;
        min-height: 100vh;
      }

      .page-container {
        max-width: var(--content-max-width, 1200px);
        margin: 0 auto;
        padding: var(--spacing-lg);
      }

      .page-container.narrow {
        max-width: 600px;
      }

      .page-container.wide {
        max-width: 1400px;
      }

      .page-header {
        margin-bottom: var(--spacing-xl);
      }

      .page-title {
        font-size: var(--text-3xl);
        font-weight: var(--weight-bold);
        color: var(--text-1);
        margin-bottom: var(--spacing-sm);
      }

      .page-subtitle {
        color: var(--text-2);
        font-size: var(--text-lg);
        margin: 0;
      }

      .loading-container {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 200px;
        flex-direction: column;
        gap: var(--spacing-md);
      }

      .loading-spinner {
        width: 40px;
        height: 40px;
        border: 3px solid var(--border-color);
        border-top: 3px solid var(--primary-color);
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      .loading-text {
        color: var(--text-2);
        font-size: var(--text-sm);
      }

      .error-container {
        background: var(--error-background, #fef2f2);
        border: 1px solid var(--error-border, #fecaca);
        color: var(--error-color, #dc2626);
        padding: var(--spacing-lg);
        border-radius: var(--radius-md);
        margin: var(--spacing-lg) 0;
      }

      .error-title {
        font-weight: var(--weight-bold);
        margin-bottom: var(--spacing-sm);
      }

      .error-message {
        margin: 0;
        line-height: 1.5;
      }

      .error-actions {
        margin-top: var(--spacing-md);
        display: flex;
        gap: var(--spacing-sm);
      }

      .retry-button {
        background: var(--error-color);
        color: white;
        border: none;
        padding: var(--spacing-sm) var(--spacing-md);
        border-radius: var(--radius-sm);
        cursor: pointer;
        font-size: var(--text-sm);
        transition: opacity 0.2s;
      }

      .retry-button:hover {
        opacity: 0.9;
      }

      /* Form utilities */
      .form-container {
        background: var(--surface-1);
        padding: var(--spacing-xl);
        border-radius: var(--radius-lg);
        border: 1px solid var(--border-color);
      }

      .form-group {
        margin-bottom: var(--spacing-md);
      }

      .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: var(--spacing-md);
        margin-top: var(--spacing-lg);
        padding-top: var(--spacing-lg);
        border-top: 1px solid var(--border-color);
      }

      /* Responsive design */
      @media (max-width: 768px) {
        .page-container {
          padding: var(--spacing-md);
        }

        .page-title {
          font-size: var(--text-2xl);
        }

        .form-actions {
          flex-direction: column;
        }

        .form-actions button {
          width: 100%;
        }
      }

      /* Utility classes */
      .hidden {
        display: none !important;
      }

      .text-center {
        text-align: center;
      }

      .flex-center {
        display: flex;
        align-items: center;
        justify-content: center;
      }
    `,
  ];

  constructor() {
    super();
    this.loading = false;
    this.error = "";
    this.pageTitle = "";
    this.containerClass = "";
    this.maxWidth = "";
  }

  /**
   * Set loading state
   */
  setLoading(loading) {
    this.loading = loading;
  }

  /**
   * Set error state
   */
  setError(error) {
    this.error = error;
  }

  /**
   * Clear error state
   */
  clearError() {
    this.error = "";
  }

  /**
   * Show toast notification (if toast system is available)
   */
  showToast(message, type = "info") {
    if (window.showToast) {
      window.showToast(message, type);
    } else {
      console.log(`Toast: ${type.toUpperCase()} - ${message}`);
    }
  }

  /**
   * Validate email format
   */
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate required fields
   */
  validateRequired(fields) {
    const errors = [];
    
    Object.entries(fields).forEach(([key, value]) => {
      if (!value || (typeof value === "string" && !value.trim())) {
        errors.push(`${key} is required`);
      }
    });

    return errors;
  }

  /**
   * Handle async operations with loading and error states
   */
  async handleAsync(operation, _loadingMessage = "Loading...") {
    try {
      this.setLoading(true);
      this.clearError();
      
      const result = await operation();
      return result;
    } catch (error) {
      console.error("Operation failed:", error);
      this.setError(error.message || "An unexpected error occurred");
      throw error;
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Get container CSS classes
   */
  getContainerClasses() {
    let classes = "page-container";
    
    if (this.containerClass) {
      classes += ` ${this.containerClass}`;
    }
    
    return classes;
  }

  /**
   * Render loading state
   */
  renderLoading(message = "Loading...") {
    return html`
      <div class="loading-container">
        <div class="loading-spinner"></div>
        <div class="loading-text">${message}</div>
      </div>
    `;
  }

  /**
   * Render error state
   */
  renderError(error = this.error, showRetry = false) {
    return html`
      <div class="error-container">
        <div class="error-title">Error</div>
        <div class="error-message">${error}</div>
        ${showRetry ? html`
          <div class="error-actions">
            <button class="retry-button" @click=${this._handleRetry}>
              Try Again
            </button>
          </div>
        ` : ""}
      </div>
    `;
  }

  /**
   * Render page header
   */
  renderPageHeader(title = this.pageTitle, subtitle = "") {
    if (!title && !subtitle) return "";
    
    return html`
      <div class="page-header">
        ${title ? html`<h1 class="page-title">${title}</h1>` : ""}
        ${subtitle ? html`<p class="page-subtitle">${subtitle}</p>` : ""}
      </div>
    `;
  }

  /**
   * Handle retry action (override in subclasses)
   */
  _handleRetry() {
    this.clearError();
    // Override in subclasses to implement retry logic
  }

  /**
   * Base render method - override in subclasses
   */
  render() {
    return html`
      <div class="${this.getContainerClasses()}" style=${this.maxWidth ? `max-width: ${this.maxWidth}` : ""}>
        ${this.renderPageHeader()}
        
        ${this.loading ? this.renderLoading() : ""}
        
        ${this.error ? this.renderError(this.error, true) : ""}
        
        ${!this.loading && !this.error ? this.renderContent() : ""}
      </div>
    `;
  }

  /**
   * Render main content - implement in subclasses
   */
  renderContent() {
    return html`<div>Override renderContent() in your page component</div>`;
  }
}

export default BasePageComponent;