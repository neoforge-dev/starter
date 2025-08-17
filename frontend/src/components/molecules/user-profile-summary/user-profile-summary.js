import { html, css } from "lit";
import { BaseComponent } from "../../base-component.js";
import { baseStyles } from "../../styles/base.js";
import "../../atoms/avatar/avatar.js";
import "../../atoms/heading/heading.js";
import "../../atoms/badge/badge.js";

/**
 * User profile display with avatar, name, status, and metadata
 * @element neo-user-profile-summary
 * 
 * @prop {Object|string} user - User object or JSON string with user data
 * @prop {string} layout - Layout style (compact, expanded, horizontal)
 * @prop {boolean} clickable - Whether the profile is clickable
 * @prop {boolean} showStatus - Whether to show status indicator
 * @prop {boolean} showRole - Whether to show user role
 * @prop {boolean} showEmail - Whether to show email address
 * @prop {boolean} showLastSeen - Whether to show last seen time
 * @prop {string} size - Avatar size (sm, md, lg, xl)
 * @prop {string} href - Link URL when clickable
 * @prop {boolean} showBorder - Whether to show border around component
 * 
 * @fires neo-profile-click - When profile is clicked
 * @fires neo-avatar-click - When avatar is clicked
 */
export class NeoUserProfileSummary extends BaseComponent {
  static get properties() {
    return {
      user: { type: Object },
      layout: { type: String },
      clickable: { type: Boolean },
      showStatus: { type: Boolean, attribute: 'show-status' },
      showRole: { type: Boolean, attribute: 'show-role' },
      showEmail: { type: Boolean, attribute: 'show-email' },
      showLastSeen: { type: Boolean, attribute: 'show-last-seen' },
      size: { type: String },
      href: { type: String },
      showBorder: { type: Boolean, attribute: 'show-border' },
      _userData: { type: Object, state: true },
    };
  }

  static get styles() {
    return [
      baseStyles,
      css`
        :host {
          display: block;
        }

        .profile-container {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          padding: var(--spacing-sm);
          border-radius: var(--radius-md);
          transition: all var(--transition-fast);
          text-decoration: none;
          color: inherit;
        }

        .profile-container.clickable {
          cursor: pointer;
        }

        .profile-container.clickable:hover {
          background: var(--color-gray-50);
          transform: translateY(-1px);
        }

        .profile-container.clickable:focus {
          outline: 2px solid var(--color-primary);
          outline-offset: 2px;
        }

        .profile-container.with-border {
          border: 1px solid var(--color-border);
          background: var(--color-surface);
        }

        /* Layout variations */
        .layout-compact .profile-info {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .layout-expanded {
          flex-direction: column;
          align-items: flex-start;
          text-align: center;
          padding: var(--spacing-md);
        }

        .layout-expanded .profile-info {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
          margin-top: var(--spacing-sm);
        }

        .layout-horizontal {
          flex-direction: row;
          align-items: center;
        }

        .layout-horizontal .profile-info {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        /* Profile info content */
        .profile-info {
          flex: 1;
          min-width: 0;
        }

        .name-section {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
          margin-bottom: var(--spacing-xs);
        }

        .user-name {
          font-weight: var(--font-weight-medium);
          color: var(--color-text);
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .user-role {
          flex-shrink: 0;
        }

        .user-email {
          font-size: var(--font-size-sm);
          color: var(--color-text-light);
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .user-status {
          font-size: var(--font-size-sm);
          color: var(--color-text-light);
          margin: 0;
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
        }

        .status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .status-dot.online {
          background: var(--color-success);
        }

        .status-dot.away {
          background: var(--color-warning);
        }

        .status-dot.busy {
          background: var(--color-error);
        }

        .status-dot.offline {
          background: var(--color-gray-400);
        }

        .last-seen {
          font-size: var(--font-size-sm);
          color: var(--color-text-light);
          margin-top: var(--spacing-xs);
        }

        /* Avatar positioning for different layouts */
        .layout-expanded .avatar-container {
          align-self: center;
        }

        .avatar-container {
          position: relative;
          flex-shrink: 0;
        }

        .avatar-container.clickable {
          cursor: pointer;
        }

        /* Size variations */
        :host([size="sm"]) .profile-container {
          padding: var(--spacing-xs);
          gap: var(--spacing-xs);
        }

        :host([size="lg"]) .profile-container {
          padding: var(--spacing-md);
          gap: var(--spacing-md);
        }

        :host([size="xl"]) .profile-container {
          padding: var(--spacing-lg);
          gap: var(--spacing-lg);
        }

        /* Responsive design */
        @media (max-width: 640px) {
          .layout-horizontal {
            flex-direction: column;
            align-items: flex-start;
          }

          .layout-horizontal .profile-info {
            align-items: center;
            text-align: center;
            margin-top: var(--spacing-sm);
          }
        }
      `,
    ];
  }

