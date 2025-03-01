import {  html, css  } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";
import {
  BaseComponent,
  defineComponent,
} from "../components/base-component.js";
import { baseStyles } from "../styles/base.js";

/**
 * @element documentation-page
 * @description Documentation page component with navigation, search, and content display
 */
@defineComponent("documentation-page")
export class DocumentationPage extends BaseComponent {
  static properties = {
    sections: { type: Array },
    activeSection: { type: String },
    activeSubsection: { type: String },
    loading: { type: Boolean },
    error: { type: String },
    searchQuery: { type: String },
    searchResults: { type: Array },
    metadata: { type: Object },
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
        gap: var(--spacing-lg);
        max-width: var(--content-width);
        margin: 0 auto;
        padding: var(--spacing-lg);
      }

      .docs-sidebar {
        border-right: 1px solid var(--border-color);
        padding-right: var(--spacing-lg);
        height: 100vh;
        position: sticky;
        top: 0;
        overflow-y: auto;
      }

      .docs-content {
        min-height: 500px;
        padding: var(--spacing-lg);
      }

      .docs-search {
        margin-bottom: var(--spacing-lg);
      }

      .search-input {
        width: 100%;
        padding: var(--spacing-sm);
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius);
      }

      .menu-item {
        padding: var(--spacing-sm);
        cursor: pointer;
        border-radius: var(--border-radius);
      }

      .menu-item.active {
        background: var(--color-primary);
        color: white;
      }

      .subsection-link {
        display: block;
        padding: var(--spacing-xs) var(--spacing-sm);
        margin-left: var(--spacing-md);
        color: var(--text-color);
        text-decoration: none;
      }

      .subsection-link:hover {
        color: var(--color-primary);
      }

      .docs-version {
        margin-top: var(--spacing-lg);
        padding: var(--spacing-sm);
        border-top: 1px solid var(--border-color);
        font-size: var(--font-size-sm);
        color: var(--text-color-light);
      }

      .loading-indicator,
      .error-message {
        padding: var(--spacing-lg);
        text-align: center;
      }

      .content-skeleton {
        display: grid;
        gap: var(--spacing-md);
      }

      .mobile-menu-toggle {
        display: none;
      }

      .table-of-contents {
        margin: var(--spacing-lg) 0;
        padding: var(--spacing-md);
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius);
      }

      code-block {
        position: relative;
        display: block;
        margin: var(--spacing-md) 0;
      }

      .copy-button {
        position: absolute;
        top: var(--spacing-sm);
        right: var(--spacing-sm);
        padding: var(--spacing-xs) var(--spacing-sm);
        background: var(--surface-color);
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius);
        cursor: pointer;
      }

      @media (max-width: 768px) {
        .docs-container {
          grid-template-columns: 1fr;
        }

        .docs-sidebar {
          position: fixed;
          left: -100%;
          width: 250px;
          background: var(--surface-color);
          transition: left 0.3s ease;
          z-index: 100;
        }

        .docs-sidebar.visible {
          left: 0;
        }

        .mobile-menu-toggle {
          display: block;
          position: fixed;
          bottom: var(--spacing-lg);
          right: var(--spacing-lg);
          padding: var(--spacing-sm);
          background: var(--color-primary);
          color: white;
          border: none;
          border-radius: 50%;
          cursor: pointer;
          z-index: 101;
        }
      }

      @media print {
        .docs-container {
          display: block;
        }

        .docs-sidebar,
        .docs-search,
        .mobile-menu-toggle {
          display: none;
        }
      }
    `,
  ];

  constructor() {
    super();
    this.sections = [];
    this.activeSection = null;
    this.activeSubsection = null;
    this.loading = true;
    this.error = null;
    this.searchQuery = "";
    this.searchResults = [];
    this.metadata = {};
  }

  async connectedCallback() {
    super.connectedCallback();
    await this._loadDocs();
  }

  async _loadDocs() {
    try {
      this.loading = true;
      const docs = await window.api.getDocs();
      this.sections = docs.sections;
      this.metadata = docs.metadata;
      if (this.sections.length > 0) {
        this.activeSection = this.sections[0].id;
        if (this.sections[0].subsections.length > 0) {
          this.activeSubsection = this.sections[0].subsections[0].id;
        }
      }
    } catch (error) {
      this.error = "Failed to load documentation";
      console.error("Error loading docs:", error);
    } finally {
      this.loading = false;
    }
  }

  async _handleSearch(e) {
    const query = e.target.value;
    this.searchQuery = query;

    if (!query) {
      this.searchResults = [];
      return;
    }

    try {
      const results = await window.api.searchDocs(query);
      this.searchResults = results;
      this.dispatchEvent(
        new CustomEvent("search-results", {
          detail: { results },
          bubbles: true,
          composed: true,
        })
      );
    } catch (error) {
      console.error("Search error:", error);
    }
  }

  _handleSectionClick(sectionId) {
    this.activeSection = sectionId;
    const section = this.sections.find((s) => s.id === sectionId);
    if (section && section.subsections.length > 0) {
      this.activeSubsection = section.subsections[0].id;
    }
  }

  _handleSubsectionClick(subsectionId) {
    this.activeSubsection = subsectionId;
    const content = this.shadowRoot.querySelector(".docs-content");
    if (content) {
      content.scrollTop = 0;
    }
  }

  _handleKeyboardNavigation(e, items, currentIndex) {
    const keys = {
      ArrowDown: 1,
      ArrowUp: -1,
    };
    const delta = keys[e.key];
    if (delta) {
      e.preventDefault();
      const nextIndex = (currentIndex + delta + items.length) % items.length;
      items[nextIndex].focus();
    }
  }

  async _handleCodeCopy(code) {
    try {
      await navigator.clipboard.writeText(code);
      this.dispatchEvent(
        new CustomEvent("code-copied", {
          detail: { code },
          bubbles: true,
          composed: true,
        })
      );
    } catch (error) {
      console.error("Failed to copy code:", error);
    }
  }

  _toggleMobileMenu() {
    const sidebar = this.shadowRoot.querySelector(".docs-sidebar");
    sidebar.classList.toggle("visible");
  }

  _getActiveContent() {
    const section = this.sections.find((s) => s.id === this.activeSection);
    if (section) {
      const subsection = section.subsections.find(
        (s) => s.id === this.activeSubsection
      );
      return subsection ? subsection.content : "";
    }
    return "";
  }

  _slugify(text) {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  render() {
    if (this.loading) {
      return html`
        <div class="loading-indicator">
          <neo-spinner></neo-spinner>
          <div class="content-skeleton">
            <div class="skeleton-line"></div>
            <div class="skeleton-line"></div>
            <div class="skeleton-line"></div>
          </div>
        </div>
      `;
    }

    if (this.error) {
      return html`
        <div class="error-message">
          <neo-icon icon="error"></neo-icon>
          <p>${this.error}</p>
        </div>
      `;
    }

    return html`
      <div class="docs-container ${this.isPrintLayout ? "print-layout" : ""}">
        <nav class="docs-sidebar" role="navigation">
          <div class="docs-search">
            <input
              type="search"
              class="search-input"
              placeholder="Search documentation..."
              .value="${this.searchQuery}"
              @input="${this._handleSearch}"
            />
          </div>

          ${this.searchResults.length > 0
            ? html`
                <div class="search-results">
                  ${this.searchResults.map(
                    (result) => html`
                      <a
                        href="#${this._slugify(result.title)}"
                        class="search-result"
                        @click="${() => this._handleSubsectionClick(result.id)}"
                      >
                        ${result.title}
                      </a>
                    `
                  )}
                </div>
              `
            : html`
                <div class="menu">
                  ${this.sections.map(
                    (section, index) => html`
                      <div
                        class="menu-item ${this.activeSection === section.id
                          ? "active"
                          : ""}"
                        role="menuitem"
                        tabindex="0"
                        @click="${() => this._handleSectionClick(section.id)}"
                        @keydown="${(e) =>
                          this._handleKeyboardNavigation(
                            e,
                            this.shadowRoot.querySelectorAll(".menu-item"),
                            index
                          )}"
                      >
                        ${section.title}
                      </div>
                      ${section.subsections.map(
                        (subsection) => html`
                          <a
                            href="#${this._slugify(subsection.title)}"
                            class="subsection-link"
                            @click="${() =>
                              this._handleSubsectionClick(subsection.id)}"
                          >
                            ${subsection.title}
                          </a>
                        `
                      )}
                    `
                  )}
                </div>
              `}

          <div class="docs-version">
            Version ${this.metadata.version} | Last updated:
            ${this.metadata.lastUpdated}
          </div>
        </nav>

        <main class="docs-content">
          <marked-element .markdown="${this._getActiveContent()}">
            <div slot="markdown-html"></div>
          </marked-element>

          <div class="table-of-contents">
            <h3>Table of Contents</h3>
            ${this.sections
              .find((s) => s.id === this.activeSection)
              ?.subsections.map(
                (subsection) => html`
                  <a href="#${this._slugify(subsection.title)}">
                    ${subsection.title}
                  </a>
                `
              )}
          </div>
        </main>

        <button
          class="mobile-menu-toggle"
          @click="${this._toggleMobileMenu}"
          aria-label="Toggle mobile menu"
        >
          <neo-icon icon="menu"></neo-icon>
        </button>
      </div>
    `;
  }
}
