import {
  LitElement,
  html,
  css,
} from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";

// Country codes data
const COUNTRY_CODES = {
  US: { code: "1", name: "United States" },
  GB: { code: "44", name: "United Kingdom" },
  CA: { code: "1", name: "Canada" },
  AU: { code: "61", name: "Australia" },
  DE: { code: "49", name: "Germany" },
  FR: { code: "33", name: "France" },
  JP: { code: "81", name: "Japan" },
  CN: { code: "86", name: "China" },
};

export class PhoneInput extends LitElement {
  static properties = {
    name: { type: String },
    label: { type: String },
    placeholder: { type: String },
    value: { type: String },
    defaultCountry: { type: String, reflect: true },
    countryCode: { type: String, reflect: true },
    selectedCountry: { type: String },
    disabled: { type: Boolean },
    required: { type: Boolean },
    error: { type: String },
    isValid: { type: Boolean, reflect: true },
    customValidator: { type: Object },
  };

  static styles = css`
    :host {
      display: block;
      font-family: system-ui, sans-serif;
    }

    .phone-input-container {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    label {
      font-weight: 500;
      color: var(--phone-label-color, #374151);
    }

    .input-group {
      display: flex;
      gap: 0.5rem;
    }

    select,
    input {
      padding: 0.5rem;
      border: 1px solid var(--phone-border-color, #d1d5db);
      border-radius: 0.375rem;
      font-size: 1rem;
    }

    select {
      min-width: 5rem;
    }

    input {
      flex: 1;
    }

    select:focus,
    input:focus {
      outline: none;
      border-color: var(--phone-focus-color, #3b82f6);
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.25);
    }

    .error-message {
      color: var(--phone-error-color, #ef4444);
      font-size: 0.875rem;
    }

    select[disabled],
    input[disabled] {
      background-color: var(--phone-disabled-bg, #f3f4f6);
      cursor: not-allowed;
      opacity: 0.7;
    }

    .input-error {
      border-color: var(--phone-error-color, #ef4444) !important;
    }
  `;

  constructor() {
    super();
    this.name = "";
    this.label = "Phone Number";
    this.placeholder = "Enter phone number";
    this.value = "";
    this.defaultCountry = "US";
    this.countryCode = "1";
    this.selectedCountry = "US";
    this.disabled = false;
    this.required = false;
    this.error = "";
    this.isValid = true;
    this.customValidator = null;
    this._inputId = `phone-input-${Math.random().toString(36).substring(2, 10)}`;
  }

  connectedCallback() {
    super.connectedCallback();
    // Set default country code
    if (this.defaultCountry && COUNTRY_CODES[this.defaultCountry]) {
      this.selectedCountry = this.defaultCountry;
      this.countryCode = COUNTRY_CODES[this.defaultCountry].code;
    }
  }

  updated(changedProperties) {
    super.updated(changedProperties);

    // Handle defaultCountry changes
    if (changedProperties.has("defaultCountry") && this.defaultCountry) {
      this.selectedCountry = this.defaultCountry;
      this.countryCode = COUNTRY_CODES[this.defaultCountry]?.code || "1";

      // Update the select element
      const select = this.shadowRoot.querySelector("select");
      if (select) {
        select.value = this.defaultCountry;
      }

      // Reformat any existing value
      const input = this.shadowRoot.querySelector("input");
      if (input && input.value) {
        const digits = input.value.replace(/\D/g, "");
        input.value = this._formatPhoneNumber(digits, this.countryCode);
      }
    }
  }

  _formatPhoneNumber(value, countryCode) {
    if (!value) return "";

    // Remove non-digits
    const digits = value.replace(/\D/g, "");

    // Format based on country
    if (countryCode === "1") {
      // US/Canada: (123) 456-7890
      if (digits.length === 0) return "";

      const match = digits.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
      if (!match) return digits;

      const [, area, prefix, line] = match;
      if (!prefix) return area;
      if (!line) return `(${area}) ${prefix}`;
      return `(${area}) ${prefix}-${line}`;
    } else if (countryCode === "44") {
      // UK: 07911 123456
      if (digits.length === 0) return "";

      // Add leading 0 if not present
      const withLeadingZero = digits.startsWith("0") ? digits : `0${digits}`;

      // Format as 07911 123456
      if (withLeadingZero.length <= 5) {
        return withLeadingZero;
      } else {
        return `${withLeadingZero.substring(0, 5)} ${withLeadingZero.substring(5)}`;
      }
    }

    // Default formatting for other countries
    return digits;
  }

