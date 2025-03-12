/**
 * Package Patches
 *
 * This file contains patches for third-party packages to fix issues or warnings.
 */

// Patch for @open-wc/semantic-dom-diff package to fix the deprecation warning
// about missing "main" or "exports" field
function patchSemanticDomDiff() {
  try {
    const fs = require("fs");
    const path = require("path");

    // Path to the package.json file
    const packageJsonPath = path.resolve(
      process.cwd(),
      "node_modules",
      "@open-wc",
      "semantic-dom-diff",
      "package.json"
    );

    // Check if the file exists
    if (fs.existsSync(packageJsonPath)) {
      // Read the package.json file
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));

      // Add the "exports" field if it doesn't exist
      if (!packageJson.exports) {
        packageJson.exports = {
          ".": "./index.js",
          "./get-diffable-html.js": "./get-diffable-html.js",
          "./get-dom-diff.js": "./get-dom-diff.js",
        };

        // Write the updated package.json file
        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

        console.log(
          'Patched @open-wc/semantic-dom-diff package.json to add "exports" field'
        );
      }
    }
  } catch (error) {
    console.warn(
      "Could not patch @open-wc/semantic-dom-diff package:",
      error.message
    );
  }
}

// Apply the patches
patchSemanticDomDiff();

// Export the patch functions
export { patchSemanticDomDiff };
