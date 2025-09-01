import {
  LitElement,
  html,
  css,
 } from 'lit';

export class Rating extends LitElement {
  static properties = {
    value: { type: Number },
    max: { type: Number },
    size: { type: String },
    variant: { type: String },
    precision: { type: Number },
    readonly: { type: Boolean },
    disabled: { type: Boolean },
    showValue: { type: Boolean },
    label: { type: String },
    customIcons: { type: Object },
    _hoverValue: { type: Number, state: true },
  };

  static styles = css`
    :host {
      display: inline-flex;
      flex-direction: column;
      gap: 0.5rem;
      font-family: system-ui, sans-serif;
    }

    .rating-container {
      display: inline-flex;
      align-items: center;
      gap: 1rem;
    }

    .rating-label {
      font-size: 0.875rem;
      color: #4b5563;
      margin: 0;
    }

    .rating-value {
      font-size: 0.875rem;
      color: #6b7280;
      min-width: 2.5rem;
    }

    .rating-items {
      display: inline-flex;
      gap: 0.25rem;
    }

    .rating-item {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      position: relative;
      color: #d1d5db;
      transition:
        color 0.2s,
        transform 0.2s;
    }

    .rating-item:hover {
      transform: scale(1.1);
    }

    .rating-item.active {
      color: currentColor;
    }

    .rating-item.disabled {
      cursor: not-allowed;
      opacity: 0.5;
    }

    .rating-item.readonly {
      cursor: default;
    }

    /* Size Variants */
    .size-small {
      font-size: 1rem;
    }

    .size-medium {
      font-size: 1.5rem;
    }

    .size-large {
      font-size: 2rem;
    }

    /* Icon Variants */
    .variant-star {
      color: #fbbf24;
    }

    .variant-heart {
      color: #ec4899;
    }

    .variant-circle {
      color: #6366f1;
    }

    /* Half Rating */
    .rating-item-half {
      position: absolute;
      width: 50%;
      left: 0;
      overflow: hidden;
      color: currentColor;
      pointer-events: none;
    }

    /* Hover Effect */
    .rating-item:not(.disabled):not(.readonly):hover ~ .rating-item {
      color: #d1d5db !important;
    }

    .rating-items:hover .rating-item:not(.disabled):not(.readonly) {
      color: #d1d5db;
    }

    .rating-items:hover .rating-item:not(.disabled):not(.readonly):hover,
    .rating-items:hover
      .rating-item:not(.disabled):not(.readonly):hover
      ~ .rating-item {
      color: currentColor;
    }

    /* Responsive Design */
    @media (max-width: 640px) {
      .size-large {
        font-size: 1.5rem;
      }

      .size-medium {
        font-size: 1.25rem;
      }

      .size-small {
        font-size: 0.875rem;
      }
    }
  `;

  constructor() {
    super();
    this.value = 0;
    this.max = 5;
    this.size = "medium";
    this.variant = "star";
    this.precision = 1;
    this.readonly = false;
    this.disabled = false;
    this.showValue = false;
    this.label = "";
    this.customIcons = {
      empty: "☆",
      half: "★",
      filled: "★",
    };
    this._hoverValue = null;
  }

  _getIcon(type) {
    if (this.variant === "custom") {
      return this.customIcons[type];
    }

    switch (this.variant) {
      case "heart":
        return type === "empty" ? "♡" : "♥";
      case "circle":
        return type === "empty" ? "○" : "●";
      default: // star
        return type === "empty" ? "☆" : "★";
    }
  }

  _handleMouseMove(event, index) {
    if (this.readonly || this.disabled) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const width = rect.width;

    let value = index + 1;

    if (this.precision === 0.5 && x < width / 2) {
      value -= 0.5;
    }

    this._hoverValue = value;
  }

  _handleMouseLeave() {
    this._hoverValue = null;
  }

  _handleClick(event, index) {
    if (this.readonly || this.disabled) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const width = rect.width;

    let value = index + 1;

    if (this.precision === 0.5 && x < width / 2) {
      value -= 0.5;
    }

    // Toggle off if clicking the same value
    if (value === this.value) {
      value = 0;
    }

    this.value = value;
    this.dispatchEvent(
      new CustomEvent("change", {
        detail: { value },
        bubbles: true,
        composed: true,
      })
    );
  }

  _handleHover(value) {
    this.dispatchEvent(
      new CustomEvent("hover", {
        detail: { value },
        bubbles: true,
        composed: true,
      })
    );
  }

  _renderRatingItem(index) {
    const displayValue =
      this._hoverValue !== null ? this._hoverValue : this.value;
    const isActive = index + 1 <= displayValue;
    const isHalf = this.precision === 0.5 && index + 0.5 === displayValue;

    return html`
      <span
        class="rating-item size-${this.size} variant-${this.variant}
               ${isActive ? "active" : ""}
               ${this.disabled ? "disabled" : ""}
               ${this.readonly ? "readonly" : ""}"
        @mousemove=${(e) => this._handleMouseMove(e, index)}
        @mouseleave=${this._handleMouseLeave}
        @click=${(e) => this._handleClick(e, index)}
        @mouseenter=${() => this._handleHover(index + 1)}
      >
        ${isHalf
          ? html`
              <span class="rating-item-half"> ${this._getIcon("half")} </span>
            `
          : ""}
        ${this._getIcon(isActive ? "filled" : "empty")}
      </span>
    `;
  }

  render() {
    const displayValue =
      this._hoverValue !== null ? this._hoverValue : this.value;

    return html`
      ${this.label
        ? html` <label class="rating-label">${this.label}</label> `
        : ""}
      <div class="rating-container">
        <div class="rating-items">
          ${Array.from({ length: this.max }, (_, i) =>
            this._renderRatingItem(i)
          )}
        </div>
        ${this.showValue
          ? html`
              <span class="rating-value">${displayValue}/${this.max}</span>
            `
          : ""}
      </div>
    `;
  }
}

customElements.define("ui-rating", Rating);
