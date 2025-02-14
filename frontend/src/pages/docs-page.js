import { LitElement, html, css } from "lit";
import { baseStyles } from "../components/styles/base.js";

export class DocsPage extends LitElement {
  static styles = [
    baseStyles,
    css`
      :host {
        display: block;
        padding: var(--spacing-lg);
      }

      .docs-container {
        max-width: 800px;
        margin: 0 auto;
      }

      h1 {
        font-size: 2.5rem;
        margin-bottom: var(--spacing-lg);
        color: var(--color-primary);
      }

      .section {
        margin-bottom: var(--spacing-xl);
      }

      h2 {
        font-size: 1.5rem;
        margin-bottom: var(--spacing-md);
        color: var(--color-text);
      }

      p {
        margin-bottom: var(--spacing-md);
        line-height: 1.6;
      }

      code {
        background: #f1f5f9;
        padding: 0.2em 0.4em;
        border-radius: var(--radius-sm);
        font-family: monospace;
      }
    `,
  ];

  render() {
    return html`
      <div class="docs-container">
        <h1>Documentation</h1>

        <div class="section">
          <h2>Getting Started</h2>
          <p>
            Welcome to NeoForge documentation. This guide will help you get
            started with building modern web applications using our component
            library.
          </p>
          <p>
            Install the library using npm:
            <code>npm install @neoforge/components</code>
          </p>
        </div>

        <div class="section">
          <h2>Components</h2>
          <p>
            NeoForge provides a set of web components built with Lit. Each
            component follows web standards and is highly customizable.
          </p>
          <p>
            Import components individually:
            <code>import '@neoforge/components/button';</code>
          </p>
        </div>

        <div class="section">
          <h2>Theming</h2>
          <p>
            Customize the look and feel using CSS custom properties. NeoForge
            components use a consistent theming system that makes it easy to
            match your brand.
          </p>
        </div>
      </div>
    `;
  }
}

customElements.define("docs-page", DocsPage);
