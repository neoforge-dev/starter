import { describe, it, expect } from "vitest";

// Skip e2e tests when running in unit test environment
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
