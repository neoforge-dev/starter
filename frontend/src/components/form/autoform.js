// Import from lit directly for test environment
import {
  html,
  css,
 } from 'lit';
import { BaseComponent } from "../base-component.js";
import { baseStyles } from "../../styles/base.js";

/**
 * @element neo-autoform
 * @description A form component that automatically generates form fields based on a JSON schema
 *
 * @prop {Object} schema - JSON schema defining the form structure
 * @prop {Object} value - Form data
 * @prop {string} layout - Form layout (vertical, horizontal, grid)
 * @prop {string} variant - Form variant (default, compact, floating)
 * @prop {boolean} disabled - Whether the form is disabled
 * @prop {boolean} readonly - Whether the form is readonly
 */
export class NeoAutoform extends BaseComponent {
  static get properties() {
    return {
      schema: { type: Object },
      value: { type: Object },
      layout: { type: String },
      variant: { type: String },
      disabled: { type: Boolean },
      readonly: { type: Boolean },
      _errors: { type: Object, state: true },
    };
  }

  static get styles() {
    return [
      baseStyles,
      css`
        :host {
          display: block;
        }

        .form {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
        }

        /* Layouts */
        .layout-vertical {
          flex-direction: column;
        }

        .layout-horizontal {
          flex-direction: row;
          flex-wrap: wrap;
        }

        .layout-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        }

        /* Variants */
        .variant-default {
          /* Default styles */
        }

        .variant-compact .form-field {
          margin-bottom: var(--spacing-sm);
        }

        .variant-compact label {
          font-size: 0.9rem;
        }

        .variant-floating label {
          position: absolute;
          top: -0.5rem;
          left: 0.5rem;
          background: var(--color-background);
          padding: 0 0.25rem;
          font-size: 0.8rem;
          transition: all 0.2s ease;
        }

        .variant-floating .form-field {
          position: relative;
          padding-top: 0.5rem;
        }

        /* Form elements */
        .form-field {
          margin-bottom: var(--spacing-md);
        }

        label {
          display: block;
          margin-bottom: var(--spacing-xs);
          font-weight: 500;
        }

        input,
        select,
        textarea {
          width: 100%;
          padding: var(--spacing-sm);
          border: 1px solid var(--color-border);
          border-radius: var(--border-radius-sm);
          font-family: inherit;
          font-size: inherit;
          background-color: var(--color-input-bg);
          color: var(--color-text);
        }

        input:focus,
        select:focus,
        textarea:focus {
          outline: none;
          border-color: var(--color-primary);
          box-shadow: 0 0 0 2px var(--color-primary-alpha);
        }

        .error-message {
          color: var(--color-error);
          font-size: 0.85rem;
          margin-top: var(--spacing-xs);
        }

        button[type="submit"] {
          padding: var(--spacing-sm) var(--spacing-md);
          background-color: var(--color-primary);
          color: white;
          border: none;
          border-radius: var(--border-radius-sm);
          cursor: pointer;
          font-weight: 500;
          align-self: flex-start;
        }

        button[type="submit"]:hover {
          background-color: var(--color-primary-dark);
        }

        button[type="submit"]:disabled {
          background-color: var(--color-disabled);
          cursor: not-allowed;
        }
      `,
    ];
  }

