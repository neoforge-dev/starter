/**
 * Performance API polyfill for Vitest
 *
 * This file provides a polyfill for the Performance API in Node.js environments
 * where it might not be fully implemented, particularly in worker threads.
 */

// Store the start time when this module is loaded
const startTime = Date.now();

// Check if performance is already defined
if (typeof performance === "undefined") {
  // Create a global performance object
  global.performance = {
    // Basic now() implementation that returns milliseconds since module load
    now() {
      return Date.now() - startTime;
    },
    // Stub implementations for other Performance API methods
    mark() {},
    measure() {},
    getEntriesByName() {
      return [];
    },
    getEntriesByType() {
      return [];
    },
    clearMarks() {},
    clearMeasures() {},
    // Add any other Performance API methods that might be used
  };

  console.log("Performance API polyfill installed");
}

// Patch worker threads
// This is a more aggressive approach to ensure the polyfill is available in worker threads
const originalRequire = module.constructor.prototype.require;

if (originalRequire) {
  module.constructor.prototype.require = function (path) {
    const result = originalRequire.apply(this, arguments);

    // Check if we're loading a worker-related module
    if (path.includes("vitest/dist/worker") || path.includes("tinypool")) {
      // Ensure performance is defined in the worker context
      if (result && typeof result === "object") {
        // Patch the worker module to include our performance polyfill
        if (
          typeof performance === "undefined" ||
          typeof performance.now !== "function"
        ) {
          global.performance = global.performance || {};
          global.performance.now =
            global.performance.now ||
            function () {
              return Date.now() - startTime;
            };
          console.log(
            `Performance API polyfill installed for worker module: ${path}`
          );
        }
      }
    }

    return result;
  };
}

// Mock CDN imports
// This is needed to handle imports from HTTPS URLs
try {
  // Mock the Node.js URL handling to support HTTPS imports
  const Module = require("module");
  const originalResolveFilename = Module._resolveFilename;

  Module._resolveFilename = function (request, parent, isMain, options) {
    // Handle ESM bundle imports
    if (request.startsWith("@esm-bundle/") || request.includes("https://")) {
      // Mock the import with a local module
      console.log(`Mocking CDN import: ${request}`);

      // For chai specifically
      if (request === "@esm-bundle/chai") {
        return originalResolveFilename("chai", parent, isMain, options);
      }

      // For other CDN imports, return a mock module
      return originalResolveFilename("vitest", parent, isMain, options);
    }

    return originalResolveFilename(request, parent, isMain, options);
  };
} catch (error) {
  console.error("Error setting up CDN import mocking:", error);
}

// Suppress MaxListenersExceededWarning
process.setMaxListeners(100);

module.exports = {};
