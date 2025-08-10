import { LitElement, html, css } from '/vendor/lit-core.min.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { baseStyles } from '../../styles/base.js';
import { docsService } from '../../services/docs.js';

export class DocSearch extends LitElement {
  static properties = {
    results: { type: Array },
    isSearching: { type: Boolean },
    query: { type: String }
  };

  static styles = [
    baseStyles,
    css`
      :host {
        display: block;
      }

      .search-container {
        position: relative;
      }

      .search-input {
        width: 100%;
        padding: var(--spacing-sm) var(--spacing-md);
        padding-left: var(--spacing-xl);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        background: var(--background-color);
        color: var(--text-color);
        font-size: var(--text-sm);
        transition: all var(--transition-normal);
      }

      .search-input:focus {
        outline: none;
        border-color: var(--primary-color);
        box-shadow: 0 0 0 2px rgba(var(--primary-color), 0.1);
      }

      .search-icon {
        position: absolute;
        left: var(--spacing-sm);
        top: 50%;
        transform: translateY(-50%);
        color: var(--text-tertiary);
        pointer-events: none;
      }

      .results-container {
        position: absolute;
        top: calc(100% + var(--spacing-xs));
        left: 0;
        right: 0;
        background: var(--surface-color);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        box-shadow: var(--shadow-lg);
        max-height: 400px;
        overflow-y: auto;
        z-index: var(--z-dropdown);
      }

      .result-item {
        padding: var(--spacing-sm) var(--spacing-md);
        border-bottom: 1px solid var(--border-color);
        cursor: pointer;
        transition: all var(--transition-normal);
      }

      .result-item:last-child {
        border-bottom: none;
      }

      .result-item:hover {
        background: var(--background-color);
      }

      .result-title {
        color: var(--text-color);
        font-weight: var(--font-medium);
        margin-bottom: var(--spacing-xs);
      }

      .result-path {
        color: var(--text-tertiary);
        font-size: var(--text-xs);
      }

      .result-highlight {
        color: var(--primary-color);
        font-weight: var(--font-semibold);
      }

      .no-results {
        padding: var(--spacing-md);
        text-align: center;
        color: var(--text-secondary);
      }

      .loading {
        padding: var(--spacing-md);
        text-align: center;
        color: var(--text-secondary);
      }

      @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.5; }
        100% { opacity: 1; }
      }

      .loading {
        animation: pulse 1.5s ease-in-out infinite;
      }
    `
  ];

  constructor() {
    super();
    this.results = [];
    this.isSearching = false;
    this.query = '';
    this._searchTimeout = null;
  }

  async _handleSearch(e) {
    this.query = e.target.value;

    // Clear previous timeout
    if (this._searchTimeout) {
      clearTimeout(this._searchTimeout);
    }

    // Don't search for empty query
    if (!this.query.trim()) {
      this.results = [];
      return;
    }

    // Debounce search
    this._searchTimeout = setTimeout(async () => {
      this.isSearching = true;
      try {
        this.results = await docsService.search(this.query);
      } catch (error) {
        console.error('Search failed:', error);
        this.results = [];
      } finally {
        this.isSearching = false;
      }
    }, 300);
  }

  _handleResultClick(result) {
    this.dispatchEvent(new CustomEvent('result-selected', {
      detail: { result },
      bubbles: true,
      composed: true
    }));
    this.query = '';
    this.results = [];
  }

  _highlightMatch(text, query) {
    if (!query) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<span class="result-highlight">$1</span>');
  }

  render() {
    return html`
      <div class="search-container">
        <span class="search-icon material-icons">search</span>
        <input
          type="text"
          class="search-input"
          placeholder="Search documentation..."
          .value=${this.query}
          @input=${this._handleSearch}
        />

        ${(this.results.length > 0 || this.isSearching) ? html`
          <div class="results-container">
            ${this.isSearching ? html`
              <div class="loading">
                Searching...
              </div>
            ` : this.results.length > 0 ? html`
              ${this.results.map(result => html`
                <div class="result-item" @click=${() => this._handleResultClick(result)}>
                  <div class="result-title">
                    ${unsafeHTML(this._highlightMatch(result.title, this.query))}
                  </div>
                  <div class="result-path">${result.path}</div>
                </div>
              `)}
            ` : html`
              <div class="no-results">
                No results found for "${this.query}"
              </div>
            `}
          </div>
        ` : ''}
      </div>
    `;
  }
}

customElements.define('doc-search', DocSearch); 