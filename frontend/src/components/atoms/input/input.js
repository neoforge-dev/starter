import {
  LitElement,
  html,
  css,
} from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";
import { baseStyles } from "../../styles/base.js";

/**
 * Input component for text entry
 * @element neo-input
 *
 * @prop {string} type - Input type (text, email, password, etc.)
 * @prop {string} label - Input label
 * @prop {string} value - Input value
 * @prop {string} placeholder - Input placeholder
 * @prop {boolean} disabled - Whether the input is disabled
 * @prop {boolean} required - Whether the input is required
 * @prop {string} error - Error message to display
 * @prop {string} helperText - Helper text to display below input
 * @prop {string} helper - Additional helper text
 */
export class NeoInput extends LitElement {
  static properties = {
    type: { type: String, reflect: true },
    label: { type: String },
    value: { type: String },
    placeholder: { type: String },
    disabled: { type: Boolean, reflect: true },
    required: { type: Boolean, reflect: true },
    error: { type: String },
    helperText: { type: String },
    helper: { type: String },
  };

  static styles = [
    baseStyles,
    css`
      :host {
        display: block;
        margin-bottom: var(--spacing-md);
      }

      .input-wrapper {
        position: relative;
      }

      label {
        display: block;
        margin-bottom: var(--spacing-xs);
        color: var(--color-text);
        font-size: var(--font-size-sm);
        font-weight: var(--font-weight-medium);
      }

      input {
        width: 100%;
        padding: var(--spacing-sm);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-sm);
        font-family: var(--font-family);
        font-size: var(--font-size-base);
        line-height: 1.5;
        transition: all var(--transition-fast);
      }

      input:focus {
        outline: none;
        border-color: var(--color-primary);
        box-shadow: 0 0 0 2px var(--color-primary-light);
      }

      input:disabled {
        background-color: var(--color-gray-100);
        cursor: not-allowed;
      }

      .error-text {
        color: var(--color-error);
        font-size: var(--font-size-sm);
        margin-top: var(--spacing-xs);
      }

      .helper-text {
        color: var(--color-text-light);
        font-size: var(--font-size-sm);
        margin-top: var(--spacing-xs);
      }

      .input-wrapper.error input {
        border-color: var(--color-error);
      }

      .input-wrapper.error input:focus {
        box-shadow: 0 0 0 2px var(--color-error-light);
      }
    `,
  ];

  constructor() {
    super();
    this.type = "text";
    this.value = "";
    this.disabled = false;
    this.required = false;
    this._id = `neo-input-${Math.random().toString(36).substr(2, 9)}`;
  }

  _handleInput(e) {
    this.value = e.target.value;
    this.dispatchEvent(
      new CustomEvent("neo-input", {
        detail: { value: this.value },
        bubbles: true,
        composed: true,
      })
    );
  }

  _handleChange(e) {
    this.dispatchEvent(
      new CustomEvent("neo-change", {
        detail: { value: this.value },
        bubbles: true,
        composed: true,
      })
    );
  }

  render() {
    return html`
      ${this.label ? html`<label for="${this._id}">${this.label}</label>` : ""}
      <div class="input-wrapper ${this.error ? "error" : ""}">
        <input
          id="${this._id}"
          type="${this.type}"
          .value="${this.value}"
          placeholder="${this.placeholder || ""}"
          ?disabled="${this.disabled}"
          ?required="${this.required}"
          aria-label="${this.label || ""}"
          aria-invalid="${Boolean(this.error)}"
          aria-errormessage="${this.error ? `${this._id}-error` : ""}"
          @input="${this._handleInput}"
          @change="${this._handleChange}"
        />
      </div>
      ${this.error
        ? html`<div id="${this._id}-error" class="error-text">
            ${this.error}
          </div>`
        : ""}
      ${this.helperText && !this.error
        ? html`<div class="helper-text">${this.helperText}</div>`
        : ""}
      ${this.helper && !this.error && !this.helperText
        ? html`<div class="helper-text">${this.helper}</div>`
        : ""}
    `;
  }
}

if (!customElements.get("neo-input")) {
  customElements.define("neo-input", NeoInput);
}
