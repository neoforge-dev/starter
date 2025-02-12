import { LitElement, html, css } from "/vendor/lit-core.min.js";
import { baseStyles } from "../styles/base.js";
import { LoadingMixin } from "../mixins/loading.js";

export class DocsPage extends LoadingMixin(LitElement) {
  static properties = {
    activeSection: { type: String },
    sections: { type: Array },
  };

  static styles = [
    baseStyles,
    css`
      :host {
        display: block;
      }

      .docs-container {
        display: grid;
        grid-template-columns: 250px 1fr;
        gap: var(--spacing-xl);
        max-width: 1200px;
        margin: 0 auto;
        padding: var(--spacing-xl);
      }

      .sidebar {
        position: sticky;
        top: var(--spacing-xl);
        height: fit-content;
      }

      .nav-item {
        padding: var(--spacing-sm);
        color: var(--text-secondary);
        text-decoration: none;
        display: block;
        border-radius: var(--radius-md);
        transition: all var(--transition-fast);
      }

      .nav-item:hover,
      .nav-item.active {
        background: var(--surface-color);
        color: var(--text-color);
      }

      .content {
        min-height: 500px;
      }

      h1 {
        margin-bottom: var(--spacing-xl);
        color: var(--text-color);
      }
    `,
  ];

  constructor() {
    super();
    this.activeSection = "getting-started";
    this.sections = [
      { id: "getting-started", title: "Getting Started" },
      { id: "installation", title: "Installation" },
      { id: "components", title: "Components" },
      { id: "routing", title: "Routing" },
      { id: "state", title: "State Management" },
      { id: "deployment", title: "Deployment" },
    ];
  }

  async firstUpdated() {
    // Load documentation content
    await this.loadContent();
  }

  async loadContent() {
    try {
      this.startLoading();
      // Fetch documentation content
      const response = await fetch(`/api/docs/${this.activeSection}`);
      const content = await response.json();
      this.content = content;
    } catch (error) {
      console.error("Failed to load docs:", error);
    } finally {
      this.stopLoading();
    }
  }

  render() {
    return html`
      <div class="docs-container">
        <nav class="sidebar">
          ${this.sections.map(
            (section) => html`
              <a
                href="#${section.id}"
                class="nav-item ${this.activeSection === section.id
                  ? "active"
                  : ""}"
                @click=${() => (this.activeSection = section.id)}
              >
                ${section.title}
              </a>
            `
          )}
        </nav>

        <main class="content">
          ${this.loading
            ? this.renderLoading()
            : html`<div class="markdown-content">${this.content}</div>`}
        </main>
      </div>
    `;
  }
}

customElements.define("docs-page", DocsPage);
