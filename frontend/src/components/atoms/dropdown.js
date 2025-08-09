import {   LitElement, html, css   } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";
import { baseStyles } from "../../styles/base.js";

export class DropdownComponent extends LitElement {
  static properties = {
    label: { type: String },
    items: { type: Array },
    value: { type: String },
    open: { type: Boolean, state: true },
  };

  static styles = [
    baseStyles,
    css`
      :host {
        display: inline-block;
        position: relative;
      }

      .dropdown-trigger {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        padding: var(--space-2) var(--space-4);
        background: var(--surface-1);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-2);
        cursor: pointer;
        font-size: var(--text-sm);
        color: var(--text-1);
        transition: all 0.2s ease;
      }

      .dropdown-trigger:hover {
        background: var(--surface-2);
      }

      .dropdown-menu {
        position: absolute;
        top: 100%;
        left: 0;
        z-index: 10;
        min-width: 200px;
        margin-top: var(--space-1);
        padding: var(--space-1);
        background: var(--surface-1);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-2);
        box-shadow: var(--shadow-2);
        opacity: 0;
        visibility: hidden;
        transform: translateY(-10px);
        transition: all 0.2s ease;
      }

      .dropdown-menu.open {
        opacity: 1;
        visibility: visible;
        transform: translateY(0);
      }

      .dropdown-item {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        padding: var(--space-2) var(--space-3);
        color: var(--text-1);
        font-size: var(--text-sm);
        text-decoration: none;
        border-radius: var(--radius-1);
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .dropdown-item:hover {
        background: var(--surface-2);
      }

      .dropdown-item.selected {
        background: var(--brand);
        color: white;
      }

      .dropdown-item.selected:hover {
        background: var(--brand-hover);
      }
    `,
  ];

  constructor() {
    super();
    this.items = [];
    this.open = false;
    this._handleClickOutside = this._handleClickOutside.bind(this);
  }

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener("click", this._handleClickOutside);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener("click", this._handleClickOutside);
  }

  _handleClickOutside(event) {
    if (!this.shadowRoot.contains(event.target)) {
      this.open = false;
    }
  }

  _toggleDropdown(event) {
    event.stopPropagation();
    this.open = !this.open;
  }

  _handleSelect(item) {
    this.value = item.value;
    this.open = false;
    this.dispatchEvent(
      new CustomEvent("change", {
        detail: { value: item.value },
        bubbles: true,
        composed: true,
      })
    );
  }

  render() {
    return html`
      <div class="dropdown">
        <button
          class="dropdown-trigger"
          @click=${this._toggleDropdown}
          aria-haspopup="true"
          aria-expanded=${this.open}
        >
          <span>${this.label}</span>
          <span class="material-icons">
            ${this.open ? "arrow_drop_up" : "arrow_drop_down"}
          </span>
        </button>

        <div class="dropdown-menu ${this.open ? "open" : ""}">
          ${this.items.map(
            (item) => html`
              <div
                class="dropdown-item ${item.value === this.value
                  ? "selected"
                  : ""}"
                @click=${() => this._handleSelect(item)}
                role="option"
                aria-selected=${item.value === this.value}
              >
                ${item.icon
                  ? html` <span class="material-icons">${item.icon}</span> `
                  : ""}
                ${item.label}
              </div>
            `
          )}
        </div>
      </div>
    `;
  }
}

customElements.define("neo-dropdown", DropdownComponent);
