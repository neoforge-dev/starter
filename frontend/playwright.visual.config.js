// @ts-check
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./src/test/visual",
  use: {
    baseURL: "http://localhost:5173",
    screenshot: "on",
  },
  expect: {
    timeout: 5000,
    toHaveScreenshot: {
      maxDiffPixels: 100,
    },
  },
  retries: process.env.CI ? 2 : 0,
  reporter: [["html"], ["list"]],
});
