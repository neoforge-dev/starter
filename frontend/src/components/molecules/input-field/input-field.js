import { html, css } from "lit";
import { BaseComponent } from "../../base-component.js";
import { baseStyles } from "../../styles/base.js";
import "../../atoms/label/label.js";
import "../../atoms/input/input.js";

/**
 * Complete form field with label, input, validation, and help text
 * @element neo-input-field
 *
 * @prop {string} label - Field label text
 * @prop {string} type - Input type (text, email, password, etc.)
 * @prop {string} value - Input value
 * @prop {string} placeholder - Input placeholder
 * @prop {string} helpText - Help text shown below input
 * @prop {string} error - Error message (when present, shows error state)
 * @prop {boolean} required - Whether field is required
 * @prop {boolean} disabled - Whether field is disabled
 * @prop {string} name - Form field name
 * @prop {string} autocomplete - Autocomplete attribute
 * @prop {number} maxLength - Maximum input length
 * @prop {number} minLength - Minimum input length
 * @prop {string} pattern - Validation pattern
 * @prop {string} size - Field size (sm, md, lg)
 *
 * @fires neo-input - When input value changes
 * @fires neo-focus - When input gains focus
 * @fires neo-blur - When input loses focus
 */
export class NeoInputField extends BaseComponent {
  static get properties() {
    return {
      label: { type: String },
      type: { type: String },
      value: { type: String },
      placeholder: { type: String },
      helpText: { type: String, attribute: 'help-text' },
      error: { type: String },
      required: { type: Boolean },
      disabled: { type: Boolean },
      name: { type: String },
      autocomplete: { type: String },
      maxLength: { type: Number, attribute: 'max-length' },
      minLength: { type: Number, attribute: 'min-length' },
      pattern: { type: String },
      size: { type: String },
      _inputId: { type: String, state: true },
    };
  }

  static get styles() {
    return [
      baseStyles,
      css`
        :host {
          display: block;
          width: 100%;
        }

        .field-container {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xs);
        }

        .input-container {
          position: relative;
        }

        neo-input {
          width: 100%;
        }

        neo-label {
          display: block;
        }

        .help-text {
          font-size: var(--font-size-sm);
          color: var(--color-text-light);
          line-height: 1.4;
        }

        .error-text {
          font-size: var(--font-size-sm);
          color: var(--color-error);
          line-height: 1.4;
          display: flex;
          align-items: flex-start;
          gap: var(--spacing-xs);
        }

        .error-icon {
          width: 16px;
          height: 16px;
          flex-shrink: 0;
          margin-top: 1px;
        }

        /* Error state styling */
        :host([error]) neo-input {
          --input-border-color: var(--color-error);
          --input-focus-border-color: var(--color-error);
          --input-focus-shadow-color: var(--color-error-light);
        }

        /* Size variations */
        :host([size="sm"]) neo-input {
          --input-height: 36px;
          --input-font-size: var(--font-size-sm);
        }

        :host([size="lg"]) neo-input {
          --input-height: 48px;
          --input-font-size: var(--font-size-lg);
        }

        /* Transitions for smooth error state changes */
        .error-text {
          animation: slideDown 0.2s ease-out;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Focus state management */
        :host([focused]) {
          --label-color: var(--color-primary);
        }

        /* Disabled state */
        :host([disabled]) {
          opacity: 0.6;
          pointer-events: none;
        }
      `,
    ];
  }

  constructor() {
    super();
    this.label = '';
    this.type = 'text';
    this.value = '';
    this.placeholder = '';
    this.helpText = '';
    this.error = '';
    this.required = false;
    this.disabled = false;
    this.name = '';
    this.autocomplete = '';
    this.maxLength = null;
    this.minLength = null;
    this.pattern = '';
    this.size = 'md';
    this._inputId = `input-${Math.random().toString(36).substr(2, 9)}`;
  }

