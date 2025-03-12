/**
 * Direct patch for Vitest worker.js
 *
 * This patch directly targets the Vitest worker.js file to ensure that performance.now is available.
 * It uses a more aggressive approach by directly patching the module system.
 */

// Create a robust performance polyfill
const createPerformancePolyfill = () => {
  const startTime = Date.now();

  return {
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
};

// Apply the performance polyfill to the global object
const applyPerformancePolyfill = (globalObj) => {
  if (
    !globalObj.performance ||
    typeof globalObj.performance.now !== "function"
  ) {
    globalObj.performance = createPerformancePolyfill();
    console.log("Performance polyfill applied to global object");
  }
};

// Apply to all possible global objects
const globalObjects = [
  typeof globalThis !== "undefined" ? globalThis : null,
  typeof global !== "undefined" ? global : null,
  typeof self !== "undefined" ? self : null,
  typeof window !== "undefined" ? window : null,
];

globalObjects.forEach((obj) => {
  if (obj) applyPerformancePolyfill(obj);
});

// Patch the require function to intercept the Vitest worker module
const originalRequire = module.require;
module.require = function patchedRequire(id) {
  const result = originalRequire.apply(this, arguments);

  // Target the Vitest worker module
  if (id.includes("vitest/dist/worker") || id === "vitest/dist/worker.js") {
    console.log(`Patching Vitest worker module: ${id}`);

    // Ensure the module has a performance object with a now function
    if (!result.performance || typeof result.performance.now !== "function") {
      result.performance = createPerformancePolyfill();
      console.log("Performance polyfill applied to Vitest worker module");
    }

    // Patch the run function if it exists and uses performance.now
    if (result.run) {
      const originalRun = result.run;
      result.run = function patchedRun() {
        // Ensure performance is available in this context
        if (
          !global.performance ||
          typeof global.performance.now !== "function"
        ) {
          global.performance = createPerformancePolyfill();
          console.log("Performance polyfill applied in run function context");
        }

        try {
          return originalRun.apply(this, arguments);
        } catch (error) {
          if (
            error.message &&
            error.message.includes("performance.now is not a function")
          ) {
            console.error(
              "Caught performance.now error, applying polyfill and retrying"
            );
            global.performance = createPerformancePolyfill();
            return originalRun.apply(this, arguments);
          }
          throw error;
        }
      };
      console.log("Patched Vitest worker run function");
    }
  }

  // Target the Tinypool process module
  if (
    id.includes("tinypool/dist/esm/entry/process") ||
    id === "tinypool/dist/esm/entry/process.js"
  ) {
    console.log(`Patching Tinypool process module: ${id}`);

    // Ensure the module has a performance object with a now function
    if (!result.performance || typeof result.performance.now !== "function") {
      result.performance = createPerformancePolyfill();
      console.log("Performance polyfill applied to Tinypool process module");
    }

    // Patch the onMessage function if it exists
    if (result.onMessage) {
      const originalOnMessage = result.onMessage;
      result.onMessage = function patchedOnMessage() {
        // Ensure performance is available in this context
        if (
          !global.performance ||
          typeof global.performance.now !== "function"
        ) {
          global.performance = createPerformancePolyfill();
          console.log(
            "Performance polyfill applied in onMessage function context"
          );
        }

        try {
          return originalOnMessage.apply(this, arguments);
        } catch (error) {
          if (
            error.message &&
            error.message.includes("performance.now is not a function")
          ) {
            console.error(
              "Caught performance.now error, applying polyfill and retrying"
            );
            global.performance = createPerformancePolyfill();
            return originalOnMessage.apply(this, arguments);
          }
          throw error;
        }
      };
      console.log("Patched Tinypool process onMessage function");
    }
  }

  return result;
};

// Add a global error handler to catch any performance.now errors
process.on("uncaughtException", (error) => {
  if (
    error.message &&
    error.message.includes("performance.now is not a function")
  ) {
    console.error("Caught uncaught performance.now error, applying polyfill");

    // Apply the polyfill to all global objects again
    globalObjects.forEach((obj) => {
      if (obj) applyPerformancePolyfill(obj);
    });

    // Don't rethrow the error since we've handled it
    return;
  }

  // For other errors, rethrow
  throw error;
});

console.log("Direct Vitest worker patch installed");

// Export the polyfill functions for use elsewhere
module.exports = {
  createPerformancePolyfill,
  applyPerformancePolyfill,
};
