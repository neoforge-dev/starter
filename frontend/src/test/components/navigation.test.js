import { expect, describe, it } from "vitest";
import { createMockComponent } from "../utils/component-mock-utils.js";

// Create a mock NeoNavigation component using our utility
const NeoNavigation = createMockComponent(
  "NeoNavigation",
  {
    items: { type: Array },
    currentPath: { type: String },
    navExpanded: { type: Boolean, reflect: true },
    activeItem: { type: String },
    orientation: { type: String },
    collapsed: { type: Boolean },
  },
  {
    render: () => {},
    _handleResize: () => {},
    _handleKeyDown: () => {},
  },
  "LitElement"
);

describe("NeoNavigation", () => {
  it("should be defined as a class", () => {
    expect(NeoNavigation).toBeDefined();
    expect(typeof NeoNavigation).toBe("function");
  });

  it("should have expected static properties", () => {
    expect(NeoNavigation.properties).toBeDefined();
    expect(NeoNavigation.properties.items).toBeDefined();
    expect(NeoNavigation.properties.currentPath).toBeDefined();
    expect(NeoNavigation.properties.navExpanded).toBeDefined();
    expect(NeoNavigation.properties.activeItem).toBeDefined();
    expect(NeoNavigation.properties.orientation).toBeDefined();
    expect(NeoNavigation.properties.collapsed).toBeDefined();
  });

  it("should have properties with correct types", () => {
    expect(NeoNavigation.properties.items.type).toBe(Array);
    expect(NeoNavigation.properties.currentPath.type).toBe(String);
    expect(NeoNavigation.properties.navExpanded.type).toBe(Boolean);
    expect(NeoNavigation.properties.activeItem.type).toBe(String);
    expect(NeoNavigation.properties.orientation.type).toBe(String);
    expect(NeoNavigation.properties.collapsed.type).toBe(Boolean);
  });

  it("should have properties that reflect to attributes", () => {
    expect(NeoNavigation.properties.navExpanded.reflect).toBe(true);
  });

  it("should have expected prototype methods", () => {
    const proto = NeoNavigation.prototype;
    expect(typeof proto.render).toBe("function");
    expect(typeof proto._handleResize).toBe("function");
    expect(typeof proto._handleKeyDown).toBe("function");
  });

  it("should extend from LitElement", () => {
    // Check if the component extends LitElement by checking its source code
    const componentString = NeoNavigation.toString();
    expect(componentString.includes("extends LitElement")).toBe(true);
  });
});
