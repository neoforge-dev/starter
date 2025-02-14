import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Basic Accessibility Tests", () => {
  test("homepage should not have any automatically detectable accessibility issues", async ({
    page,
  }) => {
    await page.goto("/");

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("memory monitor component should be accessible", async ({ page }) => {
    await page.goto("/components/memory-monitor");
    await page.waitForSelector("memory-monitor");

    const accessibilityScanResults = await new AxeBuilder({ page })
      .include("memory-monitor")
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("performance dashboard should be accessible", async ({ page }) => {
    await page.goto("/performance");
    await page.waitForSelector("performance-dashboard");

    const accessibilityScanResults = await new AxeBuilder({ page })
      .include("performance-dashboard")
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("accessibility dashboard should be accessible", async ({ page }) => {
    await page.goto("/accessibility");
    await page.waitForSelector("accessibility-dashboard");

    const accessibilityScanResults = await new AxeBuilder({ page })
      .include("accessibility-dashboard")
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("should handle keyboard navigation correctly", async ({ page }) => {
    await page.goto("/");

    // Test Tab navigation
    await page.keyboard.press("Tab");
    const firstFocused = await page.evaluate(
      () => document.activeElement.tagName
    );
    expect(firstFocused.toLowerCase()).not.toBe("body");

    // Test Skip Link (if present)
    const skipLink = await page.$("a[href='#main-content']");
    if (skipLink) {
      await skipLink.focus();
      await page.keyboard.press("Enter");
      const focused = await page.evaluate(() => document.activeElement.tagName);
      expect(focused.toLowerCase()).not.toBe("body");
    }
  });

  test("should have proper ARIA landmarks", async ({ page }) => {
    await page.goto("/");

    // Check for main landmark
    const mainContent = await page.$("main");
    expect(mainContent).toBeTruthy();

    // Check for navigation landmark
    const navigation = await page.$("nav");
    expect(navigation).toBeTruthy();

    // Check for banner landmark
    const header = await page.$("header");
    expect(header).toBeTruthy();

    // Check for contentinfo landmark
    const footer = await page.$("footer");
    expect(footer).toBeTruthy();
  });

  test("should have proper heading structure", async ({ page }) => {
    await page.goto("/");

    const headings = await page.$$eval("h1, h2, h3, h4, h5, h6", (elements) =>
      elements.map((el) => ({
        level: parseInt(el.tagName.substring(1)),
        text: el.textContent.trim(),
      }))
    );

    // Ensure there's exactly one h1
    const h1Count = headings.filter((h) => h.level === 1).length;
    expect(h1Count).toBe(1);

    // Ensure heading levels don't skip
    let previousLevel = 1;
    for (const heading of headings) {
      expect(heading.level - previousLevel).toBeLessThanOrEqual(1);
      previousLevel = heading.level;
    }
  });

  test("images should have alt text", async ({ page }) => {
    await page.goto("/");

    const images = await page.$$eval("img", (imgs) =>
      imgs.map((img) => ({
        hasAlt: img.hasAttribute("alt"),
        alt: img.getAttribute("alt"),
        src: img.getAttribute("src"),
      }))
    );

    for (const img of images) {
      expect(img.hasAlt).toBe(true);
      if (img.alt === "") {
        // If alt is empty, ensure the image is decorative
        const isDecorative = await page.$eval(
          `img[src="${img.src}"]`,
          (img) =>
            img.getAttribute("role") === "presentation" ||
            img.getAttribute("aria-hidden") === "true"
        );
        expect(isDecorative).toBe(true);
      }
    }
  });

  test("interactive elements should have sufficient color contrast", async ({
    page,
  }) => {
    await page.goto("/");

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withRules(["color-contrast"])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
