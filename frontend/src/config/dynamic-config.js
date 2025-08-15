/**
 * Dynamic configuration service that fetches config from backend
 * Eliminates hardcoded duplication between frontend and backend
 */

class DynamicConfigService {
  constructor() {
    this.config = null;
    this.loading = false;
    this.error = null;
    this.retryCount = 0;
    this.maxRetries = 3;
  }

  /**
   * Get configuration, fetching from backend if not cached
   */
  async getConfig() {
    if (this.config) {
      return this.config;
    }

    if (this.loading) {
      // If already loading, wait for it to complete
      return this.waitForConfig();
    }

    return this.fetchConfig();
  }

  /**
   * Force refresh configuration from backend
   */
  async refreshConfig() {
    this.config = null;
    this.error = null;
    this.retryCount = 0;
    return this.fetchConfig();
  }

  /**
   * Get CORS configuration
   */
  async getCorsConfig() {
    const config = await this.getConfig();
    return {
      origins: config.cors_origins,
      methods: config.cors_methods,
      headers: config.cors_headers
    };
  }

  /**
   * Get security headers configuration
   */
  async getSecurityConfig() {
    const config = await this.getConfig();
    return {
      headers: config.security_headers,
      trustedDomains: config.trusted_domains,
      cspNonceRequired: config.csp_nonce_required,
      reportingEnabled: config.reporting_enabled
    };
  }

  /**
   * Get API base URL
   */
  async getApiBaseUrl() {
    const config = await this.getConfig();
    return config.api_base_url;
  }

  /**
   * Check if running in production environment
   */
  async isProduction() {
    const config = await this.getConfig();
    return config.environment === 'production';
  }

  /**
   * Fetch configuration from backend
   */
  async fetchConfig() {
    this.loading = true;
    this.error = null;

    try {
      // Resolve base URL robustly for node/jsdom environments
      const base = (typeof window !== 'undefined' && window.location && window.location.origin)
        ? window.location.origin
        : 'http://localhost';
      const response = await fetch(new URL('/api/v1/config', base), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        cache: 'no-cache'
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch config: ${response.status} ${response.statusText}`);
      }

      const config = await response.json();
      
      // Validate required fields
      if (!config.environment || !config.api_base_url) {
        throw new Error('Invalid configuration response: missing required fields');
      }

      this.config = config;
      this.error = null;
      this.retryCount = 0;

      console.log('Dynamic configuration loaded:', {
        environment: config.environment,
        corsOrigins: config.cors_origins?.length || 0,
        apiBaseUrl: config.api_base_url
      });

      return this.config;

    } catch (error) {
      console.error('Failed to fetch dynamic configuration:', error);
      this.error = error;

      // Retry logic
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        console.log(`Retrying configuration fetch (${this.retryCount}/${this.maxRetries})...`);
        
        // Exponential backoff
        const delay = Math.pow(2, this.retryCount) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        
        return this.fetchConfig();
      }

      // Fallback to basic config if all retries fail
      console.warn('All configuration retries failed, using fallback config');
      this.config = this.getFallbackConfig();
      return this.config;

    } finally {
      this.loading = false;
    }
  }

  /**
   * Wait for ongoing config fetch to complete
   */
  async waitForConfig() {
    while (this.loading) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return this.config || this.getFallbackConfig();
  }

  /**
   * Get fallback configuration for offline/error scenarios
   */
  getFallbackConfig() {
    return {
      environment: 'development',
      api_base_url: '/api/v1',
      cors_origins: ['http://localhost:3000'],
      cors_methods: ['GET', 'POST', 'PUT', 'DELETE'],
      cors_headers: ['Content-Type', 'Authorization'],
      security_headers: {
        frame_ancestors: [],
        referrer_policy: 'strict-origin-when-cross-origin'
      },
      trusted_domains: {
        scripts: [],
        styles: [],
        images: [],
        connects: []
      },
      csp_nonce_required: false,
      reporting_enabled: false
    };
  }

  /**
   * Get current configuration status
   */
  getStatus() {
    return {
      loaded: !!this.config,
      loading: this.loading,
      error: this.error,
      retryCount: this.retryCount
    };
  }
}

// Export singleton instance
export const dynamicConfig = new DynamicConfigService();

// Export class for testing
export { DynamicConfigService };

// Initialize configuration on module load
dynamicConfig.getConfig().catch(error => {
  console.warn('Failed to initialize dynamic configuration:', error);
});