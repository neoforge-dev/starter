/**
 * Polyfill loader utility for handling browser compatibility
 * @module utils/polyfill-loader
 */

// Core polyfills that should always be loaded
import "@webcomponents/webcomponentsjs";
import "lit/polyfill-support.js";
import "intersection-observer";
import "resize-observer-polyfill";

/**
 * Detects browser type and version
 * @returns {Object} Browser information
 */
export function detectBrowser() {
  const ua = navigator.userAgent;
  const browsers = {
    isChrome: /Chrome/.test(ua) && !/Edge/.test(ua),
    isFirefox: /Firefox/.test(ua),
    isSafari: /Safari/.test(ua) && !/Chrome/.test(ua),
    isEdge: /Edge/.test(ua),
    isMobile: /Mobile/.test(ua),
  };

  return browsers;
}

/**
 * Detects support for specific features
 * @returns {Object} Feature support information
 */
export function detectFeatures() {
  return {
    containerQueries: CSS.supports("(container-type: inline-size)"),
    subgrid: CSS.supports("(display: subgrid)"),
    viewTransitions: "startViewTransition" in document,
    declarativeShadowDOM:
      Object.prototype.hasOwnProperty.call(HTMLTemplateElement.prototype, "shadowRoot"),
    cssHas: CSS.supports("selector(:has(*))"),
  };
}

/**
 * Loads browser-specific fixes
 * @returns {Promise} Promise that resolves when browser-specific fixes are loaded
 */
async function loadBrowserFixes() {
  const browser = detectBrowser();

  if (browser.isSafari) {
    await Promise.all([
      import("./fixes/safari-shadow-dom-fix.js"),
      import("./fixes/safari-grid-fix.js"),
    ]);
  }

  if (browser.isFirefox) {
    await import("./fixes/firefox-container-query-fix.js");
  }
}

/**
 * Loads feature-specific polyfills based on browser support
 * @returns {Promise} Promise that resolves when feature polyfills are loaded
 */
async function loadAllFeaturePolyfills() {
  const features = detectFeatures();
  const polyfillPromises = [];

  if (!features.containerQueries) {
    try {
      polyfillPromises.push(import("container-query-polyfill"));
    } catch (error) {
      console.warn("Container query polyfill not available:", error);
    }
  }

  if (!features.subgrid) {
    try {
      // Subgrid polyfill is not available yet, skip for now
      console.warn("Subgrid polyfill not available");
    } catch (error) {
      console.warn("Subgrid polyfill not available:", error);
    }
  }

  if (!features.viewTransitions) {
    try {
      polyfillPromises.push(import("view-transition-polyfill"));
    } catch (error) {
      console.warn("View transitions polyfill not available:", error);
    }
  }

  await Promise.allSettled(polyfillPromises);
}

/**
 * Initializes all necessary polyfills and browser fixes
 * @returns {Promise} Promise that resolves when all polyfills are loaded
 */
export async function initPolyfills() {
  console.log("Initializing polyfills...");
  const startTime = performance.now();

  try {
    await Promise.all([loadBrowserFixes(), loadAllFeaturePolyfills()]);

    const loadTime = performance.now() - startTime;
    console.log(`Polyfills initialized in ${loadTime.toFixed(2)}ms`);
  } catch (error) {
    console.error("Error loading polyfills:", error);
    // Report error to analytics service
    window.analyticsService?.reportError("polyfill-loader", error);
  }
}

// Export browser and feature detection for use in components
export { detectBrowser as isBrowser, detectFeatures as hasFeature };

/**
 * Polyfill loader utility
 * Handles dynamic loading of polyfills based on feature detection
 */

