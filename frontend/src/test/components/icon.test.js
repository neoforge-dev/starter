import { expect } from "@esm-bundle/chai";
import { fixture, html } from "@open-wc/testing";
import "../../../src/components/atoms/icon/icon.js";

describe("NeoIcon", () => {
  let element;

  beforeEach(async () => {
    element = await fixture(html`<neo-icon name="check"></neo-icon>`);
  });

  it("renders with default properties", () => {
    expect(element.name).to.equal("check");
    expect(element.size).to.equal("medium");
    expect(element.color).to.equal("");
  });

  it("renders SVG element", () => {
    const svg = element.shadowRoot.querySelector("svg");
    expect(svg).to.exist;
    expect(svg).to.have.attribute("viewBox", "0 0 24 24");
    expect(svg).to.have.attribute("aria-hidden", "true");
  });

  it("renders icon path based on name", async () => {
    const icons = ["close", "check", "star", "warning", "error", "info"];

    for (const name of icons) {
      element.name = name;
      await element.updateComplete;
      const path = element.shadowRoot.querySelector("path");
      expect(path).to.exist;
    }
  });

  it("applies size classes", async () => {
    const sizes = ["small", "medium", "large"];

    for (const size of sizes) {
      element.size = size;
      await element.updateComplete;
      expect(element).to.have.attribute("size", size);
    }
  });

  it("applies custom color", async () => {
    element.color = "red";
    await element.updateComplete;
    expect(element.style.getPropertyValue("--icon-color")).to.equal("red");
  });

  it("handles unknown icon names", async () => {
    element.name = "unknown-icon";
    await element.updateComplete;
    const path = element.shadowRoot.querySelector("path");
    expect(path).to.not.exist;
  });

  it("maintains proper ARIA attributes", () => {
    const svg = element.shadowRoot.querySelector("svg");
    expect(svg).to.have.attribute("aria-hidden", "true");
  });

  it("updates color when property changes", async () => {
    element.color = "blue";
    await element.updateComplete;
    expect(element.style.getPropertyValue("--icon-color")).to.equal("blue");

    element.color = "green";
    await element.updateComplete;
    expect(element.style.getPropertyValue("--icon-color")).to.equal("green");
  });
});
