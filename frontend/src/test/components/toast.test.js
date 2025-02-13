import { expect } from "@esm-bundle/chai";
import { fixture, html, oneEvent } from "@open-wc/testing";
import "../../components/organisms/toast/toast.js";

describe("NeoToast", () => {
  let element;

  beforeEach(async () => {
    element = await fixture(html`<neo-toast>Test message</neo-toast>`);
  });

  it("renders with default properties", () => {
    expect(element.variant).to.equal("info");
    expect(element.duration).to.equal(3000);
    expect(element.closable).to.be.true;
    expect(element.animate).to.be.true;
    expect(element.position).to.equal("bottom-right");
    expect(element.textContent.trim()).to.equal("Test message");
  });

  it("reflects variant changes", async () => {
    const variants = ["success", "warning", "error", "info"];

    for (const variant of variants) {
      element.variant = variant;
      await element.updateComplete;
      expect(element.shadowRoot.querySelector(".toast")).to.have.class(variant);
    }
  });

  it("handles position changes", async () => {
    const positions = [
      "top-left",
      "top-right",
      "top-center",
      "bottom-left",
      "bottom-right",
      "bottom-center",
    ];

    for (const position of positions) {
      element.position = position;
      await element.updateComplete;
      expect(element.shadowRoot.querySelector(".toast")).to.have.class(
        `position-${position}`
      );
    }
  });

  it("auto-closes after duration", async () => {
    element.duration = 100;
    element.show();
    await element.updateComplete;

    expect(element.open).to.be.true;

    await new Promise((resolve) => setTimeout(resolve, 150));
    expect(element.open).to.be.false;
  });

  it("doesn't auto-close when duration is 0", async () => {
    element.duration = 0;
    element.show();
    await element.updateComplete;

    await new Promise((resolve) => setTimeout(resolve, 150));
    expect(element.open).to.be.true;
  });

  it("handles manual close", async () => {
    element.show();
    await element.updateComplete;

    const closePromise = oneEvent(element, "toast-close");
    element.shadowRoot.querySelector(".close-button").click();
    await closePromise;

    expect(element.open).to.be.false;
  });

  it("pauses auto-close on hover", async () => {
    element.duration = 200;
    element.show();
    await element.updateComplete;

    // Simulate mouse enter
    element.dispatchEvent(new MouseEvent("mouseenter"));
    await new Promise((resolve) => setTimeout(resolve, 250));
    expect(element.open).to.be.true;

    // Simulate mouse leave
    element.dispatchEvent(new MouseEvent("mouseleave"));
    await new Promise((resolve) => setTimeout(resolve, 250));
    expect(element.open).to.be.false;
  });

  it("maintains proper ARIA attributes", async () => {
    element.show();
    await element.updateComplete;

    const toast = element.shadowRoot.querySelector(".toast");
    expect(toast).to.have.attribute("role", "alert");
    expect(toast).to.have.attribute("aria-live", "polite");

    element.variant = "error";
    await element.updateComplete;
    expect(toast).to.have.attribute("aria-live", "assertive");
  });

  it("supports custom styles", async () => {
    element.style.setProperty("--toast-background", "purple");
    element.style.setProperty("--toast-text-color", "white");
    await element.updateComplete;

    const toast = element.shadowRoot.querySelector(".toast");
    const styles = window.getComputedStyle(toast);
    expect(styles.backgroundColor).to.equal("purple");
    expect(styles.color).to.equal("white");
  });

  it("handles animation states", async () => {
    element.show();
    await element.updateComplete;
    expect(element.shadowRoot.querySelector(".toast")).to.have.class(
      "animate-in"
    );

    element.hide();
    await element.updateComplete;
    expect(element.shadowRoot.querySelector(".toast")).to.have.class(
      "animate-out"
    );
  });

  it("renders with icon", async () => {
    const toastWithIcon = await fixture(html`
      <neo-toast variant="success">
        <neo-icon slot="icon" name="check"></neo-icon>
        Success message
      </neo-toast>
    `);

    expect(toastWithIcon.shadowRoot.querySelector("slot[name='icon']")).to
      .exist;
  });

  it("supports action buttons", async () => {
    const toastWithAction = await fixture(html`
      <neo-toast>
        <span>Message with action</span>
        <neo-button slot="action">Undo</neo-button>
      </neo-toast>
    `);

    expect(toastWithAction.shadowRoot.querySelector("slot[name='action']")).to
      .exist;
  });

  it("handles stacked toasts", async () => {
    const container = await fixture(html`
      <div>
        <neo-toast position="top-right">First toast</neo-toast>
        <neo-toast position="top-right">Second toast</neo-toast>
      </div>
    `);

    const [toast1, toast2] = container.querySelectorAll("neo-toast");
    toast1.show();
    toast2.show();
    await toast2.updateComplete;

    const rect1 = toast1.getBoundingClientRect();
    const rect2 = toast2.getBoundingClientRect();
    expect(rect2.top).to.be.greaterThan(rect1.bottom);
  });
});

describe("ToastService", () => {
  let toastService;

  beforeEach(() => {
    toastService = new window.ToastService();
  });

  afterEach(() => {
    document.querySelectorAll("neo-toast").forEach((toast) => toast.remove());
  });

  it("shows a toast message", async () => {
    const toast = await toastService.show({
      message: "Test message",
      variant: "info",
    });

    expect(toast).to.exist;
    expect(toast.textContent.trim()).to.equal("Test message");
    expect(toast.variant).to.equal("info");
    expect(toast.open).to.be.true;
  });

  it("shows success toast", async () => {
    const toast = await toastService.success("Success message");
    expect(toast.variant).to.equal("success");
    expect(toast.textContent.trim()).to.equal("Success message");
  });

  it("shows error toast", async () => {
    const toast = await toastService.error("Error message");
    expect(toast.variant).to.equal("error");
    expect(toast.textContent.trim()).to.equal("Error message");
  });

  it("shows warning toast", async () => {
    const toast = await toastService.warning("Warning message");
    expect(toast.variant).to.equal("warning");
    expect(toast.textContent.trim()).to.equal("Warning message");
  });

  it("supports custom duration", async () => {
    const toast = await toastService.show({
      message: "Quick message",
      duration: 100,
    });

    expect(toast.open).to.be.true;
    await new Promise((resolve) => setTimeout(resolve, 150));
    expect(toast.open).to.be.false;
  });

  it("supports custom position", async () => {
    const toast = await toastService.show({
      message: "Positioned message",
      position: "top-center",
    });

    expect(toast.position).to.equal("top-center");
  });

  it("manages toast queue", async () => {
    const toast1 = await toastService.show({ message: "First" });
    const toast2 = await toastService.show({ message: "Second" });
    const toast3 = await toastService.show({ message: "Third" });

    expect(document.querySelectorAll("neo-toast").length).to.equal(3);
    expect(toast1.style.zIndex).to.be.lessThan(toast2.style.zIndex);
    expect(toast2.style.zIndex).to.be.lessThan(toast3.style.zIndex);
  });

  it("clears all toasts", async () => {
    await toastService.show({ message: "Toast 1" });
    await toastService.show({ message: "Toast 2" });
    await toastService.show({ message: "Toast 3" });

    toastService.clearAll();
    await new Promise((resolve) => setTimeout(resolve, 0));

    const openToasts = Array.from(
      document.querySelectorAll("neo-toast")
    ).filter((toast) => toast.open);
    expect(openToasts.length).to.equal(0);
  });
});
