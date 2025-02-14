import {
  LitElement,
  html,
  css,
} from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";

export class NeoAutoform extends LitElement {
  static properties = {
    schema: { type: Object },
    value: { type: Object },
    variant: { type: String },
    layout: { type: String },
    columns: { type: Number },
    disabled: { type: Boolean },
    readonly: { type: Boolean },
    showValidation: { type: Boolean },
    _errors: { type: Object, state: true },
    _touched: { type: Set, state: true },
    _formData: { type: Object, state: true },
  };

  static styles = css`
    :host {
      display: block;
      font-family: system-ui, sans-serif;
    }

    .autoform {
      width: 100%;
    }

    /* Form Title & Description */
    .form-title {
      font-size: 1.5rem;
      font-weight: 600;
      color: #111827;
      margin: 0 0 0.5rem 0;
    }

    .form-description {
      font-size: 0.875rem;
      color: #6b7280;
      margin: 0 0 2rem 0;
    }

    /* Layout Variants */
    .layout-vertical {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .layout-horizontal {
      display: grid;
      grid-template-columns: 200px 1fr;
      gap: 2rem;
      align-items: start;
    }

    .layout-grid {
      display: grid;
      gap: 1.5rem;
      grid-template-columns: repeat(var(--form-columns, 2), 1fr);
    }

    /* Form Group */
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .form-group.horizontal {
      display: contents;
    }

    .form-group.horizontal .form-label {
      padding-top: 0.5rem;
    }

    /* Form Label */
    .form-label {
      font-size: 0.875rem;
      font-weight: 500;
      color: #374151;
    }

    .form-label.required::after {
      content: "*";
      color: #dc2626;
      margin-left: 0.25rem;
    }

    .form-description {
      font-size: 0.75rem;
      color: #6b7280;
    }

    /* Form Controls */
    .form-control {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    /* Input Variants */
    .input-default {
      padding: 0.5rem 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 0.375rem;
      font-size: 0.875rem;
      color: #111827;
      background-color: white;
      transition: all 0.2s;
    }

    .input-default:focus {
      outline: none;
      border-color: #2563eb;
      box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
    }

    .input-default:disabled {
      background-color: #f3f4f6;
      cursor: not-allowed;
    }

    .input-default.error {
      border-color: #dc2626;
    }

    /* Compact Variant */
    .variant-compact .input-default {
      padding: 0.375rem 0.5rem;
      font-size: 0.75rem;
    }

    .variant-compact .form-group {
      gap: 0.25rem;
    }

    /* Floating Variant */
    .variant-floating .form-group {
      position: relative;
    }

    .variant-floating .form-label {
      position: absolute;
      left: 0.75rem;
      top: 0.5rem;
      font-size: 0.875rem;
      color: #6b7280;
      pointer-events: none;
      transition: all 0.2s;
      background-color: white;
      padding: 0 0.25rem;
    }

    .variant-floating .input-default:focus + .form-label,
    .variant-floating .input-default:not(:placeholder-shown) + .form-label {
      transform: translateY(-1.4rem) scale(0.85);
      color: #2563eb;
    }

    /* Validation Messages */
    .validation-message {
      font-size: 0.75rem;
      color: #dc2626;
    }

    /* Special Input Types */
    textarea.input-default {
      min-height: 100px;
      resize: vertical;
    }

    select.input-default {
      padding-right: 2rem;
      background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
      background-position: right 0.5rem center;
      background-repeat: no-repeat;
      background-size: 1.5em 1.5em;
      -webkit-appearance: none;
      -moz-appearance: none;
      appearance: none;
    }

    /* Form Actions */
    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      margin-top: 2rem;
    }

    .button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0.5rem 1rem;
      font-size: 0.875rem;
      font-weight: 500;
      border-radius: 0.375rem;
      border: none;
      cursor: pointer;
      transition: all 0.2s;
    }

    .button-primary {
      background-color: #2563eb;
      color: white;
    }

    .button-primary:hover {
      background-color: #1d4ed8;
    }

    .button-secondary {
      background-color: white;
      border: 1px solid #d1d5db;
      color: #374151;
    }

    .button-secondary:hover {
      background-color: #f3f4f6;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .layout-horizontal {
        grid-template-columns: 1fr;
      }

      .layout-grid {
        grid-template-columns: 1fr;
      }

      .form-group.horizontal {
        display: flex;
      }
    }
  `;

  constructor() {
    super();
    this.schema = {};
    this.value = {};
    this.variant = "default";
    this.layout = "vertical";
    this.columns = 2;
    this.disabled = false;
    this.readonly = false;
    this.showValidation = true;
    this._errors = {};
    this._touched = new Set();
    this._formData = {};
  }

