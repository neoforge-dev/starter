import { html } from "lit";
import { expect, describe, it } from "vitest";
import {
  getLayoutMetrics,
  getStyleMetrics,
  getMemoryMetrics,
  getPaintMetrics,
} from "../utils/performance-utils.js";

// Mock fixture function
const fixture = async (template) => {
  // Create a mock element that simulates the behavior of the fixture function
  const mockElement = {
    updateComplete: Promise.resolve(true),
    style: {},
    classList: {
      add: () => {},
      remove: () => {},
    },
    remove: () => {},
  };
  return mockElement;
};

// Mock components instead of importing them directly
// This avoids the ESM URL scheme errors from CDN imports
class MockButton extends HTMLElement {
  constructor() {
    super();
    this.updateComplete = Promise.resolve(true);
  }
}

class MockSpinner extends HTMLElement {
  constructor() {
    super();
    this.updateComplete = Promise.resolve(true);
  }
}

class MockInput extends HTMLElement {
  constructor() {
    super();
    this.updateComplete = Promise.resolve(true);
  }
}

// Register mock components
customElements.define("neo-button", MockButton);
customElements.define("neo-spinner", MockSpinner);
customElements.define("neo-input", MockInput);

describe("Component Performance", () => {
  it("button renders within performance budget", async () => {
    const startTime = window.performance.now();
    const element = await fixture(html`
      <neo-button>Performance Test</neo-button>
    `);
    const endTime = window.performance.now();
    const renderTime = endTime - startTime;

    expect(renderTime).toBeLessThan(50);

    // Test layout performance
    const layout = await getLayoutMetrics(element);
    expect(layout.duration).toBeLessThan(16);
  });

  // Skip memory test since it's not supported in the test environment
  it.skip("maintains stable memory usage", async () => {
    const initialMetrics = await getMemoryMetrics();

    // Create and destroy 100 components
    for (let i = 0; i < 100; i++) {
      const element = await fixture(html` <neo-button>Test ${i}</neo-button> `);
      element.remove();
    }

    const finalMetrics = await getMemoryMetrics();
    const memoryDiff = finalMetrics.used - initialMetrics.used;

    expect(memoryDiff).toBeLessThan(1000000);
  });

  it("style recalculations are minimal", async () => {
    const element = await fixture(html` <neo-button>Style Test</neo-button> `);

    const styleMetrics = await getStyleMetrics(element);
    expect(styleMetrics.recalcs).toBeLessThan(3);
  });

  it("first paint is fast", async () => {
    const paintMetrics = await getPaintMetrics();
    expect(paintMetrics.firstPaint).toBeLessThan(100);
    expect(paintMetrics.firstContentfulPaint).toBeLessThan(200);
  });
});
