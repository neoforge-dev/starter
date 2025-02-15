import { expect, describe, it, beforeEach, vi } from "vitest";
import { fixture, html, oneEvent } from "@open-wc/testing-helpers";
import "../../../components/molecules/toast/toast.js";

describe("NeoToast", () => {
  let element;

  beforeEach(async () => {
    element = await fixture(html` <neo-toast>Toast message</neo-toast> `);
    await element.updateComplete;
  });

  it("renders with default properties", async () => {
    expect(element).to.exist;
    expect(element.variant).to.equal("info");
    expect(element.position).to.equal("bottom-right");
    expect(element.message).to.equal("");
    expect(element.duration).to.equal(5000);
    expect(element.dismissible).to.be.true;
    expect(element.icon).to.be.true;
    expect(element._visible).to.be.true;
  });

  it("reflects attribute changes", async () => {
    element.variant = "success";
    element.position = "top-right";
    element.message = "Test message";
    element.duration = 3000;
    element.dismissible = false;
    element.icon = false;
    await element.updateComplete;

    expect(element.variant).to.equal("success");
    expect(element.position).to.equal("top-right");
    expect(element.message).to.equal("Test message");
    expect(element.duration).to.equal(3000);
    expect(element.dismissible).to.be.false;
    expect(element.icon).to.be.false;
  });

  it("applies variant classes correctly", async () => {
    const variants = ["info", "success", "warning", "error"];
    for (const variant of variants) {
      element.variant = variant;
      await element.updateComplete;
      const toast = element.shadowRoot.querySelector(".toast");
      expect(toast.classList.contains(variant)).to.be.true;
    }
  });

  it("applies position classes correctly", async () => {
    const positions = [
      "top-left",
      "top-right",
      "bottom-left",
      "bottom-right",
      "top-center",
      "bottom-center",
    ];
    for (const position of positions) {
      element.position = position;
      await element.updateComplete;
      const toast = element.shadowRoot.querySelector(".toast");
      expect(toast.classList.contains(position)).to.be.true;
    }
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
      const icon = element.shadowRoot.querySelector(".toast-icon");
      expect(icon.textContent.trim()).to.equal(iconName);
    }
  });

  it("hides icon when disabled", async () => {
    element.icon = false;
    await element.updateComplete;

    const icon = element.shadowRoot.querySelector(".toast-icon");
    expect(icon).to.not.exist;
  });

  it("shows dismiss button when dismissible", async () => {
    const dismissButton = element.shadowRoot.querySelector(".toast-dismiss");
    expect(dismissButton).to.exist;

    element.dismissible = false;
    await element.updateComplete;
    expect(element.shadowRoot.querySelector(".toast-dismiss")).to.not.exist;
  });

  it("auto-dismisses after duration", async () => {
    element.duration = 100;
    await element.updateComplete;

    await new Promise((resolve) => setTimeout(resolve, 150));
    expect(element._visible).to.be.false;
  });

  it("doesn't auto-dismiss when duration is 0", async () => {
    element.duration = 0;
    await element.updateComplete;

    await new Promise((resolve) => setTimeout(resolve, 150));
    expect(element._visible).to.be.true;
  });

  it("cleans up timeout on disconnect", async () => {
    const clearTimeoutSpy = vi.spyOn(window, "clearTimeout");
    element.remove();
    expect(clearTimeoutSpy).toHaveBeenCalled();
  });

  it("dispatches neo-dismiss event when closed", async () => {
    setTimeout(() => element.close());
    const { detail } = await oneEvent(element, "neo-dismiss");

    expect(detail).to.exist;
    expect(element._visible).to.be.false;
  });

  it("closes on dismiss button click", async () => {
    const dismissButton = element.shadowRoot.querySelector(".toast-dismiss");
    dismissButton.click();
    await element.updateComplete;

    expect(element._visible).to.be.false;
  });

  it("has proper ARIA attributes", async () => {
    const toast = element.shadowRoot.querySelector(".toast");
    expect(toast.getAttribute("role")).to.equal("alert");
    expect(toast.getAttribute("aria-live")).to.equal("polite");

    const dismissButton = element.shadowRoot.querySelector(".toast-dismiss");
    expect(dismissButton.getAttribute("aria-label")).to.equal("Dismiss toast");
  });

  it("renders message content", async () => {
    element.message = "Test message";
    await element.updateComplete;

    const message = element.shadowRoot.querySelector(".toast-message");
    expect(message.textContent.trim()).to.equal("Test message");
  });

  it("renders slot content", async () => {
    const content = "Custom content";
    element = await fixture(html` <neo-toast>${content}</neo-toast> `);
    await element.updateComplete;

    expect(element.textContent.trim()).to.equal(content);
  });

  it("handles animation states correctly", async () => {
    const toast = element.shadowRoot.querySelector(".toast");
    expect(toast.classList.contains("visible")).to.be.true;

    element.close();
    await element.updateComplete;

    expect(toast.classList.contains("visible")).to.be.false;
    expect(toast.classList.contains("dismissing")).to.be.true;
  });

  it("supports complex content", async () => {
    element = await fixture(html`
      <neo-toast>
        <div class="custom-content">
          <strong>Title</strong>
          <p>Description</p>
          <a href="#">Action</a>
        </div>
      </neo-toast>
    `);
    await element.updateComplete;

    const customContent = element.querySelector(".custom-content");
    expect(customContent).to.exist;
    expect(element.textContent).to.include("Title");
    expect(element.textContent).to.include("Description");
    expect(element.querySelector("a")).to.exist;
  });
});
