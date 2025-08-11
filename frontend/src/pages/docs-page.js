import {   html, css   } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";
import {
  BaseComponent,
} from "../components/base-component.js";
import { baseStyles } from "../styles/base.js";

export class DocsPage extends BaseComponent {
  static properties = {
    currentSection: { type: String, state: true },
    currentSubsection: { type: String, state: true },
    currentVersion: { type: String, state: true },
    sections: { type: Array, state: true },
    loading: { type: Boolean, state: true },
    error: { type: String, state: true },
    searchResults: { type: Array, state: true },
    metadata: { type: Object, state: true },
    darkMode: { type: Boolean, state: true },
  };

  static styles = [
    baseStyles,
    css`
      :host {
        display: block;
        padding: var(--spacing-xl);
      }

      .docs-container {
        display: grid;
        grid-template-columns: 250px 1fr 200px;
        gap: var(--spacing-lg);
        max-width: var(--content-width);
        margin: 0 auto;
      }

      .docs-sidebar {
        border-right: 1px solid var(--border-color);
        padding-right: var(--spacing-md);
      }

      .docs-content {
        min-height: 500px;
      }

      .table-of-contents {
        position: sticky;
        top: var(--spacing-xl);
        padding-left: var(--spacing-md);
        border-left: 1px solid var(--border-color);
      }

      .docs-menu {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-sm);
      }

      .section-item {
        padding: var(--spacing-sm);
        cursor: pointer;
        border-radius: var(--border-radius);
        transition: background-color 0.2s;
      }

      .section-item:hover {
        background-color: var(--surface-color-hover);
      }

      .section-item.active {
        background-color: var(--primary-color);
        color: white;
      }

      .subsection-item {
        padding: var(--spacing-sm) var(--spacing-md);
        cursor: pointer;
        border-radius: var(--border-radius);
        transition: background-color 0.2s;
      }

      .subsection-item:hover {
        background-color: var(--surface-color-hover);
      }

      .subsection-item.active {
        color: var(--primary-color);
        font-weight: bold;
      }

      .search-box {
        margin-bottom: var(--spacing-lg);
      }

      .search-input {
        width: 100%;
        padding: var(--spacing-sm);
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius);
      }

      .search-results {
        margin-top: var(--spacing-md);
      }

      .version-select {
        margin-bottom: var(--spacing-lg);
        width: 100%;
        padding: var(--spacing-sm);
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius);
      }

      .contributors-list {
        margin-top: var(--spacing-xl);
        padding-top: var(--spacing-lg);
        border-top: 1px solid var(--border-color);
      }

      .contributor-item {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
        padding: var(--spacing-sm) 0;
      }

      .loading-indicator {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 200px;
      }

      .content-skeleton {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-md);
      }

      .error-message {
        color: var(--error-color);
        text-align: center;
        padding: var(--spacing-lg);
      }

      code-block {
        position: relative;
      }

      .copy-button {
        position: absolute;
        top: var(--spacing-sm);
        right: var(--spacing-sm);
        padding: var(--spacing-xs) var(--spacing-sm);
        border-radius: var(--border-radius-sm);
        background: var(--surface-color);
        cursor: pointer;
      }

      @media (max-width: 768px) {
        .docs-container {
          grid-template-columns: 1fr;
        }

        .docs-sidebar {
          border-right: none;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: var(--spacing-md);
          margin-bottom: var(--spacing-md);
        }

        .table-of-contents {
          display: none;
        }
      }

      :host([dark]) {
        color-scheme: dark;
      }
    `,
  ];

  constructor() {
    super();
    this.currentSection = "";
    this.currentSubsection = "";
    this.currentVersion = "latest";
    this.sections = [];
    this.loading = true;
    this.error = "";
    this.searchResults = [];
    this.metadata = {};
    this.darkMode = false;
  }

  async connectedCallback() {
    super.connectedCallback();
    await this.loadContent();
    this._setupKeyboardNavigation();
  }

  async loadContent() {
    try {
      this.loading = true;
      this.error = "";
      const docs = await window.docs.getDocs();
      this.sections = docs.sections;
      this.metadata = docs.metadata;
      if (!this.currentSection && this.sections.length > 0) {
        this.currentSection = this.sections[0].id;
      }
      this.loading = false;
    } catch (error) {
      this.error = error.message || "Failed to load documentation";
      this.loading = false;
    }
  }

  handleSectionClick(sectionId) {
    this.currentSection = sectionId;
    this.currentSubsection = "";
  }

