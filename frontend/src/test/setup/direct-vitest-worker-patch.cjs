/**
 * Direct Vitest Worker Patch (CommonJS version)
 *
 * This file directly patches the Vitest worker.js file to ensure the performance API
 * is available in all contexts. It uses a monkey patching approach to intercept
 * the worker module and apply the performance polyfill.
 */

// Create a performance polyfill
const createPerformancePolyfill = () => {
  const startTime = Date.now();

  return {
    now() {
      return Date.now() - startTime;
    },
    mark(name) {
      if (typeof this._marks !== 'object') {
        this._marks = {};
      }
      this._marks[name] = this.now();
      return undefined;
    },
    measure(name, startMark, endMark) {
      if (typeof this._measures !== 'object') {
        this._measures = {};
      }

      const startTime = this._marks[startMark] || 0;
      const endTime = this._marks[endMark] || this.now();

      this._measures[name] = {
        name,
        startTime,
        duration: endTime - startTime
      };

      return this._measures[name];
    },
    getEntriesByName(name, type) {
      if (type === 'mark' && this._marks && this._marks[name]) {
        return [{ name, startTime: this._marks[name], entryType: 'mark' }];
      }
      if (type === 'measure' && this._measures && this._measures[name]) {
        return [{
          name,
          startTime: this._measures[name].startTime,
          duration: this._measures[name].duration,
          entryType: 'measure'
        }];
      }
      return [];
    },
    getEntriesByType(type) {
      if (type === 'mark' && this._marks) {
        return Object.keys(this._marks).map(name => ({
          name,
          startTime: this._marks[name],
          entryType: 'mark'
        }));
      }
      if (type === 'measure' && this._measures) {
        return Object.keys(this._measures).map(name => ({
          name,
          startTime: this._measures[name].startTime,
          duration: this._measures[name].duration,
          entryType: 'measure'
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
    }
  };
};

// Apply the performance polyfill to the global object
const applyPerformancePolyfill = (globalObj) => {
  if (!globalObj.performance || typeof globalObj.performance.now !== 'function') {
    globalObj.performance = createPerformancePolyfill();
    console.log('Performance API polyfill applied to global object');
  }
};

// Directly patch the Vitest worker.js file
const patchVitestWorker = () => {
  try {
    // Apply the performance polyfill to the global objects
    applyPerformancePolyfill(global);
    applyPerformancePolyfill(globalThis);

    if (typeof self !== 'undefined') {
      applyPerformancePolyfill(self);
    }

    if (typeof window !== 'undefined') {
      applyPerformancePolyfill(window);
    }

    // Get the path to the Vitest worker.js file
    let vitestWorkerPath;
    try {
      vitestWorkerPath = require.resolve('vitest/dist/worker.js');
    } catch (resolveError) {
      console.log('Could not resolve Vitest worker path:', resolveError.message);

      // Try an alternative approach to find the worker file
      try {
        const vitestPath = require.resolve('vitest');
        vitestWorkerPath = vitestPath.replace(/index\.js$/, 'dist/worker.js');
      } catch (altError) {
        console.log('Alternative approach failed:', altError.message);
      }
    }

    if (!vitestWorkerPath) {
      console.log('Could not find Vitest worker path, applying global polyfill only');
      return false;
    }

    // Get the original module
    const originalModule = require(vitestWorkerPath);

    // Monkey patch the run function in the worker module
    if (originalModule && typeof originalModule.run === 'function') {
      const originalRun = originalModule.run;

      originalModule.run = function(...args) {
        // Ensure performance is available before running
        applyPerformancePolyfill(global);
        applyPerformancePolyfill(globalThis);

        if (typeof self !== 'undefined') {
          applyPerformancePolyfill(self);
        }

        if (typeof window !== 'undefined') {
          applyPerformancePolyfill(window);
        }

        // Call the original run function
        return originalRun.apply(this, args);
      };

      console.log('Vitest worker.js run function patched successfully');
    } else {
      console.log('Could not find run function in Vitest worker module');
    }

    // Also patch the Tinypool process.js file
    try {
      let tinypoolProcessPath;
      try {
        tinypoolProcessPath = require.resolve('tinypool/dist/esm/entry/process.js');
      } catch (resolveError) {
        console.log('Could not resolve Tinypool process path:', resolveError.message);

        // Try an alternative approach
        try {
          const tinypoolPath = require.resolve('tinypool');
          tinypoolProcessPath = tinypoolPath.replace(/index\.js$/, 'dist/esm/entry/process.js');
        } catch (altError) {
          console.log('Alternative approach for Tinypool failed:', altError.message);
        }
      }

      if (!tinypoolProcessPath) {
        console.log('Could not find Tinypool process path');
        return true; // Continue with just the Vitest worker patch
      }

      const tinypoolProcess = require(tinypoolProcessPath);

      if (tinypoolProcess && typeof tinypoolProcess.onMessage === 'function') {
        const originalOnMessage = tinypoolProcess.onMessage;

        tinypoolProcess.onMessage = function(...args) {
          // Ensure performance is available before processing messages
          applyPerformancePolyfill(global);
          applyPerformancePolyfill(globalThis);

          if (typeof self !== 'undefined') {
            applyPerformancePolyfill(self);
          }

          if (typeof window !== 'undefined') {
            applyPerformancePolyfill(window);
          }

          // Call the original onMessage function
          return originalOnMessage.apply(this, args);
        };

        console.log('Tinypool process.js onMessage function patched successfully');
      } else {
        console.log('Could not find onMessage function in Tinypool process module');
      }
    } catch (tinypoolError) {
      console.log('Error patching Tinypool process.js:', tinypoolError.message);
    }

    console.log('Direct Vitest worker patch applied successfully (CommonJS version)');
    return true;
  } catch (error) {
    console.error('Error applying direct Vitest worker patch:', error.message);
    return false;
  }
};

// Add a global error handler to catch performance.now errors
process.on('uncaughtException', (error) => {
  if (error && error.message && error.message.includes('performance.now is not a function')) {
    console.log('Caught performance.now error, reapplying polyfill');
    applyPerformancePolyfill(global);
    applyPerformancePolyfill(globalThis);

    if (typeof self !== 'undefined') {
      applyPerformancePolyfill(self);
    }

    if (typeof window !== 'undefined') {
      applyPerformancePolyfill(window);
    }
  }
});

// Apply the patch immediately
patchVitestWorker();

// Export the patch function
module.exports = patchVitestWorker;
