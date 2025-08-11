/**
 * Improved Test Setup
 *
 * This file provides an improved setup for testing web components.
 * It addresses common issues with custom element registration in the test environment.
 */

import { vi } from "vitest";
import {   html   } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";
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
      features: {
        FetchExternalResources: ["script"],
        ProcessExternalResources: ["script"],
        MutationObserver: true,
      },
    }
  );

  // Set up the global environment
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.HTMLElement = dom.window.HTMLElement;
  globalThis.CustomEvent = dom.window.CustomEvent;
  globalThis.Event = dom.window.Event;
  globalThis.customElements = dom.window.customElements;

  // Mock browser APIs that might be needed
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

  globalThis.window.requestAnimationFrame = (callback) =>
    setTimeout(callback, 0);
  globalThis.window.cancelAnimationFrame = (id) => clearTimeout(id);

  globalThis.MutationObserver = class {
    constructor(callback) {
      this.callback = callback;
    }
    observe() {}
    disconnect() {}
  };
}

// Test utilities
export const TestUtils = {
  async waitForComponent(component) {
    await component.updateComplete;
    return component;
  },

  async queryComponent(container, selector) {
    const element = container.querySelector(selector);
    if (element) {
      await element.updateComplete;
    }
    return element;
  },

  dispatchEvent(element, eventType, detail = {}) {
    const event = new CustomEvent(eventType, {
      detail,
      bubbles: true,
      composed: true,
    });
    element.dispatchEvent(event);
    return event;
  },
};

// Setup and cleanup functions
export async function setupTestEnvironment() {
  // Reset the component registry before each test
  resetComponentRegistry();

  return {
    registerTestComponent,
    registerTestComponents,
    createComponentFixture,
    cleanupComponentFixture,
  };
}

export function cleanupTestEnvironment() {
  // Clean up any registered components
  resetComponentRegistry();
}

// TestUtils already exported above as const export
