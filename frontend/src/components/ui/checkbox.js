import {
  LitElement,
  html,
  css,
} from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";

export class Checkbox extends LitElement {
  static properties = {
    name: { type: String },
    value: { type: String },
    checked: { type: Boolean },
    indeterminate: { type: Boolean },
    disabled: { type: Boolean },
    required: { type: Boolean },
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

    .checkbox {
      appearance: none;
      -webkit-appearance: none;
      width: 1.25rem;
      height: 1.25rem;
      border: 2px solid var(--checkbox-border-color, #6b7280);
      border-radius: 0.25rem;
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
      transition: transform 0.15s ease-in-out;
      box-shadow: inset 1em 1em var(--checkbox-checked-color, #2563eb);
      transform-origin: center;
      clip-path: polygon(14% 44%, 0 65%, 50% 100%, 100% 16%, 80% 0%, 43% 62%);
    }

    .checkbox:checked::before {
      transform: scale(1);
    }

    .checkbox:indeterminate::before {
      transform: scale(1);
      clip-path: none;
      border-radius: 0.125rem;
      background-color: var(--checkbox-checked-color, #2563eb);
      width: 0.75rem;
      height: 0.125rem;
    }

    .checkbox:focus-visible {
      outline: 2px solid var(--checkbox-focus-color, #60a5fa);
      outline-offset: 2px;
    }

    :host([disabled]) .checkbox {
      border-color: var(--checkbox-disabled-color, #9ca3af);
    }

    :host([disabled]) .checkbox:checked::before,
    :host([disabled]) .checkbox:indeterminate::before {
      box-shadow: inset 1em 1em var(--checkbox-disabled-color, #9ca3af);
      background-color: var(--checkbox-disabled-color, #9ca3af);
    }

    label {
      cursor: inherit;
      user-select: none;
    }
  `;

  constructor() {
    super();
    this.checked = false;
    this.indeterminate = false;
    this.disabled = false;
    this.required = false;
  }

  render() {
    return html`
      <label>
        <input
          type="checkbox"
          class="checkbox"
          .name=${this.name}
          .value=${this.value}
          .checked=${this.checked}
          .indeterminate=${this.indeterminate}
          .disabled=${this.disabled}
          .required=${this.required}
          @change=${this._handleChange}
        />
        <slot></slot>
      </label>
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
}

customElements.define("ui-checkbox", Checkbox);
