import { LitElement, html, css } from "lit";
import { baseStyles } from "../../styles/base.js";

/**
 * Tooltip component for displaying additional information
 * @element neo-tooltip
 *
 * @prop {string} content - Text content of the tooltip
 * @prop {string} position - Position of the tooltip (top, right, bottom, left)
 * @prop {string} variant - Visual style of the tooltip (dark, light)
 * @prop {boolean} arrow - Whether to show the arrow
 * @prop {number} delay - Delay before showing the tooltip (in ms)
 */
export class NeoTooltip extends LitElement {
  static get properties() {
    return {
      content: { type: String },
      position: { type: String },
      variant: { type: String },
      arrow: { type: Boolean },
      delay: { type: Number },
      _isVisible: { type: Boolean, state: true },
    };
  }

  static get styles() {
    return [
      baseStyles,
      css`
        :host {
          display: inline-block;
          position: relative;
        }

        .tooltip-trigger {
          display: inline-block;
          cursor: help;
        }

        .tooltip {
          position: absolute;
          z-index: 1000;
          padding: 8px 12px;
          border-radius: 4px;
          font-size: 14px;
          line-height: 1.4;
          white-space: nowrap;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.2s ease-in-out;
        }

        .tooltip.visible {
          opacity: 1;
        }

        /* Variants */
        .tooltip.dark {
          background-color: var(--color-surface-dark);
          color: var(--color-text-light);
        }

        .tooltip.light {
          background-color: var(--color-surface-light);
          color: var(--color-text-dark);
          border: 1px solid var(--color-border);
        }

        /* Positions */
        .tooltip.top {
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%) translateY(-8px);
        }

        .tooltip.right {
          top: 50%;
          left: 100%;
          transform: translateY(-50%) translateX(8px);
        }

        .tooltip.bottom {
          top: 100%;
          left: 50%;
          transform: translateX(-50%) translateY(8px);
        }

        .tooltip.left {
          top: 50%;
          right: 100%;
          transform: translateY(-50%) translateX(-8px);
        }

        /* Arrows */
        .tooltip.arrow::before {
          content: "";
          position: absolute;
          width: 0;
          height: 0;
          border: 6px solid transparent;
        }

        .tooltip.dark.arrow.top::before {
          bottom: -12px;
          left: 50%;
          transform: translateX(-50%);
          border-top-color: var(--color-surface-dark);
        }

        .tooltip.dark.arrow.right::before {
          left: -12px;
          top: 50%;
          transform: translateY(-50%);
          border-right-color: var(--color-surface-dark);
        }

        .tooltip.dark.arrow.bottom::before {
          top: -12px;
          left: 50%;
          transform: translateX(-50%);
          border-bottom-color: var(--color-surface-dark);
        }

        .tooltip.dark.arrow.left::before {
          right: -12px;
          top: 50%;
          transform: translateY(-50%);
          border-left-color: var(--color-surface-dark);
        }

        .tooltip.light.arrow.top::before {
          bottom: -12px;
          left: 50%;
          transform: translateX(-50%);
          border-top-color: var(--color-surface-light);
        }

        .tooltip.light.arrow.right::before {
          left: -12px;
          top: 50%;
          transform: translateY(-50%);
          border-right-color: var(--color-surface-light);
        }

        .tooltip.light.arrow.bottom::before {
          top: -12px;
          left: 50%;
          transform: translateX(-50%);
          border-bottom-color: var(--color-surface-light);
        }

        .tooltip.light.arrow.left::before {
          right: -12px;
          top: 50%;
          transform: translateY(-50%);
          border-left-color: var(--color-surface-light);
        }
      `,
    ];
  }

  constructor() {
    super();
    this.content = "";
    this.position = "top";
    this.variant = "dark";
    this.arrow = true;
    this.delay = 200;
    this._isVisible = false;
    this._showTimeout = null;
  }

  _handleMouseEnter() {
    this._showTimeout = setTimeout(() => {
      this._isVisible = true;
    }, this.delay);
  }

  _handleMouseLeave() {
    if (this._showTimeout) {
      clearTimeout(this._showTimeout);
    }
    this._isVisible = false;
  }

  render() {
    const tooltipClasses = `
      tooltip
      ${this.variant}
      ${this.position}
      ${this.arrow ? "arrow" : ""}
      ${this._isVisible ? "visible" : ""}
    `;

    return html`
      <div
        class="tooltip-trigger"
        @mouseenter=${this._handleMouseEnter}
        @mouseleave=${this._handleMouseLeave}
        aria-describedby="tooltip"
      >
        <slot></slot>
        <div id="tooltip" role="tooltip" class=${tooltipClasses.trim()}>
          ${this.content}
        </div>
      </div>
    `;
  }
}

customElements.define("neo-tooltip", NeoTooltip);
