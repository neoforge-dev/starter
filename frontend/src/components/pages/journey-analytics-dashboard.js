import { LitElement, html, css } from 'lit';
import { apiService as api } from '../../services/api.js';
import '../atoms/journey-tracker.js';
import '../molecules/funnel-chart.js';
import '../organisms/user-flow-diagram.js';

/**
 * Journey Analytics Dashboard Page Component
 * Comprehensive analytics interface combining journey tracking, funnel analysis, and user flows
 * Features real-time updates, business intelligence insights, and actionable recommendations
 * @element journey-analytics-dashboard
 */
export class JourneyAnalyticsDashboard extends LitElement {
  static get properties() {
    return {
      activeView: { type: String },
      timeRange: { type: String },
      autoRefresh: { type: Boolean },
      refreshInterval: { type: Number },
      loading: { type: Boolean },

      // Data
      journeyData: { type: Object },
      funnelData: { type: Array },
      flowData: { type: Array },
      metricsData: { type: Object },
      insights: { type: Array },

      // Real-time updates
      eventSubscription: { type: Object },
      lastUpdate: { type: Number },

      // Filters and settings
      selectedSegment: { type: String },
      dateRange: { type: Object },
      comparisonMode: { type: Boolean },

      // UI state
      showSettings: { type: Boolean },
      expandedInsights: { type: Set },
    };
  }

