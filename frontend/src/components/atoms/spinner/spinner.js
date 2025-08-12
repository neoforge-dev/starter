import {   LitElement, html, css   } from 'lit';
import { baseStyles } from "../../styles/base.js";

/**
 * Spinner component for loading states
 * @element neo-spinner
 *
 * @prop {string} size - Size of the spinner (sm, md, lg)
 * @prop {string} color - Color of the spinner (primary, secondary, success, error)
 * @prop {string} variant - Variant of the spinner (border, dots, pulse)
 * @prop {string} label - Accessible label for screen readers
 */
export class NeoSpinner extends LitElement {
  static get properties() {
    return {
      size: { type: String },
      color: { type: String },
      variant: { type: String },
      label: { type: String },
    };
  }

  static get styles() {
    return [
      baseStyles,
      css`
        :host {
          display: inline-block;
        }

        .spinner {
          display: inline-block;
          position: relative;
        }

        /* Sizes */
        .spinner.sm {
          width: 16px;
          height: 16px;
        }

        .spinner.md {
          width: 24px;
          height: 24px;
        }

        .spinner.lg {
          width: 32px;
          height: 32px;
        }

        /* Border Spinner */
        .spinner.border {
          border-radius: 50%;
          border: 2px solid var(--color-border);
          border-top-color: var(--color-primary);
          animation: spin 0.8s linear infinite;
        }

        .spinner.border.sm {
          border-width: 2px;
        }

        .spinner.border.md {
          border-width: 3px;
        }

        .spinner.border.lg {
          border-width: 4px;
        }

        /* Dots Spinner */
        .spinner.dots {
          display: flex;
          gap: 4px;
        }

        .spinner.dots .dot {
          width: 25%;
          height: 25%;
          background-color: var(--color-primary);
          border-radius: 50%;
          animation: pulse 1s ease-in-out infinite;
        }

        .spinner.dots .dot:nth-child(2) {
          animation-delay: 0.2s;
        }

        .spinner.dots .dot:nth-child(3) {
          animation-delay: 0.4s;
        }

        /* Pulse Spinner */
        .spinner.pulse {
          border-radius: 50%;
          background-color: var(--color-primary);
          opacity: 1;
          animation: pulse 1s ease-in-out infinite;
        }

        /* Colors */
        .spinner.primary {
          border-top-color: var(--color-primary);
          background-color: var(--color-primary);
        }

        .spinner.secondary {
          border-top-color: var(--color-secondary);
          background-color: var(--color-secondary);
        }

        .spinner.success {
          border-top-color: var(--color-success);
          background-color: var(--color-success);
        }

        .spinner.error {
          border-top-color: var(--color-error);
          background-color: var(--color-error);
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
            opacity: 0.5;
            transform: scale(0.8);
          }
          50% {
            opacity: 1;
            transform: scale(1);
          }
        }

        /* Screen reader only */
        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }
      `,
    ];
  }

  constructor() {
    super();
    this.size = "md";
    this.color = "primary";
    this.variant = "border";
    this.label = "Loading...";
  }

  render() {
    const spinnerClass = `spinner ${this.variant} ${this.size} ${this.color}`;

    return html`
      <div class="${spinnerClass}" role="status">
        ${this.variant === "dots"
          ? html`
              <div class="dot"></div>
              <div class="dot"></div>
              <div class="dot"></div>
            `
          : ""}
        <span class="sr-only">${this.label}</span>
      </div>
    `;
  }
}

if (!customElements.get("neo-spinner")) {
  customElements.define("neo-spinner", NeoSpinner);
}
