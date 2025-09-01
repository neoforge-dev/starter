import {
  LitElement,
  html,
  css,
 } from 'lit';

// Country codes data
const COUNTRY_CODES = {
  US: { code: "+1", flag: "🇺🇸", pattern: "[0-9]{3}-[0-9]{3}-[0-9]{4}" },
  GB: { code: "+44", flag: "🇬🇧", pattern: "[0-9]{4}-[0-9]{6}" },
  CA: { code: "+1", flag: "🇨🇦", pattern: "[0-9]{3}-[0-9]{3}-[0-9]{4}" },
  AU: { code: "+61", flag: "🇦🇺", pattern: "[0-9]{4}-[0-9]{3}-[0-9]{3}" },
  DE: { code: "+49", flag: "🇩🇪", pattern: "[0-9]{4}-[0-9]{7}" },
  FR: { code: "+33", flag: "🇫🇷", pattern: "[0-9]{4}-[0-9]{6}" },
  IT: { code: "+39", flag: "🇮🇹", pattern: "[0-9]{3}-[0-9]{7}" },
  ES: { code: "+34", flag: "🇪🇸", pattern: "[0-9]{3}-[0-9]{6}" },
  JP: { code: "+81", flag: "🇯🇵", pattern: "[0-9]{2}-[0-9]{4}-[0-9]{4}" },
  CN: { code: "+86", flag: "🇨🇳", pattern: "[0-9]{3}-[0-9]{4}-[0-9]{4}" },
};

export class PhoneInput extends LitElement {
  static properties = {
    name: { type: String },
    value: { type: String },
    label: { type: String },
    placeholder: { type: String },
    defaultCountry: { type: String },
    disabled: { type: Boolean },
    required: { type: Boolean },
    error: { type: String },
    isOpen: { type: Boolean, state: true },
    selectedCountry: { type: String, state: true },
    formattedValue: { type: String, state: true },
  };

  static styles = css`
    :host {
      display: block;
      font-family: system-ui, sans-serif;
    }

    .phone-input-container {
      position: relative;
    }

    label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
      color: var(--phone-label-color, #374151);
    }

    .input-wrapper {
      display: flex;
      position: relative;
      border: 1px solid var(--phone-border-color, #d1d5db);
      border-radius: 0.375rem;
      overflow: hidden;
      transition: all 0.2s ease;
    }

    .input-wrapper:focus-within {
      border-color: var(--phone-focus-color, #3b82f6);
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.25);
    }

    .input-wrapper.disabled {
      background-color: var(--phone-disabled-bg, #f3f4f6);
      cursor: not-allowed;
    }

    .input-wrapper.error {
      border-color: var(--phone-error-color, #ef4444);
    }

    .country-selector {
      display: flex;
      align-items: center;
      padding: 0.5rem;
      background-color: var(--phone-selector-bg, #f9fafb);
      border-right: 1px solid var(--phone-border-color, #d1d5db);
      cursor: pointer;
      user-select: none;
      min-width: 4.5rem;
    }

    .country-selector.disabled {
      cursor: not-allowed;
      opacity: 0.7;
    }

    .country-flag {
      margin-right: 0.25rem;
      font-size: 1.25rem;
    }

    .country-code {
      font-size: 0.875rem;
      color: var(--phone-text-color, #374151);
    }

    .dropdown-icon {
      margin-left: 0.25rem;
      transition: transform 0.2s ease;
    }

    .dropdown-icon.open {
      transform: rotate(180deg);
    }

    .country-dropdown {
      position: absolute;
      top: 100%;
      left: 0;
      width: 100%;
      max-height: 15rem;
      overflow-y: auto;
      background-color: white;
      border: 1px solid var(--phone-border-color, #d1d5db);
      border-radius: 0.375rem;
      box-shadow:
        0 4px 6px -1px rgba(0, 0, 0, 0.1),
        0 2px 4px -1px rgba(0, 0, 0, 0.06);
      z-index: 10;
      display: none;
    }

    .country-dropdown.open {
      display: block;
    }

    .country-option {
      display: flex;
      align-items: center;
      padding: 0.5rem;
      cursor: pointer;
    }

    .country-option:hover {
      background-color: var(--phone-hover-bg, #f3f4f6);
    }

    .country-option.selected {
      background-color: var(--phone-selected-bg, #e5e7eb);
    }

    .country-name {
      margin-left: 0.5rem;
      font-size: 0.875rem;
    }

    input {
      flex: 1;
      padding: 0.5rem;
      border: none;
      outline: none;
      font-size: 1rem;
      color: var(--phone-text-color, #374151);
    }

    input:disabled {
      background-color: transparent;
      cursor: not-allowed;
    }

    .error-message {
      color: var(--phone-error-color, #ef4444);
      font-size: 0.75rem;
      margin-top: 0.25rem;
    }
  `;

  constructor() {
    super();
    this.name = "";
    this.value = "";
    this.label = "Phone Number";
    this.placeholder = "Enter phone number";
    this.defaultCountry = "US";
    this.disabled = false;
    this.required = false;
    this.error = "";
    this.isOpen = false;
    this.selectedCountry = "";
    this.formattedValue = "";
  }

