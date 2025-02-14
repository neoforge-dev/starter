import { LitElement, html, css } from "lit";
import { classMap } from "lit/directives/class-map.js";

export class NeoInput extends LitElement {
  static properties = {
    type: { type: String },
    label: { type: String },
    placeholder: { type: String },
    value: { type: String },
    required: { type: Boolean },
    disabled: { type: Boolean },
    error: { type: String },
    helper: { type: String },
    pattern: { type: String },
    minLength: { type: Number },
    maxLength: { type: Number },
  };

  static styles = css`
    :host {
      display: block;
    }

    .input-container {
      position: relative;
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xs);
    }

    label {
      color: var(--color-text);
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
    }

    .input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    input {
      width: 100%;
      padding: var(--spacing-sm);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      font-family: var(--font-family-primary);
      font-size: var(--font-size-md);
      color: var(--color-text);
      background: var(--color-surface);
      transition: all 0.2s ease-in-out;
    }

    input:focus {
      outline: none;
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px var(--color-primary-alpha);
    }

    input:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    input[type="password"] {
      padding-right: var(--spacing-xl);
    }

    .error input {
      border-color: var(--color-error);
    }

    .error input:focus {
      box-shadow: 0 0 0 3px var(--color-error-alpha);
    }

    .helper-text,
    .error-text {
      font-size: var(--font-size-sm);
      margin-top: var(--spacing-xs);
    }

    .helper-text {
      color: var(--color-text-secondary);
    }

    .error-text {
      color: var(--color-error);
    }

    .password-toggle {
      position: absolute;
      right: var(--spacing-sm);
      background: none;
      border: none;
      color: var(--color-text-secondary);
      cursor: pointer;
      padding: var(--spacing-xs);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .password-toggle:hover {
      color: var(--color-text);
    }

    /* Slots */
    ::slotted([slot="prefix"]) {
      margin-right: var(--spacing-xs);
    }

    ::slotted([slot="suffix"]) {
      margin-left: var(--spacing-xs);
    }
  `;

  constructor() {
    super();
    this.type = "text";
    this.label = "";
    this.placeholder = "";
    this.value = "";
    this.required = false;
    this.disabled = false;
    this.error = "";
    this.helper = "";
    this.pattern = "";
    this.minLength = null;
    this.maxLength = null;
    this._showPassword = false;
  }

  render() {
    const classes = {
      "input-container": true,
      error: !!this.error,
    };

    return html`
      <div class=${classMap(classes)}>
        ${this.label ? html`<label for="input">${this.label}</label>` : null}
        <div class="input-wrapper">
          <slot name="prefix"></slot>
          <input
            id="input"
            type=${this._showPassword ? "text" : this.type}
            .value=${this.value}
            placeholder=${this.placeholder}
            ?required=${this.required}
            ?disabled=${this.disabled}
            pattern=${this.pattern}
            minlength=${this.minLength || ""}
            maxlength=${this.maxLength || ""}
            aria-label=${this.label}
            aria-invalid=${!!this.error}
            aria-required=${this.required}
            @input=${this._handleInput}
            @change=${this._handleChange}
          />
          <slot name="suffix"></slot>
          ${this.type === "password"
            ? html`
                <button
                  type="button"
                  class="password-toggle"
                  @click=${this._togglePassword}
                  aria-label=${this._showPassword
                    ? "Hide password"
                    : "Show password"}
                >
                  <neo-icon
                    name=${this._showPassword ? "visibility_off" : "visibility"}
                    size="small"
                  ></neo-icon>
                </button>
              `
            : null}
        </div>
        ${this.error ? html`<div class="error-text">${this.error}</div>` : null}
        ${this.helper && !this.error
          ? html`<div class="helper-text">${this.helper}</div>`
          : null}
      </div>
    `;
  }

  _handleInput(e) {
    this.value = e.target.value;
    this.dispatchEvent(
      new CustomEvent("input", {
        detail: { value: this.value },
        bubbles: true,
        composed: true,
      })
    );
  }

  _handleChange(e) {
    this.dispatchEvent(
      new CustomEvent("change", {
        detail: { value: this.value },
        bubbles: true,
        composed: true,
      })
    );
  }

  _togglePassword() {
    this._showPassword = !this._showPassword;
  }

  reportValidity() {
    const input = this.shadowRoot.querySelector("input");
    const isValid = input.reportValidity();
    if (!isValid) {
      this.error = input.validationMessage;
      this.dispatchEvent(new CustomEvent("invalid", { bubbles: true }));
    }
    return isValid;
  }

  setCustomValidity(message) {
    const input = this.shadowRoot.querySelector("input");
    input.setCustomValidity(message);
  }
}

customElements.define("neo-input", NeoInput);
