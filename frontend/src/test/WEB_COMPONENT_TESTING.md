# Web Component Testing Guide

This guide provides detailed instructions for testing web components in the NeoForge project. It focuses on the unique challenges of testing shadow DOM components and provides best practices for reliable tests.

## Table of Contents

1. [Introduction](#introduction)
2. [Common Challenges](#common-challenges)
3. [Testing Helpers](#testing-helpers)
4. [Test Structure](#test-structure)
5. [Best Practices](#best-practices)
6. [Troubleshooting](#troubleshooting)

## Introduction

Testing web components presents unique challenges due to their encapsulated nature with shadow DOM. This guide will help you write reliable tests for web components using our custom testing helpers.

## Common Challenges

When testing web components, you may encounter these common challenges:

1. **Shadow DOM Access**: Standard DOM queries don't penetrate the shadow DOM boundary
2. **Component Lifecycle**: Tests may run before components are fully initialized
3. **Event Handling**: Events may not propagate as expected across shadow DOM boundaries
4. **Asynchronous Updates**: Component updates may be asynchronous
5. **Custom Element Registration**: Components must be registered before testing

## Testing Helpers

We've created a set of helper functions in `src/test/helpers/component-test-helper.js` to address these challenges:

### Component Creation and Cleanup

```javascript
// Create and mount a component
const element = await createComponent('my-component', { prop1: 'value1' });

// Clean up after testing
removeComponent(element);
```

### Shadow DOM Queries

```javascript
// Find an element in shadow DOM
const button = findInShadow(element, 'button.primary');

// Find all elements matching a selector
const items = findAllInShadow(element, '.list-item');
```

### User Interactions

```javascript
// Set input values
setInputValue(nameInput, 'John Doe');

// Click elements
click(submitButton);

// Fill a form with multiple values
fillForm(form, {
  name: 'John Doe',
  email: 'john@example.com',
  password: 'Password123!'
});

// Submit a form
submitForm(form);
```

### Waiting for Updates

```javascript
// Wait for component to update
await waitForUpdate(element);

// Wait for an event
const event = await waitForEvent(element, 'custom-event');
```

## Test Structure

Here's a recommended structure for web component tests:

```javascript
import { expect, vi } from "vitest";
import {
  createComponent,
  removeComponent,
  waitForUpdate,
  findInShadow,
  findAllInShadow,
  setInputValue,
  click,
  waitForEvent,
  fillForm
} from "../helpers/component-test-helper.js";
import "../../components/my-component.js";

describe("My Component", () => {
  let element;

  beforeEach(async () => {
    // Mock dependencies
    window.someService = {
      getData: vi.fn().mockResolvedValue({ data: "test" })
    };

    // Create component
    element = await createComponent("my-component");
  });

  afterEach(() => {
    // Clean up
    removeComponent(element);
  });

  it("renders correctly", async () => {
    const title = findInShadow(element, ".title");
    expect(title).to.exist;
    expect(title.textContent).to.include("Expected Text");
  });

  it("handles user interactions", async () => {
    const button = findInShadow(element, "button");

    // Set up event listener
    const eventPromise = waitForEvent(element, "button-click");

    // Perform action
    click(button);

    // Wait for event
    const event = await eventPromise;
    expect(event.detail.clicked).to.be.true;
  });

  it("processes form submission", async () => {
    const form = findInShadow(element, "form");

    // Fill form
    fillForm(form, {
      name: "John Doe",
      email: "john@example.com"
    });

    // Submit form
    submitForm(form);

    // Wait for component to update
    await waitForUpdate(element);

    // Check results
    const successMessage = findInShadow(element, ".success-message");
    expect(successMessage).to.exist;
  });
});
```

## Best Practices

1. **Always wait for components to be ready**:
   ```javascript
   element = await createComponent("my-component");
   ```

2. **Clean up after tests**:
   ```javascript
   afterEach(() => {
     removeComponent(element);
   });
   ```

3. **Use shadow DOM-aware queries**:
   ```javascript
   // ❌ Don't use:
   element.querySelector(".button");

   // ✅ Do use:
   findInShadow(element, ".button");
   ```

4. **Wait for asynchronous updates**:
   ```javascript
   click(button);
   await waitForUpdate(element);
   ```

5. **Use event listeners for async operations**:
   ```javascript
   const eventPromise = waitForEvent(element, "custom-event");
   click(button);
   const event = await eventPromise;
   ```

6. **Mock external dependencies**:
   ```javascript
   window.api = {
     getData: vi.fn().mockResolvedValue({ data: "test" })
   };
   ```

7. **Test one behavior per test**:
   ```javascript
   // ❌ Don't test multiple behaviors:
   it("renders and handles clicks and submits forms", async () => {
     // Too many assertions
   });

   // ✅ Do test one behavior:
   it("renders the form fields", async () => {
     // Assertions about rendering
   });

   it("handles form submission", async () => {
     // Assertions about submission
   });
   ```

## Troubleshooting

### Component Not Rendering

**Problem**: The component's shadow DOM is null or undefined.

**Solution**:
1. Ensure the component is properly defined:
   ```javascript
   await waitForComponentDefinition("my-component");
   ```
2. Wait for the component to be ready:
   ```javascript
   element = await createComponent("my-component");
   ```
3. Check for errors in the component's constructor or connectedCallback.

### Events Not Firing

**Problem**: Event listeners aren't detecting events.

**Solution**:
1. Ensure events have `bubbles: true` and `composed: true`:
   ```javascript
   this.dispatchEvent(new CustomEvent("my-event", {
     detail: { data },
     bubbles: true,
     composed: true
   }));
   ```
2. Use the `waitForEvent` helper:
   ```javascript
   const event = await waitForEvent(element, "my-event");
   ```

### Asynchronous Updates Not Reflected

**Problem**: Component changes aren't visible in tests.

**Solution**:
1. Wait for updates:
   ```javascript
   await waitForUpdate(element);
   ```
2. For complex updates, add a small delay:
   ```javascript
   await new Promise(resolve => setTimeout(resolve, 10));
   await waitForUpdate(element);
   ```

### Memory Issues

**Problem**: Tests run out of memory.

**Solution**:
1. Clean up components after each test:
   ```javascript
   afterEach(() => {
     removeComponent(element);
   });
   ```
2. Limit the number of tests running in parallel:
   ```javascript
   // vitest.config.js
   export default {
     test: {
       threads: false
     }
   };
   ```

## Example: Testing a Form Component

Here's a complete example of testing a form component:

```javascript
import { expect, vi } from "vitest";
import {
  createComponent,
  removeComponent,
  waitForUpdate,
  findInShadow,
  fillForm,
  submitForm
} from "../helpers/component-test-helper.js";
import "../../components/login-form.js";

describe("Login Form", () => {
  let element;

  beforeEach(async () => {
    // Mock auth service
    window.auth = {
      login: vi.fn().mockResolvedValue({ success: true })
    };

    // Create component
    element = await createComponent("login-form");
  });

  afterEach(() => {
    removeComponent(element);
  });

  it("renders login form with email and password fields", async () => {
    const form = findInShadow(element, "form");
    const emailInput = form.querySelector("input[type='email']");
    const passwordInput = form.querySelector("input[type='password']");

    expect(form).to.exist;
    expect(emailInput).to.exist;
    expect(passwordInput).to.exist;
  });

  it("validates form inputs", async () => {
    const form = findInShadow(element, "form");

    // Submit empty form
    submitForm(form);
    await waitForUpdate(element);

    // Check for validation errors
    const errors = findAllInShadow(element, ".error-message");
    expect(errors.length).to.be.greaterThan(0);
  });

  it("submits form with valid data", async () => {
    const form = findInShadow(element, "form");

    // Fill form
    fillForm(form, {
      email: "test@example.com",
      password: "password123"
    });

    // Submit form
    submitForm(form);
    await waitForUpdate(element);

    // Check auth service was called
    expect(window.auth.login).to.have.been.calledWith({
      email: "test@example.com",
      password: "password123"
    });

    // Check success message
    const successMessage = findInShadow(element, ".success-message");
    expect(successMessage).to.exist;
  });
});
```

By following this guide, you'll be able to write reliable tests for web components in the NeoForge project.
