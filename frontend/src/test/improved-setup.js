/**
 * Improved Test Setup
 *
 * This file provides an improved setup for testing web components.
 * It addresses common issues with custom element registration in the test environment.
 */

import { expect, vi, beforeEach, afterEach } from "vitest";
import { LitElement, html } from "lit";
import {
  registerTestComponents,
  registerTestComponent,
  createComponentFixture,
  cleanupComponentFixture,
  resetComponentRegistry,
} from "./component-registration-helper.js";

// Export html for use in tests
export { html };

// Export component registration helpers
export {
  registerTestComponent,
  registerTestComponents,
  createComponentFixture,
  cleanupComponentFixture,
};

// Create a basic document if it doesn't exist
if (!globalThis.document) {
  const { JSDOM } = await import("jsdom");
  const dom = new JSDOM(
    "<!DOCTYPE html><html><head></head><body></body></html>",
    {
      url: "http://localhost",
      pretendToBeVisual: true,
    }
  );

  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.customElements = dom.window.customElements;
  globalThis.HTMLElement = dom.window.HTMLElement;
  globalThis.CustomEvent = dom.window.CustomEvent;
  globalThis.Event = dom.window.Event;
  globalThis.Node = dom.window.Node;
  globalThis.navigator = dom.window.navigator;

  // Add missing browser APIs
  globalThis.window.matchMedia = vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
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
  },
};

// Use Object.defineProperty instead of direct assignment
Object.defineProperty(global, "localStorage", {
  value: mockLocalStorage,
  writable: true,
});

// Export test utilities
export const TestUtils = {
  // Legacy fixture method for backward compatibility
  fixture: async (template) => {
    const container = document.createElement("div");
    container.innerHTML = template;
    document.body.appendChild(container);
    return container.firstElementChild;
  },

  // Legacy html method for backward compatibility
  html: (strings, ...values) => {
    return strings.reduce((result, str, i) => {
      return result + str + (values[i] || "");
    }, "");
  },

  // Wait for a component to be ready
  waitForComponent: async (element) => {
    if (!element) return null;
    if (element.updateComplete) {
      await element.updateComplete;
    }
    return element;
  },

  // Wait for all components to be ready
  waitForAll: async (element) => {
    if (!element) return null;

    // Wait for the element itself
    if (element.updateComplete) {
      await element.updateComplete;
    }

    // Wait for all child components
    const children = element.shadowRoot
      ? Array.from(element.shadowRoot.querySelectorAll("*"))
      : [];

    await Promise.all(
      children.filter((el) => el.updateComplete).map((el) => el.updateComplete)
    );

    return element;
  },

  // Query a component's shadow DOM
  queryComponent: (element, selector) => {
    if (!element) return null;
    if (!element.shadowRoot) {
      console.warn("Element does not have a shadow root:", element);
      return null;
    }
    return element.shadowRoot.querySelector(selector);
  },

  // Query all elements in a component's shadow DOM
  queryAllComponents: (element, selector) => {
    if (!element || !element.shadowRoot) return [];
    return element.shadowRoot.querySelectorAll(selector);
  },

  // Create a mock component
  createMockComponent: async (tagName, template = "") => {
    class MockComponent extends LitElement {
      render() {
        return typeof template === "function" ? template() : template;
      }
    }

    await registerTestComponent(tagName, MockComponent, { force: true });
    return document.createElement(tagName);
  },

  // Create a component fixture
  createFixture: createComponentFixture,

  // Clean up a component fixture
  cleanupFixture: cleanupComponentFixture,
};

// Register common components for testing
export async function registerCommonComponents() {
  const components = [
    ["neo-button", () => import("../components/atoms/button/button.js")],
    ["neo-input", () => import("../components/atoms/input/input.js")],
    ["neo-select", () => import("../components/atoms/select/select.js")],
    ["neo-checkbox", () => import("../components/atoms/checkbox/checkbox.js")],
    ["neo-radio", () => import("../components/atoms/radio/radio.js")],
    ["neo-badge", () => import("../components/atoms/badge/badge.js")],
    ["neo-icon", () => import("../components/atoms/icon/icon.js")],
    ["neo-alert", () => import("../components/molecules/alert/alert.js")],
    ["neo-toast", () => import("../components/molecules/toast/toast.js")],
    ["neo-modal", () => import("../components/molecules/modal/modal.js")],
    ["neo-card", () => import("../components/molecules/card/card.js")],
    ["neo-tabs", () => import("../components/molecules/tabs/tabs.js")],
    ["neo-table", () => import("../components/organisms/table/table.js")],
  ];

  return registerTestComponents(components);
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
  document.body.innerHTML = "";
});

// Export a function to set up a test environment
export async function setupTestEnvironment(options = {}) {
  const { registerComponents = true } = options;

  if (registerComponents) {
    await registerCommonComponents();
  }

  return {
    TestUtils,
    registerTestComponent,
    registerTestComponents,
    createComponentFixture,
    cleanupComponentFixture,
    resetComponentRegistry,
  };
}

// Export a function to clean up a test environment
export function cleanupTestEnvironment() {
  resetComponentRegistry();
  document.body.innerHTML = "";
}

// Export a default setup function
export default async function setup(options = {}) {
  return setupTestEnvironment(options);
}
