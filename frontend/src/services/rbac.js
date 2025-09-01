/**
 * Role-Based Access Control (RBAC) Service
 * Manages permissions, roles, and access control for the application
 */

import { Logger } from "../utils/logger.js";
import { tenantService } from "./tenant.js";

export const PERMISSIONS = {
  // User management
  USER_CREATE: 'user.create',
  USER_READ: 'user.read',
  USER_UPDATE: 'user.update',
  USER_DELETE: 'user.delete',

  // Tenant management
  TENANT_CREATE: 'tenant.create',
  TENANT_READ: 'tenant.read',
  TENANT_UPDATE: 'tenant.update',
  TENANT_DELETE: 'tenant.delete',

  // Content management
  CONTENT_CREATE: 'content.create',
  CONTENT_READ: 'content.read',
  CONTENT_UPDATE: 'content.update',
  CONTENT_DELETE: 'content.delete',

  // Analytics
  ANALYTICS_READ: 'analytics.read',
  ANALYTICS_EXPORT: 'analytics.export',

  // System administration
  SYSTEM_CONFIG: 'system.config',
  SYSTEM_LOGS: 'system.logs',
  SYSTEM_BACKUP: 'system.backup',
};

export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  TENANT_ADMIN: 'tenant_admin',
  TENANT_USER: 'tenant_user',
  GUEST: 'guest',
};

export const ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS),

  [ROLES.TENANT_ADMIN]: [
    PERMISSIONS.USER_CREATE,
    PERMISSIONS.USER_READ,
    PERMISSIONS.USER_UPDATE,
    PERMISSIONS.USER_DELETE,
    PERMISSIONS.TENANT_READ,
    PERMISSIONS.TENANT_UPDATE,
    PERMISSIONS.CONTENT_CREATE,
    PERMISSIONS.CONTENT_READ,
    PERMISSIONS.CONTENT_UPDATE,
    PERMISSIONS.CONTENT_DELETE,
    PERMISSIONS.ANALYTICS_READ,
    PERMISSIONS.ANALYTICS_EXPORT,
  ],

  [ROLES.TENANT_USER]: [
    PERMISSIONS.USER_READ,
    PERMISSIONS.CONTENT_CREATE,
    PERMISSIONS.CONTENT_READ,
    PERMISSIONS.CONTENT_UPDATE,
    PERMISSIONS.ANALYTICS_READ,
  ],

  [ROLES.GUEST]: [
    PERMISSIONS.CONTENT_READ,
  ],
};

export class RBACService {
  constructor() {
    this.userPermissions = new Set();
    this.userRoles = new Set();
    this.permissionCache = new Map();
    this.listeners = new Set();
  }

  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notifyListeners() {
    this.listeners.forEach(callback => callback({
      permissions: Array.from(this.userPermissions),
      roles: Array.from(this.userRoles),
    }));
  }

  async initialize() {
    try {
      // Load user permissions from API
      await this.loadUserPermissions();

      // Load tenant-specific roles
      await this.loadTenantRoles();

      Logger.info("RBAC service initialized", {
        roles: Array.from(this.userRoles),
        permissionsCount: this.userPermissions.size,
      });
    } catch (error) {
      Logger.error("Failed to initialize RBAC service", error);
      // Set default guest permissions
      this.setDefaultGuestPermissions();
    }
  }

  async loadUserPermissions() {
    try {
      const response = await fetch('/api/v1/auth/me', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        this.setUserRoles(userData.roles || []);
        this.setUserPermissions(userData.permissions || []);
      } else {
        throw new Error('Failed to load user permissions');
      }
    } catch (error) {
      Logger.warn("Could not load user permissions, using defaults", error);
      this.setDefaultGuestPermissions();
    }
  }

