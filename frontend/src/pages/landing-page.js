import {  LitElement, html, css  } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";
import { baseStyles } from "../components/styles/base.js";

export class LandingPage extends LitElement {
  static styles = [
    baseStyles,
    css`
      :host {
        display: block;
        padding: var(--spacing-lg);
      }

      .hero {
        text-align: center;
        max-width: 800px;
        margin: 0 auto;
        padding: var(--spacing-xl) 0;
      }

      h1 {
        font-size: 3rem;
        margin-bottom: var(--spacing-md);
        color: var(--color-primary);
      }

      p {
        font-size: 1.25rem;
        color: var(--color-text);
        margin-bottom: var(--spacing-lg);
      }
    `,
  ];

  render() {
    return html`
      <div class="hero">
        <h1>Welcome to NeoForge</h1>
        <p>A modern, efficient, and cost-effective development starter kit</p>
        <neo-button variant="primary" size="lg">Get Started</neo-button>
      </div>
    `;
  }
}

customElements.define("landing-page", LandingPage);
