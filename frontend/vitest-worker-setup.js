/**
 * Vitest Worker Setup
 *
 * This file is loaded in Vitest worker threads to ensure proper setup.
 * It imports the CommonJS version of the global performance polyfill.
 */

// Use require to import the CommonJS version of the polyfill
// This ensures it's loaded before any other code runs in the worker
try {
  require("./src/test/setup/global-performance-polyfill.cjs");
  console.log("Vitest worker setup complete with global performance polyfill");
} catch (error) {
  console.error("Failed to load performance polyfill in worker:", error);
}

/**
 * Verify that the performance polyfill is working correctly
 */
function verifyPerformancePolyfill() {
  if (
    typeof performance === "undefined" ||
    typeof performance.now !== "function"
  ) {
    console.error(
      "Performance polyfill is not working correctly in worker thread!"
    );
    return false;
  }

  console.log("Performance polyfill verified in worker thread");
  return true;
}

// Run the verification
verifyPerformancePolyfill();

// Export the verification function for testing
module.exports = { verifyPerformancePolyfill };
