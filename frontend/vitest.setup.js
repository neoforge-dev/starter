/**
 * Global setup file for Vitest
 * This file is loaded before any tests run and sets up the global environment
 */

// Import and apply polyfills
import applyPolyfill from "./src/test/setup/global-performance-polyfill.js";
import setupWorkerPolyfill from "./src/test/setup/worker-performance-polyfill.js";

// Apply polyfills immediately
applyPolyfill();
setupWorkerPolyfill();

// Apply the direct patch for Vitest worker
try {
  // Try to apply the direct patch
  require("./src/test/setup/direct-patch-vitest-worker.cjs");
  console.log("Direct Vitest worker patch applied successfully");
} catch (error) {
  console.error("Error applying direct Vitest worker patch:", error);
}

// Create a more robust performance polyfill if needed
if (
  typeof performance === "undefined" ||
  typeof performance.now !== "function"
) {
  const startTime = Date.now();

  // Create a comprehensive performance polyfill
  globalThis.performance = {
    now() {
      return Date.now() - startTime;
    },
    mark(name) {
      if (!this._marks) this._marks = {};
      this._marks[name] = this.now();
      return undefined;
    },
    measure(name, startMark, endMark) {
      if (!this._measures) this._measures = {};
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
      if (!this._marks) return;
      if (name) {
        delete this._marks[name];
      } else {
        this._marks = {};
      }
    },
    clearMeasures(name) {
      if (!this._measures) return;
      if (name) {
        delete this._measures[name];
      } else {
        this._measures = {};
      }
    },
  };

  // Apply the polyfill to all global objects
  const globalObjects = [
    globalThis,
    typeof global !== "undefined" ? global : null,
    typeof self !== "undefined" ? self : null,
    typeof window !== "undefined" ? window : null,
  ];

  globalObjects.forEach((obj) => {
    if (
      obj &&
      (typeof obj.performance === "undefined" ||
        typeof obj.performance.now !== "function")
    ) {
      obj.performance = globalThis.performance;
    }
  });

  console.log(
    "Robust performance polyfill created and applied to global objects"
  );
}

// Create a custom error handler to suppress performance.now errors
const originalErrorHandler = process
  .listeners("uncaughtException")
  .find((handler) => handler.toString().includes("performance.now"));

// Remove the original error handler if it exists
if (originalErrorHandler) {
  process.removeListener("uncaughtException", originalErrorHandler);
}

// Add a new error handler that suppresses performance.now errors
process.on("uncaughtException", (error) => {
  if (
    error.message &&
    error.message.includes("performance.now is not a function")
  ) {
    // Silently handle performance.now errors
    console.debug("Suppressed performance.now error");

    // Create a new performance polyfill
    const startTime = Date.now();
    const performancePolyfill = {
      now() {
        return Date.now() - startTime;
      },
      mark() {
        return undefined;
      },
      measure() {
        return undefined;
      },
      getEntriesByName() {
        return [];
      },
      getEntriesByType() {
        return [];
      },
      clearMarks() {},
      clearMeasures() {},
    };

    // Apply to all global objects
    [globalThis, global, self, window].forEach((obj) => {
      if (obj) obj.performance = performancePolyfill;
    });

    // Don't rethrow the error since we've handled it
    return;
  }

  // For other errors, rethrow
  throw error;
});

// Suppress MaxListenersExceededWarning
process.setMaxListeners(100);

// Mock fetch if it's not already mocked
if (!globalThis.fetch) {
  globalThis.fetch = async () => {
    return {
      ok: true,
      status: 200,
      json: async () => ({}),
      text: async () => "",
      blob: async () => new Blob(),
      arrayBuffer: async () => new ArrayBuffer(0),
      headers: new Map(),
    };
  };
}

// Set NODE_ENV to test
process.env.NODE_ENV = "test";

console.log("Vitest setup complete with global performance polyfill");
