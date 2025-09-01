import { expect, vi, beforeEach, afterEach } from "vitest";
import { LitElement, html } from "lit";
import registerAllComponents from "./register-components.mjs";

// Export html for use in tests
export { html };

// Mock environment variables
vi.mock('import.meta.env', () => ({
  VITE_API_URL: '/api'
}));

// Create a basic document if it doesn't exist
if (!globalThis.document) {
  const { JSDOM } = await import('jsdom');
  const dom = new JSDOM('<!DOCTYPE html><html><head></head><body></body></html>', {
    url: 'http://localhost:3000',
    pretendToBeVisual: true,
    resources: 'usable',
  });

  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.HTMLElement = dom.window.HTMLElement;
  globalThis.CustomEvent = dom.window.CustomEvent;
  globalThis.Event = dom.window.Event;
  globalThis.Node = dom.window.Node;
  globalThis.navigator = dom.window.navigator;
  globalThis.location = dom.window.location;
  globalThis.URL = dom.window.URL;

  // Add missing browser APIs
  globalThis.window.matchMedia = vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));

  // Create a custom elements registry that properly handles inheritance
  const registry = new Map();
  const registrationPromises = new Map();

  class MockCustomElementRegistry {
    define(name, constructor, options = {}) {
      try {
        // Check if the constructor is valid
        if (!constructor || typeof constructor !== 'function') {
          throw new Error(`Invalid constructor for component ${name}`);
        }

        // Check if the component is already registered
        if (registry.has(name)) {
          // If it's the same constructor, just return
          if (registry.get(name) === constructor) {
            console.log(`Mock: Component ${name} is already registered with the same constructor`);
            return;
          }

          // Try to register with a new name
          const newName = `${name}-${Date.now()}`;
          console.log(`Mock: Component ${name} already registered, using new name ${newName}`);
          registry.set(newName, constructor);
          if (registrationPromises.has(newName)) {
            registrationPromises.get(newName).resolve(constructor);
          }
          return;
        }

        // Create a proper custom element constructor that extends HTMLElement
        const CustomElementConstructor = class extends HTMLElement {
          constructor() {
            super();
            // Create an instance of the original constructor
            const instance = new constructor();
            // Copy all properties and methods
            Object.getOwnPropertyNames(instance).forEach(prop => {
              if (prop !== 'constructor') {
                this[prop] = instance[prop];
              }
            });
            // Copy prototype methods
            Object.getOwnPropertyNames(constructor.prototype).forEach(prop => {
              if (prop !== 'constructor') {
                this[prop] = constructor.prototype[prop];
              }
            });
          }
        };

        // Copy static properties
        Object.getOwnPropertyNames(constructor).forEach(prop => {
          if (prop !== 'prototype' && prop !== 'name' && prop !== 'length') {
            CustomElementConstructor[prop] = constructor[prop];
          }
        });

        // Register the constructor
        registry.set(name, CustomElementConstructor);
        console.log(`Mock: Registered component ${name}`);

        // Resolve any pending promises
        if (registrationPromises.has(name)) {
          registrationPromises.get(name).resolve(CustomElementConstructor);
        }
      } catch (error) {
        console.error(`Mock: Failed to register component ${name}:`, error);
        throw error;
      }
    }

    get(name) {
      return registry.get(name);
    }

    whenDefined(name) {
      if (registry.has(name)) {
        return Promise.resolve(registry.get(name));
      }

      if (!registrationPromises.has(name)) {
        registrationPromises.set(name, {});
        registrationPromises.get(name).promise = new Promise((resolve, reject) => {
          registrationPromises.get(name).resolve = resolve;
          registrationPromises.get(name).reject = reject;
        });
      }

      return registrationPromises.get(name).promise;
    }
  }

  // Replace the custom elements registry with our mock
  globalThis.customElements = new MockCustomElementRegistry();
}

// Wait for all components to be registered
export async function waitForComponents() {
  await registerAllComponents();
  const components = Array.from(registry.keys());
  await Promise.all(components.map(name => customElements.whenDefined(name)));
}

// Set up the test environment
export async function setupTestEnvironment() {
  // Wait for all components to be registered
  await waitForComponents();
  return TestUtils;
}

// Create a mock store for testing
let store = {};
const mockLocalStorage = {
  getItem: (key) => store[key] || null,
  setItem: (key, value) => {
    store[key] = value;
  },
  removeItem: (key) => {
    delete store[key];
  },
  clear: () => {
    store = {};
  }
};

// Use Object.defineProperty instead of direct assignment
Object.defineProperty(global, "localStorage", {
  value: mockLocalStorage,
  writable: true,
});

// Export test utilities
export const TestUtils = {
  fixture: async (template) => {
    const container = document.createElement('div');
    container.innerHTML = template;
    document.body.appendChild(container);
    return container.firstElementChild;
  },
  html: (strings, ...values) => {
    return strings.reduce((result, str, i) => {
      return result + str + (values[i] || '');
    }, '');
  },
  waitForComponent: async (element) => {
    if (!element) return null;
    if (element.updateComplete) {
      await element.updateComplete;
    }
    return element;
  },
  queryComponent: (element, selector) => {
    if (!element || !element.shadowRoot) return null;
    return element.shadowRoot.querySelector(selector);
  },
  queryAllComponents: (element, selector) => {
    if (!element || !element.shadowRoot) return [];
    return element.shadowRoot.querySelectorAll(selector);
  },
  createMockComponent: (tagName, template = '') => {
    if (!customElements.get(tagName)) {
      class MockComponent extends LitElement {
        render() {
          return template;
        }
      }
      customElements.define(tagName, MockComponent);
    }
    return document.createElement(tagName);
  }
};

// Mock API for dashboard tests
export function setupDashboardTest() {
  const api = {
    getTasks: vi.fn().mockResolvedValue({
      tasks: [
        { id: 1, title: 'Complete Project Setup', status: 'In Progress' },
        { id: 2, title: 'Implement Dashboard', status: 'Pending' }
      ]
    }),
    getStats: vi.fn().mockResolvedValue({
      projects: 5,
      tasks: 10,
      completed: 3,
      pending: 7
    }),
    updateTask: vi.fn().mockResolvedValue({
      id: 1,
      title: 'Complete Project Setup',
      status: 'Updated'
    })
  };

  window.api = api;
  return api;
}

export function cleanupDashboardTest(element) {
  if (element && element.parentNode) {
    element.parentNode.removeChild(element);
  }
  delete window.api;
}

// Reset mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
  store = {};
});

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks();
  store = {};

  // Clean up any elements added to the body
  document.body.innerHTML = '';
});
