import {   LitElement, html, css   } from 'lit';
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
 */
export class NeoCard extends LitElement {
  static get properties() {
    return {
      variant: { type: String },
      padding: { type: String },
      hoverable: { type: Boolean },
      clickable: { type: Boolean },
      href: { type: String },
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

        /* Padding */
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
          >
            ${content}
          </a>
        `
      : html`
          <div
            class=${cardClasses.trim()}
            role="article"
            tabindex=${this.clickable ? "0" : "-1"}
          >
            ${content}
          </div>
        `;
  }
}

if (!customElements.get("neo-card")) {
  customElements.define("neo-card", NeoCard);
}