  async loadTenantRoles() {
    const tenant = tenantService.getTenant();
    if (!tenant || tenant.id === 'default') return;

    try {
      const response = await fetch(`/api/v1/tenants/${tenant.id}/roles`);
      if (response.ok) {
        const tenantRoles = await response.json();
        // Merge tenant roles with user roles
        tenantRoles.forEach(role => this.userRoles.add(role));
        this.updatePermissionsFromRoles();
      }
    } catch (error) {
      Logger.warn("Could not load tenant roles", error);
    }
  }

  setUserRoles(roles) {
    this.userRoles.clear();
    roles.forEach(role => this.userRoles.add(role));
    this.updatePermissionsFromRoles();
    this.notifyListeners();
  }

  setUserPermissions(permissions) {
    this.userPermissions.clear();
    permissions.forEach(permission => this.userPermissions.add(permission));
    this.notifyListeners();
  }

  setDefaultGuestPermissions() {
    this.userRoles.add(ROLES.GUEST);
    this.updatePermissionsFromRoles();
  }

  updatePermissionsFromRoles() {
    const newPermissions = new Set();

    this.userRoles.forEach(role => {
      const rolePermissions = ROLE_PERMISSIONS[role] || [];
      rolePermissions.forEach(permission => newPermissions.add(permission));
    });

    this.userPermissions = newPermissions;
  }

  hasPermission(permission) {
    return this.userPermissions.has(permission);
  }

  hasAnyPermission(permissions) {
    return permissions.some(permission => this.hasPermission(permission));
  }

  hasAllPermissions(permissions) {
    return permissions.every(permission => this.hasPermission(permission));
  }

  hasRole(role) {
    return this.userRoles.has(role);
  }

  hasAnyRole(roles) {
    return roles.some(role => this.hasRole(role));
  }

  canCreateUser() {
    return this.hasPermission(PERMISSIONS.USER_CREATE);
  }

  canReadUser() {
    return this.hasPermission(PERMISSIONS.USER_READ);
  }

  canUpdateUser() {
    return this.hasPermission(PERMISSIONS.USER_UPDATE);
  }

  canDeleteUser() {
    return this.hasPermission(PERMISSIONS.USER_DELETE);
  }

  canManageTenant() {
    return this.hasAnyPermission([
      PERMISSIONS.TENANT_CREATE,
      PERMISSIONS.TENANT_UPDATE,
      PERMISSIONS.TENANT_DELETE,
    ]);
  }

  canAccessAnalytics() {
    return this.hasPermission(PERMISSIONS.ANALYTICS_READ);
  }

  canExportAnalytics() {
    return this.hasPermission(PERMISSIONS.ANALYTICS_EXPORT);
  }

  canManageContent() {
    return this.hasAnyPermission([
      PERMISSIONS.CONTENT_CREATE,
      PERMISSIONS.CONTENT_UPDATE,
      PERMISSIONS.CONTENT_DELETE,
    ]);
  }

  isAdmin() {
    return this.hasAnyRole([ROLES.SUPER_ADMIN, ROLES.TENANT_ADMIN]);
  }

  isSuperAdmin() {
    return this.hasRole(ROLES.SUPER_ADMIN);
  }

  // Cache management
  clearCache() {
    this.permissionCache.clear();
  }

  // Utility methods for components
  getAccessibleRoutes(routes) {
    return routes.filter(route => {
      if (route.public) return true;
      if (route.adminOnly && !this.isAdmin()) return false;
      if (route.permissions && !this.hasAnyPermission(route.permissions)) return false;
      if (route.roles && !this.hasAnyRole(route.roles)) return false;
      return true;
    });
  }

  // Debug methods
  getDebugInfo() {
    return {
      roles: Array.from(this.userRoles),
      permissions: Array.from(this.userPermissions),
      isAdmin: this.isAdmin(),
      isSuperAdmin: this.isSuperAdmin(),
      tenant: tenantService.getTenant()?.slug,
    };
  }
}

// Export singleton instance
export const rbacService = new RBACService();