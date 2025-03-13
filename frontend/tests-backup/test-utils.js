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

// Add assertion utilities
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
