import { LitElement, html, css } from "lit";
import { baseStyles } from "../../styles/base.js";

export class BadgeComponent extends LitElement {
  static properties = {
    variant: { type: String }, // 'primary', 'success', 'warning', 'error', 'info'
    size: { type: String }, // 'small', 'medium', 'large'
    icon: { type: String },
  };

  static styles = [
    baseStyles,
    css`
      :host {
        display: inline-flex;
      }

      .badge {
        display: inline-flex;
        align-items: center;
        gap: var(--space-1);
        padding: 0 var(--space-2);
        border-radius: var(--radius-full);
        font-size: var(--text-xs);
        font-weight: var(--weight-medium);
      }

      /* Sizes */
      .badge--small {
        height: 18px;
        font-size: var(--text-xs);
      }

      .badge--medium {
        height: 22px;
        font-size: var(--text-sm);
      }

      .badge--large {
        height: 26px;
        font-size: var(--text-base);
        padding: 0 var(--space-3);
      }

      /* Variants */
      .badge--primary {
        background: var(--brand);
        color: white;
      }

      .badge--success {
        background: var(--success);
        color: white;
      }

      .badge--warning {
        background: var(--warning);
        color: var(--text-1);
      }

      .badge--error {
        background: var(--error);
        color: white;
      }

      .badge--info {
        background: var(--info);
        color: white;
      }

      .material-icons {
        font-size: inherit;
        width: 1em;
        height: 1em;
      }
    `,
  ];

  constructor() {
    super();
    this.variant = "primary";
    this.size = "medium";
  }

  render() {
    return html`
      <span
        class="badge badge--${this.variant} badge--${this.size}"
        role="status"
      >
        ${this.icon
          ? html` <span class="material-icons">${this.icon}</span> `
          : ""}
        <slot></slot>
      </span>
    `;
  }
}

customElements.define("neo-badge", BadgeComponent);
