import { describe, it, expect, vi } from "vitest";

describe("Modern CSS Features", () => {
  beforeEach(() => {
    // Mock CSS.supports
    global.CSS = {
      supports: vi.fn().mockImplementation((property, value) => {
        if (property === "container-type" && value === "inline-size")
          return true;
        if (property === "display" && value === "subgrid") return false;
        if (property === ":has(.selector)") return true;
        return false;
      }),
    };
  });

  it("should support container queries", () => {
    expect(CSS.supports("container-type", "inline-size")).toBe(true);
  });

  it("should not support subgrid", () => {
    expect(CSS.supports("display", "subgrid")).toBe(false);
  });

  it("should support :has selector", () => {
    expect(CSS.supports(":has(.selector)")).toBe(true);
  });

  it("should detect unsupported features", () => {
    expect(CSS.supports("some-future-property", "value")).toBe(false);
  });
});
