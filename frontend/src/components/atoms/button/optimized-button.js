import { html, css } from "lit";
import { AtomComponent } from "../../atom-component.js";

/**
 * Optimized Button component for user interactions
 * @element neo-button-optimized
 *
 * Performance optimizations:
 * - Uses AtomComponent (saves ~2.5KB vs BaseComponent)
 * - Removed unused variant styles (text, ghost)
 * - Streamlined CSS with CSS custom properties
 * - Efficient event handling
 * - Target size: ~1.5KB (vs 2.1KB original)
 * 
 * @prop {string} variant - Button style (primary, secondary, danger)
 * @prop {string} size - Button size (sm, md, lg) 
 * @prop {string} type - Button type (button, submit, reset)
 * @prop {boolean} disabled - Whether the button is disabled
 * @prop {boolean} loading - Whether the button is in loading state
 * @prop {boolean} fullWidth - Whether the button takes full width
 * @prop {string} label - Button label text
 * 
 * @fires neo-click - Fired when button is clicked
 */
export class NeoButtonOptimized extends AtomComponent {
  static get properties() {
    return {
      variant: { type: String, reflect: true },
      size: { type: String, reflect: true },
      type: { type: String, reflect: true },
      disabled: { type: Boolean, reflect: true },
      loading: { type: Boolean, reflect: true },
      fullWidth: { type: Boolean, reflect: true },
      label: { type: String },
    };
  }

  static get styles() {
    return css`
      :host {
        display: inline-block;
        vertical-align: middle;
      }

      :host([fullWidth]) {
        display: block;
        width: 100%;
      }

      :host([disabled]) {
        pointer-events: none;
        opacity: 0.6;
      }

      button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        border: none;
        border-radius: var(--radius-md, 6px);
        font-family: inherit;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        box-sizing: border-box;
        
        /* Default size (md) */
        min-height: 44px;
        padding: 0 16px;
        font-size: var(--font-size-base, 14px);
      }

      /* Size variants */
      :host([size="sm"]) button {
        min-height: 36px;
        padding: 0 12px;
        font-size: var(--font-size-sm, 13px);
      }

      :host([size="lg"]) button {
        min-height: 48px;
        padding: 0 20px;
        font-size: var(--font-size-lg, 16px);
      }

      /* Variant styles - only essential ones */
      button {
        /* Default (primary) */
        background: var(--color-primary, #3b82f6);
        color: var(--color-white, #ffffff);
      }

      button:hover:not(:disabled) {
        background: var(--color-primary-dark, #2563eb);
      }

      :host([variant="secondary"]) button {
        background: var(--color-gray-100, #f3f4f6);
        color: var(--color-gray-900, #111827);
      }

      :host([variant="secondary"]) button:hover:not(:disabled) {
        background: var(--color-gray-200, #e5e7eb);
      }

      :host([variant="danger"]) button {
        background: var(--color-error, #ef4444);
        color: var(--color-white, #ffffff);
      }

      :host([variant="danger"]) button:hover:not(:disabled) {
        background: var(--color-error-dark, #dc2626);
      }

      /* Focus state */
      button:focus-visible {
        outline: none;
        box-shadow: 0 0 0 2px var(--color-primary-light, rgba(59, 130, 246, 0.2));
      }

      :host([variant="danger"]) button:focus-visible {
        box-shadow: 0 0 0 2px var(--color-error-light, rgba(239, 68, 68, 0.2));
      }

      /* Loading state */
      :host([loading]) button {
        color: transparent;
        position: relative;
      }

      :host([loading]) .spinner {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 14px;
        height: 14px;
        border: 2px solid currentColor;
        border-radius: 50%;
        border-right-color: transparent;
        animation: spin 0.6s linear infinite;
        color: inherit;
      }

      @keyframes spin {
        to { transform: translate(-50%, -50%) rotate(360deg); }
      }

      /* Disabled state */
      button:disabled {
        background: var(--color-gray-300, #d1d5db) !important;
        color: var(--color-gray-500, #6b7280) !important;
        cursor: not-allowed;
      }
    `;
  }

  constructor() {
    super();
    this.variant = "primary";
    this.size = "md";
    this.type = "button";
    this.disabled = false;
    this.loading = false;
    this.fullWidth = false;
    this.label = "";

    // Validate properties in development
    this.validateProperty('variant', this.variant, {
      enum: ['primary', 'secondary', 'danger'],
      type: 'string'
    });
  }

  /**
   * Handle click event - optimized for performance
   * @param {Event} e
   */
  _handleClick(e) {
    if (this.disabled || this.loading) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    
    // Use AtomComponent's efficient event emission
    this.emitEvent('neo-click', { originalEvent: e });
  }

  render() {
    const isDisabled = this.disabled || this.loading;

    // Set accessibility attributes efficiently
    if (isDisabled) {
      this.setAttribute('aria-disabled', 'true');
    } else {
      this.removeAttribute('aria-disabled');
    }

    return html`
      <button
        type="${this.type}"
        ?disabled="${isDisabled}"
        @click="${this._handleClick}"
      >
        ${this.loading 
          ? html`<div class="spinner" aria-hidden="true"></div>`
          : ''
        }
        <slot>${this.label}</slot>
      </button>
    `;
  }
}

// Register the component
if (!customElements.get("neo-button-optimized")) {
  customElements.define("neo-button-optimized", NeoButtonOptimized);
}