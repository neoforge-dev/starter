import { 
  LitElement,
  html,
  css,
 } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";
import { baseStyles } from "../../styles/base.js";

/**
 * Radio button component for single selection
 * @element neo-radio
 *
 * @prop {string} label - Radio button label
 * @prop {string} name - Radio button group name
 * @prop {string} value - Radio button value
 * @prop {boolean} checked - Whether the radio is checked
 * @prop {boolean} disabled - Whether the radio is disabled
 * @prop {boolean} required - Whether the radio is required
 * @prop {string} error - Error message to display
 */
export class NeoRadio extends LitElement {
  static get properties() {
    return {
      label: { type: String },
      name: { type: String, reflect: true },
      value: { type: String, reflect: true },
      checked: { type: Boolean, reflect: true },
      disabled: { type: Boolean, reflect: true },
      required: { type: Boolean, reflect: true },
      error: { type: String },
    };
  }

  static get styles() {
    return [
      baseStyles,
      css`
        :host {
          display: block;
          margin-bottom: var(--spacing-sm);
        }

        .radio-wrapper {
          display: flex;
          align-items: flex-start;
          gap: var(--spacing-xs);
          cursor: pointer;
        }

        .radio-wrapper.disabled {
          cursor: not-allowed;
          opacity: 0.5;
        }

        .radio-container {
          position: relative;
          width: 18px;
          height: 18px;
          flex-shrink: 0;
        }

        input[type="radio"] {
          position: absolute;
          opacity: 0;
          width: 100%;
          height: 100%;
          margin: 0;
          cursor: inherit;
        }

        .radio-custom {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: white;
          border: 2px solid var(--radio-color, var(--color-border));
          border-radius: 50%;
          transition: all var(--transition-fast);
        }

        input[type="radio"]:focus + .radio-custom {
          border-color: var(--radio-color, var(--color-primary));
          box-shadow: 0 0 0 2px var(--color-primary-light);
        }

        input[type="radio"]:checked + .radio-custom {
          border-color: var(--radio-color, var(--color-primary));
        }

        input[type="radio"]:checked + .radio-custom::after {
          content: "";
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 8px;
          height: 8px;
          background: var(--radio-color, var(--color-primary));
          border-radius: 50%;
        }

        label {
          font-size: var(--font-size-sm);
          line-height: 1.4;
          color: var(--color-text);
          user-select: none;
        }

        .error-message {
          margin-top: var(--spacing-xs);
          color: var(--color-error);
          font-size: var(--font-size-sm);
        }

        .radio-wrapper.error .radio-custom {
          border-color: var(--color-error);
        }

        .radio-wrapper.error input[type="radio"]:focus + .radio-custom {
          box-shadow: 0 0 0 2px var(--color-error-light);
        }

        ::slotted([slot="description"]) {
          margin-top: var(--spacing-xs);
          color: var(--color-text-light);
          font-size: var(--font-size-sm);
        }
      `,
    ];
  }

  constructor() {
    super();
    this.checked = false;
    this.disabled = false;
    this.required = false;
    this.error = "";
    this._id = `neo-radio-${Math.random().toString(36).substr(2, 9)}`;
  }

  _handleChange(e) {
    if (!this.disabled) {
      this.checked = e.target.checked;
      this.dispatchEvent(
        new CustomEvent("neo-change", {
          detail: {
            checked: this.checked,
            value: this.value,
          },
          bubbles: true,
          composed: true,
        })
      );
    }
  }

  render() {
    const wrapperClasses = {
      "radio-wrapper": true,
      disabled: this.disabled,
      error: !!this.error,
      checked: this.checked,
    };

    return html`
      <div
        class="${Object.entries(wrapperClasses)
          .filter(([, value]) => value)
          .map(([key]) => key)
          .join(" ")}"
      >
        <div class="radio-container">
          <input
            type="radio"
            id="${this._id}"
            name="${this.name}"
            .value="${this.value}"
            .checked="${this.checked}"
            ?disabled="${this.disabled}"
            ?required="${this.required}"
            @change="${this._handleChange}"
            aria-label="${this.label}"
            aria-invalid="${Boolean(this.error)}"
            aria-errormessage="${this.error ? `${this._id}-error` : ""}"
          />
          <div class="radio-custom"></div>
        </div>
        ${this.label
          ? html`<label for="${this._id}">${this.label}</label>`
          : ""}
      </div>
      ${this.error
        ? html`<div id="${this._id}-error" class="error-message">
            ${this.error}
          </div>`
        : ""}
      <slot name="description"></slot>
    `;
  }
}

if (!customElements.get("neo-radio")) {
  customElements.define("neo-radio", NeoRadio);
}
