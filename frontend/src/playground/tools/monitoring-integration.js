/**
 * Monitoring Integration
 *
 * Sets up comprehensive monitoring for deployed applications including:
 * - Uptime monitoring
 * - Performance tracking
 * - Error tracking and alerting
 * - Custom metrics collection
 */

export class MonitoringIntegration {
  constructor() {
    this.providers = this.initializeProviders();
    this.templates = this.initializeTemplates();
  }

  /**
   * Generate complete monitoring setup for deployed application
   */
  generateMonitoringSetup(appConfig, deploymentResult) {
    const setup = {
      config: this.generateMonitoringConfig(appConfig, deploymentResult),
      files: this.generateMonitoringFiles(appConfig, deploymentResult),
      integrations: this.generateIntegrations(appConfig, deploymentResult),
      dashboards: this.generateDashboards(appConfig, deploymentResult),
      alerts: this.generateAlerts(appConfig, deploymentResult)
    };

    return setup;
  }

  /**
   * Generate monitoring configuration
   */
  generateMonitoringConfig(appConfig, deploymentResult) {
    return {
      service: {
        name: appConfig.name,
        version: appConfig.version || '1.0.0',
        environment: deploymentResult.environment || 'production',
        platform: deploymentResult.platform,
        url: deploymentResult.url
      },
      endpoints: {
        health: this.getHealthEndpoints(appConfig, deploymentResult.url),
        metrics: this.getMetricsEndpoints(appConfig, deploymentResult.url),
        api: this.getAPIEndpoints(appConfig, deploymentResult.url)
      },
      monitoring: {
        uptime: {
          enabled: true,
          interval: 60, // seconds
          timeout: 30,
          locations: ['us-east', 'eu-west', 'ap-southeast']
        },
        performance: {
          enabled: true,
          thresholds: {
            loadTime: 3000,
            firstPaint: 1500,
            lcp: 2500, // Largest Contentful Paint
            fid: 100,  // First Input Delay
            cls: 0.1   // Cumulative Layout Shift
          }
        },
        errors: {
          enabled: true,
          sampling: 1.0,
          ignorePatterns: [
            '/favicon.ico',
            '/health',
            '/_next/static'
          ]
        },
        logs: {
          enabled: true,
          level: 'info',
          retention: 30 // days
        }
      },
      alerts: this.generateAlertRules(appConfig)
    };
  }

  /**
   * Generate monitoring files for embedding in application
   */
  generateMonitoringFiles(appConfig, deploymentResult) {
    const files = [];

    // Analytics and monitoring script
    files.push({
      path: 'src/utils/monitoring.js',
      content: this.generateMonitoringScript(appConfig, deploymentResult)
    });

    // Performance monitoring
    files.push({
      path: 'src/utils/performance-monitor.js',
      content: this.generatePerformanceMonitor(appConfig)
    });

    // Error tracking
    files.push({
      path: 'src/utils/error-tracker.js',
      content: this.generateErrorTracker(appConfig)
    });

    // Custom metrics
    files.push({
      path: 'src/utils/custom-metrics.js',
      content: this.generateCustomMetrics(appConfig)
    });

    // Monitoring middleware (for backend apps)
    if (appConfig.type === 'fullstack' || appConfig.type === 'api-only') {
      files.push({
        path: 'src/middleware/monitoring.js',
        content: this.generateMonitoringMiddleware(appConfig)
      });
    }

    // Uptime monitoring configuration
    files.push({
      path: 'monitoring/uptime-config.json',
      content: JSON.stringify(this.generateUptimeConfig(appConfig, deploymentResult), null, 2)
    });

    return files;
  }

