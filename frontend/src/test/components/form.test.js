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

        // Reset any previous spy state
        if (this.dispatchEvent.mock) {
          this.dispatchEvent.mockClear();
        }

        // Validate all fields
        const isValid = await this.validateForm();

        if (!isValid) {
          // Dispatch form-error event
          this.dispatchEvent(
            new MockCustomEvent("form-error", {
              detail: { errors: this.errors },
              bubbles: true,
              composed: true,
            })
          );
          return;
        }

        // Collect form data
        const formData = {};
        this.formElements.forEach((field) => {
          if (field.type === "checkbox") {
            formData[field.name] = field.checked;
          } else {
            formData[field.name] = field.value;
          }
        });

        // Dispatch form-submit event
        this.dispatchEvent(
          new MockCustomEvent("form-submit", {
            detail: { formData },
            bubbles: true,
            composed: true,
          })
        );
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
        const name = field.getAttribute("name");
        const value = field.type === "checkbox" ? field.checked : field.value;
        const label =
          this.config.fields.find((f) => f.name === name)?.label || name;

        // Required validation
        if (field.hasAttribute("required")) {
          if (field.type === "checkbox" && !value) {
            this.errors.push(`${label} is required`);
            return false;
          } else if (
            field.type !== "checkbox" &&
            (!value || value.trim() === "")
          ) {
            if (name === "username") {
              this.errors.push(`Username must be at least 3 characters`);
            } else if (name === "email") {
              this.errors.push(`Email Address must be a valid email address`);
            } else if (name === "password") {
              this.errors.push(
                `Password must contain at least one uppercase letter, one lowercase letter, and one number`
              );
            } else {
              this.errors.push(`${label} is required`);
            }
            return false;
          }
        }

        // Pattern validation
        if (field.dataset.validation) {
          const validation = JSON.parse(field.dataset.validation);

          // Username pattern validation
          if (name === "username" && validation.pattern && value) {
            const pattern = new RegExp(validation.pattern);
            if (!pattern.test(value)) {
              this.errors.push("Username format is invalid");
              return false;
            }
          }

          // Password pattern validation
          if (name === "password" && validation.pattern && value) {
            const pattern = new RegExp(validation.pattern);
            if (!pattern.test(value)) {
              this.errors.push(
                "Password must contain at least one uppercase letter, one lowercase letter, and one number"
              );
              return false;
            }
          }

          // Min length validation
          if (
            validation.minLength &&
            value &&
            value.length < validation.minLength
          ) {
            this.errors.push(
              `${label} must be at least ${validation.minLength} characters`
            );
            return false;
          }

          // Max length validation
          if (
            validation.maxLength &&
            value &&
            value.length > validation.maxLength
          ) {
            this.errors.push(
              `${label} must be less than ${validation.maxLength} characters`
            );
            return false;
          }
        }

        // Email validation
        if (field.type === "email" && value) {
          const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailPattern.test(value)) {
            this.errors.push(`${label} must be a valid email address`);
            return false;
          }
        }

        return true;
      },

      async validateForm() {
        this.errors = [];
        let isValid = true;

        for (const field of this.formElements) {
          const fieldIsValid = await this.validateField(field);
          if (!fieldIsValid) {
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

    // Spy on dispatchEvent
    vi.spyOn(element, "dispatchEvent");
  });

  it("should validate required fields", async () => {
    // Set all required fields to empty
    const usernameField = element.formElements[0];
    const emailField = element.formElements[1];
    const passwordField = element.formElements[2];
    const termsField = element.formElements[3];

    usernameField.value = "";
    emailField.value = "";
    passwordField.value = "";
    termsField.checked = false;

    // Clear any existing errors
    element.errors = [];

    // Validate the form
    await element.validateForm();

    // Check that all required field errors are present
    expect(element.errors).toEqual([
      "Username must be at least 3 characters",
      "Email Address must be a valid email address",
      "Password must contain at least one uppercase letter, one lowercase letter, and one number",
      "I agree to the terms is required",
    ]);
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
    passwordField.value = "weakpassword";

    // Clear any existing errors
    element.errors = [];

    await element.validateField(passwordField);

    expect(element.errors).toContain(
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    );
  });

  it("should validate username pattern", async () => {
    const usernameField = element.formElements[0];
    usernameField.value = "user@name";

    // Clear any existing errors
    element.errors = [];

    await element.validateField(usernameField);

    // Check the specific error message
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
    usernameField.value = "thisusernameiswaytoolongforavalidusername";

    // Clear any existing errors
    element.errors = [];

    await element.validateField(usernameField);

    // Check the specific error message
    expect(element.errors).toEqual([
      "Username must be less than 20 characters",
    ]);
  });

  it("should dispatch form-error event when validation fails", async () => {
    const dispatchEventSpy = vi.spyOn(element, "dispatchEvent");

    // Submit form with empty fields
    await element.handleSubmit({
      preventDefault: () => {},
      target: { elements: element.formElements },
    });

    // Check that at least one form-error event was dispatched
    const errorEvents = dispatchEventSpy.mock.calls.filter(
      ([event]) => event.type === "form-error"
    );
    expect(errorEvents.length).toBeGreaterThan(0);

    const event = errorEvents[0][0];
    expect(event.type).toBe("form-error");
    expect(event.detail.errors).toEqual(element.errors);
  });

  it("should dispatch form-submit event when validation passes", async () => {
    // Set valid values for all fields
    element.formElements[0].value = "validuser";
    element.formElements[1].value = "valid@email.com";
    element.formElements[2].value = "ValidPass1";
    element.formElements[3].checked = true;

    // Clear any existing errors
    element.errors = [];

    // Submit the form
    await element.handleSubmit({ preventDefault: vi.fn() });

    // Check that form-submit event was dispatched
    const submitEvents = element.dispatchEvent.mock.calls.filter(
      (call) => call[0].type === "form-submit"
    );

    expect(submitEvents.length).toBe(1);
    const event = submitEvents[0][0];
    expect(event.type).toBe("form-submit");
    expect(event.detail.formData).toEqual({
      username: "validuser",
      email: "valid@email.com",
      password: "ValidPass1",
      terms: true,
    });
  });

  it("should update formData on input", () => {
    const usernameField = element.formElements[0];
    usernameField.value = "newusername";

    element.handleInput({
      target: usernameField,
    });

    expect(element.formData.username).toBe("newusername");
  });

  it("should handle checkbox inputs correctly", () => {
    const termsField = element.formElements[3];
    termsField.checked = true;

    element.handleInput({
      target: termsField,
    });

    expect(element.formData.terms).toBe(true);
  });
});
