import { LitElement, html, css } from "/vendor/lit-core.min.js";
import { baseStyles } from "../../styles/base.js";

export class SpinnerComponent extends LitElement {
  static properties = {
    size: { type: String }, // 'small', 'medium', 'large'
    color: { type: String },
  };

  static styles = [
    baseStyles,
    css`
      :host {
        display: inline-block;
      }

      .spinner {
        display: inline-block;
        border-radius: 50%;
        border: 2px solid currentColor;
        border-top-color: transparent;
        animation: spin 0.8s linear infinite;
      }

      /* Sizes */
      .spinner--small {
        width: 16px;
        height: 16px;
        border-width: 2px;
      }

      .spinner--medium {
        width: 24px;
        height: 24px;
        border-width: 2px;
      }

      .spinner--large {
        width: 32px;
        height: 32px;
        border-width: 3px;
      }

      @keyframes spin {
        0% {
          transform: rotate(0deg);
        }
        100% {
          transform: rotate(360deg);
        }
      }
    `,
  ];

  constructor() {
    super();
    this.size = "medium";
    this.color = "currentColor";
  }

  render() {
    const style = {
      color: this.color,
    };

    return html`
      <div
        class="spinner spinner--${this.size}"
        style=${Object.entries(style)
          .map(([key, value]) => `${key}: ${value}`)
          .join(";")}
        role="status"
      >
        <span class="sr-only">Loading...</span>
      </div>
    `;
  }
}

customElements.define("neo-spinner", SpinnerComponent);
