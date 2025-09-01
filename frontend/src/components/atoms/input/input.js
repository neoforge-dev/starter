import {
  LitElement,
  html,
  css,
 } from 'lit';
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
 * @prop {string} pattern - Validation pattern
 * @prop {number} maxLength - Maximum length of input
 * @prop {number} minLength - Minimum length of input
 * @prop {string} name - Input name for form submission
 */
export class NeoInput extends LitElement {
  static get properties() {
    return {
      type: { type: String, reflect: true },
      label: { type: String },
      value: { type: String },
      placeholder: { type: String },
      disabled: { type: Boolean, reflect: true },
      required: { type: Boolean, reflect: true },
      error: { type: String },
      helperText: { type: String },
      helper: { type: String },
      pattern: { type: String },
      maxLength: { type: Number },
      minLength: { type: Number },
      name: { type: String },
      _showPassword: { type: Boolean, state: true },
    };
  }

  static get styles() {
    return [
      baseStyles,
      css`
        :host {
          display: block;
          margin-bottom: var(--spacing-md);
        }

        .input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
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
          min-height: 44px; /* WCAG AA touch target minimum */
          padding: var(--spacing-sm);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          font-family: var(--font-family);
          font-size: var(--font-size-base);
          line-height: 1.5;
          transition: all var(--transition-fast);
          box-sizing: border-box;
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

        .password-toggle {
          position: absolute;
          right: var(--spacing-sm);
          background: none;
          border: none;
          cursor: pointer;
          color: var(--color-text-light);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 8px; /* Minimum touch target padding */
          min-width: 44px; /* WCAG AA touch target minimum */
          min-height: 44px; /* WCAG AA touch target minimum */
        }

        .prefix-slot {
          margin-right: var(--spacing-xs);
        }

        .suffix-slot {
          margin-left: var(--spacing-xs);
        }
      `,
    ];
  }

  constructor() {
    super();
    this.type = "text";
    this.value = "";
    this.disabled = false;
    this.required = false;
    this._id = `neo-input-${Math.random().toString(36).substr(2, 9)}`;
    this._showPassword = false;
  }

  // Event handlers
  _handleInput(e) {
    this.value = e.target.value;

    this.dispatchEvent(
      new CustomEvent("neo-input", {
        detail: { value: this.value },
        bubbles: true,
        composed: true,
      })
    );

    // Also dispatch standard input event
    this.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
  }

  _handleChange() {
    this.dispatchEvent(
      new CustomEvent("neo-change", {
        detail: { value: this.value },
        bubbles: true,
        composed: true,
      })
    );

    // Also dispatch standard change event
    this.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
  }

  _togglePasswordVisibility() {
    this._showPassword = !this._showPassword;
  }

  // Public methods
  focus() {
    const input = this.shadowRoot.querySelector("input");
    if (input) {
      input.focus();
    }
    this.dispatchEvent(new Event("focus", { bubbles: true, composed: true }));
  }

  blur() {
    const input = this.shadowRoot.querySelector("input");
    if (input) {
      input.blur();
    }
    this.dispatchEvent(new Event("blur", { bubbles: true, composed: true }));
  }

  reportValidity() {
    const input = this.shadowRoot.querySelector("input");
    const isValid = input.reportValidity();

    if (!isValid) {
      this.error = input.validationMessage;
      this.dispatchEvent(
        new Event("invalid", { bubbles: true, composed: true })
      );
    } else {
      this.error = "";
    }

    return isValid;
  }

  checkValidity() {
    const input = this.shadowRoot.querySelector("input");
    return input.checkValidity();
  }

  render() {
    // Determine the actual input type (for password toggle)
    const actualType =
      this.type === "password" && this._showPassword ? "text" : this.type;

    return html`
      ${this.label ? html`<label for="${this._id}">${this.label}</label>` : ""}
      <div class="input-wrapper ${this.error ? "error" : ""}">
        <slot name="prefix" class="prefix-slot"></slot>
        <input
          id="${this._id}"
          type="${actualType}"
          .value="${this.value}"
          placeholder="${this.placeholder || ""}"
          ?disabled="${this.disabled}"
          ?required="${this.required}"
          name="${this.name || ""}"
          pattern="${this.pattern || ""}"
          maxlength="${this.maxLength || ""}"
          minlength="${this.minLength || ""}"
          aria-label="${this.label || ""}"
          aria-invalid="${Boolean(this.error)}"
          aria-required="${Boolean(this.required)}"
          aria-errormessage="${this.error ? `${this._id}-error` : ""}"
          @input="${this._handleInput}"
          @change="${this._handleChange}"
        />
        ${this.type === "password"
          ? html`
              <button
                type="button"
                class="password-toggle"
                @click="${this._togglePasswordVisibility}"
                aria-label="${this._showPassword
                  ? "Hide password"
                  : "Show password"}"
              >
                <neo-icon
                  name="${this._showPassword ? "visibility_off" : "visibility"}"
                ></neo-icon>
              </button>
            `
          : ""}
        <slot name="suffix" class="suffix-slot"></slot>
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
