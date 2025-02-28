import { beforeEach, afterEach, vi } from "vitest";
import { fixture, fixtureCleanup } from "@open-wc/testing-helpers";
import { LitElement, html } from "lit";

// Create a basic document structure if it doesn't exist
if (!global.document) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(
    "<!DOCTYPE html><html><body></body></html>",
    "text/html"
  );
  global.document = doc;
  global.window = doc.defaultView;
}

// Mock window properties and methods
global.window = {
  ...global.window,
  matchMedia: () => ({
    matches: false,
    addListener: () => {},
    removeListener: () => {},
  }),
  customElements: {
    define: (name, constructor) => {
      if (!customElements.get(name)) {
        const registry = new Map();
        registry.set(name, constructor);
        customElements.get = (n) => registry.get(n);
      }
    },
    get: (name) => undefined,
  },
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock fetch
global.fetch = vi.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(""),
  })
);

// Helper function to wait for element updates
export const waitForUpdate = async (element) => {
  await element.updateComplete;
  return new Promise((resolve) => setTimeout(resolve, 0));
};

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

// Clean up after each test
afterEach(() => {
  document.body.innerHTML = "";
  fixtureCleanup();
});

// Mock lit-html render
vi.mock("lit/html.js", () => ({
  html: (strings, ...values) => ({ strings, values }),
  render: vi.fn(),
}));

// Mock lit decorators
vi.mock("lit/decorators.js", () => ({
  customElement: (name) => (cls) => cls,
  property: () => () => {},
  state: () => () => {},
  query: () => () => {},
  queryAll: () => () => {},
  eventOptions: () => () => {},
}));
