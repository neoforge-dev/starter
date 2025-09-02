import { html, css } from "lit";
import { baseStyles } from "../../styles/base.js";
import { BaseComponent } from "../../base-component.js";
import "../../atoms/input/input.js";
import "../../atoms/select/select.js";
import "../../atoms/button/button.js";

/**
 * FilterBar component for advanced search and filtering
 * @element neo-filter-bar
 *
 * @prop {string} searchValue - Current search query value
 * @prop {string} searchPlaceholder - Placeholder text for search input
 * @prop {Array} filters - Array of filter configurations
 * @prop {Object} activeFilters - Object of currently active filters
 * @prop {boolean} showSearch - Whether to show the search input
 * @prop {boolean} showClearAll - Whether to show clear all button
 * @prop {boolean} collapsible - Whether filters are collapsible on mobile
 * @prop {boolean} collapsed - Whether filters are currently collapsed
 * @prop {string} variant - Visual variant (default, minimal, compact)
 * @prop {string} size - Size variant (sm, md, lg)
 * @prop {number} debounceMs - Debounce time for search input (default: 300ms)
 * @prop {string} noResultsText - Text shown when no results
 * @prop {boolean} loading - Whether filters are in loading state
 * 
 * @event search - Fired when search value changes
 * @event filter-change - Fired when any filter changes
 * @event clear-all - Fired when clear all button is clicked
 * @event filters-toggle - Fired when filters are collapsed/expanded
 */
export class NeoFilterBar extends BaseComponent {
  static get properties() {
    return {
      searchValue: { type: String },
      searchPlaceholder: { type: String },
      filters: { type: Array },
      activeFilters: { type: Object },
      showSearch: { type: Boolean },
      showClearAll: { type: Boolean },
      collapsible: { type: Boolean },
      collapsed: { type: Boolean, reflect: true },
      variant: { type: String, reflect: true },
      size: { type: String, reflect: true },
      debounceMs: { type: Number },
      noResultsText: { type: String },
      loading: { type: Boolean, reflect: true },
    };
  }

