import { test, expect } from "@playwright/test";

test("Modern CSS Features", async ({ page }) => {
  await page.goto("/");

  // Test CSS custom properties
  const hasCustomProps = await page.evaluate(() => {
    const style = getComputedStyle(document.documentElement);
    return style.getPropertyValue("--primary-color") !== "";
  });
  expect(hasCustomProps).toBeTruthy();

  // Test CSS Grid
  const hasGrid = await page.evaluate(() => {
    const el = document.createElement("div");
    return "grid" in el.style;
  });
  expect(hasGrid).toBeTruthy();

  // Test CSS Flexbox
  const hasFlex = await page.evaluate(() => {
    const el = document.createElement("div");
    return "flex" in el.style;
  });
  expect(hasFlex).toBeTruthy();
});
