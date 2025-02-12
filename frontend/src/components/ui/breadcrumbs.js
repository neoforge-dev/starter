import { LitElement, html, css } from "/vendor/lit-core.min.js";
import { baseStyles } from "../../styles/base.js";
import { router } from "../../router.js";

export class BreadcrumbsComponent extends LitElement {
  static properties = {
    items: { type: Array },
  };

  static styles = [
    baseStyles,
    css`
      :host {
        display: block;
      }

      .breadcrumbs {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        padding: var(--space-2) 0;
        font-size: var(--text-sm);
      }

      .breadcrumb-item {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        color: var(--text-2);
      }

      .breadcrumb-link {
        color: var(--text-2);
        text-decoration: none;
        transition: color 0.2s ease;
      }

      .breadcrumb-link:hover {
        color: var(--brand);
      }

      .breadcrumb-separator {
        color: var(--text-3);
      }

      .breadcrumb-item:last-child .breadcrumb-link {
        color: var(--text-1);
        font-weight: var(--weight-medium);
        pointer-events: none;
      }

      .breadcrumb-item:last-child .breadcrumb-separator {
        display: none;
      }

      /* Responsive */
      @media (max-width: 640px) {
        .breadcrumbs {
          overflow-x: auto;
          white-space: nowrap;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .breadcrumbs::-webkit-scrollbar {
          display: none;
        }
      }
    `,
  ];

  constructor() {
    super();
    this.items = [];
  }

  _handleClick(event, path) {
    event.preventDefault();
    router.navigate(path);
  }

  render() {
    return html`
      <nav class="breadcrumbs" aria-label="Breadcrumb">
        ${this.items.map(
          (item, index) => html`
            <div class="breadcrumb-item">
              <a
                href=${item.path}
                class="breadcrumb-link"
                @click=${(e) => this._handleClick(e, item.path)}
                aria-current=${index === this.items.length - 1 ? "page" : null}
              >
                ${item.icon
                  ? html` <span class="material-icons">${item.icon}</span> `
                  : ""}
                ${item.label}
              </a>
              <span class="breadcrumb-separator material-icons"
                >chevron_right</span
              >
            </div>
          `
        )}
      </nav>
    `;
  }
}

customElements.define("neo-breadcrumbs", BreadcrumbsComponent);