  constructor() {
    super();
    this.schema = {};
    this.value = {};
    this.layout = "vertical";
    this.variant = "default";
    this.disabled = false;
    this.readonly = false;
    this._errors = {};
  }

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener("input", this.handleInput);
    this.addEventListener("submit", this.handleSubmit);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener("input", this.handleInput);
    this.removeEventListener("submit", this.handleSubmit);
  }

  handleInput(e) {
    const target = e.target;
    const name = target.name;
    const value = target.type === "checkbox" ? target.checked : target.value;

    if (!name) return;

    // Update the value
    this.value = {
      ...this.value,
      [name]: value,
    };

    // Clear the error for this field
    if (this._errors[name]) {
      this._errors = {
        ...this._errors,
        [name]: null,
      };
    }

    // Dispatch change event
    this.dispatchEvent(
      new CustomEvent("neo-change", {
        detail: {
          name,
          value,
          formData: this.value,
        },
        bubbles: true,
        composed: true,
      })
    );
  }

  handleSubmit(e) {
    e.preventDefault();

    // Validate the form
    const errors = this.validateForm();
    this._errors = errors;

    if (Object.values(errors).some((error) => error)) {
      // Form has errors
      this.dispatchEvent(
        new CustomEvent("neo-invalid", {
          detail: {
            errors,
          },
          bubbles: true,
          composed: true,
        })
      );
      return;
    }

    // Form is valid
    this.dispatchEvent(
      new CustomEvent("neo-submit", {
        detail: {
          formData: this.value,
        },
        bubbles: true,
        composed: true,
      })
    );
  }

  validateForm() {
    const errors = {};
    const { properties, required = [] } = this.schema;

    if (!properties) return errors;

    // Check each property
    Object.entries(properties).forEach(([name, field]) => {
      // Required fields
      if (required.includes(name) && !this.value[name]) {
        errors[name] = `${field.title || name} is required`;
      }

      // Type validation
      if (this.value[name]) {
        if (field.type === "number" && isNaN(Number(this.value[name]))) {
          errors[name] = `${field.title || name} must be a number`;
        }

        if (field.type === "string") {
          // String length
          if (field.minLength && this.value[name].length < field.minLength) {
            errors[name] = `${field.title || name} must be at least ${
              field.minLength
            } characters`;
          }

          if (field.maxLength && this.value[name].length > field.maxLength) {
            errors[name] = `${field.title || name} must be at most ${
              field.maxLength
            } characters`;
          }

          // String format
          if (
            field.format === "email" &&
            !this.isValidEmail(this.value[name])
          ) {
            errors[name] = `${field.title || name} must be a valid email`;
          }
        }

        // Number range
        if (field.type === "number") {
          if (
            field.minimum !== undefined &&
            Number(this.value[name]) < field.minimum
          ) {
            errors[name] = `${field.title || name} must be at least ${
              field.minimum
            }`;
          }

          if (
            field.maximum !== undefined &&
            Number(this.value[name]) > field.maximum
          ) {
            errors[name] = `${field.title || name} must be at most ${
              field.maximum
            }`;
          }
        }
      }
    });

    return errors;
  }

  getFieldError(name) {
    return this._errors[name] || null;
  }

  isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  render() {
    if (!this.schema || !this.schema.properties) {
      return html`<div>No schema provided</div>`;
    }

    return html`
      <form
        class="form layout-${this.layout} variant-${this.variant}"
        ?disabled=${this.disabled}
        ?readonly=${this.readonly}
      >
        ${this.schema.title ? html`<h2>${this.schema.title}</h2>` : ""}
        ${this.schema.description
          ? html`<p>${this.schema.description}</p>`
          : ""}
        ${Object.entries(this.schema.properties).map(([name, field]) =>
          this.renderField(name, field)
        )}

        <button type="submit" ?disabled=${this.disabled}>Submit</button>
      </form>
    `;
  }

  renderField(name, field) {
    const value = this.value[name] || "";
    const error = this.getFieldError(name);
    const required = this.schema.required?.includes(name);

    return html`
      <div class="form-field">
        <label for="${name}">
          ${field.title || name}
          ${required ? html`<span class="required">*</span>` : ""}
        </label>

        ${field.type === "string"
          ? html`
              <input
                type="${field.format === "email" ? "email" : "text"}"
                id="${name}"
                name="${name}"
                .value="${value}"
                ?disabled=${this.disabled}
                ?readonly=${this.readonly}
                ?required=${required}
                minlength="${field.minLength || ""}"
                maxlength="${field.maxLength || ""}"
              />
            `
          : field.type === "number"
            ? html`
                <input
                  type="number"
                  id="${name}"
                  name="${name}"
                  .value="${value}"
                  ?disabled=${this.disabled}
                  ?readonly=${this.readonly}
                  ?required=${required}
                  min="${field.minimum !== undefined ? field.minimum : ""}"
                  max="${field.maximum !== undefined ? field.maximum : ""}"
                />
              `
            : field.type === "boolean"
              ? html`
                  <input
                    type="checkbox"
                    id="${name}"
                    name="${name}"
                    .checked="${Boolean(value)}"
                    ?disabled=${this.disabled}
                    ?readonly=${this.readonly}
                  />
                `
              : html`<div>Unsupported field type: ${field.type}</div>`}
        ${error ? html`<div class="error-message">${error}</div>` : ""}
      </div>
    `;
  }
}

// Register the component
if (!customElements.get("neo-autoform")) {
  customElements.define("neo-autoform", NeoAutoform);
}