  _handleInput(e) {
    const input = e.target;
    let value = input.value;

    // Check for international format
    const internationalMatch = value.match(/^\+(\d+)\s*(.*)$/);
    if (internationalMatch) {
      const [, code, number] = internationalMatch;

      // Find country by code
      const country = Object.entries(COUNTRY_CODES).find(
        ([, data]) => data.code === code
      );

      if (country) {
        // Update country select
        this.selectedCountry = country[0];
        this.countryCode = code;

        // Update select element
        const select = this.shadowRoot.querySelector("select");
        if (select) {
          select.value = country[0];
        }

        // Format the number part
        value = number;
      }
    }

    const formattedValue = this._formatPhoneNumber(value, this.countryCode);

    // Update the input value with formatted version
    input.value = formattedValue;

    // Store raw digits as internal value
    this.value = formattedValue;

    // Validate
    this._validate();

    // Dispatch change event
    this._dispatchChangeEvent();
  }

  _handleCountryChange(e) {
    const select = e.target;
    this.selectedCountry = select.value;
    this.countryCode = COUNTRY_CODES[this.selectedCountry].code;

    // Reformat the current value with new country code
    const input = this.shadowRoot.querySelector("input");
    if (input) {
      const digits = input.value.replace(/\D/g, "");
      input.value = this._formatPhoneNumber(digits, this.countryCode);
    }

    // Validate with new country code
    this._validate();

    // Dispatch change event
    this._dispatchChangeEvent();
  }

  _validate() {
    let isValid = true;
    let errorMessage = "";

    const input = this.shadowRoot.querySelector("input");
    if (!input) return false;

    const value = input.value;
    const digits = value.replace(/\D/g, "");

    // Apply custom validation first if provided
    if (this.customValidator && typeof this.customValidator === "function") {
      const customError = this.customValidator(value);
      if (customError) {
        isValid = false;
        errorMessage = customError;
      }
    }
    // Only apply built-in validation if custom validation passed
    else {
      // Required validation
      if (this.required && !digits) {
        isValid = false;
        errorMessage = "Phone number is required";
      }
      // Length validation based on country
      else if (digits) {
        if (this.countryCode === "1" && digits.length !== 10) {
          isValid = false;
          errorMessage = "US phone numbers must be 10 digits";
        } else if (
          this.countryCode === "44" &&
          (digits.length < 10 || digits.length > 11)
        ) {
          isValid = false;
          errorMessage = "UK phone numbers must be 10-11 digits";
        }
      }
    }

    // Update component state
    this.isValid = isValid;

    // Set error message
    if (!isValid) {
      this.error = errorMessage;
    } else if (this.error && !this.error.includes("Invalid")) {
      // Clear error if validation passed and error wasn't manually set
      this.error = "";
    }

    // Update input styling
    if (input) {
      if (!isValid || this.error) {
        input.classList.add("input-error");
        input.setAttribute("aria-invalid", "true");
      } else {
        input.classList.remove("input-error");
        input.setAttribute("aria-invalid", "false");
      }
    }

    return isValid;
  }

  _dispatchChangeEvent() {
    const event = new CustomEvent("change", {
      detail: {
        value: this.countryCode
          ? `+${this.countryCode}${this.value}`
          : this.value,
        isValid: this.isValid,
        countryCode: this.countryCode,
      },
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);
  }

  render() {
    return html`
      <div class="phone-input-container">
        ${this.label
          ? html`<label for="${this._inputId}">${this.label}</label>`
          : ""}
        <div class="input-group">
          <select
            aria-label="Select country"
            ?disabled=${this.disabled}
            @change=${this._handleCountryChange}
          >
            <option value="US" ?selected=${this.selectedCountry === "US"}>
              +1 (US)
            </option>
            <option value="CA" ?selected=${this.selectedCountry === "CA"}>
              +1 (CA)
            </option>
            <option value="GB" ?selected=${this.selectedCountry === "GB"}>
              +44 (GB)
            </option>
            <option value="AU" ?selected=${this.selectedCountry === "AU"}>
              +61 (AU)
            </option>
            <option value="DE" ?selected=${this.selectedCountry === "DE"}>
              +49 (DE)
            </option>
            <option value="FR" ?selected=${this.selectedCountry === "FR"}>
              +33 (FR)
            </option>
            <option value="JP" ?selected=${this.selectedCountry === "JP"}>
              +81 (JP)
            </option>
            <option value="CN" ?selected=${this.selectedCountry === "CN"}>
              +86 (CN)
            </option>
          </select>
          <input
            id="${this._inputId}"
            type="tel"
            name="${this.name}"
            placeholder="${this.placeholder}"
            ?disabled=${this.disabled}
            ?required=${this.required}
            aria-label="Phone number"
            aria-invalid=${this.error ? "true" : "false"}
            class="${this.error ? "input-error" : ""}"
            .value=${this.value}
            @input=${this._handleInput}
            @paste=${this._handlePaste}
          />
        </div>
        ${this.error
          ? html`<div class="error-message">${this.error}</div>`
          : ""}
      </div>
    `;
  }

  _handlePaste(e) {
    // Handle paste events with special formatting
    const clipboardData = e.clipboardData || window.clipboardData;
    if (!clipboardData) return;

    const pastedText = clipboardData.getData("text");
    if (!pastedText) return;

    // Check for international format
    const internationalMatch = pastedText.match(/^\+(\d+)\s*(.*)$/);
    if (internationalMatch) {
      e.preventDefault();

      const [, code, number] = internationalMatch;

      // Find country by code
      const country = Object.entries(COUNTRY_CODES).find(
        ([, data]) => data.code === code
      );

      if (country) {
        // Update country select
        this.selectedCountry = country[0];
        this.countryCode = code;

        // Update select element
        const select = this.shadowRoot.querySelector("select");
        if (select) {
          select.value = country[0];
        }

        // Format and set the number part
        const formattedValue = this._formatPhoneNumber(
          number,
          this.countryCode
        );
        const input = this.shadowRoot.querySelector("input");
        if (input) {
          input.value = formattedValue;
          this.value = formattedValue;
        }

        // Validate and dispatch event
        this._validate();
        this._dispatchChangeEvent();
      }
    }
  }
}

customElements.define("ui-phone-input", PhoneInput);

// Also export the NeoPhoneInput for backward compatibility
export class NeoPhoneInput extends LitElement {
  static properties = {
    value: { type: String },
    countryCode: { type: String },
    invalid: { type: Boolean },
    errorMessage: { type: String },
    countryCodes: { type: Array },
  };

