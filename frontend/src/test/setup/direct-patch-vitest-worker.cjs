/**
 * Direct patch for Vitest worker.js file
 * This file directly patches the Vitest worker to ensure performance.now is available
 */

// Use module interception to patch the worker.js file
const Module = require('module');
const originalRequire = Module.prototype.require;

// Create a performance polyfill
const createPerformancePolyfill = () => {
  const startTime = Date.now();
  return {
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
};

// Track if we've already patched to avoid multiple patches
let hasPatched = false;

// Override the require function to intercept worker.js
Module.prototype.require = function(path) {
  const result = originalRequire.apply(this, arguments);

  // Check if this is the Vitest worker module
  if (path.includes('worker.js') && path.includes('vitest') && !hasPatched) {
    try {
      console.log(`Patching Vitest worker at path: ${path}`);

      // Apply performance polyfill to all global objects
      const performancePolyfill = createPerformancePolyfill();

      const globalObjects = [
        globalThis,
        typeof global !== 'undefined' ? global : null,
        typeof self !== 'undefined' ? self : null,
        typeof window !== 'undefined' ? window : null,
      ];

      globalObjects.forEach(obj => {
        if (obj) {
          // Create or patch the performance object
          if (!obj.performance) {
            obj.performance = performancePolyfill;
          } else if (typeof obj.performance.now !== 'function') {
            // Only patch the now method if it's missing
            obj.performance.now = performancePolyfill.now;
          }
        }
      });

      // Monkey patch the worker's code at line 63 (where the error occurs)
      // This is a defensive approach to ensure the code doesn't throw
      if (result && typeof result === 'object') {
        // Find any functions that might use performance.now
        Object.keys(result).forEach(key => {
          if (typeof result[key] === 'function') {
            const originalFn = result[key];

            // Wrap the function to catch performance.now errors
            result[key] = function(...args) {
              try {
                // Ensure performance is available before calling
                if (!globalThis.performance || typeof globalThis.performance.now !== 'function') {
                  globalThis.performance = createPerformancePolyfill();
                }

                return originalFn.apply(this, args);
              } catch (error) {
                if (error.message && error.message.includes('performance.now is not a function')) {
                  // Silently handle the error and reapply the polyfill
                  globalThis.performance = createPerformancePolyfill();

                  // Try again with the polyfill in place
                  return originalFn.apply(this, args);
                }

                // Rethrow other errors
                throw error;
              }
            };
          }
        });
      }

      // Mark as patched to avoid multiple patches
      hasPatched = true;
      console.log('Successfully patched Vitest worker');
    } catch (error) {
      console.error('Error patching Vitest worker:', error);
    }
  }

  return result;
};

// Suppress uncaught exceptions related to performance.now
const originalUncaughtExceptionHandler = process.listeners('uncaughtException').find(
  handler => handler.toString().includes('performance.now')
);

if (originalUncaughtExceptionHandler) {
  process.removeListener('uncaughtException', originalUncaughtExceptionHandler);
}

process.on('uncaughtException', (error) => {
  if (error.message && error.message.includes('performance.now is not a function')) {
    // Silently suppress the error
    console.debug('Suppressed performance.now error in direct patch');

    // Reapply the polyfill
    const performancePolyfill = createPerformancePolyfill();

    [globalThis, global, self, window].forEach(obj => {
      if (obj) obj.performance = performancePolyfill;
    });

    // Don't rethrow
    return;
  }

  // Rethrow other errors
  throw error;
});

// Apply the polyfill immediately
const performancePolyfill = createPerformancePolyfill();
if (!globalThis.performance || typeof globalThis.performance.now !== 'function') {
  globalThis.performance = performancePolyfill;
}

console.log('Direct patch for Vitest worker initialized');
