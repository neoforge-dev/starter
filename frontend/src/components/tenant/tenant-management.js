import { LitElement, html, css } from 'lit';
import { BaseComponent } from '../base-component.js';
import { tenantService } from '../../services/tenant.js';

/**
 * Tenant Management Component
 * Provides UI for managing tenant settings, users, and configuration
 */
export class TenantManagement extends BaseComponent {
  static properties = {
    tenant: { type: Object },
    users: { type: Array },
    settings: { type: Object },
    loading: { type: Boolean },
    activeTab: { type: String },
  };

  static styles = css`
    :host {
      display: block;
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    .header {
      margin-bottom: 2rem;
      text-align: center;
    }

    .tenant-info {
      background: var(--card-background, #f8f9fa);
      border: 1px solid var(--border-color, #dee2e6);
      border-radius: 8px;
      padding: 1.5rem;
      margin-bottom: 2rem;
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .tenant-logo {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      object-fit: cover;
    }

    .tenant-details h2 {
      margin: 0 0 0.5rem 0;
      color: var(--tenant-primary-color, var(--primary-color, #007bff));
    }

    .tenant-details p {
      margin: 0.25rem 0;
      color: var(--text-secondary, #6c757d);
    }

    .tabs {
      display: flex;
      border-bottom: 1px solid var(--border-color, #dee2e6);
      margin-bottom: 2rem;
    }

    .tab {
      padding: 1rem 1.5rem;
      border: none;
      background: none;
      cursor: pointer;
      border-bottom: 2px solid transparent;
      font-weight: 500;
      color: var(--text-secondary, #6c757d);
      transition: all 0.2s ease;
    }

    .tab.active {
      color: var(--tenant-primary-color, var(--primary-color, #007bff));
      border-bottom-color: var(--tenant-primary-color, var(--primary-color, #007bff));
    }

    .tab:hover {
      color: var(--tenant-primary-color, var(--primary-color, #007bff));
    }

    .tab-content {
      display: none;
    }

    .tab-content.active {
      display: block;
    }

    .settings-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.5rem;
    }

    .setting-group {
      background: var(--card-background, #f8f9fa);
      border: 1px solid var(--border-color, #dee2e6);
      border-radius: 8px;
      padding: 1.5rem;
    }

    .setting-group h3 {
      margin: 0 0 1rem 0;
      color: var(--text-primary, #212529);
    }

    .form-group {
      margin-bottom: 1rem;
    }

    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
      color: var(--text-primary, #212529);
    }

    .form-group input,
    .form-group select,
    .form-group textarea {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid var(--border-color, #dee2e6);
      border-radius: 4px;
      font-size: 1rem;
    }

    .form-group input:focus,
    .form-group select:focus,
    .form-group textarea:focus {
      outline: none;
      border-color: var(--tenant-primary-color, var(--primary-color, #007bff));
      box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s ease;
    }

    .btn-primary {
      background: var(--tenant-primary-color, var(--primary-color, #007bff));
      color: white;
    }

    .btn-primary:hover {
      opacity: 0.9;
    }

    .btn-secondary {
      background: var(--text-secondary, #6c757d);
      color: white;
    }

    .btn-secondary:hover {
      opacity: 0.9;
    }

    .user-list {
      margin-top: 1rem;
    }

    .user-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem;
      border: 1px solid var(--border-color, #dee2e6);
      border-radius: 4px;
      margin-bottom: 0.5rem;
    }

    .user-info h4 {
      margin: 0 0 0.25rem 0;
    }

    .user-info p {
      margin: 0;
      color: var(--text-secondary, #6c757d);
      font-size: 0.875rem;
    }

    .user-actions {
      display: flex;
      gap: 0.5rem;
    }

    .loading {
      text-align: center;
      padding: 2rem;
      color: var(--text-secondary, #6c757d);
    }

    .error {
      background: #f8d7da;
      color: #721c24;
      padding: 1rem;
      border-radius: 4px;
      margin-bottom: 1rem;
      border: 1px solid #f5c6cb;
    }
  `;

