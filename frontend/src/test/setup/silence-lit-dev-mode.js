/**
 * Silence Lit Dev Mode Warning
 *
 * This file directly patches the Lit reactive-element module to silence the dev mode warning.
 */

// Set NODE_ENV to production
if (typeof process !== "undefined" && process.env) {
  process.env.NODE_ENV = "production";
}

// Define a global variable to indicate that we're in production mode
if (typeof globalThis !== "undefined") {
  globalThis.DEV_MODE = false;

  // Create a global flag to track whether the warning has been silenced
  if (!globalThis.__LIT_DEV_MODE_WARNING_SILENCED__) {
    globalThis.__LIT_DEV_MODE_WARNING_SILENCED__ = false;
  }
}

// Patch the Lit reactive-element module to silence the dev mode warning
function silenceLitDevModeWarning() {
  // Check if the warning has already been silenced
  if (
    typeof globalThis !== "undefined" &&
    globalThis.__LIT_DEV_MODE_WARNING_SILENCED__
  ) {
    return;
  }

  try {
    // Try to find the Lit reactive-element module
    const fs = require("fs");
    const path = require("path");

    // Path to the reactive-element.js file
    const reactiveElementPath = path.resolve(
      process.cwd(),
      "node_modules",
      "@lit",
      "reactive-element",
      "development",
      "reactive-element.js"
    );

    // Check if the file exists
    if (fs.existsSync(reactiveElementPath)) {
      // Read the file
      let content = fs.readFileSync(reactiveElementPath, "utf8");

      // Replace the issueWarning function with a no-op
      content = content.replace(
        /export const issueWarning[\s\S]*?}/,
        "export const issueWarning = () => {};"
      );

      // Write the updated file
      fs.writeFileSync(reactiveElementPath, content);

      console.log(
        "Silenced Lit dev mode warning by patching reactive-element.js"
      );

      // Set the global flag to indicate that the warning has been silenced
      if (typeof globalThis !== "undefined") {
        globalThis.__LIT_DEV_MODE_WARNING_SILENCED__ = true;
      }
    }
  } catch (error) {
    console.warn("Could not silence Lit dev mode warning:", error.message);
  }
}

// Apply the patch
silenceLitDevModeWarning();

// Export the function
export { silenceLitDevModeWarning };
