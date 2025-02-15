import { LitElement, html, css } from "lit";
import { baseStyles } from "../../styles/base.js";

/**
 * Progress Bar component for showing progress or loading state
 * @element neo-progress-bar
 *
 * @prop {number} value - Current progress value (0-100)
 * @prop {number} max - Maximum progress value
 * @prop {string} variant - Visual style (default, success, error)
 * @prop {string} size - Size of the progress bar (sm, md, lg)
 * @prop {boolean} indeterminate - Whether to show indeterminate loading state
 * @prop {boolean} showLabel - Whether to show the progress label
 * @prop {string} label - Custom label text (defaults to percentage)
 */
export class NeoProgressBar extends LitElement {
  static get properties() {
    return {
      value: { type: Number },
      max: { type: Number },
      variant: { type: String },
      size: { type: String },
      indeterminate: { type: Boolean },
      showLabel: { type: Boolean },
      label: { type: String },
    };
  }

  static get styles() {
    return [
      baseStyles,
      css`
        :host {
          display: block;
          width: 100%;
        }

        .progress-container {
          position: relative;
        }

        .progress-bar {
          position: relative;
          width: 100%;
          background-color: var(--color-surface-variant);
          border-radius: 4px;
          overflow: hidden;
        }

        /* Sizes */
        .progress-bar.sm {
          height: 4px;
        }

        .progress-bar.md {
          height: 8px;
        }

        .progress-bar.lg {
          height: 12px;
        }

        .progress-fill {
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          background-color: var(--color-primary);
          transition: width 0.3s ease-in-out;
        }

        /* Variants */
        .progress-fill.default {
          background-color: var(--color-primary);
        }

        .progress-fill.success {
          background-color: var(--color-success);
        }

        .progress-fill.error {
          background-color: var(--color-error);
        }

        /* Indeterminate animation */
        .progress-fill.indeterminate {
          width: 50% !important;
          animation: indeterminate 2s infinite linear;
          transform-origin: left;
        }

        @keyframes indeterminate {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(200%);
          }
        }

        /* Label */
        .progress-label {
          margin-top: 4px;
          font-size: 14px;
          color: var(--color-text-secondary);
          text-align: center;
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
    this.value = 0;
    this.max = 100;
    this.variant = "default";
    this.size = "md";
    this.indeterminate = false;
    this.showLabel = false;
    this.label = "";
  }

  get percentage() {
    return Math.min(100, Math.max(0, (this.value / this.max) * 100));
  }

  render() {
    const progressClasses = `progress-bar ${this.size}`;
    const fillClasses = `progress-fill ${this.variant} ${
      this.indeterminate ? "indeterminate" : ""
    }`;

    return html`
      <div
        class="progress-container"
        role="progressbar"
        aria-valuemin="0"
        aria-valuemax="${this.max}"
        aria-valuenow="${this.indeterminate ? null : this.value}"
      >
        <div class="${progressClasses}">
          <div
            class="${fillClasses}"
            style="${this.indeterminate ? "" : `width: ${this.percentage}%`}"
          ></div>
        </div>
        ${this.showLabel
          ? html`
              <div class="progress-label">
                ${this.label || `${Math.round(this.percentage)}%`}
              </div>
            `
          : ""}
        <span class="sr-only">
          ${this.indeterminate
            ? "Loading..."
            : `Progress: ${Math.round(this.percentage)}%`}
        </span>
      </div>
    `;
  }
}

customElements.define("neo-progress-bar", NeoProgressBar);
