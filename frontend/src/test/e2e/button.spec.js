import { describe, it, expect } from "vitest";

// Skip e2e tests when running in unit test environment
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
