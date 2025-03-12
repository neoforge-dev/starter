/**
 * Utility functions for mocking DOM manipulation in tests
 */
import { vi } from "vitest";

/**
 * Creates a mock DOM element with the specified properties and methods
 * @param {string} tagName - The tag name of the element
 * @param {Object} props - Properties to add to the element
 * @returns {Object} - A mock DOM element
 */
export function createMockElement(tagName, props = {}) {
  const element = {
    tagName: tagName.toUpperCase(),
    nodeType: 1,
    nodeName: tagName.toUpperCase(),
    className: "",
    id: "",
    textContent: "",
    innerHTML: "",
    style: {},
    attributes: {},
    children: [],
    childNodes: [],

    // Mock methods
    getAttribute: vi.fn((name) => element.attributes[name]),
    setAttribute: vi.fn((name, value) => {
      element.attributes[name] = value;
    }),
    appendChild: vi.fn((child) => {
      element.children.push(child);
      element.childNodes.push(child);
      return child;
    }),
    removeChild: vi.fn((child) => {
      const index = element.children.indexOf(child);
      if (index !== -1) {
        element.children.splice(index, 1);
        element.childNodes.splice(index, 1);
      }
      return child;
    }),
    remove: vi.fn(() => {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
    }),
    cloneNode: vi.fn((deep) => {
      const clone = createMockElement(tagName, { ...props });
      if (deep) {
        clone.children = [
          ...element.children.map((child) => child.cloneNode(true)),
        ];
        clone.childNodes = [
          ...element.childNodes.map((child) => child.cloneNode(true)),
        ];
      }
      return clone;
    }),
    querySelector: vi.fn((selector) => {
      // Simple selector matching for testing
      for (const child of element.children) {
        if (
          (selector.startsWith("#") && child.id === selector.substring(1)) ||
          (selector.startsWith(".") &&
            child.className.split(" ").includes(selector.substring(1))) ||
          child.tagName === selector.toUpperCase()
        ) {
          return child;
        }

        // Try to find in child's children
        const found = child.querySelector && child.querySelector(selector);
        if (found) return found;
      }
      return null;
    }),
    querySelectorAll: vi.fn((selector) => {
      const results = [];

      // Simple selector matching for testing
      for (const child of element.children) {
        if (
          (selector.startsWith("#") && child.id === selector.substring(1)) ||
          (selector.startsWith(".") &&
            child.className.split(" ").includes(selector.substring(1))) ||
          child.tagName === selector.toUpperCase()
        ) {
          results.push(child);
        }

        // Add results from child's children
        if (child.querySelectorAll) {
          const childResults = child.querySelectorAll(selector);
          results.push(...childResults);
        }
      }

      return results;
    }),

    // Add any additional properties
    ...props,
  };

  return element;
}

/**
 * Creates a mock shadow root
 * @param {Object} props - Properties to add to the shadow root
 * @returns {Object} - A mock shadow root
 */
export function createMockShadowRoot(props = {}) {
  return createMockElement("#shadow-root", {
    mode: "open",
    host: null,
    ...props,
  });
}

/**
 * Creates a mock document fragment
 * @param {Object} props - Properties to add to the document fragment
 * @returns {Object} - A mock document fragment
 */
export function createMockDocumentFragment(props = {}) {
  return createMockElement("#document-fragment", {
    nodeType: 11,
    ...props,
  });
}

/**
 * Creates a mock event
 * @param {string} type - The event type
 * @param {Object} props - Properties to add to the event
 * @returns {Object} - A mock event
 */
export function createMockEvent(type, props = {}) {
  const event = {
    type,
    target: null,
    currentTarget: null,
    bubbles: true,
    cancelable: true,
    defaultPrevented: false,
    timeStamp: Date.now(),

    // Mock methods
    preventDefault: vi.fn(() => {
      event.defaultPrevented = true;
    }),
    stopPropagation: vi.fn(),
    stopImmediatePropagation: vi.fn(),

    // Add any additional properties
    ...props,
  };

  return event;
}

/**
 * Creates a mock custom event
 * @param {string} type - The event type
 * @param {Object} options - Options for the custom event
 * @returns {Object} - A mock custom event
 */
export function createMockCustomEvent(type, options = {}) {
  return createMockEvent(type, {
    detail: options.detail || {},
    ...options,
  });
}

/**
 * Mocks the document.createElement function
 * @returns {Function} - A function to restore the original createElement
 */
export function mockCreateElement() {
  const originalCreateElement = document.createElement;

  document.createElement = vi.fn((tagName) => {
    return createMockElement(tagName);
  });

  return () => {
    document.createElement = originalCreateElement;
  };
}

