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
    this.schema = {
      title: "",
      description: "",
      properties: {},
    };
    this.value = {};
    this.variant = "default";
    this.layout = "vertical";
    this.columns = 2;
    this.disabled = false;
    this.readonly = false;
    this.showValidation = false;
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
      this.requestUpdate();
    }
    if (changedProperties.has("schema")) {
      this._formData = { ...this.value };
      this.requestUpdate();
    }
  }

  _validateForm() {
    const errors = {};
    const { properties = {}, required = [] } = this.schema;

    // Validate required fields
    for (const field of required) {
      if (!this._formData[field]) {
        errors[field] = [`${field} is required`];
      }
    }

    // Validate field constraints
    for (const [field, schema] of Object.entries(properties)) {
      const value = this._formData[field];

      if (schema.type === "string") {
        if (!value) continue;
        if (schema.minLength && value.length < schema.minLength) {
          errors[field] = [
            `Field must have minimum length of ${schema.minLength}`,
          ];
        }
        if (schema.maxLength && value.length > schema.maxLength) {
          errors[field] = [
            `Field must have maximum length of ${schema.maxLength}`,
          ];
        }
        if (schema.pattern && !new RegExp(schema.pattern).test(value)) {
          errors[field] = ["Invalid format"];
        }
        if (
          schema.format === "email" &&
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
        ) {
          errors[field] = ["Invalid email address"];
        }
      }

      if (schema.type === "number") {
        if (!value) continue;
        const num = Number(value);
        if (schema.minimum && num < schema.minimum) {
          errors[field] = [`Minimum value is ${schema.minimum}`];
        }
        if (schema.maximum && num > schema.maximum) {
          errors[field] = [`Maximum value is ${schema.maximum}`];
        }
      }

      if (schema.type === "array") {
        if (schema.optional && !value) continue;
        const arrayValue = Array.isArray(value) ? value : [];
        if (schema.minItems && arrayValue.length < schema.minItems) {
          errors[field] = [`Minimum ${schema.minItems} items required`];
        }
        if (schema.maxItems && arrayValue.length > schema.maxItems) {
          errors[field] = [`Maximum ${schema.maxItems} items allowed`];
        }
      }
    }

    this._errors = errors;
    const valid = Object.keys(errors).length === 0;

    this.dispatchEvent(
      new CustomEvent("validate", {
        detail: { valid, errors },
      })
    );

    return valid;
  }

  _handleChange(field, event) {
    const value =
      event.target.type === "checkbox"
        ? event.target.checked
        : event.target.value;
    this._formData = {
      ...this._formData,
      [field]: value,
    };

    this.dispatchEvent(
      new CustomEvent("change", {
        detail: {
          field,
          value,
          formData: this._formData,
        },
      })
    );
  }

  _handleBlur(field, event) {
    this._touched.add(field);
    if (this.showValidation) {
      this._validateForm();
    }
  }

  _handleSubmit(event) {
    event.preventDefault();
    const valid = this._validateForm();

    this.dispatchEvent(
      new CustomEvent("submit", {
        detail: {
          valid,
          data: this._formData,
          errors: this._errors,
        },
      })
    );
  }

  _renderField(field, schema) {
    const value = this._formData[field] ?? "";
    const errors = this._errors[field] || [];
    const showError =
      this.showValidation && this._touched.has(field) && errors.length > 0;

    let input;
    if (schema.enum) {
      const enumOptions = schema.enum.map((option) => ({
        value: option,
        label: option.charAt(0).toUpperCase() + option.slice(1),
      }));

      input = html`
        <select
          name="${field}"
          class="input-default ${showError ? "error" : ""}"
          .value=${value}
          ?disabled=${this.disabled}
          ?readonly=${this.readonly}
          @change=${(e) => this._handleChange(field, e)}
          @blur=${(e) => this._handleBlur(field, e)}
        >
          <option value="">Select ${schema.title}</option>
          ${enumOptions.map(
            (option) =>
              html`<option value=${option.value}>${option.label}</option>`
          )}
        </select>
      `;
    } else {
      switch (schema.type) {
        case "string":
          switch (schema.format) {
            case "password":
              input = html`
                <input
                  name="${field}"
                  type="password"
                  class="input-default ${showError ? "error" : ""}"
                  .value=${value}
                  ?disabled=${this.disabled}
                  ?readonly=${this.readonly}
                  @input=${(e) => this._handleChange(field, e)}
                  @blur=${(e) => this._handleBlur(field, e)}
                />
              `;
              break;
            case "email":
              input = html`
                <input
                  name="${field}"
                  type="email"
                  class="input-default ${showError ? "error" : ""}"
                  .value=${value}
                  ?disabled=${this.disabled}
                  ?readonly=${this.readonly}
                  @input=${(e) => this._handleChange(field, e)}
                  @blur=${(e) => this._handleBlur(field, e)}
                />
              `;
              break;
            case "textarea":
              input = html`
                <textarea
                  name="${field}"
                  class="input-default ${showError ? "error" : ""}"
                  .value=${value}
                  maxlength=${schema.maxLength}
                  ?disabled=${this.disabled}
                  ?readonly=${this.readonly}
                  @input=${(e) => this._handleChange(field, e)}
                  @blur=${(e) => this._handleBlur(field, e)}
                ></textarea>
              `;
              break;
            default:
              input = html`
                <input
                  name="${field}"
                  type="text"
                  class="input-default ${showError ? "error" : ""}"
                  .value=${value}
                  ?disabled=${this.disabled}
                  ?readonly=${this.readonly}
                  @input=${(e) => this._handleChange(field, e)}
                  @blur=${(e) => this._handleBlur(field, e)}
                />
              `;
          }
          break;

        case "number":
          input = html`
            <input
              name="${field}"
              type="number"
              class="input-default ${showError ? "error" : ""}"
              .value=${value}
              min=${schema.minimum}
              max=${schema.maximum}
              ?disabled=${this.disabled}
              ?readonly=${this.readonly}
              @input=${(e) => this._handleChange(field, e)}
              @blur=${(e) => this._handleBlur(field, e)}
            />
          `;
          break;

        case "boolean":
          input = html`
            <input
              name="${field}"
              type="checkbox"
              .checked=${value}
              ?disabled=${this.disabled}
              ?readonly=${this.readonly}
              @change=${(e) => this._handleChange(field, e)}
              @blur=${(e) => this._handleBlur(field, e)}
            />
          `;
          break;

        case "array":
          input = html`
            <input
              name="${field}"
              type="text"
              class="input-default ${showError ? "error" : ""}"
              .value=${(value || []).join(", ")}
              ?disabled=${this.disabled}
              ?readonly=${this.readonly}
              @input=${(e) =>
                this._handleChange(field, {
                  target: {
                    value: e.target.value.split(",").map((v) => v.trim()),
                  },
                })}
              @blur=${(e) => this._handleBlur(field, e)}
            />
          `;
          break;
      }
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
    const { title = "", description = "", properties = {} } = this.schema;
    return html`
      <form
        class="autoform variant-${this.variant}"
        @submit=${this._handleSubmit}
      >
        ${title ? html`<h2 class="form-title">${title}</h2>` : ""}
        ${description
          ? html`<p class="form-description">${description}</p>`
          : ""}

        <div
          class="layout-${this.layout}"
          style="--form-columns: ${this.columns}"
        >
          ${Object.entries(properties).map(([field, schema]) =>
            this._renderField(field, schema)
          )}
        </div>
      </form>
    `;
  }
}

customElements.define("neo-autoform", NeoAutoform);
