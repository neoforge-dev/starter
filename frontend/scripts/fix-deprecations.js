#!/usr/bin/env node

/**
 * Fix Deprecation Warnings Script
 *
 * This script helps identify and fix deprecation warnings in the test suite.
 * It runs tests with NODE_OPTIONS that capture deprecation warnings and
 * provides guidance on how to fix them.
 *
 * Usage:
 *   node scripts/fix-deprecations.js [test-file-pattern]
 *
 * Example:
 *   node scripts/fix-deprecations.js src/test/components/badge.test.js
 */

import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// Get current file directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get test file pattern from command line args
const testPattern = process.argv[2] || "";

// Configure environment to capture deprecation warnings
const env = {
  ...process.env,
  NODE_OPTIONS: "--trace-deprecation --trace-warnings",
  NODE_NO_WARNINGS: "0", // Enable warnings for detection
};

console.log(`Running tests with deprecation tracing...`);
console.log(`Test pattern: ${testPattern || "all tests"}`);

// Run Vitest with deprecation tracing
const vitestProcess = spawn(
  "npx",
  ["vitest", "run", testPattern].filter(Boolean),
  {
    stdio: "pipe", // Capture output
    cwd: process.cwd(),
    env,
  }
);

// Collect deprecation warnings
let output = "";
let deprecationWarnings = new Set();

vitestProcess.stdout.on("data", (data) => {
  const chunk = data.toString();
  output += chunk;
  process.stdout.write(chunk);
});

vitestProcess.stderr.on("data", (data) => {
  const chunk = data.toString();
  output += chunk;
  process.stderr.write(chunk);

  // Extract deprecation warnings
  const lines = chunk.split("\n");
  for (const line of lines) {
    if (line.includes("DeprecationWarning:")) {
      deprecationWarnings.add(line.trim());
    }
  }
});

// Handle process exit
vitestProcess.on("exit", (code) => {
  console.log("\n\n--- Deprecation Analysis ---\n");

  if (deprecationWarnings.size === 0) {
    console.log("✅ No deprecation warnings detected!");
  } else {
    console.log(
      `⚠️ Found ${deprecationWarnings.size} unique deprecation warnings:`
    );

    // Group warnings by package
    const packageWarnings = {};

    deprecationWarnings.forEach((warning) => {
      console.log(`- ${warning}`);

      // Extract package name from warning
      const packageMatch = warning.match(/\/node_modules\/([^/]+)/);
      if (packageMatch && packageMatch[1]) {
        const pkg = packageMatch[1];
        packageWarnings[pkg] = packageWarnings[pkg] || [];
        packageWarnings[pkg].push(warning);
      }
    });

    console.log("\n--- Recommended Fixes ---\n");

    // Provide recommendations for each package
    Object.keys(packageWarnings).forEach((pkg) => {
      console.log(`📦 ${pkg}:`);

      if (pkg === "@open-wc") {
        console.log("  1. Run: npm install patch-package --save-dev");
        console.log("  2. Apply the patch for @open-wc/semantic-dom-diff");
        console.log("  3. Run: npm run postinstall");
      } else {
        console.log("  - Check for updates: npm view " + pkg + " version");
        console.log("  - Update package: npm update " + pkg);
      }

      console.log("");
    });

    // Create patches directory if it doesn't exist
    const patchesDir = path.join(process.cwd(), "patches");
    if (!fs.existsSync(patchesDir)) {
      fs.mkdirSync(patchesDir, { recursive: true });
    }
  }

  process.exit(code);
});

// Handle process errors
vitestProcess.on("error", (err) => {
  console.error("Failed to start test process:", err);
  process.exit(1);
});
