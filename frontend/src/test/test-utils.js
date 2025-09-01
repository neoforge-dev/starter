// Simple test runner with browser-native features
export class TestRunner {
  constructor() {
    this.tests = [];
    this.beforeEachFns = [];
    this.afterEachFns = [];
  }

  describe(name, fn) {
    console.group(name);
    fn();
    console.groupEnd();
  }

  it(name, fn) {
    this.tests.push({ name, fn });
  }

  beforeEach(fn) {
    this.beforeEachFns.push(fn);
  }

  afterEach(fn) {
    this.afterEachFns.push(fn);
  }

  async run() {
    const results = {
      passed: 0,
      failed: 0,
      total: this.tests.length,
    };

    for (const test of this.tests) {
      try {
        console.log(`Running test: ${test.name}`);
        for (const beforeFn of this.beforeEachFns) await beforeFn();
        await test.fn();
        for (const afterFn of this.afterEachFns) await afterFn();
        console.log(`✓ Passed: ${test.name}`);
        results.passed++;
      } catch (error) {
        console.error(`✗ Failed: ${test.name}`);
        console.error(error);
        results.failed++;
      }
    }
    return results;
  }
}

// Component testing utilities
export class ComponentTester {
  static async render(ComponentClass) {
    // Create and mount the element
    const tagName =
      ComponentClass.tagName ||
      ComponentClass.name
        .replace(/([A-Z])/g, "-$1")
        .toLowerCase()
        .replace(/^-/, "");
    if (!customElements.get(tagName)) {
      customElements.define(tagName, ComponentClass);
    }
    const el = document.createElement(tagName);
    document.body.appendChild(el);

    // Wait for element to be connected and upgraded
    await el.updateComplete;

    // Wait for shadowRoot and initial render
    await this.waitForElement(el);

    return el;
  }

  static async waitForElement(element) {
    // Wait for shadowRoot
    if (!element.shadowRoot) {
      await new Promise((resolve) => {
        const observer = new MutationObserver(() => {
          if (element.shadowRoot) {
            observer.disconnect();
            resolve();
          }
        });
        observer.observe(element, { attributes: true, childList: true });
      });
    }

    // Wait for updateComplete
    await element.updateComplete;

    // Additional frame to ensure all DOM updates are complete
    await new Promise((resolve) => requestAnimationFrame(resolve));

    return element;
  }

  static async click(element) {
    element.click();
    await element.updateComplete;
    await new Promise((resolve) => requestAnimationFrame(resolve));
  }

  static async type(element, value) {
    element.value = value;
    element.dispatchEvent(new Event("input"));
    await element.updateComplete;
    await new Promise((resolve) => requestAnimationFrame(resolve));
  }

  static async select(element, value) {
    element.value = value;
    element.dispatchEvent(new Event("change"));
    await element.updateComplete;
    await new Promise((resolve) => requestAnimationFrame(resolve));
  }

  static cleanup() {
    document.body.innerHTML = "";
  }
}

// Mock utilities
export class Mock {
  static fn() {
    const mock = (...args) => {
      mock.calls.push(args);
      return mock.returnValue;
    };
    mock.calls = [];
    mock.returnValue = undefined;
    return mock;
  }

  static spy(obj, method) {
    const original = obj[method];
    const mock = Mock.fn();
    obj[method] = (...args) => {
      mock.calls.push(args);
      return original.apply(obj, args);
    };
    return mock;
  }

  static reset() {
    Mock.fn().calls = [];
  }
}

// Add component mounting utility
export function mountComponent(tagName) {
  const element = document.createElement(tagName);
  document.body.appendChild(element);
  return element;
}

// Enhanced assertion utilities
export class Assert {
  static equal(actual, expected, message) {
    if (actual !== expected) {
      throw new Error(message || `Expected ${expected} but got ${actual}`);
    }
  }

  static notEqual(actual, expected, message) {
    if (actual === expected) {
      throw new Error(message || `Expected ${actual} not to equal ${expected}`);
    }
  }

  static true(value, message) {
    if (!value) {
      throw new Error(message || "Expected true but got false");
    }
  }

  static false(value, message) {
    if (value) {
      throw new Error(message || "Expected false but got true");
    }
  }

  static notNull(value, message) {
    if (value === null || value === undefined) {
      throw new Error(message || "Expected value to not be null/undefined");
    }
  }

  static isNull(value, message) {
    if (value !== null && value !== undefined) {
      throw new Error(message || `Expected null but got ${value}`);
    }
  }

  static greaterThan(actual, expected, message) {
    if (actual <= expected) {
      throw new Error(
        message || `Expected ${actual} to be greater than ${expected}`
      );
    }
  }

