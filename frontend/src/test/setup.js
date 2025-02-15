import { beforeAll, afterEach, expect, vi } from "vitest";
import { LitElement } from "lit";
import chai from "chai";
import { assert } from "chai";
import { JSDOM } from "jsdom";
import { MemoryMonitor } from "../components/core/memory-monitor.js";
import { fixture } from "@open-wc/testing-helpers";

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

// Store original HTMLElement
const originalHTMLElement = global.HTMLElement;

// Create a proper custom element base class
class CustomElement extends originalHTMLElement {
  constructor() {
    super();
    if (new.target === CustomElement) {
      return Reflect.construct(originalHTMLElement, [], new.target);
    }
    return this;
  }
}

// Create a proper wrapper for LitElement
class WrappedLitElement extends LitElement {
  constructor() {
    super();
    if (new.target === WrappedLitElement) {
      return Reflect.construct(LitElement, [], new.target);
    }
    return this;
  }
}

// Helper to wrap custom elements
function wrapCustomElement(constructor) {
  return class extends constructor {
    constructor() {
      super();
      if (new.target === constructor) {
        return Reflect.construct(constructor, [], new.target);
      }
      return this;
    }
  };
}

// Setup custom element registry
const originalDefine = global.customElements.define;
global.customElements.define = (name, constructor, options) => {
  if (!global.customElements.get(name)) {
    const wrappedConstructor = wrapCustomElement(constructor);
    originalDefine.call(
      global.customElements,
      name,
      wrappedConstructor,
      options
    );
  }
};

// Setup test environment
global.HTMLElement = CustomElement;
global.LitElement = WrappedLitElement;

// Setup chai
global.expect = expect;

// Setup fixture helper
global.fixture = fixture;

// Setup Lit environment
HTMLElement.prototype.attachShadow = function (options) {
  const shadowRoot = document.createElement("div");
  shadowRoot.host = this;
  Object.defineProperty(this, "shadowRoot", {
    get() {
      return shadowRoot;
    },
    enumerable: true,
    configurable: true,
  });
  return shadowRoot;
};

// Mock Lit element lifecycle methods
LitElement.prototype.requestUpdate = function () {
  return Promise.resolve();
};

LitElement.prototype.createRenderRoot = function () {
  if (!this.shadowRoot) {
    this.attachShadow({ mode: "open" });
  }
  return this.shadowRoot;
};

LitElement.prototype.update = function (changedProperties) {
  if (this.render) {
    const result = this.render();
    if (this.shadowRoot) {
      this.shadowRoot.innerHTML = "";
      if (typeof result === "string") {
        this.shadowRoot.innerHTML = result;
      } else if (result && result.strings) {
        // Handle lit-html TemplateResult
        this.shadowRoot.innerHTML = result.strings.join("<!-- lit-part -->");
      }
    }
  }
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
    if (element.updateComplete) {
      await element.updateComplete;
    }
    return element;
  }

  // Handle full HTML template
  const templateElement = document.createElement("template");
  templateElement.innerHTML = template;
  const element = templateElement.content.firstElementChild;
  document.body.appendChild(element);
  if (element.updateComplete) {
    await element.updateComplete;
  }
  return element;
}

/**
 * Waits for an element to complete its update cycle
 * @param {Element} element - The element to wait for
 * @returns {Promise<void>}
 */
export async function waitForUpdate(element) {
  if (element.updateComplete) {
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
