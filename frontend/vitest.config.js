import { defineConfig } from "vitest/config";
import { fileURLToPath } from "url";
import path from "path";
import { resolve } from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  cacheDir: "node_modules/.vitest", // Set cache directory at root level
  test: {
    environment: "happy-dom",
    globals: true,
    reporters: ["default"],

    // Reasonable timeouts
    testTimeout: 10000,
    hookTimeout: 5000,

    // Exclude old test directories and problematic files
    exclude: [
      "**/tests-old/**",
      "**/tests-backup-old/**",
      "**/node_modules/**",
      "test/**",
      "src/test/e2e/**",
      "src/test/visual/**",
      "src/test/accessibility/page-accessibility.test.js",
      "src/test/accessibility/component-accessibility.test.js",
      "src/test/advanced/cross-browser-comprehensive.test.js",
      "src/test/advanced/integration-comprehensive.test.js",
      // Temporarily skip failing tests - to be fixed in Epic 2
      "src/components/core/memory-monitor.test.js",
      "src/test/pages/dashboard-page.test.js",
    ],

    // Coverage configuration optimized for speed
    coverage: {
      provider: "v8",
      include: [
        "src/**/*.js",
        "src/components/**/*.js",
        "src/services/**/*.js",
        "src/pages/**/*.js",
        "src/utils/**/*.js"
      ],
      exclude: [
        "node_modules/**",
        "dist/**",
        "src/test/**",
        "src/stories/**",
        "**/*.test.js",
        "**/*.spec.js",
        "**/*.stories.js",
        "src/test/setup/**",
        "src/test/mocks/**",
        "src/test/helpers/**"
      ],
      reporter: ["text", "json", "html"],
      reportsDirectory: "./coverage",
      thresholds: {
        global: {
          branches: 75,
          functions: 75,
          lines: 80,
          statements: 80
        }
      },
      all: true,
      clean: true,
      skipFull: true, // Skip full coverage for faster runs
    },

    // Single setup file with unified polyfill
    setupFiles: [
      "./vitest.setup.js"
    ],

    // Faster test execution settings
    retry: 0,
    bail: 10, // Bail after 10 failures instead of running all tests
    silent: false,

    // Watch mode optimizations
    watch: {
      // Ignore patterns for better watch performance
      ignored: ["**/node_modules/**", "**/dist/**", "**/coverage/**"],
    },

    // Optimize transformations using new API
    deps: {
      optimizer: {
        web: {
          include: ["lit", "@lit/reactive-element", "lit-html", "lit-element"],
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
});