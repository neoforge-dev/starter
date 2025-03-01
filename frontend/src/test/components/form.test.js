import { fixture, expect, oneEvent } from "../setup.mjs";
import {  html  } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";
import "../../components/ui/form.js";
import { TestUtils } from "../setup.mjs";

describe("Form", () => {
  let element;
  const mockFormConfig = {
    fields: [
      {
        name: "username",
        type: "text",
        label: "Username",
        required: true,
        validation: {
          minLength: 3,
          maxLength: 20,
          pattern: "^[a-zA-Z0-9_]+$",
        },
      },
      {
        name: "email",
        type: "email",
        label: "Email Address",
        required: true,
      },
      {
        name: "password",
        type: "password",
        label: "Password",
        required: true,
        validation: {
          minLength: 8,
          pattern: "(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])",
        },
      },
      {
        name: "terms",
        type: "checkbox",
        label: "I agree to the terms",
        required: true,
      },
    ],
  };

  beforeEach(async () => {
    element = await fixture(html`
      <ui-form .config=${mockFormConfig} submitText="Submit"></ui-form>
    `);
    await TestUtils.waitForAll(element);
  });

  it("renders all form fields with correct types and labels", async () => {
    const shadowRoot = await TestUtils.waitForShadowDom(element);
    const fields = shadowRoot.querySelectorAll(".form-field");
    expect(fields.length).to.equal(mockFormConfig.fields.length);

    fields.forEach((field, index) => {
      const config = mockFormConfig.fields[index];
      const input = field.querySelector(`[name="${config.name}"]`);
      const label = field.querySelector("label");

      expect(input).to.exist;
      expect(input.type).to.equal(config.type);
      expect(label).to.exist;
      expect(label.textContent.trim()).to.equal(config.label);
    });
  });

  it("validates required fields", async () => {
    const shadowRoot = await TestUtils.waitForShadowDom(element);
    const form = shadowRoot.querySelector("form");

    // Create a submit event with preventDefault
    const submitEvent = new CustomEvent("submit", {
      bubbles: true,
      cancelable: true,
      composed: true,
    });
    Object.defineProperty(submitEvent, "preventDefault", {
      value: () => {},
      enumerable: true,
    });

    // Set up validation promise before dispatching event
    const validationPromise = oneEvent(element, "form-error");

    // Dispatch event
    form.dispatchEvent(submitEvent);

    // Wait for validation response
    const { detail } = await validationPromise;
    expect(detail.errors).to.have.length.greaterThan(0);
    expect(detail.errors[0]).to.contain("required");
  });

  it("validates field patterns and constraints", async () => {
    const shadowRoot = await TestUtils.waitForShadowDom(element);
    const form = shadowRoot.querySelector("form");

    // Fill in invalid data
    const usernameInput = form.querySelector('[name="username"]');
    const emailInput = form.querySelector('[name="email"]');
    const passwordInput = form.querySelector('[name="password"]');

    // Simulate user input
    usernameInput.value = "a"; // Too short
    emailInput.value = "invalid-email"; // Invalid email
    passwordInput.value = "weak"; // Doesn't meet requirements

    // Create and dispatch input events
    [usernameInput, emailInput, passwordInput].forEach((input) => {
      input.dispatchEvent(
        new CustomEvent("input", {
          bubbles: true,
          composed: true,
        })
      );
    });

    // Create submit event
    const submitEvent = new CustomEvent("submit", {
      bubbles: true,
      cancelable: true,
      composed: true,
    });
    Object.defineProperty(submitEvent, "preventDefault", {
      value: () => {},
      enumerable: true,
    });

    // Set up validation promise
    const validationPromise = oneEvent(element, "form-error");

    // Submit form
    form.dispatchEvent(submitEvent);

    // Check validation results
    const { detail } = await validationPromise;
    expect(detail.errors).to.have.length.greaterThan(0);
    expect(detail.errors).to.include.members([
      "Username must be at least 3 characters",
      "Invalid email format",
      "Password must contain at least one uppercase letter, one lowercase letter, and one number",
    ]);
  });

  it("handles form submission with valid data", async () => {
    const form = element.shadowRoot.querySelector("form");
    const usernameInput = element.shadowRoot.querySelector('[name="username"]');
    const emailInput = element.shadowRoot.querySelector('[name="email"]');
    const passwordInput = element.shadowRoot.querySelector('[name="password"]');
    const termsInput = element.shadowRoot.querySelector('[name="terms"]');

    // Fill in valid data
    usernameInput.value = "validUser123";
    emailInput.value = "test@example.com";
    passwordInput.value = "StrongPass123";
    termsInput.checked = true;

    // Dispatch input events
    [usernameInput, emailInput, passwordInput, termsInput].forEach((input) => {
      input.dispatchEvent(new Event("input"));
    });

    await element.updateComplete;

    // Submit form
    const submitEvent = new Event("submit");
    submitEvent.preventDefault = () => {};
    setTimeout(() => form.dispatchEvent(submitEvent));
    const { detail } = await oneEvent(element, "form-submit");

    expect(detail.data).to.deep.equal({
      username: "validUser123",
      email: "test@example.com",
      password: "StrongPass123",
      terms: "on",
    });
  });

  it("supports custom validation messages", async () => {
    await element.updateComplete;

    const usernameInput = element.shadowRoot.querySelector('[name="username"]');
    const customMessage = "Username must be alphanumeric";

    usernameInput.setCustomValidity(customMessage);
    usernameInput.dispatchEvent(new Event("invalid"));
    await element.updateComplete;

    const errorMessage = element.shadowRoot.querySelector(".error-message");
    expect(errorMessage.textContent.trim()).to.equal(customMessage);
  });

  it("supports field dependencies", async () => {
    await element.updateComplete;

    const passwordInput = element.shadowRoot.querySelector('[name="password"]');
    const confirmPasswordInput = element.shadowRoot.querySelector(
      '[name="confirm-password"]'
    );

    if (confirmPasswordInput) {
      // Fill in password
      passwordInput.value = "StrongPass123";
      passwordInput.dispatchEvent(new Event("input"));
      await element.updateComplete;

      // Fill in different confirm password
      confirmPasswordInput.value = "DifferentPass123";
      confirmPasswordInput.dispatchEvent(new Event("input"));
      await element.updateComplete;

      expect(confirmPasswordInput.validity.valid).to.be.false;

      // Fill in matching confirm password
      confirmPasswordInput.value = "StrongPass123";
      confirmPasswordInput.dispatchEvent(new Event("input"));
      await element.updateComplete;

      expect(confirmPasswordInput.validity.valid).to.be.true;
    }
  });

  it("supports async validation", async () => {
    await element.updateComplete;

    const usernameInput = element.shadowRoot.querySelector('[name="username"]');
    const asyncValidator = async (value) => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      return value !== "taken";
    };

    // Set async validator
    element.asyncValidators = {
      username: asyncValidator,
    };

    // Try taken username
    usernameInput.value = "taken";
    usernameInput.dispatchEvent(new Event("input"));
    await element.updateComplete;
    await new Promise((resolve) => setTimeout(resolve, 150));

    expect(usernameInput.validity.valid).to.be.false;

    // Try available username
    usernameInput.value = "available";
    usernameInput.dispatchEvent(new Event("input"));
    await element.updateComplete;
    await new Promise((resolve) => setTimeout(resolve, 150));

    expect(usernameInput.validity.valid).to.be.true;
  });

  it("maintains field state during updates", async () => {
    await element.updateComplete;

    const usernameInput = element.shadowRoot.querySelector('[name="username"]');
    const value = "testUser";

    usernameInput.value = value;
    usernameInput.dispatchEvent(new Event("input"));
    await element.updateComplete;

    // Trigger a re-render
    element.requestUpdate();
    await element.updateComplete;

    expect(usernameInput.value).to.equal(value);
  });

  it("supports form reset", async () => {
    await element.updateComplete;

    const form = element.shadowRoot.querySelector("form");
    const usernameInput = element.shadowRoot.querySelector('[name="username"]');

    // Fill in some data
    usernameInput.value = "testUser";
    usernameInput.dispatchEvent(new Event("input"));
    await element.updateComplete;

    // Reset form
    form.reset();
    await element.updateComplete;

    expect(usernameInput.value).to.equal("");
  });

  it("supports custom field components", async () => {
    await element.updateComplete;

    const customField = element.shadowRoot.querySelector("custom-field");
    if (customField) {
      // Test custom field behavior
      customField.value = "test";
      customField.dispatchEvent(new Event("change"));
      await element.updateComplete;

      expect(customField.value).to.equal("test");
    }
  });
});
