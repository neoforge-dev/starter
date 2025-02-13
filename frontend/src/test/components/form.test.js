import { fixture, expect, oneEvent } from "@open-wc/testing";
import { html } from "lit";
import "../../components/ui/form.js";

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
  });

  it("renders all form fields with correct types and labels", () => {
    const fields = element.shadowRoot.querySelectorAll(".form-field");
    expect(fields.length).to.equal(mockFormConfig.fields.length);

    fields.forEach((field, index) => {
      const config = mockFormConfig.fields[index];
      const input = field.querySelector(`[name="${config.name}"]`);
      const label = field.querySelector("label");

      expect(input).to.exist;
      expect(input.type).to.equal(config.type);
      expect(label.textContent.trim()).to.equal(config.label);

      if (config.required) {
        expect(input.hasAttribute("required")).to.be.true;
      }
    });
  });

  it("validates required fields", async () => {
    const submitButton = element.shadowRoot.querySelector(
      'button[type="submit"]'
    );

    setTimeout(() => submitButton.click());
    const { detail } = await oneEvent(element, "form-error");

    expect(detail.errors).to.exist;
    expect(Object.keys(detail.errors).length).to.be.greaterThan(0);

    // Check error messages
    const errorMessages = element.shadowRoot.querySelectorAll(".error-message");
    expect(errorMessages.length).to.be.greaterThan(0);
  });

  it("validates field patterns and constraints", async () => {
    const usernameInput = element.shadowRoot.querySelector('[name="username"]');
    const passwordInput = element.shadowRoot.querySelector('[name="password"]');

    // Invalid username
    usernameInput.value = "u$";
    usernameInput.dispatchEvent(new Event("input"));
    await element.updateComplete;

    expect(usernameInput.validity.valid).to.be.false;

    // Valid username
    usernameInput.value = "validUser123";
    usernameInput.dispatchEvent(new Event("input"));
    await element.updateComplete;

    expect(usernameInput.validity.valid).to.be.true;

    // Invalid password
    passwordInput.value = "weak";
    passwordInput.dispatchEvent(new Event("input"));
    await element.updateComplete;

    expect(passwordInput.validity.valid).to.be.false;

    // Valid password
    passwordInput.value = "StrongPass123";
    passwordInput.dispatchEvent(new Event("input"));
    await element.updateComplete;

    expect(passwordInput.validity.valid).to.be.true;
  });

  it("handles form submission with valid data", async () => {
    const formData = {
      username: "testUser123",
      email: "test@example.com",
      password: "StrongPass123",
      terms: true,
    };

    // Fill in form fields
    Object.entries(formData).forEach(([name, value]) => {
      const input = element.shadowRoot.querySelector(`[name="${name}"]`);
      if (input.type === "checkbox") {
        input.checked = value;
      } else {
        input.value = value;
      }
      input.dispatchEvent(new Event("input"));
    });

    await element.updateComplete;

    // Submit form
    const submitButton = element.shadowRoot.querySelector(
      'button[type="submit"]'
    );
    setTimeout(() => submitButton.click());
    const { detail } = await oneEvent(element, "form-submit");

    expect(detail.data).to.deep.equal(formData);
  });

  it("supports custom validation messages", async () => {
    element = await fixture(html`
      <ui-form
        .config=${{
          ...mockFormConfig,
          fields: mockFormConfig.fields.map((field) => ({
            ...field,
            validation: {
              ...field.validation,
              messages: {
                required: "This field is mandatory",
                pattern: "Invalid format",
              },
            },
          })),
        }}
      ></ui-form>
    `);

    const submitButton = element.shadowRoot.querySelector(
      'button[type="submit"]'
    );
    submitButton.click();
    await element.updateComplete;

    const errorMessage = element.shadowRoot.querySelector(".error-message");
    expect(errorMessage.textContent.trim()).to.equal("This field is mandatory");
  });

  it("supports field dependencies", async () => {
    element = await fixture(html`
      <ui-form
        .config=${{
          fields: [
            {
              name: "hasPhone",
              type: "checkbox",
              label: "I have a phone number",
            },
            {
              name: "phoneNumber",
              type: "tel",
              label: "Phone Number",
              dependsOn: {
                field: "hasPhone",
                value: true,
              },
            },
          ],
        }}
      ></ui-form>
    `);

    const phoneField = element.shadowRoot
      .querySelector('[name="phoneNumber"]')
      .closest(".form-field");
    expect(phoneField.hasAttribute("hidden")).to.be.true;

    // Check phone number
    const checkbox = element.shadowRoot.querySelector('[name="hasPhone"]');
    checkbox.checked = true;
    checkbox.dispatchEvent(new Event("change"));
    await element.updateComplete;

    expect(phoneField.hasAttribute("hidden")).to.be.false;
  });

  it("supports async validation", async () => {
    element = await fixture(html`
      <ui-form
        .config=${{
          fields: [
            {
              name: "username",
              type: "text",
              label: "Username",
              asyncValidation: async (value) => {
                return value === "taken" ? "Username is taken" : null;
              },
            },
          ],
        }}
      ></ui-form>
    `);

    const input = element.shadowRoot.querySelector('[name="username"]');

    // Test taken username
    input.value = "taken";
    input.dispatchEvent(new Event("input"));
    await element.updateComplete;
    await new Promise((resolve) => setTimeout(resolve, 0));

    const errorMessage = element.shadowRoot.querySelector(".error-message");
    expect(errorMessage.textContent.trim()).to.equal("Username is taken");
  });

  it("maintains field state during updates", async () => {
    const input = element.shadowRoot.querySelector('[name="username"]');
    input.value = "testUser";
    input.dispatchEvent(new Event("input"));
    await element.updateComplete;

    // Update form config
    element.config = {
      ...mockFormConfig,
      fields: [
        ...mockFormConfig.fields,
        {
          name: "newField",
          type: "text",
          label: "New Field",
        },
      ],
    };
    await element.updateComplete;

    // Check if value is maintained
    const updatedInput = element.shadowRoot.querySelector('[name="username"]');
    expect(updatedInput.value).to.equal("testUser");
  });

  it("supports form reset", async () => {
    // Fill in some data
    const usernameInput = element.shadowRoot.querySelector('[name="username"]');
    usernameInput.value = "testUser";
    usernameInput.dispatchEvent(new Event("input"));
    await element.updateComplete;

    // Reset form
    element.reset();
    await element.updateComplete;

    expect(usernameInput.value).to.equal("");
    expect(
      element.shadowRoot.querySelectorAll(".error-message").length
    ).to.equal(0);
  });

  it("supports custom field components", async () => {
    element = await fixture(html`
      <ui-form
        .config=${{
          fields: [
            {
              name: "custom",
              type: "custom",
              component: "ui-custom-input",
              label: "Custom Input",
            },
          ],
        }}
      ></ui-form>
    `);

    const customField = element.shadowRoot.querySelector("ui-custom-input");
    expect(customField).to.exist;
    expect(customField.getAttribute("name")).to.equal("custom");
    expect(customField.getAttribute("label")).to.equal("Custom Input");
  });
});
