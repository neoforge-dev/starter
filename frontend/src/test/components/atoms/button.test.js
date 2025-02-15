import { expect, describe, it, beforeEach } from "vitest";
import { fixture, html } from "@open-wc/testing-helpers";
import "../../../components/atoms/button/button.js";

describe("NeoButton", () => {
  let element;

  beforeEach(async () => {
    element = await fixture(html`<neo-button>Click me</neo-button>`);
    await element.updateComplete;
  });

  it("renders with default properties", async () => {
    expect(element).to.exist;
    expect(element.variant).to.equal("primary");
    expect(element.size).to.equal("md");
    expect(element.type).to.equal("button");
    expect(element.disabled).to.be.false;
    expect(element.loading).to.be.false;
    expect(element.textContent).to.equal("Click me");
  });

  it("reflects attribute changes", async () => {
    element.variant = "secondary";
    element.size = "lg";
    element.disabled = true;
    element.loading = true;
    await element.updateComplete;

    const button = element.shadowRoot.querySelector("button");
    expect(button.classList.contains("variant-secondary")).to.be.true;
    expect(button.classList.contains("size-lg")).to.be.true;
    expect(button.disabled).to.be.true;
    expect(button.classList.contains("loading")).to.be.true;
  });

  it("handles different variants", async () => {
    const variants = ["primary", "secondary", "tertiary", "danger", "ghost"];

    for (const variant of variants) {
      element.variant = variant;
      await element.updateComplete;

      const button = element.shadowRoot.querySelector("button");
      expect(button.classList.contains(`variant-${variant}`)).to.be.true;
    }
  });

  it("handles different sizes", async () => {
    const sizes = ["sm", "md", "lg"];

    for (const size of sizes) {
      element.size = size;
      await element.updateComplete;

      const button = element.shadowRoot.querySelector("button");
      expect(button.classList.contains(`size-${size}`)).to.be.true;
    }
  });

  it("supports icon prefix and suffix", async () => {
    element = await fixture(html`
      <neo-button>
        <neo-icon slot="prefix" name="settings"></neo-icon>
        Settings
        <neo-icon slot="suffix" name="chevronRight"></neo-icon>
      </neo-button>
    `);
    await element.updateComplete;

    const prefixSlot = element.shadowRoot.querySelector('slot[name="prefix"]');
    const suffixSlot = element.shadowRoot.querySelector('slot[name="suffix"]');
    expect(prefixSlot).to.exist;
    expect(suffixSlot).to.exist;
  });

  it("handles click events", async () => {
    let clicked = false;
    element.addEventListener("click", () => (clicked = true));

    const button = element.shadowRoot.querySelector("button");
    button.click();

    expect(clicked).to.be.true;
  });

  it("prevents click when disabled", async () => {
    let clicked = false;
    element.addEventListener("click", () => (clicked = true));
    element.disabled = true;
    await element.updateComplete;

    const button = element.shadowRoot.querySelector("button");
    button.click();

    expect(clicked).to.be.false;
  });

  it("shows loading state correctly", async () => {
    element.loading = true;
    await element.updateComplete;

    const button = element.shadowRoot.querySelector("button");
    const spinner = button.querySelector(".spinner");
    expect(button.classList.contains("loading")).to.be.true;
    expect(spinner).to.exist;
    expect(button.disabled).to.be.true;
  });

  it("handles full width mode", async () => {
    element.fullWidth = true;
    await element.updateComplete;

    const button = element.shadowRoot.querySelector("button");
    expect(button.classList.contains("full-width")).to.be.true;
  });

  it("supports different button types", async () => {
    element.type = "submit";
    await element.updateComplete;

    const button = element.shadowRoot.querySelector("button");
    expect(button.type).to.equal("submit");
  });

  it("handles accessibility requirements", async () => {
    element.loading = true;
    element.disabled = true;
    await element.updateComplete;

    const button = element.shadowRoot.querySelector("button");
    expect(button.getAttribute("aria-disabled")).to.equal("true");
    expect(button.getAttribute("aria-busy")).to.equal("true");
  });
});
