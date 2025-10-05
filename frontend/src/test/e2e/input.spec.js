import { describe, it, expect } from "vitest";

// PERMANENTLY SKIPPED IN VITEST: This is a Playwright E2E test
// - Requires Playwright test runner: `npm run test:e2e`
// - Uses Playwright-specific APIs (page.goto, page.locator, etc.)
// - Cannot run in Vitest/JSDOM environment
// - To enable: Set up Playwright and run with `npx playwright test`
describe.skip("Input Component", () => {
  it("Input story loads and accepts user input", async ({ page }) => {
    // Navigate to the input story in Storybook
    await page.goto(
      "http://localhost:6006/?path=/story/components-input--primary"
    );

    // Ensure the <my-input> element is visible
    const input = await page.locator("my-input input");
    await expect(input).toBeVisible();

    // Type into the input
    await input.fill("Hello, world!");

    // Check that the input value is updated
    const value = await input.inputValue();
    expect(value).toBe("Hello, world!");
  });
});