  static include(haystack, needle, message) {
    if (!haystack.includes(needle)) {
      throw new Error(message || `Expected ${haystack} to include ${needle}`);
    }
  }
}

// Performance testing utilities
export class PerformanceTester {
  static async measureRenderTime(ComponentClass, props = {}, iterations = 5) {
    const times = [];

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();

      const element = await ComponentTester.render(ComponentClass);
      Object.assign(element, props);
      await element.updateComplete;

      const end = performance.now();
      times.push(end - start);

      ComponentTester.cleanup();
    }

    return {
      average: times.reduce((a, b) => a + b, 0) / times.length,
      min: Math.min(...times),
      max: Math.max(...times),
      median: times.sort()[Math.floor(times.length / 2)],
    };
  }

  static async measureMemoryUsage(ComponentClass, props = {}) {
    const startMemory = performance.memory?.usedJSHeapSize;

    const element = await ComponentTester.render(ComponentClass);
    Object.assign(element, props);
    await element.updateComplete;

    const endMemory = performance.memory?.usedJSHeapSize;
    const memoryIncrease = endMemory - startMemory;

    ComponentTester.cleanup();

    return {
      startMemory,
      endMemory,
      memoryIncrease,
      memoryIncreaseMB: memoryIncrease / 1024 / 1024,
    };
  }
}

// Accessibility testing utilities
export class A11yTester {
  static async checkBasicAccessibility(element) {
    const violations = [];

    // Check for missing alt text on images
    const images = element.shadowRoot?.querySelectorAll('img') || [];
    images.forEach(img => {
      if (!img.alt) {
        violations.push({
          rule: 'missing-alt',
          element: 'img',
          message: 'Image missing alt attribute',
        });
      }
    });

    // Check for missing labels on form elements
    const inputs = element.shadowRoot?.querySelectorAll('input, select, textarea') || [];
    inputs.forEach(input => {
      if (!input.labels?.length && !input.getAttribute('aria-label')) {
        violations.push({
          rule: 'missing-label',
          element: input.tagName.toLowerCase(),
          message: 'Form element missing label',
        });
      }
    });

    return violations;
  }

  static async testKeyboardNavigation(element) {
    const results = {
      focusable: false,
      tabbable: false,
    };

    // Test focus
    element.focus();
    results.focusable = document.activeElement === element;

    // Test tab navigation (basic check)
    const tabIndex = element.getAttribute('tabindex');
    results.tabbable = tabIndex !== '-1';

    return results;
  }
}

// Test data factories
export class TestData {
  static createUser(overrides = {}) {
    return {
      id: 1,
      email: 'test@example.com',
      full_name: 'Test User',
      is_active: true,
      is_verified: true,
      created_at: new Date().toISOString(),
      ...overrides,
    };
  }

  static createComponentProps(overrides = {}) {
    return {
      disabled: false,
      loading: false,
      error: null,
      className: '',
      ...overrides,
    };
  }

  static createMockEvent(type, detail = {}) {
    return new CustomEvent(type, {
      detail,
      bubbles: true,
      composed: true,
    });
  }
}

// Mock utilities enhancement
export class EnhancedMock extends Mock {
  static createServiceMock(serviceName, methods = {}) {
    const mock = {
      name: serviceName,
      ...methods,
    };

    // Track calls for each method
    mock.calls = {};
    Object.keys(methods).forEach(method => {
      mock.calls[method] = [];
      const originalMethod = mock[method];
      mock[method] = (...args) => {
        mock.calls[method].push(args);
        return originalMethod(...args);
      };
    });

    return mock;
  }

  static mockFetch(responseData, status = 200) {
    const originalFetch = global.fetch;
    global.fetch = (...args) => {
      return Promise.resolve({
        ok: status >= 200 && status < 300,
        status,
        json: () => Promise.resolve(responseData),
        text: () => Promise.resolve(JSON.stringify(responseData)),
      });
    };
    return () => { global.fetch = originalFetch; };
  }

  static mockLocalStorage() {
    const store = {};
    const originalLocalStorage = global.localStorage;

    global.localStorage = {
      getItem: (key) => store[key] || null,
      setItem: (key, value) => { store[key] = value; },
      removeItem: (key) => { delete store[key]; },
      clear: () => { Object.keys(store).forEach(key => delete store[key]); },
    };

    return {
      store,
      restore: () => { global.localStorage = originalLocalStorage; },
    };
  }
}

// Export enhanced utilities
export {
  PerformanceTester,
  A11yTester,
  TestData,
  EnhancedMock,
};