  /**
   * Generate monitoring script
   */
  generateMonitoringScript(appConfig, deploymentResult) {
    return `/**
 * Application Monitoring Script
 * Generated for ${appConfig.name}
 */

class ApplicationMonitor {
  constructor(config = {}) {
    this.config = {
      serviceName: '${appConfig.name}',
      version: '${appConfig.version || '1.0.0'}',
      environment: '${deploymentResult.environment || 'production'}',
      endpoint: '/api/metrics',
      batchSize: 10,
      flushInterval: 5000,
      ...config
    };

    this.metrics = [];
    this.errors = [];
    this.performance = {
      navigation: null,
      vitals: {}
    };

    this.init();
  }

  /**
   * Initialize monitoring
   */
  init() {
    this.setupPerformanceMonitoring();
    this.setupErrorTracking();
    this.setupUserInteractionTracking();
    this.setupCustomEventTracking();
    this.startBatchReporting();

    console.log('📊 Monitoring initialized for ${appConfig.name}');
  }

  /**
   * Setup performance monitoring
   */
  setupPerformanceMonitoring() {
    // Navigation timing
    if (performance.timing) {
      const timing = performance.timing;
      this.performance.navigation = {
        dns: timing.domainLookupEnd - timing.domainLookupStart,
        connect: timing.connectEnd - timing.connectStart,
        request: timing.responseStart - timing.requestStart,
        response: timing.responseEnd - timing.responseStart,
        dom: timing.domContentLoadedEventEnd - timing.navigationStart,
        load: timing.loadEventEnd - timing.navigationStart
      };
    }

    // Core Web Vitals
    this.observeWebVitals();

    // Resource timing
    this.observeResourceTiming();

    // Long tasks
    this.observeLongTasks();
  }

  /**
   * Observe Core Web Vitals
   */
  observeWebVitals() {
    // First Contentful Paint (FCP)
    this.observePerformanceEntry('paint', (entries) => {
      const fcp = entries.find(entry => entry.name === 'first-contentful-paint');
      if (fcp) {
        this.recordMetric('web-vital', 'fcp', fcp.startTime);
      }
    });

    // Largest Contentful Paint (LCP)
    this.observePerformanceEntry('largest-contentful-paint', (entries) => {
      const lcp = entries[entries.length - 1];
      if (lcp) {
        this.recordMetric('web-vital', 'lcp', lcp.startTime);
      }
    });

    // First Input Delay (FID)
    this.observePerformanceEntry('first-input', (entries) => {
      const fid = entries[0];
      if (fid) {
        this.recordMetric('web-vital', 'fid', fid.processingStart - fid.startTime);
      }
    });

    // Cumulative Layout Shift (CLS)
    let clsValue = 0;
    this.observePerformanceEntry('layout-shift', (entries) => {
      entries.forEach(entry => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      });
      this.recordMetric('web-vital', 'cls', clsValue);
    });
  }

  /**
   * Observe performance entries
   */
  observePerformanceEntry(type, callback) {
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          callback(list.getEntries());
        });
        observer.observe({ entryTypes: [type] });
      } catch (error) {
        console.warn(\`Performance observer for \${type} not supported:, error\`);
      }
    }
  }

  /**
   * Observe resource timing
   */
  observeResourceTiming() {
    this.observePerformanceEntry('resource', (entries) => {
      entries.forEach(entry => {
        if (entry.duration > 1000) { // Only report slow resources
          this.recordMetric('resource-timing', entry.name, {
            duration: entry.duration,
            size: entry.transferSize,
            type: this.getResourceType(entry.name)
          });
        }
      });
    });
  }

  /**
   * Observe long tasks
   */
  observeLongTasks() {
    this.observePerformanceEntry('longtask', (entries) => {
      entries.forEach(entry => {
        this.recordMetric('long-task', 'main-thread-blocking', {
          duration: entry.duration,
          startTime: entry.startTime
        });
      });
    });
  }

  /**
   * Setup error tracking
   */
  setupErrorTracking() {
    // JavaScript errors
    window.addEventListener('error', (event) => {
      this.recordError('javascript', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error?.stack
      });
    });

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.recordError('promise-rejection', {
        reason: event.reason?.toString(),
        stack: event.reason?.stack
      });
    });

    // Resource loading errors
    window.addEventListener('error', (event) => {
      if (event.target !== window) {
        this.recordError('resource-error', {
          source: event.target.src || event.target.href,
          type: event.target.tagName
        });
      }
    }, true);
  }

  /**
   * Setup user interaction tracking
   */
  setupUserInteractionTracking() {
    // Page visibility
    document.addEventListener('visibilitychange', () => {
      this.recordMetric('user-interaction', 'visibility', {
        hidden: document.hidden,
        timestamp: Date.now()
      });
    });

    // Click tracking (for important elements)
    document.addEventListener('click', (event) => {
      if (event.target.matches('button, [role="button"], .trackable')) {
        this.recordMetric('user-interaction', 'click', {
          element: event.target.tagName.toLowerCase(),
          id: event.target.id,
          class: event.target.className
        });
      }
    });
  }

  /**
   * Setup custom event tracking
   */
  setupCustomEventTracking() {
    // Listen for custom monitoring events
    window.addEventListener('monitor', (event) => {
      this.recordMetric('custom', event.detail.type, event.detail.data);
    });
  }

  /**
   * Record metric
   */
  recordMetric(category, name, value) {
    this.metrics.push({
      category,
      name,
      value,
      timestamp: Date.now(),
      url: window.location.pathname,
      userAgent: navigator.userAgent.substring(0, 100) // Truncate for privacy
    });
  }

  /**
   * Record error
   */
  recordError(type, details) {
    this.errors.push({
      type,
      details,
      timestamp: Date.now(),
      url: window.location.pathname,
      userAgent: navigator.userAgent.substring(0, 100)
    });
  }

  /**
   * Start batch reporting
   */
  startBatchReporting() {
    setInterval(() => {
      this.flushData();
    }, this.config.flushInterval);

    // Flush on page unload
    window.addEventListener('beforeunload', () => {
      this.flushData(true);
    });
  }

  /**
   * Flush data to server
   */
  async flushData(immediate = false) {
    if (this.metrics.length === 0 && this.errors.length === 0) {
      return;
    }

    const payload = {
      service: this.config.serviceName,
      version: this.config.version,
      environment: this.config.environment,
      timestamp: Date.now(),
      metrics: this.metrics.splice(0, this.config.batchSize),
      errors: this.errors.splice(0, this.config.batchSize)
    };

    try {
      if (immediate && navigator.sendBeacon) {
        // Use sendBeacon for immediate flushing (page unload)
        navigator.sendBeacon(
          this.config.endpoint,
          JSON.stringify(payload)
        );
      } else {
        // Regular fetch for scheduled flushing
        await fetch(this.config.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }
    } catch (error) {
      console.warn('Failed to send monitoring data:', error);
      // Put data back in queue for retry
      this.metrics.unshift(...payload.metrics);
      this.errors.unshift(...payload.errors);
    }
  }

  /**
   * Get resource type from URL
   */
  getResourceType(url) {
    if (url.match(/\\.(js|mjs)($|\\?)/)) return 'script';
    if (url.match(/\\.(css)($|\\?)/)) return 'stylesheet';
    if (url.match(/\\.(png|jpg|jpeg|gif|webp|svg)($|\\?)/)) return 'image';
    if (url.match(/\\.(woff|woff2|ttf|eot)($|\\?)/)) return 'font';
    return 'other';
  }

  /**
   * Manual metric recording for custom events
   */
  track(category, name, value) {
    this.recordMetric(category, name, value);
  }

  /**
   * Get current performance summary
   */
  getPerformanceSummary() {
    return {
      navigation: this.performance.navigation,
      vitals: this.performance.vitals,
      metricsQueued: this.metrics.length,
      errorsQueued: this.errors.length
    };
  }
}

// Initialize monitoring
const monitor = new ApplicationMonitor();

// Export for manual usage
export default monitor;

// Global access for debugging
if (typeof window !== 'undefined') {
  window.monitor = monitor;
}`;
  }

