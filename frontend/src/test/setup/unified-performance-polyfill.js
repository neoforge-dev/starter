/**
 * Unified Performance API Polyfill
 *
 * A single, reliable implementation that works across all environments:
 * - Node.js (main thread and workers)
 * - JSDOM
 * - Browser
 * - Test environments
 *
 * Features:
 * - Single source of truth
 * - Reliable worker thread support
 * - Proper JSDOM integration
 * - Robust error handling
 * - Performance optimization
 */

// Use a shared timestamp for consistent time measurements
const START_TIME = Date.now();

// Track installation state
const INSTALLATION_STATE = {
  installed: false,
  environments: new Set(),
};

/**
 * Creates a minimal, efficient performance implementation
 */
function createPerformancePolyfill() {
  const marks = new Map();
  const measures = new Map();

  return {
    now() {
      return Date.now() - START_TIME;
    },

    mark(name) {
      if (!name) return;
      marks.set(name, this.now());
    },

    measure(name, startMark, endMark) {
      if (!name) return;
      const start = startMark ? marks.get(startMark) || 0 : 0;
      const end = endMark ? marks.get(endMark) : this.now();
      measures.set(name, {
        name,
        startTime: start,
        duration: end - start,
      });
    },

    getEntriesByName(name, type) {
      if (!name) return [];
      switch (type) {
        case "mark":
          return marks.has(name)
            ? [{ name, startTime: marks.get(name), entryType: "mark" }]
            : [];
        case "measure":
          return measures.has(name)
            ? [{ ...measures.get(name), entryType: "measure" }]
            : [];
        default:
          return [];
      }
    },

    getEntriesByType(type) {
      switch (type) {
        case "mark":
          return Array.from(marks.entries()).map(([name, time]) => ({
            name,
            startTime: time,
            entryType: "mark",
          }));
        case "measure":
          return Array.from(measures.values()).map((measure) => ({
            ...measure,
            entryType: "measure",
          }));
        default:
          return [];
      }
    },

    clearMarks(name) {
      name ? marks.delete(name) : marks.clear();
    },

    clearMeasures(name) {
      name ? measures.delete(name) : measures.clear();
    },

    toJSON() {
      return {
        marks: Array.from(marks.entries()),
        measures: Array.from(measures.entries()),
      };
    },
  };
}

/**
 * Safely applies the polyfill to a target object
 */
function applyToTarget(target, environment = "unknown") {
  if (!target) return false;

  // Skip if already properly polyfilled
  if (
    target.performance?.now &&
    typeof target.performance.now === "function" &&
    target.performance._isPolyfilled
  ) {
    return true;
  }

  const polyfill = createPerformancePolyfill();
  polyfill._isPolyfilled = true;

  try {
    if (!target.performance) {
      target.performance = polyfill;
    } else {
      Object.assign(target.performance, polyfill);
    }
    INSTALLATION_STATE.environments.add(environment);
    return true;
  } catch (err) {
    console.warn(
      `Failed to apply performance polyfill to ${environment}:`,
      err
    );
    return false;
  }
}

/**
 * Installs the polyfill across all relevant environments
 */
function installPolyfill(options = { silent: false }) {
  if (INSTALLATION_STATE.installed && !options.force) {
    return;
  }

  // List of all possible global objects and their environments
  const targets = [
    { obj: globalThis, env: "globalThis" },
    { obj: global, env: "global" },
    { obj: window, env: "window" },
    { obj: self, env: "self" },
  ].filter(({ obj }) => obj != null);

  // Apply to all available targets
  targets.forEach(({ obj, env }) => {
    applyToTarget(obj, env);
  });

  // Special handling for JSDOM
  if (
    typeof window !== "undefined" &&
    window?.navigator?.userAgent?.includes("jsdom")
  ) {
    try {
      const jsdom = require("jsdom");
      if (jsdom?.JSDOM) {
        // Patch JSDOM constructor
        const originalJSDOM = jsdom.JSDOM;
        jsdom.JSDOM = function (...args) {
          const dom = new originalJSDOM(...args);
          applyToTarget(dom.window, "jsdom-window");
          return dom;
        };
        Object.assign(jsdom.JSDOM, originalJSDOM);
        jsdom.JSDOM.prototype = originalJSDOM.prototype;
      }
    } catch (err) {
      // JSDOM not available, skip
    }
  }

  // Set up global error handler
  if (typeof window !== "undefined") {
    window.addEventListener("error", (event) => {
      if (event.error?.message?.includes("performance.now")) {
        event.preventDefault();
        // Reapply polyfill if needed
        installPolyfill({ force: true, silent: true });
      }
    });
  }

  if (!options.silent) {
    console.log(
      `Performance polyfill installed in environments: ${Array.from(INSTALLATION_STATE.environments).join(", ")}`
    );
  }

  INSTALLATION_STATE.installed = true;
}

// Auto-install on module load
installPolyfill();

// Export for ESM
export const performance = createPerformancePolyfill();
export { installPolyfill, createPerformancePolyfill };

// Export for CommonJS
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    performance,
    installPolyfill,
    createPerformancePolyfill,
  };
}
