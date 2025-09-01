import { html, css } from 'lit';
import { BaseComponent } from '../base-component.js';
import { apiService } from '../../services/api.js';
import { authService } from '../../services/auth.js';

/**
 * Dashboard Layout Component
 * Provides the main layout structure for the dashboard with navigation,
 * user context, and responsive design.
 *
 * @element dashboard-layout
 * @description Main dashboard container with header, sidebar, and content area
 */
export class DashboardLayout extends BaseComponent {
  static properties = {
    user: { type: Object },
    isLoading: { type: Boolean },
    sidebarCollapsed: { type: Boolean },
    currentView: { type: String },
    notifications: { type: Array },
    systemStatus: { type: Object },
    isMobile: { type: Boolean },
    showMobileMenu: { type: Boolean },
  };

  static styles = css`
    :host {
      display: block;
      height: 100vh;
      background: var(--background-color, #f8fafc);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .dashboard-container {
      display: flex;
      height: 100%;
      overflow: hidden;
    }

    /* Header Styles */
    .dashboard-header {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: 64px;
      background: var(--surface-color, #ffffff);
      border-bottom: 1px solid var(--border-color, #e2e8f0);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 1.5rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .menu-toggle {
      display: none;
      background: none;
      border: none;
      padding: 0.5rem;
      border-radius: 0.375rem;
      cursor: pointer;
      color: var(--text-color, #334155);
      transition: background-color 0.2s;
    }

    .menu-toggle:hover {
      background: var(--hover-color, #f1f5f9);
    }

    .logo {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--primary-color, #3b82f6);
      text-decoration: none;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.5rem;
      border-radius: 0.5rem;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .user-info:hover {
      background: var(--hover-color, #f1f5f9);
    }

    .user-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: var(--primary-color, #3b82f6);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 600;
      font-size: 0.875rem;
    }

    .user-details {
      display: flex;
      flex-direction: column;
    }

    .user-name {
      font-weight: 600;
      font-size: 0.875rem;
      color: var(--text-color, #334155);
    }

    .user-role {
      font-size: 0.75rem;
      color: var(--text-secondary, #64748b);
    }

    /* Sidebar Styles */
    .dashboard-sidebar {
      width: 280px;
      background: var(--surface-color, #ffffff);
      border-right: 1px solid var(--border-color, #e2e8f0);
      transition: transform 0.3s ease;
      overflow-y: auto;
      position: fixed;
      top: 64px;
      left: 0;
      bottom: 0;
      z-index: 999;
    }

    .dashboard-sidebar.collapsed {
      transform: translateX(-100%);
    }

    .sidebar-header {
      padding: 1.5rem 1rem 1rem;
      border-bottom: 1px solid var(--border-color, #e2e8f0);
    }

    .sidebar-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--text-color, #334155);
      margin: 0;
    }

    .sidebar-subtitle {
      font-size: 0.875rem;
      color: var(--text-secondary, #64748b);
      margin: 0.25rem 0 0 0;
    }

    .sidebar-nav {
      padding: 1rem 0;
    }

    .nav-section {
      margin-bottom: 1.5rem;
    }

    .nav-section-title {
      padding: 0 1rem;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-secondary, #64748b);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.5rem;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      color: var(--text-color, #334155);
      text-decoration: none;
      transition: all 0.2s;
      border-left: 3px solid transparent;
    }

    .nav-item:hover {
      background: var(--hover-color, #f1f5f9);
      color: var(--primary-color, #3b82f6);
    }

    .nav-item.active {
      background: var(--primary-light, #eff6ff);
      color: var(--primary-color, #3b82f6);
      border-left-color: var(--primary-color, #3b82f6);
    }

    .nav-item-icon {
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .nav-item-text {
      font-size: 0.875rem;
      font-weight: 500;
    }

    /* Main Content */
    .dashboard-main {
      flex: 1;
      margin-left: 280px;
      margin-top: 64px;
      transition: margin-left 0.3s ease;
      overflow-y: auto;
      min-height: calc(100vh - 64px);
    }

    .dashboard-main.expanded {
      margin-left: 0;
    }

    .main-content {
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    /* Mobile Styles */
    @media (max-width: 768px) {
      .menu-toggle {
        display: block;
      }

      .dashboard-sidebar {
        transform: translateX(-100%);
        box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
      }

      .dashboard-sidebar.mobile-open {
        transform: translateX(0);
      }

      .dashboard-main {
        margin-left: 0;
      }

      .main-content {
        padding: 1rem;
      }

      .dashboard-header {
        padding: 0 1rem;
        height: 56px; /* Slightly smaller on mobile */
      }

      .header-left {
        gap: 0.75rem;
      }

      .logo {
        font-size: 1.25rem;
      }

      .user-info {
        padding: 0.375rem;
      }

      .user-avatar {
        width: 28px;
        height: 28px;
        font-size: 0.75rem;
      }

      .user-details {
        display: none; /* Hide user details on mobile to save space */
      }

      /* Mobile overlay for sidebar */
      .mobile-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        z-index: 998;
        backdrop-filter: blur(2px);
      }

      /* Touch-friendly interactions */
      .nav-item {
        min-height: 48px; /* Minimum touch target */
        padding: 0.75rem 1rem;
      }

      .quick-action {
        min-height: 44px;
        min-width: 44px;
      }
    }

    /* Tablet Styles */
    @media (max-width: 1024px) and (min-width: 769px) {
      .dashboard-sidebar {
        width: 240px;
      }

      .dashboard-main {
        margin-left: 240px;
      }

      .main-content {
        padding: 1.5rem;
      }
    }

      .dashboard-sidebar {
        transform: translateX(-100%);
      }

      .dashboard-sidebar.mobile-open {
        transform: translateX(0);
      }

      .dashboard-main {
        margin-left: 0;
      }

      .main-content {
        padding: 1rem;
      }

      .dashboard-header {
        padding: 0 1rem;
      }
    }

    /* Loading States */
    .loading-skeleton {
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: loading 1.5s infinite;
    }

    @keyframes loading {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    /* Status Indicators */
    .status-indicator {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.25rem 0.75rem;
      border-radius: 1rem;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .status-healthy {
      background: #dcfce7;
      color: #166534;
    }

    .status-warning {
      background: #fef3c7;
      color: #92400e;
    }

    .status-error {
      background: #fee2e2;
      color: #991b1b;
    }

    /* Notification Badge */
    .notification-badge {
      position: relative;
    }

    .notification-count {
      position: absolute;
      top: -8px;
      right: -8px;
      background: #ef4444;
      color: white;
      border-radius: 50%;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: 600;
    }

    /* Dark Mode Support */
    @media (prefers-color-scheme: dark) {
      :host {
        background: var(--background-color, #0f172a);
      }

      .dashboard-header,
      .dashboard-sidebar {
        background: var(--surface-color, #1e293b);
        border-color: var(--border-color, #334155);
      }

      .nav-item:hover {
        background: var(--hover-color, #334155);
      }

      .nav-item.active {
        background: var(--primary-light, #1e40af);
      }
    }
  `;