  static get styles() {
    return [
      baseStyles,
      css`
        :host {
          display: block;
          width: 100%;
          --filter-bar-gap: var(--spacing-md);
          --filter-bar-padding: var(--spacing-md);
          --filter-bar-border-radius: var(--radius-lg);
        }

        :host([size="sm"]) {
          --filter-bar-gap: var(--spacing-sm);
          --filter-bar-padding: var(--spacing-sm);
          --filter-bar-border-radius: var(--radius-md);
        }

        :host([size="lg"]) {
          --filter-bar-gap: var(--spacing-lg);
          --filter-bar-padding: var(--spacing-lg);
          --filter-bar-border-radius: var(--radius-xl);
        }

        .filter-bar {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--filter-bar-border-radius);
          padding: var(--filter-bar-padding);
        }

        .filter-bar-header {
          display: flex;
          align-items: center;
          gap: var(--filter-bar-gap);
          margin-bottom: var(--filter-bar-gap);
        }

        .search-container {
          flex: 1;
          min-width: 200px;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
        }

        .results-count {
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
          white-space: nowrap;
        }

        .toggle-button {
          display: none;
        }

        .filters-container {
          display: flex;
          flex-wrap: wrap;
          gap: var(--filter-bar-gap);
          align-items: flex-start;
        }

        :host([collapsed]) .filters-container {
          display: none;
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xs);
          min-width: 120px;
        }

        .filter-label {
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-medium);
          color: var(--color-text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .filter-control {
          width: 100%;
        }

        .active-filters {
          display: flex;
          flex-wrap: wrap;
          gap: var(--spacing-xs);
          margin-top: var(--filter-bar-gap);
          padding-top: var(--filter-bar-gap);
          border-top: 1px solid var(--color-border-light);
        }

        .filter-chip {
          display: inline-flex;
          align-items: center;
          gap: var(--spacing-xs);
          padding: var(--spacing-xs) var(--spacing-sm);
          background: var(--color-primary-light);
          color: var(--color-primary-dark);
          border-radius: var(--radius-full);
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-medium);
        }

        .filter-chip-remove {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 16px;
          height: 16px;
          background: var(--color-primary);
          color: white;
          border-radius: 50%;
          cursor: pointer;
          font-size: 12px;
          line-height: 1;
          transition: all var(--transition-fast);
        }

        .filter-chip-remove:hover {
          background: var(--color-primary-dark);
        }

        .clear-all-button {
          margin-left: auto;
        }

        /* Variant styles */
        :host([variant="minimal"]) .filter-bar {
          background: transparent;
          border: none;
          padding: 0;
        }

        :host([variant="minimal"]) .filter-bar-header {
          margin-bottom: var(--spacing-sm);
        }

        :host([variant="minimal"]) .active-filters {
          border-top: none;
          padding-top: 0;
          margin-top: var(--spacing-sm);
        }

        :host([variant="compact"]) .filter-bar {
          padding: var(--spacing-sm);
        }

        :host([variant="compact"]) .filter-bar-header {
          margin-bottom: var(--spacing-sm);
        }

        :host([variant="compact"]) .filter-group {
          min-width: 100px;
        }

        /* Loading state */
        :host([loading]) .filters-container {
          opacity: 0.6;
          pointer-events: none;
        }

        .loading-indicator {
          display: none;
          align-items: center;
          gap: var(--spacing-xs);
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
        }

        :host([loading]) .loading-indicator {
          display: flex;
        }

        .loading-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid var(--color-border);
          border-top: 2px solid var(--color-primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Responsive design */
        @media (max-width: 768px) {
          :host([collapsible]) .toggle-button {
            display: flex;
          }

          :host([collapsible]) .filters-container {
            flex-direction: column;
          }

          .filter-bar-header {
            flex-direction: column;
            align-items: stretch;
            gap: var(--spacing-sm);
          }

          .header-actions {
            justify-content: space-between;
          }

          .search-container {
            min-width: unset;
          }

          .filter-group {
            min-width: unset;
          }
        }

        /* Focus and hover states */
        .filter-control:focus-within {
          outline: 2px solid var(--color-primary-light);
          outline-offset: 2px;
          border-radius: var(--radius-md);
        }

        /* Empty state */
        .empty-state {
          text-align: center;
          padding: var(--spacing-xl);
          color: var(--color-text-secondary);
          font-size: var(--font-size-sm);
        }

        .empty-state-icon {
          font-size: 2rem;
          margin-bottom: var(--spacing-md);
          opacity: 0.5;
        }

        /* Accessibility */
        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }

        /* High contrast mode support */
        @media (prefers-contrast: high) {
          .filter-bar {
            border: 2px solid var(--color-text);
          }

          .filter-chip {
            border: 1px solid var(--color-primary);
          }
        }

        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          .loading-spinner {
            animation: none;
          }

          .filter-chip-remove {
            transition: none;
          }
        }
      `,
    ];
  }

  constructor() {
    super();
    this.searchValue = "";
    this.searchPlaceholder = "Search...";
    this.filters = [];
    this.activeFilters = {};
    this.showSearch = true;
    this.showClearAll = true;
    this.collapsible = true;
    this.collapsed = false;
    this.variant = "default";
    this.size = "md";
    this.debounceMs = 300;
    this.noResultsText = "No results found";
    this.loading = false;
    
    this._searchDebounceTimer = null;
    this._lastSearchValue = "";
  }

  /**
   * Get the count of active filters
   */
  get activeFilterCount() {
    return Object.keys(this.activeFilters).filter(key => {
      const value = this.activeFilters[key];
      return value !== null && value !== undefined && value !== "" && 
             (Array.isArray(value) ? value.length > 0 : true);
    }).length;
  }

  /**
   * Get formatted active filters for display
   */
  get formattedActiveFilters() {
    const formatted = [];
    
    Object.entries(this.activeFilters).forEach(([key, value]) => {
      if (value === null || value === undefined || value === "" || 
          (Array.isArray(value) && value.length === 0)) {
        return;
      }

      const filter = this.filters.find(f => f.key === key);
      const label = filter?.label || key;
      
      if (Array.isArray(value)) {
        value.forEach(val => {
          formatted.push({
            key,
            label,
            value: val,
            displayValue: this._getDisplayValue(filter, val)
          });
        });
      } else {
        formatted.push({
          key,
          label,
          value,
          displayValue: this._getDisplayValue(filter, value)
        });
      }
    });

    return formatted;
  }

