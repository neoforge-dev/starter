import { expect, describe, it, beforeEach } from "vitest";
import { fixture, html } from "@open-wc/testing-helpers";
import "../../../components/atoms/link/link.js";

describe("NeoLink", () => {
  let element;

  beforeEach(async () => {
    element = await fixture(html`<neo-link href="/test">Click me</neo-link>`);
    await element.updateComplete;
  });

  it("renders with default properties", async () => {
    expect(element).to.exist;
    expect(element.href).to.equal("/test");
    expect(element.variant).to.equal("default");
    expect(element.size).to.equal("md");
    expect(element.disabled).to.be.false;
    expect(element.external).to.be.false;
    expect(element.textContent).to.equal("Click me");
  });

  it("reflects attribute changes", async () => {
    element.variant = "primary";
    element.size = "lg";
    element.disabled = true;
    element.external = true;
    await element.updateComplete;

    const link = element.shadowRoot.querySelector("a");
    expect(link.classList.contains("variant-primary")).to.be.true;
    expect(link.classList.contains("size-lg")).to.be.true;
    expect(link.classList.contains("disabled")).to.be.true;
    expect(link.target).to.equal("_blank");
    expect(link.rel).to.equal("noopener noreferrer");
  });

  it("handles different variants", async () => {
    const variants = ["default", "primary", "secondary", "subtle"];

    for (const variant of variants) {
      element.variant = variant;
      await element.updateComplete;

      const link = element.shadowRoot.querySelector("a");
      expect(link.classList.contains(`variant-${variant}`)).to.be.true;
    }
  });

  it("handles different sizes", async () => {
    const sizes = ["sm", "md", "lg"];

    for (const size of sizes) {
      element.size = size;
      await element.updateComplete;

      const link = element.shadowRoot.querySelector("a");
      expect(link.classList.contains(`size-${size}`)).to.be.true;
    }
  });

  it("supports icon prefix and suffix", async () => {
    element = await fixture(html`
      <neo-link href="/settings">
        <neo-icon slot="prefix" name="settings"></neo-icon>
        Settings
        <neo-icon slot="suffix" name="chevronRight"></neo-icon>
      </neo-link>
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

    const link = element.shadowRoot.querySelector("a");
    link.click();

    expect(clicked).to.be.true;
  });

  it("prevents click when disabled", async () => {
    let clicked = false;
    element.addEventListener("click", () => (clicked = true));
    element.disabled = true;
    await element.updateComplete;

    const link = element.shadowRoot.querySelector("a");
    link.click();

    expect(clicked).to.be.false;
  });

  it("handles external links correctly", async () => {
    element.external = true;
    element.href = "https://example.com";
    await element.updateComplete;

    const link = element.shadowRoot.querySelector("a");
    expect(link.target).to.equal("_blank");
    expect(link.rel).to.equal("noopener noreferrer");
  });

  it("handles relative paths correctly", async () => {
    element.href = "/internal/path";
    element.external = false;
    await element.updateComplete;

    const link = element.shadowRoot.querySelector("a");
    expect(link.target).to.equal("");
    expect(link.rel).to.equal("");
  });

  it("handles accessibility requirements", async () => {
    element.disabled = true;
    element.external = true;
    await element.updateComplete;

    const link = element.shadowRoot.querySelector("a");
    expect(link.getAttribute("aria-disabled")).to.equal("true");
    expect(link.getAttribute("aria-label")).to.include("opens in new tab");
  });

  it("supports underline variants", async () => {
    const underlineStates = ["none", "hover", "always"];

    for (const state of underlineStates) {
      element.underline = state;
      await element.updateComplete;

      const link = element.shadowRoot.querySelector("a");
      expect(link.classList.contains(`underline-${state}`)).to.be.true;
    }
  });
});
