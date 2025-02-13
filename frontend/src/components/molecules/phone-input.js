import {
  LitElement,
  html,
  css,
} from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";

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
      align-items: center;
      border: 1px solid var(--phone-border-color, #d1d5db);
      border-radius: 0.375rem;
      overflow: hidden;
    }

    .input-wrapper:focus-within {
      outline: 2px solid var(--phone-focus-color, #60a5fa);
      outline-offset: 2px;
    }

    :host([disabled]) .input-wrapper {
      background-color: var(--phone-disabled-bg, #f3f4f6);
      cursor: not-allowed;
      opacity: 0.6;
    }

    .country-select {
      padding: 0.5rem;
      border: none;
      border-right: 1px solid var(--phone-border-color, #d1d5db);
      background-color: var(--phone-country-bg, #f9fafb);
      cursor: pointer;
    }

    .country-select:hover {
      background-color: var(--phone-country-hover-bg, #f3f4f6);
    }

    .country-dropdown {
      position: absolute;
      top: 100%;
      left: 0;
      width: 200px;
      max-height: 200px;
      overflow-y: auto;
      background-color: white;
      border: 1px solid var(--phone-border-color, #d1d5db);
      border-radius: 0.375rem;
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
      z-index: 50;
      display: ${(props) => (props.isOpen ? "block" : "none")};
    }

    .country-option {
      padding: 0.5rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .country-option:hover {
      background-color: var(--phone-option-hover-bg, #f3f4f6);
    }

    input {
      flex: 1;
      padding: 0.5rem;
      border: none;
      outline: none;
      font-size: 1rem;
    }

    input:disabled {
      background-color: transparent;
      cursor: not-allowed;
    }

    .error-message {
      margin-top: 0.5rem;
      color: var(--phone-error-color, #dc2626);
      font-size: 0.875rem;
    }
  `;

  constructor() {
    super();
    this.disabled = false;
    this.required = false;
    this.isOpen = false;
    this.defaultCountry = "US";
    this.selectedCountry = "US";
    this.formattedValue = "";
    this._clickOutsideHandler = this._handleClickOutside.bind(this);
  }

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener("click", this._clickOutsideHandler);
    this._initializeValue();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener("click", this._clickOutsideHandler);
  }

  _initializeValue() {
    if (this.value) {
      // Extract country code and number from value
      const match = this.value.match(/^\+(\d+)(.*)$/);
      if (match) {
        const [, code, number] = match;
        const country = Object.entries(COUNTRY_CODES).find(
          ([, data]) => data.code === `+${code}`
        );
        if (country) {
          this.selectedCountry = country[0];
          this.formattedValue = this._formatNumber(number);
        }
      }
    }
  }

  _handleClickOutside(event) {
    if (!this.renderRoot.contains(event.target)) {
      this.isOpen = false;
    }
  }

  _toggleDropdown() {
    if (!this.disabled) {
      this.isOpen = !this.isOpen;
    }
  }

  _selectCountry(country) {
    this.selectedCountry = country;
    this.isOpen = false;
    this._dispatchChangeEvent();
  }

  _formatNumber(value) {
    if (!value) return "";
    const digits = value.replace(/\D/g, "");
    const pattern = COUNTRY_CODES[this.selectedCountry].pattern;
    let formatted = digits;

    // Apply pattern formatting
    if (pattern) {
      const parts = pattern.split("-");
      let remaining = digits;
      formatted = parts
        .map((part) => {
          const length = part.length;
          const chunk = remaining.slice(0, length);
          remaining = remaining.slice(length);
          return chunk;
        })
        .filter(Boolean)
        .join("-");
    }

    return formatted;
  }

  _handleInput(e) {
    const value = e.target.value;
    this.formattedValue = this._formatNumber(value);
    this._dispatchChangeEvent();
    this._validate();
  }

  _validate() {
    const isValid = this._isValidNumber();
    this.dispatchEvent(
      new CustomEvent("validate", {
        detail: {
          valid: isValid,
          message: isValid ? "" : "Please enter a valid phone number",
        },
        bubbles: true,
        composed: true,
      })
    );
  }

  _isValidNumber() {
    if (!this.formattedValue) return !this.required;
    const pattern = COUNTRY_CODES[this.selectedCountry].pattern;
    const digitCount = this.formattedValue.replace(/\D/g, "").length;
    const expectedCount = pattern.replace(/\D/g, "").length;
    return digitCount === expectedCount;
  }

  _dispatchChangeEvent() {
    const countryCode = COUNTRY_CODES[this.selectedCountry].code;
    const fullNumber = `${countryCode}${this.formattedValue.replace(/\D/g, "")}`;

    this.dispatchEvent(
      new CustomEvent("change", {
        detail: {
          value: fullNumber,
          formattedValue: this.formattedValue,
          country: this.selectedCountry,
        },
        bubbles: true,
        composed: true,
      })
    );
  }

  render() {
    return html`
      <div class="phone-input-container">
        ${this.label ? html`<label>${this.label}</label>` : ""}
        <div class="input-wrapper">
          <div class="country-select" @click=${this._toggleDropdown}>
            ${COUNTRY_CODES[this.selectedCountry].flag}
            ${COUNTRY_CODES[this.selectedCountry].code}
          </div>
          <input
            type="tel"
            .name=${this.name}
            .placeholder=${this.placeholder}
            .value=${this.formattedValue}
            ?disabled=${this.disabled}
            ?required=${this.required}
            @input=${this._handleInput}
          />
        </div>

        <div class="country-dropdown">
          ${Object.entries(COUNTRY_CODES).map(
            ([country, data]) => html`
              <div
                class="country-option"
                @click=${() => this._selectCountry(country)}
              >
                ${data.flag} ${country} ${data.code}
              </div>
            `
          )}
        </div>

        ${this.error
          ? html` <div class="error-message">${this.error}</div> `
          : ""}
      </div>
    `;
  }
}

customElements.define("ui-phone-input", PhoneInput);
