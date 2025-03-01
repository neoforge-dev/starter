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
    this.observers = new Set();
    this.sessionId = this.generateSessionId();
    this.initializePerformanceObserver();
    this.initializeErrorHandling();
    this.initializeInteractionTracking();
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
    const { type, path } = interaction;
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
    const now = Date.now();
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
}

// Create a singleton instance
const analytics = new AnalyticsService();

// Export singleton instance
export default analytics;
