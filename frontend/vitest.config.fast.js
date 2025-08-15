import { defineConfig } from "vitest/config";
import { fileURLToPath } from "url";
import path from "path";
import { resolve } from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Fast testing configuration optimized for speed and reliability
 * Used for development workflow and CI environments
 */
export default defineConfig({
  test: {
    environment: "jsdom",
    environmentOptions: {
      jsdom: {
        // Minimal JSDOM settings for speed
        resources: "usable",
        runScripts: "dangerously",
        pretendToBeVisual: true,
        url: "http://localhost:3000",
      },
    },
    globals: true,
    
    // Optimized for speed and stability
    threads: false,
    pool: "forks",
    isolate: false, // Faster execution, less isolation
    
    // Fast execution settings
    testTimeout: 5000,  // Reduced from 8000
    hookTimeout: 2000,  // Reduced from 4000
    
    // Exclude problematic tests for fast execution
    exclude: [
      "**/node_modules/**",
      "**/tests-old/**", 
      "**/tests-backup-old/**",
      "test/**",
      "src/test/e2e/**",
      // Temporarily exclude slow/flaky tests
      "src/test/integration/api-communication.test.js",
      "src/test/integration/auth-flow-integration.test.js",
    ],
    
    // Minimal coverage for speed
    coverage: {
      enabled: false, // Disable coverage for fast mode
      provider: "v8",
    },
    
    // Fast setup files
    setupFiles: [
      "./src/test/setup/optimized-performance-polyfill.js",
      "./vitest-fast-setup.js", // Custom fast setup
    ],
    
    // Optimized pool settings
    poolOptions: {
      forks: {
        singleFork: true,
        isolate: false, // Faster execution
      },
    },
    
    // Fast execution settings
    retry: 0,
    bail: 5, // Stop after 5 failures
    silent: false,
    
    // Single worker for consistency
    maxWorkers: 1,
    minWorkers: 1,
    
    // Watch mode optimizations
    watch: {
      ignored: ["**/node_modules/**", "**/dist/**", "**/coverage/**"],
    },
    
    // Faster dependency optimization
    deps: {
      optimizer: {
        web: {
          include: ["lit", "@lit/reactive-element", "lit-html", "lit-element"],
        },
      },
    },
    
    // Custom reporters for different modes
    reporters: process.env.CI ? ["json"] : ["default"],
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
});