/**
 * @fileoverview Helper functions for creating mock components in tests
 * This library provides utilities to create pure JavaScript mocks of web components
 * without extending HTMLElement or using customElements.define, which can cause issues
 * in the test environment.
 */

/**
 * Creates a basic mock component with common functionality
 * @param {Object} options - Configuration options for the mock
 * @param {String} options.tagName - The tag name of the component (e.g., 'neo-button')
 * @param {Object} options.properties - Initial properties for the component
 * @param {Object} options.methods - Methods to add to the component
 * @param {Function} options.renderCallback - Function to call when render is invoked
 * @returns {Object} A mock component object
 */
export function createMockComponent(options = {}) {
  const {
    tagName = "mock-component",
    properties = {},
    methods = {},
    renderCallback = null,
  } = options;

  // Create the base mock object
  const mockComponent = {
    tagName,
    _eventListeners: {},
    _properties: { ...properties },
    _shadowRoot: {
      querySelector: () => null,
      querySelectorAll: () => [],
    },

    // Standard web component lifecycle methods
    connectedCallback: function () {
      if (methods.connectedCallback) {
        methods.connectedCallback.call(this);
      }
    },

    disconnectedCallback: function () {
      if (methods.disconnectedCallback) {
        methods.disconnectedCallback.call(this);
      }
    },

    attributeChangedCallback: function (name, oldValue, newValue) {
      if (methods.attributeChangedCallback) {
        methods.attributeChangedCallback.call(this, name, oldValue, newValue);
      }
    },

    // Event handling
    addEventListener: function (event, callback) {
      if (!this._eventListeners[event]) {
        this._eventListeners[event] = [];
      }
      this._eventListeners[event].push(callback);
    },

    removeEventListener: function (event, callback) {
      if (this._eventListeners[event]) {
        this._eventListeners[event] = this._eventListeners[event].filter(
          (cb) => cb !== callback
        );
      }
    },

    dispatchEvent: function (event) {
      const listeners = this._eventListeners[event.type] || [];
      listeners.forEach((callback) => callback(event));
      return true;
    },

    // Render method (if provided)
    render: function () {
      if (renderCallback) {
        return renderCallback.call(this);
      }
      if (methods.render) {
        return methods.render.call(this);
      }
      return null;
    },
  };

  // Add custom methods
  Object.keys(methods).forEach((methodName) => {
    if (!mockComponent[methodName]) {
      mockComponent[methodName] = methods[methodName];
    }
  });

  // Create shadowRoot with customizable query methods
  mockComponent.shadowRoot = {
    querySelector: function (selector) {
      if (mockComponent._shadowRoot.querySelector) {
        return mockComponent._shadowRoot.querySelector(selector);
      }
      return null;
    },
    querySelectorAll: function (selector) {
      if (mockComponent._shadowRoot.querySelectorAll) {
        return mockComponent._shadowRoot.querySelectorAll(selector);
      }
      return [];
    },
  };

  return mockComponent;
}

/**
 * Creates a mock element that can be used in the shadowRoot
 * @param {Object} options - Configuration options for the mock element
 * @param {String} options.tagName - The tag name of the element
 * @param {Object} options.attributes - Attributes for the element
 * @param {String} options.textContent - Text content for the element
 * @param {Function} options.clickHandler - Function to call when click is invoked
 * @returns {Object} A mock element object
 */
export function createMockElement(options = {}) {
  const {
    tagName = "div",
    attributes = {},
    textContent = "",
    clickHandler = null,
  } = options;

  const element = {
    tagName: tagName.toUpperCase(),
    textContent,
    attributes: { ...attributes },
    classList: {
      add: function (className) {
        if (!this.contains(className)) {
          this._classes.push(className);
        }
      },
      remove: function (className) {
        this._classes = this._classes.filter((c) => c !== className);
      },
      contains: function (className) {
        return this._classes.includes(className);
      },
      toggle: function (className) {
        if (this.contains(className)) {
          this.remove(className);
          return false;
        } else {
          this.add(className);
          return true;
        }
      },
      _classes: [],
    },
    style: {},
    children: [],

    getAttribute: function (name) {
      return this.attributes[name] || null;
    },

    setAttribute: function (name, value) {
      this.attributes[name] = value;
    },

    removeAttribute: function (name) {
      delete this.attributes[name];
    },

    hasAttribute: function (name) {
      return name in this.attributes;
    },

    click: function () {
      if (clickHandler) {
        clickHandler.call(this);
      }
    },

    appendChild: function (child) {
      this.children.push(child);
      return child;
    },

    removeChild: function (child) {
      this.children = this.children.filter((c) => c !== child);
      return child;
    },
  };

  return element;
}

/**
 * Creates a mock event that can be dispatched by components
 * @param {String} type - The event type (e.g., 'click', 'input')
 * @param {Object} options - Event options
 * @param {Object} options.detail - The event detail object
 * @param {Boolean} options.bubbles - Whether the event bubbles
 * @param {Boolean} options.composed - Whether the event crosses shadow DOM boundaries
 * @returns {Object} A mock event object
 */
export function createMockEvent(type, options = {}) {
  const { detail = {}, bubbles = true, composed = true } = options;

  return {
    type,
    detail,
    bubbles,
    composed,
    preventDefault: function () {
      this.defaultPrevented = true;
    },
    stopPropagation: function () {
      this.propagationStopped = true;
    },
    defaultPrevented: false,
    propagationStopped: false,
    target: null,
    currentTarget: null,
  };
}

/**
 * Example usage:
 *
 * // Create a mock button component
 * const mockButton = createMockComponent({
 *   tagName: 'neo-button',
 *   properties: {
 *     variant: 'primary',
 *     size: 'medium',
 *     disabled: false
 *   },
 *   methods: {
 *     handleClick() {
 *       if (!this._properties.disabled) {
 *         this.dispatchEvent(createMockEvent('click'));
 *       }
 *     }
 *   }
 * });
 *
 * // Configure shadowRoot query methods
 * mockButton._shadowRoot.querySelector = (selector) => {
 *   if (selector === '.button') {
 *     return createMockElement({
 *       tagName: 'button',
 *       attributes: {
 *         'aria-disabled': mockButton._properties.disabled.toString()
 *       },
 *       clickHandler: () => mockButton.handleClick()
 *     });
 *   }
 *   return null;
 * };
 *
 * // Use in tests
 * test('button should dispatch click event when not disabled', () => {
 *   const clickHandler = vi.fn();
 *   mockButton.addEventListener('click', clickHandler);
 *
 *   const buttonElement = mockButton.shadowRoot.querySelector('.button');
 *   buttonElement.click();
 *
 *   expect(clickHandler).toHaveBeenCalled();
 * });
 */
