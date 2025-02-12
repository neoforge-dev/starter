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
        // Run beforeEach hooks
        for (const beforeFn of this.beforeEachFns) {
          await beforeFn();
        }

        // Run test
        await test.fn();

        // Run afterEach hooks
        for (const afterFn of this.afterEachFns) {
          await afterFn();
        }

        console.log(`✅ ${test.name}`);
        results.passed++;
      } catch (error) {
        console.error(`❌ ${test.name}`);
        console.error(error);
        results.failed++;
      }
    }

    console.log(`\nResults: ${results.passed}/${results.total} tests passed`);
    return results;
  }
}

// Assertion utilities
export class Assert {
  static equal(actual, expected, message = "") {
    if (actual !== expected) {
      throw new Error(`${message} Expected ${expected} but got ${actual}`);
    }
  }

  static notEqual(actual, expected, message = "") {
    if (actual === expected) {
      throw new Error(`${message} Expected ${actual} not to equal ${expected}`);
    }
  }

  static true(value, message = "") {
    if (!value) {
      throw new Error(`${message} Expected true but got ${value}`);
    }
  }

  static false(value, message = "") {
    if (value) {
      throw new Error(`${message} Expected false but got ${value}`);
    }
  }

  static contains(text, substring, message = "") {
    if (!text.includes(substring)) {
      throw new Error(
        `${message} Expected "${text}" to contain "${substring}"`
      );
    }
  }

  static async throws(fn, errorType, message = "") {
    try {
      await fn();
      throw new Error(
        `${message} Expected function to throw ${errorType.name}`
      );
    } catch (error) {
      if (!(error instanceof errorType)) {
        throw new Error(
          `${message} Expected ${errorType.name} but got ${error.constructor.name}`
        );
      }
    }
  }
}

// Component testing utilities
export class ComponentTester {
  static async render(component) {
    const el = document.createElement(component.tagName);
    document.body.appendChild(el);
    await el.updateComplete;
    return el;
  }

  static async click(element) {
    element.click();
    await element.updateComplete;
  }

  static async type(element, value) {
    element.value = value;
    element.dispatchEvent(new Event("input"));
    await element.updateComplete;
  }

  static async select(element, value) {
    element.value = value;
    element.dispatchEvent(new Event("change"));
    await element.updateComplete;
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
