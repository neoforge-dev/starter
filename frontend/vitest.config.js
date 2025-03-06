import { defineConfig } from "vitest/config";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    // Use jsdom for DOM simulation
    environment: "jsdom",
    // Disable threading to avoid memory issues
    threads: false,
    // Stop after 5 failures
    maxFailures: 5,
    // Include source files in coverage
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      exclude: ["node_modules/", "src/test/"],
    },
    // Setup files to run before tests
    setupFiles: [path.resolve(__dirname, "./src/test/test-setup.js")],
    // Include these extensions in test files
    include: ["src/test/**/*.test.{js,mjs}"],
    // Exclude node_modules and other non-test files
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/e2e/**",
      "src/test/accessibility/**/*.test.js",
      "src/test/e2e/**/*.test.js",
    ],
    // Global test timeout
    testTimeout: 5000,
    // Retry failed tests
    retry: 2,
    // Watch mode configuration
    watch: {
      // Test file patterns to watch
      include: ["src/**/*.{js,css,html}"],
      // Files to ignore in watch mode
      exclude: ["node_modules/**", "dist/**"],
    },
    // Browser-like globals
    globals: true,
    // DOM environment configuration
    environmentOptions: {
      jsdom: {
        customElements: true,
        resources: "usable",
      },
    },
    // Alias configuration for imports
    alias: {
      "@": path.resolve(__dirname, "./src"),
      lit: path.resolve(__dirname, "node_modules/lit"),
      "lit/decorators.js": path.resolve(
        __dirname,
        "node_modules/lit/decorators.js"
      ),
      "lit/directives/": path.resolve(
        __dirname,
        "node_modules/lit/directives/"
      ),
      "lit-html": path.resolve(__dirname, "node_modules/lit-html"),
      "@lit/reactive-element": path.resolve(
        __dirname,
        "node_modules/@lit/reactive-element"
      ),
    },
    // Fix for deprecated deps.inline
    optimizeDeps: {
      include: [
        "@open-wc/testing",
        "@open-wc/testing-helpers",
        "@open-wc/semantic-dom-diff",
        /^lit/,
        /@lit\/.*/,
      ],
    },
    define: {
      "process.env.NODE_ENV": '"test"',
      "globalThis.DEV_MODE": "false",
      "process.env.NODE_NO_WARNINGS": "1",
    },
    bail: 1, // Stop after first failure
    // Disable workers to avoid memory issues
    maxWorkers: 1,
    minWorkers: 1,
    poolOptions: {
      threads: {
        singleThread: true, // Use a single thread
      },
      forks: {
        isolate: false, // Disable isolation to avoid memory issues
      },
    },
    // Enable experimental features for decorator support
    experimentalBabelParserPlugins: ["decorators-legacy", "classProperties"],
    // Run tests sequentially to avoid memory issues
    sequence: {
      shuffle: false,
      concurrent: false,
    },
    // Add memory management options
    pool: "forks",
    // Run tests in isolation
    isolate: false,
    // Add memory management options
    memoryLimit: "512MB", // Limit memory usage
    // Force garbage collection between tests
    forceGc: true,
    // Run tests one at a time
    singleThread: true,
  },
  resolve: {
    conditions: ["browser", "development", "default"],
    mainFields: ["module", "browser", "main"],
  },
  optimizeDeps: {
    include: ["lit", "lit-html", "@lit/reactive-element"],
    exclude: ["@web/test-runner"],
    esbuildOptions: {
      target: "es2022",
      platform: "browser",
      define: {
        "process.env.NODE_ENV": '"test"',
        "globalThis.DEV_MODE": "false",
      },
    },
  },
});
