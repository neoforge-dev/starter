// @ts-check
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./src/test/accessibility",
  testMatch: ["**/accessibility/page-accessibility.test.js"],
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "accessibility-desktop",
      use: {
        ...devices["Desktop Chrome"],
        contextOptions: {
          strictSelectors: true,
        },
      },
    },
    {
      name: "accessibility-mobile",
      use: {
        ...devices["iPhone 13"],
      },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
  reporter: [
    ["html", { outputFolder: "playwright-report/accessibility" }],
    ["json", { outputFile: "artifacts/accessibility-results.json" }],
    ["list"]
  ],
  workers: process.env.CI ? 1 : undefined,
  retries: process.env.CI ? 2 : 0,
  timeout: 60000,
  expect: {
    timeout: 10000,
  },
  outputDir: "test-results/accessibility",
});
