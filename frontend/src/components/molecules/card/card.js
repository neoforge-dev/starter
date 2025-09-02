import { html, css } from 'lit';
import { BaseComponent } from "../../base-component.js";
import { baseStyles } from "../../styles/base.js";

/**
 * Card component for displaying content in a contained area
 * @element neo-card
 *
 * @prop {string} variant - Visual style (default, outlined, elevated)
 * @prop {string} padding - Padding size (none, sm, md, lg)
 * @prop {boolean} hoverable - Whether to show hover effects
 * @prop {boolean} clickable - Whether the card is clickable
 * @prop {string} href - URL for clickable cards
 * @prop {string} size - Card size affects padding and spacing (xs, sm, md, lg, xl)
 *
 * @fires neo-card-click - Fired when clickable card is clicked
 */
export class NeoCard extends BaseComponent {
  static get properties() {
    return {
      variant: { type: String },
      padding: { type: String },
      hoverable: { type: Boolean },
      clickable: { type: Boolean },
      href: { type: String },
      size: { type: String, reflect: true },
    };
  }

  static get styles() {
    return [
      baseStyles,
      css`
        :host {
          display: block;
        }

        .card {
          position: relative;
          background-color: var(--color-surface);
          border-radius: var(--radius-lg);
          transition: all 0.2s ease-in-out;
        }

        /* Variants */
        .card.default {
          background-color: var(--color-surface);
          box-shadow: var(--shadow-sm);
        }

        .card.outlined {
          background-color: transparent;
          border: 1px solid var(--color-border);
        }

        .card.elevated {
          background-color: var(--color-surface);
          box-shadow: var(--shadow-md);
        }

        /* Padding - Legacy support */
        .card.padding-none {
          padding: 0;
        }

        .card.padding-sm {
          padding: 12px;
        }

        .card.padding-md {
          padding: 16px;
        }

        .card.padding-lg {
          padding: 24px;
        }

        /* Size variations */
        :host([size="xs"]) .card {
          padding: 8px;
          border-radius: var(--radius-sm);
        }

        :host([size="sm"]) .card {
          padding: 12px;
          border-radius: var(--radius-sm);
        }

        :host([size="md"]) .card {
          padding: 16px;
          border-radius: var(--radius-md);
        }

        :host([size="lg"]) .card {
          padding: 24px;
          border-radius: var(--radius-lg);
        }

        :host([size="xl"]) .card {
          padding: 32px;
          border-radius: var(--radius-xl);
        }

        /* Hover effects */
        .card.hoverable:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-lg);
        }

        /* Clickable */
        .card.clickable {
          cursor: pointer;
          color: inherit;
          text-decoration: none;
        }

        .card.clickable:focus {
          outline: none;
          box-shadow: 0 0 0 2px var(--color-primary);
        }

        /* Slots */
        ::slotted([slot="header"]) {
          margin-bottom: 16px;
        }

        ::slotted([slot="footer"]) {
          margin-top: 16px;
        }

        /* Media */
        ::slotted([slot="media"]) {
          margin: -16px -16px 16px -16px;
          border-radius: var(--radius-lg) var(--radius-lg) 0 0;
          overflow: hidden;
        }

        ::slotted(img[slot="media"]) {
          display: block;
          width: 100%;
          height: auto;
        }
      `,
    ];
  }

  constructor() {
    super();
    this.variant = "default";
    this.padding = "md";
    this.hoverable = false;
    this.clickable = false;
    this.href = "";
    this.size = "md";
  }

  _handleClick(e) {
    if (this.clickable) {
      this.dispatchEvent(new CustomEvent('neo-card-click', {
        bubbles: true,
        composed: true,
        detail: { originalEvent: e, card: this }
      }));
    }
  }

  render() {
    const cardClasses = `
      card
      ${this.variant}
      padding-${this.padding}
      ${this.hoverable ? "hoverable" : ""}
      ${this.clickable ? "clickable" : ""}
    `;

    const content = html`
      <slot name="media"></slot>
      <slot name="header"></slot>
      <slot></slot>
      <slot name="footer"></slot>
    `;

    return this.clickable && this.href
      ? html`
          <a
            class=${cardClasses.trim()}
            href=${this.href}
            role="article"
            tabindex="0"
            @click="${this._handleClick}"
          >
            ${content}
          </a>
        `
      : html`
          <div
            class=${cardClasses.trim()}
            role="article"
            tabindex=${this.clickable ? "0" : "-1"}
            @click="${this.clickable ? this._handleClick : null}"
          >
            ${content}
          </div>
        `;
  }
}

if (!customElements.get("neo-card")) {
  customElements.define("neo-card", NeoCard);
}
