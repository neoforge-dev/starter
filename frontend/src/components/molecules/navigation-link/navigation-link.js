import { html, css } from "lit";
import { BaseComponent } from "../../base-component.js";
import { baseStyles } from "../../styles/base.js";
import "../../atoms/icon/icon.js";
import "../../atoms/badge/badge.js";

/**
 * Navigation link with icon, text, badge, and active state support
 * @element neo-navigation-link
 *
 * @prop {string} href - Link URL
 * @prop {string} text - Link text
 * @prop {string} icon - Icon name (optional)
 * @prop {string} iconPosition - Icon position (left, right)
 * @prop {boolean} active - Whether link is currently active
 * @prop {boolean} disabled - Whether link is disabled
 * @prop {string} variant - Link variant (default, primary, secondary)
 * @prop {string} size - Link size (sm, md, lg)
 * @prop {string} target - Link target (_self, _blank, etc.)
 * @prop {string} rel - Link relationship
 * @prop {string|number} badge - Badge content (text or count)
 * @prop {string} badgeVariant - Badge variant
 * @prop {string} description - Accessible description
 * @prop {boolean} external - Whether link is external
 * @prop {boolean} download - Whether link triggers download
 * @prop {string} downloadName - Download filename
 * @prop {boolean} exact - Whether active matching should be exact
 *
 * @fires neo-navigation-click - When link is clicked
 * @fires neo-navigation-focus - When link receives focus
 * @fires neo-navigation-blur - When link loses focus
 */
export class NeoNavigationLink extends BaseComponent {
  static get properties() {
    return {
      href: { type: String },
      text: { type: String },
      icon: { type: String },
      iconPosition: { type: String, attribute: 'icon-position' },
      active: { type: Boolean },
      disabled: { type: Boolean },
      variant: { type: String },
      size: { type: String },
      target: { type: String },
      rel: { type: String },
      badge: { type: String },
      badgeVariant: { type: String, attribute: 'badge-variant' },
      description: { type: String },
      external: { type: Boolean },
      download: { type: Boolean },
      downloadName: { type: String, attribute: 'download-name' },
      exact: { type: Boolean },
      _isCurrentPage: { type: Boolean, state: true },
    };
  }

