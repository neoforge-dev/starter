import { expect } from "@esm-bundle/chai";
import { NeoNavigation } from "../../components/ui/navigation.js";

describe("NeoNavigation", () => {
  it("should be defined as a class", () => {
    expect(NeoNavigation).to.be.a("function");
  });

  it("should have expected static properties", () => {
    expect(NeoNavigation.properties).to.exist;
    expect(NeoNavigation.properties.items).to.exist;
    expect(NeoNavigation.properties.currentPath).to.exist;
    expect(NeoNavigation.properties.navExpanded).to.exist;
    expect(NeoNavigation.properties.activeItem).to.exist;
    expect(NeoNavigation.properties.orientation).to.exist;
    expect(NeoNavigation.properties.collapsed).to.exist;
  });

  it("should have properties with correct types", () => {
    expect(NeoNavigation.properties.items.type).to.equal(Array);
    expect(NeoNavigation.properties.currentPath.type).to.equal(String);
    expect(NeoNavigation.properties.navExpanded.type).to.equal(Boolean);
    expect(NeoNavigation.properties.activeItem.type).to.equal(String);
    expect(NeoNavigation.properties.orientation.type).to.equal(String);
    expect(NeoNavigation.properties.collapsed.type).to.equal(Boolean);
  });

  it("should have properties that reflect to attributes", () => {
    expect(NeoNavigation.properties.navExpanded.reflect).to.be.true;
  });

  it("should have expected prototype methods", () => {
    const proto = NeoNavigation.prototype;
    expect(proto.render).to.be.a("function");
    expect(proto._handleResize).to.be.a("function");
    expect(proto._handleKeyDown).to.be.a("function");
  });

  it("should extend from LitElement", () => {
    // Check if the component extends LitElement by checking its source code
    const componentString = NeoNavigation.toString();
    expect(componentString.includes("extends LitElement")).to.be.true;
  });
});
