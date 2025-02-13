import { expect } from "@esm-bundle/chai";
import { fixture, html, oneEvent } from "@open-wc/testing";
import "../../components/ui/toast.js";

describe("NeoToast", () => {
  let element;

  beforeEach(async () => {
    element = await fixture(html`<neo-toast></neo-toast>`);
  });

  it("renders with default properties", () => {
    expect(element.visible).to.be.false;
    expect(element.messages).to.deep.equal([]);
    expect(element.classList.contains("visible")).to.be.false;
  });

  it("shows a toast message", async () => {
    const message = "Test message";
    const showPromise = oneEvent(element, "toast-show");

    element.show({ message });
    await showPromise;

    expect(element.visible).to.be.true;
    expect(element.classList.contains("visible")).to.be.true;
    expect(element.messages).to.have.lengthOf(1);
    expect(element.messages[0].message).to.equal(message);
    expect(element.messages[0].type).to.equal("info"); // default type
  });

  it("shows different types of toast messages", async () => {
    const types = ["success", "error", "warning", "info"];

    for (const type of types) {
      element.show({ message: `${type} message`, type });
      await element.updateComplete;

      const toast = element.shadowRoot.querySelector(`.toast-${type}`);
      expect(toast).to.exist;
      expect(toast.textContent).to.include(`${type} message`);
    }
  });

  it("removes toast after duration", async () => {
    const duration = 100; // Short duration for testing
    const hidePromise = oneEvent(element, "toast-hide");

    element.show({ message: "Test message", duration });
    await new Promise((resolve) => setTimeout(resolve, duration + 50));
    await hidePromise;

    expect(element.visible).to.be.false;
    expect(element.messages).to.have.lengthOf(0);
    expect(element.classList.contains("visible")).to.be.false;
  });

  it("removes specific toast on click", async () => {
    element.show({ message: "First message" });
    element.show({ message: "Second message" });
    await element.updateComplete;

    expect(element.messages).to.have.lengthOf(2);

    const firstToast = element.shadowRoot.querySelector(".toast-item");
    firstToast.click();
    await element.updateComplete;

    expect(element.messages).to.have.lengthOf(1);
    expect(element.messages[0].message).to.equal("Second message");
  });

  it("limits maximum number of toasts to 3", async () => {
    for (let i = 1; i <= 5; i++) {
      element.show({ message: `Message ${i}` });
      await element.updateComplete;
    }

    expect(element.messages).to.have.lengthOf(3);
    expect(element.messages[0].message).to.equal("Message 3");
    expect(element.messages[1].message).to.equal("Message 4");
    expect(element.messages[2].message).to.equal("Message 5");
  });

  it("hides all toasts", async () => {
    element.show({ message: "First message" });
    element.show({ message: "Second message" });
    await element.updateComplete;

    const hidePromise = oneEvent(element, "toast-hide");
    element.hide();
    await hidePromise;

    expect(element.visible).to.be.false;
    expect(element.messages).to.have.lengthOf(0);
    expect(element.classList.contains("visible")).to.be.false;
  });

  it("maintains toast order", async () => {
    const messages = ["First", "Second", "Third"];

    for (const msg of messages) {
      element.show({ message: msg });
      await element.updateComplete;
    }

    const toastElements = element.shadowRoot.querySelectorAll(".toast-item");
    expect(toastElements).to.have.lengthOf(3);

    toastElements.forEach((toast, index) => {
      expect(toast.textContent).to.include(messages[index]);
    });
  });

  it("handles empty or invalid messages", async () => {
    element.show({ message: "" });
    await element.updateComplete;
    expect(element.messages).to.have.lengthOf(1);

    element.show({});
    await element.updateComplete;
    expect(element.messages).to.have.lengthOf(2);

    element.show();
    await element.updateComplete;
    expect(element.messages).to.have.lengthOf(3);
  });
});
