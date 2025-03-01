import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import {
  loadPolyfills,
  isFeatureSupported,
  initCriticalPolyfills,
  loadFeaturePolyfills,
} from "../../utils/polyfill-loader";

describe("Polyfill Loader", () => {
  beforeEach(() => {
    // Mock document.createElement
    global.document.createElement = vi.fn().mockReturnValue({
      src: "",
      onload: null,
      onerror: null,
    });

    // Mock document.head.appendChild
    global.document.head.appendChild = vi.fn((script) => {
      setTimeout(() => script.onload(), 0);
      return script;
    });

    // Mock CSS.supports
    global.CSS.supports = vi.fn().mockReturnValue(false);

    // Mock window object
    global.window.ResizeObserver = undefined;
    global.window.IntersectionObserver = undefined;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test("loadPolyfills loads required polyfills", async () => {
    await loadPolyfills(["containerQueries", "resizeObserver"]);

    expect(document.createElement).toHaveBeenCalledTimes(2);
    expect(document.head.appendChild).toHaveBeenCalledTimes(2);
  });

  test("loadPolyfills skips loading if feature is supported", async () => {
    // Mock ResizeObserver as supported
    global.window.ResizeObserver = class {};

    await loadPolyfills(["resizeObserver"]);

    expect(document.createElement).not.toHaveBeenCalled();
    expect(document.head.appendChild).not.toHaveBeenCalled();
  });

  test("isFeatureSupported returns correct status", () => {
    expect(isFeatureSupported("resizeObserver")).toBe(false);

    // Mock ResizeObserver as supported
    global.window.ResizeObserver = class {};

    expect(isFeatureSupported("resizeObserver")).toBe(true);
  });

  test("initCriticalPolyfills loads critical features", async () => {
    await initCriticalPolyfills();

    expect(document.createElement).toHaveBeenCalledTimes(2);
    expect(document.head.appendChild).toHaveBeenCalledTimes(2);
  });

  test("loadFeaturePolyfills loads specific feature", async () => {
    await loadFeaturePolyfills("containerQueries");

    expect(document.createElement).toHaveBeenCalledTimes(1);
    expect(document.head.appendChild).toHaveBeenCalledTimes(1);
  });

  test("loadFeaturePolyfills throws error for unknown feature", async () => {
    await expect(loadFeaturePolyfills("unknownFeature")).rejects.toThrow(
      "Unknown feature"
    );
  });

  test("handles polyfill load errors", async () => {
    // Mock appendChild to simulate load error
    global.document.head.appendChild = vi.fn((script) => {
      setTimeout(() => script.onerror(new Error("Failed to load")), 0);
      return script;
    });

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await initCriticalPolyfills();

    expect(consoleSpy).toHaveBeenCalledWith(
      "Error loading critical polyfills:",
      expect.any(Error)
    );
  });

  test("loads inline polyfills correctly", async () => {
    // Test view transitions polyfill
    expect("startViewTransition" in document).toBe(false);

    await loadFeaturePolyfills("viewTransitions");

    expect("startViewTransition" in document).toBe(true);
    expect(typeof document.startViewTransition).toBe("function");
  });

  test("loads form associated polyfills correctly", async () => {
    expect("attachInternals" in HTMLElement.prototype).toBe(false);

    await loadFeaturePolyfills("formAssociated");

    expect("attachInternals" in HTMLElement.prototype).toBe(true);

    // Test the polyfill functionality
    const element = document.createElement("div");
    const internals = element.attachInternals();

    expect(internals).toHaveProperty("setFormValue");
    expect(internals).toHaveProperty("form");
  });
});
