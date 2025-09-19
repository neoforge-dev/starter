/**
 * Card Atom Component
 * Basic container with shadow and padding
 */
export class Card extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
  }

  static get observedAttributes() {
    return ['variant', 'padding', 'shadow'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      this.render();
    }
  }

  get variant() {
    return this.getAttribute('variant') || 'default';
  }

  get padding() {
    return this.getAttribute('padding') || 'medium';
  }

  get shadow() {
    return this.getAttribute('shadow') || 'medium';
  }

  render() {
    const styles = `
      :host {
        display: block;
      }

      .card {
        background: white;
        border-radius: 8px;
        border: 1px solid #e5e7eb;
        box-shadow: ${this.getShadow()};
        transition: box-shadow 0.2s ease;
      }

      .card:hover {
        box-shadow: ${this.getHoverShadow()};
      }

      .card-content {
        padding: ${this.getPaddingValue()};
      }
    `;

    this.shadowRoot.innerHTML = `
      <style>${styles}</style>
      <div class="card">
        <div class="card-content">
          <slot></slot>
        </div>
      </div>
    `;
  }

  getPaddingValue() {
    const paddings = {
      small: '0.75rem',
      medium: '1rem',
      large: '1.5rem',
      none: '0'
    };
    return paddings[this.padding] || paddings.medium;
  }

  getShadow() {
    const shadows = {
      none: 'none',
      small: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      medium: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      large: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
    };
    return shadows[this.shadow] || shadows.medium;
  }

  getHoverShadow() {
    const hoverShadows = {
      none: 'none',
      small: '0 2px 4px 0 rgba(0, 0, 0, 0.1)',
      medium: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      large: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
    };
    return hoverShadows[this.shadow] || hoverShadows.medium;
  }
}

customElements.define('neo-card', Card);