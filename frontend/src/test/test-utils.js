export class TestRunner {
  static async setup(component) {
    await component.updateComplete;
    await TestUtils.waitForAll(component);
  }
}

export class ComponentTester {
  static async click(element) {
    if (!element) {
      console.error("Cannot click null element");
      return;
    }
    element.click();
    await TestUtils.waitForUpdate();
  }

  static async type(element, value) {
    if (!element) {
      console.error("Cannot type into null element");
      return;
    }
    element.value = value;
    element.dispatchEvent(new Event("input"));
    await TestUtils.waitForUpdate();
  }

  static async blur(element) {
    if (!element) {
      console.error("Cannot blur null element");
      return;
    }
    element.dispatchEvent(new Event("blur"));
    await TestUtils.waitForUpdate();
  }

  static async dispatchEvent(element, eventType, detail = {}) {
    if (!element) {
      console.error("Cannot dispatch event on null element");
      return;
    }
    const event = new CustomEvent(eventType, {
      detail,
      bubbles: true,
      composed: true,
    });
    element.dispatchEvent(event);
    await TestUtils.waitForUpdate();
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

export class TestUtils {
  static async waitForUpdate(timeout = 100) {
    await new Promise((resolve) => setTimeout(resolve, 0));
    await new Promise(requestAnimationFrame);
  }

  static async waitForAll(element) {
    if (!element) return;

    await this.waitForComponent(element);

    const children = element.shadowRoot
      ? element.shadowRoot.querySelectorAll("*")
      : element.querySelectorAll("*");

    for (const child of children) {
      if (child.tagName && child.tagName.includes("-")) {
        await this.waitForComponent(child);
      }
    }
  }

  static async waitForComponent(element) {
    if (!element) {
      console.error("Cannot wait for null element");
      return;
    }

    console.log(`Waiting for component: ${element.tagName}`);

    // Wait for connectedCallback
    if (element.connectedCallback) {
      await element.connectedCallback();
    }

    // Wait for updateComplete
    if (element.updateComplete) {
      await element.updateComplete;
    }

    // Wait for shadow root
    if (!element.shadowRoot && element.attachShadow) {
      console.log(`Attaching shadow root to: ${element.tagName}`);
      element.attachShadow({ mode: "open" });
    }

    // Wait for any child components
    if (element.shadowRoot) {
      const children = element.shadowRoot.querySelectorAll("*");
      for (const child of children) {
        if (child.updateComplete) {
          await child.updateComplete;
        }
      }
    }

    return element;
  }

  static async queryComponent(container, selector) {
    if (!container || !selector) {
      console.error("Invalid container or selector");
      return null;
    }

    console.log(`Querying component: ${selector} in ${container.tagName}`);
    await this.waitForComponent(container);

    const element = container.shadowRoot
      ? container.shadowRoot.querySelector(selector)
      : container.querySelector(selector);

    if (!element) {
      console.error(
        `Component not found: ${selector} in container: ${container.tagName}`
      );
      return null;
    }

    await this.waitForComponent(element);
    return element;
  }

  static async queryAllComponents(container, selector) {
    if (!container || !selector) {
      console.error("Invalid container or selector");
      return [];
    }

    console.log(`Querying all components: ${selector} in ${container.tagName}`);
    await this.waitForComponent(container);

    const elements = container.shadowRoot
      ? container.shadowRoot.querySelectorAll(selector)
      : container.querySelectorAll(selector);

    const result = [];
    for (const element of elements) {
      await this.waitForComponent(element);
      result.push(element);
    }

    return result;
  }

  static async waitForShadowDom(element, maxAttempts = 10) {
    if (!element) {
      console.error("Cannot wait for shadow DOM on null element");
      return null;
    }

    console.log(`Waiting for shadow DOM: ${element.tagName}`);
    let attempts = 0;
    while (!element.shadowRoot && attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 50));
      attempts++;
    }

    if (!element.shadowRoot) {
      console.error(
        `Shadow DOM not found after ${maxAttempts} attempts for: ${element.tagName}`
      );
      return null;
    }

    return element.shadowRoot;
  }

  static mockResponse(data, status = 200) {
    return Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(data),
    });
  }

  static mockError(status, message) {
    return Promise.resolve({
      ok: false,
      status,
      json: () => Promise.resolve({ error: message }),
    });
  }

  static mockNetworkError() {
    return Promise.reject(new Error("Network error"));
  }
}
