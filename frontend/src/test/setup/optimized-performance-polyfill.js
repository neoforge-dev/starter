/**
 * Optimized Performance API Polyfill
 *
 * This file provides a consolidated polyfill for the Performance API that works
 * in all environments (Node.js, JSDOM, worker threads) while minimizing redundant
 * installations and logging.
 */

// Set NODE_ENV to production to silence Lit dev mode warning
if (typeof process !== "undefined" && process.env) {
  process.env.NODE_ENV = "production";
}

// Store the start time when this module is loaded
const startTime = Date.now();

// Create a global flag to track whether the polyfill has been installed
// This will be shared across all instances of this module
if (typeof globalThis !== "undefined") {
  if (!globalThis.__PERFORMANCE_POLYFILL_INSTALLED__) {
    globalThis.__PERFORMANCE_POLYFILL_INSTALLED__ = false;
  }
}

// Define the performance polyfill with all required methods
function createPerformancePolyfill() {
  return {
    _marks: {},
    _measures: {},

    now() {
      return Date.now() - startTime;
    },

    mark(name) {
      if (!name) return;
      this._marks[name] = this.now();
      return undefined;
    },

    measure(name, startMark, endMark) {
      if (!name) return;
      const start = this._marks[startMark] || 0;
      const end = this._marks[endMark] || this.now();
      this._measures[name] = {
        name,
        startTime: start,
        duration: end - start,
      };
      return undefined;
    },

    getEntriesByName(name, type) {
      if (type === "mark" && this._marks && this._marks[name]) {
        return [{ name, startTime: this._marks[name], entryType: "mark" }];
      }
      if (type === "measure" && this._measures && this._measures[name]) {
        return [{ ...this._measures[name], entryType: "measure" }];
      }
      return [];
    },

    getEntriesByType(type) {
      if (type === "mark" && this._marks) {
        return Object.keys(this._marks).map((name) => ({
          name,
          startTime: this._marks[name],
          entryType: "mark",
        }));
      }
      if (type === "measure" && this._measures) {
        return Object.values(this._measures).map((measure) => ({
          ...measure,
          entryType: "measure",
        }));
      }
      return [];
    },

    clearMarks(name) {
      if (name) {
        delete this._marks[name];
      } else {
        this._marks = {};
      }
    },

    clearMeasures(name) {
      if (name) {
        delete this._measures[name];
      } else {
        this._measures = {};
      }
    },
  };
}

// Apply the polyfill to all possible global objects
function applyPolyfill(silent = false) {
  // Check if the polyfill has already been installed globally
  if (
    typeof globalThis !== "undefined" &&
    globalThis.__PERFORMANCE_POLYFILL_INSTALLED__
  ) {
    return typeof performance !== "undefined" ? performance : null;
  }

  // List of all possible global objects
  const globals = [
    typeof globalThis !== "undefined" ? globalThis : null,
    typeof global !== "undefined" ? global : null,
    typeof window !== "undefined" ? window : null,
    typeof self !== "undefined" ? self : null,
  ].filter(Boolean);

  // Create a single performance polyfill instance to share
  const performancePolyfill = createPerformancePolyfill();

  // Apply the polyfill to each global object
  for (const g of globals) {
    if (!g.performance) {
      g.performance = performancePolyfill;
    } else if (typeof g.performance.now !== "function") {
      // If performance exists but now() is missing, add it
      Object.assign(g.performance, performancePolyfill);
    }
  }

  // Ensure the polyfill is properly applied to the current context
  if (typeof performance === "undefined") {
    // eslint-disable-next-line no-global-assign
    performance = performancePolyfill;
  } else if (typeof performance.now !== "function") {
    Object.assign(performance, performancePolyfill);
  }

  // Log only if this is the first installation
  if (
    !silent &&
    typeof globalThis !== "undefined" &&
    !globalThis.__PERFORMANCE_POLYFILL_INSTALLED__
  ) {
    console.log("Performance API polyfill installed");
    globalThis.__PERFORMANCE_POLYFILL_INSTALLED__ = true;
  }

  return performancePolyfill;
}

// Apply the polyfill immediately
const performancePolyfill = applyPolyfill();

// Patch Vitest worker and Tinypool modules
function patchVitestModules() {
  if (typeof require !== "function" || typeof module === "undefined") {
    return;
  }

  try {
    const originalRequire = module.require;

    // Create a patched version of require that ensures performance is available
    // Use a named function to make it more serializable
    function patchedRequire(id) {
      try {
        const result = originalRequire.apply(this, arguments);

        // Only patch specific modules to avoid unnecessary work
        if (
          id.includes("vitest") ||
          id.includes("worker") ||
          id.includes("tinypool")
        ) {
          // Apply the polyfill to the module's context if needed
          if (result && typeof result === "object") {
            if (!result.performance) {
              result.performance = createPerformancePolyfill();
            } else if (typeof result.performance.now !== "function") {
              Object.assign(result.performance, createPerformancePolyfill());
            }
          }
        }

        return result;
      } catch (error) {
        console.warn(`Error in patched require for ${id}:`, error.message);
        return originalRequire.apply(this, arguments);
      }
    }

    // Copy all properties from the original require
    for (const key in originalRequire) {
      if (Object.prototype.hasOwnProperty.call(originalRequire, key)) {
        patchedRequire[key] = originalRequire[key];
      }
    }

    // Use a safer approach to patch require
    try {
      // Store the original require function
      const originalModuleRequire = module.constructor.prototype.require;

      // Create a wrapper function that doesn't hold references to closures
      module.constructor.prototype.require = function wrappedRequire(id) {
        // For Vitest and worker modules, use our performance polyfill
        if (
          id.includes("vitest") ||
          id.includes("worker") ||
          id.includes("tinypool")
        ) {
          const result = originalModuleRequire.call(this, id);

          // Apply the polyfill to the module's context if needed
          if (result && typeof result === "object") {
            if (!result.performance) {
              result.performance = createPerformancePolyfill();
            } else if (typeof result.performance.now !== "function") {
              Object.assign(result.performance, createPerformancePolyfill());
            }
          }

          return result;
        }

        // For other modules, use the original require
        return originalModuleRequire.call(this, id);
      };
    } catch (error) {
      console.warn(
        "Could not patch module.constructor.prototype.require:",
        error.message
      );
    }
  } catch (error) {
    console.warn("Could not patch require function:", error.message);
  }
}

// Set up error handling for performance.now errors
function setupErrorHandling() {
  if (typeof process === "undefined" || !process.on) {
    return;
  }

  // Remove any existing handlers for performance.now errors
  const existingHandlers = process.listeners("uncaughtException");
  for (const handler of existingHandlers) {
    if (handler.toString().includes("performance.now")) {
      process.removeListener("uncaughtException", handler);
    }
  }

  // Add a single handler for performance.now errors
  process.on("uncaughtException", (err) => {
    if (
      err.message &&
      err.message.includes("performance.now is not a function")
    ) {
      // Silently reapply the polyfill
      applyPolyfill(true);
      return; // Don't rethrow
    }
    // For other errors, rethrow
    throw err;
  });

  // Increase max listeners to avoid warnings
  if (process.setMaxListeners) {
    process.setMaxListeners(150);
  }
}

// Initialize everything
patchVitestModules();
setupErrorHandling();

// Export the polyfill and utility functions
export default applyPolyfill;
export { createPerformancePolyfill, patchVitestModules, setupErrorHandling };
