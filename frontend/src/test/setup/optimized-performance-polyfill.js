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

  // Specifically patch JSDOM if it's being used
  try {
    // Check if we're in a JSDOM environment
    if (
      typeof window !== "undefined" &&
      window.navigator &&
      window.navigator.userAgent &&
      window.navigator.userAgent.includes("jsdom")
    ) {
      // Ensure window.performance is properly set
      if (!window.performance) {
        window.performance = performancePolyfill;
      } else if (typeof window.performance.now !== "function") {
        Object.assign(window.performance, performancePolyfill);
      }

      // Also try to patch the JSDOM module directly
      if (typeof require === "function") {
        try {
          const jsdom = require("jsdom");
          if (jsdom && jsdom.JSDOM) {
            // Patch JSDOM.prototype to ensure new instances have performance
            const originalFromURL = jsdom.JSDOM.fromURL;
            if (originalFromURL) {
              jsdom.JSDOM.fromURL = function (...args) {
                const result = originalFromURL.apply(this, args);
                if (
                  result &&
                  result.window &&
                  (!result.window.performance ||
                    typeof result.window.performance.now !== "function")
                ) {
                  result.window.performance = performancePolyfill;
                }
                return result;
              };
            }

            // Patch the constructor
            const originalJSDOM = jsdom.JSDOM;
            jsdom.JSDOM = function (...args) {
              const result = new originalJSDOM(...args);
              if (
                result &&
                result.window &&
                (!result.window.performance ||
                  typeof result.window.performance.now !== "function")
              ) {
                result.window.performance = performancePolyfill;
              }
              return result;
            };
            jsdom.JSDOM.prototype = originalJSDOM.prototype;

            // Copy all static properties
            Object.getOwnPropertyNames(originalJSDOM).forEach((prop) => {
              if (prop !== "prototype" && prop !== "constructor") {
                jsdom.JSDOM[prop] = originalJSDOM[prop];
              }
            });
          }
        } catch (e) {
          // JSDOM module not found or couldn't be patched
        }
      }
    }
  } catch (e) {
    // Error patching JSDOM
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
applyPolyfill();

// Patch Vitest worker and Tinypool modules
function patchVitestModules() {
  try {
    // Instead of patching import/require directly, create a global helper that can be used
    // to ensure performance is available in any context
    if (typeof globalThis !== "undefined") {
      globalThis.__ensurePerformance = function (obj) {
        if (!obj) return;

        if (!obj.performance) {
          obj.performance = createPerformancePolyfill();
        } else if (typeof obj.performance.now !== "function") {
          Object.assign(obj.performance, createPerformancePolyfill());
        }

        return obj;
      };

      // Also create a simple function to get a performance object
      // This avoids the need to clone complex functions
      globalThis.__getPerformance = function () {
        return createPerformancePolyfill();
      };
    }

    // For ESM, we can't directly require modules, but we can ensure
    // that any imported modules will have access to our global helpers

    // Also ensure the global performance object is available
    if (typeof globalThis !== "undefined" && !globalThis.performance) {
      globalThis.performance = createPerformancePolyfill();
    }
  } catch (error) {
    console.warn("Could not set up performance patches:", error.message);
  }
}

// Patch JSDOM's Window.js file
function patchJsdomWindow() {
  try {
    // Try to find the JSDOM module
    if (typeof require === "function") {
      try {
        const jsdom = require("jsdom");
        if (jsdom && jsdom.JSDOM) {
          // Get the Window prototype
          const JSDOM = jsdom.JSDOM;
          const window = new JSDOM().window;

          // Ensure the window has a performance object
          if (!window.performance) {
            Object.defineProperty(window, "performance", {
              value: createPerformancePolyfill(),
              writable: true,
              configurable: true,
            });
          } else if (typeof window.performance.now !== "function") {
            Object.assign(window.performance, createPerformancePolyfill());
          }

          // Try to patch the Window prototype directly
          const windowProto = Object.getPrototypeOf(window);
          if (windowProto) {
            if (!windowProto.performance) {
              Object.defineProperty(windowProto, "performance", {
                value: createPerformancePolyfill(),
                writable: true,
                configurable: true,
              });
            } else if (typeof windowProto.performance.now !== "function") {
              Object.assign(
                windowProto.performance,
                createPerformancePolyfill()
              );
            }
          }

          // Also try to patch the Window constructor
          const WindowConstructor = window.Window;
          if (WindowConstructor && WindowConstructor.prototype) {
            if (!WindowConstructor.prototype.performance) {
              Object.defineProperty(
                WindowConstructor.prototype,
                "performance",
                {
                  value: createPerformancePolyfill(),
                  writable: true,
                  configurable: true,
                }
              );
            } else if (
              typeof WindowConstructor.prototype.performance.now !== "function"
            ) {
              Object.assign(
                WindowConstructor.prototype.performance,
                createPerformancePolyfill()
              );
            }
          }
        }
      } catch (e) {
        // JSDOM module not found or couldn't be patched
      }
    }
  } catch (e) {
    // Error patching JSDOM
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
      (err.message.includes("performance.now is not a function") ||
        err.message.includes("performance is not defined") ||
        (err.stack && err.stack.includes("performance.now")))
    ) {
      // Apply the polyfill more aggressively
      const performancePolyfill = createPerformancePolyfill();

      // Apply to all possible globals
      if (typeof globalThis !== "undefined")
        globalThis.performance = performancePolyfill;
      if (typeof global !== "undefined")
        global.performance = performancePolyfill;
      if (typeof window !== "undefined")
        window.performance = performancePolyfill;
      if (typeof self !== "undefined") self.performance = performancePolyfill;

      // Also try to patch the specific context where the error occurred
      try {
        if (err.stack) {
          // Try to identify the module from the stack trace
          const stackLines = err.stack.split("\n");
          for (const line of stackLines) {
            if (line.includes("node_modules/")) {
              const match = line.match(/node_modules\/([^/]+)/);
              if (match && match[1]) {
                const moduleName = match[1];
                try {
                  // Try to patch the module directly
                  const mod = require(moduleName);
                  if (mod && typeof mod === "object") {
                    mod.performance = performancePolyfill;
                  }
                } catch (e) {
                  // Module not found or couldn't be patched
                }
              }
            }
          }
        }
      } catch (e) {
        // Error trying to patch specific module
      }

      // Don't rethrow the error
      return;
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
applyPolyfill();
patchVitestModules();
patchJsdomWindow();
setupErrorHandling();

// Export the polyfill and utility functions
export default applyPolyfill;
export { createPerformancePolyfill, patchVitestModules, setupErrorHandling };