  handleSubsectionClick(sectionId, subsectionId) {
    this.currentSection = sectionId;
    this.currentSubsection = subsectionId;
  }

  handleVersionChange(e) {
    this.currentVersion = e.target.value;
    this.loadContent();
  }

  async handleSearch(e) {
    const query = e.target.value;
    if (!query) {
      this.searchResults = [];
      return;
    }

    try {
      this.searchResults = await window.docs.searchDocs(query);
    } catch (error) {
      console.error("Search failed:", error);
      this.searchResults = [];
    }
  }

  _setupKeyboardNavigation() {
    this.addEventListener("keydown", (e) => {
      if (e.target.classList.contains("section-item")) {
        const items = Array.from(
          this.shadowRoot.querySelectorAll(".section-item")
        );
        const currentIndex = items.indexOf(e.target);

        switch (e.key) {
          case "ArrowDown":
            if (currentIndex < items.length - 1) {
              items[currentIndex + 1].focus();
            }
            break;
          case "ArrowUp":
            if (currentIndex > 0) {
              items[currentIndex - 1].focus();
            }
            break;
        }
      }
    });
  }

  async handleCopyCode(code) {
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

  _getCurrentContent() {
    if (this.currentSubsection) {
      const section = this.sections.find((s) => s.id === this.currentSection);
      const subsection = section?.subsections.find(
        (ss) => ss.id === this.currentSubsection
      );
      return subsection?.content;
    }
    return this.sections.find((s) => s.id === this.currentSection)?.content;
  }

  render() {
    if (this.loading) {
      return html`
        <div class="loading-indicator">
          Loading documentation...
          <div class="content-skeleton">
            <div class="skeleton-line"></div>
            <div class="skeleton-line"></div>
            <div class="skeleton-line"></div>
          </div>
        </div>
      `;
    }

    if (this.error) {
      return html`<div class="error-message">${this.error}</div>`;
    }

    return html`
      <div class="docs-container ${this.darkMode ? "dark" : ""}">
        <nav class="docs-sidebar" role="navigation">
          <div class="search-box">
            <input
              type="search"
              class="search-input"
              placeholder="Search docs..."
              @input=${this.handleSearch}
              aria-label="Search documentation"
            />
            ${this.searchResults.length > 0
              ? html`
                  <div class="search-results">
                    ${this.searchResults.map(
                      (result) => html`
                        <div
                          class="search-result"
                          @click=${() =>
                            this.handleSubsectionClick(
                              result.sectionId,
                              result.id
                            )}
                        >
                          ${result.title}
                        </div>
                      `
                    )}
                  </div>
                `
              : ""}
          </div>

          <select
            class="version-select"
            .value=${this.currentVersion}
            @change=${this.handleVersionChange}
            aria-label="Select documentation version"
          >
            <option value="latest">Latest</option>
            <option value="1.0.0">1.0.0</option>
            <option value="0.9.0">0.9.0</option>
          </select>

          <div class="docs-menu">
            ${this.sections.map(
              (section) => html`
                <div
                  class="section-item ${this.currentSection === section.id
                    ? "active"
                    : ""}"
                  @click=${() => this.handleSectionClick(section.id)}
                  role="menuitem"
                  tabindex="0"
                  data-id=${section.id}
                >
                  ${section.title}
                </div>
                ${section.subsections?.map(
                  (subsection) => html`
                    <div
                      class="subsection-item ${this.currentSubsection ===
                      subsection.id
                        ? "active"
                        : ""}"
                      @click=${() =>
                        this.handleSubsectionClick(section.id, subsection.id)}
                      role="menuitem"
                      tabindex="0"
                      data-id=${subsection.id}
                    >
                      ${subsection.title}
                    </div>
                  `
                )}
              `
            )}
          </div>
        </nav>

        <main class="docs-content">
          <marked-element>
            <div slot="markdown-html"></div>
            <script type="text/markdown">
              ${this._getCurrentContent() || "Select a section"}
            </script>
          </marked-element>

          <div class="contributors-list">
            <h3>Contributors</h3>
            ${this.metadata?.contributors?.map(
              (contributor) => html`
                <div class="contributor-item">
                  <span class="contributor-name">${contributor.name}</span>
                  <span class="contributor-commits"
                    >(${contributor.commits} commits)</span
                  >
                </div>
              `
            )}
          </div>
        </main>

        <aside class="table-of-contents">
          <h3>On this page</h3>
          <!-- Table of contents will be dynamically generated -->
        </aside>
      </div>
    `;
  }
}

// Register the component
customElements.define("docs-page", DocsPage);
