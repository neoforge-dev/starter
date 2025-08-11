/**
 * Utility to detect memory leaks in web components
 */
class MemoryLeakDetector {
  constructor() {
    this.componentRegistry = new WeakMap();
    this.disconnectedComponents = new WeakSet();
    this.eventListenerRegistry = new Map();
    this.memoryThresholds = {
      warning: 100 * 1024 * 1024, // 100MB
      critical: 200 * 1024 * 1024, // 200MB
    };
    this.checkInterval = 30000; // 30 seconds
  }

  /**
   * Initialize memory leak detection
   */
  initialize() {
    // Start periodic memory checks
    this._startMemoryMonitoring();

    // Observe component creation and destruction
    this._observeComponents();

    // Monitor event listeners
    this._monitorEventListeners();

    // Track detached DOM nodes
    this._trackDetachedNodes();
  }

  /**
   * Register a component for monitoring
   * @param {HTMLElement} component - Component to monitor
   */
  registerComponent(component) {
    if (this.componentRegistry.has(component)) return;

    this.componentRegistry.set(component, {
      createdAt: Date.now(),
      elementCount: this._getElementCount(component),
      eventListeners: new Set(),
      memoryUsage: 0,
    });
  }

  /**
   * Unregister a component from monitoring
   * @param {HTMLElement} component - Component to unregister
   */
  unregisterComponent(component) {
    if (!this.componentRegistry.has(component)) return;

    // Check for potential memory leaks before unregistering
    this._checkComponentLeaks(component);

    this.componentRegistry.delete(component);
    this.disconnectedComponents.add(component);
  }

  /**
   * Register an event listener for monitoring
   * @param {HTMLElement} target - Event target
   * @param {string} type - Event type
   * @param {Function} listener - Event listener
   */
  registerEventListener(target, type, listener) {
    const key = this._getEventListenerKey(target, type, listener);
    this.eventListenerRegistry.set(key, {
      target,
      type,
      listener,
      registeredAt: Date.now(),
    });

    // Update component registry if target is a component
    const component = target.closest("*");
    if (component && this.componentRegistry.has(component)) {
      const data = this.componentRegistry.get(component);
      data.eventListeners.add(key);
    }
  }

  /**
   * Unregister an event listener from monitoring
   * @param {HTMLElement} target - Event target
   * @param {string} type - Event type
   * @param {Function} listener - Event listener
   */
  unregisterEventListener(target, type, listener) {
    const key = this._getEventListenerKey(target, type, listener);
    this.eventListenerRegistry.delete(key);

    // Update component registry
    const component = target.closest("*");
    if (component && this.componentRegistry.has(component)) {
      const data = this.componentRegistry.get(component);
      data.eventListeners.delete(key);
    }
  }

  /**
   * Start periodic memory monitoring
   */
  _startMemoryMonitoring() {
    setInterval(() => {
      this._checkMemoryUsage();
      this._checkDetachedComponents();
      this._checkEventListenerLeaks();
    }, this.checkInterval);
  }

