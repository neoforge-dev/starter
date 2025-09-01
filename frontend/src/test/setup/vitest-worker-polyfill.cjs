/**
 * Vitest Worker Performance Polyfill (CommonJS version)
 *
 * This file provides a robust performance polyfill for Vitest worker threads.
 * It ensures that the performance API is available in all contexts.
 */

// Create a performance polyfill that will be applied to the worker thread
function setupWorkerPerformancePolyfill() {
  // Only apply if performance is not defined or performance.now is not a function
  if (typeof performance === 'undefined' || typeof performance.now !== 'function') {
    const startTime = Date.now();

    // Create a comprehensive performance polyfill
    const performancePolyfill = {
      now() {
        return Date.now() - startTime;
      },
      mark() {},
      measure() {},
      getEntriesByName() { return []; },
      getEntriesByType() { return []; },
      clearMarks() {},
      clearMeasures() {},
      timeOrigin: startTime
    };

    // Apply the polyfill to all possible global objects
    if (typeof globalThis !== 'undefined') globalThis.performance = performancePolyfill;
    if (typeof global !== 'undefined') global.performance = performancePolyfill;
    if (typeof self !== 'undefined') self.performance = performancePolyfill;
    if (typeof window !== 'undefined') window.performance = performancePolyfill;

    // Directly assign to the performance variable if it exists in this scope
    try {
      performance = performancePolyfill; // eslint-disable-line no-global-assign
    } catch (e) {
      // Ignore assignment errors
    }

    console.log("Vitest worker performance polyfill installed (CJS)");
    return true;
  }

  return false;
}

// Apply the polyfill immediately
setupWorkerPerformancePolyfill();

// Add a global error handler to catch any issues with performance.now
if (typeof process !== 'undefined' && process.on) {
  process.on('uncaughtException', (error) => {
    if (error.message && error.message.includes('performance.now is not a function')) {
      console.error('Caught performance.now error in worker, reapplying polyfill');
      setupWorkerPerformancePolyfill();
    }
  });
}

// Export the setup function for reuse
module.exports = setupWorkerPerformancePolyfill;
