/**
 * Security middleware for handling CSP, CORS, and other security headers
 */
class SecurityMiddleware {
  constructor() {
    this.cspDirectives = {
      "default-src": ["'self'"],
      "script-src": [
        "'self'",
        "'wasm-unsafe-eval'", // For WebAssembly
        "'unsafe-inline'", // For inline event handlers in web components
        "https://cdn.jsdelivr.net", // For CDN resources
      ],
      "style-src": ["'self'", "'unsafe-inline'"], // For Lit styles
      "img-src": ["'self'", "data:", "https:", "blob:"],
      "font-src": ["'self'", "https://fonts.gstatic.com"],
      "connect-src": [
        "'self'",
        "https://api.neoforge.dev",
        "wss://api.neoforge.dev",
        "https://monitoring.neoforge.dev",
      ],
      "manifest-src": ["'self'"],
      "worker-src": ["'self'", "blob:"],
      "frame-src": ["'none'"],
      "object-src": ["'none'"],
      "base-uri": ["'self'"],
      "form-action": ["'self'"],
      "frame-ancestors": ["'none'"],
      "upgrade-insecure-requests": [],
    };

    this.corsConfig = {
      allowedOrigins: [
        "https://neoforge.dev",
        "https://app.neoforge.dev",
        "https://api.neoforge.dev",
      ],
      allowedMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "Accept",
        "Origin",
      ],
      exposedHeaders: ["Content-Length", "X-Request-Id"],
      maxAge: 86400, // 24 hours
      credentials: true,
    };

