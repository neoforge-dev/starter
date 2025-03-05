import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Import the functions from our mock implementation
import {
  loadPolyfills,
  isFeatureSupported,
  initCriticalPolyfills,
  loadFeaturePolyfills,
} from "./polyfill-loader.mock.js";

describe("Polyfill Loader", () => {
  beforeEach(() => {
    // Mock document.createElement
    global.document = {
      createElement: vi.fn(() => ({
        src: "",
        onload: null,
        onerror: null,
      })),
      body: {
        innerHTML: "",
        appendChild: vi.fn(),
      },
      // Remove startViewTransition for the view transitions test
      startViewTransition: undefined,
    };

    // Mock CSS.supports
    global.CSS = {
      supports: vi.fn((prop) => {
        if (prop === "container-type: inline-size") return true;
        if (prop === "display: subgrid") return false;
        if (prop === ":has(.selector)") return true;
        return false;
      }),
    };

    // Mock window
    global.window = {
      ResizeObserver: undefined,
    };

    // Mock console methods
    global.console = {
      log: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("loadPolyfills loads required polyfills", async () => {
    const polyfills = [
      {
        name: "testPolyfill",
        test: () => false,
        load: vi.fn(() => Promise.resolve()),
      },
    ];

    await loadPolyfills(polyfills);
    expect(polyfills[0].load).toHaveBeenCalled();
  });

  it("loadPolyfills skips loading if feature is supported", async () => {
    const polyfills = [
      {
        name: "testPolyfill",
        test: () => true,
        load: vi.fn(() => Promise.resolve()),
      },
    ];

    await loadPolyfills(polyfills);
    expect(polyfills[0].load).not.toHaveBeenCalled();
  });

  it("isFeatureSupported returns correct status", () => {
    // Test with ResizeObserver (should be false since we mocked it as undefined)
    expect(isFeatureSupported("resizeObserver")).toBe(false);

    // Test with container queries (should be true based on our CSS.supports mock)
    expect(isFeatureSupported("containerQueries")).toBe(true);

    // Test with subgrid (should be false based on our CSS.supports mock)
    expect(isFeatureSupported("subgrid")).toBe(false);

    // Test with :has selector (should be true based on our CSS.supports mock)
    expect(isFeatureSupported("hasSelector")).toBe(true);

    // Test with unknown feature (should be false)
    expect(isFeatureSupported("unknownFeature")).toBe(false);
  });

  it("initCriticalPolyfills loads critical features", async () => {
    // Just verify that it runs without errors
    await expect(initCriticalPolyfills()).resolves.not.toThrow();

    // We could also check that ResizeObserver is defined after initialization
    expect(window.ResizeObserver).toBeDefined();
  });

  it("loadFeaturePolyfills loads specific feature", async () => {
    // Just verify that it runs without errors
    await expect(loadFeaturePolyfills("resizeObserver")).resolves.not.toThrow();

    // We could also check that ResizeObserver is defined after loading
    expect(window.ResizeObserver).toBeDefined();
  });

  it("loadFeaturePolyfills throws error for unknown feature", async () => {
    await expect(loadFeaturePolyfills("unknownFeature")).rejects.toThrow(
      "Unknown feature: unknownFeature"
    );
  });

  it("handles polyfill load errors", async () => {
    const errorPolyfill = {
      name: "errorPolyfill",
      test: () => false,
      load: vi.fn(() => Promise.reject(new Error("Failed to load"))),
    };

    const consoleSpy = vi.spyOn(console, "error");
    await loadPolyfills([errorPolyfill]);

    expect(consoleSpy).toHaveBeenCalledWith(
      "Error loading polyfill errorPolyfill:",
      expect.any(Error)
    );
  });

  it("loads view transitions polyfill correctly", async () => {
    // Reset the document object for this test
    delete document.startViewTransition;

    // Verify startViewTransition is not defined
    expect("startViewTransition" in document).toBe(false);

    await loadFeaturePolyfills("viewTransitions");

    // After loading, document.startViewTransition should be defined
    expect("startViewTransition" in document).toBe(true);
    expect(document.startViewTransition).toBeDefined();
  });

  it("loads form associated polyfills correctly", async () => {
    // Mock the ElementInternals constructor
    global.ElementInternals = undefined;

    await loadFeaturePolyfills("formAssociated");

    // After loading, ElementInternals should be defined
    expect(global.ElementInternals).toBeDefined();
  });
});