  constructor() {
    super();
    this.tenant = null;
    this.users = [];
    this.settings = {};
    this.loading = false;
    this.activeTab = 'settings';
  }

  async connectedCallback() {
    super.connectedCallback();
    await this.loadTenantData();
  }

  onTenantChanged(tenant) {
    if (tenant && tenant.id !== 'default') {
      this.loadTenantData();
    }
  }

  async loadTenantData() {
    if (!this.isTenantActive()) {
      return;
    }

    this.loading = true;
    this.requestUpdate();

    try {
      // Load tenant users
      this.users = await tenantService.getTenantUsers();

      // Load tenant settings
      this.settings = await tenantService.getTenantSettings();

      this.requestUpdate();
    } catch (error) {
      this.handleError(error, 'loading tenant data');
    } finally {
      this.loading = false;
      this.requestUpdate();
    }
  }

  async saveSettings() {
    if (!this.isTenantActive()) return;

    this.loading = true;
    this.requestUpdate();

    try {
      const formData = new FormData(this.shadowRoot.querySelector('#settings-form'));
      const settings = Object.fromEntries(formData.entries());

      await this.fetchData(`${this.getTenantApiUrl('/settings')}`, {
        method: 'PUT',
        body: JSON.stringify(settings),
      });

      // Reload tenant config
      await tenantService.loadTenantConfig();

      this.dispatchCustomEvent('settings-saved', { settings });
    } catch (error) {
      this.handleError(error, 'saving settings');
    } finally {
      this.loading = false;
      this.requestUpdate();
    }
  }

  async removeUser(userId) {
    if (!confirm('Are you sure you want to remove this user from the tenant?')) {
      return;
    }

    this.loading = true;
    this.requestUpdate();

    try {
      await this.fetchData(`${this.getTenantApiUrl(`/users/${userId}`)}`, {
        method: 'DELETE',
      });

      // Reload users
      await this.loadTenantData();

      this.dispatchCustomEvent('user-removed', { userId });
    } catch (error) {
      this.handleError(error, 'removing user');
    } finally {
      this.loading = false;
      this.requestUpdate();
    }
  }

  switchTab(tabName) {
    this.activeTab = tabName;
    this.requestUpdate();
  }

  render() {
    if (!this.isTenantActive()) {
      return html`
        <div class="error">
          <p>Tenant management is only available for active tenants.</p>
          <p>Current tenant: ${this.tenant?.slug || 'default'}</p>
        </div>
      `;
    }

    return html`
      <div class="header">
        <h1>Tenant Management</h1>
        <p>Manage your tenant settings, users, and configuration</p>
      </div>

      <div class="tenant-info">
        ${this.tenant?.logo ? html`<img class="tenant-logo" src="${this.tenant.logo}" alt="Logo" />` : ''}
        <div class="tenant-details">
          <h2>${this.tenant?.name || 'Default Tenant'}</h2>
          <p><strong>Slug:</strong> ${this.tenant?.slug}</p>
          <p><strong>Domain:</strong> ${this.tenant?.domain || 'N/A'}</p>
          <p><strong>Status:</strong> Active</p>
        </div>
      </div>

      <div class="tabs">
        <button
          class="tab ${this.activeTab === 'settings' ? 'active' : ''}"
          @click=${() => this.switchTab('settings')}
        >
          Settings
        </button>
        <button
          class="tab ${this.activeTab === 'users' ? 'active' : ''}"
          @click=${() => this.switchTab('users')}
        >
          Users
        </button>
        <button
          class="tab ${this.activeTab === 'branding' ? 'active' : ''}"
          @click=${() => this.switchTab('branding')}
        >
          Branding
        </button>
      </div>

      <div class="tab-content ${this.activeTab === 'settings' ? 'active' : ''}">
        ${this.renderSettingsTab()}
      </div>

      <div class="tab-content ${this.activeTab === 'users' ? 'active' : ''}">
        ${this.renderUsersTab()}
      </div>

      <div class="tab-content ${this.activeTab === 'branding' ? 'active' : ''}">
        ${this.renderBrandingTab()}
      </div>
    `;
  }

