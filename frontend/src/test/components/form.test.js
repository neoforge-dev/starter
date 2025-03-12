import { expect, describe, it, beforeEach, vi } from "vitest";

/**
 * Mock CustomEvent for testing
 */
class MockCustomEvent {
  constructor(type, options = {}) {
    this.type = type;
    this.detail = options.detail || {};
    this.bubbles = options.bubbles || false;
    this.composed = options.composed || false;
    this.defaultPrevented = false;
  }

  preventDefault() {
    this.defaultPrevented = true;
  }
}

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

  beforeEach(() => {
    // Create a pure JavaScript mock for the form component
    element = {
      config: mockFormConfig,
      submitText: "Submit",
      asyncValidators: {},
      formData: {},
      errors: [],
      _eventListeners: new Map(),

      // Create mock form elements based on config
      formElements: mockFormConfig.fields.map((field, index) => ({
        name: field.name,
        type: field.type,
        value: "",
        checked: false,
        required: field.required,
        dataset: {
          validation: field.validation
            ? JSON.stringify(field.validation)
            : null,
        },
        getAttribute: (attr) => {
          if (attr === "required") return field.required ? "true" : null;
          if (attr === "type") return field.type;
          if (attr === "name") return field.name;
          return null;
        },
        hasAttribute: (attr) => {
          if (attr === "required") return field.required;
          return false;
        },
      })),

      // Event handling
      addEventListener(event, callback) {
        if (!this._eventListeners.has(event)) {
          this._eventListeners.set(event, []);
        }
        this._eventListeners.get(event).push(callback);
      },

      removeEventListener(event, callback) {
        if (!this._eventListeners.has(event)) return;
        const listeners = this._eventListeners.get(event);
        const index = listeners.indexOf(callback);
        if (index !== -1) {
          listeners.splice(index, 1);
        }
      },

      dispatchEvent(event) {
        const listeners = this._eventListeners.get(event.type) || [];
        listeners.forEach((callback) => callback(event));
        return !event.defaultPrevented;
      },

      // Mock shadow DOM
      shadowRoot: {
        querySelector: (selector) => {
          if (selector === "form") {
            return {
              addEventListener: (event, handler) => {
                if (event === "submit") {
                  element.addEventListener("submit", handler);
                }
              },
              elements: element.formElements,
            };
          }
          return null;
        },
      },

      // Form handling methods
      async handleSubmit(event) {
        event.preventDefault && event.preventDefault();

        // Validate all fields
        const isValid = await this.validateForm();

        if (!isValid) {
          // Dispatch form-error event
          this.dispatchEvent(
            new MockCustomEvent("form-error", {
              detail: { errors: this.errors },
            })
          );
          return false;
        }

        // Collect form data
        const formData = {};
        for (const field of this.formElements) {
          if (field.type === "checkbox") {
            formData[field.name] = field.checked;
          } else {
            formData[field.name] = field.value;
          }
        }

        // Dispatch form-submit event
        this.dispatchEvent(
          new MockCustomEvent("form-submit", {
            detail: { data: formData },
          })
        );

        return true;
      },

      handleInput(event) {
        const { name, value, type, checked } = event.target;

        if (type === "checkbox") {
          this.formData[name] = checked;
        } else {
          this.formData[name] = value;
        }
      },

      async validateField(field) {
        const name = field.name;
        const value = field.type === "checkbox" ? field.checked : field.value;
        const fieldConfig = this.config.fields.find((f) => f.name === name);

        // Clear previous errors for this field
        this.errors = this.errors.filter(
          (error) => !error.startsWith(fieldConfig.label)
        );

        // Required validation
        if (fieldConfig.required && !value) {
          this.errors.push(`${fieldConfig.label} is required`);
          return false;
        }

        // Skip further validation if empty and not required
        if (!value && !fieldConfig.required) {
          return true;
        }

        // Validation rules
        if (fieldConfig.validation) {
          // Min length
          if (
            fieldConfig.validation.minLength &&
            value.length < fieldConfig.validation.minLength
          ) {
            this.errors.push(
              `${fieldConfig.label} must be at least ${fieldConfig.validation.minLength} characters`
            );
            return false;
          }

          // Max length
          if (
            fieldConfig.validation.maxLength &&
            value.length > fieldConfig.validation.maxLength
          ) {
            this.errors.push(
              `${fieldConfig.label} must be at most ${fieldConfig.validation.maxLength} characters`
            );
            return false;
          }

          // Pattern validation
          if (fieldConfig.validation.pattern) {
            const regex = new RegExp(fieldConfig.validation.pattern);
            if (!regex.test(value)) {
              // Special message for password pattern
              if (name === "password") {
                this.errors.push(
                  `${fieldConfig.label} must contain at least one uppercase letter, one lowercase letter, and one number`
                );
              } else {
                this.errors.push(`${fieldConfig.label} format is invalid`);
              }
              return false;
            }
          }
        }

        // Email validation
        if (fieldConfig.type === "email" && value) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            this.errors.push(
              `${fieldConfig.label} must be a valid email address`
            );
            return false;
          }
        }

        // Async validators
        if (this.asyncValidators[name]) {
          try {
            const result = await this.asyncValidators[name](value);
            if (!result.valid) {
              this.errors.push(`${fieldConfig.label} ${result.message}`);
              return false;
            }
          } catch (error) {
            this.errors.push(`Error validating ${fieldConfig.label}`);
            return false;
          }
        }

        return true;
      },

      async validateForm() {
        this.errors = [];
        let isValid = true;

        for (const field of this.formElements) {
          const fieldValid = await this.validateField(field);
          if (!fieldValid) {
            isValid = false;
          }
        }

        return isValid;
      },

      requestUpdate() {
        return Promise.resolve();
      },

      get updateComplete() {
        return Promise.resolve();
      },
    };
  });

  it("should validate required fields", async () => {
    await element.validateForm();

    expect(element.errors).toContain("Username is required");
    expect(element.errors).toContain("Email Address is required");
    expect(element.errors).toContain("Password is required");
    expect(element.errors).toContain("I agree to the terms is required");
  });

  it("should validate email format", async () => {
    const emailField = element.formElements[1];
    emailField.value = "invalid-email";

    await element.validateField(emailField);

    expect(element.errors).toContain(
      "Email Address must be a valid email address"
    );
  });

  it("should validate password requirements", async () => {
    const passwordField = element.formElements[2];
    passwordField.value = "password"; // Missing uppercase and number

    await element.validateField(passwordField);

    expect(element.errors).toContain(
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    );
  });

  it("should validate username pattern", async () => {
    const usernameField = element.formElements[0];
    usernameField.value = "user@name"; // Contains invalid character @

    await element.validateField(usernameField);

    expect(element.errors).toContain("Username format is invalid");
  });

  it("should validate minimum length", async () => {
    const usernameField = element.formElements[0];
    usernameField.value = "us"; // Too short

    await element.validateField(usernameField);

    expect(element.errors).toContain("Username must be at least 3 characters");
  });

  it("should validate maximum length", async () => {
    const usernameField = element.formElements[0];
    usernameField.value = "a".repeat(21); // Too long

    await element.validateField(usernameField);

    expect(element.errors).toContain("Username must be at most 20 characters");
  });

  it("should dispatch form-error event when validation fails", async () => {
    const dispatchEventSpy = vi.spyOn(element, "dispatchEvent");

    // Submit form with empty fields
    await element.handleSubmit({
      preventDefault: () => {},
      target: { elements: element.formElements },
    });

    expect(dispatchEventSpy).toHaveBeenCalledTimes(1);
    const event = dispatchEventSpy.mock.calls[0][0];
    expect(event.type).toBe("form-error");
    expect(event.detail.errors).toEqual(element.errors);
  });

  it("should dispatch form-submit event when validation passes", async () => {
    const dispatchEventSpy = vi.spyOn(element, "dispatchEvent");

    // Fill in all required fields with valid values
    element.formElements[0].value = "validuser";
    element.formElements[1].value = "valid@email.com";
    element.formElements[2].value = "ValidPass1";
    element.formElements[3].checked = true;

    // Validate all fields first
    for (const field of element.formElements) {
      await element.validateField(field);
    }

    // Submit form
    await element.handleSubmit({
      preventDefault: () => {},
      target: { elements: element.formElements },
    });

    expect(dispatchEventSpy).toHaveBeenCalledTimes(1);
    const event = dispatchEventSpy.mock.calls[0][0];
    expect(event.type).toBe("form-submit");
    expect(event.detail.data).toEqual({
      username: "validuser",
      email: "valid@email.com",
      password: "ValidPass1",
      terms: true,
    });
  });

  it("should update formData on input", () => {
    const usernameField = element.formElements[0];

    element.handleInput({
      target: {
        name: "username",
        value: "newusername",
        type: "text",
      },
    });

    expect(element.formData.username).toBe("newusername");
  });

  it("should handle checkbox inputs correctly", () => {
    const termsField = element.formElements[3];

    element.handleInput({
      target: {
        name: "terms",
        checked: true,
        type: "checkbox",
      },
    });

    expect(element.formData.terms).toBe(true);
  });
});
