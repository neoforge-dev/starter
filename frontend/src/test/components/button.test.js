import { expect } from "@esm-bundle/chai";
import { fixture, html, oneEvent } from "@open-wc/testing";
import "../../../src/components/atoms/button/button.js";

describe("NeoButton", () => {
  let element;

  beforeEach(async () => {
    element = await fixture(html`<neo-button>Click me</neo-button>`);
  });

  it("renders with default properties", () => {
    expect(element.variant).to.equal("primary");
    expect(element.size).to.equal("medium");
    expect(element.disabled).to.be.false;
    expect(element.loading).to.be.false;
  });

  it("responds to click events", async () => {
    let clicked = false;
    element.addEventListener("click", () => (clicked = true));

    const button = element.shadowRoot.querySelector("button");
    button.click();

    expect(clicked).to.be.true;
  });

  it("reflects variant attribute", async () => {
    element.variant = "secondary";
    await element.updateComplete;

    const button = element.shadowRoot.querySelector("button");
    expect(button.classList.contains("variant-secondary")).to.be.true;
  });

  it("shows loading state", async () => {
    element.loading = true;
    await element.updateComplete;

    const spinner = element.shadowRoot.querySelector("neo-spinner");
    expect(spinner).to.exist;
    expect(element.shadowRoot.querySelector("button")).to.have.class("loading");
  });

  it("disables button when loading", async () => {
    element.loading = true;
    await element.updateComplete;

    const button = element.shadowRoot.querySelector("button");
    expect(button.disabled).to.be.true;
    expect(button.getAttribute("aria-busy")).to.equal("true");
  });

  it("supports different sizes", async () => {
    element.size = "small";
    await element.updateComplete;

    const button = element.shadowRoot.querySelector("button");
    expect(button.classList.contains("size-small")).to.be.true;
  });

  it("renders slotted content", async () => {
    const buttonWithSlots = await fixture(html`
      <neo-button>
        <span slot="prefix">Before</span>
        Click me
        <span slot="suffix">After</span>
      </neo-button>
    `);

    const slots = buttonWithSlots.shadowRoot.querySelectorAll("slot");
    expect(slots.length).to.equal(3);
    expect(slots[0].name).to.equal("prefix");
    expect(slots[1].name).to.equal("");
    expect(slots[2].name).to.equal("suffix");
  });

  it("maintains proper ARIA attributes", async () => {
    element.disabled = true;
    await element.updateComplete;

    const button = element.shadowRoot.querySelector("button");
    expect(button).to.have.attribute("role", "button");
    expect(button).to.have.attribute("aria-disabled", "true");
  });

  it("prevents click when disabled", async () => {
    element.disabled = true;
    await element.updateComplete;

    let clicked = false;
    element.addEventListener("click", () => (clicked = true));

    const button = element.shadowRoot.querySelector("button");
    button.click();

    expect(clicked).to.be.false;
  });

  it("supports form submission", async () => {
    const form = await fixture(html`
      <form>
        <neo-button type="submit">Submit</neo-button>
      </form>
    `);

    const button = form.querySelector("neo-button");
    expect(button.type).to.equal("submit");
  });
});
