import {   LitElement, html, css   } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";

export class PhoneInput extends LitElement {
  static get properties() {
    return {
      value: { type: String },
      placeholder: { type: String },
      disabled: { type: Boolean },
      error: { type: String },
      countryCode: { type: String },
      required: { type: Boolean },
    };
  }

  static get styles() {
    return css`
      :host {
        display: block;
      }

      .phone-input {
        display: flex;
        gap: 0.5rem;
        align-items: flex-start;
      }

      .country-select {
        width: 5rem;
        padding: 0.5rem;
        border: 1px solid var(--color-border, #ddd);
        border-radius: 4px;
        background: var(--color-surface, white);
        font-size: 1rem;
        color: var(--color-text, #333);
        cursor: pointer;
      }

      .number-input {
        flex: 1;
        padding: 0.5rem;
        border: 1px solid var(--color-border, #ddd);
        border-radius: 4px;
        font-size: 1rem;
        color: var(--color-text, #333);
      }

      .number-input:focus,
      .country-select:focus {
        outline: none;
        border-color: var(--color-primary, #2196f3);
        box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.1);
      }

      .error .number-input,
      .error .country-select {
        border-color: var(--color-error, #f44336);
      }

      .error-message {
        color: var(--color-error, #f44336);
        font-size: 0.875rem;
        margin-top: 0.25rem;
      }

      :host([disabled]) .number-input,
      :host([disabled]) .country-select {
        background: var(--color-disabled, #f5f5f5);
        cursor: not-allowed;
      }
    `;
  }

  constructor() {
    super();
    this.value = "";
    this.placeholder = "Enter phone number";
    this.disabled = false;
    this.error = "";
    this.countryCode = "+1";
    this.required = false;
    this.countryCodes = [
      { code: "+1", label: "US" },
      { code: "+44", label: "UK" },
      { code: "+61", label: "AU" },
      { code: "+86", label: "CN" },
      { code: "+91", label: "IN" },
      { code: "+81", label: "JP" },
      { code: "+49", label: "DE" },
      { code: "+33", label: "FR" },
      { code: "+39", label: "IT" },
      { code: "+34", label: "ES" },
    ];
  }

  handleInput(e) {
    const value = e.target.value;
    // Remove all non-digit characters except + for country code
    const sanitizedValue = value.replace(/[^\d+]/g, "");
    this.value = sanitizedValue;

    this.validate();
    this.dispatchEvent(
      new CustomEvent("phone-input", {
        detail: {
          fullNumber: `${this.countryCode}${this.value}`,
          countryCode: this.countryCode,
          number: this.value,
          valid: this.isValid(),
        },
      })
    );
  }

  handleCountryChange(e) {
    this.countryCode = e.target.value;
    this.validate();
    this.dispatchEvent(
      new CustomEvent("phone-input", {
        detail: {
          fullNumber: `${this.countryCode}${this.value}`,
          countryCode: this.countryCode,
          number: this.value,
          valid: this.isValid(),
        },
      })
    );
  }

  validate() {
    this.error = "";

    if (this.required && !this.value) {
      this.error = "Phone number is required";
      return false;
    }

    if (this.value && !this.isValidPhoneNumber(this.value)) {
      this.error = "Invalid phone number";
      return false;
    }

    return true;
  }

  isValidPhoneNumber(number) {
    // Basic validation: at least 7 digits, max 15 digits
    const digits = number.replace(/\D/g, "");
    return digits.length >= 7 && digits.length <= 15;
  }

  isValid() {
    return !this.error;
  }

  render() {
    return html`
      <div class="phone-input ${this.error ? "error" : ""}">
        <select
          class="country-select"
          .value=${this.countryCode}
          ?disabled=${this.disabled}
          @change=${this.handleCountryChange}
        >
          ${this.countryCodes.map(
            (country) => html`
              <option value=${country.code}>
                ${country.label} ${country.code}
              </option>
            `
          )}
        </select>

        <input
          type="tel"
          class="number-input"
          .value=${this.value}
          .placeholder=${this.placeholder}
          ?disabled=${this.disabled}
          ?required=${this.required}
          @input=${this.handleInput}
        />
      </div>

      ${this.error
        ? html` <div class="error-message">${this.error}</div> `
        : ""}
    `;
  }
}

customElements.define("neo-phone-input", PhoneInput);
