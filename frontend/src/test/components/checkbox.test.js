import { expect } from "@esm-bundle/chai";
import { fixture, html, oneEvent } from "@open-wc/testing";
import "../../components/atoms/checkbox/checkbox.js";

describe("NeoCheckbox", () => {
  let element;

  beforeEach(async () => {
    element = await fixture(
      html`<neo-checkbox label="Test Checkbox"></neo-checkbox>`
    );
  });

  it("renders with default properties", () => {
    expect(element.checked).to.be.false;
    expect(element.disabled).to.be.false;
    expect(element.required).to.be.false;
    expect(element.indeterminate).to.be.false;
    expect(element.label).to.equal("Test Checkbox");
    expect(element.value).to.equal("");
  });

  it("reflects checked state changes", async () => {
    element.checked = true;
    await element.updateComplete;

    const input = element.shadowRoot.querySelector("input[type='checkbox']");
    expect(input.checked).to.be.true;
    expect(element.shadowRoot.querySelector(".checkbox")).to.have.class(
      "checked"
    );
  });

  it("handles click events", async () => {
    const input = element.shadowRoot.querySelector("input[type='checkbox']");
    const changePromise = oneEvent(element, "change");

    input.click();
    const event = await changePromise;

    expect(event.detail.checked).to.be.true;
    expect(element.checked).to.be.true;
  });

  it("handles keyboard interaction", async () => {
    const input = element.shadowRoot.querySelector("input[type='checkbox']");
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

    const input = element.shadowRoot.querySelector("input[type='checkbox']");
    expect(input.disabled).to.be.true;
    expect(element.shadowRoot.querySelector(".checkbox")).to.have.class(
      "disabled"
    );

    let changed = false;
    element.addEventListener("change", () => (changed = true));

    input.click();
    expect(changed).to.be.false;
    expect(element.checked).to.be.false;
  });

  it("supports indeterminate state", async () => {
    element.indeterminate = true;
    await element.updateComplete;

    const input = element.shadowRoot.querySelector("input[type='checkbox']");
    expect(input.indeterminate).to.be.true;
    expect(element.shadowRoot.querySelector(".checkbox")).to.have.class(
      "indeterminate"
    );
  });

  it("handles required validation", async () => {
    element.required = true;
    await element.updateComplete;

    const input = element.shadowRoot.querySelector("input[type='checkbox']");
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
        <neo-checkbox
          name="test"
          value="test-value"
          label="Test"
        ></neo-checkbox>
      </form>
    `);

    const checkbox = form.querySelector("neo-checkbox");
    checkbox.checked = true;

    const formData = new FormData(form);
    expect(formData.get("test")).to.equal("test-value");
  });

  it("supports custom styles", async () => {
    element.style.setProperty("--checkbox-color", "purple");
    element.style.setProperty("--checkbox-size", "24px");
    await element.updateComplete;

    const checkbox = element.shadowRoot.querySelector(".checkbox");
    const styles = window.getComputedStyle(checkbox);
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
      "checkbox"
    );

    element.checked = true;
    await element.updateComplete;
    expect(element.shadowRoot.querySelector("input")).to.have.attribute(
      "aria-checked",
      "true"
    );

    element.indeterminate = true;
    await element.updateComplete;
    expect(element.shadowRoot.querySelector("input")).to.have.attribute(
      "aria-checked",
      "mixed"
    );
  });

  it("supports group selection", async () => {
    const group = await fixture(html`
      <div role="group" aria-label="Checkbox Group">
        <neo-checkbox name="option" value="1" label="Option 1"></neo-checkbox>
        <neo-checkbox name="option" value="2" label="Option 2"></neo-checkbox>
        <neo-checkbox name="option" value="3" label="Option 3"></neo-checkbox>
      </div>
    `);

    const checkboxes = group.querySelectorAll("neo-checkbox");
    const values = [];

    for (const checkbox of checkboxes) {
      checkbox.checked = true;
      values.push(checkbox.value);
    }

    expect(values).to.deep.equal(["1", "2", "3"]);
  });
});
