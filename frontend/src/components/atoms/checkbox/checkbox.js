import { 
  LitElement,
  html,
  css,
 } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";
import { baseStyles } from "../../styles/base.js";

/**
 * Checkbox component for boolean input
 * @element neo-checkbox
 *
 * @prop {string} label - Checkbox label
 * @prop {boolean} checked - Whether the checkbox is checked
 * @prop {boolean} indeterminate - Whether the checkbox is in indeterminate state
 * @prop {boolean} disabled - Whether the checkbox is disabled
 * @prop {boolean} required - Whether the checkbox is required
 * @prop {string} error - Error message to display
 */
export class NeoCheckbox extends LitElement {
  static get properties() {
    return {
      label: { type: String },
      checked: { type: Boolean, reflect: true },
      indeterminate: { type: Boolean, reflect: true },
      disabled: { type: Boolean, reflect: true },
      required: { type: Boolean, reflect: true },
      error: { type: String },
    };
  }

  static get styles() {
    return [
      baseStyles,
      css`
        :host {
          display: block;
          margin-bottom: var(--spacing-sm);
        }

        .checkbox-wrapper {
          display: flex;
          align-items: flex-start;
          gap: var(--spacing-xs);
          cursor: pointer;
        }

        .checkbox-wrapper.disabled {
          cursor: not-allowed;
          opacity: 0.5;
        }

        .checkbox-container {
          position: relative;
          width: 18px;
          height: 18px;
          flex-shrink: 0;
        }

        input[type="checkbox"] {
          position: absolute;
          opacity: 0;
          width: 100%;
          height: 100%;
          margin: 0;
          cursor: inherit;
        }

        .checkbox-custom {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: white;
          border: 2px solid var(--color-border);
          border-radius: var(--radius-sm);
          transition: all var(--transition-fast);
        }

        input[type="checkbox"]:focus + .checkbox-custom {
          border-color: var(--color-primary);
          box-shadow: 0 0 0 2px var(--color-primary-light);
        }

        input[type="checkbox"]:checked + .checkbox-custom {
          background: var(--color-primary);
          border-color: var(--color-primary);
        }

        input[type="checkbox"]:checked + .checkbox-custom::after {
          content: "";
          position: absolute;
          left: 5px;
          top: 2px;
          width: 4px;
          height: 8px;
          border: solid white;
          border-width: 0 2px 2px 0;
          transform: rotate(45deg);
        }

        .checkbox-wrapper.indeterminate .checkbox-custom::after {
          content: "";
          position: absolute;
          left: 3px;
          top: 7px;
          width: 8px;
          height: 2px;
          background: white;
        }

        label {
          font-size: var(--font-size-sm);
          line-height: 1.4;
          color: var(--color-text);
          user-select: none;
        }

        .error-message {
          margin-top: var(--spacing-xs);
          color: var(--color-error);
          font-size: var(--font-size-sm);
        }

        .checkbox-wrapper.error .checkbox-custom {
          border-color: var(--color-error);
        }

        .checkbox-wrapper.error
          input[type="checkbox"]:focus
          + .checkbox-custom {
          box-shadow: 0 0 0 2px var(--color-error-light);
        }
      `,
    ];
  }

  constructor() {
    super();
    this.checked = false;
    this.indeterminate = false;
    this.disabled = false;
    this.required = false;
    this.error = "";
    this._id = `neo-checkbox-${Math.random().toString(36).substr(2, 9)}`;
  }

  _handleChange(e) {
    if (!this.disabled) {
      this.checked = e.target.checked;
      this.indeterminate = false;
      this.dispatchEvent(
        new CustomEvent("neo-change", {
          detail: { checked: this.checked },
          bubbles: true,
          composed: true,
        })
      );
    }
  }

  updated(changedProperties) {
    if (changedProperties.has("indeterminate")) {
      const checkbox = this.shadowRoot.querySelector("input[type='checkbox']");
      if (checkbox) {
        checkbox.indeterminate = this.indeterminate;
      }
    }
  }

  render() {
    const wrapperClasses = {
      "checkbox-wrapper": true,
      disabled: this.disabled,
      error: !!this.error,
      indeterminate: this.indeterminate,
      checked: this.checked,
    };

    return html`
      <div
        class="${Object.entries(wrapperClasses)
          .filter(([, value]) => value)
          .map(([key]) => key)
          .join(" ")}"
      >
        <div class="checkbox-container">
          <input
            type="checkbox"
            id="${this._id}"
            .checked="${this.checked}"
            .indeterminate="${this.indeterminate}"
            ?disabled="${this.disabled}"
            ?required="${this.required}"
            @change="${this._handleChange}"
            aria-label="${this.label}"
            aria-invalid="${Boolean(this.error)}"
            aria-errormessage="${this.error ? `${this._id}-error` : ""}"
          />
          <div class="checkbox-custom"></div>
        </div>
        ${this.label
          ? html`<label for="${this._id}">${this.label}</label>`
          : ""}
      </div>
      ${this.error
        ? html`<div id="${this._id}-error" class="error-message">
            ${this.error}
          </div>`
        : ""}
    `;
  }
}

if (!customElements.get("neo-checkbox")) {
  customElements.define("neo-checkbox", NeoCheckbox);
}
