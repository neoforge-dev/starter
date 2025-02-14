import { LitElement, html, css } from "lit";
import { classMap } from "lit/directives/class-map.js";

export class NeoBadge extends LitElement {
  static properties = {
    variant: { type: String },
    size: { type: String },
    rounded: { type: Boolean },
    outlined: { type: Boolean },
    icon: { type: String },
    removable: { type: Boolean },
  };

  static styles = css`
    :host {
      display: inline-flex;
      align-items: center;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: var(--spacing-xs);
      padding: var(--spacing-xs) var(--spacing-sm);
      border-radius: var(--radius-sm);
      font-family: var(--font-family-primary);
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      line-height: 1;
      transition: all 0.2s ease-in-out;
    }

    .badge.rounded {
      border-radius: 9999px;
    }

    .badge.outlined {
      background: transparent;
      border: 1px solid currentColor;
    }

    /* Variants */
    .variant-default {
      background: var(--color-surface);
      color: var(--color-text);
    }

    .variant-primary {
      background: var(--color-primary);
      color: var(--color-white);
    }

    .variant-success {
      background: var(--color-success);
      color: var(--color-white);
    }

    .variant-warning {
      background: var(--color-warning);
      color: var(--color-text);
    }

    .variant-error {
      background: var(--color-error);
      color: var(--color-white);
    }

    .variant-info {
      background: var(--color-info);
      color: var(--color-white);
    }

    /* Outlined variants */
    .variant-default.outlined {
      color: var(--color-text);
    }

    .variant-primary.outlined {
      color: var(--color-primary);
    }

    .variant-success.outlined {
      color: var(--color-success);
    }

    .variant-warning.outlined {
      color: var(--color-warning);
    }

    .variant-error.outlined {
      color: var(--color-error);
    }

    .variant-info.outlined {
      color: var(--color-info);
    }

    /* Sizes */
    .size-small {
      padding: calc(var(--spacing-xs) / 2) var(--spacing-xs);
      font-size: var(--font-size-xs);
    }

    .size-medium {
      padding: var(--spacing-xs) var(--spacing-sm);
      font-size: var(--font-size-sm);
    }

    .size-large {
      padding: var(--spacing-sm) var(--spacing-md);
      font-size: var(--font-size-md);
    }

    /* Close button */
    .close-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 2px;
      margin-left: var(--spacing-xs);
      border: none;
      background: none;
      color: currentColor;
      cursor: pointer;
      opacity: 0.7;
      transition: opacity 0.2s ease-in-out;
    }

    .close-button:hover {
      opacity: 1;
    }

    /* Truncate long content */
    .truncate {
      max-width: 200px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  `;

  constructor() {
    super();
    this.variant = "default";
    this.size = "medium";
    this.rounded = false;
    this.outlined = false;
    this.removable = false;
  }

  render() {
    const classes = {
      badge: true,
      [`variant-${this.variant}`]: true,
      [`size-${this.size}`]: true,
      rounded: this.rounded,
      outlined: this.outlined,
      truncate: true,
    };

    return html`
      <span class=${classMap(classes)} role="status" title=${this.textContent}>
        ${this.icon ? html`<neo-icon name=${this.icon}></neo-icon>` : null}
        <slot></slot>
        ${this.removable
          ? html`
              <button
                class="close-button"
                aria-label="Remove"
                @click=${this._handleRemove}
              >
                <neo-icon name="close" size="small"></neo-icon>
              </button>
            `
          : null}
      </span>
    `;
  }

  _handleRemove(e) {
    e.stopPropagation();
    this.dispatchEvent(
      new CustomEvent("remove", {
        bubbles: true,
        composed: true,
      })
    );
  }
}

customElements.define("neo-badge", NeoBadge);
