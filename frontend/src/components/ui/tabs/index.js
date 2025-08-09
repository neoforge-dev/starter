import {   LitElement, html, css   } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";

export class Tabs extends LitElement {
  static get properties() {
    return {
      tabs: { type: Array },
      activeTab: { type: String },
      orientation: { type: String },
      disabled: { type: Boolean },
    };
  }

  static get styles() {
    return css`
      :host {
        display: block;
      }

      .tabs-container {
        display: flex;
        flex-direction: column;
      }

      .tabs-container[data-orientation="horizontal"] .tabs-list {
        flex-direction: row;
        border-bottom: 1px solid var(--color-border, #e0e0e0);
      }

      .tabs-container[data-orientation="vertical"] {
        flex-direction: row;
      }

      .tabs-container[data-orientation="vertical"] .tabs-list {
        flex-direction: column;
        border-right: 1px solid var(--color-border, #e0e0e0);
      }

      .tabs-list {
        display: flex;
        margin: 0;
        padding: 0;
        list-style: none;
      }

      .tab {
        display: inline-flex;
        align-items: center;
        padding: 0.75rem 1rem;
        color: var(--color-text-secondary, #666);
        background: none;
        border: none;
        border-bottom: 2px solid transparent;
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        white-space: nowrap;
      }

      .tab:hover:not([disabled]) {
        color: var(--color-primary, #2196f3);
        background: var(--color-hover, #f5f5f5);
      }

      .tab[disabled] {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .tab[aria-selected="true"] {
        color: var(--color-primary, #2196f3);
        border-color: var(--color-primary, #2196f3);
      }

      .tab-icon {
        width: 1rem;
        height: 1rem;
        margin-right: 0.5rem;
      }

      .tab-content {
        flex: 1;
        padding: 1rem;
      }

      /* Vertical orientation specific styles */
      .tabs-container[data-orientation="vertical"] .tab {
        border-bottom: none;
        border-right: 2px solid transparent;
      }

      .tabs-container[data-orientation="vertical"] .tab[aria-selected="true"] {
        border-right-color: var(--color-primary, #2196f3);
      }

      /* Mobile styles */
      @media (max-width: 768px) {
        .tabs-container[data-orientation="vertical"] {
          flex-direction: column;
        }

        .tabs-container[data-orientation="vertical"] .tabs-list {
          flex-direction: row;
          overflow-x: auto;
          border-right: none;
          border-bottom: 1px solid var(--color-border, #e0e0e0);
        }

        .tabs-container[data-orientation="vertical"] .tab {
          border-right: none;
          border-bottom: 2px solid transparent;
        }

        .tabs-container[data-orientation="vertical"]
          .tab[aria-selected="true"] {
          border-right-color: transparent;
          border-bottom-color: var(--color-primary, #2196f3);
        }

        .tabs-list {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
        }

        .tabs-list::-webkit-scrollbar {
          display: none;
        }
      }
    `;
  }

  constructor() {
    super();
    this.tabs = [];
    this.activeTab = "";
    this.orientation = "horizontal";
    this.disabled = false;
  }

  connectedCallback() {
    super.connectedCallback();
    if (!this.activeTab && this.tabs.length) {
      this.activeTab = this.tabs[0].id;
    }
  }

  handleTabClick(tabId) {
    if (this.disabled || this.activeTab === tabId) return;

    this.activeTab = tabId;
    this.dispatchEvent(
      new CustomEvent("tab-change", {
        detail: { tabId },
      })
    );
  }

  render() {
    return html`
      <div class="tabs-container" data-orientation=${this.orientation}>
        <div
          class="tabs-list"
          role="tablist"
          aria-orientation=${this.orientation}
        >
          ${this.tabs.map(
            (tab) => html`
              <button
                class="tab"
                role="tab"
                aria-selected=${this.activeTab === tab.id}
                aria-controls="panel-${tab.id}"
                id="tab-${tab.id}"
                ?disabled=${this.disabled || tab.disabled}
                @click=${() => this.handleTabClick(tab.id)}
              >
                ${tab.icon
                  ? html` <span class="tab-icon">${tab.icon}</span> `
                  : ""}
                ${tab.label}
              </button>
            `
          )}
        </div>

        <div class="tab-content">
          ${this.tabs.map(
            (tab) => html`
              <div
                role="tabpanel"
                id="panel-${tab.id}"
                aria-labelledby="tab-${tab.id}"
                ?hidden=${this.activeTab !== tab.id}
              >
                ${this.activeTab === tab.id
                  ? html` <slot name=${tab.id}></slot> `
                  : ""}
              </div>
            `
          )}
        </div>
      </div>
    `;
  }
}

customElements.define("neo-tabs", Tabs);
