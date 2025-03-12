import { defineConfig } from "vitest/config";
import { fileURLToPath } from "url";
import path from "path";
import { resolve } from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    // Use jsdom for DOM simulation
    environment: "jsdom",
    // Disable threading to avoid memory issues
    threads: false,
    // Stop after 1 failure
    maxFailures: 1,
    // Include source files in coverage
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      reportsDirectory: "./coverage",
    },
    // Setup files to run before tests
    setupFiles: [
      "./vitest.setup.js",
      "./src/test/setup/global-performance-polyfill.js",
    ],
    // Include these extensions in test files
    include: ["src/test/**/*.test.{js,mjs}"],
    // Exclude node_modules and other non-test files
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/coverage/**",
      "**/accessibility/**/*.test.js",
    ],
    // Global test timeout
    testTimeout: 10000,
    // Retry failed tests
    retry: 0,
    // Watch mode configuration
    watch: false,
    // Browser-like globals
    globals: true,
    // DOM environment configuration
    environmentOptions: {
      jsdom: {
        url: "http://localhost/",
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
      "import.meta.vitest": "undefined",
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
    hookTimeout: 10000,
    teardownTimeout: 10000,
    // Disable performance API usage
    benchmark: {
      enabled: false,
    },
    // Disable performance API usage
    perfMode: false,
    worker: {
      // Include both the worker setup file and the CommonJS version of the performance polyfill
      setupFiles: [
        "./vitest-worker-setup.js",
        "./src/test/setup/global-performance-polyfill.cjs",
      ],
    },
  },
  resolve: {
    conditions: ["browser", "development", "default"],
    mainFields: ["module", "browser", "main"],
  },
  optimizeDeps: {
    include: ["lit", "lit-html", "@lit/reactive-element"],
    exclude: ["@web/test-runner", "fsevents"],
    esbuildOptions: {
      target: "esnext",
      platform: "browser",
      define: {
        "process.env.NODE_ENV": '"test"',
        "globalThis.DEV_MODE": "false",
      },
    },
  },
  esbuild: {
    target: "esnext",
  },
  build: {
    target: "esnext",
  },
  plugins: [],
  server: {
    fs: {
      strict: false,
    },
  },
  experimental: {
    decorators: true,
  },
});
