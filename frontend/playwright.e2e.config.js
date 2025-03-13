// @ts-check
import { defineConfig, devices } from "@playwright/test";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    headless: true,
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 720 },
      },
    },
    {
      name: "firefox",
      use: {
        ...devices["Desktop Firefox"],
        viewport: { width: 1280, height: 720 },
      },
    },
    {
      name: "webkit",
      use: {
        ...devices["Desktop Safari"],
        viewport: { width: 1280, height: 720 },
      },
    },

    /* Test on mobile browsers */
    {
      name: "mobile-chrome",
      use: {
        ...devices["Pixel 5"],
      },
    },
    {
      name: "mobile-safari",
      use: {
        ...devices["iPhone 12"],
      },
    },

    /* Visual comparison testing */
    {
      name: "visual-chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 720 },
        screenshot: "on",
      },
    },
  ],

  /* Configure development server */
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    stdout: "pipe",
    stderr: "pipe",
    timeout: 120 * 1000,
  },

  /* Configure test timeouts */
  timeout: 30000,
  expect: {
    timeout: 5000,
  },

  /* Configure test output */
  outputDir: "test-results",
  snapshotDir: "test-snapshots",
  preserveOutput: process.env.CI ? "failures-only" : "always",

  /* Configure global setup */
  globalSetup: path.join(__dirname, "./tests/global-setup.js"),
  globalTeardown: path.join(__dirname, "./tests/global-teardown.js"),

  /* Configure test metadata */
  metadata: {
    platform: process.platform,
    headless: !!process.env.CI,
    browserName: "",
    browserVersion: "",
    engineName: "",
    engineVersion: "",
  },

  testMatch: ["**/*.spec.js"],
});
