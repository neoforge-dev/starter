export class TestRunner {
  static async setup(component) {
    await component.updateComplete;
  }
}

export class ComponentTester {
  static async click(element) {
    element.click();
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  static async type(element, value) {
    element.value = value;
    element.dispatchEvent(new Event("input"));
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  static async blur(element) {
    element.dispatchEvent(new Event("blur"));
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
}

export class Assert {
  static equal(actual, expected) {
    if (actual !== expected) {
      throw new Error(`Expected ${expected} but got ${actual}`);
    }
  }

  static notNull(value) {
    if (value === null) {
      throw new Error("Expected value to not be null");
    }
  }

  static true(value) {
    if (!value) {
      throw new Error("Expected value to be true");
    }
  }

  static false(value) {
    if (value) {
      throw new Error("Expected value to be false");
    }
  }
}