  firstUpdated() {
    this._formData = { ...this.value };
  }

  updated(changedProperties) {
    if (changedProperties.has("value")) {
      this._formData = { ...this.value };
    }
  }

  _validateField(field, value) {
    const schema = this.schema.properties[field];
    const errors = [];

    // Check required fields first
    if (this.schema.required?.includes(field) && !value) {
      errors.push("This field is required");
    }

    if (value) {
      if (schema.minLength && value.length < schema.minLength) {
        errors.push(`Minimum length is ${schema.minLength} characters`);
      }

      if (schema.maxLength && value.length > schema.maxLength) {
        errors.push(`Maximum length is ${schema.maxLength} characters`);
      }

      if (schema.pattern && !new RegExp(schema.pattern).test(value)) {
        errors.push("Invalid format");
      }

      if (
        schema.format === "email" &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
      ) {
        errors.push("Invalid email address");
      }

      if (schema.type === "number") {
        const num = Number(value);
        if (isNaN(num)) {
          errors.push("Must be a number");
        } else {
          if (schema.minimum !== undefined && num < schema.minimum) {
            errors.push(`Minimum value is ${schema.minimum}`);
          }
          if (schema.maximum !== undefined && num > schema.maximum) {
            errors.push(`Maximum value is ${schema.maximum}`);
          }
        }
      }

      if (schema.type === "array") {
        if (schema.minItems && value.length < schema.minItems) {
          errors.push(`Minimum ${schema.minItems} items required`);
        }
        if (schema.maxItems && value.length > schema.maxItems) {
          errors.push(`Maximum ${schema.maxItems} items allowed`);
        }
      }
    }

    return errors;
  }

  _validateForm() {
    const errors = {};
    Object.keys(this.schema.properties).forEach((field) => {
      const value = this._formData[field];
      const fieldErrors = this._validateField(field, value);
      if (fieldErrors.length) {
        errors[field] = fieldErrors;
      }
    });

    this._errors = errors;
    const isValid = Object.keys(errors).length === 0;
    this.dispatchEvent(
      new CustomEvent("validate", {
        detail: { valid: isValid, errors },
        bubbles: true,
        composed: true,
      })
    );

    return isValid;
  }

  _handleChange(field, event) {
    const value =
      event.target.type === "checkbox"
        ? event.target.checked
        : event.target.value;
    this._formData = { ...this._formData, [field]: value };
    this._touched.add(field);

    if (this.showValidation) {
      const fieldErrors = this._validateField(field, value);
      this._errors = { ...this._errors, [field]: fieldErrors };
    }

    this.dispatchEvent(
      new CustomEvent("change", {
        detail: { field, value, formData: this._formData },
        bubbles: true,
        composed: true,
      })
    );
  }

  _handleSubmit(e) {
    e.preventDefault();
    const isValid = this._validateForm();

    if (isValid) {
      this.dispatchEvent(
        new CustomEvent("submit", {
          detail: { formData: this._formData },
          bubbles: true,
          composed: true,
        })
      );
    }
  }

