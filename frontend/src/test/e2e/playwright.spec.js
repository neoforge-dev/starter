import { describe, it, expect } from "vitest";

// PERMANENTLY SKIPPED IN VITEST: These are Playwright E2E tests
// - Requires Playwright test runner: `npm run test:e2e`
// - Uses Playwright-specific APIs (page.goto, page.locator, etc.)
// - Cannot run in Vitest/JSDOM environment
// - To enable: Set up Playwright and run with `npx playwright test`
describe.skip("NeoForge Frontend Pages", () => {
  const routes = [
    { path: "/", titlePattern: /Landing/i },
    { path: "/documentation", titlePattern: /Documentation/i },
    { path: "/examples", titlePattern: /Examples/i },
    { path: "/tutorials", titlePattern: /Tutorials/i },
    { path: "/faq", titlePattern: /FAQ/i },
    { path: "/contact", titlePattern: /Contact/i },
    { path: "/status", titlePattern: /Status/i },
    { path: "/login", titlePattern: /Login/i },
    { path: "/signup", titlePattern: /Sign Up/i },
    { path: "/profile", titlePattern: /Profile/i },
    { path: "/settings", titlePattern: /Settings/i },
    { path: "/dashboard", titlePattern: /Dashboard/i },
  ];

  routes.forEach(({ path: route, titlePattern }) => {
    it(`Page "${route}" should load and have title matching ${titlePattern}`, async ({
      page,
    }) => {
      await page.goto(`http://localhost:3000${route}`);
      // Get the page title and make sure it follows the expected pattern
      const title = await page.title();
      expect(title).toMatch(titlePattern);
    });
  });
});

// PERMANENTLY SKIPPED IN VITEST: Playwright E2E test - see comment above
describe.skip("Error Handling", () => {
  it("404 page should be displayed for unknown routes", async ({ page }) => {
    await page.goto("http://localhost:3000/this-page-does-not-exist");
    // Verify that the body contains text indicating a "404" error
    await expect(page.locator("body")).toContainText(/404/i);
  });
});

// PERMANENTLY SKIPPED IN VITEST: Playwright E2E test - see comment above
describe.skip("PWA Support", () => {
  it("Service Worker should be registered", async ({ page }) => {
    await page.goto("http://localhost:3000");
    // Check that a service worker is registered
    const swRegistrations = await page.evaluate(async () => {
      return await navigator.serviceWorker.getRegistrations();
    });
    expect(swRegistrations.length).toBeGreaterThan(0);
  });
});
