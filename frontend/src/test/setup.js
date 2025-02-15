import { beforeAll, afterEach, expect, vi } from "vitest";
import { LitElement } from "lit";
import chai from "chai";
import { assert } from "chai";
import { JSDOM } from "jsdom";
import { MemoryMonitor } from "../components/core/memory-monitor.js";

// Initialize DOM environment with jsdom
const dom = new JSDOM(
  "<!DOCTYPE html><html><head></head><body></body></html>",
  {
    url: "http://localhost",
    pretendToBeVisual: true,
    runScripts: "dangerously",
    features: {
      QuerySelector: true,
    },
  }
);

// Set up global objects
global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;
global.HTMLElement = dom.window.HTMLElement;
global.Element = dom.window.Element;
global.Node = dom.window.Node;
global.CustomEvent = dom.window.CustomEvent;

// Set up Lit environment
global.HTMLElement.prototype.attachShadow = function () {
  const shadowRoot = document.createElement("div");
  shadowRoot.host = this;
  this.shadowRoot = shadowRoot;
  return shadowRoot;
};

// Mock Lit element lifecycle methods
LitElement.prototype.requestUpdate = function () {
  return Promise.resolve();
};

LitElement.prototype.createRenderRoot = function () {
  const root = this.attachShadow({ mode: "open" });
  root.host = this;
  return root;
};

LitElement.prototype.connectedCallback = function () {
  this.isConnected = true;
  this.requestUpdate();
};

LitElement.prototype.disconnectedCallback = function () {
  this.isConnected = false;
};

Object.defineProperty(LitElement.prototype, "updateComplete", {
  get() {
    return Promise.resolve(true);
  },
});

// Store original HTMLElement
const originalHTMLElement = global.HTMLElement;

// Create new HTMLElement constructor
global.HTMLElement = function HTMLElement() {
  const newTarget = new.target || HTMLElement;
  const element = Reflect.construct(originalHTMLElement, [], newTarget);
  return element;
};

// Set up prototype chain for HTMLElement
Object.setPrototypeOf(global.HTMLElement, originalHTMLElement);
Object.setPrototypeOf(
  global.HTMLElement.prototype,
  originalHTMLElement.prototype
);

// Set up custom elements registry
const customElementRegistry = new Map();

global.customElements = {
  define: (name, constructor) => {
    if (customElementRegistry.has(name)) {
      return; // Skip if already registered
    }

    // Create a wrapper constructor that properly extends HTMLElement
    function CustomElementConstructor(...args) {
      // Create the element instance
      const element = Reflect.construct(
        HTMLElement,
        [],
        CustomElementConstructor
      );

      // Initialize the element with the original constructor
      Object.setPrototypeOf(element, constructor.prototype);
      constructor.call(element, ...args);

      return element;
    }

    // Set up prototype chain
    CustomElementConstructor.prototype = Object.create(constructor.prototype);
    CustomElementConstructor.prototype.constructor = CustomElementConstructor;
    Object.setPrototypeOf(CustomElementConstructor, constructor);
    Object.setPrototypeOf(
      CustomElementConstructor.prototype,
      HTMLElement.prototype
    );

    // Store the constructor in the registry
    customElementRegistry.set(name, CustomElementConstructor);
  },
  get: (name) => customElementRegistry.get(name),
  clear: () => customElementRegistry.clear(),
};

// Register the MemoryMonitor component
customElements.define("memory-monitor", MemoryMonitor);

// Clean up after each test
afterEach(() => {
  // Clean up the DOM
  document.body.innerHTML = "";
  // Reset all mocks
  vi.clearAllMocks();
});

/**
 * Creates a fixture element in the DOM for testing
 * @param {string} template - The template string or tag name to create a fixture from
 * @returns {Promise<Element>} The created element
 */
export async function fixture(template) {
  // If template is just a tag name
  if (template.indexOf("<") === -1) {
    const Constructor = customElements.get(template);
    if (!Constructor) {
      throw new Error(`Custom element ${template} not registered`);
    }
    const element = new Constructor();
    document.body.appendChild(element);
    await element.updateComplete;
    return element;
  }

  // Handle full HTML template
  const templateElement = document.createElement("template");
  templateElement.innerHTML = template;
  const element = templateElement.content.firstElementChild;

  if (!element) {
    throw new Error("Template must contain a single element");
  }

  const tagName = element.tagName.toLowerCase();
  const Constructor = customElements.get(tagName);

  if (!Constructor) {
    throw new Error(`Custom element ${tagName} not registered`);
  }

  const instance = new Constructor();

  // Copy attributes
  Array.from(element.attributes).forEach((attr) => {
    instance.setAttribute(attr.name, attr.value);
  });

  document.body.appendChild(instance);
  await instance.updateComplete;

  return instance;
}

/**
 * Waits for an element to complete its update cycle
 * @param {Element} element - The element to wait for
 * @returns {Promise<void>}
 */
export async function waitForUpdate(element) {
  if (element instanceof LitElement) {
    await element.updateComplete;
  }
  return element;
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

// Add custom matchers
expect.extend({
  toHaveProperty(received, property) {
    const pass = property in received;
    return {
      message: () =>
        `expected ${received} ${pass ? "not " : ""}to have property ${property}`,
      pass,
    };
  },
});

// Mock process.env for tests
if (typeof process === "undefined") {
  global.process = { env: { NODE_ENV: "test" } };
} else {
  process.env.NODE_ENV = "test";
}
