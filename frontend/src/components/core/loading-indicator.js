import { LitElement, html, css } from "lit";
import { baseStyles } from "../styles/base.js";

/**
 * Loading indicator component with multiple variants
 * @customElement loading-indicator
 */
export class LoadingIndicator extends LitElement {
  static properties = {
    variant: { type: String }, // spinner, dots, pulse
    size: { type: String }, // small, medium, large
    label: { type: String },
    center: { type: Boolean },
  };

  static styles = [
    baseStyles,
    css`
      :host {
        display: block;
      }

      .loading-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--spacing-sm);
      }

      :host([center]) .loading-container {
        justify-content: center;
        min-height: 200px;
      }

      .loading-label {
        color: var(--text-secondary);
        font-size: 0.9em;
      }

      /* Spinner variant */
      .spinner {
        width: var(--spinner-size);
        height: var(--spinner-size);
        border: 2px solid var(--color-primary-light);
        border-top-color: var(--color-primary);
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }

      /* Dots variant */
      .dots {
        display: flex;
        gap: 4px;
      }

      .dot {
        width: var(--dot-size);
        height: var(--dot-size);
        background: var(--color-primary);
        border-radius: 50%;
        animation: pulse 0.8s ease-in-out infinite;
      }

      .dot:nth-child(2) {
        animation-delay: 0.2s;
      }

      .dot:nth-child(3) {
        animation-delay: 0.4s;
      }

      /* Pulse variant */
      .pulse {
        width: var(--pulse-size);
        height: var(--pulse-size);
        background: var(--color-primary);
        border-radius: 50%;
        animation: pulse-ring 1.25s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
      }

      /* Size variations */
      :host([size="small"]) {
        --spinner-size: 16px;
        --dot-size: 4px;
        --pulse-size: 16px;
      }

      :host([size="medium"]) {
        --spinner-size: 32px;
        --dot-size: 8px;
        --pulse-size: 32px;
      }

      :host([size="large"]) {
        --spinner-size: 48px;
        --dot-size: 12px;
        --pulse-size: 48px;
      }

      /* Animations */
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      @keyframes pulse {
        0%,
        100% {
          transform: scale(1);
          opacity: 1;
        }
        50% {
          transform: scale(0.5);
          opacity: 0.5;
        }
      }

      @keyframes pulse-ring {
        0% {
          transform: scale(0.33);
          opacity: 1;
        }
        80%,
        100% {
          transform: scale(1);
          opacity: 0;
        }
      }
    `,
  ];

  constructor() {
    super();
    this.variant = "spinner";
    this.size = "medium";
    this.label = "Loading...";
    this.center = false;
  }

  render() {
    return html`
      <div class="loading-container">
        ${this._renderLoadingIndicator()}
        ${this.label
          ? html`<div class="loading-label">${this.label}</div>`
          : null}
      </div>
    `;
  }

  _renderLoadingIndicator() {
    switch (this.variant) {
      case "dots":
        return html`
          <div class="dots">
            <div class="dot"></div>
            <div class="dot"></div>
            <div class="dot"></div>
          </div>
        `;
      case "pulse":
        return html`<div class="pulse"></div>`;
      case "spinner":
      default:
        return html`<div class="spinner"></div>`;
    }
  }
}

customElements.define("loading-indicator", LoadingIndicator);
