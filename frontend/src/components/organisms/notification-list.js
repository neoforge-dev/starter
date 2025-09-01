import { html, css } from "lit";
import { BaseComponent } from "../base-component.js";
import { baseStyles } from "../styles/base.js";
import "../atoms/button/button.js";
import "../atoms/icon/icon.js";
import "../atoms/avatar/avatar.js";
import "../atoms/badge/badge.js";
import "../atoms/divider/divider.js";
import "../molecules/user-profile-summary/user-profile-summary.js";
import "../molecules/cta-button-row/cta-button-row.js";

/**
 * Enhanced notification list component with grouping, actions, and real-time updates
 * @element neo-notification-list
 *
 * @prop {Array} notifications - Array of notification objects
 * @prop {boolean} groupByDate - Group notifications by date
 * @prop {boolean} showActions - Show action buttons for notifications
 * @prop {boolean} showAvatars - Show user avatars in notifications
 * @prop {boolean} realTime - Enable real-time updates
 * @prop {number} maxHeight - Maximum height of the list
 * @prop {string} emptyMessage - Message when no notifications
 * @prop {boolean} markAsReadOnView - Mark notifications as read when viewed
 * @prop {Array} bulkActions - Available bulk actions
 * @prop {boolean} selectable - Allow notification selection
 * @prop {Array} selectedIds - Currently selected notification IDs
 * @prop {Object} filters - Active filters
 * @prop {boolean} showFilters - Show filter controls
 *
 * @fires neo-notification-click - When notification is clicked
 * @fires neo-notification-action - When notification action is performed
 * @fires neo-notification-select - When notification selection changes
 * @fires neo-notification-mark-read - When notification is marked as read
 * @fires neo-notification-mark-unread - When notification is marked as unread
 * @fires neo-notification-delete - When notification is deleted
 * @fires neo-bulk-action - When bulk action is performed
 */
export class NeoNotificationList extends BaseComponent {
  static get properties() {
    return {
      notifications: { type: Array },
      groupByDate: { type: Boolean, attribute: 'group-by-date' },
      showActions: { type: Boolean, attribute: 'show-actions' },
      showAvatars: { type: Boolean, attribute: 'show-avatars' },
      realTime: { type: Boolean, attribute: 'real-time' },
      maxHeight: { type: Number, attribute: 'max-height' },
      emptyMessage: { type: String, attribute: 'empty-message' },
      markAsReadOnView: { type: Boolean, attribute: 'mark-as-read-on-view' },
      bulkActions: { type: Array, attribute: 'bulk-actions' },
      selectable: { type: Boolean },
      selectedIds: { type: Array, attribute: 'selected-ids' },
      filters: { type: Object },
      showFilters: { type: Boolean, attribute: 'show-filters' },
      _groupedNotifications: { type: Object, state: true },
      _filteredNotifications: { type: Array, state: true },
      _isAllSelected: { type: Boolean, state: true },
    };
  }