  _renderField(field, schema) {
    const value = this._formData[field] || "";
    const errors = this._errors[field] || [];
    const showError =
      this.showValidation && this._touched.has(field) && errors.length > 0;

    let input;
    switch (schema.type) {
      case "string":
        switch (schema.format) {
          case "password":
            input = html`
              <input
                type="password"
                class="input-default ${showError ? "error" : ""}"
                .value=${value}
                ?disabled=${this.disabled}
                ?readonly=${this.readonly}
                @input=${(e) => this._handleChange(field, e)}
              />
            `;
            break;
          case "email":
            input = html`
              <input
                type="email"
                class="input-default ${showError ? "error" : ""}"
                .value=${value}
                ?disabled=${this.disabled}
                ?readonly=${this.readonly}
                @input=${(e) => this._handleChange(field, e)}
              />
            `;
            break;
          case "textarea":
            input = html`
              <textarea
                class="input-default ${showError ? "error" : ""}"
                .value=${value}
                ?disabled=${this.disabled}
                ?readonly=${this.readonly}
                @input=${(e) => this._handleChange(field, e)}
              ></textarea>
            `;
            break;
          case "file":
            input = html`
              <input
                type="file"
                class="input-default ${showError ? "error" : ""}"
                accept=${schema.accept || ""}
                ?disabled=${this.disabled}
                ?readonly=${this.readonly}
                @change=${(e) => this._handleChange(field, e)}
              />
            `;
            break;
          case "color":
            input = html`
              <ui-color-picker
                .value=${value}
                ?disabled=${this.disabled}
                ?readonly=${this.readonly}
                @change=${(e) =>
                  this._handleChange(field, {
                    target: { value: e.detail.value },
                  })}
              ></ui-color-picker>
            `;
            break;
          case "country":
            input = html`
              <ui-country-select
                .value=${value}
                ?disabled=${this.disabled}
                ?readonly=${this.readonly}
                @change=${(e) =>
                  this._handleChange(field, {
                    target: { value: e.detail.value },
                  })}
              ></ui-country-select>
            `;
            break;
          case "phone":
            input = html`
              <ui-phone-input
                .value=${value}
                ?disabled=${this.disabled}
                ?readonly=${this.readonly}
                @change=${(e) =>
                  this._handleChange(field, {
                    target: { value: e.detail.value },
                  })}
              ></ui-phone-input>
            `;
            break;
          default:
            input = html`
              <input
                type="text"
                class="input-default ${showError ? "error" : ""}"
                .value=${value}
                ?disabled=${this.disabled}
                ?readonly=${this.readonly}
                @input=${(e) => this._handleChange(field, e)}
              />
            `;
        }
        break;

      case "number":
        input = html`
          <input
            type="number"
            class="input-default ${showError ? "error" : ""}"
            .value=${value}
            min=${schema.minimum}
            max=${schema.maximum}
            ?disabled=${this.disabled}
            ?readonly=${this.readonly}
            @input=${(e) => this._handleChange(field, e)}
          />
        `;
        break;

      case "boolean":
        input = html`
          <input
            type="checkbox"
            .checked=${value}
            ?disabled=${this.disabled}
            ?readonly=${this.readonly}
            @change=${(e) => this._handleChange(field, e)}
          />
        `;
        break;

      case "array":
        if (schema.format === "tags") {
          input = html`
            <ui-tags-input
              .value=${value || []}
              ?disabled=${this.disabled}
              ?readonly=${this.readonly}
              @change=${(e) =>
                this._handleChange(field, {
                  target: { value: e.detail.value },
                })}
            ></ui-tags-input>
          `;
        } else {
          input = html`
            <div class="array-inputs">
              ${(value || []).map(
                (item, index) => html`
                  <div class="array-item">
                    ${this._renderField(`${field}.${index}`, schema.items)}
                    <button
                      type="button"
                      class="button button-secondary"
                      @click=${() => {
                        const newValue = [...value];
                        newValue.splice(index, 1);
                        this._handleChange(field, {
                          target: { value: newValue },
                        });
                      }}
                    >
                      Remove
                    </button>
                  </div>
                `
              )}
              <button
                type="button"
                class="button button-secondary"
                @click=${() => {
                  const newValue = [...(value || []), ""];
                  this._handleChange(field, { target: { value: newValue } });
                }}
              >
                Add Item
              </button>
            </div>
          `;
        }
        break;
    }

    if (schema.enum) {
      input = html`
        <select
          class="input-default ${showError ? "error" : ""}"
          .value=${value}
          ?disabled=${this.disabled}
          ?readonly=${this.readonly}
          @change=${(e) => this._handleChange(field, e)}
        >
          <option value="">Select ${schema.title}</option>
          ${schema.enum.map(
            (option) => html` <option value=${option}>${option}</option> `
          )}
        </select>
      `;
    }

    return html`
      <div
        class="form-group ${this.layout === "horizontal" ? "horizontal" : ""}"
      >
        <label
          class="form-label ${this.schema.required?.includes(field)
            ? "required"
            : ""}"
        >
          ${schema.title}
        </label>
        <div class="form-control">
          ${input}
          ${schema.description
            ? html` <div class="form-description">${schema.description}</div> `
            : ""}
          ${showError
            ? html` <div class="validation-message">${errors[0]}</div> `
            : ""}
        </div>
      </div>
    `;
  }

  render() {
    if (!this.schema || !this.schema.properties) return "";

    return html`
      <form
        class="autoform variant-${this.variant}"
        @submit=${this._handleSubmit}
      >
        ${this.schema.title
          ? html` <h2 class="form-title">${this.schema.title}</h2> `
          : ""}
        ${this.schema.description
          ? html` <p class="form-description">${this.schema.description}</p> `
          : ""}

        <div
          class="layout-${this.layout}"
          style="--form-columns: ${this.columns}"
        >
          ${Object.entries(this.schema.properties).map(([field, schema]) =>
            this._renderField(field, schema)
          )}
        </div>

        <div class="form-actions">
          <button type="button" class="button button-secondary">Cancel</button>
          <button type="submit" class="button button-primary">Submit</button>
        </div>
      </form>
    `;
  }
}

customElements.define("neo-autoform", NeoAutoform);
