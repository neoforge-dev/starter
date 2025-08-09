import { 
  LitElement,
  html,
  css,
 } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";

export class Sidebar extends LitElement {
  static properties = {
    variant: { type: String },
    collapsible: { type: Boolean },
    collapsed: { type: Boolean },
    items: { type: Array },
  };

  static styles = css`
    :host {
      display: block;
      height: 100%;
      background: var(--sidebar-bg, white);
      border-right: 1px solid var(--sidebar-border-color, #e5e7eb);
    }

    .sidebar {
      height: 100%;
      display: flex;
      flex-direction: column;
      transition: width 0.3s ease;
    }

    /* Variants */
    .sidebar-default {
      width: var(--sidebar-width, 250px);
    }

    .sidebar-compact {
      width: var(--sidebar-compact-width, 64px);
    }

    .sidebar-expanded {
      width: var(--sidebar-expanded-width, 300px);
    }

    .sidebar-collapsed {
      width: var(--sidebar-collapsed-width, 64px);
    }

    /* Toggle Button */
    .toggle-button {
      padding: 0.5rem;
      margin: 0.5rem;
      border: none;
      background: transparent;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--sidebar-toggle-color, #6b7280);
    }

    .toggle-button:hover {
      color: var(--sidebar-toggle-hover-color, #374151);
    }

    /* Navigation Items */
    .nav-items {
      flex: 1;
      overflow-y: auto;
      padding: 0.5rem;
    }

    .nav-item {
      display: flex;
      align-items: center;
      padding: 0.5rem;
      margin: 0.25rem 0;
      border-radius: 0.375rem;
      color: var(--sidebar-item-color, #374151);
      text-decoration: none;
      cursor: pointer;
      transition: background-color 0.2s ease;
    }

    .nav-item:hover {
      background-color: var(--sidebar-item-hover-bg, #f3f4f6);
    }

    .nav-item.active {
      background-color: var(--sidebar-item-active-bg, #e5e7eb);
      color: var(--sidebar-item-active-color, #1f2937);
    }

    .nav-item-icon {
      width: 1.5rem;
      height: 1.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 0.75rem;
    }

    .nav-item-content {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: space-between;
      overflow: hidden;
    }

    .nav-item-label {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* Collapsed State */
    .sidebar-collapsed .nav-item-label,
    .sidebar-collapsed .nav-item-badge,
    .sidebar-compact .nav-item-label,
    .sidebar-compact .nav-item-badge {
      display: none;
    }

    /* Submenu */
    .submenu {
      margin-left: 2.25rem;
      height: 0;
      overflow: hidden;
      transition: height 0.3s ease;
    }

    .submenu.expanded {
      height: auto;
    }

    /* Badge */
    .nav-item-badge {
      padding: 0.125rem 0.5rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .badge-primary {
      background-color: var(--sidebar-badge-primary-bg, #60a5fa);
      color: var(--sidebar-badge-primary-color, white);
    }

    .badge-warning {
      background-color: var(--sidebar-badge-warning-bg, #fbbf24);
      color: var(--sidebar-badge-warning-color, #1f2937);
    }

    .badge-success {
      background-color: var(--sidebar-badge-success-bg, #34d399);
      color: var(--sidebar-badge-success-color, white);
    }

    /* Divider */
    .nav-divider {
      height: 1px;
      background-color: var(--sidebar-divider-color, #e5e7eb);
      margin: 0.5rem 0;
    }

    /* Header */
    .nav-header {
      padding: 0.75rem 0.5rem;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--sidebar-header-color, #6b7280);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    /* Tooltip */
    .tooltip {
      position: relative;
    }

    .tooltip:hover::after {
      content: attr(data-tooltip);
      position: absolute;
      left: 100%;
      top: 50%;
      transform: translateY(-50%);
      margin-left: 0.5rem;
      padding: 0.25rem 0.5rem;
      background-color: var(--sidebar-tooltip-bg, #1f2937);
      color: var(--sidebar-tooltip-color, white);
      border-radius: 0.25rem;
      font-size: 0.75rem;
      white-space: nowrap;
      z-index: 10;
    }
  `;

  constructor() {
    super();
    this.variant = "default";
    this.collapsible = true;
    this.collapsed = false;
    this.items = [];
    this._expandedItems = new Set();
  }

  _handleItemClick(item, event) {
    if (item.items) {
      event.preventDefault();
      this._toggleSubmenu(item);
    } else if (item.href) {
      this.dispatchEvent(
        new CustomEvent("navigate", {
          detail: {
            href: item.href,
            item,
          },
          bubbles: true,
          composed: true,
        })
      );
    }
  }

  _toggleSubmenu(item) {
    if (this._expandedItems.has(item)) {
      this._expandedItems.delete(item);
    } else {
      this._expandedItems.add(item);
    }
    this.requestUpdate();
  }

  _toggleCollapse() {
    this.collapsed = !this.collapsed;
  }

  _renderBadge(badge) {
    if (!badge) return "";
    return html`
      <span class="nav-item-badge badge-${badge.variant || "primary"}">
        ${badge.label}
      </span>
    `;
  }

  _renderNavItem(item) {
    if (item.type === "divider") {
      return html`<div class="nav-divider"></div>`;
    }

    if (item.type === "header") {
      return html`<div class="nav-header">${item.label}</div>`;
    }

    const isExpanded = this._expandedItems.has(item);
    const hasSubmenu = item.items && item.items.length > 0;

    return html`
      <div
        class="tooltip"
        data-tooltip=${this.collapsed || this.variant === "compact"
          ? item.label
          : ""}
      >
        <a
          class="nav-item ${item.active ? "active" : ""}"
          href=${item.href || "#"}
          @click=${(e) => this._handleItemClick(item, e)}
        >
          ${item.icon
            ? html` <span class="nav-item-icon">${item.icon}</span> `
            : ""}
          <span class="nav-item-content">
            <span class="nav-item-label">${item.label}</span>
            ${this._renderBadge(item.badge)}
          </span>
        </a>
        ${hasSubmenu
          ? html`
              <div class="submenu ${isExpanded ? "expanded" : ""}">
                ${item.items.map((subitem) => this._renderNavItem(subitem))}
              </div>
            `
          : ""}
      </div>
    `;
  }

  render() {
    const sidebarClass = `sidebar sidebar-${this.variant} ${this.collapsed ? "sidebar-collapsed" : ""}`;

    return html`
      <nav class=${sidebarClass}>
        ${this.collapsible
          ? html`
              <button class="toggle-button" @click=${this._toggleCollapse}>
                ${this.collapsed ? "→" : "←"}
              </button>
            `
          : ""}
        <div class="nav-items">
          ${this.items.map((item) => this._renderNavItem(item))}
        </div>
      </nav>
    `;
  }
}

customElements.define("ui-sidebar", Sidebar);
