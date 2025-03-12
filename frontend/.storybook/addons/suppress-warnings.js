/**
 * Custom Storybook addon to suppress specific warnings
 */
import { addons } from "@storybook/manager-api";
import { STORY_RENDERED } from "@storybook/core-events";

// Register the addon
addons.register("suppress-warnings", () => {
  // Listen for when stories are rendered
  addons.getChannel().on(STORY_RENDERED, () => {
    // Override console.warn to filter out specific warnings
    if (console.warn && !console.warn.__suppressed) {
      const originalWarn = console.warn;
      console.warn = function (...args) {
        // Filter out specific warnings
        if (args[0] && typeof args[0] === "string") {
          if (
            args[0].includes("Unable to index files") ||
            args[0].includes("Expecting Unicode escape sequence") ||
            args[0].includes("No matching indexer found")
          ) {
            return;
          }
        }
        return originalWarn.apply(console, args);
      };
      console.warn.__suppressed = true;
    }
  });
});