  /**
   * Get display value for a filter option
   */
  _getDisplayValue(filter, value) {
    if (!filter || !filter.options) return value;
    
    const option = filter.options.find(opt => 
      typeof opt === 'object' ? opt.value === value : opt === value
    );
    
    return option ? (typeof option === 'object' ? option.label : option) : value;
  }

  /**
   * Handle search input changes with debouncing
   */
  _handleSearchInput(e) {
    const value = e.target.value;
    this.searchValue = value;

    // Clear existing timer
    if (this._searchDebounceTimer) {
      clearTimeout(this._searchDebounceTimer);
    }

    // Set new timer
    this._searchDebounceTimer = setTimeout(() => {
      if (this.searchValue !== this._lastSearchValue) {
        this._lastSearchValue = this.searchValue;
        this._dispatchSearchEvent();
      }
    }, this.debounceMs);
  }

  /**
   * Dispatch search event
   */
  _dispatchSearchEvent() {
    this.dispatchEvent(
      new CustomEvent("search", {
        bubbles: true,
        composed: true,
        detail: { 
          value: this.searchValue,
          filters: { ...this.activeFilters }
        },
      })
    );
  }

  /**
   * Handle filter changes
   */
  _handleFilterChange(filterKey, value) {
    const newFilters = { ...this.activeFilters };
    
    if (value === null || value === undefined || value === "" || 
        (Array.isArray(value) && value.length === 0)) {
      delete newFilters[filterKey];
    } else {
      newFilters[filterKey] = value;
    }

    this.activeFilters = newFilters;

    this.dispatchEvent(
      new CustomEvent("filter-change", {
        bubbles: true,
        composed: true,
        detail: {
          key: filterKey,
          value,
          allFilters: { ...newFilters },
          searchValue: this.searchValue
        },
      })
    );
  }

  /**
   * Remove a specific active filter
   */
  _removeFilter(filterKey, filterValue = null) {
    const newFilters = { ...this.activeFilters };
    
    if (filterValue !== null && Array.isArray(newFilters[filterKey])) {
      // Remove specific value from array
      newFilters[filterKey] = newFilters[filterKey].filter(val => val !== filterValue);
      if (newFilters[filterKey].length === 0) {
        delete newFilters[filterKey];
      }
    } else {
      // Remove entire filter
      delete newFilters[filterKey];
    }

    this.activeFilters = newFilters;

    this.dispatchEvent(
      new CustomEvent("filter-change", {
        bubbles: true,
        composed: true,
        detail: {
          key: filterKey,
          value: newFilters[filterKey] || null,
          allFilters: { ...newFilters },
          searchValue: this.searchValue,
          action: 'remove'
        },
      })
    );
  }

  /**
   * Clear all filters
   */
  _clearAllFilters() {
    this.activeFilters = {};
    this.searchValue = "";

    this.dispatchEvent(
      new CustomEvent("clear-all", {
        bubbles: true,
        composed: true,
        detail: {
          previousFilters: this.activeFilters,
          previousSearch: this.searchValue
        },
      })
    );

    this._dispatchSearchEvent();
  }

  /**
   * Toggle collapsed state
   */
  _toggleCollapsed() {
    this.collapsed = !this.collapsed;

    this.dispatchEvent(
      new CustomEvent("filters-toggle", {
        bubbles: true,
        composed: true,
        detail: { collapsed: this.collapsed },
      })
    );
  }

