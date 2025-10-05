import { defineConfig } from "vitest/config";
import { fileURLToPath } from "url";
import path from "path";
import { resolve } from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  cacheDir: "node_modules/.vitest", // Set cache directory at root level
  test: {
    // Use jsdom for maximum compatibility with Lit dev-mode parsing
    environment: "jsdom",
    globals: true,
    reporters: ["default"],

    // Reasonable timeouts
    testTimeout: 10000,
    hookTimeout: 5000,

    // Exclude old test directories and E2E/Playwright tests
    exclude: [
      // Legacy test directories - old test framework, no longer maintained
      "**/tests-old/**",
      "**/tests-backup-old/**",
      "**/node_modules/**",
      "test/**",

      // E2E TESTS - Require Playwright test runner (not Vitest/JSDOM)
      // To run: Set up Playwright and use `npx playwright test`
      "src/test/e2e/**",                  // E2E component tests (button, input, page navigation)
      "src/test/visual/**",               // Visual regression tests (requires Percy/Chromatic)

      // ACCESSIBILITY TESTS - Require real browser with axe-core
      "src/test/accessibility/page-accessibility.test.js",      // Uses @axe-core/playwright
      "src/test/accessibility/component-accessibility.test.js", // Uses axe-core (enable when axe-core/vitest is set up)

      // BROWSER COMPATIBILITY - Requires real browser environment
      "src/test/browser-compatibility.test.js.skip",  // Cross-browser feature detection (Chrome, Firefox, Safari)

      // ADVANCED INTEGRATION TESTS - Complex multi-component scenarios
      // These need complete component ecosystem and may be too slow for unit tests
      "src/test/advanced/cross-browser-comprehensive.test.js",  // Multi-browser compatibility suite
      "src/test/advanced/integration-comprehensive.test.js",    // Full app integration scenarios

      // COMPONENT-SPECIFIC EXCLUSIONS
      // These tests have specific requirements that make them unsuitable for standard unit testing
      "src/components/core/memory-monitor.test.js",  // Requires performance.memory API (Chrome-only)
      "src/test/pages/dashboard-page.test.js",       // Complex component with many dependencies
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