# Frontend Testing Guide

## Overview

This document provides guidelines for writing and running tests for the NeoForge frontend components. It covers best practices, common patterns, and solutions to known issues.

## Test Types

- **Unit Tests**: Test individual components and services in isolation
- **Integration Tests**: Test interactions between components
- **Visual Regression Tests**: Ensure UI components maintain their appearance
- **Accessibility Tests**: Verify components meet accessibility standards
- **Performance Tests**: Measure component rendering and update performance

## Running Tests

### Basic Test Commands

```bash
# Run all tests
npm run test:unit

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests with UI
npm run test:ui
```

### Optimized Test Commands

We've added several commands to optimize test execution and troubleshooting:

```bash
# Run tests with fast failure detection
npm run test:fast

# Run only component tests
npm run test:component

# Run only service tests
npm run test:service

# Identify and fix deprecation warnings
npm run test:fix-deprecations
```

## Handling Deprecation Warnings

### Common Deprecation Warnings

1. **@open-wc/semantic-dom-diff**: Missing "main" or "exports" field in package.json
   - Fixed using patch-package

2. **Lit Dev Mode**: Warnings about Lit running in dev mode during tests
   - Configure Vitest to set NODE_ENV to "production"

### Fixing Deprecation Warnings

We use a custom script to identify and fix deprecation warnings:

```bash
# Run the deprecation fix tool
npm run test:fix-deprecations

# Run for a specific test file
npm run test:fix-deprecations src/test/components/badge.test.js
```

The tool will:
1. Run tests with deprecation tracing enabled
2. Collect and analyze deprecation warnings
3. Provide recommendations for fixing each warning

### Using patch-package

For third-party dependencies that need fixes:

1. Install patch-package: `npm install patch-package --save-dev`
2. Make changes to the node_modules files
3. Run `npx patch-package package-name` to create a patch
4. Patches are automatically applied during `npm install` via the postinstall script

## Testing Components with Animations

JSDOM doesn't support CSS animations or transitions. For components that use these features:

1. Mock the relevant browser APIs (matchMedia, etc.)
2. Manually trigger animation events (transitionend, animationend)
3. Use the waitForUpdate helper function to ensure component updates are complete

Example:

```javascript
// Manually trigger transition end
const triggerTransitionEnd = () => {
  const event = new Event('transitionend', {
    bubbles: true,
    cancelable: true
  });
  element.dispatchEvent(event);
  return new Promise(resolve => setTimeout(resolve, 10));
};

it('handles animation completion', async () => {
  // Trigger animation
  element.startAnimation();
  await element.updateComplete;
  
  // Manually trigger animation end
  await triggerTransitionEnd();
  
  // Check final state
  expect(element.animationComplete).to.be.true;
});
```

## Preventing Test Timeouts

To prevent tests from hanging:

1. Set appropriate timeouts in test configuration
2. Use the `--bail` option to stop on first failure
3. Limit the number of workers to avoid memory issues
4. Ensure all async operations are properly awaited
5. Clean up event listeners and timers after tests

## Best Practices

1. **Isolation**: Each test should be independent and not rely on the state of other tests
2. **Mocking**: Use mocks for external dependencies and browser APIs
3. **Cleanup**: Always clean up after tests to prevent memory leaks
4. **Assertions**: Make specific assertions rather than general ones
5. **Timeouts**: Avoid using setTimeout in tests when possible
6. **Event Handling**: Manually trigger events rather than waiting for them

## Known Issues and Workarounds

### JSDOM Limitations

- **CSS Variables**: JSDOM doesn't fully support CSS variables
  - Solution: Test style changes by directly checking element properties

- **Animations**: JSDOM doesn't support CSS animations or transitions
  - Solution: Manually trigger animation events

- **Layout**: JSDOM doesn't perform layout calculations
  - Solution: Mock getBoundingClientRect() for position-dependent tests

### Memory Issues

- **Worker Memory**: Tests may hit memory limits with many workers
  - Solution: Limit workers with `--maxWorkers=2` option

- **Memory Leaks**: Uncleaned resources can cause memory leaks
  - Solution: Use afterEach hooks to clean up resources 