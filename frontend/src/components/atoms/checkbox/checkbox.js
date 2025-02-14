import {
  LitElement,
  html,
  css,
} from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";
import { baseStyles } from "../../styles/base.js";

export class NeoCheckbox extends LitElement {
  static properties = {
    name: { type: String },
    value: { type: String },
    checked: { type: Boolean, reflect: true },
    indeterminate: { type: Boolean, reflect: true },
    disabled: { type: Boolean, reflect: true },
    required: { type: Boolean, reflect: true },
    error: { type: String },
    validationMessage: { type: String },
  };

  static styles = [
    baseStyles,
    css`
      :host {
        display: inline-flex;
        align-items: center;
        gap: var(--spacing-sm);
        cursor: pointer;
        font-family: var(--font-family);
      }

      :host([disabled]) {
        cursor: not-allowed;
        opacity: 0.6;
      }

      .checkbox-wrapper {
        position: relative;
      }

      .checkbox {
        appearance: none;
        -webkit-appearance: none;
        width: 1.25rem;
        height: 1.25rem;
        border: 2px solid var(--color-border);
        border-radius: var(--radius-sm);
        outline: none;
        margin: 0;
        cursor: inherit;
        display: grid;
        place-content: center;
      }

      .checkbox::before {
        content: "";
        width: 0.65rem;
        height: 0.65rem;
        transform: scale(0);
        transition: transform var(--transition-fast);
        box-shadow: inset 1em 1em var(--color-primary);
        transform-origin: center;
        clip-path: polygon(14% 44%, 0 65%, 50% 100%, 100% 16%, 80% 0%, 43% 62%);
      }

      .checkbox:checked::before {
        transform: scale(1);
      }

      .checkbox:indeterminate::before {
        transform: scale(1);
        clip-path: none;
        border-radius: calc(var(--radius-sm) / 2);
        background-color: var(--color-primary);
        width: 0.75rem;
        height: 0.125rem;
      }

      .checkbox:focus-visible {
        outline: 2px solid var(--color-primary);
        outline-offset: 2px;
      }

      :host([disabled]) .checkbox {
        border-color: var(--color-border);
      }

      :host([disabled]) .checkbox:checked::before,
      :host([disabled]) .checkbox:indeterminate::before {
        box-shadow: inset 1em 1em var(--color-secondary);
        background-color: var(--color-secondary);
      }

      label {
        cursor: inherit;
        user-select: none;
        font-size: var(--font-size-sm);
        color: var(--color-text);
      }

      .error-message {
        font-size: var(--font-size-xs);
        color: var(--color-error);
        margin-top: var(--spacing-xs);
      }
    `,
  ];

  constructor() {
    super();
    this.checked = false;
    this.indeterminate = false;
    this.disabled = false;
    this.required = false;
    this.error = "";
    this.validationMessage = "";
  }

  setCustomValidity(message) {
    this.validationMessage = message;
    this.error = message;
    this.requestUpdate();
  }

  reportValidity() {
    if (this.required && !this.checked) {
      this.error = this.validationMessage || "This field is required";
      this.dispatchEvent(new Event("invalid", { bubbles: true }));
      return false;
    }
    this.error = "";
    return true;
  }

  render() {
    return html`
      <label>
        <div class="checkbox-wrapper">
          <input
            type="checkbox"
            class="checkbox"
            .name=${this.name}
            .value=${this.value}
            .checked=${this.checked}
            .indeterminate=${this.indeterminate}
            ?disabled=${this.disabled}
            ?required=${this.required}
            @change=${this._handleChange}
            @keydown=${this._handleKeyDown}
            aria-checked=${this.indeterminate ? "mixed" : this.checked}
            aria-disabled=${this.disabled}
            aria-required=${this.required}
            aria-invalid=${Boolean(this.error)}
          />
        </div>
        <slot></slot>
      </label>
      ${this.error
        ? html`<div class="error-message" role="alert">${this.error}</div>`
        : ""}
    `;
  }

  updated(changedProperties) {
    if (changedProperties.has("indeterminate")) {
      this.renderRoot.querySelector("input").indeterminate = this.indeterminate;
    }
  }

  _handleChange(e) {
    this.checked = e.target.checked;
    this.indeterminate = false;
    this.error = "";
    this.dispatchEvent(
      new CustomEvent("change", {
        detail: {
          checked: this.checked,
          indeterminate: this.indeterminate,
          value: this.value,
          name: this.name,
        },
        bubbles: true,
        composed: true,
      })
    );
  }

  _handleKeyDown(e) {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      this.checked = !this.checked;
      this._handleChange({ target: { checked: this.checked } });
    }
  }
}

customElements.define("neo-checkbox", NeoCheckbox);
