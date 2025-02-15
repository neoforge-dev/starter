import { html, fixture, expect, oneEvent } from "@open-wc/testing";
import "../../../components/atoms/text-input/text-input.js";

describe("NeoTextInput", () => {
  it("renders with default properties", async () => {
    const el = await fixture(html`<neo-text-input></neo-text-input>`);

    expect(el.type).to.equal("text");
    expect(el.value).to.equal("");
    expect(el.placeholder).to.equal("");
    expect(el.disabled).to.be.false;
    expect(el.required).to.be.false;
    expect(el.readonly).to.be.false;
    expect(el.clearable).to.be.false;
  });

  it("reflects properties to attributes", async () => {
    const el = await fixture(
      html`<neo-text-input
        type="email"
        value="test@example.com"
        placeholder="Enter email"
        ?disabled="${true}"
        ?required="${true}"
        ?readonly="${true}"
      ></neo-text-input>`
    );

    expect(el).to.have.attribute("type", "email");
    expect(el).to.have.attribute("disabled");
    expect(el).to.have.attribute("required");
    expect(el).to.have.attribute("readonly");
    expect(el.value).to.equal("test@example.com");
    expect(el.placeholder).to.equal("Enter email");
  });

  it("renders label when provided", async () => {
    const el = await fixture(
      html`<neo-text-input label="Email Address"></neo-text-input>`
    );

    const label = el.shadowRoot.querySelector("label");
    expect(label).to.exist;
    expect(label.textContent).to.equal("Email Address");
  });

  it("renders helper text when provided", async () => {
    const el = await fixture(
      html`<neo-text-input helper="Please enter your email"></neo-text-input>`
    );

    const helper = el.shadowRoot.querySelector(".helper-text");
    expect(helper).to.exist;
    expect(helper.textContent).to.equal("Please enter your email");
  });

  it("renders error message when provided", async () => {
    const el = await fixture(
      html`<neo-text-input error="Invalid email format"></neo-text-input>`
    );

    const error = el.shadowRoot.querySelector(".error-message");
    expect(error).to.exist;
    expect(error.textContent.trim()).to.equal("Invalid email format");
  });

  it("shows password toggle for password type", async () => {
    const el = await fixture(
      html`<neo-text-input type="password" value="secret"></neo-text-input>`
    );

    const toggleButton = el.shadowRoot.querySelector(".password-toggle");
    expect(toggleButton).to.exist;

    const input = el.shadowRoot.querySelector("input");
    expect(input.type).to.equal("password");

    toggleButton.click();
    await el.updateComplete;
    expect(input.type).to.equal("text");

    toggleButton.click();
    await el.updateComplete;
    expect(input.type).to.equal("password");
  });

  it("shows clear button when clearable and has value", async () => {
    const el = await fixture(
      html`<neo-text-input
        value="test value"
        ?clearable="${true}"
      ></neo-text-input>`
    );

    const clearButton = el.shadowRoot.querySelector(".clear-button");
    expect(clearButton).to.exist;

    clearButton.click();
    await el.updateComplete;
    expect(el.value).to.equal("");
  });

  it("dispatches neo-input event on input", async () => {
    const el = await fixture(html`<neo-text-input></neo-text-input>`);
    const input = el.shadowRoot.querySelector("input");

    setTimeout(() => {
      input.value = "new value";
      input.dispatchEvent(new Event("input"));
    });

    const { detail } = await oneEvent(el, "neo-input");
    expect(detail.value).to.equal("new value");
  });

  it("dispatches neo-change event on change", async () => {
    const el = await fixture(html`<neo-text-input></neo-text-input>`);
    const input = el.shadowRoot.querySelector("input");

    setTimeout(() => {
      input.value = "new value";
      input.dispatchEvent(new Event("change"));
    });

    const { detail } = await oneEvent(el, "neo-change");
    expect(detail.value).to.equal("new value");
  });

  it("updates focused state on focus/blur", async () => {
    const el = await fixture(html`<neo-text-input></neo-text-input>`);
    const input = el.shadowRoot.querySelector("input");

    input.dispatchEvent(new Event("focus"));
    await el.updateComplete;
    expect(el.shadowRoot.querySelector(".input-wrapper")).to.have.class(
      "focused"
    );

    input.dispatchEvent(new Event("blur"));
    await el.updateComplete;
    expect(el.shadowRoot.querySelector(".input-wrapper")).to.not.have.class(
      "focused"
    );
  });

  it("supports prefix and suffix slots", async () => {
    const el = await fixture(html`
      <neo-text-input>
        <neo-icon slot="prefix" name="search"></neo-icon>
        <neo-icon slot="suffix" name="calendar"></neo-icon>
      </neo-text-input>
    `);

    const prefix = el.shadowRoot.querySelector('slot[name="prefix"]');
    const suffix = el.shadowRoot.querySelector('slot[name="suffix"]');

    expect(prefix).to.exist;
    expect(suffix).to.exist;
  });

  it("has proper ARIA attributes", async () => {
    const el = await fixture(html`
      <neo-text-input
        label="Username"
        error="Required field"
        ?required="${true}"
      ></neo-text-input>
    `);

    const input = el.shadowRoot.querySelector("input");
    expect(input).to.have.attribute("aria-label", "Username");
    expect(input).to.have.attribute("aria-invalid", "true");
    expect(input).to.have.attribute("aria-required", "true");
    expect(input).to.have.attribute("aria-errormessage");
  });
});