/**
 * Creates a mock component with shadow DOM
 * @param {string} tagName - The tag name of the component
 * @param {Object} props - Properties to add to the component
 * @returns {Object} - A mock component
 */
export function createMockComponent(tagName, props = {}) {
  const shadowRoot = createMockShadowRoot();

  const component = createMockElement(tagName, {
    attachShadow: vi.fn(() => shadowRoot),
    shadowRoot,

    // Add event handling
    _eventListeners: {},
    addEventListener: vi.fn((event, callback) => {
      component._eventListeners[event] = component._eventListeners[event] || [];
      component._eventListeners[event].push(callback);
    }),
    removeEventListener: vi.fn((event, callback) => {
      if (component._eventListeners[event]) {
        const index = component._eventListeners[event].indexOf(callback);
        if (index !== -1) {
          component._eventListeners[event].splice(index, 1);
        }
      }
    }),
    dispatchEvent: vi.fn((event) => {
      event.target = component;
      event.currentTarget = component;

      if (component._eventListeners[event.type]) {
        component._eventListeners[event.type].forEach((callback) => {
          callback(event);
        });
      }

      return !event.defaultPrevented;
    }),

    // Add Lit lifecycle methods
    connectedCallback: vi.fn(),
    disconnectedCallback: vi.fn(),
    adoptedCallback: vi.fn(),
    attributeChangedCallback: vi.fn(),

    // Add Lit update methods
    requestUpdate: vi.fn(),
    performUpdate: vi.fn(),
    firstUpdated: vi.fn(),
    updated: vi.fn(),

    // Add Lit properties
    updateComplete: Promise.resolve(true),

    // Add any additional properties
    ...props,
  });

  shadowRoot.host = component;

  return component;
}

/**
 * Registers a mock component with the custom elements registry
 * @param {string} tagName - The tag name of the component
 * @param {Function} constructor - The component constructor
 */
export function registerMockComponent(tagName, constructor) {
  // Mock the customElements.define method if it doesn't exist
  if (!customElements.define) {
    customElements.define = vi.fn();
  }

  // Mock the customElements.get method if it doesn't exist
  if (!customElements.get) {
    customElements.get = vi.fn((name) => {
      if (name === tagName) {
        return constructor;
      }
      return undefined;
    });
  } else {
    // Override the get method to return our constructor
    const originalGet = customElements.get;
    customElements.get = vi.fn((name) => {
      if (name === tagName) {
        return constructor;
      }
      return originalGet.call(customElements, name);
    });
  }

  // Register the component
  customElements.define(tagName, constructor);
}

/**
 * Creates and registers a mock component
 * @param {string} tagName - The tag name of the component
 * @param {Object} props - Properties to add to the component
 * @returns {Object} - A mock component constructor
 */
export function createAndRegisterMockComponent(tagName, props = {}) {
  // Create a mock component that doesn't actually extend HTMLElement
  // This avoids the "Invalid constructor" error in JSDOM
  const MockComponent = function () {
    // Add all props to the instance
    Object.assign(this, props);

    // Create shadow root if not already created
    if (!this.shadowRoot) {
      this._shadowRoot = createMockShadowRoot();
      this.shadowRoot = this._shadowRoot;
    }

    // Add event handling if not already added
    if (!this._eventListeners) {
      this._eventListeners = {};
    }

    return this;
  };

  // Add prototype methods
  MockComponent.prototype = {
    // Add event handling methods
    addEventListener(event, callback) {
      this._eventListeners[event] = this._eventListeners[event] || [];
      this._eventListeners[event].push(callback);
    },

    removeEventListener(event, callback) {
      if (this._eventListeners[event]) {
        const index = this._eventListeners[event].indexOf(callback);
        if (index !== -1) {
          this._eventListeners[event].splice(index, 1);
        }
      }
    },

    dispatchEvent(event) {
      event.target = this;
      event.currentTarget = this;

      if (this._eventListeners[event.type]) {
        this._eventListeners[event.type].forEach((callback) => {
          callback(event);
        });
      }

      return !event.defaultPrevented;
    },

    // Add Lit lifecycle methods
    connectedCallback() {
      if (props.connectedCallback) {
        props.connectedCallback.call(this);
      }
    },

    disconnectedCallback() {
      if (props.disconnectedCallback) {
        props.disconnectedCallback.call(this);
      }
    },

    attributeChangedCallback(name, oldValue, newValue) {
      if (props.attributeChangedCallback) {
        props.attributeChangedCallback.call(this, name, oldValue, newValue);
      }
    },
  };

  // Add updateComplete getter
  Object.defineProperty(MockComponent.prototype, "updateComplete", {
    get: function () {
      return Promise.resolve(true);
    },
  });

  // Register the component
  registerMockComponent(tagName, MockComponent);

  return MockComponent;
}
