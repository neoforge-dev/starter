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

// Ensure HTMLElement constructor is properly set up
const originalHTMLElement = global.HTMLElement;
global.HTMLElement = function HTMLElement() {
  const newTarget = new.target || HTMLElement;
  return Reflect.construct(originalHTMLElement, [], newTarget);
};
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
      const element = Reflect.construct(
        HTMLElement,
        [],
        CustomElementConstructor
      );

      // Set up prototype chain
      Object.setPrototypeOf(element, constructor.prototype);
      Object.setPrototypeOf(
        CustomElementConstructor.prototype,
        constructor.prototype
      );
      Object.setPrototypeOf(CustomElementConstructor, constructor);

      // Call original constructor with proper this binding
      if (constructor.prototype.constructor) {
        constructor.apply(element, args);
      }

      return element;
    }

    // Ensure prototype chain is set up correctly
    CustomElementConstructor.prototype = Object.create(constructor.prototype);
    Object.setPrototypeOf(
      CustomElementConstructor.prototype,
      HTMLElement.prototype
    );
    Object.setPrototypeOf(CustomElementConstructor, HTMLElement);

    // Store both the wrapper and original constructor
    customElementRegistry.set(name, {
      constructor: CustomElementConstructor,
      original: constructor,
    });
  },
  get: (name) => {
    const entry = customElementRegistry.get(name);
    return entry ? entry.constructor : undefined;
  },
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
    const constructor = customElements.get(template);
    if (!constructor) {
      throw new Error(`Custom element ${template} not registered`);
    }
    const instance = new constructor();
    document.body.appendChild(instance);
    if ("updateComplete" in instance) {
      await instance.updateComplete;
    }
    return instance;
  }

  // Handle full HTML template
  const templateElement = document.createElement("template");
  const templateString =
    typeof template === "string" ? template : template.join("");
  templateElement.innerHTML = templateString;

  // Get the first element from the template
  const element = templateElement.content.firstElementChild;
  if (!element) {
    throw new Error("Template must contain a single element");
  }

  // Get the element's tag name
  const tagName = element.tagName.toLowerCase();

  // Get the constructor from the registry
  const constructor = customElements.get(tagName);
  if (!constructor) {
    throw new Error(`Custom element ${tagName} not registered`);
  }

  // Create a new instance of the element
  const instance = new constructor();

  // Copy attributes from template element to instance
  for (const attr of element.attributes) {
    instance.setAttribute(attr.name, attr.value);
  }

  // Append to document
  document.body.appendChild(instance);

  // Wait for element to be ready
  if ("updateComplete" in instance) {
    await instance.updateComplete;
  }

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
