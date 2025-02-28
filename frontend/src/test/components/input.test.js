import { expect } from "@esm-bundle/chai";
import { fixture, html, oneEvent } from "@open-wc/testing";
import "../../components/atoms/input/input.js";

describe("NeoInput", () => {
  let element;

  beforeEach(async () => {
    element = await fixture(html`<neo-input label="Test Input"></neo-input>`);
  });

  it("renders with default properties", () => {
    expect(element.type).to.equal("text");
    expect(element.label).to.equal("Test Input");
    expect(element.value).to.equal("");
    expect(element.required).to.be.false;
    expect(element.disabled).to.be.false;
    expect(element.error).to.be.undefined;
    expect(element.helper).to.be.undefined;
  });

  it("reflects property changes", async () => {
    element.value = "test value";
    element.required = true;
    element.disabled = true;
    element.error = "Error message";
    element.helperText = "Helper text";
    await element.updateComplete;

    const input = element.shadowRoot.querySelector("input");
    expect(input.value).to.equal("test value");
    expect(input).to.have.attribute("required");
    expect(input).to.have.attribute("disabled");
    expect(
      element.shadowRoot.querySelector(".error-text").textContent.trim()
    ).to.equal("Error message");

    // Helper text should not be rendered when there's an error
    expect(element.shadowRoot.querySelector(".helper-text")).to.be.null;

    // Now clear the error to test helper text
    element.error = "";
    await element.updateComplete;
    expect(
      element.shadowRoot.querySelector(".helper-text").textContent.trim()
    ).to.equal("Helper text");
  });

  it("handles input events", async () => {
    const input = element.shadowRoot.querySelector("input");
    const changePromise = oneEvent(element, "change");
    const inputPromise = oneEvent(element, "input");

    input.value = "new value";
    input.dispatchEvent(new Event("input"));
    input.dispatchEvent(new Event("change"));

    const inputEvent = await inputPromise;
    const changeEvent = await changePromise;

    expect(inputEvent.detail.value).to.equal("new value");
    expect(changeEvent.detail.value).to.equal("new value");
  });

  it("handles focus and blur events", async () => {
    const focusPromise = oneEvent(element, "focus");
    const blurPromise = oneEvent(element, "blur");

    element.focus();
    await focusPromise;
    expect(document.activeElement).to.equal(element);

    element.blur();
    await blurPromise;
    expect(document.activeElement).to.not.equal(element);
  });

  it("validates required field", async () => {
    element.required = true;
    await element.updateComplete;

    const validityPromise = oneEvent(element, "invalid");
    element.reportValidity();
    const event = await validityPromise;

    expect(event).to.exist;
    expect(element.shadowRoot.querySelector(".error-text")).to.exist;
  });

  it("validates email type", async () => {
    element.type = "email";
    element.value = "invalid-email";
    await element.updateComplete;

    const validityPromise = oneEvent(element, "invalid");
    element.reportValidity();
    const event = await validityPromise;

    expect(event).to.exist;
    expect(element.shadowRoot.querySelector(".error-text")).to.exist;
  });

  it("handles password visibility toggle", async () => {
    const passwordInput = await fixture(html`
      <neo-input type="password" label="Password"></neo-input>
    `);

    const toggleButton =
      passwordInput.shadowRoot.querySelector(".password-toggle");
    const input = passwordInput.shadowRoot.querySelector("input");

    expect(input.type).to.equal("password");

    toggleButton.click();
    await passwordInput.updateComplete;
    expect(input.type).to.equal("text");

    toggleButton.click();
    await passwordInput.updateComplete;
    expect(input.type).to.equal("password");
  });

  it("handles prefix and suffix slots", async () => {
    const inputWithSlots = await fixture(html`
      <neo-input label="Test Input">
        <neo-icon slot="prefix" name="search"></neo-icon>
        <neo-button slot="suffix" variant="icon">
          <neo-icon name="clear"></neo-icon>
        </neo-button>
      </neo-input>
    `);

    const slots = inputWithSlots.shadowRoot.querySelectorAll("slot");
    expect(slots.length).to.equal(2);
    expect(slots[0].name).to.equal("prefix");
    expect(slots[1].name).to.equal("suffix");
  });

  it("maintains proper ARIA attributes", async () => {
    expect(element.shadowRoot.querySelector("input")).to.have.attribute(
      "aria-label",
      "Test Input"
    );

    element.error = "Error message";
    await element.updateComplete;
    expect(element.shadowRoot.querySelector("input")).to.have.attribute(
      "aria-invalid",
      "true"
    );

    element.required = true;
    await element.updateComplete;
    expect(element.shadowRoot.querySelector("input")).to.have.attribute(
      "aria-required",
      "true"
    );
  });

  it("handles form integration", async () => {
    const form = await fixture(html`
      <form>
        <neo-input name="test" label="Test Input" required></neo-input>
      </form>
    `);

    const input = form.querySelector("neo-input");
    const submitPromise = oneEvent(form, "submit");

    input.value = "test value";
    form.dispatchEvent(new Event("submit"));

    const event = await submitPromise;
    expect(event).to.exist;
    expect(form.elements.test.value).to.equal("test value");
  });

  it("supports pattern validation", async () => {
    element.pattern = "[A-Za-z]{3}";
    element.value = "123";
    await element.updateComplete;

    const validityPromise = oneEvent(element, "invalid");
    element.reportValidity();
    const event = await validityPromise;

    expect(event).to.exist;
    expect(element.shadowRoot.querySelector(".error-text")).to.exist;
  });

  it("handles maxlength and minlength", async () => {
    element.maxLength = 5;
    element.minLength = 2;
    await element.updateComplete;

    const input = element.shadowRoot.querySelector("input");
    expect(input).to.have.attribute("maxlength", "5");
    expect(input).to.have.attribute("minlength", "2");

    element.value = "a";
    const validityPromise = oneEvent(element, "invalid");
    element.reportValidity();
    const event = await validityPromise;

    expect(event).to.exist;
  });
});
