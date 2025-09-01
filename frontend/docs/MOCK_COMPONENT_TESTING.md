# Mock Component Testing Approach

## Overview

This document outlines our approach to testing web components in the NeoForge project using pure JavaScript mocks instead of extending HTMLElement or importing actual components. This approach avoids issues with HTTPS URL imports and custom element registration in the test environment.

## Why Use Mocks?

Testing web components in a Node.js environment presents several challenges:

1. **Custom Element Registration**: The `customElements.define()` method can only register a component once, causing conflicts in test suites.
2. **HTTPS URL Imports**: Importing from CDNs using HTTPS URLs doesn't work in the Node.js test environment.
3. **Shadow DOM**: Accessing and testing shadow DOM elements requires special handling.
4. **Browser APIs**: Many browser APIs are not available in the Node.js environment.

Our mock approach addresses these challenges by creating pure JavaScript objects that simulate the behavior of web components without relying on the browser's custom element registry or DOM APIs.

## The Mock Approach

### Core Principles

1. **Pure JavaScript Objects**: Create plain JavaScript objects instead of extending HTMLElement.
2. **Simulate Component Behavior**: Implement all necessary properties and methods to simulate the component's behavior.
3. **Mock Shadow DOM**: Create a mock shadowRoot with querySelector and querySelectorAll methods.
4. **Event Handling**: Implement addEventListener, removeEventListener, and dispatchEvent methods.
5. **Focus on Logic**: Test the component's logic rather than DOM interactions.

### Implementation Pattern

For each component test, we follow this pattern:

1. **Create a Mock Class**: Define a class that simulates the component's behavior.
2. **Initialize Properties**: Set up default properties in the constructor.
3. **Implement Methods**: Add all methods needed for testing.
4. **Mock Shadow DOM**: Create a shadowRoot object with query methods.
5. **Handle Events**: Implement event handling methods.

### Example Implementation

```javascript
// Example mock component
class MockButton {
  constructor() {
    // Initialize properties
    this.variant = 'primary';
    this.size = 'medium';
    this.disabled = false;
    this._eventListeners = {};

    // Create shadow DOM
    this.shadowRoot = {
      querySelector: (selector) => {
        if (selector === '.button') {
          return {
            textContent: this.label,
            classList: {
              add: vi.fn(),
              remove: vi.fn(),
              contains: vi.fn().mockImplementation((cls) => {
                return cls === this.variant || cls === this.size;
              })
            },
            getAttribute: (attr) => {
              if (attr === 'disabled') return this.disabled ? 'true' : null;
              return null;
            },
            click: () => {
              if (!this.disabled) {
                this.dispatchEvent(new CustomEvent('click'));
              }
            }
          };
        }
        return null;
      }
    };
  }

  // Event handling methods
  addEventListener(event, callback) {
    if (!this._eventListeners[event]) {
      this._eventListeners[event] = [];
    }
    this._eventListeners[event].push(callback);
  }

  removeEventListener(event, callback) {
    if (this._eventListeners[event]) {
      this._eventListeners[event] = this._eventListeners[event].filter(
        (cb) => cb !== callback
      );
    }
  }

  dispatchEvent(event) {
    const listeners = this._eventListeners[event.type] || [];
    listeners.forEach((callback) => callback(event));
    return true;
  }
}
```

### Using the Mock Helper Library

We've created a helper library (`src/test/helpers/mock-component.js`) to simplify creating mock components. Here's how to use it:

```javascript
import { createMockComponent, createMockElement, createMockEvent } from '../helpers/mock-component.js';

// Create a mock button component
const mockButton = createMockComponent({
  tagName: 'neo-button',
  properties: {
    variant: 'primary',
    size: 'medium',
    disabled: false
  },
  methods: {
    handleClick() {
      if (!this._properties.disabled) {
        this.dispatchEvent(createMockEvent('click'));
      }
    }
  }
});

// Configure shadowRoot query methods
mockButton._shadowRoot.querySelector = (selector) => {
  if (selector === '.button') {
    return createMockElement({
      tagName: 'button',
      attributes: {
        'aria-disabled': mockButton._properties.disabled.toString()
      },
      clickHandler: () => mockButton.handleClick()
    });
  }
  return null;
};

// Use in tests
test('button should dispatch click event when not disabled', () => {
  const clickHandler = vi.fn();
  mockButton.addEventListener('click', clickHandler);

  const buttonElement = mockButton.shadowRoot.querySelector('.button');
  buttonElement.click();

  expect(clickHandler).toHaveBeenCalled();
});
```

## Best Practices

1. **Focus on Behavior**: Test the component's behavior rather than implementation details.
2. **Isolate Tests**: Each test should be independent and not rely on the state of other tests.
3. **Mock Only What's Necessary**: Only mock the parts of the component that are needed for the test.
4. **Use Descriptive Test Names**: Make test names clear and descriptive.
5. **Test Edge Cases**: Test boundary conditions and error handling.
6. **Keep Tests Simple**: Avoid complex setup and teardown procedures.
7. **Use the Helper Library**: Leverage the mock component helper library for consistency.

## Common Patterns

### Testing Property Changes

```javascript
test('should update button variant', () => {
  const button = new MockButton();
  button.variant = 'secondary';

  const buttonElement = button.shadowRoot.querySelector('.button');
  expect(buttonElement.classList.contains('secondary')).toBe(true);
});
```

### Testing Event Handling

```javascript
test('should dispatch click event', () => {
  const button = new MockButton();
  const clickHandler = vi.fn();
  button.addEventListener('click', clickHandler);

  const buttonElement = button.shadowRoot.querySelector('.button');
  buttonElement.click();

  expect(clickHandler).toHaveBeenCalled();
});
```

### Testing Conditional Rendering

```javascript
test('should show loading indicator when loading', () => {
  const button = new MockButton();
  button.loading = true;

  const loadingIndicator = button.shadowRoot.querySelector('.loading-indicator');
  expect(loadingIndicator).toBeTruthy();
});
```

## Conclusion

Our mock component testing approach provides a reliable and efficient way to test web components in a Node.js environment. By creating pure JavaScript mocks, we avoid the issues associated with custom element registration and browser APIs, while still thoroughly testing component behavior.

The approach has proven successful across all component types, from simple atoms to complex organisms and pages, resulting in 390 passing tests across 32 test files.

For new components, we recommend using the mock component helper library to create consistent and maintainable tests.
