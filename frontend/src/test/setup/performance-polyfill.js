/**
 * Performance API polyfill for JSDOM environment
 *
 * This file provides a basic polyfill for the performance.now() method
 * which is not available in the JSDOM environment used by Vitest.
 */

// Only add the polyfill if performance.now is not already defined
if (!global.performance || typeof global.performance.now !== "function") {
  const startTime = Date.now();

  // Create a simple performance object with a now method
  global.performance = {
    ...(global.performance || {}),
    now: () => {
      return Date.now() - startTime;
    },
    mark: () => {},
    measure: () => {},
    getEntriesByName: () => [],
    getEntriesByType: () => [],
    clearMarks: () => {},
    clearMeasures: () => {},
  };

  console.log("Performance API polyfill installed for JSDOM environment");
}
