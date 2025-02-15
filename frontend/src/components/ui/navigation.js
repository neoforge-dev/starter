import { LitElement, html, css } from "lit";
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
    };
  }

  static get styles() {
    return css`
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

      /* Mobile styles */
      @media (max-width: 768px) {
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
    `;
  }

  constructor() {
    super();
    this.items = [];
    this.activeItem = "";
    this.orientation = "horizontal";
    this.collapsed = false;
  }

  handleItemClick(item, event) {
    event.preventDefault();
    this.activeItem = item.id;
    this.dispatchEvent(
      new CustomEvent("nav-item-click", {
        detail: { item },
      })
    );
  }

  render() {
    return html`
      <nav
        class="nav-container ${this.collapsed ? "collapsed" : ""}"
        data-orientation=${this.orientation}
      >
        <ul class="nav-list">
          ${this.items.map(
            (item) => html`
              <li class="nav-item">
                <a
                  href=${item.href}
                  class="nav-link ${this.activeItem === item.id
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
              </li>
            `
          )}
        </ul>
      </nav>
    `;
  }
}

customElements.define("neo-navigation", NeoNavigation);