  /**
   * Generate performance monitor
   */
  generatePerformanceMonitor(appConfig) {
    return `/**
 * Performance Monitor for ${appConfig.name}
 * Tracks and reports application performance metrics
 */

export class PerformanceMonitor {
  constructor() {
    this.thresholds = {
      loadTime: 3000,
      firstPaint: 1500,
      lcp: 2500,
      fid: 100,
      cls: 0.1
    };

    this.measurements = new Map();
    this.watchers = new Set();

    this.startMonitoring();
  }

  /**
   * Start performance monitoring
   */
  startMonitoring() {
    this.monitorPageLoad();
    this.monitorWebVitals();
    this.monitorResourceTiming();
    this.monitorMemoryUsage();
  }

  /**
   * Monitor page load performance
   */
  monitorPageLoad() {
    if (document.readyState === 'complete') {
      this.recordPageLoadMetrics();
    } else {
      window.addEventListener('load', () => {
        this.recordPageLoadMetrics();
      });
    }
  }

  /**
   * Record page load metrics
   */
  recordPageLoadMetrics() {
    const timing = performance.timing;

    const metrics = {
      dns: timing.domainLookupEnd - timing.domainLookupStart,
      connect: timing.connectEnd - timing.connectStart,
      ssl: timing.requestStart - timing.secureConnectionStart,
      ttfb: timing.responseStart - timing.requestStart,
      download: timing.responseEnd - timing.responseStart,
      domReady: timing.domContentLoadedEventEnd - timing.navigationStart,
      loadComplete: timing.loadEventEnd - timing.navigationStart
    };

    this.measurements.set('pageLoad', {
      ...metrics,
      timestamp: Date.now(),
      performant: metrics.loadComplete < this.thresholds.loadTime
    });

    this.notifyWatchers('pageLoad', metrics);
  }

  /**
   * Monitor Web Vitals
   */
  monitorWebVitals() {
    // LCP - Largest Contentful Paint
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];

      this.measurements.set('lcp', {
        value: lastEntry.startTime,
        timestamp: Date.now(),
        performant: lastEntry.startTime < this.thresholds.lcp
      });

      this.notifyWatchers('lcp', lastEntry.startTime);
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // FID - First Input Delay
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const firstInput = entries[0];
      const fid = firstInput.processingStart - firstInput.startTime;

      this.measurements.set('fid', {
        value: fid,
        timestamp: Date.now(),
        performant: fid < this.thresholds.fid
      });

      this.notifyWatchers('fid', fid);
    }).observe({ entryTypes: ['first-input'] });

    // CLS - Cumulative Layout Shift
    let clsValue = 0;
    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      }

      this.measurements.set('cls', {
        value: clsValue,
        timestamp: Date.now(),
        performant: clsValue < this.thresholds.cls
      });

      this.notifyWatchers('cls', clsValue);
    }).observe({ entryTypes: ['layout-shift'] });
  }

  /**
   * Monitor resource timing
   */
  monitorResourceTiming() {
    new PerformanceObserver((entryList) => {
      const resources = entryList.getEntries().map(entry => ({
        name: entry.name,
        duration: entry.duration,
        size: entry.transferSize,
        type: this.getResourceType(entry.name),
        slow: entry.duration > 1000
      }));

      const slowResources = resources.filter(r => r.slow);

      if (slowResources.length > 0) {
        this.measurements.set('slowResources', {
          resources: slowResources,
          timestamp: Date.now()
        });

        this.notifyWatchers('slowResources', slowResources);
      }
    }).observe({ entryTypes: ['resource'] });
  }

  /**
   * Monitor memory usage
   */
  monitorMemoryUsage() {
    if (performance.memory) {
      setInterval(() => {
        const memory = {
          used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
          total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
          limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
        };

        memory.percentage = Math.round((memory.used / memory.limit) * 100);
        memory.healthy = memory.percentage < 80;

        this.measurements.set('memory', {
          ...memory,
          timestamp: Date.now()
        });

        if (!memory.healthy) {
          this.notifyWatchers('memoryWarning', memory);
        }
      }, 10000); // Check every 10 seconds
    }
  }

  /**
   * Get resource type from URL
   */
  getResourceType(url) {
    if (url.match(/\\.(js|mjs)($|\\?)/)) return 'script';
    if (url.match(/\\.(css)($|\\?)/)) return 'stylesheet';
    if (url.match(/\\.(png|jpg|jpeg|gif|webp|svg)($|\\?)/)) return 'image';
    if (url.match(/\\.(woff|woff2|ttf|eot)($|\\?)/)) return 'font';
    return 'other';
  }

  /**
   * Watch performance events
   */
  watch(callback) {
    this.watchers.add(callback);
    return () => this.watchers.delete(callback);
  }

  /**
   * Notify watchers
   */
  notifyWatchers(metric, data) {
    this.watchers.forEach(callback => {
      try {
        callback(metric, data);
      } catch (error) {
        console.error('Performance watcher error:', error);
      }
    });
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary() {
    const summary = {
      timestamp: Date.now(),
      measurements: Object.fromEntries(this.measurements),
      issues: []
    };

    // Check for performance issues
    if (this.measurements.get('pageLoad')?.loadComplete > this.thresholds.loadTime) {
      summary.issues.push('Slow page load time');
    }

    if (this.measurements.get('lcp')?.value > this.thresholds.lcp) {
      summary.issues.push('Poor Largest Contentful Paint');
    }

    if (this.measurements.get('fid')?.value > this.thresholds.fid) {
      summary.issues.push('Poor First Input Delay');
    }

    if (this.measurements.get('cls')?.value > this.thresholds.cls) {
      summary.issues.push('Poor Cumulative Layout Shift');
    }

    return summary;
  }
}

export const performanceMonitor = new PerformanceMonitor();`;
  }