  static get styles() {
    return css`
      :host {
        display: block;
        min-height: 100vh;
        background: var(--background-color, #f8f9fa);
      }

      .dashboard-container {
        padding: 1rem;
        max-width: 1400px;
        margin: 0 auto;
      }

      .dashboard-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
        padding: 1.5rem;
        background: var(--surface-color, #fff);
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }

      .header-content {
        flex: 1;
      }

      .dashboard-title {
        font-size: 1.75rem;
        font-weight: 700;
        color: var(--text-primary-color, #333);
        margin: 0 0 0.5rem 0;
      }

      .dashboard-subtitle {
        color: var(--text-secondary-color, #666);
        font-size: 0.95rem;
        display: flex;
        align-items: center;
        gap: 1rem;
      }

      .last-update {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.875rem;
      }

      .update-indicator {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--success-color, #28a745);
        animation: pulse 2s infinite;
      }

      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }

      .dashboard-controls {
        display: flex;
        gap: 1rem;
        align-items: center;
        flex-wrap: wrap;
      }

      .control-group {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .control-label {
        font-size: 0.875rem;
        color: var(--text-secondary-color, #666);
        font-weight: 500;
      }

      .control-select,
      .control-input {
        padding: 0.5rem;
        border: 1px solid var(--border-color, #e0e0e0);
        border-radius: 6px;
        background: var(--input-background, #fff);
        font-size: 0.875rem;
        min-width: 120px;
      }

      .control-button {
        padding: 0.5rem 1rem;
        background: var(--secondary-color, #f8f9fa);
        border: 1px solid var(--border-color, #e0e0e0);
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s ease;
        font-size: 0.875rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .control-button:hover {
        background: var(--hover-color, #e9ecef);
      }

      .control-button.active {
        background: var(--primary-color, #007bff);
        color: white;
        border-color: var(--primary-color, #007bff);
      }

      .view-tabs {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 2rem;
        background: var(--surface-color, #fff);
        padding: 0.5rem;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      }

      .view-tab {
        padding: 0.75rem 1.5rem;
        cursor: pointer;
        border-radius: 6px;
        transition: all 0.2s ease;
        font-weight: 500;
        color: var(--text-secondary-color, #666);
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .view-tab:hover {
        background: var(--hover-color, #e9ecef);
        color: var(--text-primary-color, #333);
      }

      .view-tab.active {
        background: var(--primary-color, #007bff);
        color: white;
      }

      .view-content {
        min-height: 600px;
      }

      .metrics-overview {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 1.5rem;
        margin-bottom: 2rem;
      }

      .metric-card {
        background: var(--surface-color, #fff);
        border-radius: 12px;
        padding: 1.5rem;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        transition: all 0.2s ease;
        position: relative;
        overflow: hidden;
      }

      .metric-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 4px;
        background: var(--metric-color, var(--primary-color, #007bff));
      }

      .metric-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
      }

      .metric-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 1rem;
      }

      .metric-title {
        font-size: 0.875rem;
        color: var(--text-secondary-color, #666);
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .metric-trend {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        font-size: 0.75rem;
        font-weight: 600;
        padding: 0.25rem 0.5rem;
        border-radius: 12px;
      }

      .metric-trend.positive {
        color: var(--success-color, #28a745);
        background: var(--success-light, #d4edda);
      }

      .metric-trend.negative {
        color: var(--danger-color, #dc3545);
        background: var(--danger-light, #f8d7da);
      }

      .metric-trend.neutral {
        color: var(--text-secondary-color, #666);
        background: var(--secondary-color, #f8f9fa);
      }

      .metric-value {
        font-size: 2rem;
        font-weight: 700;
        color: var(--text-primary-color, #333);
        margin-bottom: 0.5rem;
        line-height: 1;
      }

      .metric-subtitle {
        font-size: 0.875rem;
        color: var(--text-secondary-color, #666);
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .comparison-value {
        font-weight: 600;
      }

      .insights-panel {
        background: var(--surface-color, #fff);
        border-radius: 12px;
        padding: 1.5rem;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        margin-bottom: 2rem;
      }

      .insights-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid var(--border-color, #e0e0e0);
      }

      .insights-title {
        font-size: 1.1rem;
        font-weight: 600;
        color: var(--text-primary-color, #333);
        margin: 0;
      }

      .insights-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .insight-item {
        padding: 1rem;
        background: var(--background-color, #f8f9fa);
        border-radius: 8px;
        border-left: 4px solid var(--insight-color);
        position: relative;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .insight-item:hover {
        background: var(--hover-color, #e9ecef);
      }

      .insight-item.critical {
        --insight-color: var(--danger-color, #dc3545);
      }

      .insight-item.warning {
        --insight-color: var(--warning-color, #ffc107);
      }

      .insight-item.success {
        --insight-color: var(--success-color, #28a745);
      }

      .insight-item.info {
        --insight-color: var(--info-color, #17a2b8);
      }

      .insight-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 0.5rem;
      }

      .insight-title {
        font-weight: 600;
        color: var(--text-primary-color, #333);
        font-size: 0.95rem;
      }

      .insight-priority {
        font-size: 0.75rem;
        padding: 0.25rem 0.5rem;
        border-radius: 12px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .insight-description {
        color: var(--text-secondary-color, #666);
        font-size: 0.875rem;
        line-height: 1.4;
        margin-bottom: 0.5rem;
      }

      .insight-recommendations {
        margin-top: 1rem;
        padding-top: 1rem;
        border-top: 1px solid var(--border-color, #e0e0e0);
      }

      .recommendation-list {
        list-style: none;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .recommendation-item {
        display: flex;
        align-items: flex-start;
        gap: 0.5rem;
        font-size: 0.875rem;
        color: var(--text-secondary-color, #666);
      }

      .recommendation-icon {
        color: var(--primary-color, #007bff);
        font-weight: bold;
        margin-top: 0.125rem;
      }

      .main-content {
        background: var(--surface-color, #fff);
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        overflow: hidden;
        min-height: 500px;
      }

      .loading-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(255, 255, 255, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        backdrop-filter: blur(2px);
      }

      .loading-spinner {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
        color: var(--text-secondary-color, #666);
      }

      .spinner {
        width: 40px;
        height: 40px;
        border: 3px solid var(--border-color, #e0e0e0);
        border-top: 3px solid var(--primary-color, #007bff);
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      .settings-panel {
        position: fixed;
        top: 0;
        right: 0;
        width: 350px;
        height: 100vh;
        background: var(--surface-color, #fff);
        box-shadow: -4px 0 16px rgba(0, 0, 0, 0.1);
        padding: 2rem;
        z-index: 100;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        overflow-y: auto;
      }

      .settings-panel.visible {
        transform: translateX(0);
      }

      .settings-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid var(--border-color, #e0e0e0);
      }

      .settings-title {
        font-size: 1.1rem;
        font-weight: 600;
        color: var(--text-primary-color, #333);
        margin: 0;
      }

      .close-button {
        background: none;
        border: none;
        cursor: pointer;
        font-size: 1.5rem;
        color: var(--text-secondary-color, #666);
        padding: 0.25rem;
        border-radius: 4px;
        transition: all 0.2s ease;
      }

      .close-button:hover {
        background: var(--hover-color, #e9ecef);
        color: var(--text-primary-color, #333);
      }

      .settings-section {
        margin-bottom: 2rem;
      }

      .section-title {
        font-weight: 600;
        color: var(--text-primary-color, #333);
        margin-bottom: 1rem;
        font-size: 0.95rem;
      }

      .setting-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.75rem 0;
        border-bottom: 1px solid var(--border-color, #e0e0e0);
      }

      .setting-item:last-child {
        border-bottom: none;
      }

      .setting-label {
        font-size: 0.875rem;
        color: var(--text-primary-color, #333);
      }

      .toggle-switch {
        position: relative;
        width: 44px;
        height: 24px;
        background: var(--border-color, #e0e0e0);
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .toggle-switch.active {
        background: var(--primary-color, #007bff);
      }

      .toggle-switch::after {
        content: '';
        position: absolute;
        top: 2px;
        left: 2px;
        width: 20px;
        height: 20px;
        background: white;
        border-radius: 50%;
        transition: all 0.2s ease;
      }

      .toggle-switch.active::after {
        transform: translateX(20px);
      }

      /* Responsive design */
      @media (max-width: 1200px) {
        .dashboard-container {
          padding: 1rem 0.5rem;
        }

        .dashboard-header {
          flex-direction: column;
          gap: 1rem;
          align-items: flex-start;
        }

        .dashboard-controls {
          width: 100%;
          justify-content: flex-start;
        }
      }

      @media (max-width: 768px) {
        .metrics-overview {
          grid-template-columns: 1fr;
        }

        .view-tabs {
          flex-direction: column;
        }

        .settings-panel {
          width: 100vw;
          right: 0;
        }

        .dashboard-controls {
          flex-direction: column;
          align-items: flex-start;
        }
      }
    `;
  }

