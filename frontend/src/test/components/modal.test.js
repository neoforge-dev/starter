import { expect } from "@esm-bundle/chai";
import { fixture, html, oneEvent } from "@open-wc/testing";
import "../../components/organisms/modal/modal.js";

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
    expect(element.size).to.equal("medium");
    expect(element.closable).to.be.true;
    expect(element.backdrop).to.be.true;
    expect(element.animate).to.be.true;
  });

  it("shows/hides based on open property", async () => {
    expect(element.offsetParent).to.be.null;

    element.open = true;
    await element.updateComplete;
    expect(element.offsetParent).to.not.be.null;
    expect(element.shadowRoot.querySelector(".modal")).to.have.class("open");

    element.open = false;
    await element.updateComplete;
    expect(element.offsetParent).to.be.null;
    expect(element.shadowRoot.querySelector(".modal")).to.not.have.class(
      "open"
    );
  });

  it("dispatches events on open/close", async () => {
    const openPromise = oneEvent(element, "modal-open");
    element.open = true;
    await openPromise;

    const closePromise = oneEvent(element, "modal-close");
    element.open = false;
    await closePromise;
  });

  it("closes on backdrop click when closable", async () => {
    element.open = true;
    await element.updateComplete;

    const closePromise = oneEvent(element, "modal-close");
    element.shadowRoot.querySelector(".modal-backdrop").click();
    await closePromise;

    expect(element.open).to.be.false;
  });

  it("doesn't close on backdrop click when not closable", async () => {
    element.open = true;
    element.closable = false;
    await element.updateComplete;

    element.shadowRoot.querySelector(".modal-backdrop").click();
    await element.updateComplete;

    expect(element.open).to.be.true;
  });

  it("doesn't close on container click", async () => {
    element.open = true;
    await element.updateComplete;

    element.shadowRoot.querySelector(".modal-container").click();
    await element.updateComplete;

    expect(element.open).to.be.true;
  });

  it("closes on escape key when closable", async () => {
    element.open = true;
    await element.updateComplete;

    const closePromise = oneEvent(element, "modal-close");
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    await closePromise;

    expect(element.open).to.be.false;
  });

  it("doesn't close on escape key when not closable", async () => {
    element.open = true;
    element.closable = false;
    await element.updateComplete;

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    await element.updateComplete;

    expect(element.open).to.be.true;
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

  it("maintains proper ARIA attributes", async () => {
    element.open = true;
    await element.updateComplete;

    const dialog = element.shadowRoot.querySelector(".modal-dialog");
    expect(dialog).to.have.attribute("role", "dialog");
    expect(dialog).to.have.attribute("aria-modal", "true");
    expect(dialog).to.have.attribute("aria-labelledby");
    expect(dialog).to.have.attribute("aria-describedby");
  });

  it("handles size variants", async () => {
    const sizes = ["small", "medium", "large", "full"];

    for (const size of sizes) {
      element.size = size;
      await element.updateComplete;
      expect(element.shadowRoot.querySelector(".modal-dialog")).to.have.class(
        `size-${size}`
      );
    }
  });

  it("supports custom styles", async () => {
    element.style.setProperty("--modal-backdrop-color", "rgba(0, 0, 0, 0.8)");
    element.style.setProperty("--modal-border-radius", "16px");
    await element.updateComplete;

    const backdrop = element.shadowRoot.querySelector(".modal-backdrop");
    const dialog = element.shadowRoot.querySelector(".modal-dialog");
    const styles = window.getComputedStyle(backdrop);
    const dialogStyles = window.getComputedStyle(dialog);

    expect(styles.backgroundColor).to.equal("rgba(0, 0, 0, 0.8)");
    expect(dialogStyles.borderRadius).to.equal("16px");
  });

  it("manages focus trap when open", async () => {
    const modalWithFocusable = await fixture(html`
      <neo-modal>
        <div slot="content">
          <button>First</button>
          <button>Second</button>
          <button>Third</button>
        </div>
      </neo-modal>
    `);

    modalWithFocusable.open = true;
    await modalWithFocusable.updateComplete;

    // Focus should be trapped within the modal
    const firstButton = modalWithFocusable.querySelector("button");
    const lastButton = modalWithFocusable.querySelectorAll("button")[2];

    firstButton.focus();
    expect(document.activeElement).to.equal(firstButton);

    // Simulate Tab key
    firstButton.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab" }));
    expect(document.activeElement).to.not.equal(firstButton);

    // Simulate Shift+Tab on first element
    lastButton.focus();
    lastButton.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Tab", shiftKey: true })
    );
    expect(document.activeElement).to.not.equal(lastButton);
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
    document.body.removeChild(button);
  });

  it("prevents body scroll when open", async () => {
    element.open = true;
    await element.updateComplete;
    expect(document.body.style.overflow).to.equal("hidden");

    element.open = false;
    await element.updateComplete;
    expect(document.body.style.overflow).to.not.equal("hidden");
  });

  it("supports nested modals", async () => {
    const nestedModal = await fixture(html`
      <neo-modal>
        <div slot="content">
          <neo-modal>
            <div slot="content">Nested Content</div>
          </neo-modal>
        </div>
      </neo-modal>
    `);

    const [parentModal, childModal] = nestedModal.querySelectorAll("neo-modal");

    parentModal.open = true;
    await parentModal.updateComplete;

    childModal.open = true;
    await childModal.updateComplete;

    expect(parentModal.open).to.be.true;
    expect(childModal.open).to.be.true;

    // Closing child should keep parent open
    childModal.open = false;
    await childModal.updateComplete;

    expect(parentModal.open).to.be.true;
    expect(childModal.open).to.be.false;
  });
});

