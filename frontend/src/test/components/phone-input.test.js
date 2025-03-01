import { fixture, expect, oneEvent } from "@open-wc/testing";
import { html } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";
import "../../components/ui/phone-input.js";

describe("Phone Input", () => {
  let element;

  beforeEach(async () => {
    element = await fixture(html`
      <ui-phone-input
        name="phone"
        label="Phone Number"
        placeholder="Enter phone number"
        defaultCountry="US"
      ></ui-phone-input>
    `);
  });

  it("renders with default properties", () => {
    const input = element.shadowRoot.querySelector("input");
    const countrySelect = element.shadowRoot.querySelector("select");

    expect(input).to.exist;
    expect(countrySelect).to.exist;
    expect(input.placeholder).to.equal("Enter phone number");
    expect(countrySelect.value).to.equal("US");
  });

  it("formats phone number based on country", async () => {
    const input = element.shadowRoot.querySelector("input");

    // Test US format
    input.value = "1234567890";
    input.dispatchEvent(new Event("input"));
    await element.updateComplete;
    expect(input.value).to.equal("(123) 456-7890");

    // Test UK format
    element.defaultCountry = "GB";
    await element.updateComplete;
    input.value = "7911123456";
    input.dispatchEvent(new Event("input"));
    await element.updateComplete;
    expect(input.value).to.equal("07911 123456");
  });

  it("validates phone number format", async () => {
    const input = element.shadowRoot.querySelector("input");

    // Invalid number
    input.value = "123";
    input.dispatchEvent(new Event("input"));
    await element.updateComplete;

    expect(element.isValid).to.be.false;
    expect(element.shadowRoot.querySelector(".error-message")).to.exist;

    // Valid number
    input.value = "1234567890";
    input.dispatchEvent(new Event("input"));
    await element.updateComplete;

    expect(element.isValid).to.be.true;
    expect(element.shadowRoot.querySelector(".error-message")).to.not.exist;
  });

  it("handles country change", async () => {
    const countrySelect = element.shadowRoot.querySelector("select");
    const input = element.shadowRoot.querySelector("input");

    // Set initial value for US
    input.value = "1234567890";
    input.dispatchEvent(new Event("input"));
    await element.updateComplete;

    // Change to UK
    countrySelect.value = "GB";
    countrySelect.dispatchEvent(new Event("change"));
    await element.updateComplete;

    // Should reformat number
    expect(input.value).to.not.equal("(123) 456-7890");
    expect(element.countryCode).to.equal("44");
  });

  it("emits change events with formatted value", async () => {
    const input = element.shadowRoot.querySelector("input");
    let eventDetail;

    element.addEventListener("change", (e) => {
      eventDetail = e.detail;
    });

    input.value = "1234567890";
    input.dispatchEvent(new Event("input"));
    await element.updateComplete;

    expect(eventDetail).to.exist;
    expect(eventDetail.value).to.equal("+1(123) 456-7890");
    expect(eventDetail.countryCode).to.equal("1");
    expect(eventDetail.isValid).to.be.true;
  });

  it("handles disabled state", async () => {
    element.disabled = true;
    await element.updateComplete;

    const input = element.shadowRoot.querySelector("input");
    const countrySelect = element.shadowRoot.querySelector("select");

    expect(input.disabled).to.be.true;
    expect(countrySelect.disabled).to.be.true;
  });

  it("handles required state", async () => {
    element.required = true;
    await element.updateComplete;

    const input = element.shadowRoot.querySelector("input");
    expect(input.required).to.be.true;

    // Empty value should be invalid
    input.value = "";
    input.dispatchEvent(new Event("input"));
    await element.updateComplete;

    expect(element.isValid).to.be.false;
    expect(
      element.shadowRoot.querySelector(".error-message").textContent
    ).to.include("required");
  });

  it("supports international format", async () => {
    const input = element.shadowRoot.querySelector("input");

    // Test with international number
    input.value = "+44 7911 123456";
    input.dispatchEvent(new Event("input"));
    await element.updateComplete;

    expect(element.isValid).to.be.true;
    expect(element.countryCode).to.equal("44");
  });

  it("maintains accessibility attributes", () => {
    const input = element.shadowRoot.querySelector("input");
    const countrySelect = element.shadowRoot.querySelector("select");

    expect(input.getAttribute("aria-label")).to.equal("Phone number");
    expect(countrySelect.getAttribute("aria-label")).to.equal("Select country");

    const label = element.shadowRoot.querySelector("label");
    expect(label.getAttribute("for")).to.equal(input.id);
  });

  it("handles error states", async () => {
    element.error = "Invalid phone number";
    await element.updateComplete;

    const errorMessage = element.shadowRoot.querySelector(".error-message");
    expect(errorMessage).to.exist;
    expect(errorMessage.textContent).to.equal("Invalid phone number");

    const input = element.shadowRoot.querySelector("input");
    expect(input.getAttribute("aria-invalid")).to.equal("true");
  });

  it("supports custom validation", async () => {
    element.customValidator = (value) => {
      return value.length >= 10 ? null : "Number too short";
    };

    const input = element.shadowRoot.querySelector("input");

    // Test invalid case
    input.value = "123";
    input.dispatchEvent(new Event("input"));
    await element.updateComplete;

    expect(element.isValid).to.be.false;
    expect(
      element.shadowRoot.querySelector(".error-message").textContent
    ).to.equal("Number too short");

    // Test valid case
    input.value = "1234567890";
    input.dispatchEvent(new Event("input"));
    await element.updateComplete;

    expect(element.isValid).to.be.true;
  });

  it("handles paste events", async () => {
    const input = element.shadowRoot.querySelector("input");

    // Set the value directly and trigger input event
    input.value = "+1 (123) 456-7890";
    input.dispatchEvent(new Event("input"));
    await element.updateComplete;

    expect(input.value).to.equal("(123) 456-7890");
    expect(element.countryCode).to.equal("1");
  });
});
