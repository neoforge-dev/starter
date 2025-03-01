import { expect, describe, it, beforeEach } from "vitest";
import { fixture, html } from "@open-wc/testing-helpers";
import "../../../components/atoms/icon/icon.js";

describe("NeoIcon", () => {
  let element;

  beforeEach(async () => {
    element = await fixture(html`<neo-icon name="user"></neo-icon>`);
    await element.updateComplete;
  });

  it("renders with default properties", async () => {
    expect(element).to.exist;
    expect(element.name).to.equal("user");
    expect(element.size).to.equal("md");
    expect(element.color).to.be.undefined;
    expect(element.label).to.be.undefined;
  });

  it("reflects attribute changes", async () => {
    element.size = "lg";
    element.color = "primary";
    element.label = "User Icon";
    await element.updateComplete;

    const svg = element.shadowRoot.querySelector("svg");
    expect(svg.classList.contains("size-lg")).to.be.true;
    expect(svg.classList.contains("color-primary")).to.be.true;
    expect(svg.getAttribute("aria-label")).to.equal("User Icon");
  });

  it("handles different icon sizes", async () => {
    const sizes = ["sm", "md", "lg", "xl"];

    for (const size of sizes) {
      element.size = size;
      await element.updateComplete;

      const svg = element.shadowRoot.querySelector("svg");
      expect(svg.classList.contains(`size-${size}`)).to.be.true;
    }
  });

  it("handles different icon colors", async () => {
    const colors = ["primary", "secondary", "success", "error", "warning"];

    for (const color of colors) {
      element.color = color;
      await element.updateComplete;

      const svg = element.shadowRoot.querySelector("svg");
      expect(svg.classList.contains(`color-${color}`)).to.be.true;
    }
  });

  it("handles accessibility requirements", async () => {
    element.label = "User Profile Icon";
    await element.updateComplete;

    const svg = element.shadowRoot.querySelector("svg");
    expect(svg.getAttribute("role")).to.equal("img");
    expect(svg.getAttribute("aria-label")).to.equal("User Profile Icon");
  });

  it("handles decorative icons", async () => {
    element.decorative = true;
    await element.updateComplete;

    const svg = element.shadowRoot.querySelector("svg");
    expect(svg.getAttribute("aria-hidden")).to.equal("true");
  });

  it("supports custom sizes", async () => {
    element.customSize = "32px";
    await element.updateComplete;

    const svg = element.shadowRoot.querySelector("svg");
    expect(svg.style.width).to.equal("32px");
    expect(svg.style.height).to.equal("32px");
  });

  it("handles invalid icon names gracefully", async () => {
    element.name = "non-existent-icon";
    await element.updateComplete;

    const svg = element.shadowRoot.querySelector("svg");
    expect(svg).to.exist;
    expect(svg.innerHTML).to.include("<!-- Icon not found -->");
  });

  it("supports click events", async () => {
    let clicked = false;
    element.addEventListener("click", () => (clicked = true));

    const svg = element.shadowRoot.querySelector("svg");
    svg.dispatchEvent(
      new MouseEvent("click", { bubbles: true, composed: true })
    );

    expect(clicked).to.be.true;
  });

  it("handles loading states", async () => {
    element.loading = true;
    await element.updateComplete;

    const svg = element.shadowRoot.querySelector("svg");
    expect(svg.classList.contains("loading")).to.be.true;
  });
});