  constructor() {
    super();
    this.activeView = 'overview';
    this.timeRange = '7d';
    this.autoRefresh = true;
    this.refreshInterval = 60000; // 1 minute
    this.loading = false;

    // Data initialization
    this.journeyData = {};
    this.funnelData = [];
    this.flowData = [];
    this.metricsData = {};
    this.insights = [];

    // State
    this.eventSubscription = null;
    this.lastUpdate = Date.now();
    this.selectedSegment = 'all';
    this.dateRange = this.getDateRange(this.timeRange);
    this.comparisonMode = false;
    this.showSettings = false;
    this.expandedInsights = new Set();

    this.refreshTimer = null;
  }

  connectedCallback() {
    super.connectedCallback();
    this.loadAnalyticsData();
    this.startRealTimeUpdates();
    this.setupEventListeners();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.stopRealTimeUpdates();
    this.removeEventListeners();
  }

  setupEventListeners() {
    // Listen for journey events from journey-tracker
    this.addEventListener('journey-event', this.handleJourneyEvent);

    // Listen for component interactions
    this.addEventListener('step-selected', this.handleStepSelected);
    this.addEventListener('node-selected', this.handleNodeSelected);
  }

  removeEventListeners() {
    this.removeEventListener('journey-event', this.handleJourneyEvent);
    this.removeEventListener('step-selected', this.handleStepSelected);
    this.removeEventListener('node-selected', this.handleNodeSelected);
  }

  getDateRange(timeRange) {
    const end = new Date();
    const start = new Date();

    switch (timeRange) {
      case '1d':
        start.setDate(end.getDate() - 1);
        break;
      case '7d':
        start.setDate(end.getDate() - 7);
        break;
      case '30d':
        start.setDate(end.getDate() - 30);
        break;
      case '90d':
        start.setDate(end.getDate() - 90);
        break;
      default:
        start.setDate(end.getDate() - 7);
    }

    return { start, end };
  }