describe("ModalService", () => {
  let modalService;

  beforeEach(() => {
    modalService = new window.ModalService();
  });

  afterEach(() => {
    document.querySelectorAll("neo-modal").forEach((modal) => {
      modal.remove();
    });
  });

  it("shows a modal programmatically", async () => {
    const showPromise = modalService.show({
      title: "Test Modal",
      content: "Test content",
    });

    await new Promise((resolve) => setTimeout(resolve, 0));

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

    await new Promise((resolve) => setTimeout(resolve, 0));

    const modal = document.querySelector("neo-modal");
    expect(modal).to.exist;
    expect(modal.open).to.be.true;

    // Click confirm button
    modal.querySelector(".confirm-button").click();
    const result = await confirmPromise;
    expect(result).to.be.true;
  });

  it("handles confirmation dialog cancellation", async () => {
    const confirmPromise = modalService.confirm({
      title: "Confirm Test",
      message: "Test confirmation",
    });

    await new Promise((resolve) => setTimeout(resolve, 0));

    const modal = document.querySelector("neo-modal");
    modal.querySelector(".cancel-button").click();
    const result = await confirmPromise;
    expect(result).to.be.false;
  });

  it("closes all modals", async () => {
    modalService.show({ title: "Modal 1" });
    modalService.show({ title: "Modal 2" });
    modalService.show({ title: "Modal 3" });

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(document.querySelectorAll("neo-modal").length).to.equal(3);

    modalService.closeAll();
    await new Promise((resolve) => setTimeout(resolve, 0));

    const openModals = Array.from(
      document.querySelectorAll("neo-modal")
    ).filter((modal) => modal.open);
    expect(openModals.length).to.equal(0);
  });

  it("supports modal stacking", async () => {
    modalService.show({ title: "Modal 1" });
    modalService.show({ title: "Modal 2" });

    await new Promise((resolve) => setTimeout(resolve, 0));

    const modals = document.querySelectorAll("neo-modal");
    expect(modals[1].style.zIndex).to.be.greaterThan(modals[0].style.zIndex);
  });
});
