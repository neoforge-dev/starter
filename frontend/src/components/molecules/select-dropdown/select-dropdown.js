import { html, css } from "lit";
import { BaseComponent } from "../../base-component.js";
import { baseStyles } from "../../styles/base.js";
import "../../atoms/input/input.js";
import "../../atoms/icon/icon.js";
import "../../atoms/badge/badge.js";

/**
 * Enhanced select dropdown with search, multiple selection, and custom options
 * @element neo-select-dropdown
 *
 * @prop {Array|string} options - Array of option objects or JSON string
 * @prop {string|Array} value - Selected value(s)
 * @prop {string} placeholder - Placeholder text
 * @prop {boolean} multiple - Allow multiple selections
 * @prop {boolean} searchable - Enable search functionality
 * @prop {boolean} clearable - Show clear button
 * @prop {boolean} disabled - Disable the select
 * @prop {boolean} required - Mark as required
 * @prop {string} size - Input size (sm, md, lg)
 * @prop {string} variant - Visual variant (default, outline, ghost)
 * @prop {string} label - Accessible label
 * @prop {string} error - Error message
 * @prop {string} help - Help text
 * @prop {boolean} loading - Show loading state
 * @prop {number} maxSelections - Maximum number of selections (for multiple)
 * @prop {string} noOptionsText - Text when no options available
 * @prop {string} searchPlaceholder - Search input placeholder
 * @prop {boolean} groupBy - Enable option grouping
 * @prop {boolean} createOption - Allow creating new options
 * @prop {number} maxHeight - Maximum dropdown height in pixels
 *
 * @fires neo-select-change - When selection changes
 * @fires neo-select-search - When search input changes
 * @fires neo-select-open - When dropdown opens
 * @fires neo-select-close - When dropdown closes
 * @fires neo-option-create - When new option is created
 */
