/**
 * Vitest Worker Setup
 *
 * This file is loaded in Vitest worker threads to ensure proper setup.
 * It imports the CommonJS version of the global performance polyfill.
 */

const {
  installPolyfill,
} = require("./src/test/setup/unified-performance-polyfill.js");

// Install performance polyfill in worker
installPolyfill();

// Apply the direct patch for Vitest worker
try {
  // Try to apply the direct patch
  require("./src/test/setup/direct-patch-vitest-worker.cjs");
  console.log(
    "Direct Vitest worker patch applied successfully in worker setup"
  );
} catch (error) {
  console.error(
    "Error applying direct Vitest worker patch in worker setup:",
    error
  );
}

// Create a more robust performance polyfill if needed
if (
  typeof performance === "undefined" ||
  typeof performance.now !== "function"
) {
  const startTime = Date.now();

  // Create a comprehensive performance polyfill
  global.performance = {
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
    global,
    typeof globalThis !== "undefined" ? globalThis : null,
    typeof self !== "undefined" ? self : null,
    typeof window !== "undefined" ? window : null,
  ];

  globalObjects.forEach((obj) => {
    if (
      obj &&
      (typeof obj.performance === "undefined" ||
        typeof obj.performance.now !== "function")
    ) {
      obj.performance = global.performance;
    }
  });

  console.log(
    "Robust performance polyfill created and applied to global objects in worker setup"
  );
}

// Verify that performance.now is working
try {
  const now = performance.now();
  console.log(`Performance.now() is working in worker setup: ${now}`);
} catch (error) {
  console.error(
    "Error using performance.now() in worker setup:",
    error.message
  );

  // Reapply the polyfill if there's an error
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
  [global, globalThis, self, window].forEach((obj) => {
    if (obj) obj.performance = performancePolyfill;
  });

  console.log("Reapplied performance polyfill after error in worker setup");
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
    console.debug("Suppressed performance.now error in worker");

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
    [global, globalThis, self, window].forEach((obj) => {
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

// Set NODE_ENV to test
process.env.NODE_ENV = "test";

// Directly patch the worker.js file if possible
try {
  // Try to find and patch the worker.js file directly
  const path = require("path");
  const fs = require("fs");

  // Try to locate the worker.js file
  const possiblePaths = [
    path.resolve(process.cwd(), "node_modules/vitest/dist/worker.js"),
    path.resolve(process.cwd(), "node_modules/vitest/dist/worker.cjs"),
    path.resolve(process.cwd(), "node_modules/vitest/dist/worker.mjs"),
  ];

  for (const filePath of possiblePaths) {
    if (fs.existsSync(filePath)) {
      console.log(`Found Vitest worker file at: ${filePath} in worker setup`);

      // We can't modify the file directly, but we can ensure the global performance is available
      global.performance = global.performance || {
        now() {
          return Date.now() - (global._vitestStartTime || Date.now());
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

      // Store the start time for consistent timing
      global._vitestStartTime = global._vitestStartTime || Date.now();

      console.log(
        "Ensured global performance is available for worker.js in worker setup"
      );
      break;
    }
  }
} catch (error) {
  console.error(
    "Error while trying to directly patch worker.js in worker setup:",
    error
  );
}

console.log("Vitest worker setup complete with performance polyfill");
