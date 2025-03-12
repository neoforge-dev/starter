# Mocking Components with CDN Imports

## Overview

This guide explains our approach for mocking components that use CDN imports in test files. The NeoForge frontend uses Lit components imported from CDN URLs, which can cause ESM URL scheme errors in the test environment. This document outlines our standardized approach for creating mock implementations of these components for testing.

## The Problem

When testing components that import from CDN URLs like:

```javascript
import { LitElement, html, css } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";
```

We encounter ESM URL scheme errors in the test environment:

```
Error: Only URLs with a scheme in: file and data are supported by the default ESM loader. Received protocol 'https:'
```

This is because the default ESM loader in Node.js only supports `file:` and `data:` URLs, not `https:` URLs.

## Our Solution

We've created a set of utility functions in `src/test/utils/component-mock-utils.js` that provide a standardized approach for mocking components with CDN imports. These utilities allow us to:

1. Create mock component classes with specified properties and methods
2. Create mock shadow roots, class lists, and fixture functions
3. Register mock components with the custom elements registry
4. Create and register mock components in one step

## Using the Component Mock Utilities

### Basic Usage

```javascript
import { 
  createMockComponent,
  createMockFixture,
  createAndRegisterMockComponent 
} from "../utils/component-mock-utils.js";

// Create a mock fixture function
const fixture = createMockFixture();

// Create and register a mock component
createAndRegisterMockComponent(
  "neo-button",
  "NeoButton",
  {
    variant: { type: String },
    disabled: { type: Boolean }
  },
  {
    handleClick: () => {}
  }
);

describe("Button Tests", () => {
  it("should render correctly", async () => {
    const element = await fixture(html`<neo-button>Test</neo-button>`);
    expect(element).toBeDefined();
  });
});
```

### Available Utility Functions

#### `createMockComponent(name, properties, methods, parentClass)`

Creates a mock component class with the specified properties and methods.

- `name`: The name of the component
- `properties`: Static properties object with property definitions
- `methods`: Methods to add to the prototype
- `parentClass`: Name of the parent class (default: "LitElement")

```javascript
const MockButton = createMockComponent(
  "MockButton",
  {
    variant: { type: String },
    disabled: { type: Boolean }
  },
  {
    handleClick: () => {}
  }
);
```

#### `createMockShadowRoot()`

Creates a mock shadow root for testing.

```javascript
const shadowRoot = createMockShadowRoot();
```

#### `createMockClassList()`

Creates a mock class list for testing.

```javascript
const classList = createMockClassList();
classList.add("btn", "primary");
classList.toggle("active");
```

#### `createMockFixture()`

Creates a mock fixture function for testing.

```javascript
const fixture = createMockFixture();
const element = await fixture(html`<div>Test</div>`);
```

#### `registerMockComponent(tagName, componentClass)`

Registers a mock component with the custom elements registry.

```javascript
registerMockComponent("neo-button", MockButton);
```

#### `createAndRegisterMockComponent(tagName, className, properties, methods, parentClass)`

Creates and registers a mock component in one step.

```javascript
createAndRegisterMockComponent(
  "neo-button",
  "NeoButton",
  {
    variant: { type: String },
    disabled: { type: Boolean }
  },
  {
    handleClick: () => {}
  }
);
```

## Example: Refactoring a Test File

Here's an example of how to refactor a test file to use our component mock utilities:

### Before

```javascript
import { html } from "lit";
import { expect } from "vitest";

// Mock fixture function
const fixture = async (template) => {
  const mockElement = {
    updateComplete: Promise.resolve(true),
    style: {},
    classList: {
      add: () => {},
      remove: () => {}
    },
    remove: () => {}
  };
  return mockElement;
};

// Mock components
class MockButton extends HTMLElement {
  constructor() {
    super();
    this.updateComplete = Promise.resolve(true);
  }
}

// Register mock components
customElements.define("neo-button", MockButton);

describe("Button Tests", () => {
  it("should render correctly", async () => {
    const element = await fixture(html`<neo-button>Test</neo-button>`);
    expect(element).toBeDefined();
  });
});
```

### After

```javascript
import { html } from "lit";
import { expect } from "vitest";
import {
  createMockFixture,
  createAndRegisterMockComponent
} from "../utils/component-mock-utils.js";

// Create a mock fixture function
const fixture = createMockFixture();

// Create and register a mock component
createAndRegisterMockComponent(
  "neo-button",
  "NeoButton",
  {
    variant: { type: String },
    disabled: { type: Boolean }
  },
  {
    handleClick: () => {}
  }
);

describe("Button Tests", () => {
  it("should render correctly", async () => {
    const element = await fixture(html`<neo-button>Test</neo-button>`);
    expect(element).toBeDefined();
  });
});
```

## Best Practices

1. **Use the utility functions**: Always use the utility functions from `component-mock-utils.js` instead of creating your own mock implementations.

2. **Define properties and methods**: Define all properties and methods that your tests will use, even if they're not used in the actual component.

3. **Mock event handling**: Use the built-in event handling methods (`addEventListener`, `removeEventListener`, `dispatchEvent`) to test event-driven behavior.

4. **Use the fixture function**: Use the `createMockFixture()` function to create a mock fixture function for testing.

5. **Register components once**: Register each component only once at the top of your test file.

6. **Use descriptive names**: Use descriptive names for your mock components and properties to make your tests more readable.

7. **Test component behavior**: Focus on testing component behavior rather than implementation details.

## Conclusion

By using our component mock utilities, we can create standardized mock implementations of components with CDN imports for testing. This approach allows us to test our components without relying on the actual implementations that use CDN URLs, which aren't supported in the test environment.

For more information, see the [Component Mock Utilities Tests](../src/test/utils/component-mock-utils.test.js) for examples of how to use these utilities. 