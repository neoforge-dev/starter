# DOM Mocking in Tests

This document explains our approach to mocking DOM manipulation in tests. We've created a set of utility functions that provide a standardized approach for mocking DOM elements, shadow DOM, events, and components.

## The Problem

Testing web components that manipulate the DOM can be challenging in a JSDOM environment. Some common issues include:

1. **DOM Manipulation**: JSDOM doesn't fully implement all DOM APIs, which can cause issues when components try to manipulate the DOM directly.
2. **Shadow DOM**: JSDOM has limited support for shadow DOM, which can cause issues when testing components that use shadow DOM.
3. **Events**: JSDOM's event handling can be inconsistent, especially for custom events.
4. **Component Registration**: Registering custom elements in tests can cause conflicts between tests.

## Our Solution

We've created a set of utility functions in `src/test/utils/dom-mock-utils.js` that provide a standardized approach for mocking DOM elements, shadow DOM, events, and components. These utilities allow us to test components without relying on JSDOM's implementation of DOM APIs.

### Key Features

- **Mock DOM Elements**: Create mock DOM elements with all the methods and properties needed for testing.
- **Mock Shadow DOM**: Create mock shadow roots for testing components that use shadow DOM.
- **Mock Events**: Create mock events and custom events for testing event handling.
- **Mock Components**: Create mock components with shadow DOM and event handling.
- **Mock Document**: Mock the `document.createElement` function to return mock elements.

## Usage Examples

### Creating a Mock Element

```javascript
import { createMockElement } from '../utils/dom-mock-utils';

// Create a mock div element
const div = createMockElement('div', {
  className: 'test-class',
  id: 'test-id',
  textContent: 'Test content'
});

// Use the mock element in tests
expect(div.className).toBe('test-class');
expect(div.id).toBe('test-id');
expect(div.textContent).toBe('Test content');

// Use DOM methods
div.setAttribute('data-test', 'test-value');
expect(div.getAttribute('data-test')).toBe('test-value');

// Manipulate children
const span = createMockElement('span');
div.appendChild(span);
expect(div.children).toContain(span);
```

### Creating a Mock Component

```javascript
import { createMockComponent } from '../utils/dom-mock-utils';

// Create a mock component
const component = createMockComponent('my-component', {
  foo: 'bar',
  render: vi.fn()
});

// Use the mock component in tests
expect(component.tagName).toBe('MY-COMPONENT');
expect(component.foo).toBe('bar');
expect(component.shadowRoot).toBeTruthy();

// Test event handling
const callback = vi.fn();
component.addEventListener('click', callback);

const event = createMockEvent('click');
component.dispatchEvent(event);

expect(callback).toHaveBeenCalledWith(event);
```

### Mocking document.createElement

```javascript
import { mockCreateElement } from '../utils/dom-mock-utils';

// Mock document.createElement
const restoreCreateElement = mockCreateElement();

// Use document.createElement in tests
const div = document.createElement('div');
expect(div.tagName).toBe('DIV');

// Restore the original createElement
restoreCreateElement();
```

### Creating and Registering a Mock Component

```javascript
import { createAndRegisterMockComponent } from '../utils/dom-mock-utils';

// Create and register a mock component
const MockComponent = createAndRegisterMockComponent('test-component', {
  foo: 'bar',
  render: vi.fn()
});

// Use the mock component in tests
const instance = new MockComponent();
expect(instance.foo).toBe('bar');
expect(instance.shadowRoot).toBeTruthy();
```

## Available Utilities

### createMockElement(tagName, props)

Creates a mock DOM element with the specified tag name and properties.

```javascript
const div = createMockElement('div', {
  className: 'test-class',
  id: 'test-id'
});
```

### createMockShadowRoot(props)

Creates a mock shadow root.

```javascript
const shadowRoot = createMockShadowRoot({
  mode: 'open'
});
```

### createMockDocumentFragment(props)

Creates a mock document fragment.

```javascript
const fragment = createMockDocumentFragment();
```

### createMockEvent(type, props)

Creates a mock event with the specified type and properties.

```javascript
const event = createMockEvent('click', {
  bubbles: true,
  cancelable: true
});
```

### createMockCustomEvent(type, options)

Creates a mock custom event with the specified type and options.

```javascript
const event = createMockCustomEvent('custom', {
  detail: { foo: 'bar' }
});
```

### mockCreateElement()

Mocks the `document.createElement` function to return mock elements.

```javascript
const restoreCreateElement = mockCreateElement();
// ...
restoreCreateElement();
```

### createMockComponent(tagName, props)

Creates a mock component with the specified tag name and properties.

```javascript
const component = createMockComponent('my-component', {
  foo: 'bar'
});
```

### registerMockComponent(tagName, constructor)

Registers a mock component with the custom elements registry.

```javascript
class MockComponent extends HTMLElement {
  // ...
}

registerMockComponent('test-component', MockComponent);
```

### createAndRegisterMockComponent(tagName, props)

Creates and registers a mock component with the specified tag name and properties.

```javascript
const MockComponent = createAndRegisterMockComponent('test-component', {
  foo: 'bar'
});
```

## Best Practices

1. **Use Mock Elements**: Use mock elements instead of real DOM elements in tests.
2. **Avoid Direct DOM Manipulation**: Avoid direct DOM manipulation in tests. Instead, use the mock elements' methods.
3. **Mock Shadow DOM**: Use mock shadow roots instead of real shadow DOM in tests.
4. **Mock Events**: Use mock events instead of real events in tests.
5. **Mock Components**: Use mock components instead of real components in tests.
6. **Clean Up**: Clean up any mocks or spies after each test.
7. **Test in Isolation**: Test components in isolation, mocking any dependencies.

## Conclusion

By using these utilities, we can test components that manipulate the DOM without relying on JSDOM's implementation of DOM APIs. This makes our tests more reliable and easier to maintain.

For more information, see the [DOM Mock Utilities Tests](../../src/test/utils/dom-mock-utils.test.js) for examples of how to use these utilities. 