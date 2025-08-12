/**
 * Security configuration - now uses dynamic config from backend
 * Eliminates hardcoded duplication and creates single source of truth
 */

import { dynamicConfig } from './dynamic-config.js';

/**
 * Security configuration that adapts to backend settings
 */
export class SecurityConfig {
  constructor() {
    this.nonces = {
      scripts: new Set(),
      styles: new Set(),
    };
  }

  /**
   * Get CORS configuration from backend
   */
  async getCorsConfig() {
    return dynamicConfig.getCorsConfig();
  }

  /**
   * Get trusted domains from backend
   */
  async getTrustedDomains() {
    const config = await dynamicConfig.getSecurityConfig();
    return config.trustedDomains;
  }

  /**
   * Get security headers configuration from backend
   */
  async getSecurityHeaders() {
    const config = await dynamicConfig.getSecurityConfig();
    return config.headers;
  }

  /**
   * Check if CSP nonces are required (production mode)
   */
  async requiresNonces() {
    const config = await dynamicConfig.getSecurityConfig();
    return config.cspNonceRequired;
  }

  /**
   * Check if security reporting is enabled
   */
  async isReportingEnabled() {
    const config = await dynamicConfig.getSecurityConfig();
    return config.reportingEnabled;
  }

  /**
   * Generate and store a nonce for scripts
   */
  generateScriptNonce() {
    const nonce = this.generateNonce();
    this.nonces.scripts.add(nonce);
    return nonce;
  }

  /**
   * Generate and store a nonce for styles
   */
  generateStyleNonce() {
    const nonce = this.generateNonce();
    this.nonces.styles.add(nonce);
    return nonce;
  }

  /**
   * Generate a random nonce
   */
  generateNonce() {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode.apply(null, array));
  }

  /**
   * Clear old nonces
   */
  clearNonces() {
    this.nonces.scripts.clear();
    this.nonces.styles.clear();
  }

  /**
   * Build Content Security Policy header value
   */
  async buildCSPHeader() {
    const config = await dynamicConfig.getSecurityConfig();
    const trustedDomains = config.trustedDomains;
    const isProduction = await dynamicConfig.isProduction();

    const csp = {
      'default-src': ["'self'"],
      'script-src': [
        "'self'",
        ...trustedDomains.scripts
      ],
      'style-src': [
        "'self'",
        "'unsafe-inline'", // Required for many CSS-in-JS libraries
        ...trustedDomains.styles
      ],
      'img-src': [
        "'self'",
        'data:',
        'https:',
        ...trustedDomains.images
      ],
      'connect-src': [
        "'self'",
        ...trustedDomains.connects
      ],
      'font-src': [
        "'self'",
        'https:',
        'data:'
      ],
      'object-src': ["'none'"],
      'frame-ancestors': ["'none'"],
      'form-action': ["'self'"],
      'base-uri': ["'self'"]
    };

    // Add nonces in production if available
    if (isProduction && this.nonces.scripts.size > 0) {
      const nonceValues = Array.from(this.nonces.scripts)
        .map(nonce => `'nonce-${nonce}'`);
      csp['script-src'].push(...nonceValues);
    } else if (!isProduction) {
      // Allow unsafe-eval in development for tools like Vite
      csp['script-src'].push("'unsafe-inline'", "'unsafe-eval'");
    }

    // Build CSP string
    return Object.entries(csp)
      .map(([key, values]) => `${key} ${values.join(' ')}`)
      .join('; ');
  }

  /**
   * Validate if a URL is from a trusted domain
   */
  async isTrustedDomain(url, type = 'connects') {
    try {
      const trustedDomains = await this.getTrustedDomains();
      const allowedDomains = trustedDomains[type] || [];
      const urlObj = new URL(url);
      
      return allowedDomains.some(domain => {
        return urlObj.hostname === domain || urlObj.hostname.endsWith('.' + domain);
      });
    } catch {
      return false;
    }
  }

  /**
   * Get configuration status for debugging
   */
  async getStatus() {
    const dynamicStatus = dynamicConfig.getStatus();
    const securityConfig = dynamicStatus.loaded ? await this.getSecurityConfig() : null;
    
    return {
      dynamic: dynamicStatus,
      security: {
        configured: !!securityConfig,
        nonces: {
          scripts: this.nonces.scripts.size,
          styles: this.nonces.styles.size
        }
      }
    };
  }
}

// Export singleton instance
export const securityConfig = new SecurityConfig();

// Maintain backward compatibility with legacy code
export default securityConfig;

// Clear nonces periodically to prevent memory leaks
if (typeof window !== 'undefined') {
  setInterval(() => {
    securityConfig.clearNonces();
  }, 300000); // Every 5 minutes
}