/**
 * Patch Vitest Worker
 *
 * This file patches the Vitest worker.js file to ensure performance.now is available.
 * It uses module interception to apply the performance polyfill directly to the worker module.
 */

// Create a module interception function
function patchVitestWorker() {
  try {
    // Get the Module constructor
    const Module = require("module");
    const originalRequire = Module.prototype.require;

    // Override the require function to intercept specific modules
    Module.prototype.require = function (path) {
      // Get the original module
      const originalModule = originalRequire.apply(this, arguments);

      // Check if this is the Vitest worker module
      if (
        path.includes("vitest/dist/worker") ||
        path.includes("tinypool/dist/esm/entry/process")
      ) {
        console.log(`Patching module: ${path}`);

        // Create a performance polyfill
        const startTime = Date.now();
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
          timeOrigin: startTime,
        };

        // Apply the polyfill to the module's global object
        if (!originalModule.performance) {
          originalModule.performance = performancePolyfill;
        } else if (typeof originalModule.performance.now !== "function") {
          Object.assign(originalModule.performance, performancePolyfill);
        }

        // Apply to global objects
        if (
          typeof global !== "undefined" &&
          (!global.performance || typeof global.performance.now !== "function")
        ) {
          global.performance = performancePolyfill;
        }

        if (
          typeof globalThis !== "undefined" &&
          (!globalThis.performance ||
            typeof globalThis.performance.now !== "function")
        ) {
          globalThis.performance = performancePolyfill;
        }

        console.log(`Performance polyfill applied to module: ${path}`);
      }

      return originalModule;
    };

    console.log("Vitest worker patch installed");
    return true;
  } catch (error) {
    console.error("Failed to patch Vitest worker:", error);
    return false;
  }
}

// Apply the patch immediately
patchVitestWorker();

// Export the patch function for reuse
module.exports = patchVitestWorker;