  async loadAnalyticsData() {
    this.loading = true;

    try {
      // Load all analytics data in parallel
      const [metricsResponse, funnelResponse, insightsResponse] = await Promise.all([
        this.fetchMetrics(),
        this.fetchFunnelData(),
        this.fetchInsights(),
      ]);

      this.metricsData = metricsResponse;
      this.funnelData = funnelResponse;
      this.insights = insightsResponse;

      this.lastUpdate = Date.now();

    } catch (error) {
      console.error('[JourneyAnalyticsDashboard] Error loading analytics data:', error);
    } finally {
      this.loading = false;
    }
  }

  async fetchMetrics() {
    const { start, end } = this.dateRange;

    try {
      const response = await api.get('/api/v1/events/analytics', {
        params: {
          start_date: start.toISOString(),
          end_date: end.toISOString(),
          group_by: ['event_type'],
          aggregate_functions: ['count', 'count_distinct_sessions', 'avg'],
        }
      });

      return this.processMetrics(response.data);
    } catch (error) {
      console.error('Error fetching metrics:', error);
      return {};
    }
  }

  processMetrics(analyticsData) {
    const metrics = {
      totalSessions: 0,
      uniqueUsers: 0,
      averageSessionDuration: 0,
      conversionRate: 0,
      bounceRate: 0,
      pageViews: 0,
      trends: {}
    };

    analyticsData.results?.forEach(result => {
      const eventType = result.dimensions.event_type;
      const count = result.count;
      const uniqueSessions = result.metrics.count_distinct_sessions || 0;

      switch (eventType) {
        case 'journey_start':
          metrics.totalSessions += count;
          metrics.uniqueUsers += uniqueSessions;
          break;
        case 'page_enter':
          metrics.pageViews += count;
          break;
        case 'conversion':
          metrics.conversionRate = metrics.totalSessions > 0 ?
            (count / metrics.totalSessions) * 100 : 0;
          break;
        case 'journey_end':
          const avgDuration = result.metrics.avg_value || 0;
          metrics.averageSessionDuration = avgDuration;
          break;
      }
    });

    // Calculate bounce rate (sessions with only one page view)
    metrics.bounceRate = metrics.totalSessions > 0 ?
      ((metrics.totalSessions - metrics.pageViews + metrics.totalSessions) / metrics.totalSessions) * 100 : 0;

    // Add trend calculations (would need historical data in real implementation)
    metrics.trends = {
      sessions: this.calculateTrend(metrics.totalSessions, metrics.totalSessions * 0.9),
      users: this.calculateTrend(metrics.uniqueUsers, metrics.uniqueUsers * 0.85),
      conversion: this.calculateTrend(metrics.conversionRate, metrics.conversionRate * 0.95),
      bounce: this.calculateTrend(metrics.bounceRate, metrics.bounceRate * 1.1, true),
    };

    return metrics;
  }

  calculateTrend(current, previous, isInverse = false) {
    if (previous === 0) return { direction: 'neutral', percentage: 0 };

    const change = ((current - previous) / previous) * 100;
    const direction = isInverse ?
      (change > 0 ? 'negative' : change < 0 ? 'positive' : 'neutral') :
      (change > 0 ? 'positive' : change < 0 ? 'negative' : 'neutral');

    return {
      direction,
      percentage: Math.abs(change).toFixed(1),
    };
  }

  async fetchFunnelData() {
    // This would fetch funnel-specific data
    // For now, return mock data structure
    return [
      { name: 'Landing', count: 1000, conversionRate: 100, dropoffRate: 0 },
      { name: 'Product View', count: 750, conversionRate: 75, dropoffRate: 25 },
      { name: 'Add to Cart', count: 400, conversionRate: 53.3, dropoffRate: 46.7 },
      { name: 'Checkout', count: 200, conversionRate: 50, dropoffRate: 50 },
      { name: 'Purchase', count: 120, conversionRate: 60, dropoffRate: 40 },
    ];
  }

