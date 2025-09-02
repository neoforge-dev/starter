import { html, css } from "lit";
import { baseStyles } from "../../styles/base.js";
import { BaseComponent } from "../../base-component.js";
import "../../atoms/icon/icon.js";

/**
 * Badge component for displaying status, labels, or counts
 * @element neo-badge
 *
 * @prop {string} variant - The variant style of the badge
 * @prop {string} size - The size of the badge (xs, sm, md, lg, xl)
 *
 * @fires neo-badge-remove - Fired when the badge is removed
 * @prop {string} icon - Optional icon name to display before the content
 * @prop {boolean} removable - Whether the badge can be removed
 * @prop {boolean} pill - Whether the badge has a pill shape
 * @prop {boolean} disabled - Whether the badge is disabled
 * @prop {boolean} rounded - Whether the badge has fully rounded corners
 * @prop {boolean} outlined - Whether the badge has an outlined style
 */
export class NeoBadge extends BaseComponent {
  static properties = {
    variant: { type: String, reflect: true },
    size: { type: String, reflect: true },
    rounded: { type: Boolean, reflect: true },
    outlined: { type: Boolean, reflect: true },
    icon: { type: String, reflect: true },
    removable: { type: Boolean, reflect: true },
    title: { type: String, reflect: true },
    pill: { type: Boolean, reflect: true },
    disabled: { type: Boolean, reflect: true },
  };

  constructor() {
    super();
    this.variant = "default";
    this.size = "md";
    this.rounded = false;
    this.outlined = false;
    this.icon = null;
    this.removable = false;
    this.title = "Default";
    this.pill = false;
    this.disabled = false;
  }

  _handleRemove() {
    this.dispatchEvent(new CustomEvent("neo-badge-remove", { 
      bubbles: true,
      composed: true,
      detail: { badge: this }
    }));
  }

  // Override to prevent automatic reflection of properties to attributes
  // which can cause additional updates
  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      super.attributeChangedCallback(name, oldValue, newValue);
    }
  }

  render() {
    // Get the title from the slot content if not explicitly set
    if (this.title === "Default" && this.textContent.trim()) {
      this.title = this.textContent.trim();
    }

    return html`
      <div
        class="badge ${this.variant ? `variant-${this.variant}` : ""} ${this
          .size
          ? `size-${this.size}`
          : ""} ${this.rounded ? "rounded" : ""} ${this.outlined
          ? "outlined"
          : ""} ${this.pill ? "pill" : ""} ${this.disabled
          ? "disabled"
          : ""} truncate"
        title="${this.title}"
        role="status"
      >
        <slot name="prefix"></slot>
        ${this.icon ? html`<neo-icon name="${this.icon}"></neo-icon>` : ""}
        <slot></slot>
        <slot name="suffix"></slot>
        ${this.removable
          ? html`<button
              class="close-button"
              aria-label="Remove"
              @click="${this._handleRemove}"
            >
              <neo-icon name="close"></neo-icon>
            </button>`
          : ""}
      </div>
    `;
  }

  static get styles() {
    return [
      baseStyles,
      css`
        :host {
          display: inline-flex;
        }

        .badge {
          display: inline-flex;
          align-items: center;
          gap: var(--spacing-xs);
          padding: 0.25rem 0.75rem;
          border-radius: var(--radius-sm);
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-medium);
          line-height: 1.4;
          transition: all var(--transition-fast);
        }

        .truncate {
          max-width: 200px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .close-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          margin-left: var(--spacing-xs);
          background: none;
          border: none;
          cursor: pointer;
          color: inherit;
          opacity: 0.7;
          transition: opacity var(--transition-fast);
        }

        .close-button:hover {
          opacity: 1;
        }

        .close-button neo-icon {
          font-size: 0.85em;
        }

        /* Sizes */
        .size-xs {
          padding: 0.0625rem 0.375rem;
          font-size: var(--font-size-xs);
          line-height: 1.2;
        }

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

        .size-xl {
          padding: 0.5rem 1.25rem;
          font-size: var(--font-size-lg);
        }

        /* Pill shape */
        .pill {
          border-radius: 9999px;
        }

        /* Disabled state */
        .disabled {
          opacity: 0.6;
          cursor: not-allowed;
          pointer-events: none;
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

      `,
    ];
  }
}

// Register the component
if (!customElements.get("neo-badge")) {
  customElements.define("neo-badge", NeoBadge);
}
