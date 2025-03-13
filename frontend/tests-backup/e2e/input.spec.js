import { test, expect } from "@playwright/test";

test("Input story loads and accepts user input", async ({ page }) => {
  // Navigate to the Input component story page
  await page.goto("http://localhost:3000/stories/input-story.html");

  // Ensure the <my-input> element is visible
  const input = await page.locator("my-input");
  await expect(input).toBeVisible();

  // Type into the input and verify its value
  await input.fill("Hello, NeoForge!");
  const value = await input.inputValue();
  expect(value).toBe("Hello, NeoForge!");
});