  static get styles() {
    return [
      baseStyles,
      css`
        :host {
          display: block;
          background: var(--color-surface);
          border-radius: var(--radius-lg);
          border: 1px solid var(--color-border);
          overflow: hidden;
        }

        .notification-list-container {
          display: flex;
          flex-direction: column;
          height: 100%;
          max-height: var(--max-height, 500px);
        }

        /* Header */
        .notification-header {
          padding: var(--spacing-md);
          border-bottom: 1px solid var(--color-border);
          background: var(--color-gray-25);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: var(--spacing-md);
        }

        .header-title {
          font-size: var(--font-size-lg);
          font-weight: var(--font-weight-semibold);
          margin: 0;
          color: var(--color-text);
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
        }

        .unread-count {
          font-size: var(--font-size-sm);
          color: var(--color-text-light);
        }

        /* Filters */
        .notification-filters {
          padding: var(--spacing-md);
          border-bottom: 1px solid var(--color-border);
          background: var(--color-gray-25);
          display: flex;
          gap: var(--spacing-sm);
          flex-wrap: wrap;
        }

        .filter-chip {
          padding: var(--spacing-xs) var(--spacing-sm);
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-full);
          font-size: var(--font-size-sm);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .filter-chip:hover {
          background: var(--color-gray-50);
        }

        .filter-chip.active {
          background: var(--color-primary);
          color: var(--color-white);
          border-color: var(--color-primary);
        }

        /* Bulk actions */
        .bulk-actions-bar {
          padding: var(--spacing-md);
          background: var(--color-primary-light);
          border-bottom: 1px solid var(--color-border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: var(--spacing-md);
        }

        .selection-count {
          font-size: var(--font-size-sm);
          color: var(--color-primary);
          font-weight: var(--font-weight-medium);
        }

        /* Notification list */
        .notification-list {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
        }

        .notification-group {
          border-bottom: 1px solid var(--color-border);
        }

        .notification-group:last-child {
          border-bottom: none;
        }

        .group-header {
          padding: var(--spacing-md);
          background: var(--color-gray-25);
          border-bottom: 1px solid var(--color-border);
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-medium);
          color: var(--color-text-light);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        /* Notification items */
        .notification-item {
          display: flex;
          align-items: flex-start;
          padding: var(--spacing-md);
          border-bottom: 1px solid var(--color-border);
          transition: all var(--transition-fast);
          cursor: pointer;
          position: relative;
        }

        .notification-item:hover {
          background: var(--color-gray-25);
        }

        .notification-item:last-child {
          border-bottom: none;
        }

        .notification-item.unread {
          background: var(--color-primary-light);
          border-left: 4px solid var(--color-primary);
        }

        .notification-item.selected {
          background: var(--color-primary-light);
          border-color: var(--color-primary);
        }

        .notification-checkbox {
          margin-right: var(--spacing-sm);
          margin-top: var(--spacing-xs);
        }

        .notification-avatar {
          margin-right: var(--spacing-md);
          flex-shrink: 0;
        }

        .notification-content {
          flex: 1;
          min-width: 0;
        }

        .notification-header-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: var(--spacing-xs);
        }

        .notification-title {
          font-weight: var(--font-weight-medium);
          color: var(--color-text);
          margin: 0;
          font-size: var(--font-size-sm);
        }

        .notification-time {
          font-size: var(--font-size-xs);
          color: var(--color-text-light);
          flex-shrink: 0;
          margin-left: var(--spacing-sm);
        }

        .notification-message {
          font-size: var(--font-size-sm);
          color: var(--color-text-light);
          margin: 0;
          line-height: 1.4;
        }

        .notification-meta {
          display: flex;
          align-items: center;
          margin-top: var(--spacing-sm);
          gap: var(--spacing-sm);
        }

        .notification-type-badge {
          flex-shrink: 0;
        }

        .notification-actions {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
          margin-left: auto;
          opacity: 0;
          transition: opacity var(--transition-fast);
        }

        .notification-item:hover .notification-actions {
          opacity: 1;
        }

        .unread-indicator {
          position: absolute;
          top: var(--spacing-md);
          right: var(--spacing-md);
          width: 8px;
          height: 8px;
          background: var(--color-primary);
          border-radius: 50%;
        }

        /* Empty state */
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: var(--spacing-xl);
          text-align: center;
          color: var(--color-text-light);
        }

        .empty-icon {
          width: 48px;
          height: 48px;
          margin-bottom: var(--spacing-md);
          opacity: 0.5;
        }

        .empty-message {
          font-size: var(--font-size-md);
          margin: 0;
        }

        /* Loading state */
        .loading-state {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: var(--spacing-xl);
          color: var(--color-text-light);
        }

        .loading-spinner {
          width: 24px;
          height: 24px;
          margin-right: var(--spacing-sm);
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* Responsive design */
        @media (max-width: 640px) {
          .notification-header {
            padding: var(--spacing-sm);
          }

          .notification-item {
            padding: var(--spacing-sm);
          }

          .notification-actions {
            opacity: 1;
          }

          .filter-chip {
            font-size: var(--font-size-xs);
          }
        }

        /* Scrollbar styling */
        .notification-list::-webkit-scrollbar {
          width: 6px;
        }

        .notification-list::-webkit-scrollbar-track {
          background: transparent;
        }

        .notification-list::-webkit-scrollbar-thumb {
          background: var(--color-gray-300);
          border-radius: 3px;
        }

        .notification-list::-webkit-scrollbar-thumb:hover {
          background: var(--color-gray-400);
        }
      `,
    ];
  }

