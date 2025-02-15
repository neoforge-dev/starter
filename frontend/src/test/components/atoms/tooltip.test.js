import { expect, describe, it, beforeEach, vi } from "vitest";
import { fixture, html, oneEvent } from "@open-wc/testing-helpers";
import "../../../components/atoms/tooltip/tooltip.js";

describe("NeoTooltip", () => {
  let element;

  beforeEach(async () => {
    element = await fixture(html`
      <neo-tooltip content="Test tooltip">
        <button>Hover me</button>
      </neo-tooltip>
    `);
    await element.updateComplete;
  });

  it("renders with default properties", async () => {
    expect(element).to.exist;
    expect(element.content).to.equal("Test tooltip");
    expect(element.position).to.equal("top");
    expect(element.variant).to.equal("dark");
    expect(element.arrow).to.be.true;
    expect(element.delay).to.equal(200);
    expect(element._isVisible).to.be.false;
  });

  it("reflects attribute changes", async () => {
    element.content = "Updated tooltip";
    element.position = "bottom";
    element.variant = "light";
    element.arrow = false;
    element.delay = 300;
    await element.updateComplete;

    expect(element.content).to.equal("Updated tooltip");
    expect(element.position).to.equal("bottom");
    expect(element.variant).to.equal("light");
    expect(element.arrow).to.be.false;
    expect(element.delay).to.equal(300);
  });

  it("shows tooltip on mouse enter", async () => {
    const trigger = element.shadowRoot.querySelector(".tooltip-trigger");
    trigger.dispatchEvent(new MouseEvent("mouseenter"));

    // Wait for the delay
    await new Promise((resolve) => setTimeout(resolve, element.delay + 50));
    await element.updateComplete;

    expect(element._isVisible).to.be.true;
    const tooltip = element.shadowRoot.querySelector(".tooltip");
    expect(tooltip.classList.contains("visible")).to.be.true;
  });

  it("hides tooltip on mouse leave", async () => {
    const trigger = element.shadowRoot.querySelector(".tooltip-trigger");

    // Show tooltip
    trigger.dispatchEvent(new MouseEvent("mouseenter"));
    await new Promise((resolve) => setTimeout(resolve, element.delay + 50));
    await element.updateComplete;

    // Hide tooltip
    trigger.dispatchEvent(new MouseEvent("mouseleave"));
    await element.updateComplete;

    expect(element._isVisible).to.be.false;
    const tooltip = element.shadowRoot.querySelector(".tooltip");
    expect(tooltip.classList.contains("visible")).to.be.false;
  });

  it("cancels show timeout on early mouse leave", async () => {
    const trigger = element.shadowRoot.querySelector(".tooltip-trigger");

    // Start showing tooltip
    trigger.dispatchEvent(new MouseEvent("mouseenter"));

    // Leave before delay
    trigger.dispatchEvent(new MouseEvent("mouseleave"));
    await new Promise((resolve) => setTimeout(resolve, element.delay + 50));
    await element.updateComplete;

    expect(element._isVisible).to.be.false;
  });

  it("applies position classes correctly", async () => {
    const positions = ["top", "right", "bottom", "left"];
    for (const position of positions) {
      element.position = position;
      await element.updateComplete;
      const tooltip = element.shadowRoot.querySelector(".tooltip");
      expect(tooltip.classList.contains(position)).to.be.true;
    }
  });

  it("applies variant classes correctly", async () => {
    const variants = ["dark", "light"];
    for (const variant of variants) {
      element.variant = variant;
      await element.updateComplete;
      const tooltip = element.shadowRoot.querySelector(".tooltip");
      expect(tooltip.classList.contains(variant)).to.be.true;
    }
  });

  it("toggles arrow correctly", async () => {
    const tooltip = element.shadowRoot.querySelector(".tooltip");
    expect(tooltip.classList.contains("arrow")).to.be.true;

    element.arrow = false;
    await element.updateComplete;
    expect(tooltip.classList.contains("arrow")).to.be.false;
  });

  it("has proper ARIA attributes", async () => {
    const trigger = element.shadowRoot.querySelector(".tooltip-trigger");
    expect(trigger.getAttribute("aria-describedby")).to.equal("tooltip");

    const tooltip = element.shadowRoot.querySelector(".tooltip");
    expect(tooltip.getAttribute("role")).to.equal("tooltip");
  });

  it("renders slotted content", async () => {
    const button = element.querySelector("button");
    expect(button).to.exist;
    expect(button.textContent).to.equal("Hover me");
  });

  it("updates tooltip content", async () => {
    element.content = "New content";
    await element.updateComplete;

    const tooltip = element.shadowRoot.querySelector(".tooltip");
    expect(tooltip.textContent.trim()).to.equal("New content");
  });
});