  /**
   * Generate error tracker
   */
  generateErrorTracker(appConfig) {
    return `/**
 * Error Tracker for ${appConfig.name}
 * Comprehensive error tracking and reporting
 */

export class ErrorTracker {
  constructor(config = {}) {
    this.config = {
      maxErrors: 100,
      reportEndpoint: '/api/errors',
      ignorePatterns: [
        /Script error/,
        /Non-Error promise rejection captured/,
        /ResizeObserver loop limit exceeded/
      ],
      ...config
    };

    this.errors = [];
    this.listeners = new Set();

    this.setupErrorHandling();
  }

  /**
   * Setup error handling
   */
  setupErrorHandling() {
    // JavaScript errors
    window.addEventListener('error', this.handleError.bind(this));

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', this.handleRejection.bind(this));

    // Resource errors
    window.addEventListener('error', this.handleResourceError.bind(this), true);
  }

  /**
   * Handle JavaScript errors
   */
  handleError(event) {
    if (this.shouldIgnoreError(event.message)) {
      return;
    }

    const error = {
      type: 'javascript',
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: event.error?.stack,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    this.recordError(error);
  }

  /**
   * Handle unhandled promise rejections
   */
  handleRejection(event) {
    const error = {
      type: 'promise-rejection',
      message: event.reason?.message || 'Unhandled promise rejection',
      reason: event.reason?.toString(),
      stack: event.reason?.stack,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    this.recordError(error);
  }

  /**
   * Handle resource loading errors
   */
  handleResourceError(event) {
    if (event.target === window) return;

    const error = {
      type: 'resource-error',
      message: \`Failed to load resource: \${event.target.src || event.target.href}\`,
      source: event.target.src || event.target.href,
      element: event.target.tagName,
      timestamp: Date.now(),
      url: window.location.href
    };

    this.recordError(error);
  }

  /**
   * Record error
   */
  recordError(error) {
    // Add error context
    error.id = this.generateErrorId();
    error.sessionId = this.getSessionId();
    error.buildVersion = '${appConfig.version || '1.0.0'}';

    // Add browser context
    error.context = {
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      screen: {
        width: screen.width,
        height: screen.height
      },
      online: navigator.onLine,
      cookieEnabled: navigator.cookieEnabled,
      doNotTrack: navigator.doNotTrack
    };

    this.errors.push(error);

    // Limit stored errors
    if (this.errors.length > this.config.maxErrors) {
      this.errors = this.errors.slice(-this.config.maxErrors);
    }

    // Notify listeners
    this.notifyListeners(error);

    // Report immediately for critical errors
    if (this.isCriticalError(error)) {
      this.reportError(error);
    }

    console.error('Error tracked:', error);
  }

  /**
   * Check if error should be ignored
   */
  shouldIgnoreError(message) {
    return this.config.ignorePatterns.some(pattern =>
      pattern.test ? pattern.test(message) : message.includes(pattern)
    );
  }

  /**
   * Check if error is critical
   */
  isCriticalError(error) {
    return error.type === 'javascript' &&
           !error.filename?.includes('extension') &&
           !error.message?.includes('Script error');
  }

  /**
   * Generate error ID
   */
  generateErrorId() {
    return \`error_\${Date.now()}_\${Math.random().toString(36).substr(2, 9)}\`;
  }

  /**
   * Get or create session ID
   */
  getSessionId() {
    let sessionId = sessionStorage.getItem('errorTracker_sessionId');
    if (!sessionId) {
      sessionId = \`session_\${Date.now()}_\${Math.random().toString(36).substr(2, 9)}\`;
      sessionStorage.setItem('errorTracker_sessionId', sessionId);
    }
    return sessionId;
  }

  /**
   * Report error to server
   */
  async reportError(error) {
    try {
      await fetch(this.config.reportEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service: '${appConfig.name}',
          error
        })
      });
    } catch (reportingError) {
      console.warn('Failed to report error:', reportingError);
    }
  }

  /**
   * Add error listener
   */
  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Notify listeners
   */
  notifyListeners(error) {
    this.listeners.forEach(callback => {
      try {
        callback(error);
      } catch (listenerError) {
        console.error('Error listener failed:', listenerError);
      }
    });
  }

  /**
   * Get error summary
   */
  getErrorSummary() {
    const errorCounts = {};
    const recentErrors = this.errors.filter(error =>
      Date.now() - error.timestamp < 3600000 // Last hour
    );

    recentErrors.forEach(error => {
      errorCounts[error.type] = (errorCounts[error.type] || 0) + 1;
    });

    return {
      total: this.errors.length,
      recent: recentErrors.length,
      types: errorCounts,
      critical: this.errors.filter(this.isCriticalError).length
    };
  }

  /**
   * Export errors for debugging
   */
  exportErrors() {
    return {
      errors: this.errors,
      summary: this.getErrorSummary(),
      timestamp: Date.now()
    };
  }
}

export const errorTracker = new ErrorTracker();`;
  }