  constructor() {
    super();
    this.notifications = [];
    this.groupByDate = true;
    this.showActions = true;
    this.showAvatars = true;
    this.realTime = false;
    this.maxHeight = 500;
    this.emptyMessage = 'No notifications';
    this.markAsReadOnView = false;
    this.bulkActions = [];
    this.selectable = false;
    this.selectedIds = [];
    this.filters = {};
    this.showFilters = false;
    this._groupedNotifications = {};
    this._filteredNotifications = [];
    this._isAllSelected = false;
  }

  connectedCallback() {
    super.connectedCallback();
    this.style.setProperty('--max-height', `${this.maxHeight}px`);
    this._processNotifications();
  }

  updated(changedProperties) {
    super.updated(changedProperties);

    if (changedProperties.has('notifications') ||
        changedProperties.has('filters') ||
        changedProperties.has('groupByDate')) {
      this._processNotifications();
    }

    if (changedProperties.has('selectedIds')) {
      this._updateSelectAllState();
    }

    if (changedProperties.has('maxHeight')) {
      this.style.setProperty('--max-height', `${this.maxHeight}px`);
    }
  }

  /**
   * Process notifications (filter, group, sort)
   */
  _processNotifications() {
    let processed = [...(this.notifications || [])];

    // Apply filters
    if (this.filters && Object.keys(this.filters).length > 0) {
      processed = this._applyFilters(processed);
    }

    this._filteredNotifications = processed;

    // Group by date if enabled
    if (this.groupByDate) {
      this._groupedNotifications = this._groupByDate(processed);
    } else {
      this._groupedNotifications = { 'All': processed };
    }
  }

  /**
   * Apply filters to notifications
   */
  _applyFilters(notifications) {
    return notifications.filter(notification => {
      return Object.entries(this.filters).every(([key, value]) => {
        if (!value) return true;

        switch (key) {
          case 'read':
            return value === 'all' ? true :
                   value === 'read' ? notification.read : !notification.read;
          case 'type':
            return value === 'all' ? true : notification.type === value;
          default:
            return true;
        }
      });
    });
  }

