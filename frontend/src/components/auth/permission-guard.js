import { LitElement, html, css } from 'lit';
import { BaseComponent } from '../base-component.js';
import { rbacService, PERMISSIONS, ROLES } from '../../services/rbac.js';

/**
 * Permission Guard Component
 * Conditionally renders content based on user permissions and roles
 *
 * Usage:
 * <permission-guard permissions="user.create,user.read">
 *   <button>Create User</button>
 * </permission-guard>
 *
 * <permission-guard roles="admin,tenant_admin" require-all="false">
 *   <div>Admin content</div>
 * </permission-guard>
 */
export class PermissionGuard extends BaseComponent {
  static properties = {
    permissions: { type: String },
    roles: { type: String },
    requireAll: { type: Boolean, attribute: 'require-all' },
    fallback: { type: String },
    loading: { type: Boolean },
  };

  static styles = css`
    :host {
      display: contents;
    }

    .permission-denied {
      display: none;
    }

    .permission-denied.show {
      display: block;
      padding: 1rem;
      background: var(--warning-background, #fff3cd);
      color: var(--warning-color, #856404);
      border: 1px solid var(--warning-border, #ffeaa7);
      border-radius: 4px;
      text-align: center;
    }

    .loading {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      color: var(--text-secondary, #6c757d);
    }
  `;

  constructor() {
    super();
    this.permissions = '';
    this.roles = '';
    this.requireAll = true;
    this.fallback = 'access-denied';
    this.loading = true;
    this.hasAccess = false;
  }

  async connectedCallback() {
    super.connectedCallback();
    await this.checkPermissions();
  }

  async checkPermissions() {
    this.loading = true;
    this.requestUpdate();

    try {
      // Wait for RBAC service to initialize
      if (!rbacService.userRoles.size) {
        await new Promise(resolve => {
          const unsubscribe = rbacService.addListener(() => {
            unsubscribe();
            resolve();
          });
        });
      }

      this.hasAccess = this.evaluatePermissions();
    } catch (error) {
      console.error('Permission check failed:', error);
      this.hasAccess = false;
    } finally {
      this.loading = false;
      this.requestUpdate();
    }
  }

  evaluatePermissions() {
    // Parse permissions and roles
    const requiredPermissions = this.permissions
      .split(',')
      .map(p => p.trim())
      .filter(p => p.length > 0);

    const requiredRoles = this.roles
      .split(',')
      .map(r => r.trim())
      .filter(r => r.length > 0);

    // Check permissions
    let hasPermissionAccess = true;
    if (requiredPermissions.length > 0) {
      if (this.requireAll) {
        hasPermissionAccess = rbacService.hasAllPermissions(requiredPermissions);
      } else {
        hasPermissionAccess = rbacService.hasAnyPermission(requiredPermissions);
      }
    }

    // Check roles
    let hasRoleAccess = true;
    if (requiredRoles.length > 0) {
      if (this.requireAll) {
        hasRoleAccess = requiredRoles.every(role => rbacService.hasRole(role));
      } else {
        hasRoleAccess = requiredRoles.some(role => rbacService.hasRole(role));
      }
    }

    // Both permissions and roles must be satisfied if both are specified
    if (requiredPermissions.length > 0 && requiredRoles.length > 0) {
      return hasPermissionAccess && hasRoleAccess;
    }

    // At least one must be satisfied if only one is specified
    return hasPermissionAccess || hasRoleAccess;
  }

  render() {
    if (this.loading) {
      return html`<div class="loading">Checking permissions...</div>`;
    }

    if (this.hasAccess) {
      return html`<slot></slot>`;
    }

    // Render fallback content
    return this.renderFallback();
  }

  renderFallback() {
    switch (this.fallback) {
      case 'none':
        return html``;

      case 'message':
        return html`
          <div class="permission-denied show">
            <p>You don't have permission to access this content.</p>
          </div>
        `;

      case 'access-denied':
      default:
        return html`
          <div class="permission-denied show">
            <h4>Access Denied</h4>
            <p>You don't have the required permissions to view this content.</p>
            ${this.renderPermissionDetails()}
          </div>
        `;
    }
  }

  renderPermissionDetails() {
    const requiredPermissions = this.permissions
      .split(',')
      .map(p => p.trim())
      .filter(p => p.length > 0);

    const requiredRoles = this.roles
      .split(',')
      .map(r => r.trim())
      .filter(r => r.length > 0);

    const userRoles = Array.from(rbacService.userRoles);
    const userPermissions = Array.from(rbacService.userPermissions);

    return html`
      <details style="margin-top: 1rem; text-align: left;">
        <summary>Permission Details</summary>
        ${requiredPermissions.length > 0 ? html`
          <p><strong>Required Permissions:</strong> ${requiredPermissions.join(', ')}</p>
          <p><strong>Your Permissions:</strong> ${userPermissions.join(', ') || 'None'}</p>
        ` : ''}
        ${requiredRoles.length > 0 ? html`
          <p><strong>Required Roles:</strong> ${requiredRoles.join(', ')}</p>
          <p><strong>Your Roles:</strong> ${userRoles.join(', ') || 'None'}</p>
        ` : ''}
      </details>
    `;
  }

  // Public API for programmatic checks
  static async canAccess(permissions = '', roles = '', requireAll = true) {
    const guard = new PermissionGuard();
    guard.permissions = permissions;
    guard.roles = roles;
    guard.requireAll = requireAll;

    await guard.checkPermissions();
    return guard.hasAccess;
  }
}

customElements.define('permission-guard', PermissionGuard);