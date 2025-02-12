import { test, expect } from "@playwright/test";

// Array of routes with expected title patterns to check the correct page loading
const pagesToTest = [
  { route: "/", expectedTitle: /Landing/i },
  { route: "/documentation", expectedTitle: /Documentation/i },
  { route: "/examples", expectedTitle: /Examples/i },
  { route: "/tutorials", expectedTitle: /Tutorials/i },
  { route: "/faq", expectedTitle: /FAQ/i },
  { route: "/contact", expectedTitle: /Contact/i },
  { route: "/status", expectedTitle: /Status/i },
  { route: "/login", expectedTitle: /Login/i },
  { route: "/signup", expectedTitle: /Sign Up/i },
  { route: "/profile", expectedTitle: /Profile/i },
  { route: "/settings", expectedTitle: /Settings/i },
  { route: "/dashboard", expectedTitle: /Dashboard/i },
];

test.describe("NeoForge Frontend Pages", () => {
  for (const { route, expectedTitle } of pagesToTest) {
    test(`Page "${route}" should load and have title matching ${expectedTitle}`, async ({
      page,
    }) => {
      await page.goto(`http://localhost:3000${route}`);
      // Get the page title and make sure it follows the expected pattern
      const title = await page.title();
      expect(title).toMatch(expectedTitle);
    });
  }
});

test.describe("Error Handling", () => {
  test("404 page should be displayed for unknown routes", async ({ page }) => {
    await page.goto("http://localhost:3000/non-existent-route");
    // Verify that the body contains text indicating a "404" error
    await expect(page.locator("body")).toContainText(/404/i);
  });
});

test.describe("PWA Support", () => {
  test("Service Worker should be registered", async ({ page }) => {
    await page.goto("http://localhost:3000/");
    // Check that a service worker is registered
    const swRegistrations = await page.evaluate(async () => {
      return await navigator.serviceWorker.getRegistrations();
    });
    expect(swRegistrations.length).toBeGreaterThan(0);
  });
});