  async fetchInsights() {
    // Generate AI-powered insights based on analytics data
    const insights = [];

    // Example insights based on metrics
    if (this.metricsData.bounceRate > 60) {
      insights.push({
        id: 'high_bounce_rate',
        type: 'warning',
        priority: 'high',
        title: 'High Bounce Rate Detected',
        description: `Bounce rate of ${this.metricsData.bounceRate?.toFixed(1)}% is above the recommended threshold of 60%.`,
        recommendations: [
          'Review landing page content and user experience',
          'Optimize page load times and mobile responsiveness',
          'A/B test different page layouts and call-to-actions',
          'Ensure page content matches user expectations from traffic sources',
        ],
        impact: 'high',
        effort: 'medium',
      });
    }

    if (this.metricsData.conversionRate < 2) {
      insights.push({
        id: 'low_conversion',
        type: 'critical',
        priority: 'critical',
        title: 'Low Conversion Rate',
        description: `Conversion rate of ${this.metricsData.conversionRate?.toFixed(1)}% is below industry average of 2-3%.`,
        recommendations: [
          'Analyze user journey drop-off points in funnel',
          'Implement exit-intent popups and lead magnets',
          'Optimize checkout process and reduce friction',
          'Improve product descriptions and social proof',
        ],
        impact: 'critical',
        effort: 'high',
      });
    }

    if (this.metricsData.averageSessionDuration < 120000) { // Less than 2 minutes
      insights.push({
        id: 'short_sessions',
        type: 'info',
        priority: 'medium',
        title: 'Short Session Duration',
        description: 'Average session duration is below 2 minutes, indicating users may not be finding what they need quickly.',
        recommendations: [
          'Improve site navigation and search functionality',
          'Add related content suggestions',
          'Create more engaging content and interactive elements',
          'Implement progressive disclosure for complex information',
        ],
        impact: 'medium',
        effort: 'low',
      });
    }

    // Positive insights
    if (this.metricsData.trends?.sessions?.direction === 'positive') {
      insights.push({
        id: 'growing_traffic',
        type: 'success',
        priority: 'low',
        title: 'Growing User Traffic',
        description: `Session growth of ${this.metricsData.trends.sessions.percentage}% shows positive momentum.`,
        recommendations: [
          'Continue current marketing efforts',
          'Scale successful traffic acquisition channels',
          'Prepare infrastructure for increased load',
          'Document successful strategies for replication',
        ],
        impact: 'positive',
        effort: 'low',
      });
    }

    return insights;
  }

  startRealTimeUpdates() {
    if (!this.autoRefresh) return;

    this.refreshTimer = setInterval(() => {
      this.loadAnalyticsData();
    }, this.refreshInterval);
  }

  stopRealTimeUpdates() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  handleJourneyEvent(event) {
    // Handle real-time journey events
    const journeyEvent = event.detail;

    // Update metrics in real-time
    if (journeyEvent.event_type === 'journey_start') {
      this.metricsData.totalSessions++;
    } else if (journeyEvent.event_type === 'conversion') {
      this.recalculateConversionRate();
    }

    this.lastUpdate = Date.now();
    this.requestUpdate();
  }

  handleStepSelected(event) {
    const { step, data } = event.detail;
    console.log('Funnel step selected:', step, data);

    // Could show detailed analysis for the selected step
    this.selectedSegment = step.name;
  }

  handleNodeSelected(event) {
    const { node, paths } = event.detail;
    console.log('Flow node selected:', node, paths);

    // Could show detailed path analysis
    this.selectedSegment = node.title;
  }

  recalculateConversionRate() {
    // Recalculate conversion rate based on updated data
    if (this.metricsData.totalSessions > 0) {
      // This is a simplified calculation - in reality, you'd query the latest data
      this.metricsData.conversionRate = (this.metricsData.conversionRate * this.metricsData.totalSessions + 1) / this.metricsData.totalSessions;
    }
  }

  handleTimeRangeChange(event) {
    this.timeRange = event.target.value;
    this.dateRange = this.getDateRange(this.timeRange);
    this.loadAnalyticsData();
  }

  handleViewChange(view) {
    this.activeView = view;
  }

  toggleAutoRefresh() {
    this.autoRefresh = !this.autoRefresh;

    if (this.autoRefresh) {
      this.startRealTimeUpdates();
    } else {
      this.stopRealTimeUpdates();
    }
  }

  toggleComparisonMode() {
    this.comparisonMode = !this.comparisonMode;
  }

