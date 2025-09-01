import { LitElement, html, css } from 'lit';

export class Card extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    .card {
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      background: white;
      padding: 16px;
    }
  `;

  render() {
    return html`
      <div class="card">
        <slot></slot>
      </div>
    `;
  }

  getWrapper() {
    const wrapper = document.createElement(this.tagName);
    wrapper.className = 'card';
    return wrapper;
  }
}

customElements.define('nf-card', Card);
