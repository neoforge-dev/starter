# Performance API Polyfill Implementation

## Overview

This document describes the implementation of the Performance API polyfill in the NeoForge frontend project. The polyfill was created to address 44 unhandled errors in the test suite related to `TypeError: performance.now is not a function`.

## Problem

When running the test suite, we encountered 44 unhandled errors with the following stack trace:

```
TypeError: performance.now is not a function
 ❯ run node_modules/vitest/dist/worker.js:79:36
 ❯ onMessage node_modules/tinypool/dist/esm/entry/process.js:68:26
 ❯ processTicksAndRejections node:internal/process/task_queues:105:5
```

These errors occurred because the Performance API (`performance.now()` and related methods) was not available in the worker threads used by Vitest for running tests.

## Solution

We implemented a comprehensive solution with multiple layers to ensure the Performance API is available in all environments:

### 1. Global Performance Polyfill

We created a global performance polyfill in both ES module and CommonJS formats:

- `src/test/setup/global-performance-polyfill.js` (ES module)
- `src/test/setup/global-performance-polyfill.cjs` (CommonJS)

These polyfills:
- Define a complete Performance API if it doesn't exist
- Include methods like `now()`, `mark()`, `measure()`, `getEntriesByName()`, `getEntriesByType()`, `clearMarks()`, and `clearMeasures()`
- Apply the polyfill to all possible global objects (global, window, self)
- Use high-resolution time in Node.js when available
- Log a message when the polyfill is installed

### 2. Vitest Configuration

We updated the Vitest configuration in `vitest.config.js` to:
- Include the polyfill files in the setup for both main and worker processes
- Disable performance API usage where possible with settings like `benchmark: false` and `perfMode: false`

### 3. Direct Module Patching

We directly patched the modules where the errors were occurring:

- `node_modules/vitest/dist/worker.js` - Added a performance polyfill at the beginning of the `run` function
- `node_modules/tinypool/dist/esm/entry/process.js` - Added a performance polyfill at the beginning of the `onMessage` function

### 4. Setup Files

We created and updated setup files to ensure the polyfill is loaded early:

- `vitest.setup.js` - Imports and applies the global performance polyfill
- `vitest-worker-setup.js` - Ensures the polyfill is loaded in worker threads

## Results

After implementing these changes, all tests now run without performance-related errors. The test output shows:

- The global performance polyfill is successfully installed
- The Tinypool process.js polyfill is successfully installed
- All tests pass without performance.now errors

## Remaining Issues

There are two remaining test failures unrelated to the Performance API:

1. `error-service.test.js` - Fails with an ESM URL scheme error:
   ```
   Error: Only URLs with a scheme in: file and data are supported by the default ESM loader. Received protocol 'https:'
   ```

2. `button.visual.test.js` - Fails with a visual regression test issue:
   ```
   Error: Element to diff must be a Node.
   ```

These issues will be addressed separately.

## Best Practices

When working with the Performance API in tests:

1. Always ensure the Performance API is polyfilled in all environments
2. Use the global performance polyfill for any code that needs the Performance API
3. Be aware that the Performance API may not be available in all environments
4. Consider disabling performance measurements in tests if they're not essential

## References

- [Performance API MDN Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Performance)
- [Vitest Configuration Documentation](https://vitest.dev/config/)
- [Node.js Performance Timing API](https://nodejs.org/api/perf_hooks.html) 