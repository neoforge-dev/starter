/**
 * Package Patches (CommonJS version)
 * 
 * This file contains patches for third-party packages that have issues in the test environment.
 * It's specifically designed for worker threads and other environments that require CommonJS.
 */

// Global flag to prevent multiple patching operations
let isPatched = false;

/**
 * Patch the @open-wc/semantic-dom-diff package to fix the deprecation warning
 * about missing "main" or "exports" field
 * 
 * @returns {boolean} Whether the patching was successful
 */
function patchSemanticDomDiff() {
  // Only patch once
  if (isPatched) {
    return true;
  }

  isPatched = true;

  try {
    // Try to find and patch the package.json file
    try {
      // Try to require the @open-wc/semantic-dom-diff module
      const semanticDomDiffPath = require.resolve("@open-wc/semantic-dom-diff");
      if (!semanticDomDiffPath) {
        return false;
      }

      // Get the directory containing the module
      const semanticDomDiffDir = semanticDomDiffPath.substring(
        0,
        semanticDomDiffPath.lastIndexOf("/")
      );
      const packageJsonPath = `${semanticDomDiffDir}/../package.json`;

      // Check if the file exists
      const fs = require("fs");
      if (!fs.existsSync(packageJsonPath)) {
        return false;
      }

      // Read the file
      const content = fs.readFileSync(packageJsonPath, "utf8");
      const packageJson = JSON.parse(content);

      // Check if the package.json already has a main field
      if (packageJson.main) {
        return true;
      }

      // Add the main field
      packageJson.main = "./index.js";

      // Write the updated file
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

      console.log("Patched @open-wc/semantic-dom-diff package.json to add main field");
      return true;
    } catch (error) {
      // Failed to patch the file
      return false;
    }
  } catch (error) {
    // Failed to patch the package
    return false;
  }
}

// Apply the patches immediately when this module is loaded
patchSemanticDomDiff();

// Export the functions for use in other modules
module.exports = {
  patchSemanticDomDiff
}; 