  /**
   * Render a single filter control
   */
  _renderFilter(filter) {
    const currentValue = this.activeFilters[filter.key] || "";

    switch (filter.type) {
      case 'select':
        return html`
          <div class="filter-group">
            ${filter.label ? html`<label class="filter-label">${filter.label}</label>` : ''}
            <neo-select
              class="filter-control"
              .value="${currentValue}"
              placeholder="${filter.placeholder || 'Select...'}"
              .options="${filter.options || []}"
              @change="${(e) => this._handleFilterChange(filter.key, e.target.value)}"
            ></neo-select>
          </div>
        `;

      case 'text':
        return html`
          <div class="filter-group">
            ${filter.label ? html`<label class="filter-label">${filter.label}</label>` : ''}
            <neo-input
              class="filter-control"
              .value="${currentValue}"
              placeholder="${filter.placeholder || 'Enter text...'}"
              @input="${(e) => this._handleFilterChange(filter.key, e.target.value)}"
            ></neo-input>
          </div>
        `;

      case 'multiselect':
        return html`
          <div class="filter-group">
            ${filter.label ? html`<label class="filter-label">${filter.label}</label>` : ''}
            <neo-select
              class="filter-control"
              .value="${Array.isArray(currentValue) ? currentValue : []}"
              placeholder="${filter.placeholder || 'Select multiple...'}"
              .options="${filter.options || []}"
              multiple
              @change="${(e) => this._handleFilterChange(filter.key, e.target.value)}"
            ></neo-select>
          </div>
        `;

      default:
        return html``;
    }
  }

  /**
   * Render active filter chips
   */
  _renderActiveFilters() {
    const activeFilters = this.formattedActiveFilters;
    
    if (activeFilters.length === 0) return html``;

    return html`
      <div class="active-filters">
        ${activeFilters.map(filter => html`
          <div class="filter-chip">
            <span>${filter.label}: ${filter.displayValue}</span>
            <button
              class="filter-chip-remove"
              type="button"
              aria-label="Remove ${filter.label} filter"
              @click="${() => this._removeFilter(filter.key, filter.value)}"
            >
              ×
            </button>
          </div>
        `)}
        
        ${this.showClearAll && activeFilters.length > 1 ? html`
          <neo-button
            class="clear-all-button"
            variant="ghost"
            size="sm"
            @click="${this._clearAllFilters}"
          >
            Clear All
          </neo-button>
        ` : ''}
      </div>
    `;
  }

  render() {
    const hasActiveFilters = this.activeFilterCount > 0;
    const hasFilters = this.filters && this.filters.length > 0;

    return html`
      <div class="filter-bar" role="search" aria-label="Filter and search">
        <div class="filter-bar-header">
          ${this.showSearch ? html`
            <div class="search-container">
              <neo-input
                .value="${this.searchValue}"
                placeholder="${this.searchPlaceholder}"
                type="search"
                @input="${this._handleSearchInput}"
                aria-label="Search"
              ></neo-input>
            </div>
          ` : ''}

          <div class="header-actions">
            <div class="loading-indicator">
              <div class="loading-spinner"></div>
              <span>Loading...</span>
            </div>

            ${hasActiveFilters ? html`
              <div class="results-count">
                ${this.activeFilterCount} filter${this.activeFilterCount === 1 ? '' : 's'} active
              </div>
            ` : ''}

            ${this.collapsible && hasFilters ? html`
              <neo-button
                class="toggle-button"
                variant="ghost"
                size="sm"
                @click="${this._toggleCollapsed}"
                aria-expanded="${!this.collapsed}"
                aria-controls="filters-container"
              >
                ${this.collapsed ? 'Show Filters' : 'Hide Filters'}
              </neo-button>
            ` : ''}
          </div>
        </div>

        ${hasFilters ? html`
          <div 
            id="filters-container"
            class="filters-container"
            role="group"
            aria-label="Filter options"
          >
            ${this.filters.map(filter => this._renderFilter(filter))}
          </div>
        ` : ''}

        ${this._renderActiveFilters()}

        <span class="sr-only" aria-live="polite" aria-atomic="true">
          ${hasActiveFilters ? `${this.activeFilterCount} filters active` : 'No filters active'}
        </span>
      </div>
    `;
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._searchDebounceTimer) {
      clearTimeout(this._searchDebounceTimer);
    }
  }
}

// Register the component
if (!customElements.get("neo-filter-bar")) {
  customElements.define("neo-filter-bar", NeoFilterBar);
}