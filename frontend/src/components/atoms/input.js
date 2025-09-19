/**
 * Input Atom Component
 * Basic form input element with validation states
 */
export class Input extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
    this.attachEventListeners();
  }

  static get observedAttributes() {
    return ['type', 'placeholder', 'value', 'disabled', 'required', 'error', 'label'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      this.render();
    }
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

  get disabled() {
    return this.hasAttribute('disabled');
  }

  get required() {
    return this.hasAttribute('required');
  }

  get error() {
    return this.getAttribute('error');
  }

  get label() {
    return this.getAttribute('label');
  }

  render() {
    const styles = `
      :host {
        display: block;
        margin-bottom: 1rem;
      }

      .input-container {
        position: relative;
      }

      .label {
        display: block;
        margin-bottom: 0.5rem;
        font-size: 0.875rem;
        font-weight: 500;
        color: #374151;
      }

      .input-wrapper {
        position: relative;
      }

      .input {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid ${this.error ? '#ef4444' : '#d1d5db'};
        border-radius: 6px;
        font-size: 1rem;
        background: ${this.disabled ? '#f9fafb' : '#ffffff'};
        color: ${this.disabled ? '#6b7280' : '#111827'};
        transition: all 0.2s ease;
        box-sizing: border-box;
      }

      .input:focus {
        outline: none;
        border-color: ${this.error ? '#ef4444' : '#2563eb'};
        box-shadow: 0 0 0 3px ${this.error ? 'rgba(239, 68, 68, 0.1)' : 'rgba(37, 99, 235, 0.1)'};
      }

      .input:disabled {
        cursor: not-allowed;
      }

      .error-message {
        display: block;
        margin-top: 0.25rem;
        font-size: 0.875rem;
        color: #ef4444;
      }

      .icon {
        position: absolute;
        right: 0.75rem;
        top: 50%;
        transform: translateY(-50%);
        color: ${this.error ? '#ef4444' : '#6b7280'};
        pointer-events: none;
      }
    `;

    const labelHtml = this.label ? `<label class="label">${this.label}</label>` : '';
    const errorHtml = this.error ? `<span class="error-message">${this.error}</span>` : '';

    this.shadowRoot.innerHTML = `
      <style>${styles}</style>
      ${labelHtml}
      <div class="input-container">
        <div class="input-wrapper">
          <input
            class="input"
            type="${this.type}"
            placeholder="${this.placeholder}"
            value="${this.value}"
            ${this.disabled ? 'disabled' : ''}
            ${this.required ? 'required' : ''}
          />
          ${this.error ? '<span class="icon">⚠️</span>' : ''}
        </div>
        ${errorHtml}
      </div>
    `;
  }

  attachEventListeners() {
    const input = this.shadowRoot.querySelector('.input');

    input.addEventListener('input', (e) => {
      this.setAttribute('value', e.target.value);
      this.dispatchEvent(new CustomEvent('input-change', {
        bubbles: true,
        composed: true,
        detail: { value: e.target.value }
      }));
    });

    input.addEventListener('blur', (e) => {
      this.dispatchEvent(new CustomEvent('input-blur', {
        bubbles: true,
        composed: true,
        detail: { value: e.target.value }
      }));
    });

    input.addEventListener('focus', (e) => {
      this.dispatchEvent(new CustomEvent('input-focus', {
        bubbles: true,
        composed: true,
        detail: { value: e.target.value }
      }));
    });
  }

  // Public methods
  focus() {
    const input = this.shadowRoot.querySelector('.input');
    if (input) input.focus();
  }

  setValue(value) {
    this.setAttribute('value', value);
    const input = this.shadowRoot.querySelector('.input');
    if (input) input.value = value;
  }

  getValue() {
    const input = this.shadowRoot.querySelector('.input');
    return input ? input.value : this.value;
  }

  setError(error) {
    if (error) {
      this.setAttribute('error', error);
    } else {
      this.removeAttribute('error');
    }
  }
}

customElements.define('neo-input', Input);