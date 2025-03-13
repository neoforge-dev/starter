import { describe, it, expect, beforeEach, afterEach } from "vitest";

describe("Modern CSS Features", () => {
  beforeEach(() => {
    // Mock CSS.supports
    global.CSS = {
      supports: (feature) => {
        const supportedFeatures = [
          "container-type",
          "container-name",
          "container",
          "display: grid",
          "display: flex",
          "gap",
          "color-scheme",
        ];
        return supportedFeatures.some((f) => feature.includes(f));
      },
    };
  });

  afterEach(() => {
    // Clean up
    delete global.CSS;
  });

  it("should detect container queries support", () => {
    expect(CSS.supports("(container-type: inline-size)")).toBe(true);
  });

  it("should detect grid layout support", () => {
    expect(CSS.supports("display: grid")).toBe(true);
  });

  it("should detect gap property support", () => {
    expect(CSS.supports("gap: 1rem")).toBe(true);
  });

  it("should detect color scheme support", () => {
    expect(CSS.supports("color-scheme: dark light")).toBe(true);
  });
});
