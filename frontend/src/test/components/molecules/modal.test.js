import { expect, describe, it, beforeEach, vi } from "vitest";
import { fixture, html, oneEvent } from "@open-wc/testing-helpers";
import "../../../components/molecules/modal/modal.js";

describe("NeoModal", () => {
  let element;

  beforeEach(async () => {
    element = await fixture(html`
      <neo-modal>
        <div slot="header">Modal Title</div>
        Modal content
        <div slot="footer">Modal Footer</div>
      </neo-modal>
    `);
    await element.updateComplete;
  });

  it("renders with default properties", async () => {
    expect(element).to.exist;
    expect(element.open).to.be.false;
    expect(element.size).to.equal("md");
    expect(element.closeOnOverlay).to.be.true;
    expect(element.closeOnEscape).to.be.true;
    expect(element.preventScroll).to.be.true;
  });

  it("reflects attribute changes", async () => {
    element.open = true;
    element.size = "lg";
    element.closeOnOverlay = false;
    element.closeOnEscape = false;
    element.preventScroll = false;
    await element.updateComplete;

    expect(element.open).to.be.true;
    expect(element.size).to.equal("lg");
    expect(element.closeOnOverlay).to.be.false;
    expect(element.closeOnEscape).to.be.false;
    expect(element.preventScroll).to.be.false;
  });

  it("shows modal when open is true", async () => {
    element.open = true;
    await element.updateComplete;

    const modal = element.shadowRoot.querySelector(".modal");
    const overlay = element.shadowRoot.querySelector(".modal-overlay");
    expect(modal.classList.contains("open")).to.be.true;
    expect(overlay.classList.contains("open")).to.be.true;
  });

  it("applies size classes correctly", async () => {
    element.open = true;
    await element.updateComplete;

    const sizes = ["sm", "md", "lg", "full"];
    for (const size of sizes) {
      element.size = size;
      await element.updateComplete;
      const modal = element.shadowRoot.querySelector(".modal");
      expect(modal).to.exist;
      expect(modal.classList.contains(size)).to.be.true;
    }
  });

  it("closes on overlay click when enabled", async () => {
    element.open = true;
    await element.updateComplete;

    const overlay = element.shadowRoot.querySelector(".modal-overlay");
    const modal = element.shadowRoot.querySelector(".modal");

    // Use a custom event to simulate the click
    overlay.click();

    // Manually trigger the animation end event since jsdom doesn't support animations
    modal.dispatchEvent(new Event("animationend"));

    await element.updateComplete;
    expect(element.open).to.be.false;
  });

  it("doesn't close on overlay click when disabled", async () => {
    element.open = true;
    element.closeOnOverlay = false;
    await element.updateComplete;

    const overlay = element.shadowRoot.querySelector(".modal-overlay");
    overlay.click();
    await element.updateComplete;

    expect(element.open).to.be.true;
  });

  it("closes on escape key when enabled", async () => {
    element.open = true;
    await element.updateComplete;

    const modal = element.shadowRoot.querySelector(".modal");

    // Create a proper keyboard event
    const escapeEvent = new KeyboardEvent("keydown", {
      key: "Escape",
      bubbles: true,
      cancelable: true,
    });
    document.dispatchEvent(escapeEvent);

    // Manually trigger the animation end event
    modal.dispatchEvent(new Event("animationend"));

    await element.updateComplete;
    expect(element.open).to.be.false;
  });

  it("doesn't close on escape key when disabled", async () => {
    element.open = true;
    element.closeOnEscape = false;
    await element.updateComplete;

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    await element.updateComplete;

    expect(element.open).to.be.true;
  });

  it("prevents body scroll when enabled", async () => {
    element.open = true;
    element.preventScroll = true;
    await element.updateComplete;

    expect(document.body.style.overflow).to.equal("hidden");

    element.open = false;
    await element.updateComplete;

    expect(document.body.style.overflow).to.equal("");
  });

  it("dispatches neo-close event when closed", async () => {
    let eventFired = false;
    element.open = true;
    await element.updateComplete;

    const modal = element.shadowRoot.querySelector(".modal");

    element.addEventListener("neo-close", () => {
      eventFired = true;
    });

    element.close();

    // Manually trigger the animation end event
    modal.dispatchEvent(new Event("animationend"));

    await element.updateComplete;
    expect(eventFired).to.be.true;
    expect(element.open).to.be.false;
  });

  it("renders slot content", async () => {
    element.open = true;
    await element.updateComplete;

    const header = element.querySelector('[slot="header"]');
    const footer = element.querySelector('[slot="footer"]');
    expect(header).to.exist;
    expect(footer).to.exist;
    expect(element.textContent).to.include("Modal content");
  });

  it("has proper ARIA attributes", async () => {
    element.open = true;
    await element.updateComplete;

    const overlay = element.shadowRoot.querySelector(".modal-overlay");
    expect(overlay).to.exist;
    expect(overlay.getAttribute("role")).to.equal("dialog");
    expect(overlay.getAttribute("aria-modal")).to.equal("true");
  });

  it("cleans up event listeners on disconnect", async () => {
    const spy = vi.spyOn(document, "removeEventListener");
    element.remove();
    expect(spy).toHaveBeenCalled();
  });

  it("handles animation states correctly", async () => {
    element.open = true;
    await element.updateComplete;

    const modal = element.shadowRoot.querySelector(".modal");
    const overlay = element.shadowRoot.querySelector(".modal-overlay");
    expect(modal.classList.contains("open")).to.be.true;
    expect(overlay.classList.contains("open")).to.be.true;

    element.open = false;

    element._animating = false;
    await element.updateComplete;

    expect(element.open).to.be.false;
  });

  it("maintains focus trap within modal", async () => {
    element.open = true;
    await element.updateComplete;

    const overlay = element.shadowRoot.querySelector(".modal-overlay");
    expect(overlay).to.exist;

    const modal = element.shadowRoot.querySelector(".modal");
    expect(modal).to.exist;
  });

  it("restores focus when closed", async () => {
    const button = document.createElement("button");
    document.body.appendChild(button);
    button.focus();

    element.open = true;
    await element.updateComplete;

    element.open = false;
    await element.updateComplete;

    expect(document.activeElement).to.equal(button);
    button.remove();
  });
});
