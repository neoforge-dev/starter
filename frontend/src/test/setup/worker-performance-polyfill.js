/**
 * Performance API polyfill for worker threads
 *
 * This file provides a robust polyfill for the Performance API in worker threads
 * where it might not be fully implemented or available.
 */

// Store the start time when this module is loaded
const startTime = Date.now();

// Define the performance polyfill
function setupPerformancePolyfill() {
  // List of all possible global objects in worker contexts
  const globals = [
    typeof globalThis !== "undefined" ? globalThis : null,
    typeof global !== "undefined" ? global : null,
    typeof self !== "undefined" ? self : null,
  ].filter(Boolean);

  // Create a performance object with all necessary methods
  const performancePolyfill = {
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
  };

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

  console.log("Performance API polyfill installed in worker thread");
}

// Run the setup immediately
setupPerformancePolyfill();

// Export the setup function for explicit use
export default setupPerformancePolyfill;

// Add a global error handler to catch any issues with performance.now
if (typeof process !== "undefined" && process.on) {
  process.on("uncaughtException", (err) => {
    if (
      err.message &&
      err.message.includes("performance.now is not a function")
    ) {
      console.warn(
        "Caught performance.now error in worker, reapplying polyfill"
      );
      setupPerformancePolyfill();
    }
  });
}

// Make sure the polyfill is applied to the global scope
if (typeof global !== "undefined") {
  if (!global.performance) {
    global.performance = globalThis.performance;
  } else if (typeof global.performance.now !== "function") {
    Object.assign(global.performance, globalThis.performance);
  }
}

// Also apply to self for web workers
if (typeof self !== "undefined") {
  if (!self.performance) {
    self.performance = globalThis.performance;
  } else if (typeof self.performance.now !== "function") {
    Object.assign(self.performance, globalThis.performance);
  }
}
