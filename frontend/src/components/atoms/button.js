/**
 * Button Atom Component
 * The most basic interactive element
 */
export class Button extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
    this.attachEventListeners();
  }

  static get observedAttributes() {
    return ['variant', 'size', 'disabled', 'loading'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      this.render();
    }
  }

  get variant() {
    return this.getAttribute('variant') || 'primary';
  }

  get size() {
    return this.getAttribute('size') || 'medium';
  }

  get disabled() {
    return this.hasAttribute('disabled');
  }

  get loading() {
    return this.hasAttribute('loading');
  }

  render() {
    const styles = `
      :host {
        display: inline-block;
      }

      .button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        padding: ${this.getPadding()};
        border: ${this.getBorder()};
        border-radius: 6px;
        background: ${this.getBackground()};
        color: ${this.getColor()};
        font-size: ${this.getFontSize()};
        font-weight: 500;
        cursor: ${this.disabled || this.loading ? 'not-allowed' : 'pointer'};
        transition: all 0.2s ease;
        opacity: ${this.disabled ? '0.6' : '1'};
        min-height: ${this.getMinHeight()};
        position: relative;
      }

      .button:hover:not(:disabled):not(.loading) {
        transform: translateY(-1px);
        box-shadow: ${this.getHoverShadow()};
      }

      .button:active:not(:disabled):not(.loading) {
        transform: translateY(0);
      }

      .button:focus {
        outline: 2px solid ${this.getFocusColor()};
        outline-offset: 2px;
      }

      .spinner {
        width: 16px;
        height: 16px;
        border: 2px solid transparent;
        border-top: 2px solid currentColor;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      .loading-text {
        opacity: 0.7;
      }
    `;

    const content = this.loading ? `
      <span class="spinner"></span>
      <span class="loading-text"><slot></slot></span>
    ` : `
      <slot></slot>
    `;

    this.shadowRoot.innerHTML = `
      <style>${styles}</style>
      <button class="button ${this.loading ? 'loading' : ''}" ${this.disabled ? 'disabled' : ''}>
        ${content}
      </button>
    `;
  }

  attachEventListeners() {
    const button = this.shadowRoot.querySelector('.button');
    button.addEventListener('click', (e) => {
      if (this.disabled || this.loading) {
        e.preventDefault();
        return;
      }
      this.dispatchEvent(new CustomEvent('button-click', {
        bubbles: true,
        composed: true,
        detail: { originalEvent: e }
      }));
    });
  }

  getPadding() {
    const paddings = {
      small: '0.5rem 1rem',
      medium: '0.75rem 1.5rem',
      large: '1rem 2rem'
    };
    return paddings[this.size] || paddings.medium;
  }

  getBorder() {
    const variants = {
      primary: 'none',
      secondary: '1px solid #d1d5db',
      outline: '1px solid #2563eb',
      ghost: 'none'
    };
    return variants[this.variant] || variants.primary;
  }

  getBackground() {
    const variants = {
      primary: '#2563eb',
      secondary: '#ffffff',
      outline: 'transparent',
      ghost: 'transparent'
    };
    return variants[this.variant] || variants.primary;
  }

  getColor() {
    const variants = {
      primary: '#ffffff',
      secondary: '#374151',
      outline: '#2563eb',
      ghost: '#2563eb'
    };
    return variants[this.variant] || variants.primary;
  }

  getFontSize() {
    const sizes = {
      small: '0.875rem',
      medium: '1rem',
      large: '1.125rem'
    };
    return sizes[this.size] || sizes.medium;
  }

  getMinHeight() {
    const heights = {
      small: '32px',
      medium: '40px',
      large: '48px'
    };
    return heights[this.size] || heights.medium;
  }

  getHoverShadow() {
    const shadows = {
      primary: '0 4px 12px rgba(37, 99, 235, 0.3)',
      secondary: '0 2px 8px rgba(0, 0, 0, 0.1)',
      outline: '0 2px 8px rgba(37, 99, 235, 0.2)',
      ghost: '0 2px 8px rgba(37, 99, 235, 0.1)'
    };
    return shadows[this.variant] || shadows.primary;
  }

  getFocusColor() {
    const colors = {
      primary: '#2563eb',
      secondary: '#d1d5db',
      outline: '#2563eb',
      ghost: '#2563eb'
    };
    return colors[this.variant] || colors.primary;
  }
}

customElements.define('neo-button', Button);