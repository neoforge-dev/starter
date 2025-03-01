import {  LitElement, html, css  } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";
import { baseStyles } from "../../styles/base.js";

/**
 * Documentation page component
 * @customElement documentation-page
 */
export class DocumentationPage extends LitElement {
  static styles = [
    baseStyles,
    css`
      :host {
        display: block;
        min-height: 100vh;
      }

      .docs-container {
        display: grid;
        grid-template-columns: 250px 1fr;
        gap: var(--spacing-lg);
        padding: var(--spacing-lg);
      }

      .sidebar {
        position: sticky;
        top: var(--spacing-lg);
        height: calc(100vh - var(--spacing-lg) * 2);
        overflow-y: auto;
        background: var(--color-surface);
        border-radius: var(--radius-lg);
        padding: var(--spacing-lg);
      }

      .nav-group {
        margin-bottom: var(--spacing-lg);
      }

      .nav-title {
        font-weight: 500;
        margin: 0 0 var(--spacing-sm);
        color: var(--color-text-secondary);
        text-transform: uppercase;
        font-size: 0.8rem;
        letter-spacing: 0.05em;
      }

      .nav-list {
        list-style: none;
        padding: 0;
        margin: 0;
      }

      .nav-item {
        margin-bottom: var(--spacing-xs);
      }

      .nav-link {
        display: block;
        padding: var(--spacing-sm);
        color: var(--color-text);
        text-decoration: none;
        border-radius: var(--radius-sm);
        transition: all var(--transition-fast);
      }

      .nav-link:hover {
        background: var(--color-surface-hover);
      }

      .nav-link[active] {
        background: var(--color-primary);
        color: white;
      }

      .content {
        background: var(--color-surface);
        border-radius: var(--radius-lg);
        padding: var(--spacing-xl);
        min-height: calc(100vh - var(--spacing-lg) * 2);
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
        font-size: 1.1rem;
        max-width: 800px;
      }

      .search-box {
        margin-bottom: var(--spacing-lg);
      }

      .search-input {
        width: 100%;
        padding: var(--spacing-sm) var(--spacing-md);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-sm);
        background: var(--color-background);
      }

      .section {
        margin-bottom: var(--spacing-xl);
      }

      .section-title {
        font-size: 1.5rem;
        margin: 0 0 var(--spacing-lg);
      }

      .component-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: var(--spacing-lg);
      }

      .component-card {
        background: var(--color-background);
        border-radius: var(--radius-lg);
        padding: var(--spacing-lg);
        transition: transform var(--transition-fast);
      }

      .component-card:hover {
        transform: translateY(-2px);
      }

      .component-name {
        font-size: 1.2rem;
        margin: 0 0 var(--spacing-sm);
      }

      .component-description {
        color: var(--color-text-secondary);
        margin: 0 0 var(--spacing-md);
      }

      .component-tags {
        display: flex;
        gap: var(--spacing-xs);
      }

      .tag {
        padding: var(--spacing-xs) var(--spacing-sm);
        background: var(--color-surface);
        border-radius: var(--radius-sm);
        font-size: 0.8rem;
        color: var(--color-text-secondary);
      }

      @media (max-width: 768px) {
        .docs-container {
          grid-template-columns: 1fr;
        }

        .sidebar {
          position: fixed;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 100;
          height: auto;
          max-height: 50vh;
          border-radius: var(--radius-lg) var(--radius-lg) 0 0;
          transform: translateY(100%);
          transition: transform var(--transition-normal);
        }

        .sidebar.open {
          transform: translateY(0);
        }

        .mobile-nav-toggle {
          position: fixed;
          bottom: var(--spacing-md);
          right: var(--spacing-md);
          z-index: 101;
          padding: var(--spacing-sm) var(--spacing-md);
          background: var(--color-primary);
          color: white;
          border: none;
          border-radius: var(--radius-full);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }
      }
    `,
  ];

  static properties = {
    _currentSection: { type: String, state: true },
    _searchQuery: { type: String, state: true },
    _isMobileNavOpen: { type: Boolean, state: true },
  };

