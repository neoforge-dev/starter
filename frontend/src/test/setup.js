import { beforeAll, afterEach, expect } from "vitest";
import { LitElement } from "lit";

// Custom element registry for testing
const customElementRegistry = new Map();

// Mock customElements API
global.customElements = {
  define: (name, constructor) => {
    customElementRegistry.set(name, constructor);
  },
  get: (name) => customElementRegistry.get(name),
  whenDefined: (name) => Promise.resolve(customElementRegistry.get(name)),
};

// Mock window.customElements
beforeAll(() => {
  window.customElements = global.customElements;
});

// Clean up after each test
afterEach(() => {
  // Clear custom elements registry
  customElementRegistry.clear();
  // Clean up the DOM
  document.body.innerHTML = "";
});

/**
 * Create a test fixture for a web component
 * @param {typeof LitElement} componentClass - Component class to test
 * @param {string} html - Initial HTML
 * @returns {Promise<HTMLElement>} Component instance
 */
export async function fixture(componentClass, html = "") {
  const el = document.createElement("div");
  el.innerHTML = html;
  document.body.appendChild(el);
  await el.updateComplete;
  return el;
}

/**
 * Wait for element to be updated
 * @param {LitElement} element - Element to wait for
 * @returns {Promise<void>}
 */
export async function waitForUpdate(element) {
  await element.updateComplete;
  // Additional tick for async operations
  await new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * Create a test container with isolation
 * @param {string} html - Initial HTML
 * @returns {HTMLElement} Test container
 */
export function createContainer(html = "") {
  const container = document.createElement("div");
  container.innerHTML = html;
  document.body.appendChild(container);
  return container;
}

/**
 * Custom matchers for web components
 */
expect.extend({
  toHaveProperty(element, prop) {
    const hasProperty = prop in element;
    return {
      pass: hasProperty,
      message: () =>
        `expected element ${hasProperty ? "not " : ""}to have property "${prop}"`,
    };
  },

  toHaveAttribute(element, attr, value) {
    const hasAttribute = element.hasAttribute(attr);
    const attributeValue = element.getAttribute(attr);
    const pass = value === undefined ? hasAttribute : attributeValue === value;

    return {
      pass,
      message: () =>
        `expected element ${pass ? "not " : ""}to have attribute "${attr}"${
          value !== undefined ? ` with value "${value}"` : ""
        }`,
    };
  },

  toHaveClass(element, className) {
    const hasClass = element.classList.contains(className);
    return {
      pass: hasClass,
      message: () =>
        `expected element ${hasClass ? "not " : ""}to have class "${className}"`,
    };
  },

  toBeVisible(element) {
    const isVisible =
      element.offsetWidth > 0 &&
      element.offsetHeight > 0 &&
      window.getComputedStyle(element).display !== "none" &&
      window.getComputedStyle(element).visibility !== "hidden";

    return {
      pass: isVisible,
      message: () => `expected element ${isVisible ? "not " : ""}to be visible`,
    };
  },

  toHaveStyle(element, styles) {
    const computedStyle = window.getComputedStyle(element);
    const mismatches = [];

    Object.entries(styles).forEach(([prop, value]) => {
      const actual = computedStyle[prop];
      if (actual !== value) {
        mismatches.push(`${prop}: expected "${value}" but got "${actual}"`);
      }
    });

    return {
      pass: mismatches.length === 0,
      message: () =>
        `expected element ${
          mismatches.length === 0 ? "not " : ""
        }to have styles:\n${mismatches.join("\n")}`,
    };
  },
});

// Mock IntersectionObserver
class IntersectionObserver {
  constructor(callback) {
    this.callback = callback;
  }

  observe() {}
  unobserve() {}
  disconnect() {}
}

global.IntersectionObserver = IntersectionObserver;

// Mock ResizeObserver
class ResizeObserver {
  constructor(callback) {
    this.callback = callback;
  }

  observe() {}
  unobserve() {}
  disconnect() {}
}

global.ResizeObserver = ResizeObserver;

// Mock window.matchMedia
window.matchMedia = (query) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: () => {},
  removeListener: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => {},
});

// Mock fetch API
global.fetch = vi.fn();

// Helper to create a mock response
export function mockResponse(data, options = {}) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json" },
    ...options,
  });
}

// Reset fetch mock after each test
afterEach(() => {
  global.fetch.mockReset();
});