  updated(changedProperties) {
    super.updated(changedProperties);

    // Update host attributes for styling
    if (changedProperties.has('error')) {
      if (this.error) {
        this.setAttribute('error', '');
      } else {
        this.removeAttribute('error');
      }
    }

    if (changedProperties.has('disabled')) {
      if (this.disabled) {
        this.setAttribute('disabled', '');
      } else {
        this.removeAttribute('disabled');
      }
    }
  }

  /**
   * Handle input events and forward them
   */
  _handleInput(e) {
    this.value = e.detail.value;

    // Clear error on user input
    if (this.error) {
      this.error = '';
    }

    this.dispatchEvent(new CustomEvent('neo-input', {
      detail: {
        value: this.value,
        name: this.name,
        validity: this._getInputElement()?.validity
      },
      bubbles: true,
      composed: true
    }));
  }

  /**
   * Handle focus events
   */
  _handleFocus(e) {
    this.setAttribute('focused', '');

    this.dispatchEvent(new CustomEvent('neo-focus', {
      detail: { name: this.name },
      bubbles: true,
      composed: true
    }));
  }

  /**
   * Handle blur events
   */
  _handleBlur(e) {
    this.removeAttribute('focused');

    // Validate on blur if we have validation rules
    this._validateInput();

    this.dispatchEvent(new CustomEvent('neo-blur', {
      detail: {
        name: this.name,
        value: this.value,
        validity: this._getInputElement()?.validity
      },
      bubbles: true,
      composed: true
    }));
  }

  /**
   * Validate the input and set error if invalid
   */
  _validateInput() {
    const inputElement = this._getInputElement();
    if (inputElement && !inputElement.validity.valid) {
      this.error = inputElement.validationMessage;
    }
  }

  /**
   * Get the input element reference
   */
  _getInputElement() {
    return this.shadowRoot?.querySelector('neo-input')?.shadowRoot?.querySelector('input');
  }

  /**
   * Public method to validate the field
   */
  validate() {
    this._validateInput();
    return !this.error;
  }

  /**
   * Public method to focus the input
   */
  focus() {
    const inputElement = this.shadowRoot?.querySelector('neo-input');
    if (inputElement && inputElement.focus) {
      inputElement.focus();
    }
  }

  /**
   * Public method to clear the field
   */
  clear() {
    this.value = '';
    this.error = '';
  }

  render() {
    const hasError = Boolean(this.error);
    const showHelpText = this.helpText && !hasError;

    return html`
      <div class="field-container">
        ${this.label ? html`
          <neo-label
            for="${this._inputId}"
            ?required="${this.required}"
            size="${this.size}">
            ${this.label}
          </neo-label>
        ` : ''}

        <div class="input-container">
          <neo-input
            id="${this._inputId}"
            type="${this.type}"
            .value="${this.value}"
            placeholder="${this.placeholder}"
            ?disabled="${this.disabled}"
            ?required="${this.required}"
            name="${this.name}"
            autocomplete="${this.autocomplete}"
            maxlength="${this.maxLength || ''}"
            minlength="${this.minLength || ''}"
            pattern="${this.pattern}"
            size="${this.size}"
            aria-invalid="${hasError}"
            aria-describedby="${hasError ? `${this._inputId}-error` : showHelpText ? `${this._inputId}-help` : ''}"
            @neo-input="${this._handleInput}"
            @focus="${this._handleFocus}"
            @blur="${this._handleBlur}">
          </neo-input>
        </div>

        ${hasError ? html`
          <div
            class="error-text"
            id="${this._inputId}-error"
            role="alert"
            aria-live="polite">
            <svg class="error-icon" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
            ${this.error}
          </div>
        ` : showHelpText ? html`
          <div
            class="help-text"
            id="${this._inputId}-help">
            ${this.helpText}
          </div>
        ` : ''}
      </div>
    `;
  }
}

// Register the component
if (!customElements.get("neo-input-field")) {
  customElements.define("neo-input-field", NeoInputField);
}
