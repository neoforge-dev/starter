/**
 * Global setup for Playwright tests
 * @module tests/global-setup
 */

import { chromium, firefox, webkit } from "@playwright/test";

/**
 * Global setup function
 * Initializes browser contexts and gathers browser information
 */
async function globalSetup() {
  console.log("Starting global test setup...");

  // Launch browsers to gather version information
  const browsers = [
    { name: "chromium", launcher: chromium },
    { name: "firefox", launcher: firefox },
    { name: "webkit", launcher: webkit },
  ];

  for (const { name, launcher } of browsers) {
    const browser = await launcher.launch();
    const context = await browser.newContext();
    const page = await context.newPage();

    // Gather browser information
    const version = await page.evaluate(() => {
      const ua = navigator.userAgent;
      return {
        browserName: name,
        browserVersion:
          ua.match(/(?:Chrome|Firefox|Safari)\/(\d+\.\d+)/)?.[1] || "",
        engineName: ua.includes("Chrome")
          ? "Blink"
          : ua.includes("Firefox")
            ? "Gecko"
            : "WebKit",
        engineVersion: ua.match(/(?:AppleWebKit|Gecko)\/(\d+\.\d+)/)?.[1] || "",
      };
    });

    // Store browser information in global state
    global.__BROWSER_INFO__ = global.__BROWSER_INFO__ || {};
    global.__BROWSER_INFO__[name] = version;

    await browser.close();
  }

  // Initialize test artifacts directory
  const fs = require("fs");
  const path = require("path");
  const dirs = ["test-results", "test-snapshots", "test-reports"];

  dirs.forEach((dir) => {
    const dirPath = path.join(process.cwd(), dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  });

  // Set up environment variables for tests
  process.env.TEST_ENVIRONMENT = process.env.CI ? "ci" : "local";
  process.env.TEST_TIMESTAMP = new Date().toISOString();

  // Log setup completion
  console.log("Global test setup completed");
  console.log("Browser information:", global.__BROWSER_INFO__);
}

export default globalSetup;
