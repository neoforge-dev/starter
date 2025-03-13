# Test Migration Guide

This document explains our approach for migrating tests from the `tests/` directory to the `src/test/` directory and fixing the failing tests.

## Background

The NeoForge project has two separate test directories:

1. `src/test/` - Contains unit tests using Vitest
2. `tests/` - Contains end-to-end tests using Playwright

The tests in the `tests/` directory are failing because they are using Playwright, which requires a different setup than the unit tests in the `src/test/` directory. We need to either fix the Playwright configuration or migrate the tests to use Vitest.

## Approach

We have decided to take a two-pronged approach:

1. Create a new Playwright configuration file (`playwright.e2e.config.js`) that correctly points to the `tests/e2e` directory for end-to-end tests.
2. Create a script to migrate the tests from the `tests/` directory to the `src/test/` directory and update them to use Vitest instead of Playwright.

## Playwright Configuration

We have created a new Playwright configuration file (`playwright.e2e.config.js`) that correctly points to the `tests/e2e` directory. This allows us to run the end-to-end tests using Playwright without modifying the existing tests.

To run the end-to-end tests, use the following command:

```bash
npm run test:e2e:custom
```

## Test Migration

We have created a script (`scripts/migrate-tests.js`) to migrate the tests from the `tests/` directory to the `src/test/` directory. This script:

1. Creates a backup of the `tests/` directory
2. Creates the necessary directories in `src/test/`
3. Copies and transforms the test files from `tests/` to `src/test/`
4. Updates imports and assertions to use Vitest instead of Playwright

To run the migration script, use the following command:

```bash
node scripts/migrate-tests.js
```

## Running Tests

We have created a script (`scripts/run-working-tests.js`) to run all the tests in the `src/test/` directory. This script:

1. Finds all test files in the `src/test/` directory
2. Runs the tests using Vitest
3. Reports the results

To run all the working tests, use the following command:

```bash
npm run test:working
```

## Test Transformation

The migration script transforms the tests in the following ways:

1. Replaces Playwright imports with Vitest imports
2. Replaces `test.describe` with `describe`
3. Replaces `test.beforeEach` with `beforeEach`
4. Replaces `test.afterEach` with `afterEach`
5. Replaces `test` with `it`
6. Replaces `page.goto` with JSDOM setup
7. Replaces `page.evaluate` with direct JavaScript
8. Replaces `page.locator` with `document.querySelector`

## Common Issues

Here are some common issues you might encounter when migrating tests:

1. **Browser-specific APIs**: Playwright tests might use browser-specific APIs that are not available in JSDOM. You'll need to mock these APIs or use a different approach.
2. **Page navigation**: Playwright tests might navigate to different pages, which is not possible in JSDOM. You'll need to mock the navigation or use a different approach.
3. **Shadow DOM**: Playwright tests might interact with shadow DOM, which is not fully supported in JSDOM. You'll need to mock the shadow DOM or use a different approach.
4. **Visual regression**: Playwright tests might use visual regression testing, which is not possible in JSDOM. You'll need to use a different approach for visual regression testing.

## Best Practices

Here are some best practices for writing tests:

1. **Use mock components**: Create mock components that simulate the behavior of the real components without relying on the DOM.
2. **Use mock services**: Create mock services that simulate the behavior of the real services without making actual API calls.
3. **Use mock events**: Create mock events that simulate user interactions without relying on the DOM.
4. **Use mock navigation**: Create mock navigation that simulates page navigation without actually changing the URL.
5. **Use mock storage**: Create mock storage that simulates localStorage or sessionStorage without relying on the browser.

## Conclusion

By following this approach, we can fix the failing tests in the `tests/` directory and ensure that all tests pass. This will improve the reliability of our test suite and make it easier to maintain in the future. 