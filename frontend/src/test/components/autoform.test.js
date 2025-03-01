import { describe, it, expect, beforeEach } from "vitest";
import {
  html,
  oneEvent,
  waitForComponentUpdate,
  waitForShadowDom,
  TestUtils,
} from "../setup.mjs";
import { NeoAutoform } from "../../components/form/autoform.js";

const schema = {
  title: "Test Form",
  description: "A test form",
  required: ["name", "email"],
  properties: {
    name: {
      type: "string",
      title: "Name",
      minLength: 3,
    },
    email: {
      type: "string",
      title: "Email",
      format: "email",
    },
    age: {
      type: "number",
      title: "Age",
      minimum: 0,
    },
  },
};

describe("NeoAutoform", () => {
  let element;

  beforeEach(async () => {
    element = await TestUtils.fixture(html`
      <neo-autoform .schema=${schema} .value=${{}}></neo-autoform>
    `);
    await TestUtils.waitForComponent(element);
  });

  it("renders form fields based on schema", async () => {
    const shadowRoot = await TestUtils.waitForShadowDom(element);

    // Check form title
    const title = shadowRoot.querySelector("h2");
    expect(title.textContent).to.equal("Test Form");

    // Check form fields
    const inputs = shadowRoot.querySelectorAll("input");
    expect(inputs.length).to.equal(3);

    // Check field labels
    const labels = shadowRoot.querySelectorAll("label");
    expect(labels[0].textContent).to.contain("Name");
    expect(labels[1].textContent).to.contain("Email");
    expect(labels[2].textContent).to.contain("Age");
  });

  it("validates required fields", async () => {
    const shadowRoot = await TestUtils.waitForShadowDom(element);

    // Try to submit empty form
    const form = shadowRoot.querySelector("form");
    const submitEvent = new Event("submit");
    form.dispatchEvent(submitEvent);

    // Check error messages
    const errors = shadowRoot.querySelectorAll(".error-message");
    expect(errors.length).to.equal(2); // Name and email are required
    expect(errors[0].textContent).to.contain("required");
    expect(errors[1].textContent).to.contain("required");
  });

  it("validates email format", async () => {
    const shadowRoot = await TestUtils.waitForShadowDom(element);

    // Set invalid email
    const emailInput = shadowRoot.querySelector('input[name="email"]');
    emailInput.value = "invalid-email";
    emailInput.dispatchEvent(new Event("input"));

    // Check error message
    const error = shadowRoot.querySelector(".error-message");
    expect(error.textContent).to.contain("valid email");
  });

  it("validates minimum length", async () => {
    const nameInput = element.shadowRoot.querySelector("input#name");
    nameInput.value = "ab";
    nameInput.dispatchEvent(new Event("input"));

    const form = element.shadowRoot.querySelector("form");
    form.dispatchEvent(new Event("submit"));

    const validateEvent = await oneEvent(element, "validate");
    expect(validateEvent.detail.errors.name).to.include("Minimum length is 3");
  });

  it("validates minimum number value", async () => {
    const ageInput = element.shadowRoot.querySelector("input#age");
    ageInput.value = "16";
    ageInput.dispatchEvent(new Event("input"));

    const form = element.shadowRoot.querySelector("form");
    form.dispatchEvent(new Event("submit"));

    const validateEvent = await oneEvent(element, "validate");
    expect(validateEvent.detail.errors.age).to.include("Minimum value is 18");
  });

  it("emits change events", async () => {
    const nameInput = element.shadowRoot.querySelector("input#name");
    nameInput.value = "John Doe";
    nameInput.dispatchEvent(new Event("input"));

    const changeEvent = await oneEvent(element, "change");
    expect(changeEvent.detail.field).to.equal("name");
    expect(changeEvent.detail.value).to.equal("John Doe");
    expect(changeEvent.detail.formData.name).to.equal("John Doe");
  });

  it("emits submit event with valid data", async () => {
    const shadowRoot = await TestUtils.waitForShadowDom(element);

    // Fill form with valid data
    const nameInput = shadowRoot.querySelector('input[name="name"]');
    const emailInput = shadowRoot.querySelector('input[name="email"]');
    const ageInput = shadowRoot.querySelector('input[name="age"]');

    nameInput.value = "John Doe";
    emailInput.value = "john@example.com";
    ageInput.value = "30";

    nameInput.dispatchEvent(new Event("input"));
    emailInput.dispatchEvent(new Event("input"));
    ageInput.dispatchEvent(new Event("input"));

    // Submit form and listen for event
    setTimeout(() => {
      const form = shadowRoot.querySelector("form");
      form.dispatchEvent(new Event("submit"));
    });

    const { detail } = await oneEvent(element, "submit");

    expect(detail).to.deep.equal({
      name: "John Doe",
      email: "john@example.com",
      age: 30,
    });
  });

  it("handles field changes", async () => {
    const shadowRoot = await waitForShadowDom(element);
    const changePromise = oneEvent(element, "change");
    const field = "name";
    const value = "testuser";

    const event = new Event("input");
    Object.defineProperty(event, "target", {
      value: { value },
    });

    element._handleChange(field, event);
    const { detail } = await changePromise;

    expect(detail.field).to.equal(field);
    expect(detail.value).to.equal(value);
    expect(detail.formData[field]).to.equal(value);
  });

  it("supports different layouts", async () => {
    const shadowRoot = await waitForShadowDom(element);
    // Test vertical layout
    expect(shadowRoot.querySelector(".layout-vertical")).to.exist;

    // Test horizontal layout
    element.layout = "horizontal";
    await waitForComponentUpdate(element);
    expect(shadowRoot.querySelector(".layout-horizontal")).to.exist;

    // Test grid layout
    element.layout = "grid";
    await waitForComponentUpdate(element);
    expect(shadowRoot.querySelector(".layout-grid")).to.exist;
  });

  it("supports different variants", async () => {
    // Test compact variant
    element.variant = "compact";
    await element.updateComplete;
    expect(element.shadowRoot.querySelector(".variant-compact")).to.exist;

    // Test floating variant
    element.variant = "floating";
    await element.updateComplete;
    expect(element.shadowRoot.querySelector(".variant-floating")).to.exist;
  });

  it("handles disabled state", async () => {
    element.disabled = true;
    await element.updateComplete;

    const inputs = element.shadowRoot.querySelectorAll(
      "input, select, textarea"
    );
    inputs.forEach((input) => {
      expect(input.disabled).to.be.true;
    });
  });

  it("handles readonly state", async () => {
    element.readonly = true;
    await element.updateComplete;

    const inputs = element.shadowRoot.querySelectorAll(
      "input, select, textarea"
    );
    inputs.forEach((input) => {
      expect(input.readOnly).to.be.true;
    });
  });

  it("updates form data when value property changes", async () => {
    const newValue = {
      name: "testuser",
      email: "test@example.com",
    };
    element.value = newValue;
    await element.updateComplete;
    expect(element._formData).to.deep.equal(newValue);
  });

  it("handles form submission", async () => {
    // Set up valid form data
    element._formData = {
      name: "testuser",
      email: "test@example.com",
      age: 25,
      interests: ["coding", "reading"],
    };
    await TestUtils.waitForComponent(element);

    // Test textarea
    const textareaInput = element.shadowRoot.querySelector("textarea");
    expect(textareaInput).to.exist;

    // Test validation
    element._formData = {
      name: "",
      email: "",
      age: 0,
      interests: [],
    };
    await TestUtils.waitForComponent(element);

    const validationPromise = oneEvent(element, "validate");
    element.shadowRoot.querySelector("form").dispatchEvent(new Event("submit"));
    const validationEvent = await validationPromise;
    expect(validationEvent.detail.valid).to.be.false;

    // Test max items validation
    element._formData = {
      name: "testuser",
      email: "test@example.com",
      age: 25,
      interests: ["coding", "reading", "gaming", "music", "sports", "art"],
    };
    await TestUtils.waitForComponent(element);

    const maxItemsValidationPromise = oneEvent(element, "validate");
    element.shadowRoot.querySelector("form").dispatchEvent(new Event("submit"));
    const maxItemsValidationEvent = await maxItemsValidationPromise;
    expect(maxItemsValidationEvent.detail.valid).to.be.false;

    // Test valid submission
    element._formData = {
      name: "testuser",
      email: "test@example.com",
      age: 25,
      interests: ["coding", "reading"],
    };
    await TestUtils.waitForComponent(element);

    // Check all input types are rendered
    const formInputs = element.shadowRoot.querySelectorAll("input");
    expect(formInputs.length).to.be.greaterThan(0);

    // Test default values
    const defaultElement = document.createElement("neo-autoform");
    document.body.appendChild(defaultElement);
    await TestUtils.waitForComponent(defaultElement);

    // Check default values
    expect(defaultElement._formData).to.deep.equal({});
    expect(defaultElement.layout).to.equal("vertical");
    expect(defaultElement.variant).to.equal("default");

    // Test schema with descriptions
    element.schema = {
      title: "Test Form",
      description: "A test form with descriptions",
      properties: {
        name: {
          type: "string",
          title: "Name",
          description: "Enter your full name",
        },
      },
    };
    await TestUtils.waitForComponent(element);

    // Set value through property
    element._formData = { name: "Test Name" };
    await TestUtils.waitForComponent(element);

    // Check if input value is updated
    const nameInputField =
      element.shadowRoot.querySelector('input[name="name"]');
    expect(nameInputField.value).to.equal("Test Name");

    // Test schema with descriptions
    element.schema = {
      title: "Test Form",
      description: "A test form with descriptions",
      properties: {
        name: {
          type: "string",
          title: "Name",
          description: "Enter your full name",
        },
      },
    };
    await TestUtils.waitForComponent(element);

    // Check if description is rendered
    const description = element.shadowRoot.querySelector(".field-description");
    expect(description).to.exist;
    expect(description.textContent).to.include("Enter your full name");

    // Test schema with select field
    element.schema = {
      title: "Test Form",
      properties: {
        choice: {
          type: "string",
          title: "Choice",
          enum: ["option1", "option2", "option3"],
        },
      },
    };
    await TestUtils.waitForComponent(element);

    // Check select field
    const select = element.shadowRoot.querySelector("select");
    expect(select).to.exist;
    expect(select.options.length).to.equal(3);

    // Test field touched state
    element.schema = {
      title: "Test Form",
      properties: {
        name: {
          type: "string",
          title: "Name",
        },
      },
    };
    await TestUtils.waitForComponent(element);

    // Trigger blur event
    const touchedInput = element.shadowRoot.querySelector('input[name="name"]');
    touchedInput.dispatchEvent(new Event("blur"));
    await TestUtils.waitForComponent(element);

    // Check if field is marked as touched
    expect(element._touchedFields.has("name")).to.be.true;

    // Test form title and description
    element.schema = {
      title: "Custom Form Title",
      description: "Custom form description",
      properties: {
        name: {
          type: "string",
          title: "Name",
        },
      },
    };
    await TestUtils.waitForComponent(element);

    // Check form title
    const formTitle = element.shadowRoot.querySelector(".form-title");
    expect(formTitle).to.exist;
    expect(formTitle.textContent).to.equal("Custom Form Title");

    // Test required fields
    element.schema = {
      title: "Test Form",
      required: ["name"],
      properties: {
        name: {
          type: "string",
          title: "Name",
        },
      },
    };
    await TestUtils.waitForComponent(element);

    // Check required label
    const requiredLabel = element.shadowRoot.querySelector(".required-label");
    expect(requiredLabel).to.exist;

    // Test array field
    element.schema = {
      title: "Test Form",
      properties: {
        interests: {
          type: "array",
          title: "Interests",
          items: {
            type: "string",
          },
        },
      },
    };
    element._formData = {
      name: "testuser",
      email: "test@example.com",
      age: 25,
      interests: ["coding", "reading"],
    };
    await TestUtils.waitForComponent(element);

    // Check form title and description
    const arrayField = element.shadowRoot.querySelector(".array-field");
    expect(arrayField).to.exist;

    // Test disabled and readonly states together
    element.schema = {
      title: "Test Form",
      properties: {
        name: {
          type: "string",
          title: "Name",
        },
      },
    };
    element.disabled = true;
    element.readonly = true;
    await TestUtils.waitForComponent(element);

    const stateInputs = element.shadowRoot.querySelectorAll("input, textarea");
    stateInputs.forEach((input) => {
      expect(input.disabled).to.be.true;
      expect(input.readOnly).to.be.true;
    });

    // Test validation messages
    element.schema = {
      title: "Test Form",
      required: ["name", "email"],
      properties: {
        name: {
          type: "string",
          title: "Name",
          minLength: 3,
        },
        email: {
          type: "string",
          title: "Email",
          format: "email",
        },
      },
    };
    element._formData = {
      name: "a",
      email: "invalid-email",
    };
    await TestUtils.waitForComponent(element);

    // Trigger blur on name field
    const validationInput =
      element.shadowRoot.querySelector('input[name="name"]');
    const blurValidationEvent = new Event("blur");
    validationInput.dispatchEvent(blurValidationEvent);
    await TestUtils.waitForComponent(element);

    // Check validation message
    const validationMessage = element.shadowRoot.querySelector(
      ".validation-message"
    );
    expect(validationMessage).to.exist;

    // Test email field
    element.schema = {
      title: "Test Form",
      properties: {
        email: {
          type: "string",
          title: "Email",
          format: "email",
        },
      },
    };
    await TestUtils.waitForComponent(element);

    // Check email input
    const emailInput = element.shadowRoot.querySelector('input[type="email"]');
    expect(emailInput).to.exist;

    // Test array field with validation
    element.schema = {
      title: "Test Form",
      properties: {
        interests: {
          type: "array",
          title: "Interests",
          items: {
            type: "string",
          },
          minItems: 1,
          maxItems: 5,
        },
      },
    };
    await TestUtils.waitForComponent(element);

    // Test array input
    const arrayInput = element.shadowRoot.querySelector(".array-field");
    expect(arrayInput).to.exist;

    // Test select field with options
    element.schema = {
      title: "Test Form",
      properties: {
        choice: {
          type: "string",
          title: "Choice",
          enum: ["option1", "option2", "option3"],
          enumNames: ["Option 1", "Option 2", "Option 3"],
        },
      },
    };
    await TestUtils.waitForComponent(element);

    // Check select field
    const selectField = element.shadowRoot.querySelector("select");
    expect(selectField).to.exist;
    expect(selectField.options.length).to.equal(3);

    // Test form submission with validation
    element.schema = {
      title: "Test Form",
      required: ["name"],
      properties: {
        name: {
          type: "string",
          title: "Name",
          minLength: 3,
        },
      },
    };
    await TestUtils.waitForComponent(element);

    // Set form data
    const submissionInput =
      element.shadowRoot.querySelector('input[name="name"]');
    submissionInput.value = "Test Name";
    submissionInput.dispatchEvent(new Event("input"));
    await TestUtils.waitForComponent(element);

    // Submit form
    const submissionForm = element.shadowRoot.querySelector("form");
    submissionForm.dispatchEvent(new Event("submit"));
    await TestUtils.waitForComponent(element);

    // Check if form data is correct
    expect(element._formData).to.deep.equal({
      name: "Test Name",
    });

    // Test disabled state
    element.schema = {
      title: "Test Form",
      properties: {
        name: {
          type: "string",
          title: "Name",
        },
      },
    };
    element.disabled = true;
    await TestUtils.waitForComponent(element);

    // Check disabled state
    const disabledInput =
      element.shadowRoot.querySelector('input[name="name"]');
    expect(disabledInput.disabled).to.be.true;

    // Test readonly state
    element.disabled = false;
    element.readonly = true;
    await TestUtils.waitForComponent(element);
    const readonlyInput =
      element.shadowRoot.querySelector('input[name="name"]');
    expect(readonlyInput.readOnly).to.be.true;

    // Test layout variants
    element.schema = {
      title: "Test Form",
      properties: {
        name: {
          type: "string",
          title: "Name",
        },
        email: {
          type: "string",
          title: "Email",
        },
      },
    };
    await TestUtils.waitForComponent(element);

    // Test vertical layout (default)
    const layoutForm = element.shadowRoot.querySelector("form");
    expect(layoutForm.querySelector(".layout-vertical")).to.exist;

    // Test horizontal layout
    element.layout = "horizontal";
    await TestUtils.waitForComponent(element);
    expect(layoutForm.querySelector(".layout-horizontal")).to.exist;

    // Test grid layout
    element.layout = "grid";
    await TestUtils.waitForComponent(element);
    expect(layoutForm.querySelector(".layout-grid")).to.exist;
  });

  it("supports different variants", async () => {
    element.schema = {
      title: "Test Form",
      properties: {
        name: {
          type: "string",
          title: "Name",
        },
      },
    };
    await TestUtils.waitForComponent(element);

    // Test default variant
    expect(element.shadowRoot.querySelector(".variant-default")).to.exist;

    // Test compact variant
    element.variant = "compact";
    await TestUtils.waitForComponent(element);
    expect(element.shadowRoot.querySelector(".variant-compact")).to.exist;

    // Test floating variant
    element.variant = "floating";
    await TestUtils.waitForComponent(element);
    expect(element.shadowRoot.querySelector(".variant-floating")).to.exist;
  });
});
