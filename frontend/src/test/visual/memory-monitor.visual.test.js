import { test } from "@playwright/test";
import {
  compareScreenshot,
  waitForAnimations,
  setViewport,
  hideDynamicElements,
  waitForWebComponents,
} from "./helpers";

test.describe("memory-monitor visual regression", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await waitForWebComponents(page, ["memory-monitor"]);
    await setViewport(page);
    await hideDynamicElements(page);
  });

  test("default state", async ({ page }) => {
    await compareScreenshot(page, "memory-monitor-default");
  });

  test("expanded with warning leak", async ({ page }) => {
    await page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent("memory-leak-detected", {
          detail: {
            type: "warning",
            message: "Test warning leak",
            timestamp: Date.now(),
          },
        })
      );
    });

    await waitForAnimations(page);
    await compareScreenshot(page, "memory-monitor-warning");
  });

  test("expanded with critical leak", async ({ page }) => {
    await page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent("memory-leak-detected", {
          detail: {
            type: "critical",
            message: "Test critical leak",
            timestamp: Date.now(),
          },
        })
      );
    });

    await waitForAnimations(page);
    await compareScreenshot(page, "memory-monitor-critical");
  });

  test("multiple leaks", async ({ page }) => {
    await page.evaluate(() => {
      const leaks = [
        {
          type: "warning",
          message: "Test warning leak",
          timestamp: Date.now(),
        },
        {
          type: "critical",
          message: "Test critical leak",
          timestamp: Date.now(),
        },
        {
          type: "detached_component",
          message: "Test detached component",
          timestamp: Date.now(),
        },
      ];

      leaks.forEach((leak) => {
        window.dispatchEvent(
          new CustomEvent("memory-leak-detected", { detail: leak })
        );
      });
    });

    await waitForAnimations(page);
    await compareScreenshot(page, "memory-monitor-multiple");
  });

  test("responsive layout - mobile", async ({ page }) => {
    await setViewport(page, { width: 375, height: 667 });
    await page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent("memory-leak-detected", {
          detail: {
            type: "warning",
            message: "Test warning leak",
            timestamp: Date.now(),
          },
        })
      );
    });

    await waitForAnimations(page);
    await compareScreenshot(page, "memory-monitor-mobile");
  });
});
