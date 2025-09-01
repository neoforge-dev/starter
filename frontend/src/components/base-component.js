import { LitElement } from "lit";
import { tenantService } from "../services/tenant.js";

/**
 * Base component class that provides common lifecycle management,
 * tenant awareness, and utilities for all components.
 */
export class BaseComponent extends LitElement {
  constructor() {
    super();
    this._bindEventHandlers();
    this.tenant = null;
    this.tenantConfig = {};
    this.tenantUnsubscribe = null;
  }

  /**
   * Override in subclasses to bind event handlers
   */
  _bindEventHandlers() {
    // Override in subclasses to bind event handlers
  }

  /**
   * Enhanced connectedCallback with component readiness and tenant awareness
   */
  async connectedCallback() {
    super.connectedCallback();
    if (process.env.NODE_ENV === 'development') {
      console.log(`Connected: ${this.tagName}`);
    }

    // Initialize tenant awareness
    await this._initializeTenantAwareness();

    await this._ensureReady();
  }

  /**
   * Enhanced firstUpdated with component readiness
   */
  async firstUpdated(changedProperties) {
    await super.firstUpdated(changedProperties);
    if (process.env.NODE_ENV === 'development') {
      console.log(`First updated: ${this.tagName}`);
    }
    await this._ensureReady();
  }

  /**
   * Initialize tenant awareness for the component
   */
  async _initializeTenantAwareness() {
    // Get current tenant
    this.tenant = tenantService.getTenant();
    this.tenantConfig = tenantService.getTenantConfig();

    // Listen for tenant changes
    this.tenantUnsubscribe = tenantService.addListener((tenant) => {
      this.tenant = tenant;
      this.tenantConfig = tenantService.getTenantConfig();
      this.onTenantChanged(tenant);
      this.requestUpdate();
    });

    // Apply tenant-specific styles
    this._applyTenantStyles();
  }

  /**
   * Called when tenant changes - override in subclasses
   */
  onTenantChanged(tenant) {
    // Override in subclasses to handle tenant changes
    if (process.env.NODE_ENV === 'development') {
      console.log(`${this.tagName} tenant changed:`, tenant?.slug);
    }
  }

  /**
   * Apply tenant-specific styles and branding
   */
  _applyTenantStyles() {
    if (!this.tenant) return;

    const styles = tenantService.getTenantStyles();
    Object.entries(styles).forEach(([property, value]) => {
      this.style.setProperty(property, value);
    });

    // Add tenant-specific class
    if (this.tenant.slug && this.tenant.slug !== 'default') {
      this.classList.add(`tenant-${this.tenant.slug}`);
    }
  }

  /**
   * Ensure all nested components are ready
   */
  async _ensureReady() {
    await this.updateComplete;

    // Wait for nested components to be ready
    const nestedComponents = Array.from(this.shadowRoot?.querySelectorAll("*") || [])
      .filter((el) => el.updateComplete);

    if (nestedComponents.length > 0) {
      await Promise.all(nestedComponents.map((el) => el.updateComplete));
    }
  }

  /**
   * Override createRenderRoot to ensure shadow DOM is always created
   */
  createRenderRoot() {
    return this.attachShadow({ mode: "open" });
  }

  /**
   * Tenant-aware fetch method
   */
  async fetchData(url, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Add tenant headers if tenant is active
    if (this.tenant && this.tenant.id !== 'default') {
      headers['X-Tenant-ID'] = this.tenant.uuid || this.tenant.id;
      headers['X-Tenant-Slug'] = this.tenant.slug;
    }

    try {
      const response = await fetch(url, { ...options, headers });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error(`Error fetching ${url}:`, error);
      }
      throw error;
    }
  }

  /**
   * Get tenant-specific API URL
   */
  getTenantApiUrl(endpoint) {
    if (!this.tenant || this.tenant.id === 'default') {
      return endpoint;
    }
    return `/api/v1/tenants/${this.tenant.id}${endpoint}`;
  }

  /**
   * Get tenant-aware class name
   */
  getTenantClassName(baseClass = '') {
    return tenantService.getTenantClassName(baseClass);
  }

  /**
   * Check if tenant is active
   */
  isTenantActive() {
    return tenantService.isTenantActive();
  }

  /**
   * Cleanup tenant listeners
   */
  disconnectedCallback() {
    super.disconnectedCallback();

    if (this.tenantUnsubscribe) {
      this.tenantUnsubscribe();
      this.tenantUnsubscribe = null;
    }
  }
}

export default BaseComponent;
