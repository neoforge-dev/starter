import { expect } from "@esm-bundle/chai";
import { fixture, html, oneEvent } from "@open-wc/testing";
import "../../components/atoms/radio/radio.js";

describe("NeoRadio", () => {
  let element;

  beforeEach(async () => {
    element = await fixture(
      html`<neo-radio
        name="test"
        label="Test Radio"
        value="test-value"
      ></neo-radio>`
    );
  });

  it("renders with default properties", () => {
    expect(element.checked).to.be.false;
    expect(element.disabled).to.be.false;
    expect(element.required).to.be.false;
    expect(element.name).to.equal("test");
    expect(element.label).to.equal("Test Radio");
    expect(element.value).to.equal("test-value");
  });

  it("reflects checked state changes", async () => {
    element.checked = true;
    await element.updateComplete;

    const input = element.shadowRoot.querySelector("input[type='radio']");
    expect(input.checked).to.be.true;
    expect(element.shadowRoot.querySelector(".radio-wrapper")).to.have.class(
      "checked"
    );
  });

  it("handles click events", async () => {
    const input = element.shadowRoot.querySelector("input[type='radio']");
    const changePromise = oneEvent(element, "neo-change");

    input.click();
    const event = await changePromise;

    expect(event.detail.checked).to.be.true;
    expect(event.detail.value).to.equal("test-value");
    expect(element.checked).to.be.true;
  });

  it("handles keyboard interaction", async () => {
    const input = element.shadowRoot.querySelector("input[type='radio']");
    const changePromise = oneEvent(element, "neo-change");

    input.focus();
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Space" }));
    const event = await changePromise;

    expect(event.detail.checked).to.be.true;
    expect(element.checked).to.be.true;
  });

  it("maintains focus state", async () => {
    const input = element.shadowRoot.querySelector("input[type='radio']");

    input.focus();
    expect(element.shadowRoot.querySelector(".radio-custom")).to.exist;

    input.blur();
    expect(document.activeElement).to.not.equal(input);
  });

  it("handles disabled state", async () => {
    element.disabled = true;
    await element.updateComplete;

    const input = element.shadowRoot.querySelector("input[type='radio']");
    expect(input.disabled).to.be.true;
    expect(element.shadowRoot.querySelector(".radio-wrapper")).to.have.class(
      "disabled"
    );

    let changed = false;
    element.addEventListener("neo-change", () => (changed = true));

    input.click();
    expect(changed).to.be.false;
    expect(element.checked).to.be.false;
  });

  it("handles required validation", async () => {
    element.required = true;
    element.error = "This field is required";
    await element.updateComplete;

    const input = element.shadowRoot.querySelector("input[type='radio']");
    expect(input.required).to.be.true;
    expect(element.shadowRoot.querySelector(".error-message")).to.exist;
    expect(element.shadowRoot.querySelector(".radio-wrapper")).to.have.class(
      "error"
    );
  });

  it("supports error messages", async () => {
    element.error = "Custom error message";
    await element.updateComplete;

    const errorMessage = element.shadowRoot.querySelector(".error-message");
    expect(errorMessage).to.exist;
    expect(errorMessage.textContent.trim()).to.equal("Custom error message");
  });

  it("handles form integration", async () => {
    const form = await fixture(html`
      <form>
        <neo-radio name="test" value="value1" label="Option 1"></neo-radio>
        <neo-radio name="test" value="value2" label="Option 2"></neo-radio>
      </form>
    `);

    const radios = form.querySelectorAll("neo-radio");
    radios[0].checked = true;
    await radios[0].updateComplete;

    radios[1].checked = true;
    await radios[1].updateComplete;

    expect(radios[1].checked).to.be.true;
    expect(radios[0].checked).to.be.false;
  });

  it("maintains proper ARIA attributes", async () => {
    const input = element.shadowRoot.querySelector("input[type='radio']");
    expect(input.getAttribute("aria-label")).to.equal("Test Radio");
    expect(input.getAttribute("aria-invalid")).to.equal("false");

    element.error = "Error message";
    await element.updateComplete;
    expect(input.getAttribute("aria-invalid")).to.equal("true");
    expect(input.getAttribute("aria-errormessage")).to.exist;
  });

  it("supports radio groups", async () => {
    const group = await fixture(html`
      <div role="radiogroup" aria-label="Radio Group">
        <neo-radio name="group" value="1" label="Option 1"></neo-radio>
        <neo-radio name="group" value="2" label="Option 2"></neo-radio>
        <neo-radio name="group" value="3" label="Option 3"></neo-radio>
      </div>
    `);

    const radios = group.querySelectorAll("neo-radio");

    radios[0].checked = true;
    await radios[0].updateComplete;
    expect(radios[0].checked).to.be.true;

    radios[1].checked = true;
    await radios[1].updateComplete;
    expect(radios[1].checked).to.be.true;
    expect(radios[0].checked).to.be.false;
  });
});
