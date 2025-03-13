/**
 * Script to migrate tests from the tests/ directory to the src/test/ directory
 * This script will:
 * 1. Create a backup of the tests/ directory
 * 2. Create the necessary directories in src/test/
 * 3. Copy and transform the test files from tests/ to src/test/
 * 4. Update imports and assertions to use Vitest instead of Playwright
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const testsDir = path.join(rootDir, "tests");
const srcTestDir = path.join(rootDir, "src", "test");
const backupDir = path.join(rootDir, "tests-backup");

// Create backup directory if it doesn't exist
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

// Function to copy a directory recursively
function copyDirectory(source, destination) {
  // Create destination directory if it doesn't exist
  if (!fs.existsSync(destination)) {
    fs.mkdirSync(destination, { recursive: true });
  }

  // Get all files and directories in the source directory
  const entries = fs.readdirSync(source, { withFileTypes: true });

  // Copy each file and directory
  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name);
    const destinationPath = path.join(destination, entry.name);

    if (entry.isDirectory()) {
      // Recursively copy directory
      copyDirectory(sourcePath, destinationPath);
    } else {
      // Copy file
      fs.copyFileSync(sourcePath, destinationPath);
    }
  }
}

// Function to transform a test file
function transformTestFile(filePath) {
  // Read the file
  let content = fs.readFileSync(filePath, "utf8");

  // Replace Playwright imports with Vitest imports
  content = content.replace(
    /import\s+{\s*test,\s*expect\s*}\s+from\s+["']@playwright\/test["'];?/g,
    `import { describe, it, expect, beforeEach, afterEach } from 'vitest';`
  );

  // Replace test.describe with describe
  content = content.replace(/test\.describe/g, "describe");

  // Replace test.beforeEach with beforeEach
  content = content.replace(/test\.beforeEach/g, "beforeEach");

  // Replace test.afterEach with afterEach
  content = content.replace(/test\.afterEach/g, "afterEach");

  // Replace test with it
  content = content.replace(/test\(/g, "it(");

  // Replace page.goto with JSDOM setup
  content = content.replace(
    /await\s+page\.goto\(["']([^"']+)["']\);?/g,
    `// JSDOM setup - replace with appropriate mock
// Original: await page.goto('$1');
document.body.innerHTML = '<div id="app"></div>';`
  );

  // Replace page.evaluate with direct JavaScript
  content = content.replace(
    /await\s+page\.evaluate\(\(\)\s*=>\s*{([^}]+)}\);?/g,
    `// Direct JavaScript - replace with appropriate mock
// Original: await page.evaluate(() => {$1});
$1`
  );

  // Replace page.locator with document.querySelector
  content = content.replace(
    /await\s+page\.locator\(["']([^"']+)["']\);?/g,
    `document.querySelector('$1')`
  );

  // Write the transformed content back to the file
  fs.writeFileSync(filePath, content, "utf8");
}

// Function to process a directory
function processDirectory(source, destination) {
  // Create destination directory if it doesn't exist
  if (!fs.existsSync(destination)) {
    fs.mkdirSync(destination, { recursive: true });
  }

  // Get all files and directories in the source directory
  const entries = fs.readdirSync(source, { withFileTypes: true });

  // Process each file and directory
  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name);
    const destinationPath = path.join(destination, entry.name);

    if (entry.isDirectory()) {
      // Recursively process directory
      processDirectory(sourcePath, destinationPath);
    } else if (entry.name.endsWith(".js") || entry.name.endsWith(".ts")) {
      // Copy and transform test file
      fs.copyFileSync(sourcePath, destinationPath);
      transformTestFile(destinationPath);
    } else {
      // Copy other files as is
      fs.copyFileSync(sourcePath, destinationPath);
    }
  }
}

// Main function
function main() {
  console.log("Starting test migration...");

  // Backup the tests directory
  console.log("Backing up tests directory...");
  copyDirectory(testsDir, backupDir);

  // Process the tests directory
  console.log("Processing tests directory...");
  processDirectory(testsDir, srcTestDir);

  console.log("Test migration completed successfully!");
}

// Run the main function
main();
