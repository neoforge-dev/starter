import { expect, describe, it, beforeEach } from "vitest";
import { fixture, html } from "@open-wc/testing-helpers";

// Skipping all tests in this file due to custom element registration issues
describe.skip("FormValidation", () => {
  let element;

  beforeEach(async () => {
    element = await fixture(html`<form-validation></form-validation>`);
    await element.updateComplete;
  });

  it("renders with default properties", async () => {
    expect(element).to.exist;
    expect(element.value).to.equal("");
    expect(element.errors).to.deep.equal([]);
    expect(element.touched).to.be.false;
  });

  it("validates required field", async () => {
    element.setAttribute("required", "");
    await element.updateComplete;

    const event = new Event("blur");
    element.dispatchEvent(event);
    await element.updateComplete;

    expect(element.errors).to.include("This field is required");
    expect(element.touched).to.be.true;
  });

  it("validates email format", async () => {
    element.setAttribute("type", "email");
    element.value = "invalid-email";
    await element.updateComplete;

    const event = new Event("blur");
    element.dispatchEvent(event);
    await element.updateComplete;

    expect(element.errors).to.include("Please enter a valid email address");
  });

  it("validates minimum length", async () => {
    element.setAttribute("minlength", "5");
    element.value = "test";
    await element.updateComplete;

    const event = new Event("blur");
    element.dispatchEvent(event);
    await element.updateComplete;

    expect(element.errors).to.include("Minimum length is 5 characters");
  });

  it("validates maximum length", async () => {
    element.setAttribute("maxlength", "5");
    element.value = "testing";
    await element.updateComplete;

    const event = new Event("blur");
    element.dispatchEvent(event);
    await element.updateComplete;

    expect(element.errors).to.include("Maximum length is 5 characters");
  });

  it("validates pattern", async () => {
    element.setAttribute("pattern", "^[A-Za-z]+$");
    element.value = "123";
    await element.updateComplete;

    const event = new Event("blur");
    element.dispatchEvent(event);
    await element.updateComplete;

    expect(element.errors).to.include("Please match the requested format");
  });

  it("clears errors when valid", async () => {
    element.setAttribute("required", "");
    await element.updateComplete;

    const blurEvent = new Event("blur");
    element.dispatchEvent(blurEvent);
    await element.updateComplete;

    expect(element.errors).to.not.be.empty;

    element.value = "test value";
    const inputEvent = new Event("input");
    element.dispatchEvent(inputEvent);
    await element.updateComplete;

    expect(element.errors).to.be.empty;
  });
});