  /**
   * Generate uptime monitoring configuration
   */
  generateUptimeConfig(appConfig, deploymentResult) {
    return {
      name: appConfig.name,
      url: deploymentResult.url,
      method: 'GET',
      expectedStatus: [200, 301, 302],
      timeout: 30,
      interval: 60,
      retries: 3,
      locations: [
        { id: 'us-east-1', name: 'US East (Virginia)' },
        { id: 'eu-west-1', name: 'EU West (Ireland)' },
        { id: 'ap-southeast-1', name: 'Asia Pacific (Singapore)' }
      ],
      notifications: {
        email: {
          enabled: true,
          addresses: ['alerts@example.com'],
          threshold: 2 // failures before alerting
        },
        webhook: {
          enabled: false,
          url: ''
        }
      },
      thresholds: {
        responseTime: 5000,
        availability: 99.9
      },
      customHeaders: {},
      healthChecks: this.getHealthEndpoints(appConfig, deploymentResult.url).map(endpoint => ({
        name: \`Health Check - \${endpoint}\`,
        url: \`\${deploymentResult.url}\${endpoint}\`,
        expectedContent: 'healthy'
      }))
    };
  }

  /**
   * Get health endpoints
   */
  getHealthEndpoints(appConfig, baseUrl) {
    const endpoints = [];

    if (appConfig.type === 'frontend-only' || appConfig.type === 'static-site') {
      endpoints.push('/health.html');
    }

    if (appConfig.type === 'api-only' || appConfig.type === 'fullstack') {
      endpoints.push('/api/health', '/health');
    }

    return endpoints;
  }

  /**
   * Get metrics endpoints
   */
  getMetricsEndpoints(appConfig, baseUrl) {
    const endpoints = [];

    if (appConfig.type === 'api-only' || appConfig.type === 'fullstack') {
      endpoints.push('/api/metrics', '/metrics');
    }

    return endpoints;
  }

  /**
   * Get API endpoints for monitoring
   */
  getAPIEndpoints(appConfig, baseUrl) {
    const endpoints = [];

    if (appConfig.type === 'api-only' || appConfig.type === 'fullstack') {
      endpoints.push('/api/', '/api/status');
    }

    return endpoints;
  }

  /**
   * Generate alert rules
   */
  generateAlertRules(appConfig) {
    return {
      availability: {
        threshold: 99.0,
        window: '5m',
        severity: 'critical',
        message: \`\${appConfig.name} is experiencing downtime\`
      },
      responseTime: {
        threshold: 5000,
        window: '5m',
        severity: 'warning',
        message: \`\${appConfig.name} response time is high\`
      },
      errorRate: {
        threshold: 0.05,
        window: '5m',
        severity: 'warning',
        message: \`\${appConfig.name} error rate is elevated\`
      },
      healthCheck: {
        threshold: 1,
        window: '1m',
        severity: 'critical',
        message: \`\${appConfig.name} health check is failing\`
      }
    };
  }

  /**
   * Generate integrations
   */
  generateIntegrations(appConfig, deploymentResult) {
    return {
      sentry: this.generateSentryConfig(appConfig),
      logRocket: this.generateLogRocketConfig(appConfig),
      datadog: this.generateDatadogConfig(appConfig),
      newRelic: this.generateNewRelicConfig(appConfig),
      pingdom: this.generatePingdomConfig(appConfig, deploymentResult),
      uptimeRobot: this.generateUptimeRobotConfig(appConfig, deploymentResult)
    };
  }

  /**
   * Generate Sentry configuration
   */
  generateSentryConfig(appConfig) {
    return {
      dsn: 'YOUR_SENTRY_DSN',
      environment: 'production',
      release: appConfig.version || '1.0.0',
      integrations: [
        'BrowserTracing',
        'ReportingObserver'
      ],
      tracesSampleRate: 1.0,
      beforeSend: \`(event) => {
        // Filter out non-critical errors
        if (event.exception) {
          const error = event.exception.values[0];
          if (error.value?.includes('Script error')) {
            return null;
          }
        }
        return event;
      }\`
    };
  }

  /**
   * Generate other integration configs (simplified)
   */
  generateLogRocketConfig(appConfig) {
    return { appId: 'YOUR_LOGROCKET_APP_ID' };
  }

  generateDatadogConfig(appConfig) {
    return {
      applicationId: 'YOUR_DATADOG_APP_ID',
      clientToken: 'YOUR_DATADOG_CLIENT_TOKEN',
      service: appConfig.name
    };
  }

  generateNewRelicConfig(appConfig) {
    return {
      accountId: 'YOUR_NEWRELIC_ACCOUNT_ID',
      licenseKey: 'YOUR_NEWRELIC_LICENSE_KEY',
      applicationName: appConfig.name
    };
  }

  generatePingdomConfig(appConfig, deploymentResult) {
    return {
      name: appConfig.name,
      hostname: new URL(deploymentResult.url).hostname,
      resolution: 1
    };
  }

  generateUptimeRobotConfig(appConfig, deploymentResult) {
    return {
      friendlyName: appConfig.name,
      url: deploymentResult.url,
      type: 1 // HTTP(s)
    };
  }

  /**
   * Generate dashboards
   */
  generateDashboards(appConfig, deploymentResult) {
    return {
      overview: this.generateOverviewDashboard(appConfig),
      performance: this.generatePerformanceDashboard(appConfig),
      errors: this.generateErrorsDashboard(appConfig),
      infrastructure: this.generateInfrastructureDashboard(appConfig)
    };
  }

  generateOverviewDashboard(appConfig) {
    return {
      title: \`\${appConfig.name} - Overview\`,
      widgets: [
        { type: 'availability', timeframe: '24h' },
        { type: 'response_time', timeframe: '24h' },
        { type: 'error_rate', timeframe: '24h' },
        { type: 'traffic', timeframe: '24h' }
      ]
    };
  }

  generatePerformanceDashboard(appConfig) {
    return {
      title: \`\${appConfig.name} - Performance\`,
      widgets: [
        { type: 'core_web_vitals', timeframe: '7d' },
        { type: 'page_load_time', timeframe: '7d' },
        { type: 'resource_timing', timeframe: '7d' },
        { type: 'memory_usage', timeframe: '7d' }
      ]
    };
  }

  generateErrorsDashboard(appConfig) {
    return {
      title: \`\${appConfig.name} - Errors\`,
      widgets: [
        { type: 'error_count', timeframe: '24h' },
        { type: 'error_rate', timeframe: '24h' },
        { type: 'top_errors', timeframe: '7d' },
        { type: 'affected_users', timeframe: '7d' }
      ]
    };
  }

  generateInfrastructureDashboard(appConfig) {
    return {
      title: \`\${appConfig.name} - Infrastructure\`,
      widgets: [
        { type: 'server_response_time', timeframe: '24h' },
        { type: 'database_performance', timeframe: '24h' },
        { type: 'cache_hit_rate', timeframe: '24h' },
        { type: 'cdn_performance', timeframe: '24h' }
      ]
    };
  }

  /**
   * Initialize providers
   */
  initializeProviders() {
    return {
      sentry: { name: 'Sentry', type: 'error-tracking' },
      logRocket: { name: 'LogRocket', type: 'session-replay' },
      datadog: { name: 'Datadog', type: 'full-stack-monitoring' },
      newRelic: { name: 'New Relic', type: 'apm' },
      pingdom: { name: 'Pingdom', type: 'uptime' },
      uptimeRobot: { name: 'UptimeRobot', type: 'uptime' }
    };
  }

  /**
   * Initialize templates
   */
  initializeTemplates() {
    return {
      spa: { name: 'Single Page Application', monitoring: ['performance', 'errors', 'uptime'] },
      api: { name: 'API Service', monitoring: ['uptime', 'performance', 'errors', 'infrastructure'] },
      fullstack: { name: 'Full Stack Application', monitoring: ['uptime', 'performance', 'errors', 'infrastructure', 'user-experience'] }
    };
  }
}

export const monitoringIntegration = new MonitoringIntegration();
