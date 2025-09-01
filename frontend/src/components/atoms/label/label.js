import { html, css } from "lit";
import { baseStyles } from "../../styles/base.js";
import { BaseComponent } from "../../base-component.js";

/**
 * Label component for form controls
 * @element neo-label
 *
 * @prop {string} for - The ID of the form control this label is associated with
 * @prop {boolean} required - Whether the associated form control is required
 * @prop {string} helpText - Help text to display below the label
 * @prop {string} size - Size of the label (sm, md, lg)
 * @prop {boolean} disabled - Whether the label should appear disabled
 *
 * @example
 * <neo-label for="username" required>Username</neo-label>
 * <neo-label for="email" help-text="We'll never share your email">Email</neo-label>
 */
export class NeoLabel extends BaseComponent {
  static get properties() {
    return {
      for: { type: String, reflect: true },
      required: { type: Boolean, reflect: true },
      helpText: { type: String, attribute: "help-text" },
      size: { type: String, reflect: true },
      disabled: { type: Boolean, reflect: true },
    };
  }

  static get styles() {
    return [
      baseStyles,
      css`
        :host {
          display: block;
          margin-bottom: var(--spacing-xs);
        }

        :host([disabled]) {
          opacity: 0.6;
          pointer-events: none;
        }

        .label-wrapper {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xs);
        }

        label {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
          font-family: var(--font-family);
          font-weight: var(--font-weight-medium);
          color: var(--color-text);
          cursor: pointer;
          user-select: none;
          line-height: 1.4;
        }

        /* Size variants */
        .size-sm label {
          font-size: var(--font-size-sm);
        }

        .size-md label {
          font-size: var(--font-size-base);
        }

        .size-lg label {
          font-size: var(--font-size-lg);
        }

        .required-indicator {
          color: var(--color-error);
          font-weight: var(--font-weight-bold);
          margin-left: var(--spacing-xs);
        }

        .help-text {
          font-size: var(--font-size-sm);
          color: var(--color-text-light);
          line-height: 1.4;
          margin-top: var(--spacing-xs);
        }

        /* Accessibility improvements */
        label:focus-within {
          outline: 2px solid var(--color-primary);
          outline-offset: 2px;
          border-radius: var(--radius-sm);
        }

        /* High contrast mode support */
        @media (prefers-contrast: high) {
          .required-indicator {
            color: var(--color-error-dark);
            font-weight: var(--font-weight-bold);
          }
        }

        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          * {
            transition: none !important;
          }
        }
      `,
    ];
  }

  constructor() {
    super();
    this.for = "";
    this.required = false;
    this.helpText = "";
    this.size = "md";
    this.disabled = false;
    this._helpId = `neo-label-help-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Handle click event to focus associated control
   * @param {Event} e
   */
  _handleClick(e) {
    if (this.disabled || !this.for) return;

    // Find the associated control
    const control = document.getElementById(this.for);
    if (control && control.focus) {
      control.focus();
    }

    this.dispatchEvent(
      new CustomEvent("neo-label-click", {
        bubbles: true,
        composed: true,
        detail: {
          for: this.for,
          originalEvent: e
        },
      })
    );
  }

  /**
   * Get appropriate ARIA attributes for the associated control
   */
  getAriaAttributes() {
    const attributes = {};

    if (this.helpText) {
      attributes['aria-describedby'] = this._helpId;
    }

    if (this.required) {
      attributes['aria-required'] = 'true';
    }

    return attributes;
  }

  render() {
    const wrapperClasses = {
      "label-wrapper": true,
      [`size-${this.size}`]: true,
      disabled: this.disabled,
    };

    return html`
      <div
        class="${Object.entries(wrapperClasses)
          .filter(([, value]) => value)
          .map(([key]) => key)
          .join(" ")}"
      >
        <label
          for="${this.for}"
          @click="${this._handleClick}"
          aria-disabled="${this.disabled}"
        >
          <slot></slot>
          ${this.required
            ? html`<span class="required-indicator" aria-label="required">*</span>`
            : ""}
        </label>

        ${this.helpText
          ? html`
              <div
                id="${this._helpId}"
                class="help-text"
                role="note"
                aria-live="polite"
              >
                ${this.helpText}
              </div>
            `
          : ""}
      </div>
    `;
  }
}

// Register the component
if (!customElements.get("neo-label")) {
  customElements.define("neo-label", NeoLabel);
}
