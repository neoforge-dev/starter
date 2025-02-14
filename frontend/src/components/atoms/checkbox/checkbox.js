import { LitElement, html, css } from "lit";
import { classMap } from "lit/directives/class-map.js";

export class NeoCheckbox extends LitElement {
  static properties = {
    checked: { type: Boolean },
    indeterminate: { type: Boolean },
    disabled: { type: Boolean },
    required: { type: Boolean },
    error: { type: String },
    helper: { type: String },
    value: { type: String },
  };

  static styles = css`
    :host {
      display: inline-block;
    }

    .checkbox-container {
      display: flex;
      align-items: flex-start;
      gap: var(--spacing-xs);
      cursor: pointer;
    }

    .checkbox-container.disabled {
      cursor: not-allowed;
      opacity: 0.6;
    }

    .checkbox {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 1.25rem;
      height: 1.25rem;
      border: 2px solid var(--color-border);
      border-radius: var(--radius-sm);
      background: var(--color-surface);
      transition: all 0.2s ease-in-out;
      flex-shrink: 0;
    }

    .checkbox:focus-within {
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px var(--color-primary-alpha);
    }

    .checkbox.checked {
      background: var(--color-primary);
      border-color: var(--color-primary);
    }

    .checkbox.indeterminate {
      background: var(--color-primary);
      border-color: var(--color-primary);
    }

    .checkbox.error {
      border-color: var(--color-error);
    }

    .checkbox.error:focus-within {
      box-shadow: 0 0 0 3px var(--color-error-alpha);
    }

    input[type="checkbox"] {
      position: absolute;
      opacity: 0;
      width: 100%;
      height: 100%;
      top: 0;
      left: 0;
      margin: 0;
      cursor: inherit;
    }

    .check-icon,
    .indeterminate-icon {
      color: var(--color-white);
      width: 1rem;
      height: 1rem;
      display: none;
    }

    .checkbox.checked .check-icon,
    .checkbox.indeterminate .indeterminate-icon {
      display: block;
    }

    .label {
      color: var(--color-text);
      font-family: var(--font-family-primary);
      font-size: var(--font-size-md);
      user-select: none;
    }

    .error-message {
      color: var(--color-error);
      font-size: var(--font-size-sm);
      margin-top: var(--spacing-xs);
    }

    .helper-text {
      color: var(--color-text-secondary);
      font-size: var(--font-size-sm);
      margin-top: var(--spacing-xs);
    }
  `;

  constructor() {
    super();
    this.checked = false;
    this.indeterminate = false;
    this.disabled = false;
    this.required = false;
    this.error = "";
    this.helper = "";
    this.value = "";
  }

  render() {
    const containerClasses = {
      "checkbox-container": true,
      disabled: this.disabled,
    };

    const checkboxClasses = {
      checkbox: true,
      checked: this.checked,
      indeterminate: this.indeterminate,
      error: !!this.error,
    };

    return html`
      <div class=${classMap(containerClasses)}>
        <div class=${classMap(checkboxClasses)}>
          <input
            type="checkbox"
            .checked=${this.checked}
            .indeterminate=${this.indeterminate}
            ?disabled=${this.disabled}
            ?required=${this.required}
            .value=${this.value}
            @change=${this._handleChange}
            role="checkbox"
            aria-checked=${this.indeterminate ? "mixed" : this.checked}
          />
          <neo-icon name="check" size="small" class="check-icon"></neo-icon>
          <neo-icon
            name="remove"
            size="small"
            class="indeterminate-icon"
          ></neo-icon>
        </div>
        <label class="label">
          <slot></slot>
        </label>
      </div>
      ${this.error
        ? html`<div class="error-message">${this.error}</div>`
        : null}
      ${this.helper && !this.error
        ? html`<div class="helper-text">${this.helper}</div>`
        : null}
    `;
  }

  _handleChange(e) {
    if (!this.disabled) {
      this.checked = e.target.checked;
      this.indeterminate = false;
      this.dispatchEvent(
        new CustomEvent("change", {
          detail: { checked: this.checked, value: this.value },
          bubbles: true,
          composed: true,
        })
      );
    }
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

customElements.define("neo-checkbox", NeoCheckbox);
