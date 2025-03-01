import {  LitElement, html  } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";

/**
 * Card component for content organization
 * @element neo-card
 *
 * @prop {string} variant - Card variant (default, outline, elevated)
 * @prop {boolean} hoverable - Enable hover effects
 * @prop {boolean} clickable - Make entire card clickable
 * @prop {string} href - Link URL if card is clickable
 *
 * @slot - Default slot for card content
 * @slot header - Card header content
 * @slot media - Card media content (images, videos)
 * @slot footer - Card footer content
 * @slot actions - Card action buttons
 *
 * @fires click - When card is clicked (if clickable)
 */
export class Card extends LitElement {
  static properties = {
    variant: { type: String, reflect: true },
    hoverable: { type: Boolean, reflect: true },
    clickable: { type: Boolean, reflect: true },
    href: { type: String },
    _hasHeader: { type: Boolean, state: true },
    _hasMedia: { type: Boolean, state: true },
    _hasFooter: { type: Boolean, state: true },
    _hasActions: { type: Boolean, state: true },
  };

  constructor() {
    super();
    this.variant = "default";
    this.hoverable = false;
    this.clickable = false;
    this.href = "";
    this._hasHeader = false;
    this._hasMedia = false;
    this._hasFooter = false;
    this._hasActions = false;
  }

  firstUpdated() {
    this._checkSlots();
  }

  /**
   * Check which slots have content
   */
  _checkSlots() {
    const slots = this.shadowRoot.querySelectorAll("slot");
    slots.forEach((slot) => {
      const hasContent = slot.assignedNodes().length > 0;
      switch (slot.name) {
        case "header":
          this._hasHeader = hasContent;
          break;
        case "media":
          this._hasMedia = hasContent;
          break;
        case "footer":
          this._hasFooter = hasContent;
          break;
        case "actions":
          this._hasActions = hasContent;
          break;
      }
    });
  }

  /**
   * Handle card click
   * @param {Event} e
   */
  _handleClick(e) {
    if (!this.clickable) return;

    if (this.href) {
      window.location.href = this.href;
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
    const Tag = this.clickable ? "button" : "div";
    const cardContent = html`
      ${this._hasHeader
        ? html`
            <div class="card-header">
              <slot name="header"></slot>
            </div>
          `
        : null}
      ${this._hasMedia
        ? html`
            <div class="card-media">
              <slot name="media"></slot>
            </div>
          `
        : null}

      <div class="card-content">
        <slot></slot>
      </div>

      ${this._hasFooter
        ? html`
            <div class="card-footer">
              <slot name="footer"></slot>
            </div>
          `
        : null}
      ${this._hasActions
        ? html`
            <div class="card-actions">
              <slot name="actions"></slot>
            </div>
          `
        : null}
    `;

    return html`
      <${Tag}
        class="neo-card"
        data-variant=${this.variant}
        data-hoverable=${this.hoverable}
        data-clickable=${this.clickable}
        @click=${this._handleClick}
        role=${this.clickable ? "button" : "article"}
        tabindex=${this.clickable ? "0" : "-1"}
      >
        ${cardContent}
      </${Tag}>
    `;
  }

  /**
   * Define styles in a separate CSS file
   */
  static styles = [];
}

customElements.define("neo-card", Card);
