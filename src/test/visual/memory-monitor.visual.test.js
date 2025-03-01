import { test, expect } from "@playwright/test";

test("memory-monitor visual regression", async ({ page }) => {
  await page.goto("/");

  // Wait for memory monitor to initialize
  await page.waitForSelector("memory-monitor");

  // Take screenshot for visual comparison
  const monitor = await page.locator("memory-monitor");
  await expect(monitor).toHaveScreenshot("memory-monitor.png");

  // Test memory updates
  await page.evaluate(() => {
    const monitor = document.querySelector("memory-monitor");
    monitor.updateMemory({ used: 50, total: 100 });
  });

  // Take screenshot after update
  await expect(monitor).toHaveScreenshot("memory-monitor-updated.png");
});
