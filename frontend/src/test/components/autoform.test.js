import { expect } from "@esm-bundle/chai";
import { fixture, html, oneEvent } from "@open-wc/testing";
import "../../components/form/autoform.js";

describe("Autoform", () => {
  let element;
  const schema = {
    title: "Test Form",
    description: "Test form description",
    type: "object",
    required: ["username", "email"],
    properties: {
      username: {
        type: "string",
        title: "Username",
        description: "Enter your username",
        minLength: 3,
        maxLength: 20,
        pattern: "^[a-zA-Z0-9_]+$",
      },
      email: {
        type: "string",
        title: "Email",
        format: "email",
      },
      age: {
        type: "number",
        title: "Age",
        minimum: 18,
        maximum: 120,
      },
      bio: {
        type: "string",
        title: "Biography",
        format: "textarea",
        maxLength: 500,
      },
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

  beforeEach(async () => {
    element = await fixture(html`
      <neo-autoform
        .schema=${schema}
        .value=${{}}
        variant="default"
        layout="vertical"
      ></neo-autoform>
    `);
  });

  it("renders with schema", () => {
    const title = element.shadowRoot.querySelector(".form-title");
    const description = element.shadowRoot.querySelector(".form-description");

    expect(title.textContent).to.equal(schema.title);
    expect(description.textContent).to.equal(schema.description);

    const formGroups = element.shadowRoot.querySelectorAll(".form-group");
    expect(formGroups.length).to.equal(Object.keys(schema.properties).length);
  });

  it("validates required fields", async () => {
    const validationPromise = oneEvent(element, "validate");
    element._validateForm();
    const { detail } = await validationPromise;

    expect(detail.valid).to.be.false;
    expect(Object.keys(detail.errors)).to.have.lengthOf(2);
    expect(detail.errors.username).to.exist;
    expect(detail.errors.email).to.exist;
  });

  it("validates string format", async () => {
    // Test email format
    element._formData = {
      email: "invalid-email",
    };

    const validationPromise = oneEvent(element, "validate");
    element._validateForm();
    const { detail } = await validationPromise;

    expect(detail.errors.email).to.exist;
    expect(detail.errors.email[0]).to.equal("Invalid email address");

    // Test with valid email
    element._formData.email = "test@example.com";
    const validationPromise2 = oneEvent(element, "validate");
    element._validateForm();
    const { detail: detail2 } = await validationPromise2;

    expect(detail2.errors.email).to.not.exist;
  });

  it("validates number constraints", async () => {
    element._formData = {
      age: 15,
    };

    const validationPromise = oneEvent(element, "validate");
    element._validateForm();
    const { detail } = await validationPromise;

    expect(detail.errors.age).to.exist;
    expect(detail.errors.age[0]).to.equal("Minimum value is 18");

    element._formData.age = 25;
    const validationPromise2 = oneEvent(element, "validate");
    element._validateForm();
    const { detail: detail2 } = await validationPromise2;

    expect(detail2.errors.age).to.not.exist;
  });

  it("validates array constraints", async () => {
    element._formData = {
      interests: [],
    };

    const validationPromise = oneEvent(element, "validate");
    element._validateForm();
    const { detail } = await validationPromise;

    expect(detail.errors.interests).to.exist;
    expect(detail.errors.interests[0]).to.equal("Minimum 1 items required");

    element._formData.interests = [
      "coding",
      "reading",
      "gaming",
      "music",
      "sports",
      "art",
    ];
    const validationPromise2 = oneEvent(element, "validate");
    element._validateForm();
    const { detail: detail2 } = await validationPromise2;

    expect(detail2.errors.interests).to.exist;
    expect(detail2.errors.interests[0]).to.equal("Maximum 5 items allowed");
  });

  it("handles field changes", async () => {
    const changePromise = oneEvent(element, "change");
    const field = "username";
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
    // Test vertical layout
    expect(element.shadowRoot.querySelector(".layout-vertical")).to.exist;

    // Test horizontal layout
    element.layout = "horizontal";
    await element.updateComplete;
    expect(element.shadowRoot.querySelector(".layout-horizontal")).to.exist;

    // Test grid layout
    element.layout = "grid";
    await element.updateComplete;
    expect(element.shadowRoot.querySelector(".layout-grid")).to.exist;
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
      username: "testuser",
      email: "test@example.com",
    };

    element.value = newValue;
    await element.updateComplete;

    expect(element._formData).to.deep.equal(newValue);
  });
});