  static get styles() {
    return [
      baseStyles,
      css`
        :host {
          display: inline-block;
        }

        :host([disabled]) {
          pointer-events: none;
          opacity: 0.6;
        }

        .nav-link {
          display: inline-flex;
          align-items: center;
          gap: var(--spacing-xs);
          padding: var(--spacing-sm) var(--spacing-md);
          border-radius: var(--radius-md);
          text-decoration: none;
          color: var(--color-text);
          font-weight: var(--font-weight-medium);
          transition: all var(--transition-fast);
          position: relative;
          white-space: nowrap;
          border: 1px solid transparent;
        }

        .nav-link:hover {
          background: var(--color-gray-50);
          color: var(--color-primary);
          text-decoration: none;
        }

        .nav-link:focus {
          outline: 2px solid var(--color-primary);
          outline-offset: 2px;
        }

        /* Active state */
        .nav-link.active {
          background: var(--color-primary-light);
          color: var(--color-primary);
          border-color: var(--color-primary);
        }

        .nav-link.active::before {
          content: '';
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 3px;
          height: 60%;
          background: var(--color-primary);
          border-radius: 0 2px 2px 0;
        }

        /* Variants */
        .nav-link.variant-primary {
          background: var(--color-primary);
          color: var(--color-white);
        }

        .nav-link.variant-primary:hover {
          background: var(--color-primary-dark);
          color: var(--color-white);
        }

        .nav-link.variant-secondary {
          background: var(--color-gray-100);
          color: var(--color-text);
        }

        .nav-link.variant-secondary:hover {
          background: var(--color-gray-200);
        }

        /* Sizes */
        .nav-link.size-sm {
          padding: var(--spacing-xs) var(--spacing-sm);
          font-size: var(--font-size-sm);
          gap: calc(var(--spacing-xs) / 2);
        }

        .nav-link.size-lg {
          padding: var(--spacing-md) var(--spacing-lg);
          font-size: var(--font-size-lg);
          gap: var(--spacing-sm);
        }

        /* Icon positioning */
        .icon-right {
          flex-direction: row-reverse;
        }

        /* External link indicator */
        .external-indicator {
          width: 12px;
          height: 12px;
          opacity: 0.6;
          margin-left: var(--spacing-xs);
        }

        /* Badge positioning */
        .badge-container {
          position: relative;
        }

        .nav-badge {
          position: absolute;
          top: -8px;
          right: -8px;
          transform: scale(0.8);
        }

        /* Content layout */
        .link-content {
          display: flex;
          align-items: center;
          gap: inherit;
          flex: 1;
          min-width: 0;
        }

        .link-text {
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* Loading state */
        .nav-link.loading {
          pointer-events: none;
          opacity: 0.7;
        }

        .nav-link.loading .link-text {
          opacity: 0.5;
        }

        /* Download indicator */
        .download-indicator {
          width: 14px;
          height: 14px;
          opacity: 0.7;
        }

        /* Keyboard navigation */
        .nav-link:focus-visible {
          outline: 2px solid var(--color-primary);
          outline-offset: 2px;
        }

        /* High contrast mode */
        @media (prefers-contrast: high) {
          .nav-link {
            border: 1px solid var(--color-border);
          }

          .nav-link.active {
            border-width: 2px;
          }

          .nav-link.active::before {
            width: 4px;
          }
        }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .nav-link {
            transition: none;
          }
        }

        /* Touch targets */
        @media (pointer: coarse) {
          .nav-link {
            min-height: 44px;
            padding: var(--spacing-sm) var(--spacing-md);
          }
        }

        /* Responsive design */
        @media (max-width: 640px) {
          .nav-link {
            width: 100%;
            justify-content: flex-start;
          }

          .external-indicator,
          .download-indicator {
            display: none;
          }
        }
      `,
    ];
  }

  constructor() {
    super();
    this.href = '';
    this.text = '';
    this.icon = '';
    this.iconPosition = 'left';
    this.active = false;
    this.disabled = false;
    this.variant = 'default';
    this.size = 'md';
    this.target = '_self';
    this.rel = '';
    this.badge = '';
    this.badgeVariant = 'primary';
    this.description = '';
    this.external = false;
    this.download = false;
    this.downloadName = '';
    this.exact = false;
    this._isCurrentPage = false;
  }

  connectedCallback() {
    super.connectedCallback();
    this._checkCurrentPage();

    // Listen for navigation events to update active state
    window.addEventListener('popstate', this._handleNavigationChange.bind(this));
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('popstate', this._handleNavigationChange.bind(this));
  }

  updated(changedProperties) {
    super.updated(changedProperties);

    if (changedProperties.has('href') || changedProperties.has('exact')) {
      this._checkCurrentPage();
    }

    // Auto-detect external links
    if (changedProperties.has('href')) {
      this._detectExternalLink();
    }
  }

  /**
   * Check if this link represents the current page
   */
  _checkCurrentPage() {
    if (!this.href) {
      this._isCurrentPage = false;
      return;
    }

    const currentPath = window.location.pathname;
    const linkPath = new URL(this.href, window.location.origin).pathname;

    if (this.exact) {
      this._isCurrentPage = currentPath === linkPath;
    } else {
      this._isCurrentPage = currentPath.startsWith(linkPath) && linkPath !== '/';
    }
  }

  /**
   * Auto-detect if link is external
   */
  _detectExternalLink() {
    if (!this.href) return;

    try {
      const url = new URL(this.href, window.location.origin);
      if (url.origin !== window.location.origin) {
        this.external = true;
        if (!this.target) {
          this.target = '_blank';
        }
        if (!this.rel) {
          this.rel = 'noopener noreferrer';
        }
      }
    } catch (error) {
      // Relative URLs or invalid URLs
    }
  }

