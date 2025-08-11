import { describe, it, expect } from "vitest";
import { BaseComponent } from "../components/base-component.js";
import {   LitElement   } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";

describe("BaseComponent", () => {
  it("should extend LitElement", () => {
    expect(BaseComponent.prototype instanceof LitElement).toBe(true);
  });

  it("should have createRenderRoot method", () => {
    expect(typeof BaseComponent.prototype.createRenderRoot).toBe("function");
  });

  it("should have _bindEventHandlers method", () => {
    expect(typeof BaseComponent.prototype._bindEventHandlers).toBe("function");
  });

  it("should have _ensureReady method", () => {
    expect(typeof BaseComponent.prototype._ensureReady).toBe("function");
  });

  it("should have static registerComponent method", () => {
    expect(typeof BaseComponent.registerComponent).toBe("function");
  });
});
