import { LitElement, html, css } from 'lit';
import { apiService as api } from '../../services/api.js';

/**
 * Journey Tracker Component (Atom)
 * Core functionality for session-based user journey recording
 * Automatically tracks page transitions, timing data, and user interactions
 * @element journey-tracker
 */
export class JourneyTracker extends LitElement {
  static get properties() {
    return {
      sessionId: { type: String },
      userId: { type: String },
      autoTrack: { type: Boolean },
      eventQueue: { type: Array },
      isTracking: { type: Boolean },
      flushInterval: { type: Number },
      debug: { type: Boolean },
    };
  }

  static get styles() {
    return css`
      :host {
        display: none; /* Invisible component for tracking */
      }
      
      .debug-indicator {
        position: fixed;
        top: 10px;
        right: 10px;
        background: rgba(0, 123, 255, 0.1);
        color: #007bff;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        border: 1px solid rgba(0, 123, 255, 0.2);
        z-index: 10000;
      }
      
      .debug-indicator.active {
        background: rgba(40, 167, 69, 0.1);
        color: #28a745;
        border-color: rgba(40, 167, 69, 0.2);
      }
    `;
  }

  constructor() {
    super();
    this.sessionId = this.generateSessionId();
    this.userId = null;
    this.autoTrack = true;
    this.eventQueue = [];
    this.isTracking = false;
    this.flushInterval = 5000; // 5 seconds
    this.debug = false;
    
    // Journey tracking data
    this.currentPage = null;
    this.pageStartTime = null;
    this.journeyStartTime = Date.now();
    this.interactionCount = 0;
    this.scrollDepth = 0;
    this.maxScrollDepth = 0;
    
    // Timing thresholds
    this.QUICK_EXIT_THRESHOLD = 3000; // 3 seconds
    this.BOUNCE_THRESHOLD = 10000; // 10 seconds
    
    // Bound methods for event listeners
    this.handlePageVisibilityChange = this.handlePageVisibilityChange.bind(this);
    this.handleBeforeUnload = this.handleBeforeUnload.bind(this);
    this.handleScroll = this.handleScroll.bind(this);
    this.handleInteraction = this.handleInteraction.bind(this);
  }

