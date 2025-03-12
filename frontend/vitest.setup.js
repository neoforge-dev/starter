/**
 * Global setup file for Vitest
 * This file is loaded before any tests run and sets up the global environment
 */

// Performance API polyfill for JSDOM environment
if (
  typeof globalThis.performance !== "object" ||
  typeof globalThis.performance.now !== "function"
) {
  const startTime = Date.now();

  globalThis.performance = {
    ...(globalThis.performance || {}),
    now: () => {
      return Date.now() - startTime;
    },
    mark: () => {},
    measure: () => {},
    getEntriesByName: () => [],
    getEntriesByType: () => [],
    clearMarks: () => {},
    clearMeasures: () => {},
  };

  console.log(
    "Performance API polyfill installed globally for JSDOM environment"
  );
}

// Ensure global.performance is also set for Node.js environment
if (
  typeof global === "object" &&
  (!global.performance || typeof global.performance.now !== "function")
) {
  global.performance = globalThis.performance;
}

// Patch worker threads to handle performance.now
// This is a workaround for Vitest worker threads that don't inherit the polyfill
try {
  // Monkey patch the worker.js file to include our performance polyfill
  const Module = require("module");
  const originalRequire = Module.prototype.require;

  Module.prototype.require = function (path) {
    const result = originalRequire.apply(this, arguments);

    // If this is a worker module, patch it with our performance polyfill
    if (path.includes("vitest/dist/worker") || path.includes("tinypool")) {
      if (!result.performance || typeof result.performance.now !== "function") {
        const startTime = Date.now();
        result.performance = {
          ...(result.performance || {}),
          now: () => Date.now() - startTime,
          mark: () => {},
          measure: () => {},
          getEntriesByName: () => [],
          getEntriesByType: () => [],
          clearMarks: () => {},
          clearMeasures: () => {},
        };
        console.log(
          `Performance API polyfill installed for worker module: ${path}`
        );
      }
    }

    return result;
  };
} catch (error) {
  console.warn("Failed to patch worker threads:", error);
}

// Suppress MaxListenersExceededWarning
process.setMaxListeners(100);

// Mock fetch API for tests if not already mocked
if (!global.fetch) {
  global.fetch = () =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({}),
      text: () => Promise.resolve(""),
    });
}
