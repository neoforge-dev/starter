/**
 * Tenant service for managing multi-tenant frontend functionality
 * Handles tenant context, branding, and tenant-specific configurations
 */

import { Logger } from "../utils/logger.js";

export class TenantService {
  constructor() {
    this.currentTenant = null;
    this.tenantConfig = {};
    this.listeners = new Set();
    this.initialized = false;
  }

  addListener(callback) {
    this.listeners.add(callback);
    if (this.currentTenant) {
      callback(this.currentTenant);
    }
    return () => this.listeners.delete(callback);
  }

  notifyListeners() {
    this.listeners.forEach(callback => callback(this.currentTenant));
  }

  async initialize() {
    if (this.initialized) return;

    try {
      // Get tenant context from current domain/subdomain
      await this.resolveTenantFromDomain();

      // Load tenant configuration
      await this.loadTenantConfig();

      this.initialized = true;
      this.notifyListeners();

      Logger.info("Tenant service initialized", {
        tenant: this.currentTenant?.slug,
        domain: this.currentTenant?.domain
      });
    } catch (error) {
      Logger.error("Failed to initialize tenant service", error);
      // Fallback to default tenant
      this.setDefaultTenant();
    }
  }

  async resolveTenantFromDomain() {
    const hostname = window.location.hostname;
    const subdomain = this.extractSubdomain(hostname);

    try {
      // Try to resolve tenant from subdomain or custom domain
      const response = await fetch('/api/v1/tenants/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hostname, subdomain })
      });

      if (response.ok) {
        const tenantData = await response.json();
        this.setTenant(tenantData);
      } else {
        // Fallback to default tenant
        this.setDefaultTenant();
      }
    } catch (error) {
      Logger.warn("Tenant resolution failed, using default", error);
      this.setDefaultTenant();
    }
  }

  extractSubdomain(hostname) {
    // Handle localhost and IP addresses
    if (hostname === 'localhost' || hostname.match(/^\d+\.\d+\.\d+\.\d+$/)) {
      return null;
    }

    const parts = hostname.split('.');
    if (parts.length > 2) {
      // Skip common subdomains
      const subdomain = parts[0];
      if (!['www', 'api', 'app', 'admin', 'dev', 'staging'].includes(subdomain)) {
        return subdomain;
      }
    }
    return null;
  }

  async loadTenantConfig() {
    if (!this.currentTenant?.id) return;

    try {
      const response = await fetch(`/api/v1/tenants/${this.currentTenant.id}/config`);
      if (response.ok) {
        this.tenantConfig = await response.json();
        this.applyTenantBranding();
      }
    } catch (error) {
      Logger.warn("Failed to load tenant config", error);
    }
  }

  setTenant(tenantData) {
    this.currentTenant = {
      id: tenantData.id,
      slug: tenantData.slug,
      name: tenantData.name,
      domain: tenantData.domain,
      logo: tenantData.logo,
      primaryColor: tenantData.primary_color,
      secondaryColor: tenantData.secondary_color,
      settings: tenantData.settings || {}
    };
    this.notifyListeners();
  }

  setDefaultTenant() {
    this.currentTenant = {
      id: 'default',
      slug: 'default',
      name: 'NeoForge',
      domain: window.location.hostname,
      logo: '/logo.png',
      primaryColor: '#007bff',
      secondaryColor: '#6c757d',
      settings: {}
    };
    this.notifyListeners();
  }

  applyTenantBranding() {
    if (!this.currentTenant) return;

    const root = document.documentElement;

    // Apply CSS custom properties for theming
    if (this.currentTenant.primaryColor) {
      root.style.setProperty('--tenant-primary-color', this.currentTenant.primaryColor);
    }
    if (this.currentTenant.secondaryColor) {
      root.style.setProperty('--tenant-secondary-color', this.currentTenant.secondaryColor);
    }

    // Update favicon if tenant has custom logo
    if (this.currentTenant.logo) {
      this.updateFavicon(this.currentTenant.logo);
    }

    // Update document title
    if (this.currentTenant.name) {
      document.title = `${this.currentTenant.name} - ${document.title.split(' - ').pop()}`;
    }
  }

  updateFavicon(logoUrl) {
    const favicon = document.querySelector('link[rel="icon"]');
    if (favicon) {
      favicon.href = logoUrl;
    }
  }

  getTenant() {
    return this.currentTenant;
  }

  getTenantConfig() {
    return this.tenantConfig;
  }

  isTenantActive() {
    return this.currentTenant && this.currentTenant.id !== 'default';
  }

  // Tenant-specific API calls
  async getTenantUsers() {
    if (!this.currentTenant?.id) return [];
    try {
      const response = await fetch(`/api/v1/tenants/${this.currentTenant.id}/users`);
      return response.ok ? await response.json() : [];
    } catch (error) {
      Logger.error("Failed to fetch tenant users", error);
      return [];
    }
  }

  async getTenantSettings() {
    if (!this.currentTenant?.id) return {};
    try {
      const response = await fetch(`/api/v1/tenants/${this.currentTenant.id}/settings`);
      return response.ok ? await response.json() : {};
    } catch (error) {
      Logger.error("Failed to fetch tenant settings", error);
      return {};
    }
  }

  // Utility methods for tenant-aware components
  getTenantClassName(baseClass = '') {
    if (!this.currentTenant?.slug) return baseClass;
    return `${baseClass} tenant-${this.currentTenant.slug}`.trim();
  }

  getTenantStyles() {
    if (!this.currentTenant) return {};

    return {
      '--primary-color': this.currentTenant.primaryColor,
      '--secondary-color': this.currentTenant.secondaryColor,
    };
  }
}

// Export singleton instance
export const tenantService = new TenantService();