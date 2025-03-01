import { expect, describe, it, beforeEach } from "vitest";
import { fixture, html } from "@open-wc/testing-helpers";
import "../../../components/atoms/radio/radio.js";

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
    await element.updateComplete;
  });

  it("renders with default properties", async () => {
    expect(element).to.exist;
    expect(element.checked).to.be.false;
    expect(element.disabled).to.be.false;
    expect(element.required).to.be.false;
    expect(element.name).to.equal("test");
    expect(element.value).to.equal("test-value");
    expect(element.label).to.equal("Test Radio");
  });

  it("reflects attribute changes", async () => {
    element.checked = true;
    element.disabled = true;
    element.required = true;
    await element.updateComplete;

    const radio = element.shadowRoot.querySelector("input[type='radio']");
    expect(radio.checked).to.be.true;
    expect(radio.disabled).to.be.true;
    expect(radio.required).to.be.true;
  });

  it("handles user interactions", async () => {
    const radio = element.shadowRoot.querySelector("input[type='radio']");
    radio.click();
    await element.updateComplete;

    expect(element.checked).to.be.true;
  });

  it("dispatches change events", async () => {
    let eventFired = false;
    let eventDetail = null;

    element.addEventListener("neo-change", (e) => {
      eventFired = true;
      eventDetail = e.detail;
    });

    const radio = element.shadowRoot.querySelector("input[type='radio']");
    radio.click();
    await element.updateComplete;

    expect(eventFired).to.be.true;
    expect(eventDetail.checked).to.be.true;
    expect(eventDetail.value).to.equal("test-value");
  });

  it("handles accessibility requirements", async () => {
    const radio = element.shadowRoot.querySelector("input[type='radio']");
    const label = element.shadowRoot.querySelector("label");

    expect(radio.getAttribute("aria-label")).to.equal("Test Radio");
    expect(radio.id).to.exist;
    expect(label.getAttribute("for")).to.equal(radio.id);
  });

  it("updates visual state correctly", async () => {
    element.checked = true;
    await element.updateComplete;

    const wrapper = element.shadowRoot.querySelector(".radio-wrapper");
    expect(wrapper.classList.contains("checked")).to.be.true;

    element.disabled = true;
    await element.updateComplete;
    expect(wrapper.classList.contains("disabled")).to.be.true;
  });

  it("handles error states appropriately", async () => {
    element.error = "Please select an option";
    await element.updateComplete;

    const radio = element.shadowRoot.querySelector("input[type='radio']");
    expect(radio.getAttribute("aria-invalid")).to.equal("true");

    const errorMessage = element.shadowRoot.querySelector(".error-message");
    expect(errorMessage.textContent.trim()).to.equal("Please select an option");
  });

  it("works in a radio group", async () => {
    const group = await fixture(html`
      <div>
        <neo-radio name="group" value="1" label="Option 1"></neo-radio>
        <neo-radio name="group" value="2" label="Option 2"></neo-radio>
        <neo-radio name="group" value="3" label="Option 3"></neo-radio>
      </div>
    `);

    const radios = group.querySelectorAll("neo-radio");
    const firstRadio = radios[0];
    const secondRadio = radios[1];

    firstRadio.checked = true;
    await firstRadio.updateComplete;
    expect(firstRadio.checked).to.be.true;
    expect(secondRadio.checked).to.be.false;

    secondRadio.checked = true;
    firstRadio.checked = false;
    await secondRadio.updateComplete;
    await firstRadio.updateComplete;
    expect(firstRadio.checked).to.be.false;
    expect(secondRadio.checked).to.be.true;
  });
});
