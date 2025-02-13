import { fixture, expect, oneEvent } from "@open-wc/testing";
import { html } from "lit";
import { ToastNotification, showToast } from "../../components/ui/toast.js";

describe("Toast", () => {
  let element;

  beforeEach(async () => {
    element = await fixture(html`
      <toast-notification
        message="Test message"
        type="info"
        duration="3000"
      ></toast-notification>
    `);
  });

  it("renders with default properties", () => {
    expect(element.message).to.equal("Test message");
    expect(element.type).to.equal("info");
    expect(element.duration).to.equal(3000);

    const toast = element.shadowRoot.querySelector(".toast");
    expect(toast).to.exist;
    expect(toast.classList.contains("type-info")).to.be.true;
  });

  it("renders different types correctly", async () => {
    const types = ["success", "error", "warning", "info"];

    for (const type of types) {
      element.type = type;
      await element.updateComplete;

      const toast = element.shadowRoot.querySelector(".toast");
      expect(toast.classList.contains(`type-${type}`)).to.be.true;
    }
  });

  it("auto-dismisses after duration", async () => {
    element.duration = 100; // Short duration for testing
    element.show();

    expect(element.visible).to.be.true;

    await new Promise((resolve) => setTimeout(resolve, 150));
    expect(element.visible).to.be.false;
  });

  it("can be dismissed manually", async () => {
    element.show();
    expect(element.visible).to.be.true;

    const closeButton = element.shadowRoot.querySelector(".toast-close");
    closeButton.click();
    await element.updateComplete;

    expect(element.visible).to.be.false;
  });

  it("pauses auto-dismiss on hover", async () => {
    element.duration = 100;
    element.show();

    const toast = element.shadowRoot.querySelector(".toast");
    toast.dispatchEvent(new MouseEvent("mouseenter"));

    await new Promise((resolve) => setTimeout(resolve, 150));
    expect(element.visible).to.be.true;

    toast.dispatchEvent(new MouseEvent("mouseleave"));
    await new Promise((resolve) => setTimeout(resolve, 150));
    expect(element.visible).to.be.false;
  });

  it("stacks multiple toasts correctly", async () => {
    const toast1 = await fixture(html`
      <toast-notification message="First toast"></toast-notification>
    `);
    const toast2 = await fixture(html`
      <toast-notification message="Second toast"></toast-notification>
    `);

    toast1.show();
    toast2.show();

    const container = document.querySelector(".toast-container");
    expect(container.children.length).to.equal(2);
  });

  it("maintains proper z-index stacking", async () => {
    const toast1 = await fixture(html`
      <toast-notification message="First toast"></toast-notification>
    `);
    const toast2 = await fixture(html`
      <toast-notification message="Second toast"></toast-notification>
    `);

    toast1.show();
    toast2.show();

    const zIndex1 = getComputedStyle(toast1).zIndex;
    const zIndex2 = getComputedStyle(toast2).zIndex;
    expect(parseInt(zIndex2)).to.be.greaterThan(parseInt(zIndex1));
  });

  it("handles long messages correctly", async () => {
    const longMessage = "A".repeat(200);
    element.message = longMessage;
    await element.updateComplete;

    const messageEl = element.shadowRoot.querySelector(".toast-message");
    expect(messageEl.textContent).to.equal(longMessage);
    expect(getComputedStyle(messageEl).textOverflow).to.equal("ellipsis");
  });

  it("supports custom icons", async () => {
    element.icon = "custom-icon";
    await element.updateComplete;

    const icon = element.shadowRoot.querySelector(".toast-icon");
    expect(icon.textContent).to.include("custom-icon");
  });
});

describe("Toast Service", () => {
  afterEach(() => {
    // Clean up any remaining toasts
    document.querySelectorAll("toast-notification").forEach((toast) => {
      toast.remove();
    });
  });

  it("shows toast via service function", async () => {
    const toast = await showToast({
      message: "Service test",
      type: "success",
      duration: 3000,
    });

    expect(toast instanceof ToastNotification).to.be.true;
    expect(toast.message).to.equal("Service test");
    expect(toast.type).to.equal("success");
    expect(toast.visible).to.be.true;
  });

  it("supports promise-based usage", async () => {
    const promise = showToast({
      message: "Promise test",
      duration: 100,
    });

    expect(promise).to.be.a("promise");
    await promise; // Should resolve when toast is dismissed
  });

  it("queues toasts when many are shown rapidly", async () => {
    const toasts = await Promise.all([
      showToast({ message: "First" }),
      showToast({ message: "Second" }),
      showToast({ message: "Third" }),
    ]);

    const container = document.querySelector(".toast-container");
    expect(container.children.length).to.equal(3);

    // Check if they're properly stacked
    const positions = toasts.map((toast) => {
      const rect = toast.getBoundingClientRect();
      return rect.top;
    });

    // Each toast should be positioned below the previous one
    expect(positions[1]).to.be.greaterThan(positions[0]);
    expect(positions[2]).to.be.greaterThan(positions[1]);
  });

  it("maintains accessibility attributes", async () => {
    const toast = await showToast({ message: "Accessibility test" });

    expect(toast.getAttribute("role")).to.equal("alert");
    expect(toast.getAttribute("aria-live")).to.equal("polite");

    const closeButton = toast.shadowRoot.querySelector(".toast-close");
    expect(closeButton.getAttribute("aria-label")).to.equal(
      "Close notification"
    );
  });

  it("handles different positions", async () => {
    const positions = [
      "top-right",
      "top-left",
      "bottom-right",
      "bottom-left",
      "top-center",
      "bottom-center",
    ];

    for (const position of positions) {
      const toast = await showToast({
        message: `${position} toast`,
        position,
      });

      expect(toast.classList.contains(`position-${position}`)).to.be.true;
    }
  });
});
