import {
  LitElement,
  html,
  css,
} from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";

export class Radio extends LitElement {
  static properties = {
    name: { type: String },
    value: { type: String },
    checked: { type: Boolean },
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

    .radio {
      appearance: none;
      -webkit-appearance: none;
      width: 1.25rem;
      height: 1.25rem;
      border: 2px solid var(--radio-border-color, #6b7280);
      border-radius: 50%;
      outline: none;
      margin: 0;
      cursor: inherit;
      display: grid;
      place-content: center;
    }

    .radio::before {
      content: "";
      width: 0.65rem;
      height: 0.65rem;
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
  `;

  constructor() {
    super();
    this.checked = false;
    this.disabled = false;
    this.required = false;
  }

  render() {
    return html`
      <label>
        <input
          type="radio"
          class="radio"
          .name=${this.name}
          .value=${this.value}
          .checked=${this.checked}
          .disabled=${this.disabled}
          .required=${this.required}
          @change=${this._handleChange}
        />
        <slot></slot>
      </label>
    `;
  }

  _handleChange(e) {
    this.checked = e.target.checked;
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
}

customElements.define("ui-radio", Radio);
