import { expect } from "@esm-bundle/chai";
import { fixture, html } from "@open-wc/testing";
import "../../src/components/ui/toast.js";

describe("Toast Component", () => {
  let element;

  beforeEach(async () => {
    element = await fixture(html` <neo-toast></neo-toast> `);
  });

  it("should be defined", () => {
    expect(element).to.be.instanceOf(customElements.get("neo-toast"));
  });

  it("should show toast with message", async () => {
    const message = "Test notification";
    element.show({ message, type: "info" });
    await element.updateComplete;

    const toastMessage = element.shadowRoot.querySelector(".toast-message");
    expect(toastMessage.textContent).to.equal(message);
    expect(element.classList.contains("visible")).to.be.true;
  });

  it("should support different toast types", async () => {
    const types = ["success", "error", "warning", "info"];

    for (const type of types) {
      element.show({ message: "Test", type });
      await element.updateComplete;
      expect(element.shadowRoot.querySelector(`.toast-${type}`)).to.exist;
    }
  });

  it("should auto-hide after duration", async () => {
    const duration = 100;
    element.show({ message: "Test", duration });
    await element.updateComplete;
    expect(element.classList.contains("visible")).to.be.true;

    await new Promise((resolve) => setTimeout(resolve, duration + 50));
    expect(element.classList.contains("visible")).to.be.false;
  });

  it("should stack multiple toasts", async () => {
    element.show({ message: "First toast" });
    element.show({ message: "Second toast" });
    await element.updateComplete;

    const toasts = element.shadowRoot.querySelectorAll(".toast-item");
    expect(toasts.length).to.equal(2);
  });

  it("should remove toast on click", async () => {
    element.show({ message: "Test" });
    await element.updateComplete;

    const toast = element.shadowRoot.querySelector(".toast-item");
    toast.click();
    await element.updateComplete;

    expect(element.shadowRoot.querySelectorAll(".toast-item").length).to.equal(
      0
    );
  });

  it("should handle toast queue correctly", async () => {
    const maxToasts = 3;
    for (let i = 0; i < maxToasts + 2; i++) {
      element.show({ message: `Toast ${i}` });
    }
    await element.updateComplete;

    const toasts = element.shadowRoot.querySelectorAll(".toast-item");
    expect(toasts.length).to.equal(maxToasts);
  });

  it("should emit events on show/hide", async () => {
    let showEvent = false;
    let hideEvent = false;

    element.addEventListener("toast-show", () => (showEvent = true));
    element.addEventListener("toast-hide", () => (hideEvent = true));

    element.show({ message: "Test" });
    await element.updateComplete;
    expect(showEvent).to.be.true;

    element.hide();
    await element.updateComplete;
    expect(hideEvent).to.be.true;
  });
});
