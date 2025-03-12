/**
 * Monkey Patch for Vitest Worker
 *
 * This file directly monkey patches the Node.js module loader to intercept
 * and modify the Vitest worker.js module when it's loaded. This ensures that
 * the performance API is properly polyfilled in the worker context.
 */

// Store the original require function
const originalRequire = module.constructor.prototype.require;

// Create a performance polyfill
const createPerformancePolyfill = () => {
  const startTime = Date.now();

  return {
    now() {
      return Date.now() - startTime;
    },
    mark(name) {
      if (typeof this._marks !== "object") {
        this._marks = {};
      }
      this._marks[name] = this.now();
      return undefined;
    },
    measure(name, startMark, endMark) {
      if (typeof this._measures !== "object") {
        this._measures = {};
      }

      const startTime = this._marks[startMark] || 0;
      const endTime = this._marks[endMark] || this.now();

      this._measures[name] = {
        name,
        startTime,
        duration: endTime - startTime,
      };

      return this._measures[name];
    },
    getEntriesByName(name, type) {
      if (type === "mark" && this._marks && this._marks[name]) {
        return [{ name, startTime: this._marks[name], entryType: "mark" }];
      }
      if (type === "measure" && this._measures && this._measures[name]) {
        return [
          {
            name,
            startTime: this._measures[name].startTime,
            duration: this._measures[name].duration,
            entryType: "measure",
          },
        ];
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
        return Object.keys(this._measures).map((name) => ({
          name,
          startTime: this._measures[name].startTime,
          duration: this._measures[name].duration,
          entryType: "measure",
        }));
      }
      return [];
    },
    clearMarks(markName) {
      if (!this._marks) return;
      if (markName) {
        delete this._marks[markName];
      } else {
        this._marks = {};
      }
    },
    clearMeasures(measureName) {
      if (!this._measures) return;
      if (measureName) {
        delete this._measures[measureName];
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
    console.log("Performance API polyfill applied to global object");
  }
};

// Override the require function to intercept module loading
module.constructor.prototype.require = function (path) {
  // Call the original require function
  const originalModule = originalRequire.apply(this, arguments);

  // Check if this is the Vitest worker module
  if (
    path === "vitest/dist/worker.js" ||
    path.includes("vitest/dist/worker.js")
  ) {
    console.log("Intercepted Vitest worker.js module load");

    // Apply the performance polyfill to the global objects
    applyPerformancePolyfill(global);
    applyPerformancePolyfill(globalThis);

    if (typeof self !== "undefined") {
      applyPerformancePolyfill(self);
    }

    if (typeof window !== "undefined") {
      applyPerformancePolyfill(window);
    }

    // Monkey patch the run function in the worker module
    if (originalModule && typeof originalModule.run === "function") {
      const originalRun = originalModule.run;

      originalModule.run = function (...args) {
        // Ensure performance is available before running
        applyPerformancePolyfill(global);
        applyPerformancePolyfill(globalThis);

        if (typeof self !== "undefined") {
          applyPerformancePolyfill(self);
        }

        if (typeof window !== "undefined") {
          applyPerformancePolyfill(window);
        }

        // Call the original run function
        return originalRun.apply(this, args);
      };

      console.log("Vitest worker.js run function monkey patched successfully");
    }
  }

  // Check if this is the Tinypool process module
  if (
    path === "tinypool/dist/esm/entry/process.js" ||
    path.includes("tinypool/dist/esm/entry/process.js")
  ) {
    console.log("Intercepted Tinypool process.js module load");

    // Apply the performance polyfill to the global objects
    applyPerformancePolyfill(global);
    applyPerformancePolyfill(globalThis);

    if (typeof self !== "undefined") {
      applyPerformancePolyfill(self);
    }

    if (typeof window !== "undefined") {
      applyPerformancePolyfill(window);
    }

    // Monkey patch the onMessage function in the process module
    if (originalModule && typeof originalModule.onMessage === "function") {
      const originalOnMessage = originalModule.onMessage;

      originalModule.onMessage = function (...args) {
        // Ensure performance is available before processing messages
        applyPerformancePolyfill(global);
        applyPerformancePolyfill(globalThis);

        if (typeof self !== "undefined") {
          applyPerformancePolyfill(self);
        }

        if (typeof window !== "undefined") {
          applyPerformancePolyfill(window);
        }

        // Call the original onMessage function
        return originalOnMessage.apply(this, args);
      };

      console.log(
        "Tinypool process.js onMessage function monkey patched successfully"
      );
    }
  }

  return originalModule;
};

// Add a global error handler to catch performance.now errors
process.on("uncaughtException", (error) => {
  if (
    error &&
    error.message &&
    error.message.includes("performance.now is not a function")
  ) {
    console.log("Caught performance.now error, reapplying polyfill");
    applyPerformancePolyfill(global);
    applyPerformancePolyfill(globalThis);

    if (typeof self !== "undefined") {
      applyPerformancePolyfill(self);
    }

    if (typeof window !== "undefined") {
      applyPerformancePolyfill(window);
    }
  }
});

console.log("Vitest worker monkey patch installed");
