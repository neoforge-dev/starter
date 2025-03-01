import {  html, css  } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";
import {
  BaseComponent,
  defineComponent,
} from "../components/base-component.js";
import { baseStyles } from "../styles/base.js";

/**
 * @element search-page
 * @description Search page component with results and filters
 */
@defineComponent("search-page")
export class SearchPage extends BaseComponent {
  static properties = {
    query: { type: String },
    results: { type: Array },
    filters: { type: Object },
    loading: { type: Boolean },
    selectedFilters: { type: Object, state: true },
  };

  static styles = [
    baseStyles,
    css`
      :host {
        display: block;
        padding: var(--spacing-lg);
      }

      .search-container {
        max-width: var(--content-width);
        margin: 0 auto;
      }

      .search-header {
        margin-bottom: var(--spacing-xl);
      }

      h1 {
        font-size: var(--font-size-xxl);
        margin-bottom: var(--spacing-md);
      }

      .search-box {
        display: flex;
        gap: var(--spacing-sm);
      }

      input {
        flex: 1;
      }

      .search-results {
        display: grid;
        gap: var(--spacing-lg);
      }

      .result-item {
        padding: var(--spacing-lg);
        border-radius: var(--border-radius);
        box-shadow: var(--shadow-sm);
      }

      .result-title {
        font-size: var(--font-size-lg);
        margin-bottom: var(--spacing-sm);
      }

      .result-excerpt {
        color: var(--color-text-secondary);
        margin-bottom: var(--spacing-sm);
      }

      .result-meta {
        font-size: var(--font-size-sm);
        color: var(--color-text-tertiary);
      }

      .search-filters {
        margin-bottom: var(--spacing-lg);
        display: flex;
        gap: var(--spacing-md);
      }

      .filter-group {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-sm);
      }

      .filter-label {
        font-weight: bold;
      }

      .filter-options {
        display: flex;
        gap: var(--spacing-sm);
      }

      .filter-option {
        padding: var(--spacing-xs) var(--spacing-sm);
        border-radius: var(--border-radius-sm);
        background: var(--color-surface-variant);
        cursor: pointer;
      }

      .filter-option.selected {
        background: var(--color-primary);
        color: var(--color-on-primary);
      }
    `,
  ];

  constructor() {
    super();
    this.query = "";
    this.results = [];
    this.filters = {
      types: [],
      categories: [],
      tags: [],
    };
    this.loading = false;
    this.selectedFilters = {
      types: new Set(),
      categories: new Set(),
      tags: new Set(),
    };
  }

  async connectedCallback() {
    super.connectedCallback();
    await this._initializeFilters();
  }

  async _initializeFilters() {
    try {
      this.filters = await window.search.getFilters();
    } catch (error) {
      console.error("Failed to load filters:", error);
    }
  }

  render() {
    return html`
      <div class="search-container">
        <div class="search-header">
          <h1>Search</h1>
          <div class="search-box">
            <input
              type="search"
              placeholder="Search..."
              .value=${this.query}
              @input=${this._handleInput}
            />
            <button @click=${this._handleSearch}>Search</button>
          </div>
        </div>

        <div class="search-filters">
          <div class="filter-group">
            <div class="filter-label">Type</div>
            <div class="filter-options">
              ${this.filters.types.map(
                (type) => html`
                  <div
                    class="filter-option ${this._isSelected("types", type)
                      ? "selected"
                      : ""}"
                    @click=${() => this._toggleFilter("types", type)}
                  >
                    ${type}
                  </div>
                `
              )}
            </div>
          </div>

          <div class="filter-group">
            <div class="filter-label">Category</div>
            <div class="filter-options">
              ${this.filters.categories.map(
                (category) => html`
                  <div
                    class="filter-option ${this._isSelected(
                      "categories",
                      category
                    )
                      ? "selected"
                      : ""}"
                    @click=${() => this._toggleFilter("categories", category)}
                  >
                    ${category}
                  </div>
                `
              )}
            </div>
          </div>

          <div class="filter-group">
            <div class="filter-label">Tags</div>
            <div class="filter-options">
              ${this.filters.tags.map(
                (tag) => html`
                  <div
                    class="filter-option ${this._isSelected("tags", tag)
                      ? "selected"
                      : ""}"
                    @click=${() => this._toggleFilter("tags", tag)}
                  >
                    ${tag}
                  </div>
                `
              )}
            </div>
          </div>
        </div>

        <div class="search-results">
          ${this.loading
            ? html`<div class="loading">Loading...</div>`
            : this.results.map(
                (result) => html`
                  <div class="result-item">
                    <div class="result-title">
                      <a href=${result.url}>${result.title}</a>
                    </div>
                    <div class="result-excerpt">${result.excerpt}</div>
                    <div class="result-meta">
                      ${result.type} • ${result.category}
                      ${result.tags
                        ? html`• Tags: ${result.tags.join(", ")}`
                        : ""}
                    </div>
                  </div>
                `
              )}
        </div>
      </div>
    `;
  }

  _handleInput(e) {
    this.query = e.target.value;
    this.dispatchEvent(
      new CustomEvent("search-input", {
        detail: { query: this.query },
        bubbles: true,
        composed: true,
      })
    );
  }

  async _handleSearch() {
    this.loading = true;
    try {
      const results = await window.search.search(this.query);
      this.results = results;
    } catch (error) {
      console.error("Search failed:", error);
      this.results = [];
    } finally {
      this.loading = false;
    }
  }

  _isSelected(filterType, value) {
    return this.selectedFilters[filterType].has(value);
  }

  _toggleFilter(filterType, value) {
    const filters = this.selectedFilters[filterType];
    if (filters.has(value)) {
      filters.delete(value);
    } else {
      filters.add(value);
    }
    this.requestUpdate();
    this._handleSearch();
  }
}
