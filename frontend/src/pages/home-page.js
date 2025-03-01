import {  LitElement, html, css  } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";
import { customElement } from "lit/decorators.js";

@customElement("home-page")
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
