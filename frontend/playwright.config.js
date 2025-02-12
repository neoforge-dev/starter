export default {
  testDir: "./src/test",
  testMatch: ["**/*.test.js"],
  use: {
    baseURL: "http://localhost:3000",
    headless: true,
    viewport: { width: 1280, height: 720 },
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "npx serve",
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
  reporter: [["list"], ["html", { open: "never" }]],
  workers: process.env.CI ? 1 : undefined,
  timeout: 30000,
  retries: process.env.CI ? 2 : 0,
  projects: [
    {
      name: "chromium",
      use: { browserName: "chromium" },
    },
    {
      name: "firefox",
      use: { browserName: "firefox" },
    },
    {
      name: "webkit",
      use: { browserName: "webkit" },
    },
  ],
};
