# NeoForge Frontend Testing Guide

This document provides comprehensive guidance on testing frontend components in the NeoForge project. It's designed to help developers of all experience levels understand our testing approach and best practices.

## Table of Contents

1. [Testing Philosophy](#testing-philosophy)
2. [Testing Setup](#testing-setup)
3. [Test Structure](#test-structure)
4. [Common Testing Patterns](#common-testing-patterns)
5. [Troubleshooting](#troubleshooting)
6. [Best Practices](#best-practices)

## Testing Philosophy

Our testing approach follows these principles:

- **Component isolation**: Test components in isolation to ensure they work independently
- **Behavior-driven**: Focus on testing behavior rather than implementation details
- **Accessibility**: Ensure components meet accessibility standards
- **Comprehensive coverage**: Test all critical user flows and edge cases

## Testing Setup

### Tools and Libraries

- **Vitest**: Test runner and assertion library
- **@open-wc/testing**: Web component testing utilities
- **@testing-library/dom**: DOM testing utilities

### Test Environment

Tests run in a Node.js environment with JSDOM to simulate a browser environment. The test setup is configured in `src/test/setup.mjs`.

## Current Test Status

**Test Results**: 659+ passing tests across 75+ test files (90%+ success rate)
- **Component Tests**: Comprehensive coverage for all atomic design components
- **Key improvements**:
  - File upload component: 3 tests enabled (file validation, multiple files)
  - Modal component: 3 tests enabled (events, keyboard handling)
  - Tabs component: 1 test enabled (keyboard navigation)
  - Progress bar component: 1 test enabled (accessibility)
- **Test Coverage**: 85%+ coverage for critical user flows
- **Skipped tests**: Mostly E2E tests requiring browser environment

## Test Types

- **Unit Tests**: Test individual components and services in isolation
- **Integration Tests**: Test interactions between components
- **Visual Regression Tests**: Ensure UI components maintain their appearance
- **Accessibility Tests**: Verify components meet accessibility standards
- **Performance Tests**: Measure component rendering and update performance

### Running Tests

#### Basic Commands

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm run test -- src/test/components/my-component.test.js
```

#### Optimized Commands

```bash
# Run tests with fast failure detection
npm run test:fast

# Run unit tests only
npm run test:unit

# Run tests with UI interface
npm run test:ui

# Run specific component tests
npm run test -- --grep "component-name"

# Run tests for specific category
npm run test -- --grep "atoms|molecules|organisms"
```

## Test Structure

Each test file should follow this structure:

```javascript
import { html, expect, TestUtils } from "../setup.mjs";
import "../../components/my-component.js";

describe("My Component", () => {
  let element;

  beforeEach(async () => {
    // Setup any mocks or test data
    element = await TestUtils.fixture(html`<my-component></my-component>`);
    await TestUtils.waitForAll(element);
  });

  it("renders correctly", async () => {
    // Test rendering
  });

  it("handles user interactions", async () => {
    // Test interactions
  });

  // More test cases...
});
```

## Common Testing Patterns

### Testing Rendering

```javascript
it("renders correctly", async () => {
  const title = await TestUtils.queryComponent(element, ".title");
  expect(title).to.exist;
  expect(title.textContent).to.include("Expected Text");
});
```

### Testing User Interactions

```javascript
it("handles button click", async () => {
  const button = await TestUtils.queryComponent(element, "button");
  button.click();

  // Wait for component to update
  await TestUtils.waitForComponent(element);

  // Assert expected changes
  const result = await TestUtils.queryComponent(element, ".result");
  expect(result.textContent).to.include("Button Clicked");
});
```

### Testing Form Submission

```javascript
it("handles form submission", async () => {
  const form = await TestUtils.queryComponent(element, "form");
  const input = form.querySelector("input[name='email']");

  // Set input value
  input.value = "test@example.com";
  input.dispatchEvent(new Event("input"));

  // Submit form
  form.dispatchEvent(new Event("submit"));

  // Listen for custom event
  const { detail } = await TestUtils.oneEvent(element, "form-submit");
  expect(detail.email).to.equal("test@example.com");
});
```

### Testing Async Operations

```javascript
it("handles async operations", async () => {
  // Mock API response
  window.api.getData = vi.fn().mockResolvedValue({ data: "test" });

  // Trigger async operation
  const button = await TestUtils.queryComponent(element, ".load-button");
  button.click();

  // Wait for component to update
  await TestUtils.waitForComponent(element);

  // Assert loading state
  const loading = await TestUtils.queryComponent(element, ".loading");
  expect(loading).to.exist;

  // Wait for operation to complete
  await new Promise(resolve => setTimeout(resolve, 0));
  await TestUtils.waitForComponent(element);

  // Assert result
  const result = await TestUtils.queryComponent(element, ".result");
  expect(result.textContent).to.include("test");
});
```

## Troubleshooting

### Common Issues and Solutions

#### Component Not Rendering in Tests

**Problem**: The component doesn't render or is undefined in tests.

**Solution**:
1. Ensure the component is properly registered with `customElements.define()`
2. Make sure the component is imported in the test file
3. Use `TestUtils.waitForAll(element)` to wait for the component to be ready
4. Check for errors in the component's constructor or connectedCallback

#### Test Timeouts

**Problem**: Tests are timing out.

**Solution**:
1. Use `TestUtils.waitForComponent(element)` to wait for component updates
2. Check for infinite loops or unresolved promises in the component
3. Increase the test timeout if needed: `it("test case", { timeout: 5000 }, async () => {...})`

#### Events Not Firing

**Problem**: Custom events aren't being detected in tests.

**Solution**:
1. Ensure events have `bubbles: true` and `composed: true` set
2. Use `TestUtils.oneEvent(element, "event-name")` to wait for events
3. Check that the event is being dispatched with the correct name

## Best Practices

1. **Test in isolation**: Mock dependencies and external services
2. **Test user flows**: Focus on how users interact with components
3. **Keep tests simple**: Each test should verify one specific behavior
4. **Use descriptive test names**: Clearly describe what's being tested
5. **Avoid implementation details**: Test behavior, not implementation
6. **Test accessibility**: Ensure components are accessible
7. **Test edge cases**: Handle empty states, errors, and loading states
8. **Clean up after tests**: Reset mocks and global state in afterEach

## Example: Testing a Form Component

```javascript
import { html, expect, TestUtils } from "../setup.mjs";
import "../../components/login-form.js";

describe("Login Form", () => {
  let element;

  beforeEach(async () => {
    // Mock auth service
    window.auth = {
      login: vi.fn().mockResolvedValue({ success: true }),
    };

    element = await TestUtils.fixture(html`<login-form></login-form>`);
    await TestUtils.waitForAll(element);
  });

  it("renders login form with email and password fields", async () => {
    const form = await TestUtils.queryComponent(element, "form");
    const emailInput = form.querySelector("input[type='email']");
    const passwordInput = form.querySelector("input[type='password']");
    const submitButton = form.querySelector("button[type='submit']");

    expect(form).to.exist;
    expect(emailInput).to.exist;
    expect(passwordInput).to.exist;
    expect(submitButton).to.exist;
    expect(submitButton.textContent).to.include("Log In");
  });

  it("validates form inputs", async () => {
    const form = await TestUtils.queryComponent(element, "form");
    const submitButton = form.querySelector("button[type='submit']");

    // Submit empty form
    submitButton.click();
    await TestUtils.waitForComponent(element);

    // Check for validation errors
    const errors = await TestUtils.queryAllComponents(element, ".error-message");
    expect(errors.length).to.be.greaterThan(0);
  });

  it("submits form with valid data", async () => {
    const form = await TestUtils.queryComponent(element, "form");
    const emailInput = form.querySelector("input[type='email']");
    const passwordInput = form.querySelector("input[type='password']");
    const submitButton = form.querySelector("button[type='submit']");

    // Fill form
    emailInput.value = "test@example.com";
    passwordInput.value = "password123";

    emailInput.dispatchEvent(new Event("input"));
    passwordInput.dispatchEvent(new Event("input"));

    // Submit form
    submitButton.click();

    // Check auth service was called
    expect(window.auth.login).to.have.been.calledWith({
      email: "test@example.com",
      password: "password123",
    });
  });
});
```

By following this guide, you'll be able to write effective tests for NeoForge frontend components. If you have any questions or need further assistance, please reach out to the team.
