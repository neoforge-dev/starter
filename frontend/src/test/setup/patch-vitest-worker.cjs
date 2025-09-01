/**
 * This file patches the Vitest worker to ensure performance.now is available
 * It intercepts the worker module and applies the performance polyfill
 */

// Original module path that needs patching
const VITEST_WORKER_PATH = 'vitest/dist/worker.js';

// Store the original require function
const originalRequire = module.require;

// Create a performance polyfill
const createPerformancePolyfill = () => {
  const startTime = Date.now();
  return {
    now: () => Date.now() - startTime,
    mark: (name) => console.log(`Performance mark: ${name}`),
    measure: (name, startMark, endMark) => console.log(`Performance measure: ${name} from ${startMark} to ${endMark}`),
    getEntriesByName: () => [],
    getEntriesByType: () => [],
    clearMarks: () => {},
    clearMeasures: () => {},
    timeOrigin: startTime,
    timing: {
      navigationStart: startTime,
    },
  };
};

// Apply the performance polyfill to global objects
const applyPerformancePolyfill = (target) => {
  if (!target.performance || typeof target.performance.now !== 'function') {
    target.performance = createPerformancePolyfill();
    console.log('Performance polyfill applied to worker');
  }
};

// Override the require function to intercept the Vitest worker module
module.require = function(id) {
  const exports = originalRequire.apply(this, arguments);

  // If this is the Vitest worker module, patch it
  if (id === VITEST_WORKER_PATH || id.includes(VITEST_WORKER_PATH)) {
    console.log('Intercepted Vitest worker module, applying performance polyfill');

    // Apply the polyfill to global objects
    if (typeof global !== 'undefined') applyPerformancePolyfill(global);
    if (typeof globalThis !== 'undefined') applyPerformancePolyfill(globalThis);
    if (typeof self !== 'undefined') applyPerformancePolyfill(self);

    // Add a global error handler to catch any issues with performance.now
    if (typeof process !== 'undefined') {
      process.on('uncaughtException', (err) => {
        if (err.message && err.message.includes('performance.now is not a function')) {
          console.error('Caught performance.now error, reapplying polyfill');
          if (typeof global !== 'undefined') applyPerformancePolyfill(global);
          if (typeof globalThis !== 'undefined') applyPerformancePolyfill(globalThis);
          if (typeof self !== 'undefined') applyPerformancePolyfill(self);
        }
      });
    }
  }

  return exports;
};

// Export a function to verify the patch is working
function verifyPatch() {
  try {
    if (typeof performance === 'undefined' || typeof performance.now !== 'function') {
      console.log('Performance API not available, applying polyfill');
      if (typeof global !== 'undefined') applyPerformancePolyfill(global);
      if (typeof globalThis !== 'undefined') applyPerformancePolyfill(globalThis);
      if (typeof self !== 'undefined') applyPerformancePolyfill(self);
    } else {
      console.log('Performance API is available');
    }

    // Test if performance.now works
    const time = performance.now();
    console.log(`Performance.now() = ${time}`);
    return true;
  } catch (error) {
    console.error('Error verifying patch:', error);
    return false;
  }
}

// Apply the polyfill immediately
if (typeof global !== 'undefined') applyPerformancePolyfill(global);
if (typeof globalThis !== 'undefined') applyPerformancePolyfill(globalThis);
if (typeof self !== 'undefined') applyPerformancePolyfill(self);

console.log('Vitest worker patch installed (CommonJS version)');

module.exports = {
  verifyPatch,
  applyPerformancePolyfill
};
