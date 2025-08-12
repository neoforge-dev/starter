import {   LitElement, html, css   } from 'lit';

export class HomePage extends LitElement {
  static styles = css`
    :host {
      display: block;
      padding: var(--spacing-lg, 2rem);
    }
  `;

  render() {
    return html`
      <div class="home-container">
        <h1>Welcome to NeoForge</h1>
        <p>A modern web development starter kit</p>
      </div>
    `;
  }
}

// Register the component
customElements.define("home-page", HomePage);
