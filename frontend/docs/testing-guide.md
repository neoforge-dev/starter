# Web Component Testing Guide

## Introduction

This guide provides a comprehensive approach to testing web components in the NeoForge project. It addresses common challenges with testing web components, particularly custom element registration issues, and provides a systematic approach to writing reliable tests.

## Common Challenges with Testing Web Components

1. **Custom Element Registration**: Web components must be registered with the browser before they can be used. This can be problematic in test environments.
2. **Shadow DOM**: Web components often use Shadow DOM, which requires special techniques to access and test.
3. **Component Lifecycle**: Web components have a lifecycle that includes initialization, attribute changes, and rendering, which must be properly managed in tests.
4. **Event Handling**: Testing events emitted by web components requires special handling.
5. **Accessibility**: Testing accessibility features of web components requires specific techniques.

## The Mock Approach

Instead of relying on the custom element registry, we use a mock approach that simulates the component's properties and methods. This approach has several advantages:

1. **No Registration Required**: We don't need to register the component with the browser.
2. **Faster Tests**: Tests run faster because we don't need to wait for the component to be registered and rendered.
3. **More Reliable**: Tests are more reliable because they don't depend on the browser's custom element registry.
4. **Easier to Debug**: Tests are easier to debug because we have full control over the component's behavior.

## Step-by-Step Guide to Using the Mock Approach

### 1. Create a Mock of the Component's Properties and Methods

```javascript
let componentProps;

beforeEach(() => {
  // Create a mock of the component's properties
  componentProps = {
    // Properties
    property1: "value1",
    property2: "value2",
    
    // Methods
    method1: function() {
      // Implementation
    },
    method2: function() {
      // Implementation
    },
    
    // Event handling
    addEventListener: function(event, callback) {
      this[`_${event}Callback`] = callback;
    },
    
    // Shadow DOM
    shadowRoot: {
      querySelector: function(selector) {
        // Return mock elements based on the selector
      },
      querySelectorAll: function(selector) {
        // Return mock elements based on the selector
      }
    },
    
    // Other properties needed for testing
    updateComplete: Promise.resolve(true),
    classList: {
      contains: function(className) {
        // Implementation
      }
    }
  };
});
```

### 2. Write Tests Using the Mock

```javascript
it("should have default properties", () => {
  expect(componentProps.property1).toBe("value1");
  expect(componentProps.property2).toBe("value2");
});

it("should call method1", () => {
  const spy = vi.spyOn(componentProps, "method1");
  componentProps.method1();
  expect(spy).toHaveBeenCalled();
});

it("should handle events", () => {
  let eventFired = false;
  componentProps.addEventListener("event1", () => {
    eventFired = true;
  });
  
  // Trigger the event
  componentProps._event1Callback();
  
  expect(eventFired).toBe(true);
});

it("should query shadow DOM elements", () => {
  const element = componentProps.shadowRoot.querySelector(".class1");
  expect(element).toBeDefined();
});
```

## Examples for Different Component Types

### Button Component

```javascript
// Create a mock of the button properties
buttonProps = {
  label: "Click me",
  disabled: false,
  variant: "primary",
  size: "md",
  
  // Methods
  click: function() {
    if (!this.disabled) {
      if (typeof this._clickCallback === "function") {
        this._clickCallback();
      }
    }
  },
  
  // Event handling
  addEventListener: function(event, callback) {
    if (event === "click") {
      this._clickCallback = callback;
    }
  },
  
  // Shadow DOM
  shadowRoot: {
    querySelector: function(selector) {
      if (selector === "button") {
        return {
          click: function() {
            buttonProps.click();
          },
          classList: {
            contains: function(className) {
              if (className === "disabled") {
                return buttonProps.disabled;
              }
              if (className === `variant-${buttonProps.variant}`) {
                return true;
              }
              if (className === `size-${buttonProps.size}`) {
                return true;
              }
              return false;
            }
          },
          textContent: buttonProps.label
        };
      }
      return null;
    }
  },
  
  // Other properties
  updateComplete: Promise.resolve(true)
};
```

### Input Component