const POLYFILLS = {
  containerQueries: {
    test: () => CSS.supports("(container-type: inline-size)"),
    url: "https://cdn.jsdelivr.net/npm/container-query-polyfill@1/dist/container-query-polyfill.modern.js",
  },
  viewTransitions: {
    test: () => "startViewTransition" in document,
    load: () => {
      if (!document.startViewTransition) {
        document.startViewTransition = (callback) => {
          const promise = Promise.resolve();
          callback();
          return {
            ready: promise,
            finished: promise,
            updateCallbackDone: promise,
          };
        };
      }
    },
  },
  resizeObserver: {
    test: () => "ResizeObserver" in window,
    url: "https://cdn.jsdelivr.net/npm/@juggle/resize-observer/lib/resize-observer.umd.js",
  },
  intersectionObserver: {
    test: () => "IntersectionObserver" in window,
    url: "https://cdn.jsdelivr.net/npm/intersection-observer@0.12.2/intersection-observer.js",
  },
  formAssociated: {
    test: () => "attachInternals" in HTMLElement.prototype,
    load: () => {
      if (!("attachInternals" in HTMLElement.prototype)) {
        // Basic fallback for form-associated custom elements
        HTMLElement.prototype.attachInternals = function () {
          const element = this;
          return {
            form: null,
            setFormValue(value) {
              element.dispatchEvent(
                new CustomEvent("input", { detail: value })
              );
            },
          };
        };
      }
    },
  },
};

/**
 * Load a polyfill by URL
 * @param {string} url - The URL of the polyfill
 * @returns {Promise} - Resolves when the polyfill is loaded
 */
const loadPolyfillScript = (url) => {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = url;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

/**
 * Load required polyfills based on feature detection
 * @param {string[]} features - Array of feature names to check
 * @returns {Promise} - Resolves when all required polyfills are loaded
 */
export const loadPolyfills = async (features = Object.keys(POLYFILLS)) => {
  const polyfillsToLoad = [];

  for (const feature of features) {
    const polyfill = POLYFILLS[feature];
    if (!polyfill) {
      console.warn(`Unknown feature: ${feature}`);
      continue;
    }

    if (!polyfill.test()) {
      if (polyfill.url) {
        polyfillsToLoad.push(loadPolyfillScript(polyfill.url));
      } else if (polyfill.load) {
        polyfill.load();
      }
    }
  }

  await Promise.all(polyfillsToLoad);
};

/**
 * Check if a feature is supported
 * @param {string} feature - The feature to check
 * @returns {boolean} - Whether the feature is supported
 */
export const isFeatureSupported = (feature) => {
  const polyfill = POLYFILLS[feature];
  return polyfill ? polyfill.test() : false;
};

/**
 * Initialize critical polyfills synchronously
 * Should be called as early as possible in the application lifecycle
 */
export const initCriticalPolyfills = () => {
  const criticalFeatures = ["resizeObserver", "intersectionObserver"];
  loadPolyfills(criticalFeatures).catch((error) => {
    console.error("Error loading critical polyfills:", error);
  });
};

/**
 * Load feature-specific polyfills
 * @param {string} feature - The feature to load polyfills for, or undefined to load all feature polyfills
 * @returns {Promise} - Resolves when the polyfills are loaded
 */
export const loadFeaturePolyfills = async (feature) => {
  if (feature) {
    if (!POLYFILLS[feature]) {
      throw new Error(`Unknown feature: ${feature}`);
    }
    await loadPolyfills([feature]);
  } else {
    const features = detectFeatures();
    const polyfillPromises = [];

    if (!features.containerQueries) {
      try {
        polyfillPromises.push(loadPolyfills(["containerQueries"]));
      } catch (error) {
        console.warn("Container query polyfill not available:", error);
      }
    }

    if (!features.subgrid) {
      try {
        // Subgrid polyfill is not available yet, skip for now
        console.warn("Subgrid polyfill not available");
      } catch (error) {
        console.warn("Subgrid polyfill not available:", error);
      }
    }

    if (!features.viewTransitions) {
      try {
        polyfillPromises.push(loadPolyfills(["viewTransitions"]));
      } catch (error) {
        console.warn("View transitions polyfill not available:", error);
      }
    }

    await Promise.allSettled(polyfillPromises);
  }
};
