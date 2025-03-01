import {  html  } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";
import { fixture, expect } from "@open-wc/testing";
import {
  getLayoutMetrics,
  getStyleMetrics,
  getMemoryMetrics,
  getPaintMetrics,
} from "../utils/performance-utils.js";

// Import components to test
import "../../components/atoms/button/button.js";
import "../../components/atoms/spinner/spinner.js";
import "../../components/atoms/input/input.js";

describe("Component Performance", () => {
  it("button renders within performance budget", async () => {
    const startTime = window.performance.now();
    const element = await fixture(html`
      <neo-button>Performance Test</neo-button>
    `);
    const endTime = window.performance.now();
    const renderTime = endTime - startTime;

    expect(renderTime).to.be.below(50, "Button should render in under 50ms");

    // Test layout performance
    const layout = await getLayoutMetrics(element);
    expect(layout.duration).to.be.below(
      16,
      "Layout should complete within 16ms frame budget"
    );
  });

  it("maintains stable memory usage", async () => {
    const initialMetrics = await getMemoryMetrics();

    // Create and destroy 100 components
    for (let i = 0; i < 100; i++) {
      const element = await fixture(html` <neo-button>Test ${i}</neo-button> `);
      element.remove();
    }

    const finalMetrics = await getMemoryMetrics();
    const memoryDiff = finalMetrics.used - initialMetrics.used;

    expect(memoryDiff).to.be.below(
      1000000,
      "Memory increase should be under 1MB"
    );
  });

  it("style recalculations are minimal", async () => {
    const element = await fixture(html` <neo-button>Style Test</neo-button> `);

    const styleMetrics = await getStyleMetrics(element);
    expect(styleMetrics.recalcs).to.be.below(
      3,
      "Should trigger minimal style recalculations"
    );
  });

  it("first paint is fast", async () => {
    const paintMetrics = await getPaintMetrics();
    expect(paintMetrics.firstPaint).to.be.below(
      100,
      "First paint should occur within 100ms"
    );
    expect(paintMetrics.firstContentfulPaint).to.be.below(
      200,
      "First contentful paint should occur within 200ms"
    );
  });
});
