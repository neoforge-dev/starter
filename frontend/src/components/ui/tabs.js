import {
  LitElement,
  html,
  css,
} from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";

export class UiTabs extends LitElement {
  static properties = {
    tabs: { type: Array },
    selected: { type: String },
    orientation: { type: String },
    animated: { type: Boolean },
  };

  static styles = css`
    :host {
      display: block;
    }

    .tabs {
      display: flex;
      border-bottom: 1px solid #ddd;
      margin-bottom: 1rem;
      gap: 0.5rem;
    }

    .tabs[aria-orientation="vertical"] {
      flex-direction: column;
      border-bottom: none;
      border-right: 1px solid #ddd;
      margin-bottom: 0;
      margin-right: 1rem;
      width: 200px;
    }

    .tab {
      padding: 0.75rem 1.5rem;
      cursor: pointer;
      border: none;
      background: none;
      position: relative;
      color: #666;
      font-size: 1rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .tab:hover:not([disabled]) {
      color: #333;
    }

    .tab[aria-selected="true"] {
      color: #007bff;
    }

    .tab[aria-selected="true"]::after {
      content: "";
      position: absolute;
      bottom: -1px;
      left: 0;
      right: 0;
      height: 2px;
      background: #007bff;
    }

    .tabs[aria-orientation="vertical"] .tab[aria-selected="true"]::after {
      bottom: 0;
      right: -1px;
      left: auto;
      top: 0;
      height: auto;
      width: 2px;
    }

    .tab[disabled] {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .tab-content {
      display: none;
    }

    .tab-content[aria-hidden="false"] {
      display: block;
    }

    .tab-panels {
      flex: 1;
    }

    .container {
      display: flex;
    }

    .container[data-orientation="vertical"] {
      flex-direction: row;
    }

    .icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .badge {
      background-color: #007bff;
      color: white;
      border-radius: 9999px;
      padding: 0.1rem 0.4rem;
      font-size: 0.75rem;
    }

    @media (max-width: 768px) {
      .tabs:not([aria-orientation="vertical"]) {
        flex-wrap: wrap;
      }

      .tab {
        padding: 0.5rem 1rem;
        flex: 1;
        text-align: center;
        min-width: 120px;
      }

      .container[data-orientation="vertical"] {
        flex-direction: column;
      }

      .tabs[aria-orientation="vertical"] {
        flex-direction: row;
        border-right: none;
        border-bottom: 1px solid #ddd;
        width: 100%;
        margin-right: 0;
        margin-bottom: 1rem;
        overflow-x: auto;
      }
    }
  `;

  constructor() {
    super();
    this.tabs = [
      { id: "tab1", label: "Tab 1", content: "Content for Tab 1" },
      { id: "tab2", label: "Tab 2", content: "Content for Tab 2" },
      { id: "tab3", label: "Tab 3", content: "Content for Tab 3" },
    ];
    this.selected = "tab1";
    this.orientation = "horizontal";
    this.animated = false;
    this._handleKeyDown = this._handleKeyDown.bind(this);
  }

  connectedCallback() {
    super.connectedCallback();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    const tabList = this.shadowRoot?.querySelector('[role="tablist"]');
    if (tabList) {
      tabList.removeEventListener("keydown", this._handleKeyDown);
    }
  }

  firstUpdated() {
    const tabList = this.shadowRoot.querySelector('[role="tablist"]');
    if (tabList) {
      tabList.addEventListener("keydown", this._handleKeyDown);
    }
  }

  updated(changedProperties) {
    if (changedProperties.has("selected") && this.selected) {
      // Focus the selected tab when it changes
      const selectedTab = this.shadowRoot.querySelector(
        `[data-tab-id="${this.selected}"]`
      );
      if (selectedTab) {
        selectedTab.focus();
      }

      // Update the display of tab panels
      this._updateTabPanels();
    }
  }

  _updateTabPanels() {
    const panels = this.shadowRoot.querySelectorAll('[role="tabpanel"]');
    panels.forEach((panel) => {
      const panelId = panel.id;
      const tabId = panelId.replace("panel-", "");
      const isSelected = tabId === this.selected;

      panel.setAttribute("aria-hidden", isSelected ? "false" : "true");
      panel.style.display = isSelected ? "block" : "none";
    });
  }

