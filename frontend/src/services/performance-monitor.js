/**
 * Service to monitor and report performance metrics
 */
class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.observers = new Set();
    this.budgets = {
      fcp: 1800, // First Contentful Paint (ms)
      lcp: 2500, // Largest Contentful Paint (ms)
      fid: 100, // First Input Delay (ms)
      cls: 0.1, // Cumulative Layout Shift
      tbt: 300, // Total Blocking Time (ms)
    };
    this._setupObservers();
  }

  /**
   * Initialize performance monitoring
   */
  initialize() {
    // Report initial metrics
    this._reportInitialMetrics();
    // Start monitoring
    this._startMonitoring();
  }

  /**
   * Subscribe to performance updates
   * @param {Function} callback
   */
  subscribe(callback) {
    this.observers.add(callback);
    // Send current metrics immediately
    callback(Object.fromEntries(this.metrics));
    return () => this.observers.delete(callback);
  }

  /**
   * Update performance budget
   * @param {string} metric
   * @param {number} value
   */
  updateBudget(metric, value) {
    if (metric in this.budgets) {
      this.budgets[metric] = value;
      this._checkBudgets();
    }
  }

  /**
   * Set up performance observers
   */
  _setupObservers() {
    // Observe paint timing
    if ("PerformanceObserver" in window) {
      // First Contentful Paint
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const fcp = entries[entries.length - 1];
        this._updateMetric("fcp", fcp.startTime);
      }).observe({ entryTypes: ["paint"] });

      // Largest Contentful Paint
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lcp = entries[entries.length - 1];
        this._updateMetric("lcp", lcp.startTime);
      }).observe({ entryTypes: ["largest-contentful-paint"] });

      // First Input Delay
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const fid = entries[0];
        this._updateMetric("fid", fid.processingStart - fid.startTime);
      }).observe({ entryTypes: ["first-input"] });

      // Layout Shifts
      new PerformanceObserver((list) => {
        let cumulativeScore = 0;
        for (const entry of list.getEntries()) {
          cumulativeScore += entry.value;
        }
        this._updateMetric("cls", cumulativeScore);
      }).observe({ entryTypes: ["layout-shift"] });

      // Long Tasks
      new PerformanceObserver((list) => {
        let totalBlockingTime = 0;
        for (const entry of list.getEntries()) {
          totalBlockingTime += entry.duration - 50; // Tasks longer than 50ms
        }
        this._updateMetric("tbt", totalBlockingTime);
      }).observe({ entryTypes: ["longtask"] });

      // Resource Timing
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this._processResourceTiming(entry);
        }
      }).observe({ entryTypes: ["resource"] });
    }
  }

  /**
   * Report initial performance metrics
   */
  _reportInitialMetrics() {
    // Navigation Timing
    const navigation = performance.getEntriesByType("navigation")[0];
    if (navigation) {
      this._updateMetric("ttfb", navigation.responseStart);
      this._updateMetric("domLoad", navigation.domContentLoadedEventEnd);
      this._updateMetric("windowLoad", navigation.loadEventEnd);
    }

    // Memory usage if available
    if (performance.memory) {
      this._updateMetric("jsHeapSize", performance.memory.usedJSHeapSize);
      this._updateMetric("totalHeapSize", performance.memory.totalJSHeapSize);
    }
  }

  /**
   * Start continuous monitoring
   */
  _startMonitoring() {
    // Monitor frame rate
    let lastTime = performance.now();
    let frames = 0;

    const checkFPS = () => {
      frames++;
      const now = performance.now();
      if (now - lastTime > 1000) {
        this._updateMetric(
          "fps",
          Math.round((frames * 1000) / (now - lastTime))
        );
        frames = 0;
        lastTime = now;
      }
      requestAnimationFrame(checkFPS);
    };
    requestAnimationFrame(checkFPS);

    // Monitor memory periodically
    if (performance.memory) {
      setInterval(() => {
        this._updateMetric("jsHeapSize", performance.memory.usedJSHeapSize);
        this._updateMetric("totalHeapSize", performance.memory.totalJSHeapSize);
      }, 5000);
    }
  }

  /**
   * Process resource timing entry
   * @param {PerformanceResourceTiming} entry
   */
  _processResourceTiming(entry) {
    const size = entry.decodedBodySize || entry.encodedBodySize || 0;
    const duration = entry.duration;
    const type = entry.initiatorType;

    this._updateMetric(
      `resourceCount_${type}`,
      (this.metrics.get(`resourceCount_${type}`) || 0) + 1
    );
    this._updateMetric(
      `resourceSize_${type}`,
      (this.metrics.get(`resourceSize_${type}`) || 0) + size
    );
    this._updateMetric(
      `resourceTime_${type}`,
      (this.metrics.get(`resourceTime_${type}`) || 0) + duration
    );
  }

  /**
   * Update a metric value
   * @param {string} name
   * @param {number} value
   */
  _updateMetric(name, value) {
    this.metrics.set(name, value);
    this._notifyObservers();
    this._checkBudgets();
  }

  /**
   * Check metrics against budgets
   */
  _checkBudgets() {
    for (const [metric, budget] of Object.entries(this.budgets)) {
      const value = this.metrics.get(metric);
      if (value && value > budget) {
        this._reportBudgetViolation(metric, value, budget);
      }
    }
  }

  /**
   * Report a budget violation
   * @param {string} metric
   * @param {number} value
   * @param {number} budget
   */
  _reportBudgetViolation(metric, value, budget) {
    const event = new CustomEvent("performance-budget-violation", {
      detail: {
        metric,
        value,
        budget,
        timestamp: Date.now(),
      },
    });
    window.dispatchEvent(event);
  }

  /**
   * Notify observers of metric updates
   */
  _notifyObservers() {
    const metrics = Object.fromEntries(this.metrics);
    this.observers.forEach((callback) => callback(metrics));
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();
