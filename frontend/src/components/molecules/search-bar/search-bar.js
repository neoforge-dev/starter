import { html, css } from "lit";
import { BaseComponent } from "../../base-component.js";
import { baseStyles } from "../../styles/base.js";
import "../../atoms/input/input.js";
import "../../atoms/button/button.js";

/**
 * Search input with icon, clear button, and enhanced functionality
 * @element neo-search-bar
 *
 * @prop {string} value - Search query value
 * @prop {string} placeholder - Placeholder text
 * @prop {boolean} disabled - Whether search is disabled
 * @prop {number} debounce - Debounce delay in milliseconds (default: 300)
 * @prop {string} shortcuts - Keyboard shortcut display (e.g., "⌘K")
 * @prop {Array} suggestions - Array of suggestion strings
 * @prop {boolean} showSuggestions - Whether to show suggestions dropdown
 * @prop {string} size - Size variant (sm, md, lg)
 * @prop {boolean} loading - Whether search is in loading state
 * @prop {string} searchIcon - Custom search icon
 * @prop {boolean} autofocus - Whether to autofocus on mount
 *
 * @fires neo-search - Debounced search event
 * @fires neo-search-immediate - Immediate search event
 * @fires neo-suggestion-select - When suggestion is selected
 * @fires neo-clear - When search is cleared
 */
export class NeoSearchBar extends BaseComponent {
  static get properties() {
    return {
      value: { type: String },
      placeholder: { type: String },
      disabled: { type: Boolean },
      debounce: { type: Number },
      shortcuts: { type: String },
      suggestions: { type: Array },
      showSuggestions: { type: Boolean, attribute: 'show-suggestions' },
      size: { type: String },
      loading: { type: Boolean },
      searchIcon: { type: String, attribute: 'search-icon' },
      autofocus: { type: Boolean },
      _filteredSuggestions: { type: Array, state: true },
      _suggestionIndex: { type: Number, state: true },
      _showDropdown: { type: Boolean, state: true },
      _debounceTimer: { type: Number, state: true },
    };
  }

  static get styles() {
    return [
      baseStyles,
      css`
        :host {
          display: block;
          position: relative;
          width: 100%;
        }

        .search-container {
          position: relative;
          display: flex;
          align-items: center;
        }

        .search-input-wrapper {
          position: relative;
          flex: 1;
          display: flex;
          align-items: center;
        }

        neo-input {
          width: 100%;
          padding-left: 40px;
        }

        .search-icon {
          position: absolute;
          left: 12px;
          width: 18px;
          height: 18px;
          color: var(--color-text-light);
          z-index: 1;
          pointer-events: none;
        }

        .clear-button {
          position: absolute;
          right: 8px;
          z-index: 1;
        }

        .clear-button neo-button {
          width: 24px;
          height: 24px;
          padding: 0;
          min-height: unset;
        }

        .shortcuts {
          position: absolute;
          right: 12px;
          font-size: var(--font-size-sm);
          color: var(--color-text-light);
          background: var(--color-gray-100);
          padding: 2px 6px;
          border-radius: var(--radius-sm);
          pointer-events: none;
        }

        .loading-spinner {
          position: absolute;
          right: 12px;
          width: 16px;
          height: 16px;
          border: 2px solid var(--color-gray-300);
          border-top-color: var(--color-primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Suggestions dropdown */
        .suggestions-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-lg);
          z-index: var(--z-index-dropdown);
          max-height: 200px;
          overflow-y: auto;
          margin-top: 4px;
        }

        .suggestion-item {
          padding: 12px 16px;
          cursor: pointer;
          border-bottom: 1px solid var(--color-gray-100);
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          transition: background-color 0.15s ease;
        }

        .suggestion-item:last-child {
          border-bottom: none;
        }

        .suggestion-item:hover,
        .suggestion-item.highlighted {
          background: var(--color-gray-50);
        }

        .suggestion-item.highlighted {
          background: var(--color-primary-light);
        }

        .suggestion-icon {
          width: 16px;
          height: 16px;
          color: var(--color-text-light);
        }

        .no-suggestions {
          padding: 12px 16px;
          color: var(--color-text-light);
          font-style: italic;
          text-align: center;
        }

        /* Size variations */
        :host([size="sm"]) neo-input {
          --input-height: 36px;
          --input-font-size: var(--font-size-sm);
          padding-left: 36px;
        }

        :host([size="sm"]) .search-icon {
          width: 16px;
          height: 16px;
          left: 10px;
        }

        :host([size="lg"]) neo-input {
          --input-height: 48px;
          --input-font-size: var(--font-size-lg);
          padding-left: 44px;
        }

        :host([size="lg"]) .search-icon {
          width: 20px;
          height: 20px;
          left: 14px;
        }

        /* Focus states */
        :host([focused]) .search-icon {
          color: var(--color-primary);
        }

        /* Disabled state */
        :host([disabled]) {
          opacity: 0.6;
          pointer-events: none;
        }
      `,
    ];
  }

