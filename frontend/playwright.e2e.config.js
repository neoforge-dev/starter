// @ts-check
import { defineConfig, devices } from "@playwright/test";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Enhanced E2E Configuration for NeoForge
 * Comprehensive testing with tenant isolation, API mocking, and advanced test management
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: "./src/test/e2e",
  outputDir: "./test-results-e2e",
  snapshotDir: "./test-snapshots-e2e",

  /* Sequential execution for E2E stability */
  fullyParallel: false,

  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,

  /* Limited workers for E2E stability */
  workers: process.env.CI ? 1 : 2,

  /* Enhanced reporting */
  reporter: [
    ["html", { outputFolder: "test-results-e2e-html" }],
    ["json", { outputFile: "test-results-e2e/results.json" }],
    ["junit", { outputFile: "test-results-e2e/junit.xml" }],
    ["line"]
  ],

  use: {
    baseURL: process.env.FRONTEND_BASE_URL || "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    headless: true,
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    actionTimeout: 10000,
    navigationTimeout: 30000,
    testIdAttribute: "data-testid",
    extraHTTPHeaders: {
      "X-Tenant-ID": process.env.TEST_TENANT_ID || "test-tenant",
      "X-E2E-Test": "true"
    },
  },

  /* Configure comprehensive test projects */
  projects: [
    /* Critical User Journey Tests */
    {
      name: "critical-journeys",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 720 },
        contextOptions: {
          permissions: ["geolocation", "notifications"],
          geolocation: { latitude: 37.7749, longitude: -122.4194 }
        }
      },
      testMatch: ["**/critical*.test.js", "**/journey*.test.js"],
      testIgnore: ["**/mobile*", "**/tablet*", "**/perf*", "**/a11y*", "**/visual*"]
    },

    /* Desktop Browser Tests */
    {
      name: "chromium-e2e",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 720 },
        contextOptions: {
          permissions: ["geolocation", "notifications"],
          geolocation: { latitude: 37.7749, longitude: -122.4194 }
        }
      },
      testMatch: ["**/*.e2e.test.js", "**/*.spec.js"],
      testIgnore: ["**/mobile*", "**/tablet*", "**/perf*", "**/a11y*", "**/visual*"]
    },

    {
      name: "firefox-e2e",
      use: {
        ...devices["Desktop Firefox"],
        viewport: { width: 1280, height: 720 }
      },
      testMatch: ["**/*.e2e.test.js"],
      testIgnore: ["**/mobile*", "**/tablet*", "**/perf*", "**/a11y*", "**/visual*"]
    },

    {
      name: "webkit-e2e",
      use: {
        ...devices["Desktop Safari"],
        viewport: { width: 1280, height: 720 }
      },
      testMatch: ["**/*.e2e.test.js"],
      testIgnore: ["**/mobile*", "**/tablet*", "**/perf*", "**/a11y*", "**/visual*"]
    },

    /* Mobile and Tablet Tests */
    {
      name: "mobile-chrome-e2e",
      use: {
        ...devices["Pixel 5"],
        contextOptions: {
          permissions: ["geolocation"],
          geolocation: { latitude: 37.7749, longitude: -122.4194 }
        }
      },
      testMatch: ["**/mobile*.test.js", "**/responsive*.test.js"]
    },

    {
      name: "mobile-safari-e2e",
      use: {
        ...devices["iPhone 12"],
        contextOptions: {
          permissions: ["geolocation"],
          geolocation: { latitude: 37.7749, longitude: -122.4194 }
        }
      },
      testMatch: ["**/mobile*.test.js", "**/responsive*.test.js"]
    },

    {
      name: "tablet-e2e",
      use: {
        ...devices["iPad Pro"],
        viewport: { width: 1024, height: 768 }
      },
      testMatch: ["**/tablet*.test.js", "**/responsive*.test.js"]
    },

    /* Specialized Test Types */
    {
      name: "api-integration-e2e",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 720 },
        headless: true
      },
      testMatch: ["**/api*.test.js", "**/integration*.test.js"]
    },

    {
      name: "performance-e2e",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 720 },
        headless: true
      },
      testMatch: ["**/perf*.test.js", "**/performance*.test.js"]
    },

    {
      name: "accessibility-e2e",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 720 },
        headless: true
      },
      testMatch: ["**/a11y*.test.js", "**/accessibility*.test.js"]
    },

    {
      name: "visual-e2e",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 720 },
        screenshot: "on"
      },
      testMatch: ["**/visual*.test.js", "**/regression*.test.js"]
    }
  ],

  /* Configure backend and frontend servers */
  webServer: [
    {
      command: "cd ../backend && uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 1",
      url: "http://localhost:8000/health",
      timeout: 120 * 1000,
      reuseExistingServer: !process.env.CI,
      stdout: "pipe",
      stderr: "pipe",
      env: {
        ENVIRONMENT: "test",
        TEST_TENANT_ID: "test-tenant",
        DATABASE_URL: "postgresql+asyncpg://postgres:postgres@localhost:55433/neoforge_test",
        REDIS_URL: "redis://localhost:6379/1"
      }
    },
    {
      command: "npm run dev",
      url: "http://localhost:3000",
      timeout: 60 * 1000,
      reuseExistingServer: !process.env.CI,
      stdout: "pipe",
      stderr: "pipe"
    }
  ],

  /* Configure test timeouts */
  timeout: 60000, // 1 minute for E2E tests
  expect: {
    timeout: 10000
  },

  /* Configure test output */
  preserveOutput: process.env.CI ? "failures-only" : "always",

  /* Configure global setup and teardown */
  // globalSetup: path.join(__dirname, "./tests/global-setup.js"),
  // globalTeardown: path.join(__dirname, "./tests/global-teardown.js"),

  /* Configure test metadata */
  metadata: {
    platform: process.platform,
    nodeVersion: process.version,
    testType: "e2e",
    tenantId: process.env.TEST_TENANT_ID || "test-tenant",
    environment: process.env.NODE_ENV || "test",
    apiBaseUrl: process.env.API_BASE_URL || "http://localhost:8000",
    frontendBaseUrl: process.env.FRONTEND_BASE_URL || "http://localhost:3000"
  },

  /* Enhanced test matching */
  testMatch: ["**/*.e2e.test.js", "**/*.journey.test.js", "**/*.spec.js"],
});