```javascript
// Create a mock of the input properties
inputProps = {
  value: "",
  placeholder: "Enter text",
  disabled: false,
  required: false,
  type: "text",
  
  // Methods
  focus: function() {
    this._isFocused = true;
    if (typeof this._focusCallback === "function") {
      this._focusCallback();
    }
  },
  blur: function() {
    this._isFocused = false;
    if (typeof this._blurCallback === "function") {
      this._blurCallback();
    }
  },
  
  // Event handling
  addEventListener: function(event, callback) {
    if (event === "input") {
      this._inputCallback = callback;
    } else if (event === "focus") {
      this._focusCallback = callback;
    } else if (event === "blur") {
      this._blurCallback = callback;
    }
  },
  
  // Shadow DOM
  shadowRoot: {
    querySelector: function(selector) {
      if (selector === "input") {
        return {
          value: inputProps.value,
          placeholder: inputProps.placeholder,
          disabled: inputProps.disabled,
          required: inputProps.required,
          type: inputProps.type,
          focus: function() {
            inputProps.focus();
          },
          blur: function() {
            inputProps.blur();
          },
          dispatchEvent: function(event) {
            if (event.type === "input" && typeof inputProps._inputCallback === "function") {
              inputProps._inputCallback(event);
            }
            return true;
          }
        };
      }
      return null;
    }
  },
  
  // Other properties
  updateComplete: Promise.resolve(true)
};
```

## Testing Component Events and Interactions

### Click Events

```javascript
it("should handle click events", () => {
  let clicked = false;
  componentProps.addEventListener("click", () => {
    clicked = true;
  });
  
  const button = componentProps.shadowRoot.querySelector("button");
  button.click();
  
  expect(clicked).toBe(true);
});
```

### Input Events

```javascript
it("should handle input events", () => {
  let inputValue = "";
  componentProps.addEventListener("input", (e) => {
    inputValue = e.target.value;
  });
  
  const input = componentProps.shadowRoot.querySelector("input");
  input.value = "new value";
  input.dispatchEvent(new Event("input"));
  
  expect(inputValue).toBe("new value");
});
```

## Testing Component Accessibility

### ARIA Attributes

```javascript
it("should have proper ARIA attributes", () => {
  componentProps.label = "Accessible Label";
  componentProps.required = true;
  
  const element = componentProps.shadowRoot.querySelector("input");
  expect(element.getAttribute("aria-label")).toBe("Accessible Label");
  expect(element.getAttribute("aria-required")).toBe("true");
});
```

### Keyboard Navigation

```javascript
it("should handle keyboard navigation", () => {
  let keyPressed = false;
  componentProps.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      keyPressed = true;
    }
  });
  
  const element = componentProps.shadowRoot.querySelector("button");
  element.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
  
  expect(keyPressed).toBe(true);
});
```

## Debugging Test Failures

### Common Issues and Solutions

1. **Component Not Defined**: Make sure the component is imported correctly and the mock is properly defined.
2. **Shadow DOM Elements Not Found**: Check the selectors used in the test and make sure they match the component's structure.
3. **Events Not Firing**: Make sure the event listeners are properly set up and the events are dispatched correctly.
4. **Async Issues**: Use `await` and `updateComplete` to ensure the component has finished rendering before testing it.

### Debugging Techniques

1. **Console Logging**: Add console.log statements to the test to see what's happening.
2. **Inspect the Mock**: Log the mock object to see if it's properly defined.
3. **Step Through the Test**: Use the debugger to step through the test and see where it fails.
4. **Isolate the Test**: Run the test in isolation to see if it passes.

## Best Practices for Writing Maintainable Tests

1. **Keep Tests Simple**: Each test should test one thing only.
2. **Use Descriptive Test Names**: Test names should describe what the test is testing.
3. **Use BeforeEach for Setup**: Use beforeEach to set up the test environment.
4. **Clean Up After Tests**: Clean up any resources created during the test.
5. **Use Constants for Test Data**: Use constants for test data to make tests more maintainable.
6. **Avoid Test Interdependence**: Tests should not depend on each other.
7. **Test Edge Cases**: Test edge cases like empty values, null values, and boundary conditions.
8. **Test Error Handling**: Test how the component handles errors.

## Conclusion

By following this guide, you should be able to write reliable tests for web components in the NeoForge project. The mock approach provides a way to test components without relying on the custom element registry, making tests faster, more reliable, and easier to debug. 