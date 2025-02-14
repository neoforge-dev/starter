/**
 * Security configuration
 */
export const securityConfig = {
  // CSP nonces for trusted inline scripts
  nonces: {
    scripts: new Set(),
    styles: new Set(),
  },

  // Trusted domains for external resources
  trustedDomains: {
    scripts: ["cdn.jsdelivr.net", "unpkg.com"],
    styles: ["fonts.googleapis.com", "fonts.gstatic.com"],
    images: ["images.neoforge.dev", "cdn.neoforge.dev"],
    connects: ["api.neoforge.dev", "monitoring.neoforge.dev"],
  },

  // CORS configuration
  cors: {
    // Additional allowed origins beyond the default ones
    additionalOrigins: [
      "https://staging.neoforge.dev",
      "https://dev.neoforge.dev",
    ],
    // Methods allowed for CORS requests
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    // Headers allowed in CORS requests
    headers: [
      "Authorization",
      "Content-Type",
      "X-Requested-With",
      "Accept",
      "Origin",
      "X-CSRF-Token",
    ],
  },

  // Security headers configuration
  headers: {
    // HSTS configuration
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
    // Frame ancestors configuration
    frameAncestors: {
      allowed: [], // Empty array means 'none'
    },
    // Referrer policy configuration
    referrerPolicy: "strict-origin-when-cross-origin",
    // Permissions policy configuration
    permissions: {
      camera: [],
      microphone: [],
      geolocation: [],
      payment: [],
      fullscreen: ["self"],
    },
  },

  // Security reporting configuration
  reporting: {
    // Reporting endpoints
    endpoints: {
      default: "https://monitoring.neoforge.dev/reports/default",
      csp: "https://monitoring.neoforge.dev/reports/csp",
      cors: "https://monitoring.neoforge.dev/reports/cors",
      crashes: "https://monitoring.neoforge.dev/reports/crashes",
      deprecations: "https://monitoring.neoforge.dev/reports/deprecations",
    },
    // Report sampling rates (0-1)
    samplingRates: {
      csp: 1.0, // Report all CSP violations
      cors: 0.1, // Report 10% of CORS issues
      crashes: 1.0, // Report all crashes
      deprecations: 0.01, // Report 1% of deprecation warnings
    },
    // Report batching configuration
    batching: {
      maxSize: 100, // Maximum reports per batch
      maxAge: 60000, // Maximum age of a batch in ms (1 minute)
    },
  },

  // XSS protection configuration
  xss: {
    // Enable built-in browser XSS protection
    enableBrowserProtection: true,
    // Mode for XSS protection (block or filter)
    mode: "block",
    // Enable XSS auditor
    enableAuditor: true,
    // Custom XSS patterns to block
    blockPatterns: [
      "<script\\b[^>]*>",
      "javascript:",
      "data:text/html",
      "vbscript:",
    ],
  },

  // Content type options
  contentTypeOptions: {
    // Prevent MIME type sniffing
    nosniff: true,
  },

  // Feature policy configuration
  featurePolicy: {
    // Disable potentially dangerous features
    features: {
      accelerometer: [],
      ambientLightSensor: [],
      autoplay: ["self"],
      battery: [],
      camera: [],
      displayCapture: [],
      documentDomain: [],
      encryptedMedia: ["self"],
      fullscreen: ["self"],
      geolocation: [],
      gyroscope: [],
      magnetometer: [],
      microphone: [],
      midi: [],
      payment: [],
      pictureInPicture: [],
      speaker: [],
      usb: [],
      vibrate: [],
      vr: [],
    },
  },

  // Cookie security configuration
  cookies: {
    // Default cookie options
    defaults: {
      secure: true,
      sameSite: "Strict",
      httpOnly: true,
      path: "/",
    },
    // Session cookie configuration
    session: {
      name: "neoforge_session",
      maxAge: 86400, // 24 hours
    },
    // CSRF token configuration
    csrf: {
      name: "neoforge_csrf",
      maxAge: 3600, // 1 hour
    },
  },

  // Rate limiting configuration
  rateLimit: {
    // Window size in milliseconds
    windowMs: 60000, // 1 minute
    // Maximum requests per window
    max: 100,
    // Response headers
    headers: true,
    // Skip rate limiting for trusted IPs
    trustProxy: true,
    // Custom key generation
    keyGenerator: (req) => req.ip,
  },
};

/**
 * Generate a random nonce for CSP
 * @returns {string} Random nonce
 */
export function generateNonce() {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
    ""
  );
}

/**
 * Add a trusted domain to the configuration
 * @param {string} type - Domain type (scripts, styles, images, connects)
 * @param {string} domain - Domain to add
 */
export function addTrustedDomain(type, domain) {
  if (securityConfig.trustedDomains[type]) {
    securityConfig.trustedDomains[type].push(domain);
  }
}

/**
 * Add an allowed origin for CORS
 * @param {string} origin - Origin to allow
 */
export function addAllowedOrigin(origin) {
  securityConfig.cors.additionalOrigins.push(origin);
}

/**
 * Update security header configuration
 * @param {string} header - Header name
 * @param {Object} config - Header configuration
 */
export function updateHeaderConfig(header, config) {
  if (securityConfig.headers[header]) {
    securityConfig.headers[header] = {
      ...securityConfig.headers[header],
      ...config,
    };
  }
}

/**
 * Update rate limiting configuration
 * @param {Object} config - Rate limiting configuration
 */
export function updateRateLimitConfig(config) {
  securityConfig.rateLimit = {
    ...securityConfig.rateLimit,
    ...config,
  };
}

/**
 * Get current security configuration
 * @returns {Object} Current security configuration
 */
export function getSecurityConfig() {
  return { ...securityConfig };
}
