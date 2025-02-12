import { LitElement, html, css } from "/vendor/lit-core.min.js";
import { Loading } from "../../mixins/loading.js";
import { baseStyles } from "../../styles/base.js";

/**
 * Button component with multiple variants and states
 * @element neo-button
 *
 * @prop {string} variant - Button variant (primary, secondary, outline, text)
 * @prop {string} size - Button size (sm, md, lg)
 * @prop {boolean} loading - Loading state
 * @prop {boolean} disabled - Disabled state
 * @prop {boolean} fullWidth - Full width button
 * @prop {string} type - Button type (button, submit, reset)
 *
 * @fires click - Native click event
 */
export class Button extends Loading(LitElement) {
  static properties = {
    variant: { type: String, reflect: true },
    size: { type: String, reflect: true },
    disabled: { type: Boolean, reflect: true },
    fullWidth: { type: Boolean, reflect: true },
    type: { type: String, reflect: true },
    icon: { type: String },
    iconPosition: { type: String },
  };

  static styles = [
    baseStyles,
    css`
      :host {
        display: inline-block;
      }

      button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: var(--spacing-sm);
        padding: var(--spacing-sm) var(--spacing-lg);
        border: none;
        border-radius: var(--radius-md);
        font-weight: var(--font-weight-medium);
        cursor: pointer;
        transition: all var(--transition-fast);
      }

      /* Variants */
      button.primary {
        background: var(--primary-color);
        color: white;
      }

      button.primary:hover {
        background: var(--primary-dark);
      }

      button.secondary {
        background: var(--surface-color);
        border: 1px solid var(--border-color);
        color: var(--text-color);
      }

      button.secondary:hover {
        background: var(--border-color);
      }

      /* Sizes */
      button.small {
        padding: var(--spacing-xs) var(--spacing-md);
        font-size: var(--font-size-sm);
      }

      button.large {
        padding: var(--spacing-md) var(--spacing-xl);
        font-size: var(--font-size-lg);
      }

      /* States */
      button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .loading-spinner {
        width: 16px;
        height: 16px;
        border: 2px solid currentColor;
        border-right-color: transparent;
        border-radius: 50%;
        animation: spin 0.75s linear infinite;
      }

      @keyframes spin {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
      }
    `,
  ];

  constructor() {
    super();
    this.variant = "primary";
    this.size = "md";
    this.disabled = false;
    this.fullWidth = false;
    this.type = "button";
    this.icon = "";
    this.iconPosition = "left";
    this.loadingType = "dots";
  }

  /**
   * Handle click event
   * @param {Event} e
   */
  _handleClick(e) {
    if (this.disabled || this.loading) {
      e.preventDefault();
      return;
    }
    this.dispatchEvent(
      new CustomEvent("click", {
        bubbles: true,
        composed: true,
        detail: { originalEvent: e },
      })
    );
  }

  /**
   * Render icon
   * @returns {import('lit').TemplateResult}
   */
  _renderIcon() {
    if (!this.icon) return null;
    return html`<span class="button-icon" data-position=${this.iconPosition}
      >${this.icon}</span
    >`;
  }

  render() {
    return html`
      <button
        class="${this.variant} ${this.size}"
        type=${this.type}
        ?disabled=${this.disabled || this.loading}
        data-full-width=${this.fullWidth}
        @click=${this._handleClick}
      >
        ${this.iconPosition === "left" ? this._renderIcon() : ""}
        ${this.loading ? this.renderLoading() : html`<slot></slot>`}
        ${this.iconPosition === "right" ? this._renderIcon() : ""}
      </button>
    `;
  }
}

customElements.define("neo-button", Button);
