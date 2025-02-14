import { LitElement, html, css } from "lit";
import { baseStyles } from "../components/styles/base.js";

export class ExamplesPage extends LitElement {
  static styles = [
    baseStyles,
    css`
      :host {
        display: block;
        padding: var(--spacing-lg);
      }

      .examples-container {
        max-width: 1200px;
        margin: 0 auto;
      }

      h1 {
        font-size: 2.5rem;
        margin-bottom: var(--spacing-xl);
        color: var(--color-primary);
        text-align: center;
      }

      .examples-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: var(--spacing-lg);
      }

      .example-card {
        background: white;
        border-radius: var(--radius-lg);
        padding: var(--spacing-lg);
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }

      .example-card h2 {
        font-size: 1.25rem;
        margin-bottom: var(--spacing-md);
        color: var(--color-text);
      }

      .example-card p {
        color: var(--color-secondary);
        margin-bottom: var(--spacing-md);
      }

      .example-preview {
        background: #f8fafc;
        padding: var(--spacing-md);
        border-radius: var(--radius-md);
        margin-bottom: var(--spacing-md);
      }

      .view-code {
        display: inline-flex;
        align-items: center;
        gap: var(--spacing-xs);
        color: var(--color-primary);
        text-decoration: none;
        font-size: var(--font-size-sm);
      }

      .view-code:hover {
        text-decoration: underline;
      }
    `,
  ];

  render() {
    return html`
      <div class="examples-container">
        <h1>Component Examples</h1>

        <div class="examples-grid">
          <div class="example-card">
            <h2>Button Variants</h2>
            <p>Different styles and states of the button component.</p>
            <div class="example-preview">
              <neo-button variant="primary">Primary</neo-button>
              <neo-button variant="secondary">Secondary</neo-button>
              <neo-button variant="text">Text</neo-button>
            </div>
            <a href="/docs/button" class="view-code"> View Documentation → </a>
          </div>

          <div class="example-card">
            <h2>Form Controls</h2>
            <p>Input components with validation and states.</p>
            <div class="example-preview">
              <neo-input placeholder="Enter your name"></neo-input>
              <neo-checkbox>Remember me</neo-checkbox>
            </div>
            <a href="/docs/forms" class="view-code"> View Documentation → </a>
          </div>

          <div class="example-card">
            <h2>Data Display</h2>
            <p>Components for displaying structured data.</p>
            <div class="example-preview">
              <neo-badge>New</neo-badge>
              <neo-badge variant="success">Success</neo-badge>
              <neo-badge variant="warning">Warning</neo-badge>
            </div>
            <a href="/docs/data-display" class="view-code">
              View Documentation →
            </a>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define("examples-page", ExamplesPage);
