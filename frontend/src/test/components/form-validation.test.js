import { expect } from "@esm-bundle/chai";
import { fixture, html, oneEvent } from "@open-wc/testing";
import "../../components/ui/form-validation.js";

describe("NeoForm", () => {
  let element;

  beforeEach(async () => {
    element = await fixture(html`
      <neo-form>
        <input
          type="text"
          name="username"
          required
          minlength="3"
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
      </neo-form>
    `);
  });

  it("renders with default properties", () => {
    expect(element.errors).to.deep.equal({});
    expect(element.customRules).to.deep.equal({});
  });

  it("validates required fields", async () => {
    const result = await element.validate();
    expect(result.valid).to.be.false;
    expect(Object.keys(result.errors)).to.have.lengthOf(3);
    expect(result.errors.username).to.equal("This field is required");
    expect(result.errors.email).to.equal("This field is required");
    expect(result.errors.password).to.equal("This field is required");
  });

  it("validates email format", async () => {
    const emailInput = element.querySelector('input[type="email"]');
    emailInput.value = "invalid-email";

    const validationPromise = oneEvent(element, "validation-change");
    emailInput.dispatchEvent(new Event("input"));
    await validationPromise;

    expect(element.errors.email).to.equal("Please enter a valid email address");

    emailInput.value = "valid@email.com";
    const validationPromise2 = oneEvent(element, "validation-change");
    emailInput.dispatchEvent(new Event("input"));
    await validationPromise2;

    expect(element.errors.email).to.be.undefined;
  });

  it("validates minimum length", async () => {
    const usernameInput = element.querySelector('input[name="username"]');
    usernameInput.value = "ab";

    const validationPromise = oneEvent(element, "validation-change");
    usernameInput.dispatchEvent(new Event("input"));
    await validationPromise;

    expect(element.errors.username).to.equal("Minimum length is 3 characters");

    usernameInput.value = "abc";
    const validationPromise2 = oneEvent(element, "validation-change");
    usernameInput.dispatchEvent(new Event("input"));
    await validationPromise2;

    expect(element.errors.username).to.be.undefined;
  });

  it("validates pattern", async () => {
    const passwordInput = element.querySelector('input[name="password"]');
    passwordInput.value = "weakpass";

    const validationPromise = oneEvent(element, "validation-change");
    passwordInput.dispatchEvent(new Event("input"));
    await validationPromise;

    expect(element.errors.password).to.equal(
      "Please match the requested format"
    );

    passwordInput.value = "StrongPass123";
    const validationPromise2 = oneEvent(element, "validation-change");
    passwordInput.dispatchEvent(new Event("input"));
    await validationPromise2;

    expect(element.errors.password).to.be.undefined;
  });

  it("supports custom validation rules", async () => {
    element.addValidationRule("username", (value) => {
      if (value && value.includes(" ")) {
        return "Username cannot contain spaces";
      }
      return null;
    });

    const usernameInput = element.querySelector('input[name="username"]');
    usernameInput.value = "user name";

    const validationPromise = oneEvent(element, "validation-change");
    usernameInput.dispatchEvent(new Event("input"));
    await validationPromise;

    expect(element.errors.username).to.equal("Username cannot contain spaces");

    usernameInput.value = "username";
    const validationPromise2 = oneEvent(element, "validation-change");
    usernameInput.dispatchEvent(new Event("input"));
    await validationPromise2;

    expect(element.errors.username).to.be.undefined;
  });

  it("clears validation on form reset", async () => {
    const usernameInput = element.querySelector('input[name="username"]');
    usernameInput.value = "ab";

    const validationPromise = oneEvent(element, "validation-change");
    usernameInput.dispatchEvent(new Event("input"));
    await validationPromise;

    expect(element.errors.username).to.exist;

    element.clearValidation();
    expect(element.errors).to.deep.equal({});
  });

  it("prevents form submission when invalid", async () => {
    const form = element.shadowRoot.querySelector("form");
    let prevented = false;

    const submitEvent = new Event("submit");
    submitEvent.preventDefault = () => {
      prevented = true;
    };

    form.dispatchEvent(submitEvent);
    expect(prevented).to.be.true;

    // Fill in valid data
    const inputs = element.querySelectorAll("input");
    inputs[0].value = "username";
    inputs[1].value = "test@email.com";
    inputs[2].value = "StrongPass123";

    // Validate all fields
    await Promise.all(
      Array.from(inputs).map(async (input) => {
        const validationPromise = oneEvent(element, "validation-change");
        input.dispatchEvent(new Event("input"));
        await validationPromise;
      })
    );

    prevented = false;
    form.dispatchEvent(submitEvent);
    expect(prevented).to.be.false;
  });

  it("validates all fields at once", async () => {
    const result = await element.validate();
    expect(result.valid).to.be.false;
    expect(Object.keys(result.errors)).to.have.lengthOf(3);

    // Fill in valid data
    const inputs = element.querySelectorAll("input");
    inputs[0].value = "username";
    inputs[1].value = "test@email.com";
    inputs[2].value = "StrongPass123";

    const result2 = await element.validate();
    expect(result2.valid).to.be.true;
    expect(Object.keys(result2.errors)).to.have.lengthOf(0);
  });
});
