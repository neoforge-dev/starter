/**
 * Utility functions for creating mock components for testing
 * This helps standardize our approach for mocking components with CDN imports
 */

/**
 * Creates a mock component class with the specified properties and methods
 * @param {string} name - The name of the component
 * @param {Object} properties - Static properties object with property definitions
 * @param {Object} methods - Methods to add to the prototype
 * @param {string} parentClass - Name of the parent class (default: "LitElement")
 * @returns {Function} - The mock component class
 */
export function createMockComponent(
  name,
  properties = {},
  methods = {},
  parentClass = "LitElement"
) {
  // Create the component class
  class MockComponent {
    static get properties() {
      return properties;
    }

    constructor() {
      // Initialize properties with default values
      Object.keys(properties).forEach((prop) => {
        const propDef = properties[prop];
        if (propDef.type === String) {
          this[prop] = "";
        } else if (propDef.type === Number) {
          this[prop] = 0;
        } else if (propDef.type === Boolean) {
          this[prop] = false;
        } else if (propDef.type === Array) {
          this[prop] = [];
        } else if (propDef.type === Object) {
          this[prop] = {};
        } else {
          this[prop] = undefined;
        }
      });

      // Add common properties for testing
      this.updateComplete = Promise.resolve(true);
      this.shadowRoot = createMockShadowRoot();
      this.classList = createMockClassList();

      // Add event handling
      this._eventListeners = {};
    }

    // Add event handling methods
    addEventListener(event, callback) {
      if (!this._eventListeners[event]) {
        this._eventListeners[event] = [];
      }
      this._eventListeners[event].push(callback);
    }

    removeEventListener(event, callback) {
      if (this._eventListeners[event]) {
        this._eventListeners[event] = this._eventListeners[event].filter(
          (cb) => cb !== callback
        );
      }
    }

    dispatchEvent(event) {
      if (this._eventListeners[event.type]) {
        this._eventListeners[event.type].forEach((callback) => callback(event));
      }
      return true;
    }

    // Default render method
    render() {
      return null;
    }
  }

  // Add custom methods to the prototype
  Object.keys(methods).forEach((methodName) => {
    MockComponent.prototype[methodName] = methods[methodName];
  });

  // Add toString method to simulate inheritance
  MockComponent.toString = () => `class ${name} extends ${parentClass}`;

  return MockComponent;
}

/**
 * Creates a mock shadow root for testing
 * @returns {Object} - The mock shadow root
 */
export function createMockShadowRoot() {
  return {
    querySelector: (selector) => null,
    querySelectorAll: (selector) => [],
    appendChild: (child) => {},
    removeChild: (child) => {},
    children: [],
  };
}

/**
 * Creates a mock class list for testing
 * @returns {Object} - The mock class list
 */
export function createMockClassList() {
  const classes = new Set();

  return {
    add: (...classNames) => {
      classNames.forEach((name) => classes.add(name));
    },
    remove: (...classNames) => {
      classNames.forEach((name) => classes.delete(name));
    },
    toggle: (className, force) => {
      if (force === undefined) {
        if (classes.has(className)) {
          classes.delete(className);
          return false;
        } else {
          classes.add(className);
          return true;
        }
      } else {
        if (force) {
          classes.add(className);
          return true;
        } else {
          classes.delete(className);
          return false;
        }
      }
    },
    contains: (className) => classes.has(className),
    replace: (oldClass, newClass) => {
      if (classes.has(oldClass)) {
        classes.delete(oldClass);
        classes.add(newClass);
        return true;
      }
      return false;
    },
    toString: () => Array.from(classes).join(" "),
  };
}

/**
 * Creates a mock fixture function for testing
 * @returns {Function} - The mock fixture function
 */
export function createMockFixture() {
  return async (template) => {
    // Create a mock element that simulates the behavior of the fixture function
    const mockElement = {
      updateComplete: Promise.resolve(true),
      style: {},
      classList: createMockClassList(),
      shadowRoot: createMockShadowRoot(),
      addEventListener: (event, callback) => {},
      removeEventListener: (event, callback) => {},
      dispatchEvent: (event) => true,
      remove: () => {},
    };
    return mockElement;
  };
}

/**
 * Registers a mock component with the custom elements registry
 * @param {string} tagName - The tag name to register
 * @param {Function} componentClass - The component class to register
 */
export function registerMockComponent(tagName, componentClass) {
  // Check if the component is already registered
  if (!customElements.get(tagName)) {
    try {
      customElements.define(tagName, componentClass);
    } catch (error) {
      console.warn(`Failed to register mock component ${tagName}:`, error);
    }
  }
}

/**
 * Creates and registers a mock component in one step
 * @param {string} tagName - The tag name to register
 * @param {string} className - The class name
 * @param {Object} properties - Static properties object with property definitions
 * @param {Object} methods - Methods to add to the prototype
 * @param {string} parentClass - Name of the parent class (default: "LitElement")
 * @returns {Function} - The mock component class
 */
export function createAndRegisterMockComponent(
  tagName,
  className,
  properties = {},
  methods = {},
  parentClass = "LitElement"
) {
  const ComponentClass = createMockComponent(
    className,
    properties,
    methods,
    parentClass
  );
  registerMockComponent(tagName, ComponentClass);
  return ComponentClass;
}
