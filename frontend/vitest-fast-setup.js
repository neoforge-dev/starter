/**
 * Fast test setup - minimal configuration for speed
 * Skips complex polyfills and setups that aren't needed for unit tests
 */

import { beforeAll, beforeEach, afterEach } from "vitest";
import { configure } from "@testing-library/dom";

console.log("Fast test setup loaded");

// Minimal DOM configuration
configure({
  testIdAttribute: "data-testid",
  asyncUtilTimeout: 2000, // Reduced timeout for speed
});

// Mock console methods to reduce noise in fast tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  // Suppress known JSDOM warnings and errors for faster test execution
  console.error = (...args) => {
    const message = args[0]?.toString() || '';
    if (
      message.includes('_ceState') ||
      message.includes('Lit is in dev mode') ||
      message.includes('Could not parse CSS stylesheet') ||
      message.includes('Error: Uncaught') && message.includes('_ceState')
    ) {
      return; // Suppress these specific errors
    }
    originalConsoleError(...args);
  };

  console.warn = (...args) => {
    const message = args[0]?.toString() || '';
    if (
      message.includes('Lit is in dev mode') ||
      message.includes('deprecated') ||
      message.includes('PydanticDeprecated')
    ) {
      return; // Suppress these specific warnings
    }
    originalConsoleWarn(...args);
  };
});

beforeEach(() => {
  // Clear any existing custom element registrations to prevent conflicts
  // This is a simplified approach for fast testing
});

afterEach(() => {
  // Quick cleanup for fast tests
  document.body.innerHTML = '';
  
  // Clear any timers that might affect subsequent tests
  if (global.clearAllTimers) {
    global.clearAllTimers();
  }
});

// Minimal performance polyfill for tests that need it
if (!global.performance) {
  global.performance = {
    now: () => Date.now(),
    mark: () => {},
    measure: () => {},
    clearMarks: () => {},
    clearMeasures: () => {},
    getEntries: () => [],
    getEntriesByName: () => [],
    getEntriesByType: () => [],
  };
}

// Basic ResizeObserver mock
if (!global.ResizeObserver) {
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

// Basic IntersectionObserver mock
if (!global.IntersectionObserver) {
  global.IntersectionObserver = class IntersectionObserver {
    constructor(callback) {
      this.callback = callback;
    }
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}