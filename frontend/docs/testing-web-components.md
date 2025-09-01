# Testing Web Components

This guide explains our approach to testing web components in the NeoForge project. It addresses common issues with custom element registration in the test environment and provides best practices for writing reliable tests.

## Common Issues with Testing Web Components

When testing web components, especially those built with Lit, you may encounter the following issues:

1. **Custom Element Registration Failures**: Components fail to register properly in the test environment.
2. **Shadow DOM Testing Inconsistencies**: Accessing shadow DOM elements is inconsistent across tests.
3. **Import Resolution Failures**: Tests have incorrect import paths or try to import non-existent files.
4. **Syntax Errors**: Component files have syntax errors, particularly related to decorators.
5. **Component Lifecycle Issues**: Tests don't properly wait for components to be ready.

## Improved Testing Approach

We've created a set of utilities to address these issues and make testing web components more reliable:

### 1. Component Registration Helper

The `component-registration-helper.js` file provides utilities to improve component registration in tests:

```javascript
import { registerTestComponent, registerTestComponents } from './component-registration-helper.js';

// Register a single component
await registerTestComponent('neo-button', () => import('../components/atoms/button/button.js'));

// Register multiple components
const components = [
  ['neo-button', () => import('../components/atoms/button/button.js')],
  ['neo-input', () => import('../components/atoms/input/input.js')]
];
await registerTestComponents(components);
```

### 2. Improved Test Setup

The `improved-setup.js` file provides an improved setup for testing web components:

```javascript
import {
  setupTestEnvironment,
  cleanupTestEnvironment,
  TestUtils
} from './improved-setup.js';

describe('MyComponent', () => {
  let helpers;

  beforeEach(async () => {
    helpers = await setupTestEnvironment();
  });

  afterEach(() => {
    cleanupTestEnvironment();
  });

  it('renders correctly', async () => {
    // Test code here
  });
});
```

### 3. Component Fixtures

The `createComponentFixture` function creates a fixture for testing a component:

```javascript
// Create a component fixture
const button = await helpers.createComponentFixture('neo-button', {
  label: 'Click me',
  variant: 'primary'
});

// Verify the component
expect(button.label).toBe('Click me');

// Clean up
helpers.cleanupComponentFixture(button);
```

### 4. Shadow DOM Testing

The `TestUtils` object provides utilities for testing shadow DOM elements:

```javascript
// Query a component's shadow DOM
const buttonElement = TestUtils.queryComponent(button, 'button');
expect(buttonElement.textContent.trim()).toBe('Click me');

// Query all elements in a component's shadow DOM
const items = TestUtils.queryAllComponents(list, 'li');
expect(items.length).toBe(3);
```

### 5. Waiting for Components

The `waitForComponent` and `waitForAll` functions wait for components to be ready:

```javascript
// Wait for a component to be ready
await TestUtils.waitForComponent(button);

// Wait for a component and all its children to be ready
await TestUtils.waitForAll(form);
```

## Best Practices

### 1. Set Up and Clean Up

Always set up and clean up your test environment properly:

```javascript
describe('MyComponent', () => {
  let helpers;

  beforeEach(async () => {
    helpers = await setupTestEnvironment();
  });

  afterEach(() => {
    cleanupTestEnvironment();
  });

  // Tests here
});
```

### 2. Create and Clean Up Fixtures

Always create and clean up component fixtures properly:

```javascript
it('renders correctly', async () => {
  // Create a fixture
  const component = await helpers.createComponentFixture('my-component', {
    prop1: 'value1',
    prop2: 'value2'
  });

  // Test the component

  // Clean up
  helpers.cleanupComponentFixture(component);
});
```

### 3. Wait for Components to Be Ready

Always wait for components to be ready before testing them:

```javascript
it('renders correctly', async () => {
  const component = await helpers.createComponentFixture('my-component');

  // Wait for the component to be ready
  await component.updateComplete;

  // Test the component

  helpers.cleanupComponentFixture(component);
});
```

### 4. Test Shadow DOM Elements

Use the `TestUtils` object to test shadow DOM elements:

```javascript
it('renders correctly', async () => {
  const component = await helpers.createComponentFixture('my-component');

  // Query a shadow DOM element
  const element = TestUtils.queryComponent(component, '.my-element');
  expect(element).toBeDefined();

  helpers.cleanupComponentFixture(component);
});
```

### 5. Test Component Properties

Test component properties directly:

```javascript
it('reflects attribute changes', async () => {
  const component = await helpers.createComponentFixture('my-component', {
    prop1: 'value1'
  });

  // Change a property
  component.prop1 = 'value2';

  // Wait for the component to update
  await component.updateComplete;

  // Verify the property was updated
  expect(component.prop1).toBe('value2');

  helpers.cleanupComponentFixture(component);
});
```

## Example Test

Here's an example of a complete test for a button component:

```javascript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  setupTestEnvironment,
  cleanupTestEnvironment,
  TestUtils
} from './improved-setup.js';

describe('NeoButton', () => {
  let helpers;

  beforeEach(async () => {
    helpers = await setupTestEnvironment();
  });

  afterEach(() => {
    cleanupTestEnvironment();
  });

  it('renders with default properties', async () => {
    // Create a button fixture
    const button = await helpers.createComponentFixture('neo-button', {
      label: 'Click me'
    });

    // Verify the button properties
    expect(button.label).toBe('Click me');
    expect(button.variant).toBe('primary'); // Default variant

    // Verify the button's shadow DOM
    const buttonElement = TestUtils.queryComponent(button, 'button');
    expect(buttonElement.textContent.trim()).toBe('Click me');
    expect(buttonElement.classList.contains('primary')).toBe(true);

    // Clean up
    helpers.cleanupComponentFixture(button);
  });

  it('handles click events', async () => {
    // Create a button fixture
    const button = await helpers.createComponentFixture('neo-button', {
      label: 'Click me'
    });

    // Set up a click handler
    let clicked = false;
    button.addEventListener('click', () => {
      clicked = true;
    });

    // Click the button
    const buttonElement = TestUtils.queryComponent(button, 'button');
    buttonElement.click();

    // Verify the click handler was called
    expect(clicked).toBe(true);

    // Clean up
    helpers.cleanupComponentFixture(button);
  });
});
```

## Migrating Existing Tests

To migrate an existing test to use the improved testing approach:

1. Import the improved setup:

```javascript
import {
  setupTestEnvironment,
  cleanupTestEnvironment,
  TestUtils
} from './improved-setup.js';
```

2. Set up and clean up the test environment:

```javascript
describe('MyComponent', () => {
  let helpers;

  beforeEach(async () => {
    helpers = await setupTestEnvironment();
  });

  afterEach(() => {
    cleanupTestEnvironment();
  });

  // Tests here
});
```

3. Replace fixture creation with `createComponentFixture`:

```javascript
// Before
const element = await fixture(html`<my-component></my-component>`);

// After
const element = await helpers.createComponentFixture('my-component');
```

4. Replace shadow DOM queries with `TestUtils.queryComponent`:

```javascript
// Before
const button = element.shadowRoot.querySelector('button');

// After
const button = TestUtils.queryComponent(element, 'button');
```

5. Clean up fixtures:

```javascript
// After each test
helpers.cleanupComponentFixture(element);
```

## Conclusion

By following these best practices and using the improved testing utilities, you can write more reliable tests for web components. The utilities handle common issues with custom element registration, shadow DOM testing, and component lifecycle, making it easier to focus on testing the component's behavior.