  renderSettingsTab() {
    if (this.loading) {
      return html`<div class="loading">Loading settings...</div>`;
    }

    return html`
      <form id="settings-form" @submit=${(e) => { e.preventDefault(); this.saveSettings(); }}>
        <div class="settings-grid">
          <div class="setting-group">
            <h3>General Settings</h3>
            <div class="form-group">
              <label for="maxUsers">Max Users</label>
              <input
                type="number"
                id="maxUsers"
                name="maxUsers"
                .value=${this.settings.maxUsers || ''}
                min="1"
                max="1000"
              />
            </div>
            <div class="form-group">
              <label for="storageLimit">Storage Limit (GB)</label>
              <input
                type="number"
                id="storageLimit"
                name="storageLimit"
                .value=${this.settings.storageLimit || ''}
                min="1"
                max="1000"
              />
            </div>
          </div>

          <div class="setting-group">
            <h3>Feature Flags</h3>
            <div class="form-group">
              <label>
                <input
                  type="checkbox"
                  name="analyticsEnabled"
                  .checked=${this.settings.analyticsEnabled || false}
                />
                Enable Analytics
              </label>
            </div>
            <div class="form-group">
              <label>
                <input
                  type="checkbox"
                  name="notificationsEnabled"
                  .checked=${this.settings.notificationsEnabled || false}
                />
                Enable Notifications
              </label>
            </div>
          </div>
        </div>

        <div style="margin-top: 2rem; text-align: center;">
          <button type="submit" class="btn btn-primary" ?disabled=${this.loading}>
            ${this.loading ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    `;
  }

  renderUsersTab() {
    if (this.loading) {
      return html`<div class="loading">Loading users...</div>`;
    }

    return html`
      <div class="setting-group">
        <h3>Tenant Users (${this.users.length})</h3>

        ${this.users.length === 0
          ? html`<p>No users found for this tenant.</p>`
          : html`
              <div class="user-list">
                ${this.users.map(user => html`
                  <div class="user-item">
                    <div class="user-info">
                      <h4>${user.full_name || user.email}</h4>
                      <p>${user.email}</p>
                      <p>Role: ${user.role || 'User'}</p>
                    </div>
                    <div class="user-actions">
                      <button
                        class="btn btn-secondary"
                        @click=${() => this.removeUser(user.id)}
                        ?disabled=${this.loading}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                `)}
              </div>
            `
        }
      </div>
    `;
  }

  renderBrandingTab() {
    if (this.loading) {
      return html`<div class="loading">Loading branding settings...</div>`;
    }

    return html`
      <div class="settings-grid">
        <div class="setting-group">
          <h3>Brand Colors</h3>
          <div class="form-group">
            <label for="primaryColor">Primary Color</label>
            <input
              type="color"
              id="primaryColor"
              name="primaryColor"
              .value=${this.tenant?.primaryColor || '#007bff'}
              @input=${(e) => this.updateBrandColor('primary', e.target.value)}
            />
          </div>
          <div class="form-group">
            <label for="secondaryColor">Secondary Color</label>
            <input
              type="color"
              id="secondaryColor"
              name="secondaryColor"
              .value=${this.tenant?.secondaryColor || '#6c757d'}
              @input=${(e) => this.updateBrandColor('secondary', e.target.value)}
            />
          </div>
        </div>

        <div class="setting-group">
          <h3>Logo</h3>
          <div class="form-group">
            <label for="logo">Logo URL</label>
            <input
              type="url"
              id="logo"
              name="logo"
              .value=${this.tenant?.logo || ''}
              placeholder="https://example.com/logo.png"
            />
          </div>
          ${this.tenant?.logo ? html`
            <div style="text-align: center; margin-top: 1rem;">
              <img src="${this.tenant.logo}" alt="Logo preview" style="max-width: 200px; max-height: 100px;" />
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  async updateBrandColor(type, color) {
    // Update CSS custom properties in real-time
    document.documentElement.style.setProperty(
      `--tenant-${type}-color`,
      color
    );
  }
}

customElements.define('tenant-management', TenantManagement);