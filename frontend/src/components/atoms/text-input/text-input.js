import {   LitElement, html, css   } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";
import { baseStyles } from "../../styles/base.js";

/**
 * Text Input component for text entry
 * @element neo-text-input
 *
 * @prop {string} type - Input type (text, email, password, etc.)
 * @prop {string} label - Input label
 * @prop {string} value - Input value
 * @prop {string} placeholder - Input placeholder
 * @prop {string} helper - Helper text to display
 * @prop {string} error - Error message to display
 * @prop {boolean} disabled - Whether the input is disabled
 * @prop {boolean} required - Whether the input is required
 * @prop {boolean} readonly - Whether the input is read-only
 * @prop {boolean} clearable - Whether to show a clear button
 */
export class NeoTextInput extends LitElement {
  static properties = {
    type: { type: String, reflect: true },
    label: { type: String },
    value: { type: String },
    placeholder: { type: String },
    helper: { type: String },
    error: { type: String },
    disabled: { type: Boolean, reflect: true },
    required: { type: Boolean, reflect: true },
    readonly: { type: Boolean, reflect: true },
    clearable: { type: Boolean, reflect: true },
    _showPassword: { type: Boolean, state: true },
    _focused: { type: Boolean, state: true },
  };

  static styles = [
    baseStyles,
    css`
      :host {
        display: block;
      }

      .input-wrapper {
        position: relative;
        display: flex;
        align-items: center;
        gap: var(--spacing-xs);
        padding: var(--spacing-sm);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-sm);
        background: white;
        transition: all var(--transition-fast);
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
        border: none;
        background: none;
        font-family: var(--font-family);
        font-size: var(--font-size-base);
        color: var(--color-text);
        line-height: 1.5;
      }

      input:focus {
        outline: none;
      }

      input::placeholder {
        color: var(--color-text-light);
      }

      /* States */
      .input-wrapper.focused {
        border-color: var(--color-primary);
        box-shadow: 0 0 0 2px var(--color-primary-light);
      }

      .input-wrapper.disabled {
        background: var(--color-gray-50);
        cursor: not-allowed;
      }

      .input-wrapper.readonly {
        background: var(--color-gray-50);
      }

      .input-wrapper.error {
        border-color: var(--color-error);
      }

      .input-wrapper.error.focused {
        box-shadow: 0 0 0 2px var(--color-error-light);
      }

      /* Helper and Error Text */
      .helper-text,
      .error-message {
        margin-top: var(--spacing-xs);
        font-size: var(--font-size-sm);
      }

      .helper-text {
        color: var(--color-text-light);
      }

      .error-message {
        color: var(--color-error);
      }

      /* Icons and Buttons */
      .action-buttons {
        display: flex;
        gap: var(--spacing-xs);
      }

      .password-toggle,
      .clear-button {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: var(--spacing-xs);
        border: none;
        background: none;
        color: var(--color-text-light);
        cursor: pointer;
        transition: color var(--transition-fast);
      }

      .password-toggle:hover,
      .clear-button:hover {
        color: var(--color-text);
      }

      /* Slots */
      ::slotted([slot="prefix"]),
      ::slotted([slot="suffix"]) {
        display: flex;
        align-items: center;
        color: var(--color-text-light);
      }
    `,
  ];

  constructor() {
    super();
    this.type = "text";
    this.value = "";
    this.placeholder = "";
    this.disabled = false;
    this.required = false;
    this.readonly = false;
    this.clearable = false;
    this._showPassword = false;
    this._focused = false;
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

  _handleChange() {
    this.dispatchEvent(
      new CustomEvent("neo-change", {
        detail: { value: this.value },
        bubbles: true,
        composed: true,
      })
    );
  }

  _handleFocus() {
    this._focused = true;
  }

  _handleBlur() {
    this._focused = false;
  }

  _handleClear() {
    this.value = "";
    this.dispatchEvent(
      new CustomEvent("neo-input", {
        detail: { value: this.value },
        bubbles: true,
        composed: true,
      })
    );
    this.dispatchEvent(
      new CustomEvent("neo-change", {
        detail: { value: this.value },
        bubbles: true,
        composed: true,
      })
    );
  }

  _togglePassword() {
    this._showPassword = !this._showPassword;
  }

  render() {
    const showPasswordToggle = this.type === "password";
    const showClearButton =
      this.clearable && this.value && !this.disabled && !this.readonly;

    const wrapperClasses = {
      "input-wrapper": true,
      focused: this._focused,
      disabled: this.disabled,
      readonly: this.readonly,
      error: !!this.error,
    };

    return html`
      ${this.label ? html`<label for="${this._id}">${this.label}</label>` : ""}
      <div
        class="${Object.entries(wrapperClasses)
          .filter(([, value]) => value)
          .map(([key]) => key)
          .join(" ")}"
      >
        <slot name="prefix"></slot>
        <input
          id="${this._id}"
          type="${this._showPassword ? "text" : this.type}"
          .value="${this.value}"
          placeholder="${this.placeholder}"
          ?disabled="${this.disabled}"
          ?required="${this.required}"
          ?readonly="${this.readonly}"
          aria-label="${this.label || ""}"
          aria-invalid="${Boolean(this.error)}"
          aria-errormessage="${this.error ? `${this._id}-error` : ""}"
          aria-required="${this.required}"
          @input="${this._handleInput}"
          @change="${this._handleChange}"
          @focus="${this._handleFocus}"
          @blur="${this._handleBlur}"
        />
        <div class="action-buttons">
          ${showClearButton
            ? html`
                <button
                  type="button"
                  class="clear-button"
                  @click="${this._handleClear}"
                  aria-label="Clear input"
                >
                  <neo-icon name="clear"></neo-icon>
                </button>
              `
            : ""}
          ${showPasswordToggle
            ? html`
                <button
                  type="button"
                  class="password-toggle"
                  @click="${this._togglePassword}"
                  aria-label="${this._showPassword
                    ? "Hide password"
                    : "Show password"}"
                >
                  <neo-icon
                    name="${this._showPassword
                      ? "visibility_off"
                      : "visibility"}"
                  ></neo-icon>
                </button>
              `
            : ""}
        </div>
        <slot name="suffix"></slot>
      </div>
      ${this.error
        ? html`<div id="${this._id}-error" class="error-message">
            ${this.error}
          </div>`
        : ""}
      ${this.helper && !this.error
        ? html`<div class="helper-text">${this.helper}</div>`
        : ""}
    `;
  }
}

customElements.define("neo-text-input", NeoTextInput);