  connectedCallback() {
    super.connectedCallback();
    // Set default country
    this.selectedCountry = this.defaultCountry || "US";
    // Close dropdown when clicking outside
    document.addEventListener("click", this._handleOutsideClick.bind(this));
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener("click", this._handleOutsideClick.bind(this));
  }

  _handleOutsideClick(e) {
    if (this.isOpen && !this.renderRoot.contains(e.target)) {
      this.isOpen = false;
    }
  }

  _toggleDropdown(e) {
    e.stopPropagation();
    if (!this.disabled) {
      this.isOpen = !this.isOpen;
    }
  }

  _selectCountry(country) {
    this.selectedCountry = country;
    this.isOpen = false;
    this._formatPhoneNumber();
    this._dispatchChangeEvent();
  }

  _handleInput(e) {
    const input = e.target.value.replace(/\D/g, "");
    this.value = input;
    this._formatPhoneNumber();
    this._dispatchChangeEvent();
  }

  _formatPhoneNumber() {
    const countryData = COUNTRY_CODES[this.selectedCountry];
    if (!countryData || !this.value) {
      this.formattedValue = this.value;
      return;
    }

    let formatted = this.value;

    // Format based on country
    if (this.selectedCountry === "US" || this.selectedCountry === "CA") {
      if (this.value.length > 0) {
        formatted = this.value.match(/(\d{0,3})(\d{0,3})(\d{0,4})/);
        formatted = !formatted[2]
          ? formatted[1]
          : `(${formatted[1]}) ${formatted[2]}${
              formatted[3] ? `-${formatted[3]}` : ""
            }`;
      }
    } else if (this.selectedCountry === "GB") {
      if (this.value.length > 0) {
        formatted = this.value.match(/(\d{0,2})(\d{0,4})(\d{0,6})/);
        formatted = !formatted[2]
          ? formatted[1]
          : `${formatted[1]} ${formatted[2]}${
              formatted[3] ? ` ${formatted[3]}` : ""
            }`;
      }
    } else if (this.selectedCountry === "JP") {
      if (this.value.length > 0) {
        formatted = this.value.match(/(\d{0,2})(\d{0,4})(\d{0,4})/);
        formatted = !formatted[2]
          ? formatted[1]
          : `${formatted[1]}-${formatted[2]}${
              formatted[3] ? `-${formatted[3]}` : ""
            }`;
      }
    }

    this.formattedValue = formatted;
  }

  _dispatchChangeEvent() {
    const countryData = COUNTRY_CODES[this.selectedCountry];
    this.dispatchEvent(
      new CustomEvent("change", {
        detail: {
          name: this.name,
          value: this.value,
          formattedValue: this.formattedValue,
          countryCode: countryData?.code || "",
          fullNumber: `${countryData?.code || ""}${this.value}`,
          valid: this._isValid(),
        },
        bubbles: true,
        composed: true,
      })
    );
  }

  _isValid() {
    if (!this.required && !this.value) {
      return true;
    }

    const countryData = COUNTRY_CODES[this.selectedCountry];
    if (!countryData) {
      return false;
    }

    // Basic validation based on expected length
    if (this.selectedCountry === "US" || this.selectedCountry === "CA") {
      return this.value.replace(/\D/g, "").length === 10;
    } else if (this.selectedCountry === "GB") {
      const digits = this.value.replace(/\D/g, "");
      return digits.length >= 10 && digits.length <= 11;
    }

    // Default validation - just check if there's a value
    return this.value.length > 0;
  }

  render() {
    const countryData = COUNTRY_CODES[this.selectedCountry] || COUNTRY_CODES.US;

    return html`
      <div class="phone-input-container">
        ${this.label
          ? html`<label for="phone-${this.name}">${this.label}</label>`
          : ""}
        <div
          class="input-wrapper ${this.disabled ? "disabled" : ""} ${this.error
            ? "error"
            : ""}"
        >
          <div
            class="country-selector ${this.disabled ? "disabled" : ""}"
            @click="${this._toggleDropdown}"
          >
            <span class="country-flag">${countryData.flag}</span>
            <span class="country-code">${countryData.code}</span>
            <span class="dropdown-icon ${this.isOpen ? "open" : ""}">▼</span>
          </div>
          <input
            type="tel"
            id="phone-${this.name}"
            name="${this.name}"
            .value="${this.formattedValue}"
            @input="${this._handleInput}"
            placeholder="${this.placeholder}"
            ?disabled="${this.disabled}"
            ?required="${this.required}"
            pattern="${countryData.pattern}"
          />
        </div>
        <div class="country-dropdown ${this.isOpen ? "open" : ""}">
          ${Object.entries(COUNTRY_CODES).map(
            ([code, data]) => html`
              <div
                class="country-option ${this.selectedCountry === code
                  ? "selected"
                  : ""}"
                @click="${() => this._selectCountry(code)}"
              >
                <span class="country-flag">${data.flag}</span>
                <span class="country-code">${data.code}</span>
                <span class="country-name">${code}</span>
              </div>
            `
          )}
        </div>
        ${this.error
          ? html`<div class="error-message">${this.error}</div>`
          : ""}
      </div>
    `;
  }
}

customElements.define("ui-phone-input", PhoneInput);
