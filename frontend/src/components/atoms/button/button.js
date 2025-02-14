import { LitElement, html, css } from "lit";
import { classMap } from "lit/directives/class-map.js";

export class NeoButton extends LitElement {
  static properties = {
    variant: { type: String },
    size: { type: String },
    disabled: { type: Boolean },
    loading: { type: Boolean },
    type: { type: String },
  };

  static styles = css`
    :host {
      display: inline-block;
    }

    button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--spacing-xs);
      border: none;
      border-radius: var(--radius-md);
      cursor: pointer;
      font-family: var(--font-family-primary);
      font-weight: var(--font-weight-medium);
      transition: all 0.2s ease-in-out;
      position: relative;
      overflow: hidden;
    }

    button:focus {
      outline: none;
      box-shadow: 0 0 0 3px var(--color-primary-alpha);
    }

    button:disabled {
      cursor: not-allowed;
      opacity: 0.6;
    }

    /* Variants */
    .variant-primary {
      background: var(--color-primary);
      color: var(--color-white);
    }

    .variant-primary:hover:not(:disabled) {
      background: var(--color-primary-dark);
    }

    .variant-secondary {
      background: var(--color-secondary);
      color: var(--color-white);
    }

    .variant-secondary:hover:not(:disabled) {
      background: var(--color-secondary-dark);
    }

    .variant-text {
      background: transparent;
      color: var(--color-primary);
      padding: 0;
    }

    .variant-text:hover:not(:disabled) {
      color: var(--color-primary-dark);
      text-decoration: underline;
    }

    .variant-icon {
      background: transparent;
      color: var(--color-text);
      padding: var(--spacing-xs);
      border-radius: 50%;
    }

    .variant-icon:hover:not(:disabled) {
      background: var(--color-surface-hover);
    }

    /* Sizes */
    .size-small {
      padding: var(--spacing-xs) var(--spacing-sm);
      font-size: var(--font-size-sm);
    }

    .size-medium {
      padding: var(--spacing-sm) var(--spacing-md);
      font-size: var(--font-size-md);
    }

    .size-large {
      padding: var(--spacing-md) var(--spacing-lg);
      font-size: var(--font-size-lg);
    }

    /* Loading state */
    .loading {
      color: transparent !important;
    }

    .loading neo-spinner {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }

    /* Slots */
    ::slotted([slot="prefix"]) {
      margin-right: var(--spacing-xs);
    }

    ::slotted([slot="suffix"]) {
      margin-left: var(--spacing-xs);
    }
  `;

  constructor() {
    super();
    this.variant = "primary";
    this.size = "medium";
    this.disabled = false;
    this.loading = false;
    this.type = "button";
  }

  render() {
    const classes = {
      [`variant-${this.variant}`]: true,
      [`size-${this.size}`]: true,
      loading: this.loading,
    };

    return html`
      <button
        class=${classMap(classes)}
        ?disabled=${this.disabled || this.loading}
        type=${this.type}
        role="button"
        aria-disabled=${this.disabled || this.loading}
        aria-busy=${this.loading}
        @click=${this._handleClick}
      >
        <slot name="prefix"></slot>
        <slot></slot>
        <slot name="suffix"></slot>
        ${this.loading
          ? html`
              <neo-spinner
                size="small"
                variant=${this.variant === "text" || this.variant === "icon"
                  ? "primary"
                  : "light"}
              ></neo-spinner>
            `
          : null}
      </button>
    `;
  }

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
}

customElements.define("neo-button", NeoButton);
