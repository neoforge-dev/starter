// Import our custom addon
import "./addons/suppress-warnings";

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