  constructor() {
    super();
    this.user = null;
    this.isLoading = true;
    this.sidebarCollapsed = false;
    this.currentView = 'overview';
    this.notifications = [];
    this.systemStatus = { status: 'healthy' };
    this.isMobile = false;
    this.showMobileMenu = false;

    this._checkMobile = this._checkMobile.bind(this);
    this._handleNavigation = this._handleNavigation.bind(this);
    this._toggleMobileMenu = this._toggleMobileMenu.bind(this);
  }

  connectedCallback() {
    super.connectedCallback();
    this._checkMobile();
    window.addEventListener('resize', this._checkMobile);
    this._loadUserData();
    this._loadSystemStatus();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('resize', this._checkMobile);
  }

  async _loadUserData() {
    try {
      this.user = await apiService.request('/auth/me');
    } catch (error) {
      console.error('Failed to load user data:', error);
      // Fallback to auth service
      this.user = authService.getCurrentUser();
    } finally {
      this.isLoading = false;
    }
  }

  async _loadSystemStatus() {
    try {
      this.systemStatus = await apiService.request('/status');
    } catch (error) {
      console.error('Failed to load system status:', error);
    }
  }

  _checkMobile() {
    this.isMobile = window.innerWidth < 768;
    if (!this.isMobile) {
      this.showMobileMenu = false;
    }
  }

  _toggleMobileMenu() {
    this.showMobileMenu = !this.showMobileMenu;
  }