  toggleSettings() {
    this.showSettings = !this.showSettings;
  }

  toggleInsight(insightId) {
    if (this.expandedInsights.has(insightId)) {
      this.expandedInsights.delete(insightId);
    } else {
      this.expandedInsights.add(insightId);
    }
    this.requestUpdate();
  }

  formatDuration(ms) {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  formatNumber(num) {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  renderMetricCard(title, value, subtitle, trend, color = '#007bff') {
    return html`
      <div class="metric-card" style="--metric-color: ${color}">
        <div class="metric-header">
          <div class="metric-title">${title}</div>
          ${trend ? html`
            <div class="metric-trend ${trend.direction}">
              ${trend.direction === 'positive' ? '↗' : trend.direction === 'negative' ? '↘' : '→'}
              ${trend.percentage}%
            </div>
          ` : ''}
        </div>
        <div class="metric-value">${value}</div>
        <div class="metric-subtitle">
          <span>${subtitle}</span>
          ${this.comparisonMode ? html`
            <span class="comparison-value">vs. prev period</span>
          ` : ''}
        </div>
      </div>
    `;
  }

  renderInsight(insight) {
    const isExpanded = this.expandedInsights.has(insight.id);

    return html`
      <div
        class="insight-item ${insight.type}"
        @click=${() => this.toggleInsight(insight.id)}
      >
        <div class="insight-header">
          <div class="insight-title">${insight.title}</div>
          <div class="insight-priority ${insight.priority}">${insight.priority}</div>
        </div>
        <div class="insight-description">${insight.description}</div>

        ${isExpanded ? html`
          <div class="insight-recommendations">
            <ul class="recommendation-list">
              ${insight.recommendations.map(rec => html`
                <li class="recommendation-item">
                  <span class="recommendation-icon">▸</span>
                  <span>${rec}</span>
                </li>
              `)}
            </ul>
          </div>
        ` : ''}
      </div>
    `;
  }

  renderOverviewView() {
    return html`
      <div class="metrics-overview">
        ${this.renderMetricCard(
          'Total Sessions',
          this.formatNumber(this.metricsData.totalSessions || 0),
          'Unique user visits',
          this.metricsData.trends?.sessions,
          '#007bff'
        )}
        ${this.renderMetricCard(
          'Unique Users',
          this.formatNumber(this.metricsData.uniqueUsers || 0),
          'Individual visitors',
          this.metricsData.trends?.users,
          '#28a745'
        )}
        ${this.renderMetricCard(
          'Avg Session Duration',
          this.formatDuration(this.metricsData.averageSessionDuration || 0),
          'Time spent per visit',
          null,
          '#17a2b8'
        )}
        ${this.renderMetricCard(
          'Conversion Rate',
          `${(this.metricsData.conversionRate || 0).toFixed(2)}%`,
          'Sessions that convert',
          this.metricsData.trends?.conversion,
          '#ffc107'
        )}
        ${this.renderMetricCard(
          'Bounce Rate',
          `${(this.metricsData.bounceRate || 0).toFixed(1)}%`,
          'Single page visits',
          this.metricsData.trends?.bounce,
          '#dc3545'
        )}
        ${this.renderMetricCard(
          'Page Views',
          this.formatNumber(this.metricsData.pageViews || 0),
          'Total page interactions',
          null,
          '#6f42c1'
        )}
      </div>

      ${this.insights.length > 0 ? html`
        <div class="insights-panel">
          <div class="insights-header">
            <h3 class="insights-title">AI-Powered Insights & Recommendations</h3>
            <span>${this.insights.length} insights</span>
          </div>
          <div class="insights-list">
            ${this.insights.map(insight => this.renderInsight(insight))}
          </div>
        </div>
      ` : ''}
    `;
  }

  renderFunnelView() {
    return html`
      <div class="main-content">
        <funnel-chart
          .data=${this.funnelData}
          .timeRange=${this.timeRange}
          .showDropoffRates=${true}
          .interactive=${true}
          .height=${500}
        ></funnel-chart>
      </div>
    `;
  }

  renderFlowView() {
    return html`
      <div class="main-content">
        <user-flow-diagram
          .timeRange=${this.timeRange}
          .viewMode=${'sankey'}
          .showMetrics=${true}
          .width=${1000}
          .height=${600}
        ></user-flow-diagram>
      </div>
    `;
  }

  renderSettingsPanel() {
    return html`
      <div class="settings-panel ${this.showSettings ? 'visible' : ''}">
        <div class="settings-header">
          <h3 class="settings-title">Dashboard Settings</h3>
          <button class="close-button" @click=${this.toggleSettings}>×</button>
        </div>

        <div class="settings-section">
          <div class="section-title">Real-time Updates</div>
          <div class="setting-item">
            <span class="setting-label">Auto Refresh</span>
            <div
              class="toggle-switch ${this.autoRefresh ? 'active' : ''}"
              @click=${this.toggleAutoRefresh}
            ></div>
          </div>
          <div class="setting-item">
            <span class="setting-label">Comparison Mode</span>
            <div
              class="toggle-switch ${this.comparisonMode ? 'active' : ''}"
              @click=${this.toggleComparisonMode}
            ></div>
          </div>
        </div>

        <div class="settings-section">
          <div class="section-title">Refresh Interval</div>
          <div class="setting-item">
            <span class="setting-label">Update Frequency</span>
            <select
              class="control-select"
              .value=${this.refreshInterval.toString()}
              @change=${(e) => this.refreshInterval = parseInt(e.target.value)}
            >
              <option value="30000">30 seconds</option>
              <option value="60000">1 minute</option>
              <option value="300000">5 minutes</option>
              <option value="600000">10 minutes</option>
            </select>
          </div>
        </div>
      </div>
    `;
  }

  render() {
    return html`
      <journey-tracker .autoTrack=${true} .debug=${false}></journey-tracker>

      <div class="dashboard-container">
        <div class="dashboard-header">
          <div class="header-content">
            <h1 class="dashboard-title">User Journey Analytics</h1>
            <div class="dashboard-subtitle">
              <div class="last-update">
                <div class="update-indicator"></div>
                Last updated: ${new Date(this.lastUpdate).toLocaleTimeString()}
              </div>
              ${this.selectedSegment !== 'all' ? html`
                <div>Filtered by: ${this.selectedSegment}</div>
              ` : ''}
            </div>
          </div>

          <div class="dashboard-controls">
            <div class="control-group">
              <span class="control-label">Time Range:</span>
              <select
                class="control-select"
                .value=${this.timeRange}
                @change=${this.handleTimeRangeChange}
              >
                <option value="1d">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
              </select>
            </div>

            <button
              class="control-button ${this.autoRefresh ? 'active' : ''}"
              @click=${this.toggleAutoRefresh}
            >
              🔄 Auto Refresh
            </button>

            <button class="control-button" @click=${this.toggleSettings}>
              ⚙️ Settings
            </button>
          </div>
        </div>

        <div class="view-tabs">
          <div
            class="view-tab ${this.activeView === 'overview' ? 'active' : ''}"
            @click=${() => this.handleViewChange('overview')}
          >
            📊 Overview
          </div>
          <div
            class="view-tab ${this.activeView === 'funnel' ? 'active' : ''}"
            @click=${() => this.handleViewChange('funnel')}
          >
            🎯 Funnel Analysis
          </div>
          <div
            class="view-tab ${this.activeView === 'flow' ? 'active' : ''}"
            @click=${() => this.handleViewChange('flow')}
          >
            🔄 User Flow
          </div>
        </div>

        <div class="view-content">
          ${this.activeView === 'overview' ? this.renderOverviewView() : ''}
          ${this.activeView === 'funnel' ? this.renderFunnelView() : ''}
          ${this.activeView === 'flow' ? this.renderFlowView() : ''}
        </div>
      </div>

      ${this.renderSettingsPanel()}

      ${this.loading ? html`
        <div class="loading-overlay">
          <div class="loading-spinner">
            <div class="spinner"></div>
            <div>Loading analytics data...</div>
          </div>
        </div>
      ` : ''}
    `;
  }
}

customElements.define('journey-analytics-dashboard', JourneyAnalyticsDashboard);
