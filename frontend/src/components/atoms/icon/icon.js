import {
  LitElement,
  html,
  css,
 } from "lit";
import { baseStyles } from "../../styles/base.js";
import { icons } from "./icons.js";

/**
 * Icon component for displaying SVG icons
 * @element neo-icon
 *
 * @prop {string} name - Name of the icon to display
 * @prop {string} size - Size of the icon (sm, md, lg, xl)
 * @prop {string} color - Color variant of the icon
 * @prop {string} customSize - Custom size in px or rem
 * @prop {string} label - Accessible label for the icon
 * @prop {boolean} decorative - Whether the icon is decorative only
 * @prop {boolean} loading - Whether to show loading animation
 */
export class NeoIcon extends LitElement {
  static get properties() {
    return {
      name: { type: String, reflect: true },
      size: { type: String, reflect: true },
      color: { type: String, reflect: true },
      customSize: { type: String },
      label: { type: String },
      decorative: { type: Boolean, reflect: true },
      loading: { type: Boolean, reflect: true },
    };
  }

  static get styles() {
    return [
      baseStyles,
      css`
        :host {
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        svg {
          display: block;
          transition: all var(--transition-fast);
        }

        /* Sizes */
        .size-sm {
          width: var(--icon-size-sm, 16px);
          height: var(--icon-size-sm, 16px);
        }

        .size-md {
          width: var(--icon-size-md, 24px);
          height: var(--icon-size-md, 24px);
        }

        .size-lg {
          width: var(--icon-size-lg, 32px);
          height: var(--icon-size-lg, 32px);
        }

        .size-xl {
          width: var(--icon-size-xl, 48px);
          height: var(--icon-size-xl, 48px);
        }

        /* Colors */
        .color-primary {
          fill: var(--color-primary);
        }

        .color-secondary {
          fill: var(--color-secondary);
        }

        .color-success {
          fill: var(--color-success);
        }

        .color-error {
          fill: var(--color-error);
        }

        .color-warning {
          fill: var(--color-warning);
        }

        /* Loading Animation */
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .loading {
          animation: spin 1s linear infinite;
        }
      `,
    ];
  }

  constructor() {
    super();
    this.size = "md";
  }

  _getIcon() {
    const icon = icons[this.name];
    if (!icon) {
      console.warn(`Icon "${this.name}" not found`);
      return html`<!-- Icon not found -->`;
    }
    return icon;
  }

  render() {
    const classes = {
      [`size-${this.size}`]: !this.customSize && this.size,
      [`color-${this.color}`]: this.color,
      loading: this.loading,
    };

    const style = this.customSize
      ? { width: this.customSize, height: this.customSize }
      : {};

    return html`
      <svg
        class="${Object.entries(classes)
          .filter(([, value]) => value)
          .map(([key]) => key)
          .join(" ")}"
        style="${Object.entries(style)
          .map(([key, value]) => `${key}: ${value}`)
          .join(";")}"
        viewBox="0 0 24 24"
        fill="currentColor"
        role="${this.decorative ? undefined : "img"}"
        aria-hidden="${this.decorative ? "true" : undefined}"
        aria-label="${this.decorative ? undefined : this.label || this.name}"
      >
        ${this._getIcon()}
      </svg>
    `;
  }
}

if (!customElements.get("neo-icon")) {
  customElements.define("neo-icon", NeoIcon);
}