  _handleNavigation(view) {
    this.currentView = view;
    this.showMobileMenu = false;

    // Dispatch custom event for navigation
    this.dispatchEvent(new CustomEvent('dashboard-navigate', {
      detail: { view },
      bubbles: true,
      composed: true
    }));
  }

  _getNavigationItems() {
    return [
      {
        id: 'overview',
        label: 'Overview',
        icon: '📊',
        description: 'Dashboard overview and key metrics'
      },
      {
        id: 'projects',
        label: 'Projects',
        icon: '📁',
        description: 'Manage your projects and tasks'
      },
      {
        id: 'analytics',
        label: 'Analytics',
        icon: '📈',
        description: 'View insights and performance metrics'
      },
      {
        id: 'team',
        label: 'Team',
        icon: '👥',
        description: 'Collaborate with your team'
      },
      {
        id: 'community',
        label: 'Community',
        icon: '🌐',
        description: 'Connect with the community'
      },
      {
        id: 'settings',
        label: 'Settings',
        icon: '⚙️',
        description: 'Configure your preferences'
      }
    ];
  }

  _getUserInitials() {
    if (!this.user?.name) return '?';
    return this.user.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  render() {
    const navItems = this._getNavigationItems();

    return html`
      <div class="dashboard-container">
        <!-- Header -->
        <header class="dashboard-header">
          <div class="header-left">
            ${this.isMobile ? html`
              <button class="menu-toggle" @click=${this._toggleMobileMenu}>
                ☰
              </button>
            ` : ''}
            <a href="/" class="logo">NeoForge</a>
          </div>

          <div class="header-right">
            <div class="status-indicator status-${this.systemStatus.status}">
              <span>●</span>
              System ${this.systemStatus.status}
            </div>

            <div class="notification-badge">
              <button class="user-info" @click=${() => this._handleNavigation('settings')}>
                <div class="user-avatar">
                  ${this.isLoading ? '...' : this._getUserInitials()}
                </div>
                <div class="user-details">
                  <span class="user-name">
                    ${this.isLoading ? 'Loading...' : (this.user?.name || 'User')}
                  </span>
                  <span class="user-role">
                    ${this.user?.role || 'Developer'}
                  </span>
                </div>
              </button>
            </div>
          </div>
        </header>

        <!-- Sidebar -->
        <aside class="dashboard-sidebar ${this.sidebarCollapsed ? 'collapsed' : ''} ${this.isMobile && this.showMobileMenu ? 'mobile-open' : ''}">
          <div class="sidebar-header">
            <h2 class="sidebar-title">Dashboard</h2>
            <p class="sidebar-subtitle">Welcome back${this.user?.name ? `, ${this.user.name.split(' ')[0]}` : ''}!</p>
          </div>

          <nav class="sidebar-nav">
            <div class="nav-section">
              <div class="nav-section-title">Main</div>
              ${navItems.slice(0, 4).map(item => html`
                <a
                  href="#"
                  class="nav-item ${this.currentView === item.id ? 'active' : ''}"
                  @click=${(e) => { e.preventDefault(); this._handleNavigation(item.id); }}
                  title="${item.description}"
                >
                  <span class="nav-item-icon">${item.icon}</span>
                  <span class="nav-item-text">${item.label}</span>
                </a>
              `)}
            </div>

            <div class="nav-section">
              <div class="nav-section-title">More</div>
              ${navItems.slice(4).map(item => html`
                <a
                  href="#"
                  class="nav-item ${this.currentView === item.id ? 'active' : ''}"
                  @click=${(e) => { e.preventDefault(); this._handleNavigation(item.id); }}
                  title="${item.description}"
                >
                  <span class="nav-item-icon">${item.icon}</span>
                  <span class="nav-item-text">${item.label}</span>
                </a>
              `)}
            </div>
          </nav>
        </aside>

        <!-- Main Content -->
        <main class="dashboard-main ${this.sidebarCollapsed ? 'expanded' : ''}">
          <div class="main-content">
            <slot></slot>
          </div>
        </main>

        <!-- Mobile Menu Overlay -->
        ${this.isMobile && this.showMobileMenu ? html`
          <div class="mobile-overlay" @click=${this._toggleMobileMenu}></div>
        ` : ''}
      </div>
    `;
  }
}

customElements.define('dashboard-layout', DashboardLayout);