  constructor() {
    super();
    this.value = '';
    this.placeholder = 'Search...';
    this.disabled = false;
    this.debounce = 300;
    this.shortcuts = '';
    this.suggestions = [];
    this.showSuggestions = false;
    this.size = 'md';
    this.loading = false;
    this.searchIcon = '';
    this.autofocus = false;
    this._filteredSuggestions = [];
    this._suggestionIndex = -1;
    this._showDropdown = false;
    this._debounceTimer = null;
  }

  connectedCallback() {
    super.connectedCallback();
    this._setupKeyboardShortcuts();

    if (this.autofocus) {
      this.updateComplete.then(() => {
        this.focus();
      });
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._cleanupKeyboardShortcuts();
    this._clearDebounceTimer();
  }

  /**
   * Setup global keyboard shortcuts
   */
  _setupKeyboardShortcuts() {
    this._handleKeyDown = this._handleGlobalKeyDown.bind(this);
    document.addEventListener('keydown', this._handleKeyDown);
  }

  /**
   * Cleanup keyboard shortcuts
   */
  _cleanupKeyboardShortcuts() {
    if (this._handleKeyDown) {
      document.removeEventListener('keydown', this._handleKeyDown);
    }
  }

  /**
   * Handle global keyboard shortcuts
   */
  _handleGlobalKeyDown(e) {
    // Handle Ctrl+K or Cmd+K to focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      this.focus();
    }
  }

  /**
   * Handle input changes
   */
  _handleInput(e) {
    const newValue = e.detail.value;
    this.value = newValue;

    // Immediate search event
    this.dispatchEvent(new CustomEvent('neo-search-immediate', {
      detail: { query: this.value },
      bubbles: true,
      composed: true
    }));

    // Update filtered suggestions
    this._updateFilteredSuggestions();

    // Debounced search
    this._clearDebounceTimer();
    this._debounceTimer = setTimeout(() => {
      this.dispatchEvent(new CustomEvent('neo-search', {
        detail: { query: this.value },
        bubbles: true,
        composed: true
      }));
    }, this.debounce);
  }

  /**
   * Handle input focus
   */
  _handleFocus() {
    this.setAttribute('focused', '');
    if (this.showSuggestions && this.value) {
      this._showDropdown = true;
    }
  }

  /**
   * Handle input blur
   */
  _handleBlur(e) {
    this.removeAttribute('focused');
    // Delay hiding dropdown to allow for suggestion clicks
    setTimeout(() => {
      this._showDropdown = false;
      this._suggestionIndex = -1;
    }, 150);
  }

