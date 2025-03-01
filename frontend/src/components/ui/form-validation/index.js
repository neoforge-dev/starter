import {
  LitElement,
  html,
  css,
} from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";

export class FormValidation extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    .error-message {
      color: var(--color-error, #dc2626);
      font-size: 0.875rem;
      margin-top: var(--spacing-xs, 0.25rem);
      animation: slideIn 0.2s ease-out;
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(-4px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .validation-icon {
      display: inline-flex;
      align-items: center;
      margin-right: var(--spacing-xs, 0.25rem);
    }

    .validation-list {
      margin-top: var(--spacing-sm, 0.5rem);
      padding-left: var(--spacing-md, 1rem);
    }

    .validation-item {
      display: flex;
      align-items: center;
      margin-bottom: var(--spacing-xs, 0.25rem);
      color: var(--color-text-secondary, #6b7280);
    }

    .validation-item.valid {
      color: var(--color-success, #16a34a);
    }

    .validation-item.invalid {
      color: var(--color-error, #dc2626);
    }
  `;

  static properties = {
    value: { type: String },
    rules: { type: Array },
    showValidation: { type: Boolean },
    validationResults: { type: Array, state: true },
    isValid: { type: Boolean, state: true },
    errors: { type: Array, state: true },
    touched: { type: Boolean, state: true },
    required: { type: Boolean, reflect: true },
    type: { type: String, reflect: true },
    minlength: { type: Number, reflect: true },
    maxlength: { type: Number, reflect: true },
    pattern: { type: String, reflect: true },
  };

  constructor() {
    super();
    this.value = "";
    this.rules = [];
    this.showValidation = false;
    this.validationResults = [];
    this.isValid = false;
    this.errors = [];
    this.touched = false;
    this.required = false;
    this.type = "";
    this.minlength = 0;
    this.maxlength = 0;
    this.pattern = "";
  }

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener("blur", this._handleBlur.bind(this));
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener("blur", this._handleBlur.bind(this));
  }

  _handleBlur() {
    this.touched = true;
    this._validateAll();
  }

  updated(changedProperties) {
    if (
      changedProperties.has("value") ||
      changedProperties.has("required") ||
      changedProperties.has("type") ||
      changedProperties.has("minlength") ||
      changedProperties.has("maxlength") ||
      changedProperties.has("pattern")
    ) {
      this._validateAll();
    }
  }

  _validateAll() {
    this.errors = [];

    // Required validation
    if (this.required && (!this.value || this.value.trim() === "")) {
      this.errors.push("This field is required");
    }

    // Email validation
    if (
      this.type === "email" &&
      this.value &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.value)
    ) {
      this.errors.push("Please enter a valid email address");
    }

    // Minlength validation
    if (
      this.minlength > 0 &&
      this.value &&
      this.value.length < this.minlength
    ) {
      this.errors.push(`Minimum length is ${this.minlength} characters`);
    }

    // Maxlength validation
    if (
      this.maxlength > 0 &&
      this.value &&
      this.value.length > this.maxlength
    ) {
      this.errors.push(`Maximum length is ${this.maxlength} characters`);
    }

    // Pattern validation
    if (this.pattern && this.value) {
      const regex = new RegExp(this.pattern);
      if (!regex.test(this.value)) {
        this.errors.push("Please match the requested format");
      }
    }

    // Custom rules validation
    if (this.rules && this.rules.length) {
      this.validationResults = this.rules.map((rule) => {
        const isValid = rule.test(this.value);
        if (!isValid) {
          this.errors.push(rule.message);
        }
        return {
          message: rule.message,
          isValid,
        };
      });
    }

    this.isValid = this.errors.length === 0;
    this._dispatchValidation();
  }

  _dispatchValidation() {
    this.dispatchEvent(
      new CustomEvent("validation", {
        detail: {
          isValid: this.isValid,
          results: this.validationResults,
          errors: this.errors,
        },
        bubbles: true,
        composed: true,
      })
    );
  }

  render() {
    return html`
      <slot></slot>
      ${this.touched && this.errors.length > 0
        ? html`
            <div class="validation-list">
              ${this.errors.map(
                (error) => html`
                  <div class="validation-item invalid">
                    <span class="validation-icon">✗</span>
                    <span>${error}</span>
                  </div>
                `
              )}
            </div>
          `
        : ""}
    `;
  }
}

customElements.define("form-validation", FormValidation);
