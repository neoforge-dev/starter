/**
 * Silence Lit Dev Mode Warning (CommonJS version)
 *
 * This utility silences the Lit dev mode warning by patching the reactive-element.js file.
 * It's specifically designed for worker threads and other environments that require CommonJS.
 */

// Global flag to prevent multiple silencing operations
let isSilenced = false;

/**
 * Silence the Lit dev mode warning by patching the reactive-element.js file
 *
 * This function patches the reactive-element.js file to prevent it from
 * showing the dev mode warning message.
 *
 * @returns {boolean} Whether the silencing was successful
 */
function silenceLitDevModeWarning() {
  // Only silence once
  if (isSilenced) {
    return true;
  }

  isSilenced = true;

  try {
    // Set NODE_ENV to production
    if (typeof process !== "undefined" && process.env) {
      process.env.NODE_ENV = "production";
    }

    // Try to find and patch the reactive-element.js file
    try {
      // Try to require the lit module
      const litPath = require.resolve("lit");
      if (!litPath) {
        return false;
      }

      // Get the directory containing lit
      const litDir = litPath.substring(0, litPath.lastIndexOf("/"));
      const reactiveElementPath = `${litDir}/../@lit/reactive-element/development/reactive-element.js`;

      // Check if the file exists
      const fs = require("fs");
      if (!fs.existsSync(reactiveElementPath)) {
        return false;
      }

      // Read the file
      const content = fs.readFileSync(reactiveElementPath, "utf8");

      // Check if the file contains the warning code
      if (!content.includes("Lit is in dev mode")) {
        return false;
      }

      // Create a patched version of the file
      const patchedContent = content.replace(
        /console\.warn\(`Lit is in dev mode.*?`\);/s,
        "// Dev mode warning silenced"
      );

      // Write the patched file
      fs.writeFileSync(reactiveElementPath, patchedContent);

      console.log("Silenced Lit dev mode warning by patching reactive-element.js");
      return true;
    } catch (error) {
      // Failed to patch the file
      return false;
    }
  } catch (error) {
    // Failed to silence the warning
    return false;
  }
}

// Silence the warning immediately when this module is loaded
silenceLitDevModeWarning();

// Export the function for use in other modules
module.exports = silenceLitDevModeWarning;
