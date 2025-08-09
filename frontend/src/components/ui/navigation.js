import { 
  LitElement,
  html,
  css,
 } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";
import { baseStyles } from "../../styles/base.js";

/**
 * Navigation component with improved mobile support and accessibility
 * @element neo-navigation
 */
export class NeoNavigation extends LitElement {
  static get properties() {
    return {
      items: { type: Array },
      activeItem: { type: String },
      orientation: { type: String },
      collapsed: { type: Boolean },
      currentPath: { type: String, attribute: "current-path" },
      expandedItems: { type: Array, state: true },
      navExpanded: {
        type: Boolean,
        reflect: true,
        attribute: "nav-expanded",
        converter: {
          fromAttribute: (value) => value !== null,
          toAttribute: (value) => (value ? "" : null),
        },
      },
    };
  }

  static get styles() {
    return [
      baseStyles,
      css`
        :host {
          display: block;
        }

        .nav-container {
          display: flex;
          background: var(--color-surface, white);
          border-radius: 8px;
          overflow: hidden;
        }

        .nav-container[data-orientation="vertical"] {
          flex-direction: column;
          width: max-content;
        }

        .nav-list {
          display: flex;
          list-style: none;
          margin: 0;
          padding: 0;
          gap: 0.5rem;
        }

        .nav-container[data-orientation="vertical"] .nav-list {
          flex-direction: column;
        }

        .nav-item {
          position: relative;
        }

        .nav-item.active > a {
          background: var(--color-primary-light, rgba(33, 150, 243, 0.1));
          color: var(--color-primary, #2196f3);
        }

        .nav-link {
          display: flex;
          align-items: center;
          padding: 0.75rem 1rem;
          color: var(--color-text, #333);
          text-decoration: none;
          border-radius: 4px;
          transition: all 0.2s ease;
          gap: 0.5rem;
          white-space: nowrap;
        }

        .nav-link:hover {
          background: var(--color-hover, #f5f5f5);
          color: var(--color-primary, #2196f3);
        }

        .nav-link.active {
          background: var(--color-primary-light, rgba(33, 150, 243, 0.1));
          color: var(--color-primary, #2196f3);
        }

        .nav-icon {
          width: 1.25rem;
          height: 1.25rem;
        }

        .nav-badge {
          position: absolute;
          top: 0;
          right: 0;
          background: var(--color-error, #f44336);
          color: white;
          font-size: 0.75rem;
          padding: 0.25rem 0.5rem;
          border-radius: 999px;
          transform: translate(50%, -50%);
        }

        .nav-container.collapsed .nav-text {
          display: none;
        }

        .nav-container.collapsed .nav-link {
          padding: 0.75rem;
        }

        .nav-container.collapsed {
          width: max-content;
        }

        /* Subnav styles */
        .nav-subitems {
          list-style: none;
          margin: 0;
          padding: 0 0 0 1.5rem;
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.3s ease;
        }

        .nav-item.expanded .nav-subitems {
          max-height: 500px;
        }

        .nav-subitem {
          margin: 0.25rem 0;
        }

        .nav-subitem a {
          display: block;
          padding: 0.5rem 1rem;
          color: var(--color-text, #333);
          text-decoration: none;
          border-radius: 4px;
          transition: all 0.2s ease;
        }

        .nav-subitem a:hover {
          background: var(--color-hover, #f5f5f5);
          color: var(--color-primary, #2196f3);
        }

        .nav-subitem.active a {
          background: var(--color-primary-light, rgba(33, 150, 243, 0.1));
          color: var(--color-primary, #2196f3);
        }

        /* Mobile toggle */
        .nav-toggle {
          display: none;
          padding: 0.5rem;
          background: var(--color-surface, white);
          border: none;
          border-radius: 4px;
          cursor: pointer;
          align-items: center;
          justify-content: center;
        }

        /* Mobile styles */
        @media (max-width: 768px) {
          .nav-toggle {
            display: flex;
          }

          .nav-container[data-orientation="horizontal"] {
            width: 100%;
            overflow-x: auto;
          }

          .nav-container[data-orientation="horizontal"] .nav-list {
            flex-wrap: nowrap;
            padding: 0.5rem;
          }

          .nav-container[data-orientation="vertical"] {
            position: fixed;
            left: 0;
            top: 0;
            bottom: 0;
            z-index: 100;
            transform: translateX(-100%);
            transition: transform 0.3s ease;
          }

          .nav-container[data-orientation="vertical"].active {
            transform: translateX(0);
          }
        }
      `,
    ];
  }

  constructor() {
    super();
    this.items = [];
    this.activeItem = "";
    this.orientation = "horizontal";
    this.collapsed = false;
    this.currentPath = "";
    this.expandedItems = [];
    this.navExpanded = false;

    // Bind methods
    this._handleResize = this._handleResize.bind(this);
    this._handleKeyDown = this._handleKeyDown.bind(this);
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener("resize", this._handleResize);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener("resize", this._handleResize);
  }

  _handleResize() {
    // Handle responsive behavior
    if (window.innerWidth <= 768) {
      this.collapsed = true;
    } else {
      this.collapsed = false;
    }
  }

