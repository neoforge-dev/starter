/**
 * Global Performance API polyfill
 *
 * This file provides a comprehensive polyfill for the Performance API
 * that works in all environments, including Node.js, JSDOM, and worker threads.
 *
 * It uses a more aggressive approach to ensure the polyfill is available
 * everywhere it's needed, including in dynamically loaded modules.
 */

// Store the start time when this module is loaded
const startTime = Date.now();

// Define the performance polyfill
function createPerformancePolyfill() {
  return {
    now() {
      return Date.now() - startTime;
    },
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
}

// Apply the polyfill to all possible global objects
function applyPolyfill() {
  // List of all possible global objects
  const globals = [
    typeof globalThis !== "undefined" ? globalThis : null,
    typeof global !== "undefined" ? global : null,
    typeof window !== "undefined" ? window : null,
    typeof self !== "undefined" ? self : null,
  ].filter(Boolean);

  // Apply the polyfill to each global object
  for (const g of globals) {
    if (!g.performance) {
      g.performance = createPerformancePolyfill();
    } else if (typeof g.performance.now !== "function") {
      // If performance exists but now() is missing, add it
      Object.assign(g.performance, createPerformancePolyfill());
    }
  }

  // Special handling for Node.js
  if (typeof process !== "undefined" && typeof process.hrtime === "function") {
    // Use high-resolution time if available
    const nodePerformance = {
      now() {
        const [seconds, nanoseconds] = process.hrtime();
        return seconds * 1000 + nanoseconds / 1000000;
      },
    };

    // Apply the Node.js-specific implementation
    if (typeof global !== "undefined") {
      if (!global.performance) {
        global.performance = {
          ...createPerformancePolyfill(),
          ...nodePerformance,
        };
      } else if (typeof global.performance.now !== "function") {
        Object.assign(global.performance, nodePerformance);
      }
    }
  }

  // Ensure the polyfill is properly applied to the current context
  if (typeof performance === "undefined") {
    // eslint-disable-next-line no-global-assign
    performance = createPerformancePolyfill();
  } else if (typeof performance.now !== "function") {
    Object.assign(performance, createPerformancePolyfill());
  }

  console.log("Global Performance API polyfill installed");
}

// Apply the polyfill immediately
applyPolyfill();

// Export the polyfill for explicit use
export default applyPolyfill;

// Monkey patch require to ensure the polyfill is available in dynamically loaded modules
if (typeof require === "function" && typeof module !== "undefined") {
  const originalRequire = require;

  function patchedRequire(id) {
    const result = originalRequire(id);

    // If the module is related to testing or workers, ensure it has the performance polyfill
    if (
      id.includes("vitest") ||
      id.includes("worker") ||
      id.includes("tinypool")
    ) {
      // Apply the polyfill to the module's context
      if (result && typeof result === "object") {
        if (!result.performance) {
          result.performance = createPerformancePolyfill();
        } else if (typeof result.performance.now !== "function") {
          Object.assign(result.performance, createPerformancePolyfill());
        }
      }

      // Also reapply globally to ensure it's available
      applyPolyfill();
    }

    return result;
  }

  // Copy all properties from the original require
  for (const key in originalRequire) {
    if (Object.prototype.hasOwnProperty.call(originalRequire, key)) {
      patchedRequire[key] = originalRequire[key];
    }
  }

  // Replace the original require with our patched version
  module.constructor.prototype.require = patchedRequire;
}

// Add a global error handler to catch any issues with performance.now
if (typeof process !== "undefined" && process.on) {
  process.on("uncaughtException", (err) => {
    if (
      err.message &&
      err.message.includes("performance.now is not a function")
    ) {
      console.warn("Caught performance.now error, reapplying polyfill");
      applyPolyfill();
    }
  });
}
