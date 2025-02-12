import { test, expect } from "@playwright/test";

test("Button story loads and responds to clicks", async ({ page }) => {
  // Navigate to the Button component story page
  await page.goto("http://localhost:3000/stories/button-story.html");

  // Ensure the <my-button> element is visible
  const button = await page.locator("my-button");
  await expect(button).toBeVisible();

  // Click the button and verify the "clicked" class is added
  await button.click();
  await expect(button).toHaveClass(/clicked/);
});
