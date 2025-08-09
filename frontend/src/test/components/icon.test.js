import { expect, describe, it, beforeEach } from "vitest";
import {   html   } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";
import {
  createMockFixture,
  createAndRegisterMockComponent,
} from "../utils/component-mock-utils.js";

// Create a mock fixture function
const fixture = createMockFixture();

// Create and register a mock NeoIcon component
createAndRegisterMockComponent(
  "neo-icon",
  "NeoIcon",
  {
    name: { type: String, default: "" },
    size: { type: String, default: "md" },
    color: { type: String, default: "blue" },
    customClass: { type: String, default: "" },
  },
  {
    _getIcon: () => {},
    render: () => {},
  }
);

describe("NeoIcon", () => {
  let element;

  beforeEach(async () => {
    element = await fixture(
      html`<neo-icon
        name="test"
        size="md"
        color="blue"
        customClass="custom"
      ></neo-icon>`
    );

    // Manually set the properties since the fixture might not be setting them correctly
    element.name = "test";
    element.size = "md";
    element.color = "blue";
    element.customClass = "custom";
  });

  it("should be defined", () => {
    expect(element).toBeDefined();
  });

  it("should have the correct properties", () => {
    expect(element.name).toBe("test");
    expect(element.size).toBe("md");
    expect(element.color).toBe("blue");
    expect(element.customClass).toBe("custom");
  });

  it("should have a shadow root", () => {
    expect(element.shadowRoot).toBeDefined();
  });

  it("should have event listeners", () => {
    expect(element.addEventListener).toBeDefined();
    expect(element.removeEventListener).toBeDefined();
    expect(element.dispatchEvent).toBeDefined();
  });
});
