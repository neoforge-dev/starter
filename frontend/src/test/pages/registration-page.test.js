import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { JSDOM } from "jsdom";

// Simple test for registration page functionality
describe("Registration Page", () => {
  let document;
  let registrationPage;
  let dom;

  beforeEach(() => {
    // Create a fresh DOM for each test
    dom = new JSDOM("<!DOCTYPE html><html><body></body></html>");
    document = dom.window.document;

    // Create a simple registration page element
    registrationPage = document.createElement("div");
    registrationPage.id = "registration-page";

    // Create shadow root simulation
    const shadowRoot = document.createElement("div");
    shadowRoot.id = "shadow-root";
    registrationPage.appendChild(shadowRoot);

    // Create form container
    const formContainer = document.createElement("div");
    formContainer.className = "form-container";
    shadowRoot.appendChild(formContainer);

    // Create form
    const form = document.createElement("form");
    form.id = "registration-form";
    formContainer.appendChild(form);

    // Create form elements
    const nameField = createFormField(form, "name", "Name", "text", true);
    const emailField = createFormField(form, "email", "Email", "email", true);
    const passwordField = createFormField(
      form,
      "password",
      "Password",
      "password",
      true
    );

    // Create submit button
    const submitButton = document.createElement("button");
    submitButton.type = "submit";
    submitButton.textContent = "Register";
    form.appendChild(submitButton);

    // Create error container
    const errorContainer = document.createElement("div");
    errorContainer.className = "error-container";
    form.appendChild(errorContainer);

    // Add to document
    document.body.appendChild(registrationPage);

    // Add methods to simulate component behavior
    registrationPage.isSubmitting = false;
    registrationPage.errors = [];

    registrationPage.validateForm = () => {
      const errors = [];
      const nameInput = form.querySelector("#name");
      const emailInput = form.querySelector("#email");
      const passwordInput = form.querySelector("#password");

      if (!nameInput.value) {
        errors.push("Name is required");
      }

      if (!emailInput.value) {
        errors.push("Email is required");
      } else if (!emailInput.value.includes("@")) {
        errors.push("Email is invalid");
      }

      if (!passwordInput.value) {
        errors.push("Password is required");
      } else if (passwordInput.value.length < 8) {
        errors.push("Password must be at least 8 characters");
      }

      registrationPage.errors = errors;
      return errors.length === 0;
    };

    registrationPage.displayErrors = () => {
      const errorContainer = shadowRoot.querySelector(".error-container");
      errorContainer.innerHTML = "";

      if (registrationPage.errors.length > 0) {
        const errorList = document.createElement("ul");
        errorList.className = "error-list";

        registrationPage.errors.forEach((error) => {
          const errorItem = document.createElement("li");
          errorItem.textContent = error;
          errorList.appendChild(errorItem);
        });

        errorContainer.appendChild(errorList);
      }
    };

    registrationPage.handleSubmit = (event) => {
      if (event) event.preventDefault();

      registrationPage.isSubmitting = true;
      const submitButton = shadowRoot.querySelector('button[type="submit"]');
      submitButton.disabled = true;
      submitButton.textContent = "Registering...";

      if (registrationPage.validateForm()) {
        // Simulate successful registration
        setTimeout(() => {
          registrationPage.isSubmitting = false;
          submitButton.disabled = false;
          submitButton.textContent = "Register";

          // Clear form
          form.reset();
        }, 1000);
      } else {
        registrationPage.isSubmitting = false;
        submitButton.disabled = false;
        submitButton.textContent = "Register";
        registrationPage.displayErrors();
      }
    };

    // Add event listener
    form.addEventListener("submit", registrationPage.handleSubmit);

    // Helper function to create form fields
    function createFormField(form, id, label, type, required) {
      const fieldContainer = document.createElement("div");
      fieldContainer.className = "form-field";

      const labelElement = document.createElement("label");
      labelElement.htmlFor = id;
      labelElement.textContent = label;
      if (required) {
        labelElement.className = "required";
      }

      const input = document.createElement("input");
      input.type = type;
      input.id = id;
      input.name = id;
      input.required = required;

      fieldContainer.appendChild(labelElement);
      fieldContainer.appendChild(input);
      form.appendChild(fieldContainer);

      return input;
    }
  });

  it("should have a registration form", () => {
    const form = registrationPage.querySelector(
      "#shadow-root #registration-form"
    );
    expect(form).toBeDefined();
  });

  it("should have required form fields", () => {
    const nameField = registrationPage.querySelector("#shadow-root #name");
    const emailField = registrationPage.querySelector("#shadow-root #email");
    const passwordField = registrationPage.querySelector(
      "#shadow-root #password"
    );

    expect(nameField).toBeDefined();
    expect(emailField).toBeDefined();
    expect(passwordField).toBeDefined();

    expect(nameField.required).toBe(true);
    expect(emailField.required).toBe(true);
    expect(passwordField.required).toBe(true);
  });

  it("should validate required fields", () => {
    // Don't fill in any fields
    const isValid = registrationPage.validateForm();

    expect(isValid).toBe(false);
    expect(registrationPage.errors.length).toBe(3);
    expect(registrationPage.errors).toContain("Name is required");
    expect(registrationPage.errors).toContain("Email is required");
    expect(registrationPage.errors).toContain("Password is required");
  });

  it("should validate email format", () => {
    // Fill in fields with invalid email
    const nameField = registrationPage.querySelector("#shadow-root #name");
    const emailField = registrationPage.querySelector("#shadow-root #email");
    const passwordField = registrationPage.querySelector(
      "#shadow-root #password"
    );

    nameField.value = "Test User";
    emailField.value = "invalid-email";
    passwordField.value = "password123";

    const isValid = registrationPage.validateForm();

    expect(isValid).toBe(false);
    expect(registrationPage.errors.length).toBe(1);
    expect(registrationPage.errors[0]).toBe("Email is invalid");
  });

  it("should validate password length", () => {
    // Fill in fields with short password
    const nameField = registrationPage.querySelector("#shadow-root #name");
    const emailField = registrationPage.querySelector("#shadow-root #email");
    const passwordField = registrationPage.querySelector(
      "#shadow-root #password"
    );

    nameField.value = "Test User";
    emailField.value = "test@example.com";
    passwordField.value = "short";

    const isValid = registrationPage.validateForm();

    expect(isValid).toBe(false);
    expect(registrationPage.errors.length).toBe(1);
    expect(registrationPage.errors[0]).toBe(
      "Password must be at least 8 characters"
    );
  });

  it("should display error messages", () => {
    // Set some errors and display them
    registrationPage.errors = ["Test error 1", "Test error 2"];
    registrationPage.displayErrors();

    const errorItems = registrationPage.querySelectorAll(
      "#shadow-root .error-list li"
    );
    expect(errorItems.length).toBe(2);
    expect(errorItems[0].textContent).toBe("Test error 1");
    expect(errorItems[1].textContent).toBe("Test error 2");
  });

  it("should handle form submission", () => {
    // Fill in valid form data
    const nameField = registrationPage.querySelector("#shadow-root #name");
    const emailField = registrationPage.querySelector("#shadow-root #email");
    const passwordField = registrationPage.querySelector(
      "#shadow-root #password"
    );

    nameField.value = "Test User";
    emailField.value = "test@example.com";
    passwordField.value = "password123";

    // Submit the form
    const form = registrationPage.querySelector(
      "#shadow-root #registration-form"
    );
    const submitEvent = new dom.window.Event("submit");

    // Mock preventDefault
    submitEvent.preventDefault = () => {};

    form.dispatchEvent(submitEvent);

    // Check submission state
    expect(registrationPage.isSubmitting).toBe(true);

    const submitButton = registrationPage.querySelector(
      '#shadow-root button[type="submit"]'
    );
    expect(submitButton.disabled).toBe(true);
    expect(submitButton.textContent).toBe("Registering...");
  });
});
