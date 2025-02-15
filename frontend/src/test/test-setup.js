import { beforeEach, afterEach, vi } from "vitest";
import { fixture, fixtureCleanup } from "@open-wc/testing-helpers";
import { LitElement, html } from "lit";

// Create a basic document structure
if (!global.document) {
  const dom = new DOMParser().parseFromString(
    "<!DOCTYPE html><html><body></body></html>",
    "text/html"
  );
  global.document = dom;
  global.window = dom.defaultView;
}

// Mock window properties and methods
Object.defineProperties(global.window, {
  matchMedia: {
    value: () => ({
      matches: false,
      addListener: () => {},
      removeListener: () => {},
    }),
  },
  customElements: {
    value: {
      define: (name, constructor) => {
        if (!customElements.get(name)) {
          constructor.prototype.connectedCallback?.();
        }
      },
      get: (name) => null,
    },
  },
});

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
  customElement: (name) => (cls) => cls,
  property: () => () => {},
  state: () => () => {},
  query: () => () => {},
  queryAll: () => () => {},
  eventOptions: () => () => {},
}));

// Cleanup after each test
afterEach(() => {
  document.body.innerHTML = "";
  fixtureCleanup();
});
