import { 
  LitElement,
  html,
  css,
 } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";

export class Select extends LitElement {
  static properties = {
    name: { type: String },
    value: { type: String },
    label: { type: String },
    placeholder: { type: String },
    options: { type: Array },
    disabled: { type: Boolean },
    required: { type: Boolean },
    multiple: { type: Boolean },
    searchable: { type: Boolean },
    isOpen: { type: Boolean, state: true },
    searchText: { type: String, state: true },
    selectedOptions: { type: Array, state: true },
  };

  static styles = css`
    :host {
      display: block;
      position: relative;
      width: 100%;
      font-family: system-ui, sans-serif;
    }

    .select-container {
      position: relative;
    }

    label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
      color: var(--select-label-color, #374151);
    }

    .select-trigger {
      width: 100%;
      min-height: 2.5rem;
      padding: 0.5rem 2.5rem 0.5rem 0.75rem;
      background-color: var(--select-bg, white);
      border: 1px solid var(--select-border-color, #d1d5db);
      border-radius: 0.375rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      position: relative;
    }

    .select-trigger:focus {
      outline: 2px solid var(--select-focus-color, #60a5fa);
      outline-offset: 2px;
    }

    :host([disabled]) .select-trigger {
      background-color: var(--select-disabled-bg, #f3f4f6);
      cursor: not-allowed;
      opacity: 0.6;
    }

    .select-trigger::after {
      content: "";
      position: absolute;
      right: 1rem;
      top: 50%;
      transform: translateY(-50%)
        ${(props) => (props.isOpen ? "rotate(180deg)" : "rotate(0)")};
      border-left: 5px solid transparent;
      border-right: 5px solid transparent;
      border-top: 5px solid var(--select-arrow-color, #6b7280);
      transition: transform 0.15s ease-in-out;
    }

    .dropdown {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      margin-top: 0.25rem;
      max-height: 15rem;
      overflow-y: auto;
      background-color: var(--select-dropdown-bg, white);
      border: 1px solid var(--select-border-color, #d1d5db);
      border-radius: 0.375rem;
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
      z-index: 50;
      display: ${(props) => (props.isOpen ? "block" : "none")};
    }

    .search-input {
      width: 100%;
      padding: 0.5rem;
      border: none;
      border-bottom: 1px solid var(--select-border-color, #d1d5db);
      outline: none;
    }

    .option-group {
      padding: 0.5rem 0;
    }

    .group-label {
      padding: 0.5rem 0.75rem;
      font-weight: 500;
      color: var(--select-group-label-color, #6b7280);
      font-size: 0.875rem;
    }

    .option {
      padding: 0.5rem 0.75rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .option:hover {
      background-color: var(--select-option-hover-bg, #f3f4f6);
    }

    .option[aria-selected="true"] {
      background-color: var(--select-option-selected-bg, #e5e7eb);
    }

    .selected-values {
      display: flex;
      flex-wrap: wrap;
      gap: 0.25rem;
    }

    .selected-tag {
      background-color: var(--select-tag-bg, #e5e7eb);
      padding: 0.125rem 0.5rem;
      border-radius: 0.25rem;
      display: flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.875rem;
    }

    .remove-tag {
      cursor: pointer;
      opacity: 0.6;
    }

    .remove-tag:hover {
      opacity: 1;
    }
  `;

  constructor() {
    super();
    this.disabled = false;
    this.required = false;
    this.multiple = false;
    this.searchable = false;
    this.isOpen = false;
    this.searchText = "";
    this.selectedOptions = [];
    this.options = [];
    this._clickOutsideHandler = this._handleClickOutside.bind(this);
  }

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener("click", this._clickOutsideHandler);
    this._initializeSelectedOptions();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener("click", this._clickOutsideHandler);
  }

  _initializeSelectedOptions() {
    if (this.value) {
      const values = Array.isArray(this.value) ? this.value : [this.value];
      this.selectedOptions = this._flattenOptions(this.options).filter(
        (option) => values.includes(option.value)
      );
    }
  }

  _flattenOptions(options) {
    return options.reduce((acc, option) => {
      if (option.options) {
        return [...acc, ...option.options];
      }
      return [...acc, option];
    }, []);
  }

  _handleClickOutside(event) {
    if (!this.renderRoot.contains(event.target)) {
      this.isOpen = false;
    }
  }

  _toggleDropdown() {
    if (!this.disabled) {
      this.isOpen = !this.isOpen;
    }
  }

  _handleSearch(e) {
    this.searchText = e.target.value.toLowerCase();
  }

  _handleOptionClick(option) {
    if (this.multiple) {
      const index = this.selectedOptions.findIndex(
        (o) => o.value === option.value
      );
      if (index === -1) {
        this.selectedOptions = [...this.selectedOptions, option];
      } else {
        this.selectedOptions = this.selectedOptions.filter(
          (o) => o.value !== option.value
        );
      }
      this.value = this.selectedOptions.map((o) => o.value);
    } else {
      this.selectedOptions = [option];
      this.value = option.value;
      this.isOpen = false;
    }

    this._dispatchChangeEvent();
  }

  _removeOption(option, event) {
    event.stopPropagation();
    this.selectedOptions = this.selectedOptions.filter(
      (o) => o.value !== option.value
    );
    this.value = this.selectedOptions.map((o) => o.value);
    this._dispatchChangeEvent();
  }

  _dispatchChangeEvent() {
    this.dispatchEvent(
      new CustomEvent("change", {
        detail: {
          value: this.value,
          selectedOptions: this.selectedOptions,
        },
        bubbles: true,
        composed: true,
      })
    );
  }

  _renderOptions(options) {
    return options
      .filter((option) => {
        if (!this.searchText) return true;
        return option.label.toLowerCase().includes(this.searchText);
      })
      .map((option) => {
        if (option.options) {
          return html`
            <div class="option-group">
              <div class="group-label">${option.label}</div>
              ${this._renderOptions(option.options)}
            </div>
          `;
        }
        const isSelected = this.selectedOptions.some(
          (o) => o.value === option.value
        );
        return html`
          <div
            class="option"
            @click=${() => this._handleOptionClick(option)}
            aria-selected=${isSelected}
          >
            ${option.label}
          </div>
        `;
      });
  }

  render() {
    return html`
      <div class="select-container">
        ${this.label ? html`<label>${this.label}</label>` : ""}
        <div
          class="select-trigger"
          @click=${this._toggleDropdown}
          tabindex="0"
          role="combobox"
          aria-expanded=${this.isOpen}
        >
          ${this.multiple
            ? html`
                <div class="selected-values">
                  ${this.selectedOptions.map(
                    (option) => html`
                      <span class="selected-tag">
                        ${option.label}
                        <span
                          class="remove-tag"
                          @click=${(e) => this._removeOption(option, e)}
                          >×</span
                        >
                      </span>
                    `
                  )}
                </div>
              `
            : html`
                ${this.selectedOptions.length
                  ? this.selectedOptions[0].label
                  : this.placeholder}
              `}
        </div>

        <div class="dropdown">
          ${this.searchable
            ? html`
                <input
                  type="text"
                  class="search-input"
                  placeholder="Search..."
                  @input=${this._handleSearch}
                  .value=${this.searchText}
                />
              `
            : ""}
          ${this._renderOptions(this.options)}
        </div>
      </div>
    `;
  }
}

customElements.define("ui-select", Select);
