import { test, expect } from "@playwright/test";

/**
 * Browser compatibility test suite
 * Tests critical features and polyfills across different browsers
 */

test.describe("Browser Compatibility", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("Web Components are properly rendered", async ({ page }) => {
    // Check if custom elements are defined
    const customElementsDefined = await page.evaluate(() => {
      return (
        customElements.get("app-header") !== undefined &&
        customElements.get("app-footer") !== undefined
      );
    });
    expect(customElementsDefined).toBe(true);

    // Check if shadow DOM is working
    const shadowRootExists = await page.evaluate(() => {
      const header = document.querySelector("app-header");
      return header?.shadowRoot !== null;
    });
    expect(shadowRootExists).toBe(true);
  });

  test("CSS Grid layout is working", async ({ page }) => {
    // Check if grid layout is applied
    const hasGridLayout = await page.evaluate(() => {
      const grid = document.querySelector(".grid");
      return window.getComputedStyle(grid).display === "grid";
    });
    expect(hasGridLayout).toBe(true);

    // Check grid gap inheritance
    const hasGridGap = await page.evaluate(() => {
      const grid = document.querySelector(".grid");
      const style = window.getComputedStyle(grid);
      return style.gap !== "0px" || style.gridGap !== "0px";
    });
    expect(hasGridGap).toBe(true);
  });

  test("Container queries are functioning", async ({ page }) => {
    // Check if container queries are supported
    const containerQueriesSupported = await page.evaluate(() => {
      return CSS.supports("(container-type: inline-size)");
    });

    if (containerQueriesSupported) {
      // Test native support
      const containerWorking = await page.evaluate(() => {
        const container = document.querySelector(".container");
        return window.getComputedStyle(container).contain.includes("layout");
      });
      expect(containerWorking).toBe(true);
    } else {
      // Test polyfill
      const polyfillLoaded = await page.evaluate(() => {
        return typeof window.ContainerQueryPolyfill !== "undefined";
      });
      expect(polyfillLoaded).toBe(true);
    }
  });

  test("View transitions are working", async ({ page }) => {
    // Check if view transitions are supported
    const viewTransitionsSupported = await page.evaluate(() => {
      return "startViewTransition" in document;
    });

    if (viewTransitionsSupported) {
      // Test native support
      const transitionWorks = await page.evaluate(() => {
        return typeof document.startViewTransition === "function";
      });
      expect(transitionWorks).toBe(true);
    } else {
      // Test fallback
      const fallbackWorks = await page.evaluate(() => {
        const element = document.querySelector(".transition-element");
        return window.getComputedStyle(element).transition !== "";
      });
      expect(fallbackWorks).toBe(true);
    }
  });

  test("Performance API is available", async ({ page }) => {
    const performanceAPIWorks = await page.evaluate(() => {
      return (
        typeof performance.now === "function" &&
        typeof performance.mark === "function" &&
        typeof performance.measure === "function"
      );
    });
    expect(performanceAPIWorks).toBe(true);
  });

  test("Intersection Observer is working", async ({ page }) => {
    const intersectionObserverWorks = await page.evaluate(() => {
      return typeof IntersectionObserver === "function";
    });
    expect(intersectionObserverWorks).toBe(true);
  });

  test("ResizeObserver is working", async ({ page }) => {
    const resizeObserverWorks = await page.evaluate(() => {
      return typeof ResizeObserver === "function";
    });
    expect(resizeObserverWorks).toBe(true);
  });

  test("CSS Custom Properties are supported", async ({ page }) => {
    const customPropertiesWork = await page.evaluate(() => {
      const style = window.getComputedStyle(document.documentElement);
      return style.getPropertyValue("--primary-color") !== "";
    });
    expect(customPropertiesWork).toBe(true);
  });

  test("Import maps are working", async ({ page }) => {
    const importMapsWork = await page.evaluate(async () => {
      try {
        const module = await import("/js/utils.js");
        return typeof module === "object";
      } catch {
        return false;
      }
    });
    expect(importMapsWork).toBe(true);
  });

  test("Browser-specific fixes are applied", async ({ page, browserName }) => {
    if (browserName === "webkit") {
      // Test Safari fixes
      const safariFixesApplied = await page.evaluate(() => {
        const style = document.querySelector("style");
        return style?.textContent.includes("-webkit-contain");
      });
      expect(safariFixesApplied).toBe(true);
    }

    if (browserName === "firefox") {
      // Test Firefox fixes
      const firefoxFixesApplied = await page.evaluate(() => {
        const container = document.querySelector(".container");
        return window.getComputedStyle(container).willChange === "transform";
      });
      expect(firefoxFixesApplied).toBe(true);
    }
  });
});

test.describe("Visual Regression", () => {
  test("Components render consistently across browsers", async ({ page }) => {
    // Load the component demo page
    await page.goto("/components");

    // Take a screenshot of each component
    const components = ["header", "footer", "card", "button"];
    for (const component of components) {
      await page.locator(`[data-testid="${component}"]`).screenshot({
        path: `./test-results/${component}-${test.info().project.name}.png`,
      });
    }
  });
});

test.describe("Performance Metrics", () => {
  test("Core Web Vitals are within acceptable range", async ({ page }) => {
    // Enable performance measurements
    await page.goto("/", { waitUntil: "networkidle" });

    // Measure LCP
    const lcp = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          resolve(entries[entries.length - 1].startTime);
        }).observe({ entryTypes: ["largest-contentful-paint"] });
      });
    });
    expect(lcp).toBeLessThan(2500); // Good LCP is under 2.5s

    // Measure CLS
    const cls = await page.evaluate(() => {
      return new Promise((resolve) => {
        let clsValue = 0;
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          }
          resolve(clsValue);
        }).observe({ entryTypes: ["layout-shift"] });
      });
    });
    expect(cls).toBeLessThan(0.1); // Good CLS is under 0.1

    // Measure FID
    const fid = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            resolve(entry.duration);
          }
        }).observe({ entryTypes: ["first-input"] });
      });
    });
    expect(fid).toBeLessThan(100); // Good FID is under 100ms
  });
});