  _handleKeyDown(event, index) {
    const items = this.shadowRoot.querySelectorAll(".nav-item");

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        if (index < items.length - 1) {
          items[index + 1].focus();
          setTimeout(() => {
            items[index + 1].focus();
          }, 0);
        }
        break;
      case "ArrowUp":
        event.preventDefault();
        if (index > 0) {
          items[index - 1].focus();
          setTimeout(() => {
            items[index - 1].focus();
          }, 0);
        }
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        items[index].click();
        break;
    }
  }

  handleItemClick(item, event) {
    event.preventDefault();
    this.activeItem = item.id;

    // Toggle expanded state for items with children
    if (item.children) {
      if (this.expandedItems.includes(item.id)) {
        this.expandedItems = this.expandedItems.filter((id) => id !== item.id);
      } else {
        // Collapse other items
        this.expandedItems = [item.id];
      }
    }

    this.dispatchEvent(
      new CustomEvent("navigate", {
        detail: {
          item,
          path: item.path,
        },
        bubbles: true,
        composed: true,
      })
    );
  }

  handleListItemClick(event) {
    const item = this.items.find(
      (i) => i.id === event.currentTarget.dataset.id
    );
    if (item) {
      // If the item has children, toggle its expanded state
      if (item.children) {
        const wasExpanded = this.expandedItems.includes(item.id);

        // Clear all expanded items and remove expanded class from all items
        this.expandedItems = [];
        const allItems = this.shadowRoot.querySelectorAll(".nav-item");
        allItems.forEach((el) => {
          el.classList.remove("expanded");
        });

        // If the item wasn't expanded before, expand it now
        if (!wasExpanded) {
          this.expandedItems = [item.id];
          // Add expanded class directly to the clicked element
          event.currentTarget.classList.add("expanded");
        }
      }

      this.handleItemClick(item, event);
    }
  }

  updateExpandedClasses() {
    // Remove expanded class from all items
    const allItems = this.shadowRoot.querySelectorAll(".nav-item");
    allItems.forEach((item) => {
      item.classList.remove("expanded");
    });

    // Add expanded class to expanded items
    this.expandedItems.forEach((id) => {
      const item = this.shadowRoot.querySelector(`[data-id="${id}"]`);
      if (item) {
        item.classList.add("expanded");
      }
    });
  }

  updated(changedProperties) {
    super.updated(changedProperties);

    // Update expanded classes whenever expandedItems changes
    if (changedProperties.has("expandedItems")) {
      this.updateExpandedClasses();
    }
  }

  toggleMobileNav() {
    this.navExpanded = !this.navExpanded;
    if (this.navExpanded) {
      this.classList.add("nav-expanded");
    } else {
      this.classList.remove("nav-expanded");
    }
  }

  isPathActive(path) {
    return this.currentPath === path;
  }

  isItemExpanded(id) {
    return this.expandedItems.includes(id);
  }

  render() {
    return html`
      <button class="nav-toggle" @click=${this.toggleMobileNav}>
        <span>☰</span>
      </button>

      <nav
        class="nav-container ${this.collapsed ? "collapsed" : ""} ${this
          .navExpanded
          ? "active"
          : ""}"
        data-orientation=${this.orientation}
      >
        <ul class="nav-list">
          ${this.items.map(
            (item, index) => html`
              <li
                class="nav-item ${this.isPathActive(item.path)
                  ? "active"
                  : ""} ${this.isItemExpanded(item.id) ? "expanded" : ""}"
                data-id=${item.id}
                data-path=${item.path}
                tabindex="0"
                @keydown=${(e) => this._handleKeyDown(e, index)}
                @click=${this.handleListItemClick}
              >
                <a
                  href=${item.path}
                  class="nav-link ${this.isPathActive(item.path)
                    ? "active"
                    : ""}"
                  @click=${(e) => this.handleItemClick(item, e)}
                >
                  ${item.icon
                    ? html` <span class="nav-icon">${item.icon}</span> `
                    : ""}
                  <span class="nav-text">${item.label}</span>
                  ${item.badge
                    ? html` <span class="nav-badge">${item.badge}</span> `
                    : ""}
                </a>

                ${item.children
                  ? html`
                      <ul class="nav-subitems">
                        ${item.children.map(
                          (child) => html`
                            <li
                              class="nav-subitem ${this.isPathActive(child.path)
                                ? "active"
                                : ""}"
                              data-path=${child.path}
                            >
                              <a
                                href=${child.path}
                                @click=${(e) => {
                                  e.preventDefault();
                                  this.currentPath = child.path;
                                  this.dispatchEvent(
                                    new CustomEvent("navigate", {
                                      detail: {
                                        item: child,
                                        path: child.path,
                                      },
                                      bubbles: true,
                                      composed: true,
                                    })
                                  );
                                }}
                              >
                                ${child.label}
                              </a>
                            </li>
                          `
                        )}
                      </ul>
                    `
                  : ""}
              </li>
            `
          )}
        </ul>
      </nav>
    `;
  }
}

customElements.define("neo-navigation", NeoNavigation);