    this.securityHeaders = {
      "Strict-Transport-Security":
        "max-age=31536000; includeSubDomains; preload",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "X-XSS-Protection": "1; mode=block",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Permissions-Policy": this._generatePermissionsPolicy(),
      "Cross-Origin-Embedder-Policy": "require-corp",
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Resource-Policy": "same-origin",
    };
  }

  /**
   * Initialize security middleware
   */
  initialize() {
    this._setupCSP();
    this._setupCORS();
    this._setupSecurityHeaders();
    this._setupReportingEndpoints();
  }

  /**
   * Set up Content Security Policy
   */
  _setupCSP() {
    const cspHeader = this._generateCSPHeader();
    const meta = document.createElement("meta");
    meta.httpEquiv = "Content-Security-Policy";
    meta.content = cspHeader;
    document.head.appendChild(meta);

    // Add report-only CSP for testing new rules
    const reportOnlyMeta = document.createElement("meta");
    reportOnlyMeta.httpEquiv = "Content-Security-Policy-Report-Only";
    reportOnlyMeta.content = this._generateCSPHeader(true);
    document.head.appendChild(reportOnlyMeta);
  }

  /**
   * Set up CORS headers
   */
  _setupCORS() {
    document.addEventListener("fetch", (event) => {
      const request = event.request;
      const origin = request.headers.get("Origin");

      if (origin && this.corsConfig.allowedOrigins.includes(origin)) {
        const headers = new Headers({
          "Access-Control-Allow-Origin": origin,
          "Access-Control-Allow-Methods":
            this.corsConfig.allowedMethods.join(", "),
          "Access-Control-Allow-Headers":
            this.corsConfig.allowedHeaders.join(", "),
          "Access-Control-Expose-Headers":
            this.corsConfig.exposedHeaders.join(", "),
          "Access-Control-Max-Age": this.corsConfig.maxAge.toString(),
        });

        if (this.corsConfig.credentials) {
          headers.set("Access-Control-Allow-Credentials", "true");
        }

        event.respondWith(
          fetch(request).then((response) => {
            const newResponse = new Response(response.body, response);
            headers.forEach((value, key) => {
              newResponse.headers.set(key, value);
            });
            return newResponse;
          })
        );
      }
    });
  }

  /**
   * Set up additional security headers
   */
  _setupSecurityHeaders() {
    // Add security headers as meta tags where possible
    Object.entries(this.securityHeaders).forEach(([header, value]) => {
      if (this._canSetAsMetaTag(header)) {
        const meta = document.createElement("meta");
        meta.httpEquiv = header;
        meta.content = value;
        document.head.appendChild(meta);
      }
    });
  }

  /**
   * Set up security reporting endpoints
   */
  _setupReportingEndpoints() {
    const reportingEndpoints = {
      default: "https://monitoring.neoforge.dev/reports/default",
      csp: "https://monitoring.neoforge.dev/reports/csp",
      cors: "https://monitoring.neoforge.dev/reports/cors",
    };

    // Set up reporting API if supported
    if ("ReportingObserver" in window) {
      const observer = new ReportingObserver(
        (reports) => {
          reports.forEach((report) => {
            fetch(
              reportingEndpoints[report.type] || reportingEndpoints.default,
              {
                method: "POST",
                body: JSON.stringify(report),
                headers: {
                  "Content-Type": "application/json",
                },
              }
            ).catch(console.error);
          });
        },
        {
          buffered: true,
        }
      );

      observer.observe();
    }

    // Add Report-To header
    const reportTo = {
      group: "default",
      max_age: 86400,
      endpoints: [{ url: reportingEndpoints.default }],
    };

    const meta = document.createElement("meta");
    meta.httpEquiv = "Report-To";
    meta.content = JSON.stringify(reportTo);
    document.head.appendChild(meta);
  }

  /**
   * Generate CSP header string
   * @param {boolean} reportOnly - Whether to generate report-only CSP
   * @returns {string}
   */
  _generateCSPHeader(reportOnly = false) {
    const directives = Object.entries(this.cspDirectives).map(
      ([key, values]) => {
        if (values.length === 0) return key;
        return `${key} ${values.join(" ")}`;
      }
    );

    if (reportOnly) {
      directives.push("report-uri https://monitoring.neoforge.dev/reports/csp");
      directives.push("report-to default");
    }

    return directives.join("; ");
  }

  /**
   * Generate Permissions-Policy header value
   * @returns {string}
   */
  _generatePermissionsPolicy() {
    const policies = {
      accelerometer: [],
      "ambient-light-sensor": [],
      autoplay: ["self"],
      battery: [],
      camera: [],
      "display-capture": ["self"],
      "document-domain": [],
      "encrypted-media": ["self"],
      fullscreen: ["self"],
      geolocation: [],
      gyroscope: [],
      magnetometer: [],
      microphone: [],
      midi: [],
      payment: [],
      "picture-in-picture": [],
      "publickey-credentials-get": ["self"],
      "screen-wake-lock": ["self"],
      "sync-xhr": ["self"],
      usb: [],
      "web-share": ["self"],
      "xr-spatial-tracking": [],
    };

    return Object.entries(policies)
      .map(([feature, allowlist]) => {
        if (allowlist.length === 0) return `${feature}=()`;
        return `${feature}=(${allowlist.join(" ")})`;
      })
      .join(", ");
  }

  /**
   * Check if a security header can be set as a meta tag
   * @param {string} header - Header name
   * @returns {boolean}
   */
  _canSetAsMetaTag(header) {
    const metaCompatibleHeaders = [
      "Content-Security-Policy",
      "X-Content-Type-Options",
      "X-Frame-Options",
      "X-XSS-Protection",
      "Referrer-Policy",
    ];

    return metaCompatibleHeaders.includes(header);
  }

  /**
   * Update CSP directive
   * @param {string} directive - CSP directive name
   * @param {string[]} values - Directive values
   */
  updateCSPDirective(directive, values) {
    this.cspDirectives[directive] = values;
    this._setupCSP();
  }

  /**
   * Add allowed origin for CORS
   * @param {string} origin - Origin to allow
   */
  addAllowedOrigin(origin) {
    if (!this.corsConfig.allowedOrigins.includes(origin)) {
      this.corsConfig.allowedOrigins.push(origin);
    }
  }

  /**
   * Update security header
   * @param {string} header - Header name
   * @param {string} value - Header value
   */
  updateSecurityHeader(header, value) {
    this.securityHeaders[header] = value;
    this._setupSecurityHeaders();
  }
}

// Export singleton instance
export const securityMiddleware = new SecurityMiddleware();

// Initialize security middleware
securityMiddleware.initialize();
