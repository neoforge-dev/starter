import { fixture, expect, oneEvent } from "@open-wc/testing";
import { html } from "lit";
import "../../components/ui/checkbox.js";

describe("Checkbox", () => {
  let element;

  beforeEach(async () => {
    element = await fixture(html`
      <ui-checkbox
        name="test"
        label="Test Checkbox"
        value="test-value"
      ></ui-checkbox>
    `);
  });

  it("renders with default properties", () => {
    const checkbox = element.shadowRoot.querySelector('input[type="checkbox"]');
    const label = element.shadowRoot.querySelector("label");

    expect(checkbox).to.exist;
    expect(label).to.exist;
    expect(checkbox.name).to.equal("test");
    expect(label.textContent.trim()).to.equal("Test Checkbox");
    expect(checkbox.value).to.equal("test-value");
    expect(checkbox.checked).to.be.false;
  });

  it("handles checked state changes", async () => {
    const checkbox = element.shadowRoot.querySelector('input[type="checkbox"]');

    // Check via property
    element.checked = true;
    await element.updateComplete;
    expect(checkbox.checked).to.be.true;

    // Check via click
    checkbox.click();
    await element.updateComplete;
    expect(checkbox.checked).to.be.false;
    expect(element.checked).to.be.false;
  });

  it("emits change events", async () => {
    const checkbox = element.shadowRoot.querySelector('input[type="checkbox"]');
    let eventDetail;

    setTimeout(() => {
      checkbox.click();
      checkbox.dispatchEvent(new Event("change", { bubbles: true }));
    });

    const { detail } = await oneEvent(element, "change");
    expect(detail.checked).to.be.true;
    expect(detail.value).to.equal("test-value");
  });

  it("supports indeterminate state", async () => {
    const checkbox = element.shadowRoot.querySelector('input[type="checkbox"]');

    element.indeterminate = true;
    await element.updateComplete;

    expect(checkbox.indeterminate).to.be.true;
    expect(element.getAttribute("aria-checked")).to.equal("mixed");

    // Click should clear indeterminate state
    checkbox.click();
    await element.updateComplete;

    expect(checkbox.indeterminate).to.be.false;
    expect(element.getAttribute("aria-checked")).to.equal("true");
  });

  it("handles disabled state", async () => {
    element.disabled = true;
    await element.updateComplete;

    const checkbox = element.shadowRoot.querySelector('input[type="checkbox"]');
    expect(checkbox.disabled).to.be.true;
    expect(element.hasAttribute("disabled")).to.be.true;

    // Click should not change state
    checkbox.click();
    await element.updateComplete;
    expect(checkbox.checked).to.be.false;
  });

  it("supports required state", async () => {
    element.required = true;
    await element.updateComplete;

    const checkbox = element.shadowRoot.querySelector('input[type="checkbox"]');
    expect(checkbox.required).to.be.true;
    expect(checkbox.validity.valid).to.be.false;

    // Check to make valid
    checkbox.click();
    await element.updateComplete;
    expect(checkbox.validity.valid).to.be.true;
  });

  it("maintains accessibility attributes", () => {
    const checkbox = element.shadowRoot.querySelector('input[type="checkbox"]');
    const label = element.shadowRoot.querySelector("label");

    expect(checkbox.getAttribute("role")).to.equal("checkbox");
    expect(checkbox.getAttribute("aria-checked")).to.equal("false");
    expect(label.getAttribute("for")).to.equal(checkbox.id);

    // Test focus management
    checkbox.focus();
    expect(document.activeElement).to.equal(element);
  });

  it("supports custom styles", async () => {
    element = await fixture(html`
      <ui-checkbox
        name="styled"
        label="Styled Checkbox"
        --checkbox-size="24px"
        --checkbox-color="blue"
      ></ui-checkbox>
    `);

    const styles = window.getComputedStyle(
      element.shadowRoot.querySelector(".checkbox")
    );
    expect(styles.getPropertyValue("--checkbox-size")).to.equal("24px");
    expect(styles.getPropertyValue("--checkbox-color")).to.equal("blue");
  });

  it("handles group context", async () => {
    const group = await fixture(html`
      <div role="group" aria-label="Checkbox Group">
        <ui-checkbox name="option1" label="Option 1" value="1"></ui-checkbox>
        <ui-checkbox name="option2" label="Option 2" value="2"></ui-checkbox>
      </div>
    `);

    const [checkbox1, checkbox2] = group.querySelectorAll("ui-checkbox");

    // Check first option
    checkbox1.shadowRoot.querySelector("input").click();
    await checkbox1.updateComplete;

    expect(checkbox1.checked).to.be.true;
    expect(checkbox2.checked).to.be.false;
  });

  it("supports keyboard interaction", async () => {
    const checkbox = element.shadowRoot.querySelector('input[type="checkbox"]');

    // Space key
    checkbox.focus();
    checkbox.dispatchEvent(new KeyboardEvent("keydown", { key: " " }));
    await element.updateComplete;

    expect(checkbox.checked).to.be.true;

    // Enter key
    checkbox.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    await element.updateComplete;

    expect(checkbox.checked).to.be.false;
  });

  it("handles form reset", async () => {
    const form = await fixture(html`
      <form>
        <ui-checkbox name="test" label="Test" checked></ui-checkbox>
      </form>
    `);

    const checkbox = form.querySelector("ui-checkbox");
    const input = checkbox.shadowRoot.querySelector("input");

    // Change state
    input.click();
    await checkbox.updateComplete;
    expect(input.checked).to.be.false;

    // Reset form
    form.reset();
    await checkbox.updateComplete;
    expect(input.checked).to.be.true;
  });

  it("supports validation messages", async () => {
    element.required = true;
    element.validationMessage = "This checkbox is required";
    await element.updateComplete;

    const errorMessage = element.shadowRoot.querySelector(".error-message");
    expect(errorMessage).to.exist;
    expect(errorMessage.textContent.trim()).to.equal(
      "This checkbox is required"
    );

    // Check to clear error
    const checkbox = element.shadowRoot.querySelector("input");
    checkbox.click();
    await element.updateComplete;

    expect(element.shadowRoot.querySelector(".error-message")).to.not.exist;
  });
});
