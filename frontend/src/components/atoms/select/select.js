import {   LitElement, html, css   } from 'lit';
import { baseStyles } from "../../styles/base.js";

/**
 * Select component for single and multiple selection
 * @element neo-select
 *
 * @prop {Array} options - Array of options or option groups
 * @prop {string|Array} value - Selected value(s)
 * @prop {string} label - Label text
 * @prop {string} placeholder - Placeholder text
 * @prop {string} helper - Helper text
 * @prop {string} error - Error message
 * @prop {boolean} multiple - Enable multiple selection
 * @prop {boolean} searchable - Enable search functionality
 * @prop {boolean} disabled - Disable the select
 * @prop {boolean} required - Mark as required
 */
export class NeoSelect extends LitElement {
  static properties = {
    options: { type: Array },
    value: { type: [String, Array] },
    label: { type: String },
    placeholder: { type: String },
    helper: { type: String },
    error: { type: String },
    multiple: { type: Boolean, reflect: true },
    searchable: { type: Boolean, reflect: true },
    disabled: { type: Boolean, reflect: true },
    required: { type: Boolean, reflect: true },
    _isOpen: { type: Boolean, state: true },
    _searchText: { type: String, state: true },
    _focusedIndex: { type: Number, state: true },
  };

  static styles = [
    baseStyles,
    css`
      :host {
        display: block;
        position: relative;
      }

      .select-wrapper {
        position: relative;
      }

      label {
        display: block;
        margin-bottom: var(--spacing-xs);
        color: var(--color-text);
        font-size: var(--font-size-sm);
        font-weight: var(--font-weight-medium);
      }

      .select-trigger {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        padding: var(--spacing-sm);
        background: white;
        border: 1px solid var(--color-border);
        border-radius: var(--radius-sm);
        font-family: var(--font-family);
        font-size: var(--font-size-base);
        line-height: 1.5;
        cursor: pointer;
        transition: all var(--transition-fast);
      }

      .select-trigger:focus {
        outline: none;
        border-color: var(--color-primary);
        box-shadow: 0 0 0 2px var(--color-primary-light);
      }

      .select-trigger.disabled {
        background-color: var(--color-gray-100);
        cursor: not-allowed;
      }

      .select-trigger.error {
        border-color: var(--color-error);
      }

      .dropdown {
        display: none;
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        margin-top: var(--spacing-xs);
        background: white;
        border: 1px solid var(--color-border);
        border-radius: var(--radius-sm);
        box-shadow: var(--shadow-md);
        z-index: 1000;
      }

      .dropdown.open {
        display: block;
      }

      .search-input {
        padding: var(--spacing-xs);
        border-bottom: 1px solid var(--color-border);
      }

      .search-input input {
        width: 100%;
        padding: var(--spacing-xs);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-sm);
        font-family: var(--font-family);
        font-size: var(--font-size-sm);
      }

      .search-input input:focus {
        outline: none;
        border-color: var(--color-primary);
      }

      .options-list {
        max-height: 250px;
        overflow-y: auto;
        padding: var(--spacing-xs);
      }

      .group-label {
        padding: var(--spacing-xs) var(--spacing-sm);
        color: var(--color-text-light);
        font-size: var(--font-size-sm);
        font-weight: var(--font-weight-medium);
      }

      .option {
        padding: var(--spacing-xs) var(--spacing-sm);
        cursor: pointer;
        border-radius: var(--radius-sm);
        transition: all var(--transition-fast);
      }

      .option:hover,
      .option.focused {
        background: var(--color-gray-100);
      }

      .option[aria-selected="true"] {
        background: var(--color-primary-light);
        color: var(--color-primary);
      }

      .error-message {
        margin-top: var(--spacing-xs);
        color: var(--color-error);
        font-size: var(--font-size-sm);
      }

      .helper-text {
        margin-top: var(--spacing-xs);
        color: var(--color-text-light);
        font-size: var(--font-size-sm);
      }

      /* Selected values display for multiple select */
      .selected-values {
        display: flex;
        flex-wrap: wrap;
        gap: var(--spacing-xs);
        min-height: 24px;
      }

      .selected-tag {
        display: inline-flex;
        align-items: center;
        gap: var(--spacing-xs);
        padding: 2px var(--spacing-xs);
        background: var(--color-gray-100);
        border-radius: var(--radius-sm);
        font-size: var(--font-size-sm);
      }

      .remove-tag {
        cursor: pointer;
        opacity: 0.7;
      }

      .remove-tag:hover {
        opacity: 1;
      }
    `,
  ];

