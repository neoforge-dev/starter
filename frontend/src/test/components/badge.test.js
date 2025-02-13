import { expect } from "@esm-bundle/chai";
import { fixture, html } from "@open-wc/testing";
import "../../components/atoms/badge/badge.js";

describe("NeoBadge", () => {
  let element;

  beforeEach(async () => {
    element = await fixture(html`<neo-badge>Default</neo-badge>`);
  });

  it("renders with default properties", () => {
    expect(element.variant).to.equal("default");
    expect(element.size).to.equal("medium");
    expect(element.textContent.trim()).to.equal("Default");
  });

  it("reflects variant changes", async () => {
    const variants = ["success", "warning", "error", "info"];

    for (const variant of variants) {
      element.variant = variant;
      await element.updateComplete;
      expect(element.shadowRoot.querySelector(".badge")).to.have.class(variant);
    }
  });

  it("reflects size changes", async () => {
    const sizes = ["small", "medium", "large"];

    for (const size of sizes) {
      element.size = size;
      await element.updateComplete;
      expect(element.shadowRoot.querySelector(".badge")).to.have.class(size);
    }
  });

  it("handles slotted content", async () => {
    const badge = await fixture(html`
      <neo-badge>
        <neo-icon slot="prefix" name="check"></neo-icon>
        Custom Content
        <neo-icon slot="suffix" name="close"></neo-icon>
      </neo-badge>
    `);

    const slots = badge.shadowRoot.querySelectorAll("slot");
    expect(slots.length).to.equal(3); // prefix, default, suffix slots
    expect(badge.textContent.trim()).to.equal("Custom Content");
  });

  it("maintains proper ARIA attributes", async () => {
    element.setAttribute("role", "status");
    await element.updateComplete;
    expect(element.shadowRoot.querySelector(".badge")).to.have.attribute(
      "role",
      "status"
    );
  });

  it("handles dynamic content updates", async () => {
    element.textContent = "Updated Content";
    await element.updateComplete;
    expect(element.textContent.trim()).to.equal("Updated Content");
  });

  it("supports custom colors", async () => {
    element.style.setProperty("--badge-background", "purple");
    element.style.setProperty("--badge-color", "white");
    await element.updateComplete;

    const badge = element.shadowRoot.querySelector(".badge");
    const styles = window.getComputedStyle(badge);
    expect(styles.backgroundColor).to.equal("purple");
    expect(styles.color).to.equal("white");
  });

  it("handles click events", async () => {
    let clicked = false;
    element.addEventListener("click", () => (clicked = true));

    element.click();
    expect(clicked).to.be.true;
  });

  it("supports pill shape variant", async () => {
    element.setAttribute("pill", "");
    await element.updateComplete;
    expect(element.shadowRoot.querySelector(".badge")).to.have.class("pill");
  });

  it("handles disabled state", async () => {
    element.disabled = true;
    await element.updateComplete;

    expect(element.shadowRoot.querySelector(".badge")).to.have.class(
      "disabled"
    );

    let clicked = false;
    element.addEventListener("click", () => (clicked = true));

    element.click();
    expect(clicked).to.be.false;
  });

  it("supports removable badges", async () => {
    const removableBadge = await fixture(html`
      <neo-badge removable>Removable</neo-badge>
    `);

    let removed = false;
    removableBadge.addEventListener("remove", () => (removed = true));

    const closeButton =
      removableBadge.shadowRoot.querySelector(".close-button");
    expect(closeButton).to.exist;

    closeButton.click();
    expect(removed).to.be.true;
  });

  it("handles overflow content", async () => {
    const longContent =
      "This is a very long badge content that should trigger overflow handling";
    element.textContent = longContent;
    await element.updateComplete;

    const badge = element.shadowRoot.querySelector(".badge");
    expect(badge).to.have.class("truncate");
    expect(badge).to.have.attribute("title", longContent);
  });
});
