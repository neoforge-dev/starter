import { LitElement, html, css } from "lit";
import { baseStyles } from "../../styles/base.js";

/**
 * Input component with validation and states
 * @element neo-input
 *
 * @prop {string} type - Input type (text, email, password, etc.)
 * @prop {string} label - Input label
 * @prop {string} placeholder - Input placeholder
 * @prop {string} value - Input value
 * @prop {string} name - Input name
 * @prop {boolean} required - Required state
 * @prop {boolean} disabled - Disabled state
 * @prop {string} error - Error message
 * @prop {string} helper - Helper text
 * @prop {string} pattern - Input pattern for validation
 * @prop {number} minLength - Minimum length
 * @prop {number} maxLength - Maximum length
 *
 * @fires input - Native input event
 * @fires change - Native change event
 * @fires focus - Native focus event
 * @fires blur - Native blur event
 */
export class Input extends LitElement {
  static properties = {
    type: { type: String, reflect: true },
    label: { type: String },
    placeholder: { type: String },
    value: { type: String },
    name: { type: String },
    required: { type: Boolean, reflect: true },
    disabled: { type: Boolean, reflect: true },
    error: { type: String },
    helper: { type: String },
    pattern: { type: String },
    minLength: { type: Number },
    maxLength: { type: Number },
    _focused: { type: Boolean, state: true },
    _touched: { type: Boolean, state: true },
  };

  static styles = [
    baseStyles,
    css`
      :host {
        display: block;
      }

      .input-group {
        margin-bottom: var(--spacing-md);
      }

      label {
        display: block;
        margin-bottom: var(--spacing-xs);
        color: var(--text-secondary);
        font-size: var(--font-size-sm);
      }

      input {
        width: 100%;
        padding: var(--spacing-sm);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        background: var(--surface-color);
        color: var(--text-color);
        font-size: var(--font-size-base);
        transition: all var(--transition-fast);
      }

      input:focus {
        outline: none;
        border-color: var(--primary-color);
        box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
      }

      input:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .error-message {
        margin-top: var(--spacing-xs);
        color: var(--error-color);
        font-size: var(--font-size-sm);
      }

      input.error {
        border-color: var(--error-color);
      }
    `,
  ];

  constructor() {
    super();
    this.type = "text";
    this.label = "";
    this.placeholder = "";
    this.value = "";
    this.name = "";
    this.required = false;
    this.disabled = false;
    this.error = "";
    this.helper = "";
    this.pattern = "";
    this.minLength = null;
    this.maxLength = null;
    this._focused = false;
    this._touched = false;
  }

  /**
   * Handle input event
   * @param {Event} e
   */
  _handleInput(e) {
    this.value = e.target.value;
    this._validate();
    this.dispatchEvent(
      new CustomEvent("input", {
        detail: { value: this.value },
        bubbles: true,
        composed: true,
      })
    );
  }

  /**
   * Handle change event
   * @param {Event} e
   */
  _handleChange(e) {
    this.value = e.target.value;
    this._validate();
    this.dispatchEvent(
      new CustomEvent("change", {
        detail: { value: this.value },
        bubbles: true,
        composed: true,
      })
    );
  }

  /**
   * Handle focus event
   */
  _handleFocus() {
    this._focused = true;
    this.dispatchEvent(
      new CustomEvent("focus", {
        bubbles: true,
        composed: true,
      })
    );
  }

  /**
   * Handle blur event
   */
  _handleBlur() {
    this._focused = false;
    this._touched = true;
    this._validate();
    this.dispatchEvent(
      new CustomEvent("blur", {
        bubbles: true,
        composed: true,
      })
    );
  }

  /**
   * Validate input value
   */
  _validate() {
    if (!this._touched) return;

    if (this.required && !this.value) {
      this.error = "This field is required";
      return;
    }

    if (this.pattern && !new RegExp(this.pattern).test(this.value)) {
      this.error = "Please enter a valid value";
      return;
    }

    if (this.minLength && this.value.length < this.minLength) {
      this.error = `Minimum length is ${this.minLength} characters`;
      return;
    }

    if (this.maxLength && this.value.length > this.maxLength) {
      this.error = `Maximum length is ${this.maxLength} characters`;
      return;
    }

    if (
      this.type === "email" &&
      this.value &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.value)
    ) {
      this.error = "Please enter a valid email address";
      return;
    }

    this.error = "";
  }

  /**
   * Reset input state
   */
  reset() {
    this.value = "";
    this.error = "";
    this._touched = false;
    this._focused = false;
  }

  /**
   * Check if input is valid
   */
  checkValidity() {
    this._touched = true;
    this._validate();
    return !this.error;
  }

  render() {
    return html`
      <div class="input-group">
        ${this.label
          ? html`
              <label for="input-${this.name}" data-required=${this.required}>
                ${this.label}
              </label>
            `
          : null}

        <input
          id="input-${this.name}"
          class="neo-input"
          type=${this.type}
          .value=${this.value}
          name=${this.name}
          placeholder=${this.placeholder}
          ?required=${this.required}
          ?disabled=${this.disabled}
          pattern=${this.pattern}
          minlength=${this.minLength || ""}
          maxlength=${this.maxLength || ""}
          data-error=${!!this.error}
          data-focused=${this._focused}
          @input=${this._handleInput}
          @change=${this._handleChange}
          @focus=${this._handleFocus}
          @blur=${this._handleBlur}
        />

        ${this.error
          ? html` <div class="error-message">${this.error}</div> `
          : this.helper
            ? html` <div class="input-helper">${this.helper}</div> `
            : null}
      </div>
    `;
  }
}

customElements.define("neo-input", Input);