  connectedCallback() {
    super.connectedCallback();
    if (this.autoTrack) {
      this.startTracking();
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.stopTracking();
  }

  generateSessionId() {
    return `journey_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  startTracking() {
    if (this.isTracking) return;
    
    this.isTracking = true;
    this.setupEventListeners();
    this.startFlushTimer();
    this.trackJourneyStart();
    
    if (this.debug) {
      console.log(`[JourneyTracker] Started tracking with session: ${this.sessionId}`);
    }
  }

  stopTracking() {
    if (!this.isTracking) return;
    
    this.isTracking = false;
    this.removeEventListeners();
    this.clearFlushTimer();
    this.flushEventQueue();
    this.trackJourneyEnd();
  }

  setupEventListeners() {
    // Page visibility and unload
    document.addEventListener('visibilitychange', this.handlePageVisibilityChange);
    window.addEventListener('beforeunload', this.handleBeforeUnload);
    
    // Scroll tracking
    window.addEventListener('scroll', this.handleScroll, { passive: true });
    
    // Interaction tracking
    ['click', 'keydown', 'touchstart', 'mousemove'].forEach(eventType => {
      document.addEventListener(eventType, this.handleInteraction, { passive: true });
    });
    
    // Route changes (for SPAs)
    window.addEventListener('popstate', () => {
      this.trackPageTransition(window.location.pathname);
    });
  }

  removeEventListeners() {
    document.removeEventListener('visibilitychange', this.handlePageVisibilityChange);
    window.removeEventListener('beforeunload', this.handleBeforeUnload);
    window.removeEventListener('scroll', this.handleScroll);
    
    ['click', 'keydown', 'touchstart', 'mousemove'].forEach(eventType => {
      document.removeEventListener(eventType, this.handleInteraction);
    });
  }

  startFlushTimer() {
    this.flushTimer = setInterval(() => {
      this.flushEventQueue();
    }, this.flushInterval);
  }

  clearFlushTimer() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }

  handlePageVisibilityChange() {
    if (document.hidden) {
      this.trackEvent('page_hidden', {
        timeOnPage: this.getTimeOnCurrentPage(),
        scrollDepth: this.maxScrollDepth,
        interactionCount: this.interactionCount,
      });
    } else {
      this.trackEvent('page_visible', {
        returnTime: Date.now(),
      });
    }
  }

  handleBeforeUnload() {
    this.trackJourneyEnd();
    this.flushEventQueue();
  }

  handleScroll() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
    const currentScrollDepth = documentHeight > 0 ? Math.round((scrollTop / documentHeight) * 100) : 0;
    
    if (currentScrollDepth > this.maxScrollDepth) {
      this.maxScrollDepth = currentScrollDepth;
      
      // Track milestone scroll depths
      if (currentScrollDepth >= 25 && this.scrollDepth < 25) {
        this.trackEvent('scroll_depth', { depth: 25 });
      } else if (currentScrollDepth >= 50 && this.scrollDepth < 50) {
        this.trackEvent('scroll_depth', { depth: 50 });
      } else if (currentScrollDepth >= 75 && this.scrollDepth < 75) {
        this.trackEvent('scroll_depth', { depth: 75 });
      } else if (currentScrollDepth >= 90 && this.scrollDepth < 90) {
        this.trackEvent('scroll_depth', { depth: 90 });
      }
    }
    
    this.scrollDepth = currentScrollDepth;
  }

  handleInteraction(event) {
    this.interactionCount++;
    
    // Track specific interaction types
    if (event.type === 'click') {
      const target = event.target;
      const element = {
        tag: target.tagName?.toLowerCase(),
        id: target.id,
        className: target.className,
        text: target.textContent?.substring(0, 50),
        href: target.href,
      };
      
      this.trackEvent('click_interaction', {
        element,
        timestamp: Date.now(),
        coordinates: { x: event.clientX, y: event.clientY },
      });
    }
  }

  trackJourneyStart() {
    this.journeyStartTime = Date.now();
    this.trackEvent('journey_start', {
      sessionId: this.sessionId,
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      referrer: document.referrer,
      startUrl: window.location.href,
    });
    
    // Track initial page
    this.trackPageTransition(window.location.pathname);
  }

  trackJourneyEnd() {
    const journeyDuration = Date.now() - this.journeyStartTime;
    const isQuickExit = journeyDuration < this.QUICK_EXIT_THRESHOLD;
    const isBounce = journeyDuration < this.BOUNCE_THRESHOLD && this.interactionCount <= 1;
    
    this.trackEvent('journey_end', {
      sessionId: this.sessionId,
      totalDuration: journeyDuration,
      totalInteractions: this.interactionCount,
      maxScrollDepth: this.maxScrollDepth,
      isQuickExit,
      isBounce,
      endUrl: window.location.href,
    });
  }

  trackPageTransition(newPath) {
    const now = Date.now();
    
    // Track exit from previous page
    if (this.currentPage && this.pageStartTime) {
      const timeOnPage = now - this.pageStartTime;
      this.trackEvent('page_exit', {
        page: this.currentPage,
        timeOnPage,
        scrollDepth: this.maxScrollDepth,
        interactionCount: this.interactionCount,
      });
    }
    
    // Track entry to new page
    this.currentPage = newPath;
    this.pageStartTime = now;
    this.interactionCount = 0;
    this.scrollDepth = 0;
    this.maxScrollDepth = 0;
    
    this.trackEvent('page_enter', {
      page: newPath,
      timestamp: now,
      previousPage: this.currentPage,
    });
  }

  getTimeOnCurrentPage() {
    return this.pageStartTime ? Date.now() - this.pageStartTime : 0;
  }

  trackEvent(eventType, data = {}) {
    const event = {
      event_type: eventType,
      session_id: this.sessionId,
      timestamp: Date.now(),
      page_url: window.location.href,
      page_path: window.location.pathname,
      user_id: this.userId,
      data: {
        ...data,
        journey_time: Date.now() - this.journeyStartTime,
      },
    };
    
    this.eventQueue.push(event);
    
    if (this.debug) {
      console.log(`[JourneyTracker] Event: ${eventType}`, event);
    }
    
    // Dispatch custom event for real-time listening
    this.dispatchEvent(new CustomEvent('journey-event', {
      detail: event,
      bubbles: true,
      composed: true,
    }));
    
    // Flush immediately for critical events
    if (['journey_start', 'journey_end', 'page_exit'].includes(eventType)) {
      this.flushEventQueue();
    }
  }

  async flushEventQueue() {
    if (this.eventQueue.length === 0) return;
    
    const eventsToFlush = [...this.eventQueue];
    this.eventQueue = [];
    
    try {
      if (eventsToFlush.length === 1) {
        await api.post('/api/v1/events/track', eventsToFlush[0]);
      } else {
        await api.post('/api/v1/events/track/bulk', {
          events: eventsToFlush,
        });
      }
      
      if (this.debug) {
        console.log(`[JourneyTracker] Flushed ${eventsToFlush.length} events`);
      }
    } catch (error) {
      console.error('[JourneyTracker] Failed to flush events:', error);
      // Re-queue events for retry (with limit to prevent memory issues)
      if (this.eventQueue.length < 100) {
        this.eventQueue.unshift(...eventsToFlush);
      }
    }
  }

  // Public API methods
  setUserId(userId) {
    this.userId = userId;
    this.trackEvent('user_identified', { userId });
  }

  trackCustomEvent(eventType, data = {}) {
    this.trackEvent(`custom_${eventType}`, data);
  }

  trackConversion(conversionType, value = null, data = {}) {
    this.trackEvent('conversion', {
      conversionType,
      value,
      ...data,
    });
  }

  trackFunnelStep(stepName, stepIndex, data = {}) {
    this.trackEvent('funnel_step', {
      stepName,
      stepIndex,
      completionTime: Date.now() - this.journeyStartTime,
      ...data,
    });
  }

  getJourneyData() {
    return {
      sessionId: this.sessionId,
      userId: this.userId,
      startTime: this.journeyStartTime,
      currentPage: this.currentPage,
      duration: Date.now() - this.journeyStartTime,
      interactionCount: this.interactionCount,
      maxScrollDepth: this.maxScrollDepth,
      queuedEvents: this.eventQueue.length,
    };
  }

  render() {
    if (!this.debug) return html``;
    
    return html`
      <div class="debug-indicator ${this.isTracking ? 'active' : ''}">
        Journey Tracker ${this.isTracking ? 'ON' : 'OFF'}<br>
        Session: ${this.sessionId.slice(-8)}<br>
        Events: ${this.eventQueue.length}
      </div>
    `;
  }
}

customElements.define('journey-tracker', JourneyTracker);