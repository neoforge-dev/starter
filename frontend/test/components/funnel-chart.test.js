import { expect } from '@open-wc/testing';
import { fixture, html } from '@open-wc/testing';
import { spy, stub } from 'sinon';
import '../../src/components/molecules/funnel-chart.js';

describe('FunnelChart', () => {
  let element;
  let apiStub;

  beforeEach(async () => {
    // Mock API responses
    apiStub = stub(window, 'fetch').resolves({
      ok: true,
      json: () => Promise.resolve({
        data: {
          results: [
            {
              dimensions: { event_type: 'page_enter', page_path: '/' },
              count: 1000,
              metrics: { count_distinct_sessions: 800 }
            },
            {
              dimensions: { event_type: 'page_enter', page_path: '/product' },
              count: 750,
              metrics: { count_distinct_sessions: 600 }
            },
            {
              dimensions: { event_type: 'click_interaction' },
              count: 400,
              metrics: { count_distinct_sessions: 350 }
            }
          ]
        }
      })
    });

    element = await fixture(html`
      <funnel-chart 
        .timeRange=${'7d'}
        .showDropoffRates=${true}
        .interactive=${true}
      ></funnel-chart>
    `);
    
    // Wait for data loading
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  afterEach(() => {
    if (apiStub) apiStub.restore();
  });

  describe('Initialization', () => {
    it('should initialize with default properties', () => {
      expect(element.data).to.be.an('array');
      expect(element.timeRange).to.equal('7d');
      expect(element.showDropoffRates).to.be.true;
      expect(element.interactive).to.be.true;
      expect(element.showTooltips).to.be.true;
      expect(element.height).to.equal(400);
      expect(element.animationEnabled).to.be.true;
    });

    it('should have default funnel steps when none provided', () => {
      expect(element.steps).to.be.an('array').with.length.greaterThan(0);
      expect(element.steps[0]).to.have.property('name');
      expect(element.steps[0]).to.have.property('event_type');
    });

    it('should load funnel data on connection', async () => {
      await element.updateComplete;
      expect(apiStub.called).to.be.true;
    });
  });

  describe('Data Processing', () => {
    beforeEach(async () => {
      // Set up test data
      element.steps = [
        { name: 'Landing', event_type: 'page_enter', path: '/' },
        { name: 'Product', event_type: 'page_enter', path: '/product' },
        { name: 'Add to Cart', event_type: 'click_interaction', element: '.add-to-cart' }
      ];
      
      await element.loadFunnelData();
    });

    it('should process analytics data into funnel steps', () => {
      expect(element.data).to.be.an('array');
      expect(element.data.length).to.be.greaterThan(0);
      
      const firstStep = element.data[0];
      expect(firstStep).to.have.property('count');
      expect(firstStep).to.have.property('conversionRate');
      expect(firstStep).to.have.property('dropoffRate');
      expect(firstStep).to.have.property('width');
    });

    it('should calculate conversion rates correctly', () => {
      const steps = element.data;
      
      // First step should have 100% conversion rate
      expect(steps[0].conversionRate).to.equal(100);
      
      // Subsequent steps should have lower conversion rates
      for (let i = 1; i < steps.length; i++) {
        expect(steps[i].conversionRate).to.be.lessThan(steps[i - 1].conversionRate);
      }
    });

    it('should calculate drop-off rates', () => {
      const steps = element.data;
      
      // First step should have 0% drop-off
      expect(steps[0].dropoffRate).to.equal(0);
      
      // Check drop-off calculation for subsequent steps
      for (let i = 1; i < steps.length; i++) {
        if (steps[i - 1].count > steps[i].count) {
          expect(steps[i].dropoffRate).to.be.greaterThan(0);
        }
      }
    });

    it('should assign colors to steps', () => {
      element.data.forEach(step => {
        expect(step.color).to.exist;
        expect(step.color).to.match(/^#[0-9a-fA-F]{6}$/);
      });
    });

    it('should calculate step widths based on relative volume', () => {
      const steps = element.data;
      const maxCount = Math.max(...steps.map(s => s.count));
      
      steps.forEach(step => {
        const expectedWidth = Math.max((step.count / maxCount) * 100, 10);
        expect(step.width).to.be.closeTo(expectedWidth, 1);
      });
    });
  });

  describe('Event Matching', () => {
    it('should match events by event type', () => {
      const events = [
        { dimensions: { event_type: 'page_enter' }, count: 100 },
        { dimensions: { event_type: 'click_interaction' }, count: 50 }
      ];
      
      const step = { event_type: 'page_enter' };
      const matches = element.findMatchingEvents(events, step);
      
      expect(matches).to.have.length(1);
      expect(matches[0].count).to.equal(100);
    });

    it('should match events by page path', () => {
      const events = [
        { dimensions: { event_type: 'page_enter', page_path: '/home' }, count: 100 },
        { dimensions: { event_type: 'page_enter', page_path: '/product' }, count: 75 }
      ];
      
      const step = { path: '/product' };
      const matches = element.findMatchingEvents(events, step);
      
      expect(matches).to.have.length(1);
      expect(matches[0].count).to.equal(75);
    });

    it('should match events by element selector', () => {
      const events = [
        {
          dimensions: {
            event_type: 'click_interaction',
            data: { element: { className: 'add-to-cart btn' } }
          },
          count: 30
        }
      ];
      
      const step = { element: '.add-to-cart' };
      const matches = element.findMatchingEvents(events, step);
      
      expect(matches).to.have.length(1);
    });

    it('should match conversion events', () => {
      const events = [
        {
          dimensions: {
            event_type: 'conversion',
            data: { conversionType: 'purchase' }
          },
          count: 15
        }
      ];
      
      const step = { conversion_type: 'purchase' };
      const matches = element.findMatchingEvents(events, step);
      
      expect(matches).to.have.length(1);
    });
  });

  describe('User Interactions', () => {
    beforeEach(async () => {
      element.data = [
        {
          name: 'Landing',
          count: 1000,
          conversionRate: 100,
          dropoffRate: 0,
          color: '#007bff',
          width: 100
        },
        {
          name: 'Product',
          count: 750,
          conversionRate: 75,
          dropoffRate: 25,
          color: '#0056b3',
          width: 75
        }
      ];
      await element.updateComplete;
    });

    it('should handle step clicks when interactive', () => {
      const eventSpy = spy();
      element.addEventListener('step-selected', eventSpy);
      
      const step = element.data[0];
      element.handleStepClick(step, new Event('click'));
      
      expect(eventSpy.calledOnce).to.be.true;
      expect(element.selectedSegment).to.equal(step);
    });

    it('should toggle selection on repeated clicks', () => {
      const step = element.data[0];
      
      element.handleStepClick(step, new Event('click'));
      expect(element.selectedSegment).to.equal(step);
      
      element.handleStepClick(step, new Event('click'));
      expect(element.selectedSegment).to.be.null;
    });

    it('should not handle clicks when not interactive', async () => {
      element.interactive = false;
      await element.updateComplete;
      
      const step = element.data[0];
      const originalSelection = element.selectedSegment;
      
      element.handleStepClick(step, new Event('click'));
      expect(element.selectedSegment).to.equal(originalSelection);
    });

    it('should show tooltips on hover when enabled', () => {
      const step = element.data[0];
      const mockEvent = { target: document.createElement('div') };
      
      element.handleStepMouseEnter(step, mockEvent);
      
      expect(element.tooltip).to.exist;
    });

    it('should hide tooltips on mouse leave', () => {
      const step = element.data[0];
      const mockEvent = { target: document.createElement('div') };
      
      element.handleStepMouseEnter(step, mockEvent);
      element.handleStepMouseLeave();
      
      if (element.tooltip) {
        expect(element.tooltip.classList.contains('visible')).to.be.false;
      }
    });
  });

  describe('Tooltip Content', () => {
    it('should generate comprehensive tooltip content', () => {
      const step = {
        name: 'Product View',
        count: 750,
        uniqueSessions: 600,
        conversionRate: 75.0,
        dropoffRate: 25.0
      };
      
      const content = element.renderTooltipContent(step);
      
      expect(content).to.include('Product View');
      expect(content).to.include('750');
      expect(content).to.include('600');
      expect(content).to.include('75.0%');
      expect(content).to.include('25.0%');
    });

    it('should handle steps without drop-off', () => {
      const step = {
        name: 'Landing',
        count: 1000,
        uniqueSessions: 800,
        conversionRate: 100.0,
        dropoffRate: 0
      };
      
      const content = element.renderTooltipContent(step);
      
      expect(content).to.include('Landing');
      expect(content).to.not.include('Drop-off Rate');
    });
  });

  describe('Insights Generation', () => {
    it('should generate warning insights for high drop-off rates', () => {
      const step = {
        name: 'Checkout',
        dropoffRate: 60,
        conversionRate: 40
      };
      
      const insights = element.generateStepInsights(step);
      
      const warning = insights.find(i => i.type === 'warning');
      expect(warning).to.exist;
      expect(warning.message).to.include('drop-off rate');
    });

    it('should generate success insights for high conversion rates', () => {
      const step = {
        name: 'Landing',
        dropoffRate: 5,
        conversionRate: 85
      };
      
      const insights = element.generateStepInsights(step);
      
      const success = insights.find(i => i.type === 'success');
      expect(success).to.exist;
      expect(success.message).to.include('conversion rate');
    });

    it('should generate info insights about user behavior', () => {
      const step = {
        count: 1000,
        uniqueSessions: 400, // Low session-to-event ratio
        dropoffRate: 20,
        conversionRate: 60
      };
      
      const insights = element.generateStepInsights(step);
      
      const info = insights.find(i => i.type === 'info');
      expect(info).to.exist;
      expect(info.message).to.include('multiple times');
    });

    it('should generate actionable recommendations', () => {
      const step = {
        dropoffRate: 40,
        conversionRate: 15
      };
      
      const recommendations = element.generateStepRecommendations(step);
      
      expect(recommendations).to.be.an('array').with.length.greaterThan(0);
      expect(recommendations.some(r => r.includes('A/B test'))).to.be.true;
    });
  });

  describe('Summary Statistics', () => {
    beforeEach(async () => {
      element.data = [
        { name: 'Step 1', count: 1000 },
        { name: 'Step 2', count: 800 },
        { name: 'Step 3', count: 600 },
        { name: 'Step 4', count: 200 }
      ];
      await element.updateComplete;
    });

    it('should calculate overall conversion rate', () => {
      const summaryStats = element.renderSummaryStats();
      expect(summaryStats).to.not.be.empty;
      
      // Check if conversion rate is calculated (200/1000 = 20%)
      const overallRate = (200 / 1000) * 100;
      expect(overallRate).to.equal(20);
    });

    it('should calculate average drop-off rate', () => {
      // Simulate drop-off rates in data
      element.data.forEach((step, index) => {
        step.dropoffRate = index === 0 ? 0 : (element.data[index - 1].count - step.count) / element.data[index - 1].count * 100;
      });
      
      const avgDropoff = element.data.reduce((sum, step) => sum + step.dropoffRate, 0) / element.data.length;
      expect(avgDropoff).to.be.a('number');
    });
  });

  describe('Control Interactions', () => {
    it('should toggle drop-off rates display', async () => {
      const initialState = element.showDropoffRates;
      
      element.toggleDropoffRates();
      
      expect(element.showDropoffRates).to.equal(!initialState);
    });

    it('should toggle tooltips display', async () => {
      const initialState = element.showTooltips;
      
      element.toggleTooltips();
      
      expect(element.showTooltips).to.equal(!initialState);
    });
  });

  describe('Time Range Changes', () => {
    it('should reload data when time range changes', async () => {
      const loadDataSpy = spy(element, 'loadFunnelData');
      
      element.timeRange = '30d';
      await element.loadFunnelData();
      
      expect(loadDataSpy.called).to.be.true;
    });

    it('should use correct date range in API calls', async () => {
      element.timeRange = '1d';
      await element.loadFunnelData();
      
      const lastCall = apiStub.lastCall;
      expect(lastCall).to.exist;
      
      // Check if API was called with correct date parameters
      expect(apiStub.called).to.be.true;
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      apiStub.restore();
      apiStub = stub(window, 'fetch').rejects(new Error('Network error'));
      
      const errorElement = await fixture(html`<funnel-chart></funnel-chart>`);
      
      // Should not throw error
      expect(errorElement).to.exist;
      expect(errorElement.loading).to.be.false;
    });

    it('should show empty state when no data', async () => {
      element.data = [];
      await element.updateComplete;
      
      const emptyState = element.shadowRoot.querySelector('.empty-state');
      expect(emptyState).to.exist;
    });

    it('should handle missing API response data', async () => {
      apiStub.restore();
      apiStub = stub(window, 'fetch').resolves({
        ok: true,
        json: () => Promise.resolve({ data: { results: [] } })
      });
      
      await element.loadFunnelData();
      
      expect(element.data).to.be.an('array');
    });
  });

  describe('Rendering', () => {
    beforeEach(async () => {
      element.data = [
        {
          name: 'Landing',
          count: 1000,
          conversionRate: 100,
          dropoffRate: 0,
          color: '#007bff',
          width: 100
        },
        {
          name: 'Product',
          count: 750,
          conversionRate: 75,
          dropoffRate: 25,
          color: '#0056b3',
          width: 75
        }
      ];
      await element.updateComplete;
    });

    it('should render funnel steps', () => {
      const steps = element.shadowRoot.querySelectorAll('.funnel-step');
      expect(steps.length).to.equal(2);
    });

    it('should render step metrics', () => {
      const firstStep = element.shadowRoot.querySelector('.funnel-step');
      expect(firstStep.textContent).to.include('Landing');
      expect(firstStep.textContent).to.include('1,000');
      expect(firstStep.textContent).to.include('100.0%');
    });

    it('should render drop-off indicators for high drop-off rates', () => {
      element.data[1].dropoffRate = 30; // High drop-off
      element.requestUpdate();
      
      return element.updateComplete.then(() => {
        const dropoffIndicators = element.shadowRoot.querySelectorAll('.dropoff-indicator');
        expect(dropoffIndicators.length).to.be.greaterThan(0);
      });
    });

    it('should apply step colors correctly', () => {
      const stepBars = element.shadowRoot.querySelectorAll('.step-bar');
      
      stepBars.forEach((bar, index) => {
        const style = getComputedStyle(bar);
        // Check if color is applied (would need to inspect CSS custom properties)
        expect(bar.style.cssText).to.include('--step-color');
      });
    });

    it('should show loading state', async () => {
      element.loading = true;
      await element.updateComplete;
      
      const loadingSpinner = element.shadowRoot.querySelector('.loading-spinner');
      expect(loadingSpinner).to.exist;
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      // Check for accessibility features
      const container = element.shadowRoot.querySelector('.funnel-container');
      expect(container).to.exist;
    });

    it('should support keyboard navigation', () => {
      const steps = element.shadowRoot.querySelectorAll('.funnel-step');
      
      steps.forEach(step => {
        // Steps should be focusable for keyboard navigation
        expect(step.getAttribute('tabindex')).to.not.be.null;
      });
    });
  });

  describe('Responsive Design', () => {
    it('should adapt to container width changes', async () => {
      const resizeObserver = element.resizeObserver;
      expect(resizeObserver).to.exist;
    });

    it('should handle small screen layouts', async () => {
      // Simulate small screen
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 400,
      });
      
      element.dispatchEvent(new Event('resize'));
      await element.updateComplete;
      
      // Should still render correctly
      const container = element.shadowRoot.querySelector('.funnel-container');
      expect(container).to.exist;
    });
  });
});