/**
 * A/B Testing Service
 * Handles test assignment, variant rendering, conversion tracking, and analytics integration
 */

import { apiService } from './api.js';
import analytics from './analytics.js';

/**
 * A/B Testing status enumeration
 */
export const AbTestStatus = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  ARCHIVED: 'archived'
};

/**
 * Statistical methods enumeration
 */
export const StatisticalMethod = {
  FREQUENTIST: 'frequentist',
  BAYESIAN: 'bayesian',
  SEQUENTIAL: 'sequential'
};

class AbTestingService {
  constructor() {
    this.assignments = new Map(); // Cache test assignments
    this.activeTests = new Map(); // Cache active tests
    this.sessionId = this._generateSessionId();
    this.userId = null;
    this.conversionCallbacks = new Map(); // Test-specific conversion callbacks
    this.observers = new Set(); // Event observers

    // Performance monitoring
    this.performanceMetrics = {
      assignmentResponseTimes: [],
      conversionTrackingTimes: [],
      cacheHitRate: 0,
      totalAssignments: 0,
      cacheHits: 0
    };

    this._initializeEventTracking();
  }

  /**
   * Initialize the A/B testing service with user context
   */
  async initialize(userId = null) {
    this.userId = userId;

    try {
      // Fetch active tests and user assignments
      await Promise.all([
        this._loadActiveTests(),
        this._loadUserAssignments()
      ]);

      this._notifyObservers('initialized', { userId, sessionId: this.sessionId });
      return true;
    } catch (error) {
      console.error('Failed to initialize A/B testing service:', error);
      this._notifyObservers('error', { type: 'initialization', error });
      return false;
    }
  }

  /**
   * Get assignment for a specific test
   */
  async getTestAssignment(testKey) {
    const startTime = performance.now();

    try {
      // Check cache first
      const cached = this.assignments.get(testKey);
      if (cached) {
        this.performanceMetrics.cacheHits++;
        this._updateCacheHitRate();
        this._trackPerformance('assignment', performance.now() - startTime);
        return cached;
      }

      // Request assignment from API
      const assignmentRequest = {
        test_key: testKey,
        user_id: this.userId,
        session_id: this.sessionId,
        context: this._getAssignmentContext()
      };

      const assignment = await apiService.post('/ab-tests/assign', assignmentRequest);

      if (assignment) {
        // Cache the assignment
        this.assignments.set(testKey, assignment);
        this.performanceMetrics.totalAssignments++;
        this._updateCacheHitRate();

        // Track assignment event
        this._trackAssignmentEvent(assignment);

        // Notify observers
        this._notifyObservers('assignment', { testKey, assignment });
      }

      this._trackPerformance('assignment', performance.now() - startTime);
      return assignment;

    } catch (error) {
      console.error(`Failed to get assignment for test ${testKey}:`, error);
      this._notifyObservers('error', { type: 'assignment', testKey, error });
      this._trackPerformance('assignment', performance.now() - startTime, false);
      return null;
    }
  }

  /**
   * Get variant configuration for a test
   */
  async getVariant(testKey) {
    const assignment = await this.getTestAssignment(testKey);
    return assignment ? {
      variantKey: assignment.variant_key,
      configuration: assignment.variant_configuration || {},
      isControl: assignment.is_control
    } : null;
  }

  /**
   * Check if user is in a specific variant
   */
  async isInVariant(testKey, variantKey) {
    const assignment = await this.getTestAssignment(testKey);
    return assignment && assignment.variant_key === variantKey;
  }

  /**
   * Track conversion for a test
   */
  async trackConversion(testKey, metricName, value = null, properties = {}) {
    const startTime = performance.now();

    try {
      const conversionRequest = {
        test_key: testKey,
        user_id: this.userId,
        session_id: this.sessionId,
        metric_name: metricName,
        value: value,
        properties: properties
      };

      await apiService.post('/ab-tests/convert', conversionRequest);

      // Track conversion in analytics
      analytics.trackUserInteraction({
        type: 'ab_test_conversion',
        testKey,
        metricName,
        value,
        properties,
        timestamp: Date.now()
      });

      // Execute conversion callbacks
      const callbacks = this.conversionCallbacks.get(testKey);
      if (callbacks) {
        callbacks.forEach(callback => {
          try {
            callback({ testKey, metricName, value, properties });
          } catch (error) {
            console.error('Conversion callback error:', error);
          }
        });
      }

      this._trackPerformance('conversion', performance.now() - startTime);
      this._notifyObservers('conversion', { testKey, metricName, value, properties });

      return true;

    } catch (error) {
      console.error(`Failed to track conversion for test ${testKey}:`, error);
      this._notifyObservers('error', { type: 'conversion', testKey, metricName, error });
      this._trackPerformance('conversion', performance.now() - startTime, false);
      return false;
    }
  }

