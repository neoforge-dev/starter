import { expect, describe, it, beforeEach } from "vitest";
import { fixture, html, oneEvent } from "@open-wc/testing-helpers";
import "../../../components/molecules/alert/alert.js";

describe("NeoAlert", () => {
  let element;

  beforeEach(async () => {
    element = await fixture(html` <neo-alert>Alert message</neo-alert> `);
    await element.updateComplete;
  });

  it("renders with default properties", async () => {
    expect(element).to.exist;
    expect(element.variant).to.equal("info");
    expect(element.title).to.equal("");
    expect(element.dismissible).to.be.false;
    expect(element.icon).to.be.true;
    expect(element.elevated).to.be.false;
    expect(element._visible).to.be.true;
  });

  it("reflects attribute changes", async () => {
    element.variant = "success";
    element.title = "Success";
    element.dismissible = true;
    element.icon = false;
    element.elevated = true;
    await element.updateComplete;

    expect(element.variant).to.equal("success");
    expect(element.title).to.equal("Success");
    expect(element.dismissible).to.be.true;
    expect(element.icon).to.be.false;
    expect(element.elevated).to.be.true;
  });

  it("applies variant classes correctly", async () => {
    const variants = ["info", "success", "warning", "error"];
    for (const variant of variants) {
      element.variant = variant;
      await element.updateComplete;
      const alert = element.shadowRoot.querySelector(".alert");
      expect(alert.classList.contains(variant)).to.be.true;
    }
  });

  it("shows title when provided", async () => {
    element.title = "Alert Title";
    await element.updateComplete;

    const title = element.shadowRoot.querySelector(".alert-title");
    expect(title).to.exist;
    expect(title.textContent).to.equal("Alert Title");
  });

  it("shows icon by default", async () => {
    const icon = element.shadowRoot.querySelector(".alert-icon");
    expect(icon).to.exist;
  });

  it("hides icon when disabled", async () => {
    element.icon = false;
    await element.updateComplete;

    const icon = element.shadowRoot.querySelector(".alert-icon");
    expect(icon).to.not.exist;
  });

  it("shows correct variant icon", async () => {
    const variants = {
      info: "info",
      success: "check_circle",
      warning: "warning",
      error: "error",
    };

    for (const [variant, iconName] of Object.entries(variants)) {
      element.variant = variant;
      await element.updateComplete;
      const icon = element.shadowRoot.querySelector(".alert-icon");
      expect(icon.textContent.trim()).to.equal(iconName);
    }
  });

  it("shows dismiss button when dismissible", async () => {
    element.dismissible = true;
    await element.updateComplete;

    const dismissButton = element.shadowRoot.querySelector(".alert-dismiss");
    expect(dismissButton).to.exist;
  });

  it("applies elevation when enabled", async () => {
    element.elevated = true;
    await element.updateComplete;

    const alert = element.shadowRoot.querySelector(".alert");
    expect(alert.classList.contains("elevated")).to.be.true;
  });

  it("renders slot content", async () => {
    const content = "Alert message";
    element = await fixture(html` <neo-alert>${content}</neo-alert> `);
    await element.updateComplete;

    expect(element.textContent.trim()).to.equal(content);
  });

  it("dispatches neo-dismiss event when dismissed", async () => {
    element.dismissible = true;
    await element.updateComplete;

    const dismissButton = element.shadowRoot.querySelector(".alert-dismiss");

    setTimeout(() => dismissButton.click());
    const { detail } = await oneEvent(element, "neo-dismiss");

    expect(detail).to.exist;
    expect(element._visible).to.be.false;
  });

  it("adds dismissing class during animation", async () => {
    element.dismissible = true;
    await element.updateComplete;

    const dismissButton = element.shadowRoot.querySelector(".alert-dismiss");
    dismissButton.click();
    await element.updateComplete;

    const alert = element.shadowRoot.querySelector(".alert");
    expect(alert.classList.contains("dismissing")).to.be.true;
  });

  it("has proper ARIA attributes", async () => {
    const alert = element.shadowRoot.querySelector(".alert");
    expect(alert.getAttribute("role")).to.equal("alert");
    expect(alert.getAttribute("aria-live")).to.equal("polite");

    element.dismissible = true;
    await element.updateComplete;
    const dismissButton = element.shadowRoot.querySelector(".alert-dismiss");
    expect(dismissButton.getAttribute("aria-label")).to.equal("Dismiss alert");
  });

  it("renders nothing when not visible", async () => {
    element._visible = false;
    await element.updateComplete;

    const alert = element.shadowRoot.querySelector(".alert");
    expect(alert).to.not.exist;
  });

  it("handles complex content", async () => {
    element = await fixture(html`
      <neo-alert title="Complex Alert" variant="warning">
        <p>First line</p>
        <p>Second line</p>
        <a href="#">Learn more</a>
      </neo-alert>
    `);
    await element.updateComplete;

    const message = element.shadowRoot.querySelector(".alert-message");
    expect(message.children.length).to.be.greaterThan(0);
    expect(element.textContent).to.include("First line");
    expect(element.textContent).to.include("Second line");
    expect(element.querySelector("a")).to.exist;
  });
});