  /**
   * Group notifications by date
   */
  _groupByDate(notifications) {
    const groups = {};
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    notifications.forEach(notification => {
      const notificationDate = new Date(notification.timestamp);
      const notificationDay = new Date(
        notificationDate.getFullYear(),
        notificationDate.getMonth(),
        notificationDate.getDate()
      );

      let groupKey;
      if (notificationDay.getTime() === today.getTime()) {
        groupKey = 'Today';
      } else if (notificationDay.getTime() === yesterday.getTime()) {
        groupKey = 'Yesterday';
      } else if (notificationDay.getTime() >= thisWeek.getTime()) {
        groupKey = 'This Week';
      } else {
        groupKey = notificationDate.toLocaleDateString('en-US', {
          month: 'long',
          year: 'numeric'
        });
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(notification);
    });

    return groups;
  }

  /**
   * Format time ago
   */
  _formatTimeAgo(timestamp) {
    const now = new Date();
    const time = new Date(timestamp);
    const diff = now - time;

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return time.toLocaleDateString();
  }

  /**
   * Handle notification click
   */
  _handleNotificationClick(notification, e) {
    if (e.target.closest('.notification-checkbox') ||
        e.target.closest('.notification-actions')) {
      return;
    }

    this.dispatchEvent(new CustomEvent('neo-notification-click', {
      detail: { notification },
      bubbles: true,
      composed: true
    }));

    // Mark as read if enabled
    if (this.markAsReadOnView && !notification.read) {
      this._markAsRead(notification);
    }
  }

  /**
   * Handle notification selection
   */
  _handleNotificationSelect(notification, selected) {
    let newSelection = [...this.selectedIds];

    if (selected) {
      if (!newSelection.includes(notification.id)) {
        newSelection.push(notification.id);
      }
    } else {
      newSelection = newSelection.filter(id => id !== notification.id);
    }

    this.selectedIds = newSelection;

    this.dispatchEvent(new CustomEvent('neo-notification-select', {
      detail: {
        notification,
        selected,
        selectedIds: this.selectedIds
      },
      bubbles: true,
      composed: true
    }));
  }

  /**
   * Handle select all
   */
  _handleSelectAll(selected) {
    if (selected) {
      this.selectedIds = this._filteredNotifications.map(n => n.id);
    } else {
      this.selectedIds = [];
    }

    this.dispatchEvent(new CustomEvent('neo-notification-select', {
      detail: {
        selectAll: selected,
        selectedIds: this.selectedIds
      },
      bubbles: true,
      composed: true
    }));
  }

  /**
   * Update select all state
   */
  _updateSelectAllState() {
    const visibleIds = this._filteredNotifications.map(n => n.id);
    this._isAllSelected = visibleIds.length > 0 &&
      visibleIds.every(id => this.selectedIds.includes(id));
  }

  /**
   * Mark notification as read
   */
  _markAsRead(notification) {
    this.dispatchEvent(new CustomEvent('neo-notification-mark-read', {
      detail: { notification },
      bubbles: true,
      composed: true
    }));
  }

  /**
   * Mark notification as unread
   */
  _markAsUnread(notification) {
    this.dispatchEvent(new CustomEvent('neo-notification-mark-unread', {
      detail: { notification },
      bubbles: true,
      composed: true
    }));
  }

  /**
   * Delete notification
   */
  _deleteNotification(notification) {
    this.dispatchEvent(new CustomEvent('neo-notification-delete', {
      detail: { notification },
      bubbles: true,
      composed: true
    }));
  }

  /**
   * Handle notification action
   */
  _handleNotificationAction(notification, action, e) {
    e.stopPropagation();

    switch (action) {
      case 'read':
        this._markAsRead(notification);
        break;
      case 'unread':
        this._markAsUnread(notification);
        break;
      case 'delete':
        this._deleteNotification(notification);
        break;
      default:
        this.dispatchEvent(new CustomEvent('neo-notification-action', {
          detail: { notification, action },
          bubbles: true,
          composed: true
        }));
    }
  }

  /**
   * Handle bulk action
   */
  _handleBulkAction(action) {
    const selectedNotifications = this._filteredNotifications.filter(
      n => this.selectedIds.includes(n.id)
    );

    this.dispatchEvent(new CustomEvent('neo-bulk-action', {
      detail: {
        action,
        notifications: selectedNotifications,
        selectedIds: this.selectedIds
      },
      bubbles: true,
      composed: true
    }));
  }

  /**
   * Handle filter change
   */
  _handleFilterChange(filterType, value) {
    this.filters = { ...this.filters, [filterType]: value };
  }

  /**
   * Get notification type variant
   */
  _getTypeVariant(type) {
    const variants = {
      info: 'primary',
      success: 'success',
      warning: 'warning',
      error: 'error',
      mention: 'primary',
      follow: 'success',
      like: 'warning',
      comment: 'primary'
    };
    return variants[type] || 'neutral';
  }

  /**
   * Get unread count
   */
  get unreadCount() {
    return this._filteredNotifications.filter(n => !n.read).length;
  }

  /**
   * Mark all as read
   */
  markAllAsRead() {
    this._filteredNotifications.forEach(notification => {
      if (!notification.read) {
        this._markAsRead(notification);
      }
    });
  }

  render() {
    const hasNotifications = this._filteredNotifications.length > 0;
    const hasSelection = this.selectedIds.length > 0;

    return html`
      <div class="notification-list-container">
        <!-- Header -->
        <div class="notification-header">
          <h3 class="header-title">Notifications</h3>
          <div class="header-actions">
            ${this.unreadCount > 0 ? html`
              <span class="unread-count">${this.unreadCount} unread</span>
            ` : ''}
            <neo-button
              variant="ghost"
              size="sm"
              @click="${this.markAllAsRead}">
              Mark all read
            </neo-button>
          </div>
        </div>

        <!-- Filters -->
        ${this.showFilters ? html`
          <div class="notification-filters">
            <button
              class="filter-chip ${(!this.filters.read || this.filters.read === 'all') ? 'active' : ''}"
              @click="${() => this._handleFilterChange('read', 'all')}">
              All
            </button>
            <button
              class="filter-chip ${this.filters.read === 'unread' ? 'active' : ''}"
              @click="${() => this._handleFilterChange('read', 'unread')}">
              Unread
            </button>
            <button
              class="filter-chip ${this.filters.read === 'read' ? 'active' : ''}"
              @click="${() => this._handleFilterChange('read', 'read')}">
              Read
            </button>
          </div>
        ` : ''}

        <!-- Bulk actions -->
        ${hasSelection && this.bulkActions.length > 0 ? html`
          <div class="bulk-actions-bar">
            <span class="selection-count">
              ${this.selectedIds.length} selected
            </span>
            <neo-cta-button-row
              .actions="${this.bulkActions}"
              alignment="right"
              size="sm"
              @neo-action-click="${(e) => this._handleBulkAction(e.detail.action)}">
            </neo-cta-button-row>
          </div>
        ` : ''}

        <!-- Notification list -->
        <div class="notification-list">
          ${!hasNotifications ? html`
            <div class="empty-state">
              <neo-icon name="bell" class="empty-icon"></neo-icon>
              <p class="empty-message">${this.emptyMessage}</p>
            </div>
          ` : html`
            ${Object.entries(this._groupedNotifications).map(([groupName, notifications]) => html`
              <div class="notification-group">
                ${this.groupByDate && Object.keys(this._groupedNotifications).length > 1 ? html`
                  <div class="group-header">${groupName}</div>
                ` : ''}

                ${notifications.map(notification => html`
                  <div
                    class="notification-item ${notification.read ? '' : 'unread'} ${this.selectedIds.includes(notification.id) ? 'selected' : ''}"
                    @click="${(e) => this._handleNotificationClick(notification, e)}">

                    ${this.selectable ? html`
                      <neo-checkbox
                        class="notification-checkbox"
                        ?checked="${this.selectedIds.includes(notification.id)}"
                        @neo-checkbox-change="${(e) => this._handleNotificationSelect(notification, e.detail.checked)}">
                      </neo-checkbox>
                    ` : ''}

                    ${this.showAvatars && notification.user ? html`
                      <neo-avatar
                        class="notification-avatar"
                        src="${notification.user.avatar || ''}"
                        name="${notification.user.name || 'User'}"
                        size="sm">
                      </neo-avatar>
                    ` : ''}

                    <div class="notification-content">
                      <div class="notification-header-row">
                        <h4 class="notification-title">${notification.title}</h4>
                        <span class="notification-time">
                          ${this._formatTimeAgo(notification.timestamp)}
                        </span>
                      </div>

                      <p class="notification-message">${notification.message}</p>

                      ${notification.type || this.showActions ? html`
                        <div class="notification-meta">
                          ${notification.type ? html`
                            <neo-badge
                              class="notification-type-badge"
                              variant="${this._getTypeVariant(notification.type)}"
                              size="sm">
                              ${notification.type}
                            </neo-badge>
                          ` : ''}

                          ${this.showActions ? html`
                            <div class="notification-actions">
                              ${!notification.read ? html`
                                <neo-button
                                  variant="ghost"
                                  size="sm"
                                  @click="${(e) => this._handleNotificationAction(notification, 'read', e)}">
                                  <neo-icon name="check"></neo-icon>
                                </neo-button>
                              ` : html`
                                <neo-button
                                  variant="ghost"
                                  size="sm"
                                  @click="${(e) => this._handleNotificationAction(notification, 'unread', e)}">
                                  <neo-icon name="mail"></neo-icon>
                                </neo-button>
                              `}

                              <neo-button
                                variant="ghost"
                                size="sm"
                                @click="${(e) => this._handleNotificationAction(notification, 'delete', e)}">
                                <neo-icon name="trash"></neo-icon>
                              </neo-button>
                            </div>
                          ` : ''}
                        </div>
                      ` : ''}
                    </div>

                    ${!notification.read ? html`
                      <div class="unread-indicator"></div>
                    ` : ''}
                  </div>
                `)}\n              </div>\n            `)}\n          `}\n        </div>\n      </div>\n    `;\n  }\n}\n\n// Register the component\nif (!customElements.get(\"neo-notification-list\")) {\n  customElements.define(\"neo-notification-list\", NeoNotificationList);\n}
