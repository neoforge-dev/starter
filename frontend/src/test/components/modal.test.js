import { expect } from "@esm-bundle/chai";
import { fixture, html, oneEvent } from "@open-wc/testing";
import "../../components/ui/modal.js";

describe("NeoModal", () => {
  let element;

  beforeEach(async () => {
    element = await fixture(html`<neo-modal></neo-modal>`);
  });

  afterEach(() => {
    // Clean up any modals that might have been added to the body
    document.querySelectorAll("neo-modal").forEach((modal) => {
      modal.remove();
    });
  });

  it("renders with default properties", () => {
    expect(element.open).to.be.false;
    const backdrop = element.shadowRoot.querySelector(".modal-backdrop");
    const container = element.shadowRoot.querySelector(".modal-container");
    expect(backdrop).to.exist;
    expect(container).to.exist;
  });

  it("shows/hides based on open property", async () => {
    expect(element.offsetParent).to.be.null;

    element.open = true;
    await element.updateComplete;
    expect(element.offsetParent).to.not.be.null;

    element.open = false;
    await element.updateComplete;
    expect(element.offsetParent).to.be.null;
  });

  it("dispatches events on open/close", async () => {
    const openPromise = oneEvent(element, "modal-open");
    element.open = true;
    await openPromise;

    const closePromise = oneEvent(element, "modal-close");
    element.open = false;
    await closePromise;
  });

  it("closes on backdrop click", async () => {
    element.open = true;
    await element.updateComplete;

    const closePromise = oneEvent(element, "modal-close");
    element.shadowRoot.querySelector(".modal-backdrop").click();
    await closePromise;

    expect(element.open).to.be.false;
  });

  it("doesn't close on container click", async () => {
    element.open = true;
    await element.updateComplete;

    element.shadowRoot.querySelector(".modal-container").click();
    await element.updateComplete;

    expect(element.open).to.be.true;
  });

  it("closes on escape key", async () => {
    element.open = true;
    await element.updateComplete;

    const closePromise = oneEvent(element, "modal-close");
    const event = new KeyboardEvent("keydown", { key: "Escape" });
    document.dispatchEvent(event);
    await closePromise;

    expect(element.open).to.be.false;
  });

  it("renders slotted content correctly", async () => {
    const modalWithContent = await fixture(html`
      <neo-modal>
        <div slot="header">Header Content</div>
        <div slot="content">Main Content</div>
        <div slot="footer">Footer Content</div>
      </neo-modal>
    `);

    const slots = modalWithContent.shadowRoot.querySelectorAll("slot");
    expect(slots.length).to.equal(3);
    expect(slots[0].name).to.equal("header");
    expect(slots[1].name).to.equal("content");
    expect(slots[2].name).to.equal("footer");
  });
});

describe("ModalService", () => {
  let modalService;

  beforeEach(() => {
    modalService = new window.ModalService();
  });

  afterEach(() => {
    // Clean up any modals that might have been added to the body
    document.querySelectorAll("neo-modal").forEach((modal) => {
      modal.remove();
    });
  });

  it("shows a modal programmatically", async () => {
    const showPromise = modalService.show({
      title: "Test Modal",
      innerHTML: "<p>Test content</p>",
    });

    await new Promise((resolve) => setTimeout(resolve, 0)); // Wait for next frame

    const modal = document.querySelector("neo-modal");
    expect(modal).to.exist;
    expect(modal.open).to.be.true;

    modal.open = false;
    await showPromise;
  });

  it("shows a confirmation dialog", async () => {
    const confirmPromise = modalService.confirm({
      title: "Confirm Test",
      message: "Test confirmation",
    });

    await new Promise((resolve) => setTimeout(resolve, 0)); // Wait for next frame

    const modal = document.querySelector("neo-modal");
    expect(modal).to.exist;
    expect(modal.open).to.be.true;

    // Click confirm button
    modal.querySelector(".primary").click();
    const result = await confirmPromise;
    expect(result).to.be.true;
  });

  it("handles confirmation dialog cancellation", async () => {
    const confirmPromise = modalService.confirm({
      title: "Confirm Test",
      message: "Test confirmation",
    });

    await new Promise((resolve) => setTimeout(resolve, 0)); // Wait for next frame

    const modal = document.querySelector("neo-modal");
    // Click cancel button
    modal.querySelector("button:not(.primary)").click();
    const result = await confirmPromise;
    expect(result).to.be.false;
  });

  it("closes all modals", async () => {
    // Open multiple modals
    modalService.show({ title: "Modal 1" });
    modalService.show({ title: "Modal 2" });
    modalService.show({ title: "Modal 3" });

    await new Promise((resolve) => setTimeout(resolve, 0)); // Wait for next frame

    expect(document.querySelectorAll("neo-modal").length).to.equal(3);

    modalService.closeAll();
    await new Promise((resolve) => setTimeout(resolve, 0)); // Wait for next frame

    const openModals = Array.from(
      document.querySelectorAll("neo-modal")
    ).filter((modal) => modal.open);
    expect(openModals.length).to.equal(0);
  });
});
