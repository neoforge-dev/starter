import {
  LitElement,
  html,
  css,
  unsafeCSS,
} from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";

export class NeoRadio extends LitElement {
  static properties = {
    name: { type: String },
    value: { type: String },
    label: { type: String },
    checked: { type: Boolean, reflect: true },
    disabled: { type: Boolean, reflect: true },
    required: { type: Boolean, reflect: true },
    validationMessage: { type: String },
  };

  static styles = css`
    :host {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      font-family: system-ui, sans-serif;
    }

    :host([disabled]) {
      cursor: not-allowed;
      opacity: 0.6;
    }

    .radio {
      appearance: none;
      -webkit-appearance: none;
      width: var(--radio-size, 1.25rem);
      height: var(--radio-size, 1.25rem);
      border: 2px solid var(--radio-border-color, #6b7280);
      border-radius: 50%;
      outline: none;
      margin: 0;
      cursor: inherit;
      display: grid;
      place-content: center;
      background-color: var(--radio-color, transparent);
      transition: all 0.2s ease-in-out;
    }

    .radio::before {
      content: "";
      width: calc(var(--radio-size, 1.25rem) * 0.5);
      height: calc(var(--radio-size, 1.25rem) * 0.5);
      border-radius: 50%;
      transform: scale(0);
      transition: transform 0.15s ease-in-out;
      background-color: var(--radio-checked-color, #2563eb);
    }

    .radio:checked::before {
      transform: scale(1);
    }

    .radio:focus-visible {
      outline: 2px solid var(--radio-focus-color, #60a5fa);
      outline-offset: 2px;
    }

    :host([disabled]) .radio {
      border-color: var(--radio-disabled-color, #9ca3af);
    }

    :host([disabled]) .radio:checked::before {
      background-color: var(--radio-disabled-color, #9ca3af);
    }

    label {
      cursor: inherit;
      user-select: none;
    }

    .error-message {
      color: var(--radio-error-color, #dc2626);
      font-size: 0.875rem;
      margin-top: 0.25rem;
    }

    .radio.checked {
      border-color: var(--radio-checked-color, #2563eb);
    }

    .radio.disabled {
      border-color: var(--radio-disabled-color, #9ca3af);
    }
  `;

  constructor() {
    super();
    this.checked = false;
    this.disabled = false;
    this.required = false;
    this.validationMessage = "";
    this.label = "";
  }

  connectedCallback() {
    super.connectedCallback();
    if (this.form) {
      this.form.addEventListener("formdata", this._handleFormData);
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.form) {
      this.form.removeEventListener("formdata", this._handleFormData);
    }
  }

  _handleFormData = (e) => {
    if (this.checked) {
      e.formData.set(this.name, this.value);
    }
  };

  _handleChange = (e) => {
    if (this.disabled) return;

    const wasChecked = this.checked;
    this.checked = e.target.checked;

    if (this.checked && !wasChecked) {
      // Uncheck other radios in the same group
      const group = this._getRadioGroup();
      group.forEach((radio) => {
        if (radio !== this && radio.name === this.name) {
          radio.checked = false;
          radio.dispatchEvent(
            new CustomEvent("change", {
              detail: {
                checked: false,
                value: radio.value,
                name: radio.name,
              },
              bubbles: true,
              composed: true,
            })
          );
        }
      });

      // Update form data if in a form
      if (this.form) {
        const formData = new FormData(this.form);
        formData.set(this.name, this.value);
      }

      // Dispatch change event after updating group state
      this.dispatchEvent(
        new CustomEvent("change", {
          detail: {
            checked: this.checked,
            value: this.value,
            name: this.name,
          },
          bubbles: true,
          composed: true,
        })
      );
    }
  };

  _handleKeydown = (e) => {
    if (this.disabled) return;

    switch (e.key) {
      case " ":
      case "Space":
        e.preventDefault();
        if (!this.checked) {
          this.checked = true;
          this.dispatchEvent(
            new CustomEvent("change", {
              detail: {
                checked: true,
                value: this.value,
                name: this.name,
              },
              bubbles: true,
              composed: true,
            })
          );
        }
        break;
      case "ArrowRight":
      case "ArrowDown":
        e.preventDefault();
        this._focusNextRadio();
        break;
      case "ArrowLeft":
      case "ArrowUp":
        e.preventDefault();
        this._focusPreviousRadio();
        break;
    }
  };

  _focusNextRadio() {
    const group = Array.from(this._getRadioGroup());
    const currentIndex = group.indexOf(this);
    const nextRadio = group[currentIndex + 1] || group[0];
    if (nextRadio) {
      nextRadio.focus();
      nextRadio.checked = true;
      this.checked = false;
      nextRadio.dispatchEvent(
        new CustomEvent("change", {
          detail: {
            checked: true,
            value: nextRadio.value,
            name: nextRadio.name,
          },
          bubbles: true,
          composed: true,
        })
      );
    }
  }

  _focusPreviousRadio() {
    const group = Array.from(this._getRadioGroup());
    const currentIndex = group.indexOf(this);
    const previousRadio = group[currentIndex - 1] || group[group.length - 1];
    if (previousRadio) {
      previousRadio.focus();
      previousRadio.checked = true;
      this.checked = false;
      previousRadio.dispatchEvent(
        new CustomEvent("change", {
          detail: {
            checked: true,
            value: previousRadio.value,
            name: previousRadio.name,
          },
          bubbles: true,
          composed: true,
        })
      );
    }
  }

  _getRadioGroup() {
    const group = this.closest('[role="radiogroup"]');
    if (group) {
      return group.querySelectorAll(`neo-radio[name="${this.name}"]`);
    }
    return document.querySelectorAll(`neo-radio[name="${this.name}"]`);
  }

  setCustomValidity(message) {
    this.validationMessage = message;
  }

  reportValidity() {
    if (this.required && !this.checked) {
      this.validationMessage =
        this.validationMessage || "This field is required";
      this.dispatchEvent(new Event("invalid", { bubbles: true }));
      return false;
    }
    this.validationMessage = "";
    return true;
  }

  focus() {
    this.shadowRoot?.querySelector("input")?.focus();
  }

  blur() {
    this.shadowRoot?.querySelector("input")?.blur();
  }

  get form() {
    return this.closest("form");
  }

  updated(changedProperties) {
    super.updated(changedProperties);
    if (changedProperties.has("checked") && this.checked) {
      // Uncheck other radios in the same group
      const group = this._getRadioGroup();
      group.forEach((radio) => {
        if (radio !== this && radio.name === this.name) {
          radio.checked = false;
        }
      });
    }
  }

  render() {
    return html`
      <label>
        <input
          type="radio"
          class="radio ${this.checked ? "checked" : ""} ${this.disabled
            ? "disabled"
            : ""}"
          name=${this.name}
          value=${this.value}
          ?checked=${this.checked}
          ?disabled=${this.disabled}
          ?required=${this.required}
          @change=${this._handleChange}
          @keydown=${this._handleKeydown}
          role="radio"
          aria-checked=${this.checked}
          aria-disabled=${this.disabled}
        />
        ${this.label}
        <slot></slot>
        ${this.validationMessage
          ? html` <div class="error-message">${this.validationMessage}</div> `
          : ""}
      </label>
    `;
  }
}

customElements.define("neo-radio", NeoRadio);