export class NeoSelectDropdown extends BaseComponent {
  static get properties() {
    return {
      options: { type: Array },
      value: { type: String },
      placeholder: { type: String },
      multiple: { type: Boolean },
      searchable: { type: Boolean },
      clearable: { type: Boolean },
      disabled: { type: Boolean },
      required: { type: Boolean },
      size: { type: String },
      variant: { type: String },
      label: { type: String },
      error: { type: String },
      help: { type: String },
      loading: { type: Boolean },
      maxSelections: { type: Number, attribute: 'max-selections' },
      noOptionsText: { type: String, attribute: 'no-options-text' },
      searchPlaceholder: { type: String, attribute: 'search-placeholder' },
      groupBy: { type: Boolean, attribute: 'group-by' },
      createOption: { type: Boolean, attribute: 'create-option' },
      maxHeight: { type: Number, attribute: 'max-height' },
      _isOpen: { type: Boolean, state: true },
      _searchTerm: { type: String, state: true },
      _selectedValues: { type: Array, state: true },
      _filteredOptions: { type: Array, state: true },
      _focusedIndex: { type: Number, state: true },
      _optionsData: { type: Array, state: true },
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

        :host([disabled]) {
          opacity: 0.6;
          pointer-events: none;
        }

        .select-container {
          position: relative;
          width: 100%;
        }

        .select-trigger {
          display: flex;
          align-items: center;
          width: 100%;
          min-height: 40px;
          padding: var(--spacing-sm) var(--spacing-md);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          background: var(--color-surface);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .select-trigger:hover {
          border-color: var(--color-primary);
        }

        .select-trigger:focus {
          outline: 2px solid var(--color-primary);
          outline-offset: 2px;
          border-color: var(--color-primary);
        }

        .select-trigger.open {
          border-color: var(--color-primary);
          border-bottom-left-radius: 0;
          border-bottom-right-radius: 0;
        }

        .select-trigger.error {
          border-color: var(--color-error);
        }

        /* Size variations */
        .select-trigger.size-sm {
          min-height: 32px;
          padding: var(--spacing-xs) var(--spacing-sm);
          font-size: var(--font-size-sm);
        }

        .select-trigger.size-lg {
          min-height: 48px;
          padding: var(--spacing-md) var(--spacing-lg);
          font-size: var(--font-size-lg);
        }

        /* Variant styles */
        .select-trigger.variant-outline {
          background: transparent;
        }

        .select-trigger.variant-ghost {
          border: none;
          background: transparent;
        }

        .select-trigger.variant-ghost:hover {
          background: var(--color-gray-50);
        }

        /* Selected values display */
        .selected-values {
          display: flex;
          align-items: center;
          flex: 1;
          min-width: 0;
          gap: var(--spacing-xs);
        }

        .single-value {
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .placeholder {
          color: var(--color-text-light);
          flex: 1;
        }

        .multiple-values {
          display: flex;
          flex-wrap: wrap;
          gap: var(--spacing-xs);
          flex: 1;
          min-width: 0;
        }

        .value-tag {
          display: inline-flex;
          align-items: center;
          gap: var(--spacing-xs);
          padding: var(--spacing-xs);
          background: var(--color-primary-light);
          color: var(--color-primary);
          border-radius: var(--radius-sm);
          font-size: var(--font-size-sm);
          max-width: 150px;
        }

        .value-tag-text {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .value-tag-remove {
          width: 14px;
          height: 14px;
          cursor: pointer;
          opacity: 0.7;
        }

        .value-tag-remove:hover {
          opacity: 1;
        }

        /* Trigger controls */
        .trigger-controls {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
          flex-shrink: 0;
        }

        .clear-button {
          width: 16px;
          height: 16px;
          cursor: pointer;
          opacity: 0.5;
          transition: opacity var(--transition-fast);
        }

        .clear-button:hover {
          opacity: 1;
        }

        .dropdown-arrow {
          width: 16px;
          height: 16px;
          transition: transform var(--transition-fast);
          opacity: 0.7;
        }

        .dropdown-arrow.open {
          transform: rotate(180deg);
        }

        .loading-spinner {
          width: 16px;
          height: 16px;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* Dropdown */
        .dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          z-index: var(--z-index-dropdown);
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-top: none;
          border-radius: 0 0 var(--radius-md) var(--radius-md);
          box-shadow: var(--shadow-lg);
          max-height: var(--max-height, 200px);
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        /* Search input */
        .search-container {
          padding: var(--spacing-sm);
          border-bottom: 1px solid var(--color-border);
        }

        .search-input {
          width: 100%;
          padding: var(--spacing-xs) var(--spacing-sm);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          font-size: var(--font-size-sm);
        }

        .search-input:focus {
          outline: 2px solid var(--color-primary);
          outline-offset: -2px;
          border-color: var(--color-primary);
        }

        /* Options list */
        .options-list {
          flex: 1;
          overflow-y: auto;
          max-height: inherit;
        }

        .option-group {
          border-bottom: 1px solid var(--color-border);
        }

        .option-group:last-child {
          border-bottom: none;
        }

        .group-label {
          padding: var(--spacing-xs) var(--spacing-md);
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-medium);
          color: var(--color-text-light);
          background: var(--color-gray-50);
          border-bottom: 1px solid var(--color-border);
        }

        .option {
          display: flex;
          align-items: center;
          padding: var(--spacing-sm) var(--spacing-md);
          cursor: pointer;
          transition: background var(--transition-fast);
          border: none;
          background: none;
          width: 100%;
          text-align: left;
        }

        .option:hover,
        .option.focused {
          background: var(--color-gray-50);
        }

        .option.selected {
          background: var(--color-primary-light);
          color: var(--color-primary);
        }

        .option.disabled {
          opacity: 0.5;
          pointer-events: none;
        }

        .option-content {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          flex: 1;
          min-width: 0;
        }

        .option-text {
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .option-description {
          font-size: var(--font-size-sm);
          color: var(--color-text-light);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .option-icon {
          width: 16px;
          height: 16px;
          flex-shrink: 0;
        }

        .option-badge {
          flex-shrink: 0;
        }

        .option-check {
          width: 16px;
          height: 16px;
          flex-shrink: 0;
          margin-left: auto;
        }

        /* No options message */
        .no-options {
          padding: var(--spacing-md);
          text-align: center;
          color: var(--color-text-light);
          font-style: italic;
        }

        /* Create option */
        .create-option {
          border-top: 1px solid var(--color-border);
          background: var(--color-gray-50);
          font-style: italic;
        }

        .create-option:hover {
          background: var(--color-primary-light);
        }

        /* Form field styles */
        .field-label {
          display: block;
          margin-bottom: var(--spacing-xs);
          font-weight: var(--font-weight-medium);
          color: var(--color-text);
        }

        .field-help {
          margin-top: var(--spacing-xs);
          font-size: var(--font-size-sm);
          color: var(--color-text-light);
        }

        .field-error {
          margin-top: var(--spacing-xs);
          font-size: var(--font-size-sm);
          color: var(--color-error);
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

        /* Responsive design */
        @media (max-width: 640px) {
          .dropdown {
            position: fixed;
            top: auto;
            bottom: 0;
            left: 0;
            right: 0;
            border-radius: var(--radius-md) var(--radius-md) 0 0;
            max-height: 60vh;
          }

          .value-tag {
            max-width: 100px;
          }
        }

        /* High contrast mode */
        @media (prefers-contrast: high) {
          .select-trigger {
            border-width: 2px;
          }

          .option.selected {
            border: 2px solid var(--color-primary);
          }
        }
      `,
    ];
  }

  constructor() {
    super();
    this.options = [];
    this.value = '';
    this.placeholder = 'Select an option...';
    this.multiple = false;
    this.searchable = false;
    this.clearable = false;
    this.disabled = false;
    this.required = false;
    this.size = 'md';
    this.variant = 'default';
    this.label = '';
    this.error = '';
    this.help = '';
    this.loading = false;
    this.maxSelections = null;
    this.noOptionsText = 'No options available';
    this.searchPlaceholder = 'Search...';
    this.groupBy = false;
    this.createOption = false;
    this.maxHeight = 200;

    this._isOpen = false;
    this._searchTerm = '';
    this._selectedValues = [];
    this._filteredOptions = [];
    this._focusedIndex = -1;
    this._optionsData = [];

    this._boundHandleDocumentClick = this._handleDocumentClick.bind(this);
  }

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener('click', this._boundHandleDocumentClick);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('click', this._boundHandleDocumentClick);
  }

  updated(changedProperties) {
    super.updated(changedProperties);

    if (changedProperties.has('options')) {
      this._parseOptionsData();
    }

    if (changedProperties.has('value')) {
      this._parseSelectedValues();
    }

    if (changedProperties.has('_searchTerm') || changedProperties.has('_optionsData')) {
      this._filterOptions();
    }

    if (changedProperties.has('maxHeight')) {
      this.style.setProperty('--max-height', `${this.maxHeight}px`);
    }
  }

  /**
   * Parse options data from prop
   */
  _parseOptionsData() {
    try {
      if (typeof this.options === 'string') {
        this._optionsData = JSON.parse(this.options);
      } else if (Array.isArray(this.options)) {
        this._optionsData = [...this.options];
      } else {
        this._optionsData = [];
      }
    } catch (error) {
      console.warn('Invalid options data provided to neo-select-dropdown:', error);
      this._optionsData = [];
    }
  }

  /**
   * Parse selected values from prop
   */
  _parseSelectedValues() {
    if (this.multiple) {
      if (Array.isArray(this.value)) {
        this._selectedValues = [...this.value];
      } else if (typeof this.value === 'string' && this.value) {
        try {
          this._selectedValues = JSON.parse(this.value);
        } catch {
          this._selectedValues = this.value.split(',').map(v => v.trim());
        }
      } else {
        this._selectedValues = [];
      }
    } else {
      this._selectedValues = this.value ? [this.value] : [];
    }
  }

  /**
   * Filter options based on search term
   */
  _filterOptions() {
    if (!this._searchTerm) {
      this._filteredOptions = [...this._optionsData];
      return;
    }

    const searchLower = this._searchTerm.toLowerCase();
    this._filteredOptions = this._optionsData.filter(option => {
      const text = option.label || option.text || option.value || '';
      const description = option.description || '';
      return text.toLowerCase().includes(searchLower) ||
             description.toLowerCase().includes(searchLower);
    });
  }

  /**
   * Handle document click for closing dropdown
   */
  _handleDocumentClick(e) {
    if (!this.contains(e.target)) {
      this._closeDropdown();
    }
  }

  /**
   * Toggle dropdown open/close
   */
  _toggleDropdown() {
    if (this.disabled || this.loading) return;

    if (this._isOpen) {
      this._closeDropdown();
    } else {
      this._openDropdown();
    }
  }

  /**
   * Open dropdown
   */
  _openDropdown() {
    this._isOpen = true;
    this._focusedIndex = -1;

    this.dispatchEvent(new CustomEvent('neo-select-open', {
      bubbles: true,
      composed: true
    }));

    // Focus search input if searchable
    if (this.searchable) {
      setTimeout(() => {
        const searchInput = this.shadowRoot?.querySelector('.search-input');
        searchInput?.focus();
      }, 50);
    }
  }

  /**
   * Close dropdown
   */
  _closeDropdown() {
    this._isOpen = false;
    this._searchTerm = '';
    this._focusedIndex = -1;

    this.dispatchEvent(new CustomEvent('neo-select-close', {
      bubbles: true,
      composed: true
    }));
  }

  /**
   * Handle option selection
   */
  _selectOption(option, index) {
    if (option.disabled) return;

    const optionValue = option.value || option.label || option.text;

    if (this.multiple) {
      const isSelected = this._selectedValues.includes(optionValue);

      if (isSelected) {
        this._selectedValues = this._selectedValues.filter(v => v !== optionValue);
      } else {
        if (this.maxSelections && this._selectedValues.length >= this.maxSelections) {
          return; // Max selections reached
        }
        this._selectedValues = [...this._selectedValues, optionValue];
      }

      this.value = this._selectedValues;
    } else {
      this._selectedValues = [optionValue];
      this.value = optionValue;
      this._closeDropdown();
    }

    this.dispatchEvent(new CustomEvent('neo-select-change', {
      detail: {
        value: this.value,
        selectedValues: this._selectedValues,
        option,
        index
      },
      bubbles: true,
      composed: true
    }));
  }

  /**
   * Remove selected value (for multiple selection)
   */
  _removeValue(valueToRemove, e) {
    e.stopPropagation();

    this._selectedValues = this._selectedValues.filter(v => v !== valueToRemove);
    this.value = this._selectedValues;

    this.dispatchEvent(new CustomEvent('neo-select-change', {
      detail: {
        value: this.value,
        selectedValues: this._selectedValues,
        removedValue: valueToRemove
      },
      bubbles: true,
      composed: true
    }));
  }

  /**
   * Clear all selections
   */
  _clearSelection(e) {
    e.stopPropagation();

    this._selectedValues = [];
    this.value = this.multiple ? [] : '';

    this.dispatchEvent(new CustomEvent('neo-select-change', {
      detail: {
        value: this.value,
        selectedValues: this._selectedValues,
        cleared: true
      },
      bubbles: true,
      composed: true
    }));
  }

  /**
   * Handle search input
   */
  _handleSearch(e) {
    this._searchTerm = e.target.value;
    this._focusedIndex = -1;

    this.dispatchEvent(new CustomEvent('neo-select-search', {
      detail: {
        searchTerm: this._searchTerm,
        filteredOptions: this._filteredOptions
      },
      bubbles: true,
      composed: true
    }));
  }

  /**
   * Handle keyboard navigation
   */
  _handleKeyDown(e) {
    if (!this._isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        this._openDropdown();
      }
      return;
    }

    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        this._closeDropdown();
        break;

      case 'ArrowDown':
        e.preventDefault();
        this._focusedIndex = Math.min(this._focusedIndex + 1, this._filteredOptions.length - 1);
        this._scrollToFocused();
        break;

      case 'ArrowUp':
        e.preventDefault();
        this._focusedIndex = Math.max(this._focusedIndex - 1, 0);
        this._scrollToFocused();
        break;

      case 'Enter':
        e.preventDefault();
        if (this._focusedIndex >= 0 && this._filteredOptions[this._focusedIndex]) {
          this._selectOption(this._filteredOptions[this._focusedIndex], this._focusedIndex);
        }
        break;

      case 'Tab':
        this._closeDropdown();
        break;
    }
  }

  /**
   * Scroll focused option into view
   */
  _scrollToFocused() {
    const optionsList = this.shadowRoot?.querySelector('.options-list');
    const focusedOption = this.shadowRoot?.querySelector('.option.focused');

    if (optionsList && focusedOption) {
      focusedOption.scrollIntoView({ block: 'nearest' });
    }
  }

  /**
   * Create new option
   */
  _createNewOption() {
    if (!this._searchTerm.trim()) return;

    const newOption = {
      value: this._searchTerm,
      label: this._searchTerm,
      text: this._searchTerm,
      isNew: true
    };

    this.dispatchEvent(new CustomEvent('neo-option-create', {
      detail: {
        option: newOption,
        searchTerm: this._searchTerm
      },
      bubbles: true,
      composed: true
    }));

    // Optionally add to options and select
    this._optionsData.unshift(newOption);
    this._selectOption(newOption, 0);
  }

  /**
   * Get display text for selected values
   */
  _getDisplayText() {
    if (this._selectedValues.length === 0) {
      return this.placeholder;
    }

    if (this.multiple) {
      return this._selectedValues;
    }

    const selectedOption = this._optionsData.find(opt =>
      (opt.value || opt.label || opt.text) === this._selectedValues[0]
    );

    return selectedOption?.label || selectedOption?.text || this._selectedValues[0];
  }

  /**
   * Check if option is selected
   */
  _isOptionSelected(option) {
    const optionValue = option.value || option.label || option.text;
    return this._selectedValues.includes(optionValue);
  }

  /**
   * Public method to set value
   */
  setValue(value) {
    this.value = value;
  }

  /**
   * Public method to clear selection
   */
  clear() {
    this._clearSelection({ stopPropagation: () => {} });
  }

  /**
   * Public method to open dropdown
   */
  open() {
    this._openDropdown();
  }

  /**
   * Public method to close dropdown
   */
  close() {
    this._closeDropdown();
  }

  render() {
    const triggerClasses = [
      'select-trigger',
      `size-${this.size}`,
      `variant-${this.variant}`,
      this._isOpen ? 'open' : '',
      this.error ? 'error' : ''
    ].filter(Boolean).join(' ');

    const hasValue = this._selectedValues.length > 0;
    const displayText = this._getDisplayText();
    const showClear = this.clearable && hasValue && !this.disabled;

    return html`
      ${this.label ? html`
        <label class="field-label" for="select-trigger">
          ${this.label}
          ${this.required ? html`<span aria-label="required">*</span>` : ''}
        </label>
      ` : ''}

      <div class="select-container">
        <div
          id="select-trigger"
          class="${triggerClasses}"
          role="combobox"
          aria-expanded="${this._isOpen}"
          aria-haspopup="listbox"
          aria-required="${this.required}"
          aria-invalid="${!!this.error}"
          aria-describedby="${this.help ? 'select-help' : ''} ${this.error ? 'select-error' : ''}"
          tabindex="${this.disabled ? '-1' : '0'}"
          @click="${this._toggleDropdown}"
          @keydown="${this._handleKeyDown}">

          <div class="selected-values">
            ${this.multiple && hasValue ? html`
              <div class="multiple-values">
                ${this._selectedValues.map(value => html`
                  <div class="value-tag">
                    <span class="value-tag-text">${value}</span>
                    <neo-icon
                      name="x"
                      class="value-tag-remove"
                      @click="${(e) => this._removeValue(value, e)}">
                    </neo-icon>
                  </div>
                `)}
              </div>
            ` : html`
              <span class="${hasValue ? 'single-value' : 'placeholder'}">
                ${Array.isArray(displayText) ? this.placeholder : displayText}
              </span>
            `}
          </div>

          <div class="trigger-controls">
            ${this.loading ? html`
              <neo-icon name="loader" class="loading-spinner"></neo-icon>
            ` : html`
              ${showClear ? html`
                <neo-icon
                  name="x"
                  class="clear-button"
                  @click="${this._clearSelection}">
                </neo-icon>
              ` : ''}

              <neo-icon
                name="chevron-down"
                class="dropdown-arrow ${this._isOpen ? 'open' : ''}">
              </neo-icon>
            `}
          </div>
        </div>

        ${this._isOpen ? html`
          <div class="dropdown">
            ${this.searchable ? html`
              <div class="search-container">
                <input
                  type="text"
                  class="search-input"
                  placeholder="${this.searchPlaceholder}"
                  .value="${this._searchTerm}"
                  @input="${this._handleSearch}"
                  @keydown="${this._handleKeyDown}">
              </div>
            ` : ''}

            <div class="options-list" role="listbox" aria-multiselectable="${this.multiple}">
              ${this._filteredOptions.length === 0 ? html`
                <div class="no-options">
                  ${this.noOptionsText}
                </div>

                ${this.createOption && this._searchTerm ? html`
                  <button
                    class="option create-option"
                    @click="${this._createNewOption}"
                    role="option">
                    <div class="option-content">
                      <span class="option-text">Create "${this._searchTerm}"</span>
                    </div>
                  </button>
                ` : ''}
              ` : html`
                ${this._filteredOptions.map((option, index) => {
                  const isSelected = this._isOptionSelected(option);
                  const isFocused = this._focusedIndex === index;

                  return html`
                    <button
                      class="option ${isSelected ? 'selected' : ''} ${isFocused ? 'focused' : ''} ${option.disabled ? 'disabled' : ''}"
                      role="option"
                      aria-selected="${isSelected}"
                      @click="${() => this._selectOption(option, index)}"
                      @mouseover="${() => this._focusedIndex = index}">

                      <div class="option-content">
                        ${option.icon ? html`
                          <neo-icon name="${option.icon}" class="option-icon"></neo-icon>
                        ` : ''}

                        <div class="option-text">
                          ${option.label || option.text || option.value}
                          ${option.description ? html`
                            <div class="option-description">${option.description}</div>
                          ` : ''}
                        </div>

                        ${option.badge ? html`
                          <neo-badge class="option-badge" size="sm" variant="${option.badgeVariant || 'neutral'}">
                            ${option.badge}
                          </neo-badge>
                        ` : ''}

                        ${this.multiple && isSelected ? html`
                          <neo-icon name="check" class="option-check"></neo-icon>
                        ` : ''}
                      </div>
                    </button>
                  `;
                })}

                ${this.createOption && this._searchTerm && !this._filteredOptions.some(opt =>
                  (opt.label || opt.text || opt.value).toLowerCase() === this._searchTerm.toLowerCase()
                ) ? html`
                  <button
                    class="option create-option"
                    @click="${this._createNewOption}"
                    role="option">
                    <div class="option-content">
                      <span class="option-text">Create "${this._searchTerm}"</span>
                    </div>
                  </button>
                ` : ''}
              `}
            </div>
          </div>
        ` : ''}
      </div>

      ${this.help ? html`
        <div id="select-help" class="field-help">${this.help}</div>
      ` : ''}

      ${this.error ? html`
        <div id="select-error" class="field-error">${this.error}</div>
      ` : ''}
    `;
  }
}

// Register the component
if (!customElements.get("neo-select-dropdown")) {
  customElements.define("neo-select-dropdown", NeoSelectDropdown);
}
