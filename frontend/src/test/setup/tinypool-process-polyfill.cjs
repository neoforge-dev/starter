/**
 * This file patches the Tinypool process.js file to ensure performance.now is available
 * in worker threads before they start executing.
 */

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
    console.log('Performance polyfill applied to Tinypool process');
  }
};

// Store the original require function
const originalRequire = module.require;

// Override the require function to intercept the Tinypool process module
module.require = function(id) {
  const exports = originalRequire.apply(this, arguments);
  
  // If this is the Tinypool process module, patch it
  if (id.includes('tinypool/dist') && id.includes('process')) {
    console.log('Intercepted Tinypool process module, applying performance polyfill');
    
    // Apply the polyfill to global objects
    if (typeof global !== 'undefined') applyPerformancePolyfill(global);
    if (typeof globalThis !== 'undefined') applyPerformancePolyfill(globalThis);
    if (typeof self !== 'undefined') applyPerformancePolyfill(self);
    
    // Monkey patch the onMessage function to ensure performance is available
    const originalOnMessage = exports.onMessage;
    if (originalOnMessage) {
      exports.onMessage = function(message) {
        // Apply the polyfill before processing any message
        if (typeof global !== 'undefined') applyPerformancePolyfill(global);
        if (typeof globalThis !== 'undefined') applyPerformancePolyfill(globalThis);
        if (typeof self !== 'undefined') applyPerformancePolyfill(self);
        
        // Call the original onMessage function
        return originalOnMessage.apply(this, arguments);
      };
      console.log('Monkey patched Tinypool onMessage function');
    }
  }
  
  return exports;
};

// Apply the polyfill immediately
if (typeof global !== 'undefined') applyPerformancePolyfill(global);
if (typeof globalThis !== 'undefined') applyPerformancePolyfill(globalThis);
if (typeof self !== 'undefined') applyPerformancePolyfill(self);

// Add a global error handler to catch any issues with performance.now
if (typeof process !== 'undefined') {
  process.on('uncaughtException', (err) => {
    if (err.message && err.message.includes('performance.now is not a function')) {
      console.error('Caught performance.now error in Tinypool process, reapplying polyfill');
      if (typeof global !== 'undefined') applyPerformancePolyfill(global);
      if (typeof globalThis !== 'undefined') applyPerformancePolyfill(globalThis);
      if (typeof self !== 'undefined') applyPerformancePolyfill(self);
    }
  });
}

console.log('Tinypool process polyfill installed');

module.exports = {
  applyPerformancePolyfill
}; 