  static styles = css`
    :host {
      display: block;
    }

    .phone-input {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }

    input {
      padding: 0.5rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 1rem;
      width: 100%;
    }

    input:focus {
      outline: none;
      border-color: #007bff;
      box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
    }

    select {
      padding: 0.5rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 1rem;
      min-width: 80px;
    }

    .error {
      color: #dc3545;
      font-size: 0.875rem;
      margin-top: 0.25rem;
    }

    input.invalid {
      border-color: #dc3545;
    }

    input.invalid:focus {
      box-shadow: 0 0 0 2px rgba(220, 53, 69, 0.25);
    }
  `;

  constructor() {
    super();
    this.value = "";
    this.countryCode = "+1";
    this.invalid = false;
    this.errorMessage = "";
    this.countryCodes = [
      { code: "+1", country: "US" },
      { code: "+44", country: "UK" },
      { code: "+33", country: "FR" },
      { code: "+49", country: "DE" },
      { code: "+81", country: "JP" },
    ];
  }

  handleInput(e) {
    const input = e.target;
    let value = input.value.replace(/\D/g, "");

    // Format the phone number based on country code
    if (this.countryCode === "+1") {
      if (value.length > 0) {
        value = value.match(/(\d{0,3})(\d{0,3})(\d{0,4})/);
        value = !value[2]
          ? value[1]
          : value[1] + "-" + value[2] + (value[3] ? "-" + value[3] : "");
      }
    }

    this.value = value;
    this.validatePhone();

    this.dispatchEvent(
      new CustomEvent("phone-change", {
        detail: {
          countryCode: this.countryCode,
          number: this.value,
          fullNumber: this.countryCode + this.value,
        },
        bubbles: true,
        composed: true,
      })
    );
  }

  handleCountryChange(e) {
    this.countryCode = e.target.value;
    this.validatePhone();
  }

  validatePhone() {
    const phoneRegex = /^\d{3}-\d{3}-\d{4}$/;
    if (
      this.countryCode === "+1" &&
      this.value &&
      !phoneRegex.test(this.value)
    ) {
      this.invalid = true;
      this.errorMessage =
        "Please enter a valid phone number (e.g., 123-456-7890)";
    } else {
      this.invalid = false;
      this.errorMessage = "";
    }
  }

  render() {
    return html`
      <div class="phone-input">
        <select @change="${this.handleCountryChange}">
          ${this.countryCodes.map(
            (country) => html`
              <option
                value="${country.code}"
                ?selected="${country.code === this.countryCode}"
              >
                ${country.country} (${country.code})
              </option>
            `
          )}
        </select>
        <input
          type="tel"
          .value="${this.value}"
          @input="${this.handleInput}"
          class="${this.invalid ? "invalid" : ""}"
          placeholder="123-456-7890"
        />
      </div>
      ${this.invalid ? html`<div class="error">${this.errorMessage}</div>` : ""}
    `;
  }
}

// Define the neo-phone-input element
if (!customElements.get("neo-phone-input")) {
  customElements.define("neo-phone-input", NeoPhoneInput);
}