  /**
   * Check current memory usage
   */
  async _checkMemoryUsage() {
    if (!performance.memory) return;

    const { usedJSHeapSize, jsHeapSizeLimit } = performance.memory;
    const usagePercentage = (usedJSHeapSize / jsHeapSizeLimit) * 100;

    if (usedJSHeapSize > this.memoryThresholds.critical) {
      this._reportMemoryLeak({
        type: "critical",
        message: `Memory usage critical: ${Math.round(usagePercentage)}% of heap used`,
        usedMemory: usedJSHeapSize,
        timestamp: Date.now(),
      });
    } else if (usedJSHeapSize > this.memoryThresholds.warning) {
      this._reportMemoryLeak({
        type: "warning",
        message: `High memory usage: ${Math.round(usagePercentage)}% of heap used`,
        usedMemory: usedJSHeapSize,
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Check for detached components that might indicate memory leaks
   */
  _checkDetachedComponents() {
    this.disconnectedComponents.forEach((component) => {
      if (this._isComponentLeaked(component)) {
        this._reportMemoryLeak({
          type: "detached_component",
          message: `Potential memory leak: Component ${component.tagName.toLowerCase()} detached but not garbage collected`,
          component: component.tagName.toLowerCase(),
          timestamp: Date.now(),
        });
      }
    });
  }

  /**
   * Check for event listener leaks
   */
  _checkEventListenerLeaks() {
    const now = Date.now();
    this.eventListenerRegistry.forEach((data) => {
      const age = now - data.registeredAt;

      // Check for listeners older than 1 hour on detached elements
      if (age > 3600000 && !document.contains(data.target)) {
        this._reportMemoryLeak({
          type: "event_listener_leak",
          message: `Potential event listener leak: ${data.type} listener on detached element`,
          eventType: data.type,
          timestamp: now,
        });
      }
    });
  }

  /**
   * Check if a component has potential memory leaks
   * @param {HTMLElement} component - Component to check
   */
  _checkComponentLeaks(component) {
    const data = this.componentRegistry.get(component);
    if (!data) return;

    // Check for increasing element count
    const currentElementCount = this._getElementCount(component);
    if (currentElementCount > data.elementCount * 1.5) {
      this._reportMemoryLeak({
        type: "growing_dom",
        message: `Potential memory leak: Component ${component.tagName.toLowerCase()} DOM size growing unusually`,
        component: component.tagName.toLowerCase(),
        elementCount: currentElementCount,
        timestamp: Date.now(),
      });
    }

    // Check for retained event listeners
    if (data.eventListeners.size > 0) {
      this._reportMemoryLeak({
        type: "retained_listeners",
        message: `Potential memory leak: Component ${component.tagName.toLowerCase()} has ${data.eventListeners.size} retained event listeners`,
        component: component.tagName.toLowerCase(),
        listenerCount: data.eventListeners.size,
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Observe component lifecycle
   */
  _observeComponents() {
    // Observe custom element definitions
    const originalDefine = customElements.define;
    customElements.define = (name, constructor, options) => {
      const originalConnected = constructor.prototype.connectedCallback;
      const originalDisconnected = constructor.prototype.disconnectedCallback;

      constructor.prototype.connectedCallback = function () {
        this._memoryLeakDetector = window.memoryLeakDetector;
        this._memoryLeakDetector.registerComponent(this);
        if (originalConnected) {
          originalConnected.call(this);
        }
      };

      constructor.prototype.disconnectedCallback = function () {
        if (originalDisconnected) {
          originalDisconnected.call(this);
        }
        this._memoryLeakDetector.unregisterComponent(this);
      };

      originalDefine.call(customElements, name, constructor, options);
    };
  }

  /**
   * Monitor event listener registration
   */
  _monitorEventListeners() {
    const originalAddEventListener = EventTarget.prototype.addEventListener;
    const originalRemoveEventListener =
      EventTarget.prototype.removeEventListener;

    EventTarget.prototype.addEventListener = function (
      type,
      listener,
      options
    ) {
      window.memoryLeakDetector.registerEventListener(this, type, listener);
      return originalAddEventListener.call(this, type, listener, options);
    };

    EventTarget.prototype.removeEventListener = function (
      type,
      listener,
      options
    ) {
      window.memoryLeakDetector.unregisterEventListener(this, type, listener);
      return originalRemoveEventListener.call(this, type, listener, options);
    };
  }

  /**
   * Track detached DOM nodes
   */
  _trackDetachedNodes() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.removedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            this._checkDetachedNode(node);
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  /**
   * Check if a detached node might be leaked
   * @param {Element} node - Detached node
   */
  _checkDetachedNode(node) {
    // Wait for garbage collection
    setTimeout(() => {
      if (this._isNodeLeaked(node)) {
        this._reportMemoryLeak({
          type: "detached_node",
          message: `Potential memory leak: Detached node ${node.tagName.toLowerCase()} retained in memory`,
          node: node.tagName.toLowerCase(),
          timestamp: Date.now(),
        });
      }
    }, 5000);
  }

  /**
   * Get unique key for event listener
   * @param {HTMLElement} target - Event target
   * @param {string} type - Event type
   * @param {Function} listener - Event listener
   * @returns {string}
   */
  _getEventListenerKey(target, type, listener) {
    return `${target.tagName}_${type}_${listener.toString()}`;
  }

  /**
   * Get element count for a component
   * @param {HTMLElement} component - Component to count elements for
   * @returns {number}
   */
  _getElementCount(component) {
    return component.getElementsByTagName("*").length;
  }

  /**
   * Check if a component is potentially leaked
   * @param {HTMLElement} component - Component to check
   * @returns {boolean}
   */
  _isComponentLeaked(component) {
    // Component is considered leaked if it's disconnected but still referenced
    return !document.contains(component) && this._hasReferences(component);
  }

  /**
   * Check if a node is potentially leaked
   * @param {Element} node - Node to check
   * @returns {boolean}
   */
  _isNodeLeaked(node) {
    return !document.contains(node) && this._hasReferences(node);
  }

  /**
   * Check if an object has references preventing garbage collection
   * @param {Object} obj - Object to check
   * @returns {boolean}
   */
  _hasReferences(obj) {
    // This is a simplified check. In reality, we'd need to use the Chrome DevTools Protocol
    // or a similar tool to get accurate reference counting
    return (
      Object.prototype.hasOwnProperty.call(obj, "__references__") || 
      Object.prototype.hasOwnProperty.call(obj, "_listeners")
    );
  }

  /**
   * Report a memory leak
   * @param {Object} leak - Memory leak details
   */
  _reportMemoryLeak(leak) {
    // Dispatch event for monitoring
    window.dispatchEvent(
      new CustomEvent("memory-leak-detected", {
        detail: leak,
      })
    );

    // Log to console
    console.warn("Memory leak detected:", leak);

    // Send to monitoring service if available
    if (window.monitoring) {
      window.monitoring.reportMemoryLeak(leak);
    }
  }
}

// Export singleton instance
export const memoryLeakDetector = new MemoryLeakDetector();

// Make available globally for component integration
window.memoryLeakDetector = memoryLeakDetector;
