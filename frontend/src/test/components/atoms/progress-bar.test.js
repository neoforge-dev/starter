import { fixture, expect } from "../../setup.mjs";
import { html } from "lit";
import { NeoProgressBar } from "../../../components/atoms/progress/progress-bar.js";

// Skip all tests in this file for now
describe.skip("NeoProgressBar", () => {
  let element;

  beforeEach(async () => {
    element = await fixture(html`<neo-progress-bar></neo-progress-bar>`);
  });

  it("renders with default properties", async () => {
    expect(element).to.exist;
    expect(element.value).to.equal(0);
    expect(element.max).to.equal(100);
    expect(element.variant).to.equal("default");
    expect(element.size).to.equal("md");
    expect(element.indeterminate).to.be.false;
    expect(element.showLabel).to.be.false;
    expect(element.label).to.equal("");
  });

  it("reflects attribute changes", async () => {
    element.value = 50;
    element.max = 200;
    element.variant = "success";
    element.size = "lg";
    element.indeterminate = true;
    element.showLabel = true;
    element.label = "Custom label";
    await element.updateComplete;

    expect(element.value).to.equal(50);
    expect(element.max).to.equal(200);
    expect(element.variant).to.equal("success");
    expect(element.size).to.equal("lg");
    expect(element.indeterminate).to.be.true;
    expect(element.showLabel).to.be.true;
    expect(element.label).to.equal("Custom label");
  });

  it("calculates percentage correctly", async () => {
    element.value = 75;
    element.max = 100;
    await element.updateComplete;

    expect(element.percentage).to.equal(75);
  });

  it("clamps percentage between 0 and 100", async () => {
    element.value = -50;
    await element.updateComplete;
    expect(element.percentage).to.equal(0);

    element.value = 150;
    await element.updateComplete;
    expect(element.percentage).to.equal(100);
  });

  it("applies size classes correctly", async () => {
    const sizes = ["sm", "md", "lg"];
    for (const size of sizes) {
      element.size = size;
      await element.updateComplete;
      const progressBar = element.shadowRoot.querySelector(".progress-bar");
      expect(progressBar.classList.contains(size)).to.be.true;
    }
  });

  it("applies variant classes correctly", async () => {
    const variants = ["default", "success", "error"];
    for (const variant of variants) {
      element.variant = variant;
      await element.updateComplete;
      const progressFill = element.shadowRoot.querySelector(".progress-fill");
      expect(progressFill.classList.contains(variant)).to.be.true;
    }
  });

  it("handles indeterminate state", async () => {
    element.indeterminate = true;
    await element.updateComplete;

    const progressFill = element.shadowRoot.querySelector(".progress-fill");
    expect(progressFill.classList.contains("indeterminate")).to.be.true;
    expect(progressFill.style.width).to.equal("");
  });

  it("shows label when enabled", async () => {
    element.showLabel = true;
    element.value = 75;
    await element.updateComplete;

    const label = element.shadowRoot.querySelector(".progress-label");
    expect(label).to.exist;
    expect(label.textContent.trim()).to.equal("75%");
  });

  it("shows custom label when provided", async () => {
    element.showLabel = true;
    element.label = "Loading assets...";
    await element.updateComplete;

    const label = element.shadowRoot.querySelector(".progress-label");
    expect(label).to.exist;
    expect(label.textContent.trim()).to.equal("Loading assets...");
  });

  it("has proper ARIA attributes", async () => {
    element.value = 50;
    element.max = 100;
    await element.updateComplete;

    const container = element.shadowRoot.querySelector(".progress-container");
    expect(container.getAttribute("role")).to.equal("progressbar");
    expect(container.getAttribute("aria-valuemin")).to.equal("0");
    expect(container.getAttribute("aria-valuemax")).to.equal("100");
    expect(container.getAttribute("aria-valuenow")).to.equal("50");
  });

  it("updates ARIA attributes for indeterminate state", async () => {
    element.indeterminate = true;
    await element.updateComplete;

    const container = element.shadowRoot.querySelector(".progress-container");
    expect(container.getAttribute("aria-valuenow")).to.be.null;
  });

  it("updates progress fill width", async () => {
    element.value = 75;
    await element.updateComplete;

    const progressFill = element.shadowRoot.querySelector(".progress-fill");
    expect(progressFill.style.width).to.equal("75%");
  });

  it("provides screen reader text", async () => {
    element.value = 75;
    await element.updateComplete;

    const srOnly = element.shadowRoot.querySelector(".sr-only");
    expect(srOnly).to.exist;
    expect(srOnly.textContent.trim()).to.equal("Progress: 75%");

    element.indeterminate = true;
    await element.updateComplete;
    expect(srOnly.textContent.trim()).to.equal("Loading...");
  });
});
