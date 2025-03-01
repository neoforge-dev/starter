import { html } from "@open-wc/testing";
import { BaseComponentTest } from "../../base-component.test.js";
import "../../../components/atoms/text-input/text-input.js";

describe("NeoTextInput", () => {
  let testHarness;

  beforeEach(() => {
    testHarness = new BaseComponentTest();
  });

  afterEach(async () => {
    await testHarness.teardown();
  });

  it("renders with default properties", async () => {
    await testHarness.setup(html`<neo-text-input></neo-text-input>`);
    const input = testHarness.query("input");
    expect(input).to.exist;
    expect(input.type).to.equal("text");
  });

  it("reflects properties to attributes", async () => {
    await testHarness.setup(html`
      <neo-text-input
        value="test"
        placeholder="Enter text"
        disabled
        required
      ></neo-text-input>
    `);
    const input = testHarness.query("input");
    expect(input.value).to.equal("test");
    expect(input.placeholder).to.equal("Enter text");
    expect(input.disabled).to.be.true;
    expect(input.required).to.be.true;
  });

  it("renders label when provided", async () => {
    await testHarness.setup(html`
      <neo-text-input label="Username"></neo-text-input>
    `);
    const label = testHarness.query("label");
    expect(label).to.exist;
    expect(label.textContent).to.equal("Username");
  });

  it("renders helper text when provided", async () => {
    await testHarness.setup(html`
      <neo-text-input helper-text="Enter your username"></neo-text-input>
    `);
    const helperText = testHarness.query(".helper-text");
    expect(helperText).to.exist;
    expect(helperText.textContent).to.equal("Enter your username");
  });

  it("renders error message when provided", async () => {
    await testHarness.setup(html`
      <neo-text-input error="Username is required"></neo-text-input>
    `);
    const errorMessage = testHarness.query(".error-message");
    expect(errorMessage).to.exist;
    expect(errorMessage.textContent).to.equal("Username is required");
  });

  it("shows password toggle for password type", async () => {
    await testHarness.setup(html`
      <neo-text-input type="password"></neo-text-input>
    `);
    const toggleButton = testHarness.query(".password-toggle");
    expect(toggleButton).to.exist;

    await testHarness.click(".password-toggle");
    expect(testHarness.query("input").type).to.equal("text");

    await testHarness.click(".password-toggle");
    expect(testHarness.query("input").type).to.equal("password");
  });

  it("shows clear button when clearable and has value", async () => {
    await testHarness.setup(html`
      <neo-text-input clearable value="test"></neo-text-input>
    `);
    const clearButton = testHarness.query(".clear-button");
    expect(clearButton).to.exist;

    await testHarness.click(".clear-button");
    expect(testHarness.query("input").value).to.equal("");
  });

  it("dispatches neo-input event on input", async () => {
    await testHarness.setup(html`<neo-text-input></neo-text-input>`);
    const input = testHarness.query("input");

    const eventPromise = testHarness.waitForEvent("neo-input");
    await testHarness.type("input", "test");
    const event = await eventPromise;

    expect(event.detail.value).to.equal("test");
  });

  it("dispatches neo-change event on change", async () => {
    await testHarness.setup(html`<neo-text-input></neo-text-input>`);
    const input = testHarness.query("input");

    const eventPromise = testHarness.waitForEvent("neo-change");
    await testHarness.type("input", "test");
    const event = await eventPromise;

    expect(event.detail.value).to.equal("test");
  });

  it("updates focused state on focus/blur", async () => {
    await testHarness.setup(html`<neo-text-input></neo-text-input>`);
    const input = testHarness.query("input");

    input.focus();
    await testHarness.waitForUpdate();
    expect(testHarness.element.hasAttribute("focused")).to.be.true;

    input.blur();
    await testHarness.waitForUpdate();
    expect(testHarness.element.hasAttribute("focused")).to.be.false;
  });

  it("supports prefix and suffix slots", async () => {
    await testHarness.setup(html`
      <neo-text-input>
        <span slot="prefix">$</span>
        <span slot="suffix">.00</span>
      </neo-text-input>
    `);

    const prefix = testHarness.query("[slot='prefix']");
    const suffix = testHarness.query("[slot='suffix']");

    expect(prefix).to.exist;
    expect(suffix).to.exist;
    expect(prefix.textContent).to.equal("$");
    expect(suffix.textContent).to.equal(".00");
  });

  it("has proper ARIA attributes", async () => {
    await testHarness.setup(html`
      <neo-text-input
        label="Username"
        helper-text="Enter your username"
        error="Username is required"
        required
      ></neo-text-input>
    `);

    const input = testHarness.query("input");
    expect(input.getAttribute("aria-label")).to.equal("Username");
    expect(input.getAttribute("aria-required")).to.equal("true");
    expect(input.getAttribute("aria-invalid")).to.exist;
    expect(input.getAttribute("aria-describedby")).to.exist;
  });
});
