/**
 * Analytics Service
 * Handles collection and management of performance metrics, errors, and user behavior data
 */

class AnalyticsService {
  constructor() {
    this.performanceData = new Map();
    this.errorData = [];
    this.userBehaviorData = {
      pageViews: { current: 0, previous: 0, details: [] },
      interactions: { current: 0, previous: 0, details: [] },
      sessions: { current: 0, previous: 0, details: [] },
    };
    this.playgroundData = {
      componentUsage: new Map(),
      searchQueries: [],
      propertyInteractions: new Map(),
      keyboardShortcuts: new Map(),
      sessionDuration: { start: Date.now(), total: 0 },
      performanceMetrics: {
        componentSwitching: [],
        searchResponse: [],
        buildTimes: [],
        memoryUsage: []
      }
    };
    this.observers = new Set();
    this.sessionId = this.generateSessionId();
    this.initializePerformanceObserver();
    this.initializeErrorHandling();
    this.initializeInteractionTracking();
    this.initializePlaygroundTracking();
  }

  generateSessionId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  initializePerformanceObserver() {
    if (!window.PerformanceObserver) return;

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.trackPerformanceMetric(entry);
      }
    });

    try {
      observer.observe({
        entryTypes: [
          "navigation",
          "resource",
          "paint",
          "layout-shift",
          "largest-contentful-paint",
        ],
      });
    } catch (error) {
      console.warn("PerformanceObserver not fully supported:", error);
    }
  }

  initializeErrorHandling() {
    window.addEventListener("error", (event) => {
      this.trackError({
        type: "error",
        message: event.message,
        stack: event.error?.stack,
        timestamp: Date.now(),
      });
    });

    window.addEventListener("unhandledrejection", (event) => {
      this.trackError({
        type: "promise",
        message: event.reason?.message || "Unhandled Promise Rejection",
        stack: event.reason?.stack,
        timestamp: Date.now(),
      });
    });
  }

  initializeInteractionTracking() {
    const trackInteraction = (event) => {
      const path =
        event.target.getAttribute("data-analytics-id") ||
        event.target.id ||
        event.target.tagName.toLowerCase();

      this.trackUserInteraction({
        type: event.type,
        path,
        timestamp: Date.now(),
      });
    };

    window.addEventListener("click", trackInteraction);
    window.addEventListener("submit", trackInteraction);
  }

  trackPerformanceMetric(entry) {
    const metric = {
      name: entry.name,
      type: entry.entryType,
      value:
        entry.entryType === "layout-shift"
          ? entry.value
          : entry.duration || entry.startTime,
      timestamp: Date.now(),
    };

    const metrics = this.performanceData.get(entry.entryType) || [];
    metrics.push(metric);
    this.performanceData.set(entry.entryType, metrics);

    this.notifyObservers("performance", metric);
  }

  trackError(error) {
    this.errorData.push(error);
    this.notifyObservers("error", error);
  }

  trackUserInteraction(interaction) {
    const { path } = interaction;
    const details = this.userBehaviorData.interactions.details;
    const existingInteraction = details.find((i) => i.path === path);

    if (existingInteraction) {
      existingInteraction.count++;
    } else {
      details.push({ path, count: 1 });
    }

    this.userBehaviorData.interactions.current++;
    this.notifyObservers("interaction", interaction);
  }

  trackPageView(path) {
    const timestamp = Date.now();
    this.userBehaviorData.pageViews.current++;
    this.userBehaviorData.pageViews.details.push({
      path,
      timestamp,
      sessionId: this.sessionId,
    });

    this.notifyObservers("pageView", { path, timestamp });
  }

  getPerformanceData(metricType, timeRange) {
    const metrics = this.performanceData.get(metricType) || [];
    const timeLimit = this.getTimeLimit(timeRange);

    return metrics.filter((metric) => metric.timestamp >= timeLimit);
  }

  getErrorData(timeRange) {
    const timeLimit = this.getTimeLimit(timeRange);
    return this.errorData.filter((error) => error.timestamp >= timeLimit);
  }

  getUserBehaviorData(timeRange) {
    const timeLimit = this.getTimeLimit(timeRange);
    const data = { ...this.userBehaviorData };

    // Update previous values for trend calculation
    for (const metric of Object.keys(data)) {
      const current = data[metric].details.filter(
        (item) => item.timestamp >= timeLimit
      ).length;
      const previous = data[metric].details.filter(
        (item) =>
          item.timestamp >= timeLimit - this.getTimeRangeDuration(timeRange) &&
          item.timestamp < timeLimit
      ).length;

      data[metric].current = current;
      data[metric].previous = previous;
    }

    return data;
  }

  getTimeLimit(timeRange) {
    const now = Date.now();
    return now - this.getTimeRangeDuration(timeRange);
  }

  getTimeRangeDuration(timeRange) {
    const hour = 3600000;
    switch (timeRange) {
      case "1h":
        return hour;
      case "24h":
        return hour * 24;
      case "7d":
        return hour * 24 * 7;
      case "30d":
        return hour * 24 * 30;
      default:
        return hour * 24;
    }
  }

  subscribe(callback) {
    this.observers.add(callback);
    return () => this.observers.delete(callback);
  }

  notifyObservers(type, data) {
    for (const observer of this.observers) {
      observer(type, data);
    }
  }

  // Playground-specific tracking methods
  initializePlaygroundTracking() {
    // Track keyboard shortcuts usage
    document.addEventListener('keydown', (event) => {
      if (event.ctrlKey || event.metaKey || event.altKey) {
        const shortcut = `${event.ctrlKey ? 'Ctrl+' : ''}${event.metaKey ? 'Cmd+' : ''}${event.altKey ? 'Alt+' : ''}${event.key}`;
        this.trackKeyboardShortcut(shortcut);
      }
    });

    // Track component performance switching
    this.componentSwitchStart = null;
  }

  trackComponentUsage(category, componentName, timeSpent = 0) {
    const key = `${category}/${componentName}`;
    const existing = this.playgroundData.componentUsage.get(key) || {
      category,
      name: componentName,
      accessCount: 0,
      totalTime: 0,
      lastAccess: null,
      properties: new Map()
    };

    existing.accessCount++;
    existing.totalTime += timeSpent;
    existing.lastAccess = Date.now();
    
    this.playgroundData.componentUsage.set(key, existing);
    this.notifyObservers('componentUsage', { category, componentName, timeSpent });
  }

  trackComponentSwitchStart() {
    this.componentSwitchStart = performance.now();
  }

  trackComponentSwitchEnd(category, componentName) {
    if (this.componentSwitchStart) {
      const switchTime = performance.now() - this.componentSwitchStart;
      this.playgroundData.performanceMetrics.componentSwitching.push({
        category,
        componentName,
        duration: switchTime,
        timestamp: Date.now()
      });
      this.componentSwitchStart = null;
      
      // Also track component usage
      this.trackComponentUsage(category, componentName);
    }
  }

  trackSearchQuery(query, resultsCount, responseTime) {
    const searchData = {
      query,
      resultsCount,
      responseTime,
      timestamp: Date.now(),
      sessionId: this.sessionId
    };

    this.playgroundData.searchQueries.push(searchData);
    this.playgroundData.performanceMetrics.searchResponse.push({
      responseTime,
      resultsCount,
      timestamp: Date.now()
    });
    
    this.notifyObservers('searchQuery', searchData);
  }

  trackPropertyInteraction(componentName, property, value, interactionType = 'change') {
    const key = `${componentName}/${property}`;
    const existing = this.playgroundData.propertyInteractions.get(key) || {
      componentName,
      property,
      interactions: 0,
      values: new Map(),
      types: new Map()
    };

    existing.interactions++;
    
    // Track value frequency
    const valueKey = typeof value === 'object' ? JSON.stringify(value) : String(value);
    existing.values.set(valueKey, (existing.values.get(valueKey) || 0) + 1);
    
    // Track interaction type
    existing.types.set(interactionType, (existing.types.get(interactionType) || 0) + 1);
    
    this.playgroundData.propertyInteractions.set(key, existing);
    this.notifyObservers('propertyInteraction', { componentName, property, value, interactionType });
  }

  trackKeyboardShortcut(shortcut) {
    const existing = this.playgroundData.keyboardShortcuts.get(shortcut) || {
      shortcut,
      usage: 0,
      lastUsed: null
    };

    existing.usage++;
    existing.lastUsed = Date.now();
    
    this.playgroundData.keyboardShortcuts.set(shortcut, existing);
    this.notifyObservers('keyboardShortcut', { shortcut });
  }

  trackBuildPerformance(buildTime, success = true) {
    this.playgroundData.performanceMetrics.buildTimes.push({
      duration: buildTime,
      success,
      timestamp: Date.now()
    });
    
    this.notifyObservers('buildPerformance', { buildTime, success });
  }

  trackMemoryUsage(component, memoryUsed) {
    this.playgroundData.performanceMetrics.memoryUsage.push({
      component,
      memory: memoryUsed,
      timestamp: Date.now()
    });
    
    this.notifyObservers('memoryUsage', { component, memoryUsed });
  }

  // Data retrieval methods for playground analytics
  getPlaygroundData(timeRange = '24h') {
    const timeLimit = this.getTimeLimit(timeRange);
    
    return {
      componentUsage: this.getFilteredComponentUsage(timeLimit),
      searchMetrics: this.getFilteredSearchMetrics(timeLimit),
      propertyInteractions: this.getFilteredPropertyInteractions(timeLimit),
      keyboardShortcuts: this.getFilteredKeyboardShortcuts(timeLimit),
      performanceMetrics: this.getFilteredPerformanceMetrics(timeLimit),
      sessionDuration: this.getSessionDuration()
    };
  }

  getFilteredComponentUsage(timeLimit) {
    const filtered = new Map();
    for (const [key, data] of this.playgroundData.componentUsage.entries()) {
      if (data.lastAccess >= timeLimit) {
        filtered.set(key, data);
      }
    }
    return filtered;
  }

  getFilteredSearchMetrics(timeLimit) {
    return this.playgroundData.searchQueries.filter(query => query.timestamp >= timeLimit);
  }

  getFilteredPropertyInteractions(timeLimit) {
    const filtered = new Map();
    for (const [key, data] of this.playgroundData.propertyInteractions.entries()) {
      // Note: We don't have timestamp on property interactions, so we include all
      // This could be enhanced by adding timestamps to property interactions
      filtered.set(key, data);
    }
    return filtered;
  }

  getFilteredKeyboardShortcuts(timeLimit) {
    const filtered = new Map();
    for (const [key, data] of this.playgroundData.keyboardShortcuts.entries()) {
      if (data.lastUsed >= timeLimit) {
        filtered.set(key, data);
      }
    }
    return filtered;
  }

  getFilteredPerformanceMetrics(timeLimit) {
    return {
      componentSwitching: this.playgroundData.performanceMetrics.componentSwitching
        .filter(metric => metric.timestamp >= timeLimit),
      searchResponse: this.playgroundData.performanceMetrics.searchResponse
        .filter(metric => metric.timestamp >= timeLimit),
      buildTimes: this.playgroundData.performanceMetrics.buildTimes
        .filter(metric => metric.timestamp >= timeLimit),
      memoryUsage: this.playgroundData.performanceMetrics.memoryUsage
        .filter(metric => metric.timestamp >= timeLimit)
    };
  }

  getSessionDuration() {
    return {
      start: this.playgroundData.sessionDuration.start,
      current: Date.now() - this.playgroundData.sessionDuration.start,
      total: this.playgroundData.sessionDuration.total
    };
  }

  // Export functionality
  exportData(format = 'json', timeRange = '24h') {
    const data = {
      general: {
        performance: this.getPerformanceData('all', timeRange),
        errors: this.getErrorData(timeRange),
        userBehavior: this.getUserBehaviorData(timeRange)
      },
      playground: this.getPlaygroundData(timeRange),
      meta: {
        exportTime: new Date().toISOString(),
        sessionId: this.sessionId,
        timeRange
      }
    };

    if (format === 'csv') {
      return this.convertToCSV(data);
    }
    
    return JSON.stringify(data, (key, value) => {
      if (value instanceof Map) {
        return Object.fromEntries(value);
      }
      return value;
    }, 2);
  }

  convertToCSV(data) {
    // Convert playground component usage to CSV
    const componentUsageRows = [];
    componentUsageRows.push(['Component Category', 'Component Name', 'Access Count', 'Total Time (ms)', 'Last Access']);
    
    for (const [key, usage] of data.playground.componentUsage) {
      componentUsageRows.push([
        usage.category,
        usage.name,
        usage.accessCount,
        usage.totalTime,
        new Date(usage.lastAccess).toISOString()
      ]);
    }

    const componentUsageCSV = componentUsageRows.map(row => row.join(',')).join('\n');
    
    // Convert search metrics to CSV
    const searchRows = [];
    searchRows.push(['Query', 'Results Count', 'Response Time (ms)', 'Timestamp']);
    
    data.playground.searchMetrics.forEach(search => {
      searchRows.push([
        `"${search.query}"`,
        search.resultsCount,
        search.responseTime,
        new Date(search.timestamp).toISOString()
      ]);
    });

    const searchCSV = searchRows.map(row => row.join(',')).join('\n');

    return {
      componentUsage: componentUsageCSV,
      searchMetrics: searchCSV,
      // Add more CSV conversions as needed
    };
  }
}

// Create a singleton instance
const analytics = new AnalyticsService();

// Export singleton instance
export default analytics;
