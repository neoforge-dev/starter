import { LitElement, html, css } from "lit";

export class FormValidation extends LitElement {
  static get properties() {
    return {
      rules: { type: Object },
      messages: { type: Object },
      errors: { type: Object },
      touched: { type: Object },
    };
  }

  static get styles() {
    return css`
      :host {
        display: block;
      }

      .error-message {
        color: var(--color-error, #f44336);
        font-size: 12px;
        margin-top: 4px;
      }

      ::slotted(input),
      ::slotted(select),
      ::slotted(textarea) {
        border-color: var(--color-border);
      }

      ::slotted(input:invalid),
      ::slotted(select:invalid),
      ::slotted(textarea:invalid) {
        border-color: var(--color-error, #f44336);
      }
    `;
  }

  constructor() {
    super();
    this.rules = {};
    this.messages = {};
    this.errors = {};
    this.touched = {};
  }

  connectedCallback() {
    super.connectedCallback();
    this.setupValidation();
  }

  setupValidation() {
    const inputs = this.querySelectorAll("input, select, textarea");
    inputs.forEach((input) => {
      input.addEventListener("blur", () => this.handleBlur(input));
      input.addEventListener("input", () => this.validateField(input));
    });
  }

  handleBlur(input) {
    this.touched = { ...this.touched, [input.name]: true };
    this.validateField(input);
  }

  validateField(input) {
    const name = input.name;
    const value = input.value;
    const rules = this.rules[name] || {};
    const messages = this.messages[name] || {};
    let error = "";

    // Required validation
    if (rules.required && !value) {
      error = messages.required || "This field is required";
    }

    // Pattern validation
    if (rules.pattern && !new RegExp(rules.pattern).test(value)) {
      error = messages.pattern || "Invalid format";
    }

    // Min length validation
    if (rules.minLength && value.length < rules.minLength) {
      error = messages.minLength || `Minimum length is ${rules.minLength}`;
    }

    // Max length validation
    if (rules.maxLength && value.length > rules.maxLength) {
      error = messages.maxLength || `Maximum length is ${rules.maxLength}`;
    }

    // Custom validation
    if (rules.validate && !rules.validate(value)) {
      error = messages.validate || "Invalid value";
    }

    this.errors = { ...this.errors, [name]: error };
    this.requestUpdate();
  }

  validateForm() {
    const inputs = this.querySelectorAll("input, select, textarea");
    inputs.forEach((input) => this.validateField(input));
    return Object.values(this.errors).every((error) => !error);
  }

  render() {
    return html`
      <slot></slot>
      ${Object.entries(this.errors).map(
        ([name, error]) =>
          this.touched[name] &&
          error &&
          html`<div class="error-message">${error}</div>`
      )}
    `;
  }
}

customElements.define("neo-form-validation", FormValidation);
