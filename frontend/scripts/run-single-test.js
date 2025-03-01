#!/usr/bin/env node

/**
 * Script to run a single test file with Vitest
 * Usage: node scripts/run-single-test.js <test-file-path>
 */

import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get the test file path from command line arguments
const testFilePath = process.argv[2];

if (!testFilePath) {
  console.error("Please provide a test file path");
  process.exit(1);
}

// Resolve the absolute path to the test file
const absoluteTestFilePath = path.resolve(process.cwd(), testFilePath);

console.log(`Running test: ${absoluteTestFilePath}`);

// Run Vitest with the test file
const vitest = spawn(
  "node",
  [
    "--max-old-space-size=8192",
    "node_modules/vitest/vitest.mjs",
    "run",
    absoluteTestFilePath,
    "--config",
    path.resolve(__dirname, "../vitest.config.js"),
  ],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      NODE_OPTIONS: "--experimental-vm-modules",
    },
  }
);

vitest.on("close", (code) => {
  process.exit(code);
});
