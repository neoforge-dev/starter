import { expect } from '@open-wc/testing';
import { fixture, html } from '@open-wc/testing';
import { spy, stub, useFakeTimers } from 'sinon';
import '../../src/components/atoms/journey-tracker.js';

describe('JourneyTracker', () => {
  let element;
  let clock;

  beforeEach(async () => {
    clock = useFakeTimers();
    element = await fixture(html`
      <journey-tracker .autoTrack=${false} .debug=${true}></journey-tracker>
    `);
  });

  afterEach(() => {
    clock.restore();
  });

  describe('Initialization', () => {
    it('should initialize with default properties', () => {
      expect(element.sessionId).to.exist;
      expect(element.sessionId).to.include('journey_');
      expect(element.autoTrack).to.be.false;
      expect(element.debug).to.be.true;
      expect(element.isTracking).to.be.false;
      expect(element.eventQueue).to.be.an('array').that.is.empty;
    });

    it('should generate unique session IDs', async () => {
      const element2 = await fixture(html`<journey-tracker></journey-tracker>`);
      expect(element.sessionId).to.not.equal(element2.sessionId);
    });

    it('should start tracking automatically when autoTrack is true', async () => {
      const autoElement = await fixture(html`
        <journey-tracker .autoTrack=${true}></journey-tracker>
      `);
      expect(autoElement.isTracking).to.be.true;
    });
  });

  describe('Event Tracking', () => {
    beforeEach(() => {
      element.startTracking();
    });

    afterEach(() => {
      element.stopTracking();
    });

    it('should track journey start event', () => {
      expect(element.eventQueue).to.have.length.greaterThan(0);

      const journeyStartEvent = element.eventQueue.find(
        event => event.event_type === 'journey_start'
      );

      expect(journeyStartEvent).to.exist;
      expect(journeyStartEvent.session_id).to.equal(element.sessionId);
      expect(journeyStartEvent.data.startUrl).to.equal(window.location.href);
    });

    it('should track custom events', () => {
      const eventData = { action: 'test_action', value: 123 };

      element.trackCustomEvent('test_event', eventData);

      const customEvent = element.eventQueue.find(
        event => event.event_type === 'custom_test_event'
      );

      expect(customEvent).to.exist;
      expect(customEvent.data.action).to.equal('test_action');
      expect(customEvent.data.value).to.equal(123);
    });

    it('should track conversion events', () => {
      element.trackConversion('purchase', 99.99, { productId: 'ABC123' });

      const conversionEvent = element.eventQueue.find(
        event => event.event_type === 'conversion'
      );

      expect(conversionEvent).to.exist;
      expect(conversionEvent.data.conversionType).to.equal('purchase');
      expect(conversionEvent.data.value).to.equal(99.99);
      expect(conversionEvent.data.productId).to.equal('ABC123');
    });

    it('should track funnel steps', () => {
      element.trackFunnelStep('checkout', 2, { cartValue: 149.99 });

      const funnelEvent = element.eventQueue.find(
        event => event.event_type === 'funnel_step'
      );

      expect(funnelEvent).to.exist;
      expect(funnelEvent.data.stepName).to.equal('checkout');
      expect(funnelEvent.data.stepIndex).to.equal(2);
      expect(funnelEvent.data.cartValue).to.equal(149.99);
    });

    it('should set user ID correctly', () => {
      element.setUserId('user123');

      expect(element.userId).to.equal('user123');

      const userEvent = element.eventQueue.find(
        event => event.event_type === 'user_identified'
      );

      expect(userEvent).to.exist;
      expect(userEvent.data.userId).to.equal('user123');
    });
  });

  describe('Page Transitions', () => {
    beforeEach(() => {
      element.startTracking();
      element.eventQueue = []; // Clear initial events
    });

    afterEach(() => {
      element.stopTracking();
    });

    it('should track page transitions', () => {
      const newPath = '/test-page';
      element.trackPageTransition(newPath);

      expect(element.currentPage).to.equal(newPath);
      expect(element.pageStartTime).to.exist;

      const pageEnterEvent = element.eventQueue.find(
        event => event.event_type === 'page_enter'
      );

      expect(pageEnterEvent).to.exist;
      expect(pageEnterEvent.data.page).to.equal(newPath);
    });

    it('should track page exit when transitioning', () => {
      // Set up initial page
      element.trackPageTransition('/initial-page');
      element.eventQueue = []; // Clear initial events

      // Advance time
      clock.tick(5000);

      // Transition to new page
      element.trackPageTransition('/new-page');

      const pageExitEvent = element.eventQueue.find(
        event => event.event_type === 'page_exit'
      );

      expect(pageExitEvent).to.exist;
      expect(pageExitEvent.data.page).to.equal('/initial-page');
      expect(pageExitEvent.data.timeOnPage).to.equal(5000);
    });

    it('should reset interaction count on page transition', () => {
      element.interactionCount = 5;
      element.trackPageTransition('/new-page');
      expect(element.interactionCount).to.equal(0);
    });

    it('should reset scroll depth on page transition', () => {
      element.scrollDepth = 75;
      element.maxScrollDepth = 90;
      element.trackPageTransition('/new-page');
      expect(element.scrollDepth).to.equal(0);
      expect(element.maxScrollDepth).to.equal(0);
    });
  });

  describe('Interaction Tracking', () => {
    beforeEach(() => {
      element.startTracking();
      element.eventQueue = []; // Clear initial events
    });

    afterEach(() => {
      element.stopTracking();
    });

    it('should track click interactions', () => {
      const mockClickEvent = {
        type: 'click',
        target: {
          tagName: 'BUTTON',
          id: 'test-button',
          className: 'btn btn-primary',
          textContent: 'Click me',
          href: null
        },
        clientX: 100,
        clientY: 200
      };

      element.handleInteraction(mockClickEvent);

      const clickEvent = element.eventQueue.find(
        event => event.event_type === 'click_interaction'
      );

      expect(clickEvent).to.exist;
      expect(clickEvent.data.element.tag).to.equal('button');
      expect(clickEvent.data.element.id).to.equal('test-button');
      expect(clickEvent.data.coordinates).to.deep.equal({ x: 100, y: 200 });
    });

    it('should increment interaction count', () => {
      const mockEvent = { type: 'click', target: { tagName: 'DIV' } };

      expect(element.interactionCount).to.equal(0);
      element.handleInteraction(mockEvent);
      expect(element.interactionCount).to.equal(1);
      element.handleInteraction(mockEvent);
      expect(element.interactionCount).to.equal(2);
    });
  });

  describe('Scroll Tracking', () => {
    beforeEach(() => {
      element.startTracking();
      element.eventQueue = []; // Clear initial events

      // Mock document dimensions
      stub(document.documentElement, 'scrollHeight').value(2000);
      stub(window, 'innerHeight').value(800);
      stub(window, 'pageYOffset').value(0);
    });

    afterEach(() => {
      element.stopTracking();
    });

    it('should track scroll depth milestones', () => {
      // Mock scroll to 25% (300px out of 1200px scrollable)
      window.pageYOffset = 300;
      element.handleScroll();

      const scrollEvent = element.eventQueue.find(
        event => event.event_type === 'scroll_depth' && event.data.depth === 25
      );

      expect(scrollEvent).to.exist;
      expect(element.maxScrollDepth).to.be.at.least(25);
    });

    it('should track maximum scroll depth', () => {
      // Scroll to 50%
      window.pageYOffset = 600;
      element.handleScroll();

      // Scroll back to 30%
      window.pageYOffset = 360;
      element.handleScroll();

      expect(element.maxScrollDepth).to.be.at.least(50);
    });

    it('should not track same milestone twice', () => {
      window.pageYOffset = 300;
      element.handleScroll();
      element.handleScroll(); // Second call at same position

      const scrollEvents = element.eventQueue.filter(
        event => event.event_type === 'scroll_depth' && event.data.depth === 25
      );

      expect(scrollEvents).to.have.length(1);
    });
  });

  describe('Event Queue Management', () => {
    let apiStub;

    beforeEach(() => {
      element.startTracking();

      // Mock API
      apiStub = stub(window, 'fetch').resolves({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });
    });

    afterEach(() => {
      element.stopTracking();
      if (apiStub) apiStub.restore();
    });

    it('should flush events periodically', async () => {
      element.trackCustomEvent('test');

      // Advance time to trigger flush
      clock.tick(element.flushInterval);

      // Wait for async flush
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(element.eventQueue).to.be.empty;
    });

    it('should flush critical events immediately', () => {
      const initialQueueLength = element.eventQueue.length;
      element.trackEvent('journey_end');

      expect(element.eventQueue.length).to.equal(initialQueueLength);
    });

    it('should handle API errors gracefully', async () => {
      apiStub.restore();
      apiStub = stub(window, 'fetch').rejects(new Error('Network error'));

      element.trackCustomEvent('test');

      // Should not throw error
      expect(() => {
        clock.tick(element.flushInterval);
      }).to.not.throw();
    });

    it('should limit queue size on repeated failures', async () => {
      apiStub.restore();
      apiStub = stub(window, 'fetch').rejects(new Error('Network error'));

      // Add many events
      for (let i = 0; i < 150; i++) {
        element.trackCustomEvent(`test${i}`);
      }

      clock.tick(element.flushInterval);
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(element.eventQueue.length).to.be.at.most(100);
    });
  });

  describe('Journey Metrics', () => {
    beforeEach(() => {
      element.startTracking();
      clock.tick(1000); // Advance time
    });

    afterEach(() => {
      element.stopTracking();
    });

    it('should calculate journey duration', () => {
      const journeyData = element.getJourneyData();
      expect(journeyData.duration).to.equal(1000);
    });

    it('should track bounce detection', () => {
      // Short session with minimal interaction
      clock.tick(2000);
      element.trackJourneyEnd();

      const journeyEndEvent = element.eventQueue.find(
        event => event.event_type === 'journey_end'
      );

      expect(journeyEndEvent.data.isBounce).to.be.true;
      expect(journeyEndEvent.data.isQuickExit).to.be.true;
    });

    it('should not mark as bounce for engaged sessions', () => {
      // Longer session with interactions
      element.interactionCount = 5;
      clock.tick(15000);
      element.trackJourneyEnd();

      const journeyEndEvent = element.eventQueue.find(
        event => event.event_type === 'journey_end'
      );

      expect(journeyEndEvent.data.isBounce).to.be.false;
      expect(journeyEndEvent.data.isQuickExit).to.be.false;
    });
  });

  describe('Visibility and Lifecycle', () => {
    beforeEach(() => {
      element.startTracking();
      element.eventQueue = []; // Clear initial events
    });

    afterEach(() => {
      element.stopTracking();
    });

    it('should track page visibility changes', () => {
      // Mock document.hidden
      stub(document, 'hidden').value(true);

      element.handlePageVisibilityChange();

      const hiddenEvent = element.eventQueue.find(
        event => event.event_type === 'page_hidden'
      );

      expect(hiddenEvent).to.exist;
    });

    it('should track return from hidden state', () => {
      stub(document, 'hidden').value(false);

      element.handlePageVisibilityChange();

      const visibleEvent = element.eventQueue.find(
        event => event.event_type === 'page_visible'
      );

      expect(visibleEvent).to.exist;
    });

    it('should stop tracking when disconnected', () => {
      expect(element.isTracking).to.be.true;

      element.disconnectedCallback();

      expect(element.isTracking).to.be.false;
    });
  });

  describe('Debug Mode', () => {
    it('should show debug indicator when debug is true', async () => {
      const debugElement = await fixture(html`
        <journey-tracker .debug=${true} .autoTrack=${true}></journey-tracker>
      `);

      const debugIndicator = debugElement.shadowRoot.querySelector('.debug-indicator');
      expect(debugIndicator).to.exist;
    });

    it('should hide debug indicator when debug is false', async () => {
      const normalElement = await fixture(html`
        <journey-tracker .debug=${false}></journey-tracker>
      `);

      const debugIndicator = normalElement.shadowRoot.querySelector('.debug-indicator');
      expect(debugIndicator).to.be.null;
    });

    it('should show active state in debug mode', async () => {
      const debugElement = await fixture(html`
        <journey-tracker .debug=${true} .autoTrack=${true}></journey-tracker>
      `);

      const debugIndicator = debugElement.shadowRoot.querySelector('.debug-indicator');
      expect(debugIndicator.classList.contains('active')).to.be.true;
    });
  });

  describe('Custom Events', () => {
    beforeEach(() => {
      element.startTracking();
      element.eventQueue = []; // Clear initial events
    });

    afterEach(() => {
      element.stopTracking();
    });

    it('should dispatch custom events for real-time listening', () => {
      const eventSpy = spy();
      element.addEventListener('journey-event', eventSpy);

      element.trackCustomEvent('test_event', { data: 'test' });

      expect(eventSpy.calledOnce).to.be.true;

      const customEvent = eventSpy.getCall(0).args[0];
      expect(customEvent.detail.event_type).to.equal('custom_test_event');
      expect(customEvent.detail.data.data).to.equal('test');
    });

    it('should include journey time in all events', () => {
      clock.tick(5000);
      element.trackCustomEvent('test');

      const event = element.eventQueue[0];
      expect(event.data.journey_time).to.equal(5000);
    });

    it('should include current page information in events', () => {
      element.trackPageTransition('/test-page');
      element.eventQueue = []; // Clear page events

      element.trackCustomEvent('test');

      const event = element.eventQueue[0];
      expect(event.page_path).to.equal('/test-page');
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing user agent gracefully', () => {
      const originalUserAgent = navigator.userAgent;
      stub(navigator, 'userAgent').value('');

      element.startTracking();

      const journeyStartEvent = element.eventQueue.find(
        event => event.event_type === 'journey_start'
      );

      expect(journeyStartEvent).to.exist;
      expect(journeyStartEvent.data.userAgent).to.equal('');
    });

    it('should handle zero document height in scroll calculation', () => {
      stub(document.documentElement, 'scrollHeight').value(800);
      stub(window, 'innerHeight').value(800);
      stub(window, 'pageYOffset').value(0);

      element.startTracking();
      element.handleScroll();

      expect(element.scrollDepth).to.equal(0);
    });

    it('should handle null event targets in interactions', () => {
      const mockEvent = {
        type: 'click',
        target: null
      };

      element.startTracking();
      expect(() => {
        element.handleInteraction(mockEvent);
      }).to.not.throw();
    });
  });
});
