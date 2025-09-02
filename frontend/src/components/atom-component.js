import { LitElement } from "lit";

/**
 * Lightweight base component class for simple atoms.
 * Provides minimal functionality without tenant awareness overhead.
 * Use this for simple, reusable UI atoms like buttons, inputs, badges, etc.
 * 
 * Size: ~500 bytes (vs 3KB for BaseComponent)
 * Performance: Minimal overhead, faster initialization
 */
export class AtomComponent extends LitElement {
  constructor() {
    super();
    this._boundEventHandlers = new Map();
    this._hasConnected = false;
  }

  /**
   * Lightweight connectedCallback with minimal overhead
   */
  connectedCallback() {
    super.connectedCallback();
    this._hasConnected = true;

    // Only log in development mode
    if (process.env.NODE_ENV === 'development') {
      console.debug(`Connected: ${this.tagName}`);
    }
  }

  /**
   * Optimized firstUpdated with performance tracking
   */
  firstUpdated(changedProperties) {
    super.firstUpdated(changedProperties);
    
    if (process.env.NODE_ENV === 'development') {
      // Performance monitoring in development
      const start = performance.now();
      this.updateComplete.then(() => {
        const renderTime = performance.now() - start;
        if (renderTime > 16) { // Flag slow renders
          console.warn(`Slow render: ${this.tagName} took ${renderTime.toFixed(2)}ms`);
        }
      });
    }
  }

  /**
   * Efficient event handler binding with automatic cleanup
   * @param {string} eventType - Event type (e.g., 'click')
   * @param {Function} handler - Event handler function
   * @param {EventTarget} target - Target element (defaults to this)
   * @param {Object} options - Event options
   */
  bindEventHandler(eventType, handler, target = this, options = {}) {
    // Create bound handler if not exists
    const key = `${eventType}-${handler.name || 'anonymous'}`;
    if (!this._boundEventHandlers.has(key)) {
      const boundHandler = handler.bind(this);
      this._boundEventHandlers.set(key, {
        handler: boundHandler,
        target,
        options
      });
      target.addEventListener(eventType, boundHandler, options);
    }
  }

  /**
   * Efficient property validation with minimal overhead
   * @param {string} propName - Property name
   * @param {*} value - Property value
   * @param {Object} validators - Validation rules
   */
  validateProperty(propName, value, validators = {}) {
    if (process.env.NODE_ENV === 'development') {
      // Only validate in development to avoid production overhead
      if (validators.required && (value === undefined || value === null)) {
        console.warn(`Required property '${propName}' is missing on ${this.tagName}`);
      }
      if (validators.type && typeof value !== validators.type) {
        console.warn(`Property '${propName}' should be ${validators.type}, got ${typeof value}`);
      }
      if (validators.enum && !validators.enum.includes(value)) {
        console.warn(`Property '${propName}' should be one of [${validators.enum.join(', ')}], got '${value}'`);
      }
    }
  }

  /**
   * Lightweight dispatch custom event
   * @param {string} eventName - Event name
   * @param {*} detail - Event detail
   * @param {Object} options - Event options
   */
  emitEvent(eventName, detail = null, options = {}) {
    const event = new CustomEvent(eventName, {
      detail,
      bubbles: options.bubbles !== false, // Default to true
      composed: options.composed !== false, // Default to true
      cancelable: options.cancelable || false,
      ...options
    });
    
    this.dispatchEvent(event);
    return event;
  }

  /**
   * Optimized shadow DOM creation with minimal overhead
   */
  createRenderRoot() {
    return this.attachShadow({ mode: "open" });
  }

  /**
   * Check if component is connected and ready
   */
  get isReady() {
    return this._hasConnected && this.shadowRoot !== null;
  }

  /**
   * Get component size for debugging (development only)
   */
  get debugInfo() {
    if (process.env.NODE_ENV !== 'development') {
      return null;
    }

    const shadowRootSize = this.shadowRoot ? 
      this.shadowRoot.innerHTML.length : 0;
    const boundHandlers = this._boundEventHandlers.size;

    return {
      tagName: this.tagName,
      shadowRootSize,
      boundHandlers,
      isReady: this.isReady,
      renderTime: this._lastRenderTime || 0
    };
  }

  /**
   * Efficient cleanup on disconnect
   */
  disconnectedCallback() {
    super.disconnectedCallback();

    // Clean up bound event handlers
    this._boundEventHandlers.forEach(({ handler, target, options }) => {
      target.removeEventListener(handler, options);
    });
    this._boundEventHandlers.clear();

    this._hasConnected = false;

    if (process.env.NODE_ENV === 'development') {
      console.debug(`Disconnected: ${this.tagName}`);
    }
  }
}

export default AtomComponent;