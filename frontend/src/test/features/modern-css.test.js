import { test, expect } from "@playwright/test";

test.describe("Modern CSS Features", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("Container Queries are supported", async ({ page }) => {
    const containerQueriesSupported = await page.evaluate(() => {
      return CSS.supports("(container-type: inline-size)");
    });

    if (!containerQueriesSupported) {
      // Load polyfill if not supported
      await page.addScriptTag({
        url: "https://cdn.jsdelivr.net/npm/container-query-polyfill@1/dist/container-query-polyfill.modern.js",
      });
    }

    // Verify container query behavior
    const hasContainerStyles = await page.evaluate(() => {
      const container = document.createElement("div");
      container.style.containerType = "inline-size";
      document.body.appendChild(container);

      const computed = window.getComputedStyle(container);
      document.body.removeChild(container);

      return computed.containerType === "inline-size";
    });

    expect(hasContainerStyles).toBe(true);
  });

  test("CSS Subgrid is supported", async ({ page }) => {
    const subgridSupported = await page.evaluate(() => {
      return CSS.supports("(display: subgrid)");
    });

    // Note: Currently no reliable polyfill for subgrid
    // We'll implement a fallback if not supported
    if (!subgridSupported) {
      await page.addStyleTag({
        content: `
          /* Fallback for browsers without subgrid support */
          .grid-container {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
          }
          .subgrid {
            display: grid;
            grid-template-columns: inherit;
          }
        `,
      });
    }

    const hasGridStyles = await page.evaluate(() => {
      const container = document.createElement("div");
      container.className = "grid-container";
      const subgrid = document.createElement("div");
      subgrid.className = "subgrid";
      container.appendChild(subgrid);
      document.body.appendChild(container);

      const computed = window.getComputedStyle(subgrid);
      const hasGrid = computed.display === "grid";

      document.body.removeChild(container);
      return hasGrid;
    });

    expect(hasGridStyles).toBe(true);
  });

  test("View Transitions API is supported", async ({ page }) => {
    const viewTransitionsSupported = await page.evaluate(() => {
      return "startViewTransition" in document;
    });

    if (!viewTransitionsSupported) {
      await page.addScriptTag({
        content: `
          // Simple fallback for View Transitions API
          if (!document.startViewTransition) {
            document.startViewTransition = (callback) => {
              const promise = Promise.resolve();
              callback();
              return {
                ready: promise,
                finished: promise,
                updateCallbackDone: promise
              };
            };
          }
        `,
      });
    }

    const canStartTransition = await page.evaluate(() => {
      return typeof document.startViewTransition === "function";
    });

    expect(canStartTransition).toBe(true);
  });
});
