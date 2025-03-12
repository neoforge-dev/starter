import { html } from "lit";
import { setCustomElementsManifest } from "@storybook/web-components";

// Suppress specific warnings
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

// Import all web components
try {
  // This is a dynamic import to avoid errors if the file doesn't exist
  import("../src/components/index.js").catch(() => {
    console.log(
      "No components index file found, skipping automatic component registration"
    );
  });
} catch (e) {
  console.log("Error importing components:", e);
}

/** @type { import('@storybook/web-components').Preview } */
const preview = {
  parameters: {
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    options: {
      storySort: {
        order: ["Introduction", "Atoms", "Molecules", "Organisms", "Pages"],
      },
    },
    docs: {
      source: {
        state: "open",
      },
    },
  },
  decorators: [
    (Story) => {
      // Ensure all components are defined before rendering the story
      return Story();
    },
  ],
};

export default preview;