  /**
   * Register a conversion callback for a test
   */
  onConversion(testKey, callback) {
    if (!this.conversionCallbacks.has(testKey)) {
      this.conversionCallbacks.set(testKey, new Set());
    }
    this.conversionCallbacks.get(testKey).add(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.conversionCallbacks.get(testKey);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.conversionCallbacks.delete(testKey);
        }
      }
    };
  }

  /**
   * Get all user's test assignments
   */
  async getUserTests() {
    try {
      const params = new URLSearchParams();
      if (this.userId) {
        params.append('user_id', this.userId);
      }
      if (this.sessionId) {
        params.append('session_id', this.sessionId);
      }

      const userTests = await apiService.get(`/ab-tests/user-tests?${params}`);

      // Cache assignments
      userTests.forEach(test => {
        this.assignments.set(test.test_key, {
          test_id: test.test_id,
          test_key: test.test_key,
          variant_id: test.variant_id,
          variant_key: test.variant_key,
          variant_configuration: test.variant_configuration,
          is_control: test.is_control
        });
      });

      return userTests;

    } catch (error) {
      console.error('Failed to get user tests:', error);
      this._notifyObservers('error', { type: 'user_tests', error });
      return [];
    }
  }

  /**
   * Get test analytics (requires authentication)
   */
  async getTestAnalytics(testId, startDate = null, endDate = null) {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate.toISOString());
      if (endDate) params.append('end_date', endDate.toISOString());

      const analytics = await apiService.get(`/ab-tests/${testId}/analytics?${params}`);
      return analytics;

    } catch (error) {
      console.error(`Failed to get analytics for test ${testId}:`, error);
      this._notifyObservers('error', { type: 'analytics', testId, error });
      return null;
    }
  }

  /**
   * Get performance metrics for the A/B testing service
   */
  getPerformanceMetrics() {
    const avgAssignmentTime = this.performanceMetrics.assignmentResponseTimes.length > 0
      ? this.performanceMetrics.assignmentResponseTimes.reduce((a, b) => a + b, 0) / this.performanceMetrics.assignmentResponseTimes.length
      : 0;

    const avgConversionTime = this.performanceMetrics.conversionTrackingTimes.length > 0
      ? this.performanceMetrics.conversionTrackingTimes.reduce((a, b) => a + b, 0) / this.performanceMetrics.conversionTrackingTimes.length
      : 0;

    return {
      averageAssignmentTime: avgAssignmentTime,
      averageConversionTime: avgConversionTime,
      cacheHitRate: this.performanceMetrics.cacheHitRate,
      totalAssignments: this.performanceMetrics.totalAssignments,
      cacheHits: this.performanceMetrics.cacheHits,
      activeTestsCount: this.activeTests.size,
      cachedAssignmentsCount: this.assignments.size
    };
  }

  /**
   * Clear all cached assignments (useful for testing or user logout)
   */
  clearAssignments() {
    this.assignments.clear();
    this.conversionCallbacks.clear();
    this.performanceMetrics.cacheHits = 0;
    this.performanceMetrics.totalAssignments = 0;
    this.performanceMetrics.cacheHitRate = 0;
    this._notifyObservers('assignments_cleared', {});
  }

  /**
   * Subscribe to A/B testing events
   */
  subscribe(callback) {
    this.observers.add(callback);
    return () => this.observers.delete(callback);
  }

  /**
   * Create a new A/B test (requires authentication)
   */
  async createTest(testData) {
    try {
      const test = await apiService.post('/ab-tests/', testData);
      this._notifyObservers('test_created', { test });
      return test;
    } catch (error) {
      console.error('Failed to create test:', error);
      this._notifyObservers('error', { type: 'create_test', error });
      throw error;
    }
  }

  /**
   * Update an existing A/B test (requires authentication)
   */
  async updateTest(testId, updateData) {
    try {
      const test = await apiService.put(`/ab-tests/${testId}`, updateData);
      this._notifyObservers('test_updated', { test });
      return test;
    } catch (error) {
      console.error(`Failed to update test ${testId}:`, error);
      this._notifyObservers('error', { type: 'update_test', testId, error });
      throw error;
    }
  }

  /**
   * Start an A/B test (requires authentication)
   */
  async startTest(testId) {
    try {
      const test = await apiService.post(`/ab-tests/${testId}/start`);
      this._notifyObservers('test_started', { test });
      return test;
    } catch (error) {
      console.error(`Failed to start test ${testId}:`, error);
      this._notifyObservers('error', { type: 'start_test', testId, error });
      throw error;
    }
  }

  /**
   * Stop an A/B test (requires authentication)
   */
  async stopTest(testId, winnerVariantId = null) {
    try {
      const params = winnerVariantId ? `?winner_variant_id=${winnerVariantId}` : '';
      const test = await apiService.post(`/ab-tests/${testId}/stop${params}`);
      this._notifyObservers('test_stopped', { test });
      return test;
    } catch (error) {
      console.error(`Failed to stop test ${testId}:`, error);
      this._notifyObservers('error', { type: 'stop_test', testId, error });
      throw error;
    }
  }

  /**
   * List A/B tests (requires authentication)
   */
  async listTests(filters = {}) {
    try {
      const params = new URLSearchParams(filters);
      const response = await apiService.get(`/ab-tests/?${params}`);
      return response;
    } catch (error) {
      console.error('Failed to list tests:', error);
      this._notifyObservers('error', { type: 'list_tests', error });
      throw error;
    }
  }

  // Private methods

  _generateSessionId() {
    return `ab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  _getAssignmentContext() {
    return {
      user_agent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      page_url: window.location.href,
      screen_resolution: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
  }

  async _loadActiveTests() {
    try {
      const tests = await apiService.get('/ab-tests/active');
      tests.forEach(test => {
        this.activeTests.set(test.test_key, test);
      });
    } catch (error) {
      console.error('Failed to load active tests:', error);
    }
  }

  async _loadUserAssignments() {
    if (!this.userId && !this.sessionId) return;

    try {
      const userTests = await this.getUserTests();
      // Assignments are cached in getUserTests method
    } catch (error) {
      console.error('Failed to load user assignments:', error);
    }
  }

  _trackAssignmentEvent(assignment) {
    analytics.trackUserInteraction({
      type: 'ab_test_assignment',
      testKey: assignment.test_key,
      variantKey: assignment.variant_key,
      isControl: assignment.is_control,
      timestamp: Date.now()
    });
  }

  _trackPerformance(operation, duration, success = true) {
    const metric = {
      operation,
      duration,
      success,
      timestamp: Date.now()
    };

    if (operation === 'assignment') {
      this.performanceMetrics.assignmentResponseTimes.push(duration);
      // Keep only last 100 measurements
      if (this.performanceMetrics.assignmentResponseTimes.length > 100) {
        this.performanceMetrics.assignmentResponseTimes.shift();
      }
    } else if (operation === 'conversion') {
      this.performanceMetrics.conversionTrackingTimes.push(duration);
      // Keep only last 100 measurements
      if (this.performanceMetrics.conversionTrackingTimes.length > 100) {
        this.performanceMetrics.conversionTrackingTimes.shift();
      }
    }

    analytics.trackPerformanceMetric(metric);
  }

  _updateCacheHitRate() {
    this.performanceMetrics.cacheHitRate = this.performanceMetrics.totalAssignments > 0
      ? this.performanceMetrics.cacheHits / this.performanceMetrics.totalAssignments
      : 0;
  }

  _initializeEventTracking() {
    // Track page views for exposure tracking
    window.addEventListener('beforeunload', () => {
      // Send any pending analytics data
      this._notifyObservers('session_ending', {});
    });
  }

  _notifyObservers(eventType, data) {
    for (const observer of this.observers) {
      try {
        observer(eventType, data);
      } catch (error) {
        console.error('Observer error:', error);
      }
    }
  }
}

// Create singleton instance
const abTestingService = new AbTestingService();

// Export service and utilities
export default abTestingService;
export { AbTestingService };