  /**
   * Handle keyboard navigation in suggestions
   */
  _handleKeyDown(e) {
    if (!this._showDropdown || !this._filteredSuggestions.length) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        this._suggestionIndex = Math.min(
          this._suggestionIndex + 1,
          this._filteredSuggestions.length - 1
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        this._suggestionIndex = Math.max(this._suggestionIndex - 1, -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (this._suggestionIndex >= 0) {
          this._selectSuggestion(this._filteredSuggestions[this._suggestionIndex]);
        }
        break;
      case 'Escape':
        this._showDropdown = false;
        this._suggestionIndex = -1;
        this.blur();
        break;
    }
  }

  /**
   * Update filtered suggestions based on current value
   */
  _updateFilteredSuggestions() {
    if (!this.showSuggestions || !this.value) {
      this._filteredSuggestions = [];
      this._showDropdown = false;
      return;
    }

    const query = this.value.toLowerCase();
    this._filteredSuggestions = this.suggestions.filter(suggestion =>
      suggestion.toLowerCase().includes(query)
    );

    this._showDropdown = this._filteredSuggestions.length > 0;
    this._suggestionIndex = -1;
  }

  /**
   * Select a suggestion
   */
  _selectSuggestion(suggestion) {
    this.value = suggestion;
    this._showDropdown = false;
    this._suggestionIndex = -1;

    this.dispatchEvent(new CustomEvent('neo-suggestion-select', {
      detail: { suggestion },
      bubbles: true,
      composed: true
    }));

    // Trigger search
    this.dispatchEvent(new CustomEvent('neo-search', {
      detail: { query: this.value },
      bubbles: true,
      composed: true
    }));
  }

  /**
   * Clear the search
   */
  _clearSearch() {
    this.value = '';
    this._showDropdown = false;
    this._suggestionIndex = -1;
    this._clearDebounceTimer();

    this.dispatchEvent(new CustomEvent('neo-clear', {
      bubbles: true,
      composed: true
    }));

    this.focus();
  }

  /**
   * Clear the debounce timer
   */
  _clearDebounceTimer() {
    if (this._debounceTimer) {
      clearTimeout(this._debounceTimer);
      this._debounceTimer = null;
    }
  }

  /**
   * Public method to focus the search input
   */
  focus() {
    const input = this.shadowRoot?.querySelector('neo-input');
    if (input && input.focus) {
      input.focus();
    }
  }

  /**
   * Public method to blur the search input
   */
  blur() {
    const input = this.shadowRoot?.querySelector('neo-input');
    if (input && input.blur) {
      input.blur();
    }
  }

  render() {
    const hasValue = Boolean(this.value);
    const showClear = hasValue && !this.loading;
    const showShortcuts = this.shortcuts && !hasValue && !this.loading;

    return html`
      <div class="search-container">
        <div class="search-input-wrapper">
          <svg class="search-icon" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" />
          </svg>

          <neo-input
            .value="${this.value}"
            placeholder="${this.placeholder}"
            ?disabled="${this.disabled}"
            size="${this.size}"
            autocomplete="off"
            spellcheck="false"
            @neo-input="${this._handleInput}"
            @focus="${this._handleFocus}"
            @blur="${this._handleBlur}"
            @keydown="${this._handleKeyDown}">
          </neo-input>

          ${this.loading ? html`
            <div class="loading-spinner"></div>
          ` : showClear ? html`
            <div class="clear-button">
              <neo-button
                variant="ghost"
                size="sm"
                @click="${this._clearSearch}"
                aria-label="Clear search">
                <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                </svg>
              </neo-button>
            </div>
          ` : showShortcuts ? html`
            <div class="shortcuts">${this.shortcuts}</div>
          ` : ''}
        </div>

        ${this._showDropdown ? html`
          <div class="suggestions-dropdown">
            ${this._filteredSuggestions.length > 0 ?
              this._filteredSuggestions.map((suggestion, index) => html`
                <div
                  class="suggestion-item ${index === this._suggestionIndex ? 'highlighted' : ''}"
                  @click="${() => this._selectSuggestion(suggestion)}">
                  <svg class="suggestion-icon" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" />
                  </svg>
                  ${suggestion}
                </div>
              `) : html`
                <div class="no-suggestions">No suggestions found</div>
              `
            }
          </div>
        ` : ''}
      </div>
    `;
  }
}

// Register the component
if (!customElements.get("neo-search-bar")) {
  customElements.define("neo-search-bar", NeoSearchBar);
}
