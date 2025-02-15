import { LitElement, html, css } from "lit";

export class FormValidation extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    .error-message {
      color: var(--color-error, #dc3545);
      font-size: 0.875rem;
      margin-top: 0.25rem;
      display: flex;
      align-items: center;
      opacity: 0;
      transform: translateY(-10px);
      transition:
        opacity 0.3s ease,
        transform 0.3s ease;
    }

    .error-message.visible {
      opacity: 1;
      transform: translateY(0);
    }

    .error-icon {
      margin-right: 0.5rem;
      width: 16px;
      height: 16px;
    }

    .field-wrapper {
      position: relative;
    }

    .validation-icon {
      position: absolute;
      right: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      width: 16px;
      height: 16px;
      pointer-events: none;
    }

    @keyframes shake {
      0%,
      100% {
        transform: translateX(0);
      }
      25% {
        transform: translateX(-5px);
      }
      75% {
        transform: translateX(5px);
      }
    }

    .field-error {
      animation: shake 0.4s ease-in-out;
    }
  `;

  static properties = {
    rules: { type: Object },
    messages: { type: Object },
    errors: { type: Object, state: true },
    touched: { type: Object, state: true },
    value: { type: Object },
  };

  constructor() {
    super();
    this.rules = {};
    this.messages = {};
    this.errors = {};
    this.touched = {};
    this.value = {};
  }

  render() {
    return html`
      <div class="form-validation">
        <slot @slotchange=${this._handleSlotChange}></slot>
        ${Object.entries(this.errors).map(
          ([field, error]) => html`
            ${this.touched[field] && error
              ? html`
                  <div class="error-message visible">
                    <svg class="error-icon" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"
                      />
                    </svg>
                    ${error}
                  </div>
                `
              : ""}
          `
        )}
      </div>
    `;
  }

  _handleSlotChange(e) {
    const elements = e.target.assignedElements();
    elements.forEach((element) => {
      if (element.hasAttribute("name")) {
        const name = element.getAttribute("name");
        element.addEventListener("input", () =>
          this._validateField(name, element.value)
        );
        element.addEventListener("blur", () => this._markAsTouched(name));
      }
    });
  }

  _validateField(field, value) {
    const rules = this.rules[field] || [];
    let error = null;

    for (const rule of rules) {
      if (typeof rule === "function") {
        const result = rule(value);
        if (result !== true) {
          error = this.messages[field]?.[rules.indexOf(rule)] || result;
          break;
        }
      }
    }

    this.errors = {
      ...this.errors,
      [field]: error,
    };

    this._notifyValidation(field, !error);
    return !error;
  }

  _markAsTouched(field) {
    this.touched = {
      ...this.touched,
      [field]: true,
    };
  }

  _notifyValidation(field, isValid) {
    this.dispatchEvent(
      new CustomEvent("validation", {
        detail: {
          field,
          isValid,
          error: this.errors[field],
        },
        bubbles: true,
        composed: true,
      })
    );
  }

  validate() {
    const fields = Object.keys(this.rules);
    const elements = this.shadowRoot.querySelector("slot").assignedElements();

    let isValid = true;
    fields.forEach((field) => {
      const element = elements.find((el) => el.getAttribute("name") === field);
      if (element) {
        this._markAsTouched(field);
        if (!this._validateField(field, element.value)) {
          isValid = false;
          element.classList.add("field-error");
          setTimeout(() => element.classList.remove("field-error"), 400);
        }
      }
    });

    return isValid;
  }

  reset() {
    this.errors = {};
    this.touched = {};
    this.dispatchEvent(new CustomEvent("reset"));
  }
}

customElements.define("form-validation", FormValidation);
