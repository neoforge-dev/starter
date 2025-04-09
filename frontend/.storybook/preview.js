import { setCustomElementsManifest } from "@storybook/web-components";
import { html, css, LitElement } from "lit";
import { unsafeHTML } from "lit/directives/unsafe-html.js";

// Import global styles
import "../src/styles/global.css";

// Make lit available to stories
window.lit = { html, css, LitElement, unsafeHTML };

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

// Define default parameters
export const parameters = {
  actions: { argTypesRegex: "^on[A-Z].*" },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
  docs: {
    source: {
      state: "open",
    },
  },
  options: {
    storySort: {
      order: [
        "Introduction",
        "Atoms",
        "Molecules",
        "Organisms",
        "Templates",
        "Pages",
      ],
    },
  },
};

// Define decorators
export const decorators = [
  (Story) => {
    // Add any global decorators here
    return Story();
  },
];

/** @type { import('@storybook/web-components').Preview } */
const preview = {
  parameters: parameters,
  decorators: decorators,
};

export default preview;
