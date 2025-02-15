import { expect, describe, it, beforeEach } from "vitest";
import { fixture, html } from "@open-wc/testing-helpers";
import "../../../components/molecules/card/card.js";

describe("NeoCard", () => {
  let element;

  beforeEach(async () => {
    element = await fixture(html`<neo-card>Card content</neo-card>`);
    await element.updateComplete;
  });

  it("renders with default properties", async () => {
    expect(element).to.exist;
    expect(element.variant).to.equal("default");
    expect(element.padding).to.equal("md");
    expect(element.hoverable).to.be.false;
    expect(element.clickable).to.be.false;
    expect(element.href).to.equal("");
  });

  it("reflects attribute changes", async () => {
    element.variant = "elevated";
    element.padding = "lg";
    element.hoverable = true;
    element.clickable = true;
    element.href = "https://example.com";
    await element.updateComplete;

    expect(element.variant).to.equal("elevated");
    expect(element.padding).to.equal("lg");
    expect(element.hoverable).to.be.true;
    expect(element.clickable).to.be.true;
    expect(element.href).to.equal("https://example.com");
  });

  it("applies variant classes correctly", async () => {
    const variants = ["default", "outlined", "elevated"];
    for (const variant of variants) {
      element.variant = variant;
      await element.updateComplete;
      const card = element.shadowRoot.querySelector(".card");
      expect(card.classList.contains(variant)).to.be.true;
    }
  });

  it("applies padding classes correctly", async () => {
    const paddings = ["none", "sm", "md", "lg"];
    for (const padding of paddings) {
      element.padding = padding;
      await element.updateComplete;
      const card = element.shadowRoot.querySelector(".card");
      expect(card.classList.contains(`padding-${padding}`)).to.be.true;
    }
  });

  it("applies hoverable class when enabled", async () => {
    element.hoverable = true;
    await element.updateComplete;

    const card = element.shadowRoot.querySelector(".card");
    expect(card.classList.contains("hoverable")).to.be.true;
  });

  it("applies clickable class when enabled", async () => {
    element.clickable = true;
    await element.updateComplete;

    const card = element.shadowRoot.querySelector(".card");
    expect(card.classList.contains("clickable")).to.be.true;
  });

  it("renders as anchor tag when href is provided", async () => {
    element.clickable = true;
    element.href = "https://example.com";
    await element.updateComplete;

    const card = element.shadowRoot.querySelector("a.card");
    expect(card).to.exist;
    expect(card.tagName).to.equal("A");
    expect(card.href).to.include("https://example.com");
  });

  it("renders as div when no href is provided", async () => {
    const card = element.shadowRoot.querySelector("div.card");
    expect(card).to.exist;
    expect(card.tagName).to.equal("DIV");
  });

  it("renders default slot content", async () => {
    const content = "Card content";
    element = await fixture(html`<neo-card>${content}</neo-card>`);
    await element.updateComplete;

    expect(element.textContent.trim()).to.equal(content);
  });

  it("renders header slot content", async () => {
    const header = "Card Header";
    element = await fixture(html`
      <neo-card>
        <div slot="header">${header}</div>
        Card content
      </neo-card>
    `);
    await element.updateComplete;

    const headerSlot = element.querySelector('[slot="header"]');
    expect(headerSlot).to.exist;
    expect(headerSlot.textContent.trim()).to.equal(header);
  });

  it("renders footer slot content", async () => {
    const footer = "Card Footer";
    element = await fixture(html`
      <neo-card>
        Card content
        <div slot="footer">${footer}</div>
      </neo-card>
    `);
    await element.updateComplete;

    const footerSlot = element.querySelector('[slot="footer"]');
    expect(footerSlot).to.exist;
    expect(footerSlot.textContent.trim()).to.equal(footer);
  });

  it("renders media slot content", async () => {
    element = await fixture(html`
      <neo-card>
        <img slot="media" src="test.jpg" alt="Test" />
        Card content
      </neo-card>
    `);
    await element.updateComplete;

    const mediaSlot = element.querySelector('[slot="media"]');
    expect(mediaSlot).to.exist;
    expect(mediaSlot.tagName).to.equal("IMG");
  });

  it("has proper ARIA attributes", async () => {
    const card = element.shadowRoot.querySelector(".card");
    expect(card.getAttribute("role")).to.equal("article");
    expect(card.getAttribute("tabindex")).to.equal("-1");

    element.clickable = true;
    await element.updateComplete;
    expect(card.getAttribute("tabindex")).to.equal("0");
  });

  it("handles all slots simultaneously", async () => {
    element = await fixture(html`
      <neo-card>
        <img slot="media" src="test.jpg" alt="Test" />
        <div slot="header">Header</div>
        Main content
        <div slot="footer">Footer</div>
      </neo-card>
    `);
    await element.updateComplete;

    expect(element.querySelector('[slot="media"]')).to.exist;
    expect(element.querySelector('[slot="header"]')).to.exist;
    expect(element.textContent).to.include("Main content");
    expect(element.querySelector('[slot="footer"]')).to.exist;
  });
});
