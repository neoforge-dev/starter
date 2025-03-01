// Import testing utilities
import { fixture, html, expect, oneEvent, waitUntil } from "@open-wc/testing";
import { aTimeout } from "@open-wc/testing-helpers";
import { LitElement } from "lit";
import { fixtureCleanup } from "@open-wc/testing-helpers";

// Export testing utilities
export { fixture, html, expect, oneEvent, waitUntil, aTimeout };

// Setup global test environment
global.LitElement = LitElement;

// Setup DOM environment
if (typeof window !== "undefined") {
  // Mock localStorage
  const storedValues = new Map();
  global.localStorage = {
    getItem: (key) => storedValues.get(key) || null,
    setItem: (key, value) => storedValues.set(key, value),
    removeItem: (key) => storedValues.delete(key),
    clear: () => storedValues.clear(),
    length: storedValues.size,
    key: (index) => Array.from(storedValues.keys())[index],
  };

  // Mock window properties
  window.matchMedia =
    window.matchMedia ||
    function (query) {
      return {
        matches: false,
        media: query,
        onchange: null,
        addListener: function (listener) {
          this.addEventListener("change", listener);
        },
        removeListener: function (listener) {
          this.removeEventListener("change", listener);
        },
        addEventListener: function (type, listener) {
          if (!this._listeners) this._listeners = new Set();
          this._listeners.add(listener);
        },
        removeEventListener: function (type, listener) {
          if (this._listeners) this._listeners.delete(listener);
        },
        dispatchEvent: function (event) {
          if (this._listeners) {
            this._listeners.forEach((listener) => listener(event));
          }
          return true;
        },
        _listeners: new Set(),
      };
    };

  // Mock CustomElements with better tracking
  const definedElements = new Map();
  window.customElements = {
    define: (name, constructor) => {
      if (definedElements.has(name)) {
        throw new Error(`Element "${name}" already defined`);
      }
      definedElements.set(name, constructor);
    },
    get: (name) => definedElements.get(name) || null,
    whenDefined: (name) =>
      definedElements.has(name)
        ? Promise.resolve(definedElements.get(name))
        : new Promise((resolve) => {
            const observer = new MutationObserver(() => {
              if (definedElements.has(name)) {
                observer.disconnect();
                resolve(definedElements.get(name));
              }
            });
            observer.observe(document.documentElement, {
              childList: true,
              subtree: true,
            });
          }),
  };

  // Enhanced Observers
  window.IntersectionObserver =
    window.IntersectionObserver ||
    class IntersectionObserver {
      constructor(callback) {
        this.callback = callback;
        this._observedElements = new Set();
      }

      observe(element) {
        this._observedElements.add(element);
        // Simulate initial intersection
        this.callback([
          {
            target: element,
            isIntersecting: true,
            intersectionRatio: 1,
            boundingClientRect: element.getBoundingClientRect(),
            intersectionRect: element.getBoundingClientRect(),
            rootBounds: null,
          },
        ]);
      }

      unobserve(element) {
        this._observedElements.delete(element);
      }

      disconnect() {
        this._observedElements.clear();
      }
    };

  window.ResizeObserver =
    window.ResizeObserver ||
    class ResizeObserver {
      constructor(callback) {
        this.callback = callback;
        this._observedElements = new Set();
      }

      observe(element) {
        this._observedElements.add(element);
        // Simulate initial resize
        this.callback([
          {
            target: element,
            contentRect: element.getBoundingClientRect(),
          },
        ]);
      }

      unobserve(element) {
        this._observedElements.delete(element);
      }

      disconnect() {
        this._observedElements.clear();
      }
    };

  // Enhanced fetch API mock
  window.fetch =
    window.fetch ||
    (async (url, options = {}) => {
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: "OK",
        headers: new Headers(),
        json: async () => ({}),
        text: async () => "",
        blob: async () => new Blob(),
        arrayBuffer: async () => new ArrayBuffer(0),
        formData: async () => new FormData(),
        clone: function () {
          return { ...this };
        },
      };

      // Allow tests to override the mock response
      if (window.__mockFetchResponse) {
        return window.__mockFetchResponse(url, options) || mockResponse;
      }

      return mockResponse;
    });

  // Disable animations
  const style = document.createElement("style");
  style.textContent = `
    *, *::before, *::after {
      transition: none !important;
      animation: none !important;
      caret-color: transparent !important;
    }
  `;
  document.head.appendChild(style);
}

// Global test utilities
global.waitForComponent = async (element) => {
  await element.updateComplete;
  await aTimeout(0);
};

global.createEvent = (type, detail = {}) => {
  return new CustomEvent(type, {
    bubbles: true,
    composed: true,
    detail,
  });
};

// Setup test environment
beforeEach(() => {
  if (typeof window !== "undefined") {
    window.localStorage.clear();
    document.body.innerHTML = "";
    window.__mockFetchResponse = null;
  }
});

afterEach(() => {
  fixtureCleanup();
});

// Error handler for unhandled rejections
window.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled promise rejection:", event.reason);
});

// Increase default timeout for async operations
window.jasmine ? (jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000) : null;
window.mocha ? mocha.timeout(10000) : null;