  constructor() {
    super();
    this._currentSection = "getting-started";
    this._searchQuery = "";
    this._isMobileNavOpen = false;
    this._sections = [
      {
        title: "Getting Started",
        items: [
          { id: "installation", title: "Installation" },
          { id: "quick-start", title: "Quick Start" },
          { id: "project-structure", title: "Project Structure" },
        ],
      },
      {
        title: "Components",
        items: [
          { id: "memory-monitor", title: "Memory Monitor" },
          { id: "performance-dashboard", title: "Performance Dashboard" },
          { id: "accessibility-dashboard", title: "Accessibility Dashboard" },
        ],
      },
      {
        title: "Guides",
        items: [
          { id: "styling", title: "Styling Guide" },
          { id: "testing", title: "Testing Guide" },
          { id: "deployment", title: "Deployment Guide" },
        ],
      },
    ];
  }

  render() {
    return html`
      <div class="docs-container">
        ${this._renderSidebar()} ${this._renderContent()}
      </div>
      ${this._renderMobileNav()}
    `;
  }

  _renderSidebar() {
    return html`
      <nav class="sidebar ${this._isMobileNavOpen ? "open" : ""}">
        <div class="search-box">
          <input
            type="search"
            class="search-input"
            placeholder="Search documentation..."
            .value=${this._searchQuery}
            @input=${this._handleSearch}
          />
        </div>
        ${this._sections.map(
          (section) => html`
            <div class="nav-group">
              <h2 class="nav-title">${section.title}</h2>
              <ul class="nav-list">
                ${section.items.filter(this._filterBySearch.bind(this)).map(
                  (item) => html`
                    <li class="nav-item">
                      <a
                        class="nav-link"
                        href="#${item.id}"
                        ?active=${this._currentSection === item.id}
                        @click=${() => this._setCurrentSection(item.id)}
                      >
                        ${item.title}
                      </a>
                    </li>
                  `
                )}
              </ul>
            </div>
          `
        )}
      </nav>
    `;
  }

  _renderContent() {
    return html`
      <main class="content">
        <div class="page-header">
          <h1 class="page-title">Documentation</h1>
          <p class="page-description">
            Explore our comprehensive documentation to learn about NeoForge's
            features, components, and best practices.
          </p>
        </div>
        ${this._renderCurrentSection()}
      </main>
    `;
  }

  _renderCurrentSection() {
    // This would be replaced with actual documentation content
    return html`
      <div class="section">
        <h2 class="section-title">Components</h2>
        <div class="component-grid">
          ${this._getFilteredComponents().map(
            (component) => html`
              <div class="component-card">
                <h3 class="component-name">${component.name}</h3>
                <p class="component-description">${component.description}</p>
                <div class="component-tags">
                  ${component.tags.map(
                    (tag) => html`<span class="tag">${tag}</span>`
                  )}
                </div>
              </div>
            `
          )}
        </div>
      </div>
    `;
  }

  _renderMobileNav() {
    return html`
      <button
        class="mobile-nav-toggle"
        @click=${() => (this._isMobileNavOpen = !this._isMobileNavOpen)}
      >
        ${this._isMobileNavOpen ? "Close" : "Menu"}
      </button>
    `;
  }

  _handleSearch(e) {
    this._searchQuery = e.target.value.toLowerCase();
  }

  _filterBySearch(item) {
    if (!this._searchQuery) return true;
    return (
      item.title.toLowerCase().includes(this._searchQuery) ||
      item.id.toLowerCase().includes(this._searchQuery)
    );
  }

  _setCurrentSection(id) {
    this._currentSection = id;
    this._isMobileNavOpen = false;
    this.requestUpdate();
  }

  _getFilteredComponents() {
    const components = [
      {
        name: "Memory Monitor",
        description: "Monitor and track memory usage and leaks in real-time.",
        tags: ["Performance", "Monitoring", "Core"],
      },
      {
        name: "Performance Dashboard",
        description: "Visualize and analyze application performance metrics.",
        tags: ["Performance", "Analytics", "Dashboard"],
      },
      {
        name: "Accessibility Dashboard",
        description: "Monitor and improve application accessibility.",
        tags: ["Accessibility", "Compliance", "Dashboard"],
      },
    ];

    if (!this._searchQuery) return components;

    return components.filter(
      (component) =>
        component.name.toLowerCase().includes(this._searchQuery) ||
        component.description.toLowerCase().includes(this._searchQuery) ||
        component.tags.some((tag) =>
          tag.toLowerCase().includes(this._searchQuery)
        )
    );
  }
}

customElements.define("documentation-page", DocumentationPage);
