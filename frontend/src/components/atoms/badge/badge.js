import { LitElement, html, css } from "lit";
import { baseStyles } from "../../styles/base.js";

/**
 * Badge component for displaying status, labels, or counts
 * @element neo-badge
 *
 * @prop {string} variant - The variant style of the badge
 * @prop {string} size - The size of the badge
 * @prop {boolean} rounded - Whether the badge has fully rounded corners
 * @prop {boolean} outlined - Whether the badge has an outlined style
 */
export class NeoBadge extends LitElement {
  static properties = {
    variant: { type: String, reflect: true },
    size: { type: String, reflect: true },
    rounded: { type: Boolean, reflect: true },
    outlined: { type: Boolean, reflect: true },
  };

  static styles = [
    baseStyles,
    css`
      :host {
        display: inline-flex;
      }

      .badge {
        display: inline-flex;
        align-items: center;
        gap: var(--spacing-xs);
        padding: var(--badge-padding, 0.25rem 0.75rem);
        border-radius: var(--badge-radius, var(--radius-sm));
        font-size: var(--badge-font-size, var(--font-size-sm));
        font-weight: var(--font-weight-medium);
        line-height: 1.4;
        transition: all var(--transition-fast);
      }

      /* Sizes */
      .size-sm {
        padding: 0.125rem 0.5rem;
        font-size: var(--font-size-xs);
      }

      .size-md {
        padding: 0.25rem 0.75rem;
        font-size: var(--font-size-sm);
      }

      .size-lg {
        padding: 0.375rem 1rem;
        font-size: var(--font-size-base);
      }

      /* Variants */
      .variant-default {
        background: var(--color-gray-100);
        color: var(--color-gray-700);
      }

      .variant-primary {
        background: var(--color-primary);
        color: white;
      }

      .variant-secondary {
        background: var(--color-secondary);
        color: white;
      }

      .variant-success {
        background: var(--color-success);
        color: white;
      }

      .variant-error {
        background: var(--color-error);
        color: white;
      }

      .variant-warning {
        background: var(--color-warning);
        color: var(--color-gray-900);
      }

      .variant-info {
        background: var(--color-info);
        color: white;
      }

      /* Rounded */
      .rounded {
        border-radius: 9999px;
      }

      /* Outlined */
      .outlined {
        background: transparent;
        border: 1px solid currentColor;
      }

      .outlined.variant-default {
        color: var(--color-gray-600);
      }

      .outlined.variant-primary {
        color: var(--color-primary);
      }

      .outlined.variant-secondary {
        color: var(--color-secondary);
      }

      .outlined.variant-success {
        color: var(--color-success);
      }

      .outlined.variant-error {
        color: var(--color-error);
      }

      .outlined.variant-warning {
        color: var(--color-warning);
      }

      .outlined.variant-info {
        color: var(--color-info);
      }

      /* Slots */
      ::slotted([slot="prefix"]) {
        margin-right: calc(var(--spacing-xs) * -1);
      }

      ::slotted([slot="suffix"]) {
        margin-left: calc(var(--spacing-xs) * -1);
      }

      /* Custom Colors */
      :host([style*="--badge-bg-color"]) .badge:not(.outlined) {
        background: var(--badge-bg-color);
      }

      :host([style*="--badge-text-color"]) .badge {
        color: var(--badge-text-color);
      }
    `,
  ];

  constructor() {
    super();
    this.variant = "default";
    this.size = "md";
    this.rounded = false;
    this.outlined = false;
  }

  render() {
    const classes = {
      badge: true,
      [`variant-${this.variant}`]: true,
      [`size-${this.size}`]: true,
      rounded: this.rounded,
      outlined: this.outlined,
    };

    return html`
      <span
        class="${Object.entries(classes)
          .filter(([, value]) => value)
          .map(([key]) => key)
          .join(" ")}"
      >
        <slot name="prefix"></slot>
        <slot></slot>
        <slot name="suffix"></slot>
      </span>
    `;
  }
}

customElements.define("neo-badge", NeoBadge);
