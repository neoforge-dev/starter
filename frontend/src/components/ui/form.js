import {
  html,
  css,
} from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";
import {
  BaseComponent,
  defineComponent,
} from "../../components/base-component.js";
import { baseStyles } from "../../styles/base.js";

/**
 * @element ui-form
 * @description A form component that handles validation, submission, and field management
 */
export class UIForm extends BaseComponent {
  static get properties() {
    return {
      config: { type: Object },
      submitText: { type: String },
      asyncValidators: { type: Object },
      formData: { type: Object, state: true },
      errors: { type: Array, state: true },
    };
  }

  static get styles() {
    return [
      baseStyles,
      css`
        :host {
          display: block;
        }

        .form-field {
          margin-bottom: 1rem;
        }

        label {
          display: block;
          margin-bottom: 0.5rem;
        }

        input,
        textarea,
        select {
          width: 100%;
          padding: 0.5rem;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
        }

        input[type="checkbox"] {
          width: auto;
        }

        .error-message {
          color: var(--color-error);
          font-size: 0.875rem;
          margin-top: 0.25rem;
        }

        button[type="submit"] {
          background: var(--color-primary);
          color: white;
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: var(--radius-sm);
          cursor: pointer;
        }

        button[type="submit"]:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
      `,
    ];
  }

  constructor() {
    super();
    this.config = { fields: [] };
    this.submitText = "Submit";
    this.asyncValidators = {};
    this.formData = {};
    this.errors = [];

    // Ensure shadow root is created
    if (!this.shadowRoot) {
      this.attachShadow({ mode: "open" });
    }
  }

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener("submit", this.handleSubmit);
    this.addEventListener("input", this.handleInput);
    this.addEventListener("change", this.handleInput);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener("submit", this.handleSubmit);
    this.removeEventListener("input", this.handleInput);
    this.removeEventListener("change", this.handleInput);
  }

  async handleSubmit(event) {
    event.preventDefault();

    const form = event.target;
    const isValid = await this.validateForm(form);

    if (!isValid) {
      this.dispatchEvent(
        new CustomEvent("form-error", {
          detail: { errors: this.errors },
          bubbles: true,
          composed: true,
        })
      );
      return;
    }

    this.dispatchEvent(
      new CustomEvent("form-submit", {
        detail: { data: this.formData },
        bubbles: true,
        composed: true,
      })
    );
  }

  handleInput(event) {
    const field = event.target;
    const name = field.name;
    const value = field.type === "checkbox" ? field.checked : field.value;

    this.formData = {
      ...this.formData,
      [name]: value,
    };

    this.validateField(field);
  }

  async validateField(field) {
    const name = field.name;
    const config = this.config.fields.find((f) => f.name === name);

    if (!config) return true;

    const errors = [];

    // Required validation
    if (config.required && !field.value) {
      errors.push(`${config.label} is required`);
    }

    // Pattern validation
    if (config.validation?.pattern && field.value) {
      const regex = new RegExp(config.validation.pattern);
      if (!regex.test(field.value)) {
        errors.push(`${config.label} format is invalid`);
      }
    }

    // Length validation
    if (
      config.validation?.minLength &&
      field.value.length < config.validation.minLength
    ) {
      errors.push(
        `${config.label} must be at least ${config.validation.minLength} characters`
      );
    }

    if (
      config.validation?.maxLength &&
      field.value.length > config.validation.maxLength
    ) {
      errors.push(
        `${config.label} must be at most ${config.validation.maxLength} characters`
      );
    }

    // Email validation
    if (config.type === "email" && field.value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(field.value)) {
        errors.push("Invalid email format");
      }
    }

    // Password validation
    if (config.type === "password" && field.value) {
      if (config.validation?.pattern) {
        const regex = new RegExp(config.validation.pattern);
        if (!regex.test(field.value)) {
          errors.push(
            "Password must contain at least one uppercase letter, one lowercase letter, and one number"
          );
        }
      }
    }

    // Async validation
    if (this.asyncValidators[name]) {
      try {
        const isValid = await this.asyncValidators[name](field.value);
        if (!isValid) {
          errors.push(`${config.label} validation failed`);
        }
      } catch (error) {
        errors.push(`${config.label} validation error: ${error.message}`);
      }
    }

    // Custom validation message
    const customError = field.validationMessage;
    if (customError) {
      errors.push(customError);
    }

    // Update errors
    this.errors = this.errors.filter((e) => !e.startsWith(config.label));
    if (errors.length) {
      this.errors = [...this.errors, ...errors];
    }

    return errors.length === 0;
  }

  async validateForm(form) {
    this.errors = [];
    const fields = Array.from(form.elements).filter((el) => el.name);
    const validations = fields.map((field) => this.validateField(field));
    await Promise.all(validations);
    return this.errors.length === 0;
  }

  render() {
    return html`
      <form>
        ${this.config.fields.map(
          (field) => html`
            <div class="form-field">
              <label for=${field.name}>${field.label}</label>
              ${field.type === "textarea"
                ? html`<textarea
                    id=${field.name}
                    name=${field.name}
                    ?required=${field.required}
                  ></textarea>`
                : html`<input
                    type=${field.type}
                    id=${field.name}
                    name=${field.name}
                    ?required=${field.required}
                  />`}
              ${this.errors
                .filter((error) => error.startsWith(field.label))
                .map(
                  (error) => html`<div class="error-message">${error}</div>`
                )}
            </div>
          `
        )}
        <button type="submit">${this.submitText}</button>
      </form>
    `;
  }
}

// Register the component
defineComponent("ui-form", UIForm);
