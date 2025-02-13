import { expect } from "@esm-bundle/chai";
import { fixture, html } from "@open-wc/testing";
import "../../src/components/ui/form-validation.js";

describe("Form Validation Component", () => {
  let element;

  beforeEach(async () => {
    element = await fixture(html`
      <neo-form>
        <input
          type="text"
          name="username"
          required
          minlength="3"
          maxlength="20"
          data-validate
        />
        <input type="email" name="email" required data-validate />
        <input
          type="password"
          name="password"
          required
          minlength="8"
          pattern="^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z\\d]{8,}$"
          data-validate
        />
        <input
          type="tel"
          name="phone"
          pattern="^\\+?[1-9]\\d{1,14}$"
          data-validate
        />
      </neo-form>
    `);
  });

  it("should be defined", () => {
    expect(element).to.be.instanceOf(customElements.get("neo-form"));
  });

  it("should validate required fields", async () => {
    const result = await element.validate();
    expect(result.valid).to.be.false;
    expect(result.errors.username).to.exist;
    expect(result.errors.email).to.exist;
    expect(result.errors.password).to.exist;
  });

  it("should validate email format", async () => {
    const emailInput = element.querySelector('[name="email"]');

    emailInput.value = "invalid-email";
    let result = await element.validate();
    expect(result.errors.email).to.exist;

    emailInput.value = "valid@email.com";
    result = await element.validate();
    expect(result.errors.email).to.not.exist;
  });

  it("should validate password requirements", async () => {
    const passwordInput = element.querySelector('[name="password"]');

    // Too short
    passwordInput.value = "short";
    let result = await element.validate();
    expect(result.errors.password).to.exist;

    // No numbers
    passwordInput.value = "onlyletters";
    result = await element.validate();
    expect(result.errors.password).to.exist;

    // Valid password
    passwordInput.value = "validPass123";
    result = await element.validate();
    expect(result.errors.password).to.not.exist;
  });

  it("should validate phone number format", async () => {
    const phoneInput = element.querySelector('[name="phone"]');

    phoneInput.value = "invalid";
    let result = await element.validate();
    expect(result.errors.phone).to.exist;

    phoneInput.value = "+1234567890";
    result = await element.validate();
    expect(result.errors.phone).to.not.exist;
  });

  it("should handle custom validation rules", async () => {
    element.addValidationRule("username", (value) => {
      return value.length >= 3
        ? null
        : "Username must be at least 3 characters";
    });

    const usernameInput = element.querySelector('[name="username"]');
    usernameInput.value = "ab";
    let result = await element.validate();
    expect(result.errors.username).to.exist;

    usernameInput.value = "abc";
    result = await element.validate();
    expect(result.errors.username).to.not.exist;
  });

  it("should validate on input change", async () => {
    let validationTriggered = false;
    element.addEventListener(
      "validation-change",
      () => (validationTriggered = true)
    );

    const emailInput = element.querySelector('[name="email"]');
    emailInput.value = "invalid-email";
    emailInput.dispatchEvent(new Event("input"));

    await element.updateComplete;
    expect(validationTriggered).to.be.true;
  });

  it("should handle form submission", async () => {
    let submitPrevented = false;
    element.addEventListener("submit", (e) => {
      if (!element.isValid()) {
        e.preventDefault();
        submitPrevented = true;
      }
    });

    const submitEvent = new Event("submit");
    element.dispatchEvent(submitEvent);

    expect(submitPrevented).to.be.true;
  });

  it("should clear validation errors", async () => {
    await element.validate();
    expect(Object.keys(element.errors).length).to.be.greaterThan(0);

    element.clearValidation();
    expect(Object.keys(element.errors).length).to.equal(0);
  });
});
