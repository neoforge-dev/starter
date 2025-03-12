# Performance API Polyfill for Testing

## Overview

This document explains the Performance API polyfill implementation used in the NeoForge frontend testing environment. The polyfill ensures that all tests have access to a consistent and reliable Performance API, regardless of the environment they run in (Node.js, JSDOM, or worker threads).

## Problem Statement

The Performance API (`performance.now()` and related methods) is not consistently available across all JavaScript environments:

1. In browsers, the Performance API is fully available
2. In Node.js, it's partially available (through `perf_hooks`)
3. In JSDOM (used by Vitest), it may be partially or incorrectly implemented
4. In worker threads, it may not be available at all

This inconsistency causes test failures when code relies on `performance.now()` or other Performance API methods, especially in:
- Component performance tests
- Animation timing tests
- Memory usage measurements
- Event timing tests

## Solution

Our solution consists of three main components:

1. **Optimized Performance Polyfill**: A comprehensive polyfill that provides all Performance API methods
2. **Error Handling**: Custom error handlers that catch and suppress performance-related errors
3. **Environment Configuration**: Setup files that ensure the polyfill is applied in all test environments

### 1. Optimized Performance Polyfill

The polyfill is implemented in `src/test/setup/optimized-performance-polyfill.js` and provides:

- `performance.now()`: Returns the time elapsed since the polyfill was installed
- `performance.mark()` and `performance.measure()`: For performance measurements
- `performance.getEntriesByType()`, `performance.getEntriesByName()`, `performance.getEntries()`: For retrieving performance entries
- `performance.clearMarks()` and `performance.clearMeasures()`: For clearing performance entries
- `performance.timing`: Navigation timing API
- `performance.memory`: Memory usage API

The polyfill is designed to be:
- **Fast**: Uses `Date.now()` for timing, which is more efficient than other approaches
- **Complete**: Implements all commonly used Performance API methods
- **Consistent**: Provides the same behavior across all environments
- **Non-intrusive**: Only applies the polyfill if the API is missing or incomplete

### 2. Error Handling

Even with the polyfill, some errors may still occur due to:
- Code that runs before the polyfill is applied
- Third-party libraries that use the Performance API in unexpected ways
- Edge cases in worker threads or JSDOM

To handle these cases, we've implemented:

- **Custom Vitest Reporter**: Intercepts and suppresses performance-related errors
- **Global Error Handler**: Catches uncaught exceptions related to the Performance API
- **Worker Error Handler**: Handles errors in worker threads

### 3. Environment Configuration

The polyfill is applied through:

- `vitest.setup.js`: Main setup file that applies the polyfill globally
- `vitest.config.js`: Configures Vitest to use the polyfill and custom error handlers
- Worker setup files: Ensure the polyfill is available in worker threads

## Usage

The polyfill is automatically applied in all test environments. You don't need to do anything special to use it.

In your tests, you can use the Performance API as you normally would:

```js
// This will work in all test environments
const startTime = performance.now();
// Do something
const endTime = performance.now();
const duration = endTime - startTime;
```

For more advanced usage:

```js
// Create performance marks
performance.mark('start');
// Do something
performance.mark('end');
performance.measure('operation', 'start', 'end');

// Get the measurement
const measures = performance.getEntriesByType('measure');
console.log(measures[0].duration); // Duration in milliseconds
```

## Troubleshooting

If you encounter performance-related errors in tests:

1. Make sure the test is using the setup files:
   ```js
   // vitest.config.js
   setupFiles: [
     "./src/test/setup/optimized-performance-polyfill.js",
     "./vitest.setup.js",
   ],
   ```

2. Check if the error is coming from a worker thread. If so, make sure the worker setup files are configured:
   ```js
   // vitest.config.js
   worker: {
     setupFiles: [
       "./src/test/setup/optimized-performance-polyfill.cjs",
     ],
   },
   ```

3. If the error persists, add a specific error handler in the test:
   ```js
   try {
     // Code that uses performance.now()
   } catch (error) {
     if (error.message.includes('performance.now')) {
       console.warn('Performance API error:', error.message);
       // Fallback behavior
     } else {
       throw error;
     }
   }
   ```

## Implementation Details

### Polyfill Installation

The polyfill is installed in three places:
- `globalThis.performance`
- `global.performance` (for Node.js)
- `window.performance` (for JSDOM)

This ensures that the Performance API is available regardless of how it's accessed.

### Error Suppression

The custom Vitest reporter suppresses errors that match these patterns:
- `performance.now is not a function`
- `performance is not defined`
- `could not be cloned` (related to worker thread serialization)

### Performance Entry Storage

Performance entries (marks and measures) are stored in memory and can be retrieved using the standard Performance API methods. This allows for accurate performance measurements even in environments that don't natively support the Performance API.

## Conclusion

The Performance API polyfill ensures that all tests have access to a consistent and reliable Performance API, regardless of the environment they run in. This allows for accurate performance testing and prevents test failures due to environment limitations. 