  _handleKeyDown(event) {
    if (event.key === "ArrowRight") {
      this._navigateToNextTab();
      event.preventDefault();
    } else if (event.key === "ArrowLeft") {
      this._navigateToPreviousTab();
      event.preventDefault();
    } else if (event.key === "ArrowDown" && this.orientation === "vertical") {
      this._navigateToNextTab();
      event.preventDefault();
    } else if (event.key === "ArrowUp" && this.orientation === "vertical") {
      this._navigateToPreviousTab();
      event.preventDefault();
    }
  }

  _navigateToNextTab() {
    const currentIndex = this._getSelectedTabIndex();
    const nextIndex = (currentIndex + 1) % this.tabs.length;
    const nextTabId = this.tabs[nextIndex].id;

    this._selectTab(nextTabId);

    // Focus the next tab
    const nextTab = this.shadowRoot.querySelector(
      `[data-tab-id="${nextTabId}"]`
    );
    if (nextTab) {
      nextTab.focus();
    }
  }

  _navigateToPreviousTab() {
    const currentIndex = this._getSelectedTabIndex();
    const prevIndex = (currentIndex - 1 + this.tabs.length) % this.tabs.length;
    const prevTabId = this.tabs[prevIndex].id;

    this._selectTab(prevTabId);

    // Focus the previous tab
    const prevTab = this.shadowRoot.querySelector(
      `[data-tab-id="${prevTabId}"]`
    );
    if (prevTab) {
      prevTab.focus();
    }
  }

  _selectTab(tabId) {
    if (this.selected !== tabId) {
      const oldSelected = this.selected;
      this.selected = tabId;

      this.dispatchEvent(
        new CustomEvent("tab-change", {
          detail: {
            selected: tabId,
            previousSelected: oldSelected,
          },
          bubbles: true,
          composed: true,
        })
      );
    }
  }

  _handleTabClick(tab) {
    if (!tab.disabled) {
      this._selectTab(tab.id);
    }
  }

  _getSelectedTabIndex() {
    if (!this.selected || this.tabs.length === 0) return 0;
    const index = this.tabs.findIndex((tab) => tab.id === this.selected);
    return index >= 0 ? index : 0;
  }

  _getSelectedTabContent() {
    const index = this._getSelectedTabIndex();
    return index >= 0 && index < this.tabs.length
      ? this.tabs[index].content
      : "";
  }

  render() {
    const selectedIndex = this._getSelectedTabIndex();
    const hasTabs = this.tabs && this.tabs.length > 0;

    return html`
      <div class="container" data-orientation="${this.orientation}">
        <div
          class="tabs"
          role="tablist"
          aria-orientation="${this.orientation}"
          @keydown="${this._handleKeyDown}"
        >
          ${hasTabs
            ? this.tabs.map(
                (tab, index) => html`
                  <button
                    class="tab"
                    role="tab"
                    id="tab-${tab.id}"
                    data-tab-id="${tab.id}"
                    aria-selected="${tab.id === this.selected}"
                    aria-controls="panel-${tab.id}"
                    aria-disabled="${tab.disabled ? "true" : "false"}"
                    tabindex="${tab.id === this.selected ? "0" : "-1"}"
                    ?disabled="${tab.disabled}"
                    @click="${() => this._handleTabClick(tab)}"
                  >
                    ${tab.icon
                      ? html`<span class="icon">${tab.icon}</span>`
                      : ""}
                    ${tab.label}
                    ${tab.badge
                      ? html`<span class="badge">${tab.badge}</span>`
                      : ""}
                  </button>
                `
              )
            : ""}
        </div>
        <div class="tab-panels">
          ${hasTabs
            ? this.tabs.map(
                (tab) => html`
                  <div
                    id="panel-${tab.id}"
                    role="tabpanel"
                    class="tab-content"
                    aria-hidden="${tab.id !== this.selected}"
                    aria-labelledby="tab-${tab.id}"
                    style="display: ${tab.id === this.selected
                      ? "block"
                      : "none"}"
                  >
                    ${tab.content}
                  </div>
                `
              )
            : html`
                <div role="tabpanel" class="tab-content" aria-hidden="false">
                  <!-- Empty tab panel for when there are no tabs -->
                </div>
              `}
        </div>
      </div>
    `;
  }
}

customElements.define("ui-tabs", UiTabs);
