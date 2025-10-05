import { describe, it, expect } from "vitest";

// PERMANENTLY SKIPPED IN VITEST: This is a Playwright E2E test
// - Requires Playwright test runner: `npm run test:e2e`
// - Uses Playwright-specific APIs (page.goto, page.locator, etc.)
// - Cannot run in Vitest/JSDOM environment
// - To enable: Set up Playwright and run with `npx playwright test`
describe.skip("Button Component", () => {
  it("Button story loads and responds to clicks", async ({ page }) => {
    // Navigate to the button story in Storybook
    await page.goto(
      "http://localhost:6006/?path=/story/components-button--primary"
    );

    // Ensure the <my-button> element is visible
    const button = await page.locator("my-button");
    await expect(button).toBeVisible();

    // Check initial state
    const buttonText = await button.textContent();
    expect(buttonText).toContain("Click me");

    // Click the button
    await button.click();

    // Check that the button text changes after click
    const newButtonText = await button.textContent();
    expect(newButtonText).toContain("Clicked!");
  });
});
