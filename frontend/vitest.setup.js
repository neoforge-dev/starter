/**
 * Vitest Setup File
 * 
 * This file is loaded before any tests run and sets up the global environment.
 * It uses a single unified polyfill to avoid conflicts.
 */

// Import the unified polyfill (this is the ONLY polyfill import we need)
import "./src/test/setup/unified-test-polyfill.js";

// Import package patches
import { patchSemanticDomDiff } from "./src/test/setup/package-patches.js";

// Apply package patches
patchSemanticDomDiff();

// Ensure browser polyfills are applied now that JSDOM should be available
if (typeof window !== 'undefined' && globalThis.__applyBrowserPolyfills) {
  globalThis.__applyBrowserPolyfills();
}

console.log("✅ Vitest setup complete - unified polyfill loaded");