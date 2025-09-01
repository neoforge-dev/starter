import { LitElement, html, css } from '/vendor/lit-core.min.js';
import { baseStyles } from '../../styles/base.js';
import { docsService } from '../../services/docs.js';
import './doc-search.js';

export class DocNav extends LitElement {
  static properties = {
    navigation: { type: Array },
    currentPath: { type: String },
    isLoading: { type: Boolean },
    expandedSections: { type: Object }
  };

  static styles = [
    baseStyles,
    css`
      :host {
        display: block;
        padding: var(--spacing-md);
        background: var(--surface-color);
        border-radius: var(--radius-lg);
        border: 1px solid var(--border-color);
      }

      .nav-container {
        margin-top: var(--spacing-md);
      }

      .nav-group {
        margin-bottom: var(--spacing-md);
      }

      .nav-group-header {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
        padding: var(--spacing-sm);
        color: var(--text-color);
        font-weight: var(--font-semibold);
        cursor: pointer;
        border-radius: var(--radius-sm);
        transition: all var(--transition-normal);
      }

      .nav-group-header:hover {
        background: var(--background-color);
      }

      .nav-group-header .material-icons {
        font-size: var(--text-base);
        transition: transform var(--transition-normal);
      }

      .nav-group-header.expanded .material-icons {
        transform: rotate(90deg);
      }

      .nav-items {
        margin-left: var(--spacing-md);
        margin-top: var(--spacing-xs);
        display: none;
      }

      .nav-items.expanded {
        display: block;
      }

      .nav-item {
        margin-bottom: var(--spacing-xs);
      }

      .nav-link {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
        padding: var(--spacing-xs) var(--spacing-sm);
        color: var(--text-secondary);
        text-decoration: none;
        font-size: var(--text-sm);
        border-radius: var(--radius-sm);
        transition: all var(--transition-normal);
      }

      .nav-link:hover {
        color: var(--text-color);
        background: var(--background-color);
      }

      .nav-link.active {
        color: var(--primary-color);
        background: var(--background-color);
        font-weight: var(--font-medium);
      }

      .nav-link .material-icons {
        font-size: var(--text-base);
        opacity: 0.7;
      }

      /* Loading state */
      .loading {
        padding: var(--spacing-md);
        text-align: center;
        color: var(--text-secondary);
      }

      @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.5; }
        100% { opacity: 1; }
      }

      .loading {
        animation: pulse 1.5s ease-in-out infinite;
      }

      /* Mobile styles */
      @media (max-width: 768px) {
        :host {
          border-radius: 0;
          border-left: none;
          border-right: none;
        }
      }
    `
  ];

  constructor() {
    super();
    this.navigation = [];
    this.currentPath = '';
    this.isLoading = true;
    this.expandedSections = {};
  }

  async connectedCallback() {
    super.connectedCallback();
    await this.loadNavigation();
  }

  async loadNavigation() {
    try {
      this.isLoading = true;
      this.navigation = await docsService.getNavigation();

      // Expand the section containing the current path
      this.expandCurrentSection();
    } catch (error) {
      console.error('Failed to load navigation:', error);
    } finally {
      this.isLoading = false;
    }
  }

  expandCurrentSection() {
    if (!this.currentPath) return;

    this.navigation.forEach(section => {
      if (this.findItemByPath(section.items, this.currentPath)) {
        this.expandedSections = {
          ...this.expandedSections,
          [section.title]: true
        };
      }
    });
  }

  findItemByPath(items, path) {
    return items.some(item =>
      item.path === path ||
      (item.items && this.findItemByPath(item.items, path))
    );
  }

  toggleSection(title) {
    this.expandedSections = {
      ...this.expandedSections,
      [title]: !this.expandedSections[title]
    };
  }

  handleSearchResult(e) {
    const { result } = e.detail;
    this.dispatchEvent(new CustomEvent('navigate', {
      detail: { path: result.path },
      bubbles: true,
      composed: true
    }));
  }

  renderNavItem(item) {
    if (item.items) {
      return html`
        <div class="nav-group">
          <div
            class="nav-group-header ${this.expandedSections[item.title] ? 'expanded' : ''}"
            @click=${() => this.toggleSection(item.title)}
          >
            <span class="material-icons">chevron_right</span>
            ${item.title}
          </div>
          <div class="nav-items ${this.expandedSections[item.title] ? 'expanded' : ''}">
            ${item.items.map(subItem => this.renderNavItem(subItem))}
          </div>
        </div>
      `;
    }

    return html`
      <div class="nav-item">
        <a
          href="/docs/${item.path}"
          class="nav-link ${this.currentPath === item.path ? 'active' : ''}"
          @click=${(e) => {
            e.preventDefault();
            this.dispatchEvent(new CustomEvent('navigate', {
              detail: { path: item.path },
              bubbles: true,
              composed: true
            }));
          }}
        >
          ${item.icon ? html`<span class="material-icons">${item.icon}</span>` : ''}
          ${item.title}
        </a>
      </div>
    `;
  }

  render() {
    if (this.isLoading) {
      return html`
        <div class="loading">
          Loading navigation...
        </div>
      `;
    }

    return html`
      <doc-search @result-selected=${this.handleSearchResult}></doc-search>

      <div class="nav-container">
        ${this.navigation.map(section => this.renderNavItem(section))}
      </div>
    `;
  }
}

customElements.define('doc-nav', DocNav);
