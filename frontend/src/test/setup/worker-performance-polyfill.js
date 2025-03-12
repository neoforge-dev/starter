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
  // Check if performance is already defined and has a now method
  if (
    typeof performance === "undefined" ||
    typeof performance.now !== "function"
  ) {
    // Create a global performance object or enhance the existing one
    globalThis.performance = globalThis.performance || {};

    // Add the now method
    globalThis.performance.now = function () {
      return Date.now() - startTime;
    };

    // Add other Performance API methods that might be used
    globalThis.performance.mark = globalThis.performance.mark || function () {};
    globalThis.performance.measure =
      globalThis.performance.measure || function () {};
    globalThis.performance.getEntriesByName =
      globalThis.performance.getEntriesByName ||
      function () {
        return [];
      };
    globalThis.performance.getEntriesByType =
      globalThis.performance.getEntriesByType ||
      function () {
        return [];
      };
    globalThis.performance.clearMarks =
      globalThis.performance.clearMarks || function () {};
    globalThis.performance.clearMeasures =
      globalThis.performance.clearMeasures || function () {};

    console.log("Performance API polyfill installed in worker thread");
  }
}

// Run the setup immediately
setupPerformancePolyfill();

// Export the setup function for explicit use
export default setupPerformancePolyfill;

// Make sure the polyfill is applied to the global scope
if (typeof global !== "undefined") {
  global.performance = globalThis.performance;
}

// Also apply to self for web workers
if (typeof self !== "undefined") {
  self.performance = globalThis.performance;
}
