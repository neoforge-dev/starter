import { expect, describe, it, beforeEach } from "vitest";
import { fixture, html } from "@open-wc/testing-helpers";
import "../../../components/atoms/badge/badge.js";

describe("NeoBadge", () => {
  let element;

  beforeEach(async () => {
    element = await fixture(html`<neo-badge>New</neo-badge>`);
    await element.updateComplete;
  });

  it("renders with default properties", async () => {
    expect(element).to.exist;
    expect(element.variant).to.equal("default");
    expect(element.size).to.equal("md");
    expect(element.textContent).to.equal("New");
  });

  it("reflects attribute changes", async () => {
    element.variant = "success";
    element.size = "lg";
    await element.updateComplete;

    const badge = element.shadowRoot.querySelector(".badge");
    expect(badge.classList.contains("variant-success")).to.be.true;
    expect(badge.classList.contains("size-lg")).to.be.true;
  });

  it("handles different variants", async () => {
    const variants = [
      "primary",
      "secondary",
      "success",
      "error",
      "warning",
      "info",
    ];

    for (const variant of variants) {
      element.variant = variant;
      await element.updateComplete;

      const badge = element.shadowRoot.querySelector(".badge");
      expect(badge.classList.contains(`variant-${variant}`)).to.be.true;
    }
  });

  it("handles different sizes", async () => {
    const sizes = ["sm", "md", "lg"];

    for (const size of sizes) {
      element.size = size;
      await element.updateComplete;

      const badge = element.shadowRoot.querySelector(".badge");
      expect(badge.classList.contains(`size-${size}`)).to.be.true;
    }
  });

  it("supports icon prefix", async () => {
    element = await fixture(html`
      <neo-badge>
        <neo-icon slot="prefix" name="check"></neo-icon>
        Success
      </neo-badge>
    `);
    await element.updateComplete;

    const prefixSlot = element.shadowRoot.querySelector('slot[name="prefix"]');
    expect(prefixSlot).to.exist;
  });

  it("supports icon suffix", async () => {
    element = await fixture(html`
      <neo-badge>
        Warning
        <neo-icon slot="suffix" name="warning"></neo-icon>
      </neo-badge>
    `);
    await element.updateComplete;

    const suffixSlot = element.shadowRoot.querySelector('slot[name="suffix"]');
    expect(suffixSlot).to.exist;
  });

  it("handles rounded variant", async () => {
    element.rounded = true;
    await element.updateComplete;

    const badge = element.shadowRoot.querySelector(".badge");
    expect(badge.classList.contains("rounded")).to.be.true;
  });

  it("handles outlined variant", async () => {
    element.outlined = true;
    await element.updateComplete;

    const badge = element.shadowRoot.querySelector(".badge");
    expect(badge.classList.contains("outlined")).to.be.true;
  });

  it("supports custom colors", async () => {
    element.style.setProperty("--badge-bg-color", "purple");
    element.style.setProperty("--badge-text-color", "white");
    await element.updateComplete;

    const badge = element.shadowRoot.querySelector(".badge");
    const styles = getComputedStyle(badge);
    expect(styles.backgroundColor).to.equal("purple");
    expect(styles.color).to.equal("white");
  });

  it("handles accessibility requirements", async () => {
    element = await fixture(html`
      <neo-badge variant="error" role="status">Critical Error</neo-badge>
    `);
    await element.updateComplete;

    expect(element.getAttribute("role")).to.equal("status");
  });
});
