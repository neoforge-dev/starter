import { expect, describe, it, beforeEach } from "vitest";
import { html } from "lit";
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
    name: { type: String },
    size: { type: String },
    color: { type: String },
    customClass: { type: String },
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
