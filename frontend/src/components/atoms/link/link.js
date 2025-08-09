import {   LitElement, html, css   } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";
import { baseStyles } from "../../styles/base.js";

/**
 * Link component for navigation and actions
 * @element neo-link
 *
 * @prop {string} href - The URL that the link points to
 * @prop {string} variant - The variant style of the link (default, primary, secondary, subtle)
 * @prop {string} size - The size of the link (sm, md, lg)
 * @prop {string} underline - When to show the underline (none, hover, always)
 * @prop {boolean} disabled - Whether the link is disabled
 * @prop {boolean} external - Whether the link opens in a new tab
 */
export class NeoLink extends LitElement {
  static properties = {
    href: { type: String, reflect: true },
    variant: { type: String, reflect: true },
    size: { type: String, reflect: true },
    underline: { type: String, reflect: true },
    disabled: { type: Boolean, reflect: true },
    external: { type: Boolean, reflect: true },
  };

  static styles = [
    baseStyles,
    css`
      :host {
        display: inline-block;
      }

      a {
        display: inline-flex;
        align-items: center;
        gap: var(--spacing-xs);
        text-decoration: none;
        font-family: var(--font-family);
        font-weight: var(--font-weight-medium);
        cursor: pointer;
        transition: all var(--transition-fast);
      }

      /* Sizes */
      .size-sm {
        font-size: var(--font-size-sm);
      }

      .size-md {
        font-size: var(--font-size-base);
      }

      .size-lg {
        font-size: var(--font-size-lg);
      }

      /* Variants */
      .variant-default {
        color: var(--color-text);
      }

      .variant-default:hover {
        color: var(--color-text-dark);
      }

      .variant-primary {
        color: var(--color-primary);
      }

      .variant-primary:hover {
        color: var(--color-primary-dark);
      }

      .variant-secondary {
        color: var(--color-secondary);
      }

      .variant-secondary:hover {
        color: var(--color-secondary-dark);
      }

      .variant-subtle {
        color: var(--color-text-light);
      }

      .variant-subtle:hover {
        color: var(--color-text);
      }

      /* Underline Variants */
      .underline-none {
        text-decoration: none;
      }

      .underline-hover:hover {
        text-decoration: underline;
      }

      .underline-always {
        text-decoration: underline;
      }

      /* States */
      .disabled {
        opacity: 0.5;
        cursor: not-allowed;
        pointer-events: none;
      }

      a:focus {
        outline: none;
        text-decoration: underline;
      }

      a:focus-visible {
        outline: 2px solid var(--color-primary);
        outline-offset: 2px;
        border-radius: 2px;
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
    this.variant = "default";
    this.size = "md";
    this.underline = "hover";
    this.disabled = false;
    this.external = false;
  }

  /**
   * Handle click event
   * @param {Event} e
   */
  _handleClick(e) {
    if (this.disabled) {
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

  render() {
    const classes = {
      [`variant-${this.variant}`]: true,
      [`size-${this.size}`]: true,
      [`underline-${this.underline}`]: true,
      disabled: this.disabled,
    };

    const externalAttrs = this.external
      ? {
          target: "_blank",
          rel: "noopener noreferrer",
        }
      : {};

    const ariaLabel = this.external
      ? `${this.textContent} (opens in new tab)`
      : undefined;

    return html`
      <a
        href="${this.disabled ? "#" : this.href}"
        class="${Object.entries(classes)
          .filter(([, value]) => value)
          .map(([key]) => key)
          .join(" ")}"
        aria-disabled="${this.disabled}"
        aria-label="${ariaLabel}"
        @click="${this._handleClick}"
        ${Object.entries(externalAttrs)
          .map(([key, value]) => `${key}="${value}"`)
          .join(" ")}
      >
        <slot name="prefix"></slot>
        <slot></slot>
        <slot name="suffix"></slot>
      </a>
    `;
  }
}

customElements.define("neo-link", NeoLink);
