import { LitElement, html, css } from "lit";
import { baseStyles } from "../../styles/base.js";

/**
 * Button component for user interactions
 * @element neo-button
 *
 * @prop {string} variant - The variant style of the button (primary, secondary, tertiary, danger, ghost)
 * @prop {string} size - The size of the button (sm, md, lg)
 * @prop {string} type - The type of the button (button, submit, reset)
 * @prop {boolean} disabled - Whether the button is disabled
 * @prop {boolean} loading - Whether the button is in a loading state
 * @prop {boolean} fullWidth - Whether the button should take full width
 */
export class NeoButton extends LitElement {
  static properties = {
    variant: { type: String, reflect: true },
    size: { type: String, reflect: true },
    type: { type: String, reflect: true },
    disabled: { type: Boolean, reflect: true },
    loading: { type: Boolean, reflect: true },
    fullWidth: { type: Boolean, reflect: true },
  };

  static styles = [
    baseStyles,
    css`
      :host {
        display: inline-block;
        vertical-align: middle;
      }

      :host([fullWidth]) {
        display: block;
        width: 100%;
      }

      button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: var(--spacing-xs);
        width: 100%;
        border: none;
        border-radius: var(--radius-md);
        font-family: var(--font-family);
        font-weight: var(--font-weight-medium);
        cursor: pointer;
        transition: all var(--transition-fast);
      }

      /* Sizes */
      .size-sm {
        height: 32px;
        padding: 0 var(--spacing-sm);
        font-size: var(--font-size-sm);
      }

      .size-md {
        height: 40px;
        padding: 0 var(--spacing-md);
        font-size: var(--font-size-base);
      }

      .size-lg {
        height: 48px;
        padding: 0 var(--spacing-lg);
        font-size: var(--font-size-lg);
      }

      /* Variants */
      .variant-primary {
        background: var(--color-primary);
        color: white;
      }

      .variant-primary:hover {
        background: var(--color-primary-dark);
      }

      .variant-secondary {
        background: var(--color-secondary);
        color: white;
      }

      .variant-secondary:hover {
        background: var(--color-secondary-dark);
      }

      .variant-tertiary {
        background: transparent;
        color: var(--color-primary);
        box-shadow: inset 0 0 0 2px var(--color-primary);
      }

      .variant-tertiary:hover {
        background: var(--color-primary-light);
      }

      .variant-danger {
        background: var(--color-error);
        color: white;
      }

      .variant-danger:hover {
        background: var(--color-error-dark);
      }

      .variant-ghost {
        background: transparent;
        color: var(--color-text);
      }

      .variant-ghost:hover {
        background: var(--color-gray-100);
      }

      /* States */
      button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      button:focus {
        outline: none;
        box-shadow: 0 0 0 3px var(--color-primary-light);
      }

      .variant-danger:focus {
        box-shadow: 0 0 0 3px var(--color-error-light);
      }

      /* Loading State */
      .loading {
        position: relative;
        color: transparent !important;
      }

      .spinner {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 16px;
        height: 16px;
        border: 2px solid currentColor;
        border-radius: 50%;
        border-right-color: transparent;
        animation: spin 0.75s linear infinite;
      }

      @keyframes spin {
        from {
          transform: translate(-50%, -50%) rotate(0deg);
        }
        to {
          transform: translate(-50%, -50%) rotate(360deg);
        }
      }

      /* Slots */
      ::slotted([slot="prefix"]) {
        margin-right: calc(var(--spacing-xs) * -1);
      }

      ::slotted([slot="suffix"]) {
        margin-left: calc(var(--spacing-xs) * -1);
      }
    `,
  ];

  constructor() {
    super();
    this.variant = "primary";
    this.size = "md";
    this.type = "button";
    this.disabled = false;
    this.loading = false;
    this.fullWidth = false;
  }

  /**
   * Handle click event
   * @param {Event} e
   */
  _handleClick(e) {
    if (!this.disabled && !this.loading) {
      this.dispatchEvent(
        new CustomEvent("click", {
          bubbles: true,
          composed: true,
          detail: { originalEvent: e },
        })
      );
    }
  }

  render() {
    const classes = {
      [`variant-${this.variant}`]: true,
      [`size-${this.size}`]: true,
      loading: this.loading,
      "full-width": this.fullWidth,
    };

    return html`
      <button
        type="${this.type}"
        class="${Object.entries(classes)
          .filter(([, value]) => value)
          .map(([key]) => key)
          .join(" ")}"
        ?disabled="${this.disabled || this.loading}"
        aria-disabled="${this.disabled || this.loading}"
        aria-busy="${this.loading}"
        @click=${this._handleClick}
      >
        <slot name="prefix"></slot>
        <slot></slot>
        <slot name="suffix"></slot>
        ${this.loading ? html`<div class="spinner"></div>` : ""}
      </button>
    `;
  }
}

customElements.define("neo-button", NeoButton);
