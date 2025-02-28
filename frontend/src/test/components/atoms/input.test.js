import { expect, describe, it, beforeEach } from "vitest";
import { fixture, html } from "@open-wc/testing-helpers";
import "../../../components/atoms/input/input.js";

describe("NeoInput", () => {
  let element;

  beforeEach(async () => {
    element = await fixture(html`<neo-input label="Test Input"></neo-input>`);
    await element.updateComplete;
  });

  it("renders with default properties", async () => {
    expect(element).to.exist;
    expect(element.type).to.equal("text");
    expect(element.value).to.equal("");
    expect(element.disabled).to.be.false;
    expect(element.required).to.be.false;
    expect(element.label).to.equal("Test Input");
  });

  it("reflects attribute changes", async () => {
    element.value = "New Value";
    element.type = "email";
    element.disabled = true;
    element.required = true;
    await element.updateComplete;

    const input = element.shadowRoot.querySelector("input");
    expect(input.value).to.equal("New Value");
    expect(input.type).to.equal("email");
    expect(input.disabled).to.be.true;
    expect(input.required).to.be.true;
  });

  it("handles user input", async () => {
    const input = element.shadowRoot.querySelector("input");
    input.value = "Test Value";
    input.dispatchEvent(new Event("input"));
    await element.updateComplete;

    expect(element.value).to.equal("Test Value");
  });

  it("dispatches input and change events", async () => {
    let inputEventFired = false;
    let changeEventFired = false;

    element.addEventListener("neo-input", () => (inputEventFired = true));
    element.addEventListener("neo-change", () => (changeEventFired = true));

    const input = element.shadowRoot.querySelector("input");
    input.value = "Test";
    input.dispatchEvent(new Event("input"));
    input.dispatchEvent(new Event("change"));

    expect(inputEventFired).to.be.true;
    expect(changeEventFired).to.be.true;
  });

  it("handles accessibility requirements", async () => {
    const input = element.shadowRoot.querySelector("input");
    const label = element.shadowRoot.querySelector("label");

    expect(input.getAttribute("aria-label")).to.equal("Test Input");
    expect(input.id).to.exist;
    expect(label.getAttribute("for")).to.equal(input.id);
  });

  it("updates visual state correctly", async () => {
    element.error = "Error message";
    await element.updateComplete;

    const wrapper = element.shadowRoot.querySelector(".input-wrapper");
    expect(wrapper.classList.contains("error")).to.be.true;

    const errorMessage = element.shadowRoot.querySelector(".error-text");
    expect(errorMessage.textContent.trim()).to.equal("Error message");
  });

  it("handles error states appropriately", async () => {
    element.error = "Invalid input";
    await element.updateComplete;

    const input = element.shadowRoot.querySelector("input");
    expect(input.getAttribute("aria-invalid")).to.equal("true");
    expect(input.getAttribute("aria-errormessage")).to.exist;
  });

  it("supports placeholder text", async () => {
    element.placeholder = "Enter value";
    await element.updateComplete;

    const input = element.shadowRoot.querySelector("input");
    expect(input.placeholder).to.equal("Enter value");
  });
});
