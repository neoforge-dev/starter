/**
 * Mock polyfill loader utility for testing
 */

/**
 * Detects browser type and version
 * @returns {Object} Browser information
 */
export function detectBrowser() {
  return {
    isChrome: true,
    isFirefox: false,
    isSafari: false,
    isEdge: false,
    isMobile: false,
  };
}

/**
 * Detects support for specific features
 * @returns {Object} Feature support information
 */
export function detectFeatures() {
  return {
    containerQueries: true,
    subgrid: false,
    viewTransitions: true,
    declarativeShadowDOM: false,
    cssHas: true,
  };
}

/**
 * Initializes all necessary polyfills and browser fixes
 * @returns {Promise} Promise that resolves when all polyfills are loaded
 */
export async function initPolyfills() {
  console.log("Initializing polyfills...");
  const startTime = performance.now();

  // Mock implementation - does nothing
  const loadTime = performance.now() - startTime;
  console.log(`Polyfills initialized in ${loadTime.toFixed(2)}ms`);

  return Promise.resolve();
}

// Export browser and feature detection for use in components
export { detectBrowser as isBrowser, detectFeatures as hasFeature };

/**
 * Polyfill definitions
 */
const POLYFILLS = {
  resizeObserver: {
    name: "resizeObserver",
    test: () => typeof window.ResizeObserver !== "undefined",
    load: async () => {
      window.ResizeObserver = class ResizeObserver {
        constructor(callback) {
          this.callback = callback;
        }
        observe() {}
        unobserve() {}
        disconnect() {}
      };
      console.log("ResizeObserver polyfill loaded");
    },
  },
  containerQueries: {
    name: "containerQueries",
    test: () => CSS.supports("container-type: inline-size"),
    load: async () => {
      console.log("Container queries polyfill loaded");
    },
  },
  subgrid: {
    name: "subgrid",
    test: () => CSS.supports("display: subgrid"),
    load: async () => {
      console.log("Subgrid polyfill loaded");
    },
  },
  hasSelector: {
    name: "hasSelector",
    test: () => CSS.supports(":has(.selector)"),
    load: async () => {
      console.log(":has selector polyfill loaded");
    },
  },
  viewTransitions: {
    name: "viewTransitions",
    test: () => "startViewTransition" in document,
    load: async () => {
      document.startViewTransition = function (callback) {
        return {
          ready: Promise.resolve(),
          finished: Promise.resolve(),
          updateCallbackDone: Promise.resolve(),
        };
      };
      console.log("View transitions polyfill loaded");
    },
  },
  formAssociated: {
    name: "formAssociated",
    test: () => typeof window.ElementInternals !== "undefined",
    load: async () => {
      global.ElementInternals = class ElementInternals {
        constructor() {
          this.form = null;
          this.labels = [];
        }
        setFormValue() {}
        setValidity() {}
      };
      console.log("Form associated polyfill loaded");
    },
  },
};

/**
 * Load polyfills that are not already supported
 * @param {Array} polyfills - Array of polyfill objects with test and load methods
 * @returns {Promise} - Promise that resolves when all polyfills are loaded
 */
export async function loadPolyfills(polyfills) {
  console.log(
    "Loading polyfills:",
    polyfills.map((p) => p.name || p)
  );

  try {
    const loadPromises = polyfills
      .filter((polyfill) => !polyfill.test())
      .map(async (polyfill) => {
        try {
          await polyfill.load();
        } catch (error) {
          console.error(`Error loading polyfill ${polyfill.name}:`, error);
        }
      });

    await Promise.all(loadPromises);
  } catch (error) {
    console.error("Error loading polyfills:", error);
  }
}

/**
 * Check if a feature is supported
 * @param {string} feature - Feature name
 * @returns {boolean} - Whether the feature is supported
 */
export function isFeatureSupported(feature) {
  const polyfill = POLYFILLS[feature];

  if (!polyfill) {
    return false;
  }

  // For testing purposes, we need to ensure this returns false initially
  if (feature === "resizeObserver") {
    // Explicitly check for undefined to match our test expectations
    return window.ResizeObserver !== undefined;
  }

  return polyfill.test();
}

/**
 * Initialize critical polyfills
 * @returns {Promise} - Promise that resolves when critical polyfills are loaded
 */
export async function initCriticalPolyfills() {
  const criticalPolyfills = [POLYFILLS.resizeObserver];

  await loadPolyfills(criticalPolyfills);
}

/**
 * Load polyfills for a specific feature
 * @param {string} feature - Feature name
 * @returns {Promise} - Promise that resolves when feature polyfills are loaded
 */
export async function loadFeaturePolyfills(feature) {
  if (!POLYFILLS[feature]) {
    throw new Error(`Unknown feature: ${feature}`);
  }

  await loadPolyfills([POLYFILLS[feature]]);
}
