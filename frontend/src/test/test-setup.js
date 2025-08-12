import { beforeEach, afterEach, vi } from "vitest";
import { fixtureCleanup } from "@open-wc/testing-helpers";
import {   LitElement, html   } from 'lit';

// Set default test timeout to prevent hanging tests
vi.setConfig({
  testTimeout: 5000, // 5 seconds timeout for each test
});

// Mock CDN import to use local node modules
vi.mock(
  "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js",
  () => {
    return {
      LitElement,
      html,
      css: vi.fn((strings, ...values) => ({ strings, values })),
    };
  },
  { virtual: true }
);

// Create a basic document structure
if (!global.document) {
  const dom = new DOMParser().parseFromString(
    "<!DOCTYPE html><html><body></body></html>",
    "text/html"
  );
  global.document = dom;
  global.window = dom.defaultView;
}

// Performance API polyfill for JSDOM environment
if (!global.performance || typeof global.performance.now !== "function") {
  const startTime = Date.now();

  // Create a simple performance object with a now method
  global.performance = {
    ...(global.performance || {}),
    now: () => {
      return Date.now() - startTime;
    },
    mark: () => {},
    measure: () => {},
    getEntriesByName: () => [],
    getEntriesByType: () => [],
    clearMarks: () => {},
    clearMeasures: () => {},
  };

  console.log("Performance API polyfill installed for JSDOM environment");
}

// Setup required browser APIs
if (!global.window.customElements) {
  global.window.customElements = {
    define: (name, constructor) => {
      if (!customElements.get(name)) {
        customElements.set(name, constructor);
        constructor.prototype.connectedCallback?.();
      }
    },
    get: (name) => customElements.get(name),
    whenDefined: (name) => Promise.resolve(customElements.get(name)),
  };
}

if (!global.window.MutationObserver) {
  global.window.MutationObserver = class {
    constructor(callback) {
      this.callback = callback;
    }
    observe() {}
    disconnect() {}
  };
}

// Ensure matchMedia is properly defined globally
global.window.matchMedia = global.matchMedia = (query) => {
  return {
    matches: query.includes("prefers-reduced-motion")
      ? false
      : query.includes("dark")
        ? false
        : true,
    media: query,
    onchange: null,
    addListener: () => {}, // Deprecated but kept for compatibility
    removeListener: () => {}, // Deprecated but kept for compatibility
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => true,
  };
};

// Mock browser APIs
class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

class MockIntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

global.ResizeObserver = MockResizeObserver;
global.IntersectionObserver = MockIntersectionObserver;

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = String(value);
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    key: (index) => Object.keys(store)[index] || null,
    get length() {
      return Object.keys(store).length;
    },
  };
})();

Object.defineProperty(global.window, "localStorage", {
  value: localStorageMock,
  writable: false,
});

// Mock fetch
global.fetch = () =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(""),
  });

// Helper function to wait for element updates
export async function waitForUpdate(element) {
  if (element?.updateComplete) {
    await element.updateComplete;
  }
  return new Promise((resolve) => setTimeout(resolve, 0));
}

// Register base LitElement if not already defined
if (!customElements.get("lit-element")) {
  customElements.define(
    "lit-element",
    class extends LitElement {
      render() {
        return html`<slot></slot>`;
      }
    }
  );
}

// Mock lit-html render
vi.mock("lit/html.js", () => ({
  html: (strings, ...values) => ({ strings, values }),
  render: vi.fn(),
}));

// Mock lit decorators
vi.mock("lit/decorators.js", () => ({
  customElement: (name) => (cls) => {
    if (!customElements.get(name)) {
      customElements.define(name, cls);
    }
    return cls;
  },
  property:
    (options = {}) =>
    (proto, name) => {
      if (!proto.constructor.properties) {
        proto.constructor.properties = new Map();
      }
      proto.constructor.properties.set(name, options);
    },
  state: () => (proto, name) => {
    if (!proto.constructor.states) {
      proto.constructor.states = new Map();
    }
    proto.constructor.states.set(name, {});
  },
  query: (selector) => (proto, propertyKey) => {
    Object.defineProperty(proto, propertyKey, {
      get() {
        return this.shadowRoot?.querySelector(selector);
      },
      enumerable: true,
      configurable: true,
    });
  },
  queryAll: (selector) => (proto, propertyKey) => {
    Object.defineProperty(proto, propertyKey, {
      get() {
        return this.shadowRoot?.querySelectorAll(selector);
      },
      enumerable: true,
      configurable: true,
    });
  },
}));

// Setup and teardown
beforeEach(() => {
  // Clear any previous test artifacts
  document.body.innerHTML = "";
  // Reset localStorage for each test
  localStorageMock.clear();
});

afterEach(() => {
  // Clean up any fixtures
  fixtureCleanup();
});
