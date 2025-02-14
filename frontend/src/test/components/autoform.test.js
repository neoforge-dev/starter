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
        optional: true,
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
    await element.updateComplete;
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

  it("handles form submission", async () => {
    // Set up valid form data
    element._formData = {
      username: "testuser",
      email: "test@example.com",
      age: 25,
      bio: "Test bio",
      interests: ["coding", "reading"],
    };

    // Listen for submit event
    const submitPromise = oneEvent(element, "submit");

    // Trigger form submission
    const form = element.shadowRoot.querySelector("form");
    const submitEvent = new Event("submit");
    submitEvent.preventDefault = () => {};
    form.dispatchEvent(submitEvent);

    // Check submit event details
    const { detail } = await submitPromise;
    expect(detail.valid).to.be.true;
    expect(detail.data).to.deep.equal(element._formData);
  });

  it("handles form submission with validation errors", async () => {
    // Set up invalid form data
    element._formData = {
      username: "t", // too short
      email: "invalid-email",
      age: 15, // below minimum
      interests: [], // below minItems
    };

    // Listen for submit event
    const submitPromise = oneEvent(element, "submit");

    // Trigger form submission
    const form = element.shadowRoot.querySelector("form");
    const submitEvent = new Event("submit");
    submitEvent.preventDefault = () => {};
    form.dispatchEvent(submitEvent);

    // Check submit event details
    const { detail } = await submitPromise;
    expect(detail.valid).to.be.false;
    expect(Object.keys(detail.errors)).to.have.lengthOf(4);
  });

  it("validates field on blur", async () => {
    // Set up field value
    const field = "username";
    const value = "t"; // too short

    // Simulate field blur
    element._formData = { [field]: value };
    element._touched.add(field);
    element.showValidation = true;

    const validationPromise = oneEvent(element, "validate");
    element._validateForm();

    // Check validation results
    const { detail } = await validationPromise;
    expect(detail.errors[field]).to.exist;
    expect(detail.errors[field][0]).to.include("minimum length");
  });

  it("handles special input types", async () => {
    // Set up form data
    element._formData = {
      bio: "Test biography",
      interests: ["coding", "reading"],
    };
    await element.updateComplete;

    // Test textarea
    const bioField = element.shadowRoot.querySelector('textarea[name="bio"]');
    expect(bioField).to.exist;
    expect(bioField.maxLength).to.equal(500);
    expect(bioField.value).to.equal("Test biography");

    // Test array input
    const interestsField = element.shadowRoot.querySelector(
      'input[name="interests"]'
    );
    expect(interestsField).to.exist;
    expect(interestsField.value).to.equal("coding, reading");
  });

  it("validates array field changes", async () => {
    const field = "interests";
    const value = "coding, reading, gaming";

    const changePromise = oneEvent(element, "change");
    const event = new Event("input");
    Object.defineProperty(event, "target", {
      value: { value },
    });

    element._handleChange(field, {
      target: { value: value.split(",").map((v) => v.trim()) },
    });
    const { detail } = await changePromise;

    expect(detail.field).to.equal(field);
    expect(detail.value).to.deep.equal(["coding", "reading", "gaming"]);
  });

  it("validates email format strictly", async () => {
    element._formData = {
      email: "test@example",
    };

    const validationPromise = oneEvent(element, "validate");
    element._validateForm();
    const { detail } = await validationPromise;

    expect(detail.errors.email).to.exist;
    expect(detail.errors.email[0]).to.equal("Invalid email address");
  });

  it("handles form submission with all fields valid", async () => {
    // Set up valid form data
    element._formData = {
      username: "testuser",
      email: "test@example.com",
      age: 25,
      bio: "Test biography",
      interests: ["coding", "reading"],
    };

    // Listen for submit event
    const submitPromise = oneEvent(element, "submit");

    // Trigger form submission
    const form = element.shadowRoot.querySelector("form");
    const submitEvent = new Event("submit");
    submitEvent.preventDefault = () => {};
    form.dispatchEvent(submitEvent);

    // Check submit event details
    const { detail } = await submitPromise;
    expect(detail.valid).to.be.true;
    expect(detail.data).to.deep.equal(element._formData);
    expect(Object.keys(detail.errors)).to.have.lengthOf(0);
  });

  it("validates array field with both min and max items", async () => {
    // Test minimum items
    element._formData = {
      username: "testuser",
      email: "test@example.com",
      interests: [],
    };
    await element.updateComplete;

    const validationPromise = oneEvent(element, "validate");
    element._validateForm();
    const { detail } = await validationPromise;
    expect(detail.errors.interests).to.exist;
    expect(detail.errors.interests[0]).to.equal("Minimum 1 items required");

    // Test maximum items
    element._formData = {
      username: "testuser",
      email: "test@example.com",
      interests: ["coding", "reading", "gaming", "music", "sports", "art"],
    };
    await element.updateComplete;

    const validationPromise2 = oneEvent(element, "validate");
    element._validateForm();
    const { detail: detail2 } = await validationPromise2;
    expect(detail2.errors.interests).to.exist;
    expect(detail2.errors.interests[0]).to.equal("Maximum 5 items allowed");
  });

  it("validates string pattern", async () => {
    element._formData = {
      username: "test@user", // contains invalid character @
    };

    const validationPromise = oneEvent(element, "validate");
    element._validateForm();
    const { detail } = await validationPromise;

    expect(detail.errors.username).to.exist;
    expect(detail.errors.username[0]).to.equal("Invalid format");
  });

  it("renders form with all input types", async () => {
    // Update form data to test rendering
    element._formData = {
      username: "testuser",
      email: "test@example.com",
      age: 25,
      bio: "Test biography",
      interests: ["coding", "reading"],
    };
    await element.updateComplete;

    // Check all input types are rendered
    const textInput = element.shadowRoot.querySelector(
      'input[name="username"]'
    );
    expect(textInput).to.exist;
    expect(textInput.type).to.equal("text");

    const emailInput = element.shadowRoot.querySelector('input[name="email"]');
    expect(emailInput).to.exist;
    expect(emailInput.type).to.equal("email");

    const textarea = element.shadowRoot.querySelector('textarea[name="bio"]');
    expect(textarea).to.exist;

    const arrayInput = element.shadowRoot.querySelector(
      'input[name="interests"]'
    );
    expect(arrayInput).to.exist;
    expect(arrayInput.value).to.equal("coding, reading");
  });

  it("handles form submission with validation", async () => {
    // Set up partially valid form data
    element._formData = {
      username: "test", // valid
      email: "invalid-email", // invalid
      age: 15, // invalid
      interests: [], // invalid
    };

    // Listen for submit event
    const submitPromise = oneEvent(element, "submit");

    // Trigger form submission
    const form = element.shadowRoot.querySelector("form");
    const submitEvent = new Event("submit");
    submitEvent.preventDefault = () => {};
    form.dispatchEvent(submitEvent);

    // Check submit event details
    const { detail } = await submitPromise;
    expect(detail.valid).to.be.false;
    expect(Object.keys(detail.errors)).to.have.lengthOf(3);
    expect(detail.errors.email).to.exist;
    expect(detail.errors.age).to.exist;
    expect(detail.errors.interests).to.exist;
  });

  it("initializes with default values", async () => {
    const defaultElement = document.createElement("neo-autoform");
    document.body.appendChild(defaultElement);
    await defaultElement.updateComplete;

    // Check default values
    expect(defaultElement.schema).to.deep.equal({
      title: "",
      description: "",
      properties: {},
    });
    expect(defaultElement.layout).to.equal("vertical");
    expect(defaultElement.variant).to.equal("default");
    expect(defaultElement.disabled).to.be.false;
    expect(defaultElement.readonly).to.be.false;
    expect(defaultElement.showValidation).to.be.false;
    expect(defaultElement._formData).to.deep.equal({});
    expect(defaultElement._errors).to.deep.equal({});
    expect(defaultElement._touched.size).to.equal(0);

    document.body.removeChild(defaultElement);
  });

  it("handles value property changes", async () => {
    element.schema = {
      title: "Test Form",
      properties: {
        name: {
          type: "string",
          title: "Name",
        },
      },
    };
    await element.updateComplete;

    // Set value through property
    element._formData = { name: "Test Name" };
    await element.updateComplete;

    // Check if input value is updated
    const input = element.shadowRoot.querySelector('input[name="name"]');
    expect(input.value).to.equal("Test Name");

    // Check if _formData is updated
    expect(element._formData).to.deep.equal({ name: "Test Name" });
  });

  it("renders fields with descriptions", async () => {
    element.schema = {
      title: "Test Form",
      properties: {
        name: {
          type: "string",
          title: "Name",
          description: "Enter your full name",
        },
      },
    };
    await element.updateComplete;

    // Check if description is rendered
    const description = element.shadowRoot.querySelector(
      ".form-control .form-description"
    );
    expect(description).to.exist;
    expect(description.textContent).to.equal("Enter your full name");
  });

  it("renders select input for enum fields", async () => {
    element.schema = {
      title: "Test Form",
      properties: {
        status: {
          type: "string",
          title: "Status",
          enum: ["active", "inactive", "pending"],
        },
      },
    };
    await element.updateComplete;

    // Check select field
    const select = element.shadowRoot.querySelector('select[name="status"]');
    expect(select).to.exist;
    expect(select.classList.contains("input-default")).to.be.true;

    // Check options
    const options = select.querySelectorAll("option");
    expect(options.length).to.equal(4); // Including default "Select Status" option
    expect(options[1].value).to.equal("active");
    expect(options[2].value).to.equal("inactive");
    expect(options[3].value).to.equal("pending");
  });

  it("handles field blur events", async () => {
    element.schema = {
      title: "Test Form",
      properties: {
        name: {
          type: "string",
          title: "Name",
        },
      },
    };
    await element.updateComplete;

    // Trigger blur event
    const input = element.shadowRoot.querySelector('input[name="name"]');
    input.dispatchEvent(new Event("blur"));
    await element.updateComplete;

    // Check if field is marked as touched
    expect(element._touched.has("name")).to.be.true;
  });

  it("renders form title and description", async () => {
    element.schema = {
      title: "Test Form Title",
      description: "Test form description",
      properties: {
        name: {
          type: "string",
          title: "Name",
        },
      },
    };
    await element.updateComplete;

    // Check form title
    const title = element.shadowRoot.querySelector(".form-title");
    expect(title).to.exist;
    expect(title.textContent).to.equal("Test Form Title");

    // Check form description
    const description = element.shadowRoot.querySelector("p.form-description");
    expect(description).to.exist;
    expect(description.textContent).to.equal("Test form description");
  });

  it("handles required fields", async () => {
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
    await element.updateComplete;

    // Check required label
    const label = element.shadowRoot.querySelector(".form-label");
    expect(label.classList.contains("required")).to.be.true;
  });

  it("renders all form fields with proper attributes", async () => {
    element._formData = {
      username: "testuser",
      email: "test@example.com",
      age: 25,
      bio: "Test biography",
      interests: ["coding", "reading"],
    };
    await element.updateComplete;

    // Check form title and description
    const title = element.shadowRoot.querySelector(".form-title");
    const description = element.shadowRoot.querySelector(".form-description");
    expect(title.textContent).to.equal(schema.title);
    expect(description.textContent).to.equal(schema.description);

    // Check username field
    const usernameInput = element.shadowRoot.querySelector(
      'input[name="username"]'
    );
    expect(usernameInput).to.exist;
    expect(usernameInput.type).to.equal("text");
    expect(usernameInput.value).to.equal("testuser");
    expect(usernameInput.classList.contains("input-default")).to.be.true;

    // Check email field
    const emailInput = element.shadowRoot.querySelector('input[name="email"]');
    expect(emailInput).to.exist;
    expect(emailInput.type).to.equal("email");
    expect(emailInput.value).to.equal("test@example.com");

    // Check age field
    const ageInput = element.shadowRoot.querySelector('input[name="age"]');
    expect(ageInput).to.exist;
    expect(ageInput.value).to.equal("25");

    // Check bio field
    const bioInput = element.shadowRoot.querySelector('textarea[name="bio"]');
    expect(bioInput).to.exist;
    expect(bioInput.value).to.equal("Test biography");
    expect(bioInput.maxLength).to.equal(500);

    // Check interests field
    const interestsInput = element.shadowRoot.querySelector(
      'input[name="interests"]'
    );
    expect(interestsInput).to.exist;
    expect(interestsInput.value).to.equal("coding, reading");
  });

  it("handles disabled and readonly states", async () => {
    element.disabled = true;
    element.readonly = true;
    await element.updateComplete;

    const inputs = element.shadowRoot.querySelectorAll("input, textarea");
    inputs.forEach((input) => {
      expect(input.disabled).to.be.true;
      expect(input.readOnly).to.be.true;
    });
  });

  it("shows validation messages on blur", async () => {
    element.showValidation = true;
    element._formData = {
      username: "t", // too short
      email: "invalid-email",
    };
    await element.updateComplete;

    // Trigger blur on username field
    const usernameInput = element.shadowRoot.querySelector(
      'input[name="username"]'
    );
    const blurEvent = new Event("blur");
    usernameInput.dispatchEvent(blurEvent);
    await element.updateComplete;

    // Check validation message
    const validationMessage = element.shadowRoot.querySelector(
      ".validation-message"
    );
    expect(validationMessage).to.exist;
    expect(validationMessage.textContent).to.include("minimum length");
  });

  it("renders special input types", async () => {
    element.schema = {
      title: "Test Form",
      properties: {
        email: {
          type: "string",
          title: "Email",
          format: "email",
        },
        description: {
          type: "string",
          title: "Description",
          format: "textarea",
        },
        tags: {
          type: "array",
          title: "Tags",
        },
      },
    };
    await element.updateComplete;

    // Check email input
    const emailInput = element.shadowRoot.querySelector('input[type="email"]');
    expect(emailInput).to.exist;
    expect(emailInput.classList.contains("input-default")).to.be.true;

    // Check textarea
    const textarea = element.shadowRoot.querySelector("textarea");
    expect(textarea).to.exist;
    expect(textarea.classList.contains("input-default")).to.be.true;

    // Check array input
    const arrayInput = element.shadowRoot.querySelector('input[name="tags"]');
    expect(arrayInput).to.exist;
    expect(arrayInput.classList.contains("input-default")).to.be.true;
  });

  it("handles array field operations", async () => {
    element.schema = {
      title: "Test Form",
      properties: {
        tags: {
          type: "array",
          title: "Tags",
        },
      },
    };
    await element.updateComplete;

    // Test array input handling
    const arrayInput = element.shadowRoot.querySelector('input[name="tags"]');
    expect(arrayInput).to.exist;

    // Test array input with multiple values
    arrayInput.value = "tag1, tag2, tag3";
    arrayInput.dispatchEvent(new Event("input"));
    await element.updateComplete;
    expect(element._formData.tags).to.deep.equal(["tag1", "tag2", "tag3"]);

    // Test array input with single value
    arrayInput.value = "tag1";
    arrayInput.dispatchEvent(new Event("input"));
    await element.updateComplete;
    expect(element._formData.tags).to.deep.equal(["tag1"]);

    // Test array input with empty value
    arrayInput.value = "";
    arrayInput.dispatchEvent(new Event("input"));
    await element.updateComplete;
    expect(element._formData.tags).to.deep.equal([""]);
  });

  it("renders select input for enum fields", async () => {
    element.schema = {
      title: "Test Form",
      properties: {
        status: {
          type: "string",
          title: "Status",
          enum: ["active", "inactive", "pending"],
        },
      },
    };
    await element.updateComplete;

    // Check select field
    const select = element.shadowRoot.querySelector('select[name="status"]');
    expect(select).to.exist;
    expect(select.classList.contains("input-default")).to.be.true;

    // Check options
    const options = select.querySelectorAll("option");
    expect(options.length).to.equal(4); // Including default "Select Status" option
    expect(options[1].value).to.equal("active");
    expect(options[2].value).to.equal("inactive");
    expect(options[3].value).to.equal("pending");
  });

  it("handles form submission", async () => {
    element.schema = {
      title: "Test Form",
      properties: {
        name: {
          type: "string",
          title: "Name",
        },
      },
    };
    await element.updateComplete;

    // Set form data
    const input = element.shadowRoot.querySelector('input[name="name"]');
    input.value = "Test Name";
    input.dispatchEvent(new Event("input"));
    await element.updateComplete;

    // Submit form
    const form = element.shadowRoot.querySelector("form");
    form.dispatchEvent(new Event("submit"));
    await element.updateComplete;

    // Check if form data is correct
    expect(element._formData.name).to.equal("Test Name");
  });

  it("handles disabled and readonly states", async () => {
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
    await element.updateComplete;

    // Check disabled state
    const disabledInput =
      element.shadowRoot.querySelector('input[name="name"]');
    expect(disabledInput.disabled).to.be.true;

    // Check readonly state
    element.disabled = false;
    element.readonly = true;
    await element.updateComplete;
    const readonlyInput =
      element.shadowRoot.querySelector('input[name="name"]');
    expect(readonlyInput.readOnly).to.be.true;
  });

  it("renders form with different layouts", async () => {
    element.schema = {
      title: "Test Form",
      properties: {
        name: {
          type: "string",
          title: "Name",
        },
      },
    };
    await element.updateComplete;

    // Test vertical layout (default)
    const form = element.shadowRoot.querySelector("form");
    expect(form).to.exist;
    expect(form.querySelector('div[class^="layout-"]')).to.exist;

    // Test horizontal layout
    element.layout = "horizontal";
    await element.updateComplete;
    expect(form.querySelector(".layout-horizontal")).to.exist;

    // Test grid layout
    element.layout = "grid";
    await element.updateComplete;
    expect(form.querySelector(".layout-grid")).to.exist;
  });

  it("renders form with different variants", async () => {
    element.schema = {
      title: "Test Form",
      properties: {
        name: {
          type: "string",
          title: "Name",
        },
      },
    };
    await element.updateComplete;

    // Test default variant
    const form = element.shadowRoot.querySelector("form");
    expect(form).to.exist;
    expect(form.classList.contains("variant-default")).to.be.true;

    // Test compact variant
    element.variant = "compact";
    await element.updateComplete;
    expect(form.classList.contains("variant-compact")).to.be.true;

    // Test floating variant
    element.variant = "floating";
    await element.updateComplete;
    expect(form.classList.contains("variant-floating")).to.be.true;
  });

  it("renders different input types", async () => {
    element.schema = {
      title: "Test Form",
      properties: {
        text: {
          type: "string",
          title: "Text",
        },
        email: {
          type: "string",
          title: "Email",
          format: "email",
        },
        textarea: {
          type: "string",
          title: "Description",
          format: "textarea",
        },
        array: {
          type: "array",
          title: "Tags",
        },
      },
    };
    await element.updateComplete;

    // Check text input
    const textInput = element.shadowRoot.querySelector('input[type="text"]');
    expect(textInput).to.exist;
    expect(textInput.classList.contains("input-default")).to.be.true;

    // Check email input
    const emailInput = element.shadowRoot.querySelector('input[type="email"]');
    expect(emailInput).to.exist;
    expect(emailInput.classList.contains("input-default")).to.be.true;

    // Check textarea
    const textarea = element.shadowRoot.querySelector("textarea");
    expect(textarea).to.exist;
    expect(textarea.classList.contains("input-default")).to.be.true;

    // Check array input
    const arrayInput = element.shadowRoot.querySelector('input[name="array"]');
    expect(arrayInput).to.exist;
    expect(arrayInput.classList.contains("input-default")).to.be.true;
  });

  it("handles validation messages", async () => {
    element.schema = {
      title: "Test Form",
      properties: {
        name: {
          type: "string",
          title: "Name",
        },
      },
    };
    await element.updateComplete;

    // Set error and mark as touched
    element._errors = {
      name: ["Name is required"],
    };
    element._touched.add("name");
    element.showValidation = true;
    await element.updateComplete;

    // Check validation message
    const validationMessage = element.shadowRoot.querySelector(
      ".validation-message"
    );
    expect(validationMessage).to.exist;
    expect(validationMessage.textContent).to.equal("Name is required");

    // Check error class on input
    const input = element.shadowRoot.querySelector('input[name="name"]');
    expect(input.classList.contains("error")).to.be.true;
  });
});
