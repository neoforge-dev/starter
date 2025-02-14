import { LitElement, html, css } from "lit";
import { baseStyles } from "../../styles/base.js";

/**
 * Button component with multiple variants and states
 * @element neo-button
 *
 * @prop {string} variant - Button variant (primary, secondary, text)
 * @prop {string} size - Button size (sm, md, lg)
 * @prop {string} type - Button type (button, submit, reset)
 * @prop {boolean} disabled - Disabled state
 * @prop {boolean} loading - Loading state
 */
export class NeoButton extends LitElement {
  static properties = {
    variant: { type: String, reflect: true },
    size: { type: String, reflect: true },
    type: { type: String, reflect: true },
    disabled: { type: Boolean, reflect: true },
    loading: { type: Boolean, reflect: true },
  };

  static styles = [
    baseStyles,
    css`
      :host {
        display: inline-block;
      }

      button {
        font-family: var(--font-family);
        border: none;
        border-radius: var(--radius-md);
        cursor: pointer;
        font-weight: var(--font-weight-medium);
        transition: all var(--transition-fast);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: var(--spacing-xs);
        padding: var(--button-padding);
        height: var(--button-height);
      }

      button[disabled] {
        opacity: 0.5;
        cursor: not-allowed;
      }

      /* Variants */
      button.primary {
        background: var(--color-primary);
        color: white;
      }

      button.primary:hover:not([disabled]) {
        background: var(--color-primary-dark);
      }

      button.secondary {
        background: var(--color-secondary);
        color: white;
      }

      button.text {
        background: transparent;
        color: var(--color-text);
        padding: var(--spacing-xs) var(--spacing-sm);
      }

      button.text:hover:not([disabled]) {
        background: rgba(0, 0, 0, 0.05);
      }

      /* Sizes */
      button.sm {
        font-size: var(--font-size-xs);
        padding: var(--spacing-xs) var(--spacing-sm);
        height: 2rem;
      }

      button.md {
        font-size: var(--font-size-sm);
      }

      button.lg {
        font-size: var(--font-size-base);
        padding: var(--spacing-sm) var(--spacing-lg);
        height: 3rem;
      }

      /* Loading state */
      .loading-spinner {
        width: 1em;
        height: 1em;
        border: 2px solid currentColor;
        border-radius: 50%;
        border-right-color: transparent;
        animation: spin 0.6s linear infinite;
      }

      @keyframes spin {
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
    this.type = "button";
    this.disabled = false;
    this.loading = false;
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
    return html`
      <button
        class="${this.variant} ${this.size}"
        type="${this.type}"
        ?disabled=${this.disabled || this.loading}
        @click=${this._handleClick}
        aria-disabled="${this.disabled || this.loading}"
      >
        ${this.loading
          ? html`<span class="loading-spinner" aria-hidden="true"></span>`
          : html`<slot></slot>`}
      </button>
    `;
  }
}

customElements.define("neo-button", NeoButton);
