#!/usr/bin/env node

/**
 * Script to run all working tests in the src/test/ directory
 * This script will:
 * 1. Find all test files in the src/test/ directory
 * 2. Run the tests using Vitest
 * 3. Report the results
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const srcTestDir = path.join(rootDir, "src", "test");

// Function to find all test files in a directory
function findTestFiles(directory) {
  const testFiles = [];

  // Function to recursively search for test files
  function searchDirectory(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        // Recursively search subdirectories
        searchDirectory(fullPath);
      } else if (
        entry.name.endsWith(".test.js") ||
        entry.name.endsWith(".spec.js")
      ) {
        // Add test file to the list
        testFiles.push(fullPath);
      }
    }
  }

  // Start the search
  searchDirectory(directory);

  return testFiles;
}

// Function to run a test file
function runTestFile(testFile) {
  try {
    console.log(`Running test file: ${testFile}`);
    const relativePath = path.relative(rootDir, testFile);
    execSync(`npx vitest run ${relativePath}`, { stdio: "inherit" });
    return true;
  } catch (error) {
    console.error(`Error running test file: ${testFile}`);
    console.error(error.message);
    return false;
  }
}

// Main function
function main() {
  console.log("Finding all test files in src/test/ directory...");
  const testFiles = findTestFiles(srcTestDir);
  console.log(`Found ${testFiles.length} test files.`);

  console.log("Running tests...");
  let passedTests = 0;
  let failedTests = 0;

  for (const testFile of testFiles) {
    const passed = runTestFile(testFile);
    if (passed) {
      passedTests++;
    } else {
      failedTests++;
    }
  }

  console.log(`Test run completed.`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${failedTests}`);
  console.log(`Total: ${testFiles.length}`);
}

// Run the main function
main();
