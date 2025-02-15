import { expect, describe, it, beforeEach } from "vitest";
import { fixture, html } from "@open-wc/testing-helpers";
import "../../../components/atoms/spinner/spinner.js";

describe("NeoSpinner", () => {
  let element;

  beforeEach(async () => {
    element = await fixture(html`<neo-spinner></neo-spinner>`);
    await element.updateComplete;
  });

  it("renders with default properties", async () => {
    expect(element).to.exist;
    expect(element.size).to.equal("md");
    expect(element.color).to.equal("primary");
    expect(element.variant).to.equal("border");
    expect(element.label).to.equal("Loading...");
  });

  it("reflects attribute changes", async () => {
    element.size = "lg";
    element.color = "secondary";
    element.variant = "dots";
    element.label = "Please wait...";
    await element.updateComplete;

    expect(element.size).to.equal("lg");
    expect(element.color).to.equal("secondary");
    expect(element.variant).to.equal("dots");
    expect(element.label).to.equal("Please wait...");
  });

  it("renders border variant correctly", async () => {
    element.variant = "border";
    await element.updateComplete;

    const spinner = element.shadowRoot.querySelector(".spinner");
    expect(spinner.classList.contains("border")).to.be.true;
    expect(spinner.children.length).to.equal(1); // Only sr-only span
  });

  it("renders dots variant correctly", async () => {
    element.variant = "dots";
    await element.updateComplete;

    const spinner = element.shadowRoot.querySelector(".spinner");
    expect(spinner.classList.contains("dots")).to.be.true;
    const dots = spinner.querySelectorAll(".dot");
    expect(dots.length).to.equal(3);
  });

  it("renders pulse variant correctly", async () => {
    element.variant = "pulse";
    await element.updateComplete;

    const spinner = element.shadowRoot.querySelector(".spinner");
    expect(spinner.classList.contains("pulse")).to.be.true;
    expect(spinner.children.length).to.equal(1); // Only sr-only span
  });

  it("applies size classes correctly", async () => {
    const sizes = ["sm", "md", "lg"];
    for (const size of sizes) {
      element.size = size;
      await element.updateComplete;
      const spinner = element.shadowRoot.querySelector(".spinner");
      expect(spinner.classList.contains(size)).to.be.true;
    }
  });

  it("applies color classes correctly", async () => {
    const colors = ["primary", "secondary", "success", "error"];
    for (const color of colors) {
      element.color = color;
      await element.updateComplete;
      const spinner = element.shadowRoot.querySelector(".spinner");
      expect(spinner.classList.contains(color)).to.be.true;
    }
  });

  it("has proper ARIA attributes", async () => {
    const spinner = element.shadowRoot.querySelector(".spinner");
    expect(spinner.getAttribute("role")).to.equal("status");

    const srOnly = spinner.querySelector(".sr-only");
    expect(srOnly).to.exist;
    expect(srOnly.textContent).to.equal("Loading...");
  });

  it("updates screen reader text when label changes", async () => {
    element.label = "Custom loading message";
    await element.updateComplete;

    const srOnly = element.shadowRoot.querySelector(".sr-only");
    expect(srOnly.textContent).to.equal("Custom loading message");
  });
});