  constructor() {
    super();
    this.user = {};
    this.layout = 'horizontal';
    this.clickable = false;
    this.showStatus = true;
    this.showRole = true;
    this.showEmail = false;
    this.showLastSeen = false;
    this.size = 'md';
    this.href = '';
    this.showBorder = false;
    this._userData = {};
  }

  updated(changedProperties) {
    super.updated(changedProperties);

    if (changedProperties.has('user')) {
      this._parseUserData();
    }

    // Update host attributes for styling
    if (changedProperties.has('layout')) {
      this.setAttribute('layout', this.layout);
    }

    if (changedProperties.has('size')) {
      this.setAttribute('size', this.size);
    }
  }

  /**
   * Parse user data from prop (handles both object and JSON string)
   */
  _parseUserData() {
    try {
      if (typeof this.user === 'string') {
        this._userData = JSON.parse(this.user);
      } else if (typeof this.user === 'object' && this.user !== null) {
        this._userData = { ...this.user };
      } else {
        this._userData = {};
      }
    } catch (error) {
      console.warn('Invalid user data provided to neo-user-profile-summary:', error);
      this._userData = {};
    }
  }

  /**
   * Handle profile click
   */
  _handleProfileClick(e) {
    if (!this.clickable) return;

    e.preventDefault();
    
    this.dispatchEvent(new CustomEvent('neo-profile-click', {
      detail: { 
        user: this._userData,
        href: this.href 
      },
      bubbles: true,
      composed: true
    }));

    // Navigate if href is provided
    if (this.href) {
      if (e.ctrlKey || e.metaKey) {
        window.open(this.href, '_blank');
      } else {
        window.location.href = this.href;
      }
    }
  }

  /**
   * Handle avatar click (separate from profile click)
   */
  _handleAvatarClick(e) {
    e.stopPropagation();
    
    this.dispatchEvent(new CustomEvent('neo-avatar-click', {
      detail: { user: this._userData },
      bubbles: true,
      composed: true
    }));
  }

  /**
   * Format last seen time
   */
  _formatLastSeen(lastSeen) {
    if (!lastSeen) return '';

    const date = new Date(lastSeen);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return date.toLocaleDateString();
  }

  /**
   * Get role variant for badge
   */
  _getRoleVariant(role) {
    const roleVariants = {
      admin: 'error',
      moderator: 'warning',
      premium: 'primary',
      member: 'secondary',
      guest: 'neutral'
    };
    
    return roleVariants[role?.toLowerCase()] || 'neutral';
  }

  render() {
    const {
      name = 'Unknown User',
      email = '',
      avatar = '',
      role = '',
      status = 'offline',
      lastSeen = null
    } = this._userData;

    const containerClasses = [
      'profile-container',
      `layout-${this.layout}`,
      this.clickable ? 'clickable' : '',
      this.showBorder ? 'with-border' : ''
    ].filter(Boolean).join(' ');

    const profileContent = html`
      <div class="avatar-container ${this.clickable ? 'clickable' : ''}"
           @click="${this._handleAvatarClick}">
        <neo-avatar
          src="${avatar}"
          name="${name}"
          size="${this.size}"
          status="${this.showStatus ? status : ''}"
          ?show-status="${this.showStatus}">
        </neo-avatar>
      </div>

      <div class="profile-info">
        <div class="name-section">
          <neo-heading 
            level="3" 
            visual-level="4" 
            class="user-name"
            truncate>
            ${name}
          </neo-heading>
          
          ${this.showRole && role ? html`
            <neo-badge 
              class="user-role"
              variant="${this._getRoleVariant(role)}"
              size="sm">
              ${role}
            </neo-badge>
          ` : ''}
        </div>

        ${this.showEmail && email ? html`
          <p class="user-email" title="${email}">${email}</p>
        ` : ''}

        ${this.showStatus && status !== 'offline' ? html`
          <p class="user-status">
            <span class="status-dot ${status}"></span>
            ${status.charAt(0).toUpperCase() + status.slice(1)}
          </p>
        ` : ''}

        ${this.showLastSeen && lastSeen ? html`
          <p class="last-seen">
            Last seen ${this._formatLastSeen(lastSeen)}
          </p>
        ` : ''}
      </div>
    `;

    return this.clickable && this.href ? html`
      <a href="${this.href}" 
         class="${containerClasses}"
         @click="${this._handleProfileClick}"
         role="button"
         tabindex="0">
        ${profileContent}
      </a>
    ` : html`
      <div class="${containerClasses}"
           @click="${this._handleProfileClick}"
           role="${this.clickable ? 'button' : ''}"
           tabindex="${this.clickable ? '0' : '-1'}">
        ${profileContent}
      </div>
    `;
  }
}

// Register the component
if (!customElements.get("neo-user-profile-summary")) {
  customElements.define("neo-user-profile-summary", NeoUserProfileSummary);
}