  constructor() {
    super();
    this.options = [];
    this.value = this.multiple ? [] : "";
    this.placeholder = "Select an option";
    this.multiple = false;
    this.searchable = false;
    this.disabled = false;
    this.required = false;
    this._isOpen = false;
    this._searchText = "";
    this._focusedIndex = -1;
    this._id = `neo-select-${Math.random().toString(36).substr(2, 9)}`;
  }

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener("click", this._handleOutsideClick.bind(this));
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener("click", this._handleOutsideClick.bind(this));
  }

  _handleOutsideClick(e) {
    if (!this.contains(e.target) && this._isOpen) {
      this._isOpen = false;
      this._searchText = "";
    }
  }

  _handleTriggerClick() {
    if (!this.disabled) {
      this._isOpen = !this._isOpen;
      if (this._isOpen && this.searchable) {
        requestAnimationFrame(() => {
          const searchInput = this.shadowRoot.querySelector(
            ".search-input input"
          );
          if (searchInput) searchInput.focus();
        });
      }
    }
  }

  _handleKeydown(e) {
    if (this.disabled) return;

    switch (e.key) {
      case "Enter":
      case " ":
        if (!this._isOpen) {
          this._isOpen = true;
        } else if (this._focusedIndex >= 0) {
          const option = this.filteredOptions[this._focusedIndex];
          if (option && !option.group) {
            this._handleOptionSelect(option);
          }
        }
        e.preventDefault();
        break;

      case "Escape":
        this._isOpen = false;
        this._searchText = "";
        break;

      case "ArrowDown":
        if (!this._isOpen) {
          this._isOpen = true;
        } else {
          this._focusedIndex = Math.min(
            this._focusedIndex + 1,
            this.filteredOptions.length - 1
          );
        }
        e.preventDefault();
        break;

      case "ArrowUp":
        if (this._isOpen) {
          this._focusedIndex = Math.max(this._focusedIndex - 1, 0);
        }
        e.preventDefault();
        break;
    }
  }

  _handleSearch(e) {
    this._searchText = e.target.value;
    this._focusedIndex = -1;
  }

  _handleOptionSelect(option) {
    if (this.multiple) {
      const values = Array.isArray(this.value) ? [...this.value] : [];
      const index = values.indexOf(option.value);

      if (index === -1) {
        values.push(option.value);
      } else {
        values.splice(index, 1);
      }

      this.value = values;
      this._focusedIndex = -1;
    } else {
      this.value = option.value;
      this._isOpen = false;
      this._searchText = "";
    }

    this.dispatchEvent(
      new CustomEvent("neo-change", {
        detail: { value: this.value },
        bubbles: true,
        composed: true,
      })
    );
  }

  _removeValue(valueToRemove) {
    if (this.multiple) {
      this.value = this.value.filter((v) => v !== valueToRemove);
      this.dispatchEvent(
        new CustomEvent("neo-change", {
          detail: { value: this.value },
          bubbles: true,
          composed: true,
        })
      );
    }
  }

  get filteredOptions() {
    let options = this.options;
    if (this._searchText) {
      const searchLower = this._searchText.toLowerCase();
      options = this.options
        .map((option) => {
          if (option.group) {
            return {
              ...option,
              options: option.options.filter((o) =>
                o.label.toLowerCase().includes(searchLower)
              ),
            };
          }
          return option.label.toLowerCase().includes(searchLower)
            ? option
            : null;
        })
        .filter(Boolean);
    }
    return options;
  }

  get selectedLabel() {
    if (!this.value) return "";

    if (this.multiple) {
      return this.value.map((v) => {
        const option = this.options
          .flatMap((o) => (o.group ? o.options : o))
          .find((o) => o.value === v);
        return option ? option.label : "";
      });
    }

    const option = this.options
      .flatMap((o) => (o.group ? o.options : o))
      .find((o) => o.value === this.value);
    return option ? option.label : "";
  }

  render() {
    return html`
      ${this.label ? html`<label for="${this._id}">${this.label}</label>` : ""}
      <div class="select-wrapper">
        <button
          id="${this._id}"
          class="select-trigger ${this.disabled ? "disabled" : ""} ${this.error
            ? "error"
            : ""}"
          @click="${this._handleTriggerClick}"
          @keydown="${this._handleKeydown}"
          ?disabled="${this.disabled}"
          aria-haspopup="listbox"
          aria-expanded="${this._isOpen}"
          aria-disabled="${this.disabled}"
          aria-required="${this.required}"
          aria-invalid="${Boolean(this.error)}"
          aria-controls="${this._id}-listbox"
        >
          ${this.multiple
            ? html`
                <div class="selected-values">
                  ${Array.isArray(this.value) && this.value.length
                    ? this.value.map(
                        (v) => html`
                          <span class="selected-tag">
                            ${this.options
                              .flatMap((o) => (o.group ? o.options : o))
                              .find((o) => o.value === v)?.label}
                            <span
                              class="remove-tag"
                              @click="${(e) => {
                                e.stopPropagation();
                                this._removeValue(v);
                              }}"
                            >
                              ×
                            </span>
                          </span>
                        `
                      )
                    : html`<span class="placeholder"
                        >${this.placeholder}</span
                      >`}
                </div>
              `
            : html`
                <span>
                  ${this.selectedLabel ||
                  html`<span>${this.placeholder}</span>`}
                </span>
              `}
          <span class="arrow">▼</span>
        </button>

        <div
          class="dropdown ${this._isOpen ? "open" : ""}"
          id="${this._id}-listbox"
          role="listbox"
          aria-multiselectable="${this.multiple}"
        >
          ${this.searchable
            ? html`
                <div class="search-input">
                  <input
                    type="text"
                    placeholder="Search..."
                    .value="${this._searchText}"
                    @input="${this._handleSearch}"
                  />
                </div>
              `
            : ""}
          <div class="options-list">
            ${this.filteredOptions.map((option, index) =>
              option.group
                ? html`
                    <div class="group-label">${option.label}</div>
                    ${option.options.map((groupOption, groupIndex) => {
                      const isSelected = this.multiple
                        ? this.value.includes(groupOption.value)
                        : this.value === groupOption.value;
                      return html`
                        <div
                          class="option ${this._focusedIndex ===
                          index + groupIndex
                            ? "focused"
                            : ""}"
                          role="option"
                          aria-selected="${isSelected}"
                          @click="${() =>
                            this._handleOptionSelect(groupOption)}"
                        >
                          ${groupOption.label}
                        </div>
                      `;
                    })}
                  `
                : html`
                    <div
                      class="option ${this._focusedIndex === index
                        ? "focused"
                        : ""}"
                      role="option"
                      aria-selected="${this.multiple
                        ? this.value.includes(option.value)
                        : this.value === option.value}"
                      @click="${() => this._handleOptionSelect(option)}"
                    >
                      ${option.label}
                    </div>
                  `
            )}
          </div>
        </div>
      </div>
      ${this.error
        ? html`<div class="error-message">${this.error}</div>`
        : this.helper
          ? html`<div class="helper-text">${this.helper}</div>`
          : ""}
    `;
  }
}

customElements.define("neo-select", NeoSelect);
