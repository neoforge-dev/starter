import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: {
    // Use happy-dom for DOM simulation
    environment: "happy-dom",
    // Enable multi-threading
    threads: true,
    // Include source files in coverage
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/**/*.js"],
      exclude: [
        "src/**/*.test.js",
        "src/**/*.spec.js",
        "src/test/**",
        "src/**/*.stories.js",
      ],
    },
    // Setup files to run before tests
    setupFiles: ["./src/test/setup.js"],
    // Include these extensions in test files
    include: ["src/**/*.{test,spec}.js"],
    // Exclude node_modules and other non-test files
    exclude: [
      "node_modules/**",
      "dist/**",
      ".storybook/**",
      "src/**/*.stories.js",
    ],
    // Global test timeout
    testTimeout: 10000,
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
    // Custom resolver for module imports
    resolve: {
      alias: {
        "@components": resolve(__dirname, "./src/components"),
        "@services": resolve(__dirname, "./src/services"),
        "@utils": resolve(__dirname, "./src/utils"),
        "@styles": resolve(__dirname, "./src/styles"),
      },
    },
  },
});
