// @ts-check
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./src/test/visual",
  timeout: 30000, // 30s per test for component loading
  use: {
    baseURL: "http://localhost:5173",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    // Ensure consistent rendering
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },
  expect: {
    timeout: 10000, // Increased timeout for component loading
    toHaveScreenshot: {
      maxDiffPixels: 150, // Allow some variance for slight rendering differences
      threshold: 0.15, // 15% threshold for pixel differences
      mode: 'actual', // Use actual pixel comparison
      animations: 'disabled' // Disable animations for consistent screenshots
    },
  },
  // Retry failed tests in CI
  retries: process.env.CI ? 2 : 1,

  // Optimize for performance - run visual tests in parallel but limit workers
  workers: process.env.CI ? 2 : 4,

  reporter: [
    ["html", { outputFolder: "test-results/visual-report" }],
    ["list"],
    ["json", { outputFile: "test-results/visual-results.json" }]
  ],

  outputDir: "test-results/visual-artifacts",

  projects: [
    {
      name: 'chromium-desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 }
      },
    },
    {
      name: 'chromium-mobile',
      use: {
        ...devices['iPhone 12'],
        viewport: { width: 375, height: 667 }
      },
    }
  ],
});
