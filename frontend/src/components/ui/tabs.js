import { LitElement, html, css } from "/vendor/lit-core.min.js";
import { baseStyles } from "../../styles/base.js";

export class TabsComponent extends LitElement {
  static properties = {
    tabs: { type: Array },
    activeTab: { type: String },
  };

  static styles = [
    baseStyles,
    css`
      :host {
        display: block;
      }

      .tabs {
        display: flex;
        gap: var(--space-1);
        border-bottom: 1px solid var(--border-color);
        margin-bottom: var(--space-4);
        overflow-x: auto;
        scrollbar-width: none;
        -ms-overflow-style: none;
      }

      .tabs::-webkit-scrollbar {
        display: none;
      }

      .tab {
        padding: var(--space-3) var(--space-4);
        color: var(--text-2);
        font-size: var(--text-sm);
        font-weight: var(--weight-medium);
        border-bottom: 2px solid transparent;
        cursor: pointer;
        transition: all 0.2s ease;
        white-space: nowrap;
      }

      .tab:hover {
        color: var(--text-1);
      }

      .tab.active {
        color: var(--brand);
        border-bottom-color: var(--brand);
      }

      .tab-content {
        padding: var(--space-2);
      }

      /* Responsive */
      @media (max-width: 640px) {
        .tabs {
          gap: var(--space-2);
        }

        .tab {
          padding: var(--space-2) var(--space-3);
        }
      }
    `,
  ];

  constructor() {
    super();
    this.tabs = [];
    this.activeTab = "";
  }

  firstUpdated() {
    if (this.tabs.length && !this.activeTab) {
      this.activeTab = this.tabs[0].id;
    }
  }

  _handleTabClick(tabId) {
    this.activeTab = tabId;
    this.dispatchEvent(
      new CustomEvent("tab-change", {
        detail: { tabId },
        bubbles: true,
        composed: true,
      })
    );
  }

  render() {
    return html`
      <div class="tabs-container">
        <div class="tabs" role="tablist">
          ${this.tabs.map(
            (tab) => html`
              <div
                class="tab ${tab.id === this.activeTab ? "active" : ""}"
                role="tab"
                aria-selected=${tab.id === this.activeTab}
                aria-controls="panel-${tab.id}"
                @click=${() => this._handleTabClick(tab.id)}
              >
                ${tab.icon
                  ? html` <span class="material-icons">${tab.icon}</span> `
                  : ""}
                ${tab.label}
              </div>
            `
          )}
        </div>

        <div class="tab-content">
          <slot name=${this.activeTab}></slot>
        </div>
      </div>
    `;
  }
}

customElements.define("neo-tabs", TabsComponent);
