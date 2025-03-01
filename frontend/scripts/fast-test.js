#!/usr/bin/env node

/**
 * Fast Test Runner
 *
 * This script runs Vitest with optimized settings for faster failure detection:
 * - Reduced timeout (3s instead of default 5s)
 * - Bail on first failure (--bail=1 option)
 * - No watch mode
 * - Single thread execution for better isolation
 * - Detailed error reporting
 *
 * Usage:
 *   node scripts/fast-test.js [test-file-pattern]
 *
 * Example:
 *   node scripts/fast-test.js src/test/components/badge.test.js
 */

import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

// Get current file directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

// Get test file pattern from command line args
const testPattern = process.argv[2] || "";

// Configure Vitest options for faster failure detection
// Using fewer options to avoid memory issues
const vitestArgs = [
  "run",
  "--bail=1", // Stop on first failure
  "--reporter=verbose", // More detailed output
  "--testTimeout=3000", // Shorter timeout (3s)
  testPattern,
].filter(Boolean);

console.log(`Running tests with fast failure detection...`);
console.log(`Command: vitest ${vitestArgs.join(" ")}`);

// Run Vitest with the configured options
const vitestProcess = spawn("npx", ["vitest", ...vitestArgs], {
  stdio: "inherit",
  cwd: rootDir, // Ensure we're running from the frontend directory
  env: {
    ...process.env,
    NODE_ENV: "test", // Run in test mode
    NODE_OPTIONS: "--max-old-space-size=4096", // Increase memory limit
    NODE_NO_WARNINGS: "1", // Suppress Node.js warnings
  },
});

// Handle process exit
vitestProcess.on("exit", (code) => {
  process.exit(code);
});

// Handle process errors
vitestProcess.on("error", (err) => {
  console.error("Failed to start test process:", err);
  process.exit(1);
});
