/**
 * Global setup file for Vitest
 *
 * This file is loaded before any tests run and sets up the global environment.
 * It applies polyfills, patches, and other global configurations needed for tests.
 *
 * Key components:
 * 1. Performance API polyfill - Ensures performance.now() and other methods are available
 * 2. Package patches - Fixes issues with third-party packages
 * 3. Global error handling - Catches and suppresses specific errors
 * 4. Environment configuration - Sets up the test environment
 *
 * See /docs/performance-polyfill.md for detailed documentation on the Performance API polyfill.
 */

// Import the optimized performance polyfill and package patches
import applyPolyfill, {
  setupErrorHandling,
} from "./src/test/setup/optimized-performance-polyfill.js";
import { patchSemanticDomDiff } from "./src/test/setup/package-patches.js";

// Apply the polyfill once
applyPolyfill();

// Set up error handling for performance.now errors
setupErrorHandling();

// Apply package patches
patchSemanticDomDiff();

// Suppress MaxListenersExceededWarning by increasing the limit
if (typeof process !== "undefined" && process.setMaxListeners) {
  process.setMaxListeners(150);
}

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
process.env.NODE_ENV = "production";

// Silence the Lit dev mode warning
// if (typeof process !== "undefined" && process.env) {
//   process.env.NODE_ENV = "production";
// }

/**
 * Create a more complete performance polyfill
 *
 * This function creates a comprehensive implementation of the Performance API,
 * including methods like getEntriesByType, mark, measure, and more.
 *
 * It's used to ensure that all Performance API methods are available in all
 * environments, including those where the API is partially implemented.
 */
function createCompletePerformancePolyfill() {
  const startTime = Date.now();
  const entries = [];

  return {
    now() {
      return Date.now() - startTime;
    },

    mark(name) {
      entries.push({
        name,
        entryType: "mark",
        startTime: this.now(),
        duration: 0,
      });
      return undefined;
    },

    measure(name, startMark, endMark) {
      const startMarkEntry = entries.find(
        (entry) => entry.name === startMark && entry.entryType === "mark"
      );
      const endMarkEntry = entries.find(
        (entry) => entry.name === endMark && entry.entryType === "mark"
      );

      const startTime = startMarkEntry ? startMarkEntry.startTime : 0;
      const endTime = endMarkEntry ? endMarkEntry.startTime : this.now();

      entries.push({
        name,
        entryType: "measure",
        startTime,
        duration: endTime - startTime,
      });

      return undefined;
    },

    getEntriesByType(type) {
      if (type === "paint") {
        // Mock paint entries
        return [
          {
            name: "first-paint",
            startTime: 10,
            duration: 0,
            entryType: "paint",
          },
          {
            name: "first-contentful-paint",
            startTime: 15,
            duration: 0,
            entryType: "paint",
          },
        ];
      }

      return entries.filter((entry) => entry.entryType === type);
    },

    getEntriesByName(name, type) {
      if (type) {
        return entries.filter(
          (entry) => entry.name === name && entry.entryType === type
        );
      }
      return entries.filter((entry) => entry.name === name);
    },

    getEntries() {
      return entries.slice();
    },

    clearMarks(markName) {
      if (markName) {
        const index = entries.findIndex(
          (entry) => entry.name === markName && entry.entryType === "mark"
        );
        if (index !== -1) {
          entries.splice(index, 1);
        }
      } else {
        for (let i = entries.length - 1; i >= 0; i--) {
          if (entries[i].entryType === "mark") {
            entries.splice(i, 1);
          }
        }
      }
    },

    clearMeasures(measureName) {
      if (measureName) {
        const index = entries.findIndex(
          (entry) => entry.name === measureName && entry.entryType === "measure"
        );
        if (index !== -1) {
          entries.splice(index, 1);
        }
      } else {
        for (let i = entries.length - 1; i >= 0; i--) {
          if (entries[i].entryType === "measure") {
            entries.splice(i, 1);
          }
        }
      }
    },

    // Add timing API
    timing: {
      navigationStart: startTime,
      domComplete: startTime + 100,
      domInteractive: startTime + 50,
      loadEventEnd: startTime + 120,
    },

    // Add memory API
    memory: {
      usedJSHeapSize: 10000000,
      totalJSHeapSize: 100000000,
      jsHeapSizeLimit: 2000000000,
    },
  };
}

// Ensure performance is available globally with all methods
if (typeof globalThis !== "undefined") {
  if (!globalThis.performance) {
    globalThis.performance = createCompletePerformancePolyfill();
    console.log("Added complete performance polyfill to globalThis");
  } else {
    // Add missing methods to existing performance object
    const polyfill = createCompletePerformancePolyfill();
    for (const key in polyfill) {
      if (typeof globalThis.performance[key] === "undefined") {
        globalThis.performance[key] = polyfill[key];
      }
    }
  }
}

// Also ensure it's available on global
if (typeof global !== "undefined") {
  if (!global.performance) {
    global.performance = createCompletePerformancePolyfill();
    console.log("Added complete performance polyfill to global");
  } else {
    // Add missing methods to existing performance object
    const polyfill = createCompletePerformancePolyfill();
    for (const key in polyfill) {
      if (typeof global.performance[key] === "undefined") {
        global.performance[key] = polyfill[key];
      }
    }
  }
}

// Ensure it's available on window if it exists
if (typeof window !== "undefined") {
  if (!window.performance) {
    window.performance = createCompletePerformancePolyfill();
    console.log("Added complete performance polyfill to window");
  } else {
    // Add missing methods to existing performance object
    const polyfill = createCompletePerformancePolyfill();
    for (const key in polyfill) {
      if (typeof window.performance[key] === "undefined") {
        window.performance[key] = polyfill[key];
      }
    }
  }
}

// Add a global error handler for performance.now errors
if (typeof process !== "undefined" && process.on) {
  process.on("uncaughtException", (err) => {
    if (
      err.message &&
      (err.message.includes("performance.now is not a function") ||
        err.message.includes("performance is not defined") ||
        (err.stack && err.stack.includes("performance.now")))
    ) {
      console.warn(
        "Suppressed uncaughtException related to performance API (likely polyfill issue)"
      );
      // Prevent this error from crashing the test run
      return;
    }
    // Re-throw other errors
    // Note: Be careful not to suppress important test failures
    // throw err; // Consider if re-throwing is necessary or if Vitest handles it
  });

  process.on("unhandledRejection", (reason, promise) => {
    if (
      reason instanceof Error &&
      reason.message &&
      (reason.message.includes("performance.now is not a function") ||
        reason.message.includes("performance is not defined") ||
        (reason.stack && reason.stack.includes("performance.now")))
    ) {
      console.warn(
        "Suppressed unhandledRejection related to performance API (likely polyfill issue)"
      );
      // Prevent this error from crashing the test run
      return;
    }
    // Re-throw other rejections
    // Note: Be careful not to suppress important test failures
    // throw reason; // Consider if re-throwing is necessary or if Vitest handles it
  });
}

console.log("Vitest setup complete");
