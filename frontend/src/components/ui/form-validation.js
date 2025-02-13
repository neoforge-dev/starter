import { LitElement, html, css } from "lit";
import { baseStyles } from "../../styles/base.js";

/**
 * Form validation component
 * @element neo-form
 */
export class NeoForm extends LitElement {
  static properties = {
    errors: { type: Object },
    customRules: { type: Object },
  };

  static styles = [
    baseStyles,
    css`
      :host {
        display: block;
      }

      .error-message {
        color: var(--error-color);
        font-size: var(--font-size-sm);
        margin-top: var(--spacing-xs);
      }

      ::slotted(input),
      ::slotted(select),
      ::slotted(textarea) {
        display: block;
        width: 100%;
        padding: var(--spacing-sm);
        margin-bottom: var(--spacing-sm);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-sm);
        background: var(--input-bg);
        color: var(--text-color);
      }

      ::slotted(input:invalid),
      ::slotted(select:invalid),
      ::slotted(textarea:invalid) {
        border-color: var(--error-color);
      }
    `,
  ];

  constructor() {
    super();
    this.errors = {};
    this.customRules = {};
    this._handleInput = this._handleInput.bind(this);
  }

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener("input", this._handleInput);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener("input", this._handleInput);
  }

  async _handleInput(event) {
    const input = event.target;
    if (input.hasAttribute("data-validate")) {
      await this._validateField(input);
      this.dispatchEvent(new CustomEvent("validation-change"));
    }
  }

  async _validateField(field) {
    const name = field.name;
    const value = field.value;
    let error = null;

    // Check custom validation rules first
    if (this.customRules[name]) {
      error = this.customRules[name](value);
      if (error) {
        this.errors = { ...this.errors, [name]: error };
        return false;
      }
    }

    // Built-in validation
    if (field.required && !value) {
      error = "This field is required";
    } else if (field.type === "email" && value && !this._isValidEmail(value)) {
      error = "Please enter a valid email address";
    } else if (field.minLength && value.length < field.minLength) {
      error = `Minimum length is ${field.minLength} characters`;
    } else if (field.maxLength && value.length > field.maxLength) {
      error = `Maximum length is ${field.maxLength} characters`;
    } else if (field.pattern && !new RegExp(field.pattern).test(value)) {
      error = field.title || "Please match the requested format";
    }

    if (error) {
      this.errors = { ...this.errors, [name]: error };
      return false;
    } else {
      const { [name]: removed, ...rest } = this.errors;
      this.errors = rest;
      return true;
    }
  }

  _isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  addValidationRule(fieldName, rule) {
    this.customRules = {
      ...this.customRules,
      [fieldName]: rule,
    };
  }

  async validate() {
    const fields = this.querySelectorAll("[data-validate]");
    const results = await Promise.all(
      Array.from(fields).map((field) => this._validateField(field))
    );

    return {
      valid: results.every(Boolean),
      errors: this.errors,
    };
  }

  isValid() {
    return Object.keys(this.errors).length === 0;
  }

  clearValidation() {
    this.errors = {};
  }

  render() {
    return html`
      <form
        @submit=${(e) => {
          if (!this.isValid()) {
            e.preventDefault();
          }
        }}
      >
        <slot></slot>
        ${Object.entries(this.errors).map(
          ([field, error]) => html`
            <div class="error-message" data-field=${field}>${error}</div>
          `
        )}
      </form>
    `;
  }
}

customElements.define("neo-form", NeoForm);
