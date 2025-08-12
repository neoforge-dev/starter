import {   LitElement, html, css   } from 'lit';
import { baseStyles } from "../styles/base.js";
import "../components/playground/component-playground.js";

/**
 * Component playground page
 * @customElement playground-page
 */
export class PlaygroundPage extends LitElement {
  static styles = [
    baseStyles,
    css`
      :host {
        display: block;
        padding: var(--spacing-lg);
      }

      .page-header {
        margin-bottom: var(--spacing-xl);
      }

      .page-title {
        font-size: 2rem;
        margin: 0 0 var(--spacing-md);
      }

      .page-description {
        color: var(--color-text-secondary);
        max-width: 800px;
      }

      .component-list {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: var(--spacing-lg);
        margin-bottom: var(--spacing-xl);
      }

      .component-card {
        background: var(--color-surface);
        border-radius: var(--radius-lg);
        padding: var(--spacing-md);
        cursor: pointer;
        transition: transform var(--transition-fast);
      }

      .component-card:hover {
        transform: translateY(-2px);
      }

      .component-name {
        font-weight: 500;
        margin: 0 0 var(--spacing-sm);
      }

      .component-description {
        color: var(--color-text-secondary);
        font-size: 0.9em;
        margin: 0;
      }

      .playground-container {
        height: 800px;
        margin-bottom: var(--spacing-xl);
      }
    `,
  ];

  static properties = {
    _selectedComponent: { type: String, state: true },
  };

  constructor() {
    super();
    this._selectedComponent = null;
    this._components = [
      {
        name: "memory-monitor",
        description: "Monitor and display memory leaks in the application",
        code: `
import {   LitElement, html, css   } from 'lit';

class CustomMemoryMonitor extends LitElement {
  static properties = {
    maxLeaks: { type: Number },
    autoHide: { type: Boolean },
  };

  constructor() {
    super();
    this.maxLeaks = 50;
    this.autoHide = true;
  }

  render() {
    return html\`
      <div>
        <h3>Memory Monitor</h3>
        <p>Max Leaks: \${this.maxLeaks}</p>
        <p>Auto Hide: \${this.autoHide}</p>
      </div>
    \`;
  }
}

customElements.define("custom-memory-monitor", CustomMemoryMonitor);`,
        properties: {
          maxLeaks: { type: "number", value: 50 },
          autoHide: { type: "boolean", value: true },
        },
      },
      // Add more components here
    ];
  }

  render() {
    return html`
      <div class="page-header">
        <h1 class="page-title">Component Playground</h1>
        <p class="page-description">
          Explore and experiment with our web components in real-time. Select a
          component to view its live preview, edit its code, and modify its
          properties.
        </p>
      </div>

      <div class="component-list">
        ${this._components.map(
          (component) => html`
            <div
              class="component-card"
              @click=${() => (this._selectedComponent = component.name)}
            >
              <h3 class="component-name">${component.name}</h3>
              <p class="component-description">${component.description}</p>
            </div>
          `
        )}
      </div>

      ${this._selectedComponent
        ? html`
            <div class="playground-container">
              <component-playground
                .component=${this._getSelectedComponent().name}
                .code=${this._getSelectedComponent().code}
                .properties=${this._getSelectedComponent().properties}
              >
                <div slot="docs">
                  ${this._renderDocs(this._getSelectedComponent())}
                </div>
              </component-playground>
            </div>
          `
        : null}
    `;
  }

  _getSelectedComponent() {
    return (
      this._components.find((c) => c.name === this._selectedComponent) || null
    );
  }

  _renderDocs(component) {
    return html`
      <h3>${component.name}</h3>
      <p>${component.description}</p>
      <h4>Properties</h4>
      <ul>
        ${Object.entries(component.properties).map(
          ([name, config]) => html`
            <li><strong>${name}</strong>: ${config.type}</li>
          `
        )}
      </ul>
    `;
  }
}

customElements.define("playground-page", PlaygroundPage);