  /**
   * Handle navigation changes (for SPA routing)
   */
  _handleNavigationChange() {
    this._checkCurrentPage();
  }

  /**
   * Handle link click
   */
  _handleClick(e) {
    if (this.disabled) {
      e.preventDefault();
      return;
    }

    this.dispatchEvent(new CustomEvent('neo-navigation-click', {
      detail: {
        href: this.href,
        text: this.text,
        target: this.target,
        external: this.external,
        download: this.download
      },
      bubbles: true,
      composed: true
    }));

    // For SPA navigation, prevent default and let the app handle routing
    if (!this.external && !this.download && this.target === '_self') {
      // Let the event bubble up - the app can decide whether to prevent default
    }
  }

  /**
   * Handle focus
   */
  _handleFocus(e) {
    this.dispatchEvent(new CustomEvent('neo-navigation-focus', {
      detail: {
        href: this.href,
        text: this.text
      },
      bubbles: true,
      composed: true
    }));
  }

  /**
   * Handle blur
   */
  _handleBlur(e) {
    this.dispatchEvent(new CustomEvent('neo-navigation-blur', {
      detail: {
        href: this.href,
        text: this.text
      },
      bubbles: true,
      composed: true
    }));
  }

  /**
   * Public method to set active state
   */
  setActive(active) {
    this.active = active;
  }

  /**
   * Public method to update badge
   */
  updateBadge(content, variant = null) {
    this.badge = content;
    if (variant) {
      this.badgeVariant = variant;
    }
  }

  render() {
    const isActive = this.active || this._isCurrentPage;

    const linkClasses = [
      'nav-link',
      `variant-${this.variant}`,
      `size-${this.size}`,
      isActive ? 'active' : '',
      this.iconPosition === 'right' ? 'icon-right' : '',
      this.disabled ? 'disabled' : ''
    ].filter(Boolean).join(' ');

    const linkAttributes = {
      href: this.href,
      target: this.target,
      rel: this.rel,
      download: this.download ? (this.downloadName || true) : null,
      'aria-current': isActive ? 'page' : null,
      'aria-describedby': this.description ? `${this.text}-desc` : null,
      'aria-disabled': this.disabled ? 'true' : null
    };

    // Filter out null/undefined attributes
    const cleanAttributes = Object.fromEntries(
      Object.entries(linkAttributes).filter(([_, value]) => value != null)
    );

    const iconElement = this.icon ? html`
      <neo-icon name="${this.icon}" size="${this.size === 'sm' ? 'xs' : 'sm'}"></neo-icon>
    ` : '';

    const externalIndicator = this.external ? html`
      <neo-icon name="external-link" class="external-indicator"></neo-icon>
    ` : '';

    const downloadIndicator = this.download ? html`
      <neo-icon name="download" class="download-indicator"></neo-icon>
    ` : '';

    const badgeElement = this.badge ? html`
      <neo-badge
        class="nav-badge"
        variant="${this.badgeVariant}"
        size="sm">
        ${this.badge}
      </neo-badge>
    ` : '';

    const linkContent = html`
      <div class="link-content">
        ${iconElement}
        <span class="link-text">${this.text}</span>
        ${downloadIndicator}
        ${externalIndicator}
      </div>
    `;

    return html`
      <a
        class="${linkClasses}"
        ${Object.entries(cleanAttributes).map(([key, value]) =>
          html`${key}="${value}"`
        ).join(' ')}
        @click="${this._handleClick}"
        @focus="${this._handleFocus}"
        @blur="${this._handleBlur}">

        <div class="badge-container">
          ${linkContent}
          ${badgeElement}
        </div>
      </a>

      ${this.description ? html`
        <span id="${this.text}-desc" class="sr-only">
          ${this.description}
        </span>
      ` : ''}
    `;
  }
}

// Register the component
if (!customElements.get("neo-navigation-link")) {
  customElements.define("neo-navigation-link", NeoNavigationLink);
}
