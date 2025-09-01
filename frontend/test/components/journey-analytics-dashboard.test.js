import { expect } from '@open-wc/testing';
import { fixture, html } from '@open-wc/testing';
import { spy, stub, useFakeTimers } from 'sinon';
import '../../src/components/pages/journey-analytics-dashboard.js';

describe('JourneyAnalyticsDashboard', () => {
  let element;
  let apiStub;
  let clock;

  const mockAnalyticsResponse = {
    data: {
      results: [
        {
          dimensions: { event_type: 'journey_start' },
          count: 1000,
          metrics: { count_distinct_sessions: 800 }
        },
        {
          dimensions: { event_type: 'page_enter' },
          count: 2500,
          metrics: { count_distinct_sessions: 800 }
        },
        {
          dimensions: { event_type: 'conversion' },
          count: 50,
          metrics: { count_distinct_sessions: 45 }
        }
      ]
    }
  };

  beforeEach(async () => {
    clock = useFakeTimers();

    // Mock API responses
    apiStub = stub(window, 'fetch').resolves({
      ok: true,
      json: () => Promise.resolve(mockAnalyticsResponse)
    });

    element = await fixture(html`
      <journey-analytics-dashboard
        .activeView=${'overview'}
        .timeRange=${'7d'}
        .autoRefresh=${false}
      ></journey-analytics-dashboard>
    `);

    // Wait for initial data loading
    await new Promise(resolve => setTimeout(resolve, 100));
    await element.updateComplete;
  });

  afterEach(() => {
    if (apiStub) apiStub.restore();
    clock.restore();
  });

  describe('Initialization', () => {
    it('should initialize with default properties', () => {
      expect(element.activeView).to.equal('overview');
      expect(element.timeRange).to.equal('7d');
      expect(element.autoRefresh).to.be.false;
      expect(element.refreshInterval).to.equal(60000);
      expect(element.loading).to.be.false;
      expect(element.selectedSegment).to.equal('all');
      expect(element.comparisonMode).to.be.false;
      expect(element.showSettings).to.be.false;
    });

    it('should initialize data structures', () => {
      expect(element.journeyData).to.be.an('object');
      expect(element.funnelData).to.be.an('array');
      expect(element.flowData).to.be.an('array');
      expect(element.metricsData).to.be.an('object');
      expect(element.insights).to.be.an('array');
    });

    it('should set up date range correctly', () => {
      expect(element.dateRange).to.have.property('start');
      expect(element.dateRange).to.have.property('end');
      expect(element.dateRange.start).to.be.instanceOf(Date);
      expect(element.dateRange.end).to.be.instanceOf(Date);
    });

    it('should load analytics data on connection', async () => {
      expect(apiStub.called).to.be.true;
      expect(element.lastUpdate).to.be.a('number');
    });
  });

  describe('Data Loading and Processing', () => {
    beforeEach(async () => {
      await element.loadAnalyticsData();
    });

    it('should fetch metrics from API', () => {
      expect(apiStub.called).to.be.true;
      expect(element.metricsData).to.have.property('totalSessions');
    });

    it('should process metrics correctly', () => {
      const metrics = element.metricsData;

      expect(metrics.totalSessions).to.be.a('number');
      expect(metrics.uniqueUsers).to.be.a('number');
      expect(metrics.conversionRate).to.be.a('number');
      expect(metrics.pageViews).to.be.a('number');
    });

    it('should calculate trends', () => {
      if (element.metricsData.trends) {
        expect(element.metricsData.trends).to.have.property('sessions');
        expect(element.metricsData.trends.sessions).to.have.property('direction');
        expect(element.metricsData.trends.sessions).to.have.property('percentage');
      }
    });

    it('should generate insights based on metrics', () => {
      expect(element.insights).to.be.an('array');

      if (element.insights.length > 0) {
        const insight = element.insights[0];
        expect(insight).to.have.property('type');
        expect(insight).to.have.property('severity');
        expect(insight).to.have.property('title');
        expect(insight).to.have.property('description');
        expect(insight).to.have.property('recommendations');
      }
    });

    it('should handle API errors gracefully', async () => {
      apiStub.restore();
      apiStub = stub(window, 'fetch').rejects(new Error('Network error'));

      await element.loadAnalyticsData();

      expect(element.loading).to.be.false;
      // Should not crash and should maintain empty state
      expect(element.metricsData).to.be.an('object');
    });
  });

  describe('Real-time Updates', () => {
    it('should start real-time updates when enabled', () => {
      element.autoRefresh = true;
      element.startRealTimeUpdates();

      expect(element.refreshTimer).to.exist;
    });

    it('should stop real-time updates when disabled', () => {
      element.autoRefresh = true;
      element.startRealTimeUpdates();
      element.stopRealTimeUpdates();

      expect(element.refreshTimer).to.be.null;
    });

    it('should refresh data at specified intervals', async () => {
      element.autoRefresh = true;
      element.refreshInterval = 1000;
      element.startRealTimeUpdates();

      const loadDataSpy = spy(element, 'loadAnalyticsData');

      clock.tick(1000);

      expect(loadDataSpy.called).to.be.true;
    });

    it('should handle journey events in real-time', () => {
      const initialSessions = element.metricsData.totalSessions || 0;

      const journeyEvent = new CustomEvent('journey-event', {
        detail: {
          event_type: 'journey_start',
          session_id: 'test123',
          timestamp: Date.now()
        }
      });

      element.handleJourneyEvent(journeyEvent);

      expect(element.metricsData.totalSessions).to.equal(initialSessions + 1);
    });

    it('should update last update timestamp', () => {
      const initialTimestamp = element.lastUpdate;

      clock.tick(5000);

      element.handleJourneyEvent(new CustomEvent('journey-event', {
        detail: { event_type: 'test' }
      }));

      expect(element.lastUpdate).to.be.greaterThan(initialTimestamp);
    });
  });

  describe('View Management', () => {
    it('should change active view', async () => {
      element.handleViewChange('funnel');
      await element.updateComplete;

      expect(element.activeView).to.equal('funnel');
    });

    it('should render different views correctly', async () => {
      // Overview view
      element.activeView = 'overview';
      await element.updateComplete;
      let content = element.shadowRoot.querySelector('.view-content');
      expect(content).to.exist;

      // Funnel view
      element.activeView = 'funnel';
      await element.updateComplete;
      content = element.shadowRoot.querySelector('.view-content');
      expect(content).to.exist;

      // Flow view
      element.activeView = 'flow';
      await element.updateComplete;
      content = element.shadowRoot.querySelector('.view-content');
      expect(content).to.exist;
    });

    it('should show active tab styling', async () => {
      element.activeView = 'funnel';
      await element.updateComplete;

      const tabs = element.shadowRoot.querySelectorAll('.view-tab');
      const activeTab = Array.from(tabs).find(tab =>
        tab.textContent.includes('Funnel')
      );

      expect(activeTab.classList.contains('active')).to.be.true;
    });
  });

  describe('Time Range Management', () => {
    it('should handle time range changes', async () => {
      const loadDataSpy = spy(element, 'loadAnalyticsData');

      const event = { target: { value: '30d' } };
      element.handleTimeRangeChange(event);

      expect(element.timeRange).to.equal('30d');
      expect(loadDataSpy.called).to.be.true;
    });

    it('should calculate date ranges correctly', () => {
      const ranges = {
        '1d': 1,
        '7d': 7,
        '30d': 30,
        '90d': 90
      };

      Object.entries(ranges).forEach(([range, days]) => {
        const dateRange = element.getDateRange(range);
        const daysDiff = Math.round((dateRange.end - dateRange.start) / (1000 * 60 * 60 * 24));
        expect(daysDiff).to.equal(days);
      });
    });

    it('should update date range when time range changes', () => {
      element.timeRange = '30d';
      element.dateRange = element.getDateRange(element.timeRange);

      const daysDiff = Math.round((element.dateRange.end - element.dateRange.start) / (1000 * 60 * 60 * 24));
      expect(daysDiff).to.equal(30);
    });
  });

  describe('Settings Management', () => {
    it('should toggle auto refresh', () => {
      const initialState = element.autoRefresh;

      element.toggleAutoRefresh();

      expect(element.autoRefresh).to.equal(!initialState);
    });

    it('should start/stop refresh timer with auto refresh toggle', () => {
      element.autoRefresh = false;
      element.toggleAutoRefresh();

      expect(element.refreshTimer).to.exist;

      element.toggleAutoRefresh();
      expect(element.refreshTimer).to.be.null;
    });

    it('should toggle comparison mode', () => {
      const initialState = element.comparisonMode;

      element.toggleComparisonMode();

      expect(element.comparisonMode).to.equal(!initialState);
    });

    it('should toggle settings panel', async () => {
      element.toggleSettings();
      await element.updateComplete;

      expect(element.showSettings).to.be.true;

      const settingsPanel = element.shadowRoot.querySelector('.settings-panel');
      expect(settingsPanel.classList.contains('visible')).to.be.true;
    });

    it('should update refresh interval', () => {
      element.refreshInterval = 30000;
      expect(element.refreshInterval).to.equal(30000);
    });
  });

  describe('Metric Card Rendering', () => {
    beforeEach(async () => {
      element.metricsData = {
        totalSessions: 1000,
        uniqueUsers: 800,
        conversionRate: 5.2,
        bounceRate: 35.7,
        averageSessionDuration: 180000,
        pageViews: 2500,
        trends: {
          sessions: { direction: 'positive', percentage: '15.2' },
          conversion: { direction: 'positive', percentage: '8.7' }
        }
      };
      await element.updateComplete;
    });

    it('should render metric cards in overview', async () => {
      element.activeView = 'overview';
      await element.updateComplete;

      const metricCards = element.shadowRoot.querySelectorAll('.metric-card');
      expect(metricCards.length).to.be.greaterThan(0);
    });

    it('should display formatted numbers', () => {
      expect(element.formatNumber(1234)).to.equal('1.2K');
      expect(element.formatNumber(1234567)).to.equal('1.2M');
      expect(element.formatNumber(123)).to.equal('123');
    });

    it('should format duration correctly', () => {
      expect(element.formatDuration(60000)).to.equal('1:00');
      expect(element.formatDuration(125000)).to.equal('2:05');
      expect(element.formatDuration(3661000)).to.equal('61:01');
    });

    it('should show trend indicators', async () => {
      element.activeView = 'overview';
      await element.updateComplete;

      const trendElements = element.shadowRoot.querySelectorAll('.metric-trend');
      expect(trendElements.length).to.be.greaterThan(0);
    });
  });

  describe('Insights Management', () => {
    beforeEach(async () => {
      element.insights = [
        {
          id: 'test_insight_1',
          type: 'warning',
          priority: 'high',
          title: 'High Bounce Rate',
          description: 'Bounce rate is above 60%',
          recommendations: ['Improve landing pages', 'Add engaging content']
        },
        {
          id: 'test_insight_2',
          type: 'success',
          priority: 'low',
          title: 'Growing Traffic',
          description: 'Sessions increased by 20%',
          recommendations: ['Continue current strategy']
        }
      ];
      await element.updateComplete;
    });

    it('should render insights panel when insights exist', async () => {
      element.activeView = 'overview';
      await element.updateComplete;

      const insightsPanel = element.shadowRoot.querySelector('.insights-panel');
      expect(insightsPanel).to.exist;
    });

    it('should render individual insights', async () => {
      element.activeView = 'overview';
      await element.updateComplete;

      const insightItems = element.shadowRoot.querySelectorAll('.insight-item');
      expect(insightItems.length).to.equal(2);
    });

    it('should toggle insight expansion', async () => {
      element.activeView = 'overview';
      await element.updateComplete;

      const insightId = element.insights[0].id;

      element.toggleInsight(insightId);
      expect(element.expandedInsights.has(insightId)).to.be.true;

      element.toggleInsight(insightId);
      expect(element.expandedInsights.has(insightId)).to.be.false;
    });

    it('should show expanded recommendations', async () => {
      element.activeView = 'overview';
      element.expandedInsights.add(element.insights[0].id);
      await element.updateComplete;

      const recommendations = element.shadowRoot.querySelector('.insight-recommendations');
      expect(recommendations).to.exist;
    });

    it('should apply correct styling based on insight type', async () => {
      element.activeView = 'overview';
      await element.updateComplete;

      const warningInsight = element.shadowRoot.querySelector('.insight-item.warning');
      const successInsight = element.shadowRoot.querySelector('.insight-item.success');

      expect(warningInsight).to.exist;
      expect(successInsight).to.exist;
    });
  });

  describe('Component Event Handling', () => {
    it('should handle step selection from funnel chart', () => {
      const stepData = {
        step: { name: 'Checkout', index: 2 },
        data: { insights: [], recommendations: [] }
      };

      const event = new CustomEvent('step-selected', { detail: stepData });
      element.handleStepSelected(event);

      expect(element.selectedSegment).to.equal('Checkout');
    });

    it('should handle node selection from flow diagram', () => {
      const nodeData = {
        node: { title: 'Product Page', path: '/product' },
        paths: [['Home', 'Product', 'Cart']]
      };

      const event = new CustomEvent('node-selected', { detail: nodeData });
      element.handleNodeSelected(event);

      expect(element.selectedSegment).to.equal('Product Page');
    });

    it('should recalculate conversion rate on conversion events', () => {
      element.metricsData = { totalSessions: 100, conversionRate: 2.0 };

      element.recalculateConversionRate();

      expect(element.metricsData.conversionRate).to.be.a('number');
    });
  });

  describe('Loading States', () => {
    it('should show loading overlay when loading', async () => {
      element.loading = true;
      await element.updateComplete;

      const loadingOverlay = element.shadowRoot.querySelector('.loading-overlay');
      expect(loadingOverlay).to.exist;
    });

    it('should hide loading overlay when not loading', async () => {
      element.loading = false;
      await element.updateComplete;

      const loadingOverlay = element.shadowRoot.querySelector('.loading-overlay');
      expect(loadingOverlay).to.be.null;
    });

    it('should set loading state during data fetch', async () => {
      expect(element.loading).to.be.false;

      const loadPromise = element.loadAnalyticsData();
      expect(element.loading).to.be.true;

      await loadPromise;
      expect(element.loading).to.be.false;
    });
  });

  describe('Journey Tracker Integration', () => {
    it('should render journey tracker component', () => {
      const journeyTracker = element.shadowRoot.querySelector('journey-tracker');
      expect(journeyTracker).to.exist;
      expect(journeyTracker.autoTrack).to.be.true;
    });

    it('should set up event listeners for journey events', () => {
      const eventSpy = spy(element, 'handleJourneyEvent');

      const journeyEvent = new CustomEvent('journey-event', {
        detail: { event_type: 'test' },
        bubbles: true
      });

      element.dispatchEvent(journeyEvent);

      // Event should be handled (note: depends on event bubbling setup)
      expect(eventSpy.called).to.be.true;
    });
  });

  describe('Dashboard Header', () => {
    it('should display dashboard title and subtitle', async () => {
      await element.updateComplete;

      const title = element.shadowRoot.querySelector('.dashboard-title');
      const subtitle = element.shadowRoot.querySelector('.dashboard-subtitle');

      expect(title).to.exist;
      expect(title.textContent).to.include('User Journey Analytics');
      expect(subtitle).to.exist;
    });

    it('should show last update time', async () => {
      element.lastUpdate = Date.now();
      await element.updateComplete;

      const lastUpdate = element.shadowRoot.querySelector('.last-update');
      expect(lastUpdate).to.exist;
    });

    it('should show update indicator when auto-refresh is active', async () => {
      element.autoRefresh = true;
      await element.updateComplete;

      const indicator = element.shadowRoot.querySelector('.update-indicator');
      expect(indicator).to.exist;
    });

    it('should show selected segment filter', async () => {
      element.selectedSegment = 'Checkout';
      await element.updateComplete;

      const subtitle = element.shadowRoot.querySelector('.dashboard-subtitle');
      expect(subtitle.textContent).to.include('Checkout');
    });
  });

  describe('Dashboard Controls', () => {
    it('should render time range selector', async () => {
      await element.updateComplete;

      const timeRangeSelect = element.shadowRoot.querySelector('select[class*="control-select"]');
      expect(timeRangeSelect).to.exist;
    });

    it('should render auto refresh button', async () => {
      await element.updateComplete;

      const autoRefreshButton = Array.from(element.shadowRoot.querySelectorAll('.control-button'))
        .find(button => button.textContent.includes('Auto Refresh'));

      expect(autoRefreshButton).to.exist;
    });

    it('should render settings button', async () => {
      await element.updateComplete;

      const settingsButton = Array.from(element.shadowRoot.querySelectorAll('.control-button'))
        .find(button => button.textContent.includes('Settings'));

      expect(settingsButton).to.exist;
    });

    it('should show active state on auto refresh button', async () => {
      element.autoRefresh = true;
      await element.updateComplete;

      const autoRefreshButton = Array.from(element.shadowRoot.querySelectorAll('.control-button'))
        .find(button => button.textContent.includes('Auto Refresh'));

      expect(autoRefreshButton.classList.contains('active')).to.be.true;
    });
  });

  describe('Tab Navigation', () => {
    it('should render view tabs', async () => {
      await element.updateComplete;

      const tabs = element.shadowRoot.querySelectorAll('.view-tab');
      expect(tabs.length).to.equal(3); // Overview, Funnel, Flow
    });

    it('should handle tab clicks', async () => {
      await element.updateComplete;

      const funnelTab = Array.from(element.shadowRoot.querySelectorAll('.view-tab'))
        .find(tab => tab.textContent.includes('Funnel'));

      funnelTab.click();
      await element.updateComplete;

      expect(element.activeView).to.equal('funnel');
    });

    it('should show correct active tab', async () => {
      element.activeView = 'flow';
      await element.updateComplete;

      const activeTab = element.shadowRoot.querySelector('.view-tab.active');
      expect(activeTab.textContent).to.include('Flow');
    });
  });

  describe('Responsive Behavior', () => {
    it('should handle small screen layouts', async () => {
      // Simulate small screen
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 600,
      });

      element.dispatchEvent(new Event('resize'));
      await element.updateComplete;

      // Should still render correctly
      const container = element.shadowRoot.querySelector('.dashboard-container');
      expect(container).to.exist;
    });

    it('should adapt metric cards to screen size', async () => {
      await element.updateComplete;

      const metricsGrid = element.shadowRoot.querySelector('.metrics-overview');
      expect(metricsGrid).to.exist;
    });
  });

  describe('Error Boundaries', () => {
    it('should handle component rendering errors gracefully', async () => {
      // Simulate error state
      element.metricsData = null;

      expect(() => {
        element.requestUpdate();
      }).to.not.throw();
    });

    it('should handle missing data gracefully', async () => {
      element.insights = null;
      element.metricsData = {};
      await element.updateComplete;

      const container = element.shadowRoot.querySelector('.dashboard-container');
      expect(container).to.exist;
    });
  });

  describe('Cleanup', () => {
    it('should clean up timers on disconnect', () => {
      element.autoRefresh = true;
      element.startRealTimeUpdates();

      expect(element.refreshTimer).to.exist;

      element.disconnectedCallback();

      expect(element.refreshTimer).to.be.null;
    });

    it('should remove event listeners on disconnect', () => {
      const removeEventListenerSpy = spy(element, 'removeEventListeners');

      element.disconnectedCallback();

      expect(removeEventListenerSpy.called).to.be.true;
    });
  });

  describe('Data Validation', () => {
    it('should validate metrics data structure', () => {
      const validMetrics = {
        totalSessions: 1000,
        uniqueUsers: 800,
        conversionRate: 5.2
      };

      element.metricsData = validMetrics;

      expect(element.metricsData.totalSessions).to.be.a('number');
      expect(element.metricsData.uniqueUsers).to.be.a('number');
      expect(element.metricsData.conversionRate).to.be.a('number');
    });

    it('should handle invalid insights data', () => {
      element.insights = [{ invalid: 'data' }];

      expect(() => {
        element.renderInsight(element.insights[0]);
      }).to.not.throw();
    });
  });
});
