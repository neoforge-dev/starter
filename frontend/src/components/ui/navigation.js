import { LitElement, html, css } from "lit";
import { baseStyles } from "../../styles/base.js";

/**
 * Navigation component with improved mobile support and accessibility
 * @element neo-navigation
 */
export class NeoNavigation extends LitElement {
  static properties = {
    items: { type: Array },
    currentPath: { type: String, attribute: "current-path" },
    expanded: { type: Boolean, reflect: true },
    _expandedItemId: { type: String, state: true },
    _mediaQuery: { type: Object, state: true },
  };

  static styles = [
    baseStyles,
    css`
      :host {
        display: block;
        background: var(--surface-color);
        border-right: 1px solid var(--border-color);
        height: 100%;
        transition: transform var(--transition-normal);
      }

      nav {
        padding: var(--spacing-md);
        height: 100%;
        display: flex;
        flex-direction: column;
      }

      .nav-toggle {
        display: none;
        width: 100%;
        padding: var(--spacing-sm);
        margin-bottom: var(--spacing-md);
        border: none;
        background: var(--surface-color);
        color: var(--text-color);
        cursor: pointer;
        font-size: var(--text-lg);
        border-radius: var(--radius-md);
        transition: all var(--transition-normal);
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .nav-toggle:hover {
        background: var(--hover-color);
      }

      .nav-items {
        flex: 1;
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
        padding-right: var(--spacing-sm);
        margin-right: -var(--spacing-sm);
      }

      .nav-item {
        display: flex;
        flex-direction: column;
        margin-bottom: var(--spacing-xs);
      }

      .nav-item-header {
        display: flex;
        align-items: center;
        padding: var(--spacing-sm) var(--spacing-md);
        border-radius: var(--radius-md);
        cursor: pointer;
        transition: all var(--transition-normal);
        color: var(--text-secondary);
        user-select: none;
        position: relative;
      }

      .nav-item-header:hover {
        background: var(--hover-color);
        color: var(--text-color);
      }

      .nav-item-header.active {
        background: var(--primary-color);
        color: white;
      }

      .nav-item.expanded > .nav-item-header {
        background: var(--hover-color);
        color: var(--text-color);
      }

      .nav-subitems {
        display: none;
        margin-left: var(--spacing-lg);
        margin-top: var(--spacing-xs);
      }

      .nav-item.expanded > .nav-subitems {
        display: block;
      }

      .nav-subitem {
        padding: var(--spacing-xs) var(--spacing-md);
        margin-bottom: var(--spacing-xs);
        border-radius: var(--radius-sm);
        cursor: pointer;
        transition: all var(--transition-normal);
        color: var(--text-secondary);
      }

      .nav-subitem:hover {
        background: var(--hover-color);
        color: var(--text-color);
      }

      .nav-subitem.active {
        background: var(--primary-light);
        color: var(--primary-color);
      }

      .expand-icon {
        margin-left: auto;
        transition: transform var(--transition-normal);
      }

      .nav-item.expanded .expand-icon {
        transform: rotate(90deg);
      }

      @media (max-width: 768px) {
        :host {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          transform: translateX(-100%);
          z-index: var(--z-nav);
          border-right: none;
          background: var(--background-color);
        }

        :host(.nav-expanded) {
          transform: translateX(0);
        }

        .nav-toggle {
          display: flex;
        }

        nav {
          padding: var(--spacing-md);
          height: 100vh;
          overflow-y: auto;
        }

        .nav-items {
          padding-bottom: var(--spacing-xl);
        }

        .nav-item-header {
          padding: var(--spacing-md);
        }

        .nav-subitem {
          padding: var(--spacing-md);
        }

        /* Add backdrop for mobile */
        :host(.nav-expanded)::before {
          content: "";
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
          z-index: -1;
        }
      }
    `,
  ];

  constructor() {
    super();
    this.items = [];
    this.currentPath = "";
    this.expanded = false;
    this._expandedItemId = null;
    this._setupMediaQuery();
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener("resize", this._handleResize.bind(this));
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener("resize", this._handleResize.bind(this));
    this._mediaQuery?.removeListener(this._handleMobileChange.bind(this));
  }

  _setupMediaQuery() {
    this._mediaQuery = window.matchMedia("(max-width: 768px)");
    this._mediaQuery.addListener(this._handleMobileChange.bind(this));
    this._handleMobileChange(this._mediaQuery);
  }

  _handleMobileChange(e) {
    if (!e.matches) {
      this.expanded = false;
      this._updateBodyScroll();
    }
  }

  _handleResize() {
    if (window.innerWidth > 768) {
      this.expanded = false;
      this._updateBodyScroll();
    }
  }

  _toggleMobileNav() {
    this.expanded = !this.expanded;
    this._updateBodyScroll();
  }

  _updateBodyScroll() {
    document.body.style.overflow = this.expanded ? "hidden" : "";
  }

  _handleItemClick(item, e) {
    if (item.children) {
      e.preventDefault();
      e.stopPropagation();
      this._expandedItemId = this._expandedItemId === item.id ? null : item.id;
      this.requestUpdate();
    } else {
      this.dispatchEvent(
        new CustomEvent("navigate", {
          detail: { path: item.path },
          bubbles: true,
          composed: true,
        })
      );
      this.expanded = false;
      this._updateBodyScroll();
    }
  }

  _handleKeydown(item, e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      this._handleItemClick(item, e);
    }
  }

  render() {
    return html`
      <nav role="navigation" aria-label="Main navigation">
        <button
          class="nav-toggle"
          @click=${this._toggleMobileNav}
          aria-label="Toggle navigation"
          aria-expanded=${this.expanded}
        >
          <span>Menu</span>
          <span class="material-icons">
            ${this.expanded ? "close" : "menu"}
          </span>
        </button>

        <div class="nav-items">
          ${this.items.map(
            (item) => html`
              <div
                class="nav-item ${item.id === this._expandedItemId
                  ? "expanded"
                  : ""}"
                data-id=${item.id}
                data-path=${item.path}
              >
                <div
                  class="nav-item-header ${item.path === this.currentPath
                    ? "active"
                    : ""}"
                  tabindex="0"
                  @click=${(e) => this._handleItemClick(item, e)}
                  @keydown=${(e) => this._handleKeydown(item, e)}
                  role=${item.children ? "button" : "link"}
                  aria-expanded=${item.children
                    ? item.id === this._expandedItemId
                    : undefined}
                  aria-current=${item.path === this.currentPath
                    ? "page"
                    : undefined}
                >
                  ${item.label}
                  ${item.children
                    ? html`
                        <span class="material-icons expand-icon">
                          chevron_right
                        </span>
                      `
                    : ""}
                </div>

                ${item.children
                  ? html`
                      <div
                        class="nav-subitems"
                        role="menu"
                        aria-label="${item.label} submenu"
                      >
                        ${item.children.map(
                          (subItem) => html`
                            <div
                              class="nav-subitem ${subItem.path ===
                              this.currentPath
                                ? "active"
                                : ""}"
                              tabindex="0"
                              @click=${(e) => this._handleItemClick(subItem, e)}
                              @keydown=${(e) => this._handleKeydown(subItem, e)}
                              role="menuitem"
                              aria-current=${subItem.path === this.currentPath
                                ? "page"
                                : undefined}
                            >
                              ${subItem.label}
                            </div>
                          `
                        )}
                      </div>
                    `
                  : ""}
              </div>
            `
          )}
        </div>
      </nav>
    `;
  }
}

customElements.define("neo-navigation", NeoNavigation);
