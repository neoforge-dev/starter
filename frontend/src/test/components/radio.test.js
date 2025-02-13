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
    expect(element.shadowRoot.querySelector(".radio")).to.have.class("checked");
  });

  it("handles click events", async () => {
    const input = element.shadowRoot.querySelector("input[type='radio']");
    const changePromise = oneEvent(element, "change");

    input.click();
    const event = await changePromise;

    expect(event.detail.checked).to.be.true;
    expect(event.detail.value).to.equal("test-value");
    expect(element.checked).to.be.true;
  });

  it("handles keyboard interaction", async () => {
    const input = element.shadowRoot.querySelector("input[type='radio']");
    const changePromise = oneEvent(element, "change");

    element.focus();
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Space" }));
    const event = await changePromise;

    expect(event.detail.checked).to.be.true;
    expect(element.checked).to.be.true;
  });

  it("maintains focus state", async () => {
    const focusPromise = oneEvent(element, "focus");
    const blurPromise = oneEvent(element, "blur");

    element.focus();
    await focusPromise;
    expect(document.activeElement).to.equal(element);

    element.blur();
    await blurPromise;
    expect(document.activeElement).to.not.equal(element);
  });

  it("handles disabled state", async () => {
    element.disabled = true;
    await element.updateComplete;

    const input = element.shadowRoot.querySelector("input[type='radio']");
    expect(input.disabled).to.be.true;
    expect(element.shadowRoot.querySelector(".radio")).to.have.class(
      "disabled"
    );

    let changed = false;
    element.addEventListener("change", () => (changed = true));

    input.click();
    expect(changed).to.be.false;
    expect(element.checked).to.be.false;
  });

  it("handles required validation", async () => {
    element.required = true;
    await element.updateComplete;

    const input = element.shadowRoot.querySelector("input[type='radio']");
    expect(input.required).to.be.true;

    const validityPromise = oneEvent(element, "invalid");
    element.reportValidity();
    const event = await validityPromise;

    expect(event).to.exist;
    expect(element.shadowRoot.querySelector(".error-message")).to.exist;
  });

  it("supports custom validation message", async () => {
    element.required = true;
    element.setCustomValidity("Custom error message");
    await element.updateComplete;

    element.reportValidity();
    expect(element.shadowRoot.querySelector(".error-message")).to.have.text(
      "Custom error message"
    );
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

    const formData = new FormData(form);
    expect(formData.get("test")).to.equal("value1");

    radios[1].checked = true;
    expect(formData.get("test")).to.equal("value2");
    expect(radios[0].checked).to.be.false;
  });

  it("supports custom styles", async () => {
    element.style.setProperty("--radio-color", "purple");
    element.style.setProperty("--radio-size", "24px");
    await element.updateComplete;

    const radio = element.shadowRoot.querySelector(".radio");
    const styles = window.getComputedStyle(radio);
    expect(styles.backgroundColor).to.equal("purple");
    expect(styles.width).to.equal("24px");
  });

  it("maintains proper ARIA attributes", async () => {
    expect(element.shadowRoot.querySelector("input")).to.have.attribute(
      "aria-checked",
      "false"
    );
    expect(element.shadowRoot.querySelector("input")).to.have.attribute(
      "role",
      "radio"
    );

    element.checked = true;
    await element.updateComplete;
    expect(element.shadowRoot.querySelector("input")).to.have.attribute(
      "aria-checked",
      "true"
    );
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

    // Check first radio
    radios[0].checked = true;
    await radios[0].updateComplete;
    expect(radios[0].checked).to.be.true;

    // Check second radio
    radios[1].checked = true;
    await radios[1].updateComplete;
    expect(radios[1].checked).to.be.true;
    expect(radios[0].checked).to.be.false;
  });

  it("handles keyboard navigation in groups", async () => {
    const group = await fixture(html`
      <div role="radiogroup" aria-label="Radio Group">
        <neo-radio name="group" value="1" label="Option 1"></neo-radio>
        <neo-radio name="group" value="2" label="Option 2"></neo-radio>
        <neo-radio name="group" value="3" label="Option 3"></neo-radio>
      </div>
    `);

    const radios = group.querySelectorAll("neo-radio");
    radios[0].focus();

    // Arrow right
    radios[0].dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowRight" })
    );
    await radios[1].updateComplete;
    expect(radios[1].checked).to.be.true;
    expect(document.activeElement).to.equal(radios[1]);

    // Arrow left
    radios[1].dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft" }));
    await radios[0].updateComplete;
    expect(radios[0].checked).to.be.true;
    expect(document.activeElement).to.equal(radios[0]);
  });
});
