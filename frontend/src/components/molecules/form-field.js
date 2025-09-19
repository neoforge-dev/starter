/**
 * Form Field Molecule Component
 * Combines input atom with label and error handling
 */
export class FormField extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
    this.attachEventListeners();
  }

  static get observedAttributes() {
    return ['label', 'type', 'placeholder', 'value', 'error', 'required', 'disabled'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      this.render();
    }
  }

  get label() {
    return this.getAttribute('label') || '';
  }

  get type() {
    return this.getAttribute('type') || 'text';
  }

  get placeholder() {
    return this.getAttribute('placeholder') || '';
  }

  get value() {
    return this.getAttribute('value') || '';
  }

  get error() {
    return this.getAttribute('error');
  }

  get required() {
    return this.hasAttribute('required');
  }

  get disabled() {
    return this.hasAttribute('disabled');
  }

  render() {
    const styles = `
      :host {
        display: block;
        margin-bottom: 1rem;
      }

      .form-field {
        position: relative;
      }

      .label {
        display: block;
        margin-bottom: 0.5rem;
        font-size: 0.875rem;
        font-weight: 500;
        color: #374151;
      }

      .label.required::after {
        content: ' *';
        color: #ef4444;
      }

      .input-container {
        position: relative;
      }

      .error-message {
        display: block;
        margin-top: 0.25rem;
        font-size: 0.875rem;
        color: #ef4444;
        animation: slideIn 0.2s ease-out;
      }

      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateY(-10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .success-icon {
        position: absolute;
        right: 0.75rem;
        top: 50%;
        transform: translateY(-50%);
        color: #10b981;
        font-size: 1.125rem;
      }
    `;

    const labelHtml = this.label ? `
      <label class="label ${this.required ? 'required' : ''}" for="input-${this.id || 'field'}">
        ${this.label}
      </label>
    ` : '';

    const errorHtml = this.error ? `<div class="error-message">${this.error}</div>` : '';

    const inputId = this.id || 'field';

    this.shadowRoot.innerHTML = `
      <style>${styles}</style>
      <div class="form-field">
        ${labelHtml}
        <div class="input-container">
          <neo-input
            id="input-${inputId}"
            type="${this.type}"
            placeholder="${this.placeholder}"
            value="${this.value}"
            ${this.error ? `error="${this.error}"` : ''}
            ${this.required ? 'required' : ''}
            ${this.disabled ? 'disabled' : ''}
          ></neo-input>
          ${this.value && !this.error ? '<span class="success-icon">✓</span>' : ''}
        </div>
        ${errorHtml}
      </div>
    `;
  }

  attachEventListeners() {
    const input = this.shadowRoot.querySelector('neo-input');

    if (input) {
      input.addEventListener('input-change', (e) => {
        this.setAttribute('value', e.detail.value);
        this.dispatchEvent(new CustomEvent('field-change', {
          bubbles: true,
          composed: true,
          detail: {
            value: e.detail.value,
            field: this.id || 'field'
          }
        }));
      });

      input.addEventListener('input-blur', (e) => {
        this.dispatchEvent(new CustomEvent('field-blur', {
          bubbles: true,
          composed: true,
          detail: {
            value: e.detail.value,
            field: this.id || 'field'
          }
        }));
      });

      input.addEventListener('input-focus', (e) => {
        this.dispatchEvent(new CustomEvent('field-focus', {
          bubbles: true,
          composed: true,
          detail: {
            value: e.detail.value,
            field: this.id || 'field'
          }
        }));
      });
    }
  }

  // Public methods
  setValue(value) {
    this.setAttribute('value', value);
    const input = this.shadowRoot.querySelector('neo-input');
    if (input) {
      input.setValue(value);
    }
  }

  getValue() {
    const input = this.shadowRoot.querySelector('neo-input');
    return input ? input.getValue() : this.value;
  }

  setError(error) {
    if (error) {
      this.setAttribute('error', error);
    } else {
      this.removeAttribute('error');
    }
  }

  clearError() {
    this.removeAttribute('error');
  }

  focus() {
    const input = this.shadowRoot.querySelector('neo-input');
    if (input) {
      input.focus();
    }
  }

  validate() {
    const value = this.getValue();
    let error = null;

    if (this.required && !value.trim()) {
      error = `${this.label || 'This field'} is required`;
    }

    if (this.type === 'email' && value && !this.isValidEmail(value)) {
      error = 'Please enter a valid email address';
    }

    if (this.type === 'password' && value && value.length < 8) {
      error = 'Password must be at least 8 characters long';
    }

    this.setError(error);
    return !error;
  }

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

customElements.define('neo-form-field', FormField);