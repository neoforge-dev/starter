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
        font-size: 0.875rem;
        margin-top: 0.25rem;
      }

      .invalid-field {
        border-color: var(--color-error, #f44336) !important;
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
    const form = this.closest("form");
    if (!form) return;

    // Handle input events
    form.addEventListener("input", (e) => {
      const field = e.target;
      if (field.name) {
        this.touched = { ...this.touched, [field.name]: true };
        this.validateField(field);
      }
    });

    // Handle form submission
    form.addEventListener("submit", (e) => {
      const isValid = this.validateForm();
      if (!isValid) {
        e.preventDefault();
        this.markAllFieldsAsTouched();
      }
    });
  }

  validateField(field) {
    const { name, value } = field;
    const fieldRules = this.rules[name];

    if (!fieldRules) return true;

    let isValid = true;
    const errors = [];

    for (const [rule, param] of Object.entries(fieldRules)) {
      switch (rule) {
        case "required":
          if (param && !value.trim()) {
            isValid = false;
            errors.push(
              this.messages[name]?.required || "This field is required"
            );
          }
          break;

        case "minLength":
          if (value.length < param) {
            isValid = false;
            errors.push(
              this.messages[name]?.minLength ||
                `Minimum length is ${param} characters`
            );
          }
          break;

        case "maxLength":
          if (value.length > param) {
            isValid = false;
            errors.push(
              this.messages[name]?.maxLength ||
                `Maximum length is ${param} characters`
            );
          }
          break;

        case "pattern":
          if (!new RegExp(param).test(value)) {
            isValid = false;
            errors.push(this.messages[name]?.pattern || "Invalid format");
          }
          break;

        case "email":
          if (param && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            isValid = false;
            errors.push(this.messages[name]?.email || "Invalid email address");
          }
          break;

        case "custom":
          if (typeof param === "function") {
            const result = param(value);
            if (result !== true) {
              isValid = false;
              errors.push(
                result || this.messages[name]?.custom || "Invalid value"
              );
            }
          }
          break;
      }
    }

    this.errors = { ...this.errors, [name]: errors };
    this.updateFieldValidationUI(field, isValid, errors);
    return isValid;
  }

  validateForm() {
    const form = this.closest("form");
    if (!form) return true;

    let isValid = true;
    const formElements = form.elements;

    for (let i = 0; i < formElements.length; i++) {
      const field = formElements[i];
      if (field.name && this.rules[field.name]) {
        if (!this.validateField(field)) {
          isValid = false;
        }
      }
    }

    return isValid;
  }

  markAllFieldsAsTouched() {
    const form = this.closest("form");
    if (!form) return;

    const formElements = form.elements;
    const touched = {};

    for (let i = 0; i < formElements.length; i++) {
      const field = formElements[i];
      if (field.name) {
        touched[field.name] = true;
      }
    }

    this.touched = touched;
  }

  updateFieldValidationUI(field, isValid, errors) {
    // Remove existing error message
    const existingError = field.parentNode.querySelector(".error-message");
    if (existingError) {
      existingError.remove();
    }

    // Update field styling
    field.classList.toggle(
      "invalid-field",
      !isValid && this.touched[field.name]
    );

    // Add new error message if field is touched
    if (!isValid && this.touched[field.name] && errors.length > 0) {
      const errorElement = document.createElement("div");
      errorElement.className = "error-message";
      errorElement.textContent = errors[0];
      field.parentNode.appendChild(errorElement);
    }
  }

  render() {
    return html`<slot></slot>`;
  }
}

customElements.define("neo-form-validation", FormValidation);
