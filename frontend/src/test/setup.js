import { beforeAll, afterEach, expect, vi } from "vitest";
import { LitElement } from "lit";
import chai from "chai";
import { assert } from "chai";

// Extend chai with custom matchers
Object.assign(globalThis, { chai, assert });

// Mock window if it doesn't exist
if (typeof window === "undefined") {
  global.window = {
    process: { env: { NODE_ENV: "test" } },
    requestAnimationFrame: (cb) => setTimeout(cb, 0),
    matchMedia: () => ({
      matches: false,
      addListener: () => {},
      removeListener: () => {},
    }),
  };
}

// Mock customElements API
const customElementRegistry = new Map();

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
  window.process = { env: { NODE_ENV: "test" } };
});

// Clean up after each test
afterEach(() => {
  // Clear custom elements registry
  customElementRegistry.clear();
  // Clean up the DOM
  document.body.innerHTML = "";
  // Reset all mocks
  vi.clearAllMocks();
});

/**
 * Create a test fixture for a web component
 * @param {string} template - Initial HTML template
 * @returns {Promise<HTMLElement>} Component instance
 */
export async function fixture(template) {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = template;
  document.body.appendChild(wrapper);
  const element = wrapper.firstElementChild;

  // If element is a LitElement, wait for it to be ready
  if (element instanceof LitElement) {
    // Ensure shadow root is created
    if (!element.shadowRoot) {
      element.attachShadow({ mode: "open" });
    }
    await element.updateComplete;
  }

  return element;
}

/**
 * Wait for element to be updated
 * @param {LitElement} element - Element to wait for
 * @returns {Promise<void>}
 */
export async function waitForUpdate(element) {
  if (element instanceof LitElement) {
    // Ensure shadow root is created
    if (!element.shadowRoot) {
      element.attachShadow({ mode: "open" });
    }
    await element.updateComplete;
  }
  // Wait for two animation frames to ensure all updates are complete
  await new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(resolve);
    });
  });
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

// Mock IntersectionObserver
class IntersectionObserver {
  constructor(callback) {
    this.callback = callback;
  }

  observe() {}
  unobserve() {}
  disconnect() {}
}

// Mock ResizeObserver
class ResizeObserver {
  constructor(callback) {
    this.callback = callback;
  }

  observe() {}
  unobserve() {}
  disconnect() {}
}

// Mock fetch
global.fetch = vi.fn().mockImplementation(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(""),
  })
);

global.IntersectionObserver = IntersectionObserver;
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

// Custom matchers for web components
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
