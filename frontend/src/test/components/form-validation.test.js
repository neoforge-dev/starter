import { expect, describe, it, beforeEach, vi } from "vitest";

/**
 * Mock for the FormValidation component
 */
class MockFormValidation {
  constructor() {
    // Properties from the component
    this.rules = {};
    this.messages = {};
    this.errors = {};
    this.touched = {};
    this.value = {};

    // Event listeners
    this._eventListeners = new Map();

    // Mock slot elements
    this._slotElements = [];
  }

  // Event handling
  addEventListener(event, callback) {
    if (!this._eventListeners.has(event)) {
      this._eventListeners.set(event, []);
    }
    this._eventListeners.get(event).push(callback);
  }

  removeEventListener(event, callback) {
    if (!this._eventListeners.has(event)) return;
    const listeners = this._eventListeners.get(event);
    const index = listeners.indexOf(callback);
    if (index !== -1) {
      listeners.splice(index, 1);
    }
  }

  dispatchEvent(event) {
    const listeners = this._eventListeners.get(event.type) || [];
    listeners.forEach((callback) => callback(event));
    return !event.defaultPrevented;
  }

  // Mock shadow DOM
  get shadowRoot() {
    return {
      querySelector: (selector) => {
        if (selector === "slot") {
          return {
            assignedElements: () => this._slotElements,
          };
        }
        return null;
      },
    };
  }

  // Methods from the component
  _handleSlotChange(e) {
    const elements = e.target.assignedElements();
    elements.forEach((element) => {
      if (element.hasAttribute("name")) {
        const name = element.getAttribute("name");
        element.addEventListener("input", () =>
          this._validateField(name, element.value)
        );
        element.addEventListener("blur", () => this._markAsTouched(name));
      }
    });
  }

  _validateField(field, value) {
    const rules = this.rules[field] || [];
    let error = null;

    for (const rule of rules) {
      if (typeof rule === "function") {
        const result = rule(value);
        if (result !== true) {
          error = this.messages[field]?.[rules.indexOf(rule)] || result;
          break;
        }
      }
    }

    this.errors = {
      ...this.errors,
      [field]: error,
    };

    this._notifyValidation(field, !error);
    return !error;
  }

  _markAsTouched(field) {
    this.touched = {
      ...this.touched,
      [field]: true,
    };
  }

  _notifyValidation(field, isValid) {
    this.dispatchEvent(
      new CustomEvent("validation", {
        detail: {
          field,
          isValid,
          error: this.errors[field],
        },
        bubbles: true,
        composed: true,
      })
    );
  }

  validate() {
    const fields = Object.keys(this.rules);
    const elements = this._slotElements;

    let isValid = true;
    fields.forEach((field) => {
      const element = elements.find((el) => el.getAttribute("name") === field);
      if (element) {
        this._markAsTouched(field);
        if (!this._validateField(field, element.value)) {
          isValid = false;
          element.classList.add("field-error");
          setTimeout(() => element.classList.remove("field-error"), 400);
        }
      }
    });

    return isValid;
  }

  reset() {
    this.errors = {};
    this.touched = {};
    this.dispatchEvent(new CustomEvent("reset"));
  }

  // Helper methods for testing
  addSlotElement(element) {
    this._slotElements.push(element);
  }
}

describe("FormValidation", () => {
  let element;

  beforeEach(() => {
    element = new MockFormValidation();
  });

  it("should initialize with default properties", () => {
    expect(element.rules).toEqual({});
    expect(element.messages).toEqual({});
    expect(element.errors).toEqual({});
    expect(element.touched).toEqual({});
    expect(element.value).toEqual({});
  });

  it("should validate a field with rules", () => {
    // Setup a required rule
    const requiredRule = (value) => (value ? true : "Field is required");
    element.rules = {
      username: [requiredRule],
    };

    // Test with invalid value
    const isValid1 = element._validateField("username", "");
    expect(isValid1).toBe(false);
    expect(element.errors.username).toBe("Field is required");

    // Test with valid value
    const isValid2 = element._validateField("username", "testuser");
    expect(isValid2).toBe(true);
    expect(element.errors.username).toBe(null);
  });

  it("should mark a field as touched", () => {
    element._markAsTouched("username");
    expect(element.touched.username).toBe(true);
  });

  it("should notify validation results", () => {
    const validationSpy = vi.fn();
    element.addEventListener("validation", validationSpy);

    element.errors = { username: "Error message" };
    element._notifyValidation("username", false);

    expect(validationSpy).toHaveBeenCalledTimes(1);
    const event = validationSpy.mock.calls[0][0];
    expect(event.detail.field).toBe("username");
    expect(event.detail.isValid).toBe(false);
    expect(event.detail.error).toBe("Error message");
  });

  it("should validate all fields", () => {
    // Setup mock elements
    const usernameInput = {
      getAttribute: () => "username",
      value: "",
      classList: {
        add: vi.fn(),
        remove: vi.fn(),
      },
    };

    const emailInput = {
      getAttribute: () => "email",
      value: "invalid",
      classList: {
        add: vi.fn(),
        remove: vi.fn(),
      },
    };

    element.addSlotElement(usernameInput);
    element.addSlotElement(emailInput);

    // Setup rules
    const requiredRule = (value) => (value ? true : "Field is required");
    const emailRule = (value) =>
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? true : "Invalid email";

    element.rules = {
      username: [requiredRule],
      email: [emailRule],
    };

    // Validate all fields
    const isValid = element.validate();

    expect(isValid).toBe(false);
    expect(element.touched.username).toBe(true);
    expect(element.touched.email).toBe(true);
    expect(element.errors.username).toBe("Field is required");
    expect(element.errors.email).toBe("Invalid email");
    expect(usernameInput.classList.add).toHaveBeenCalledWith("field-error");
    expect(emailInput.classList.add).toHaveBeenCalledWith("field-error");
  });

  it("should reset validation state", () => {
    element.errors = { username: "Error" };
    element.touched = { username: true };

    const resetSpy = vi.fn();
    element.addEventListener("reset", resetSpy);

    element.reset();

    expect(element.errors).toEqual({});
    expect(element.touched).toEqual({});
    expect(resetSpy).toHaveBeenCalledTimes(1);
  });

  it("should handle slot changes", () => {
    const inputElement = {
      hasAttribute: () => true,
      getAttribute: () => "username",
      addEventListener: vi.fn(),
      value: "test",
    };

    const slotEvent = {
      target: {
        assignedElements: () => [inputElement],
      },
    };

    element._handleSlotChange(slotEvent);

    expect(inputElement.addEventListener).toHaveBeenCalledTimes(2);
    expect(inputElement.addEventListener.mock.calls[0][0]).toBe("input");
    expect(inputElement.addEventListener.mock.calls[1][0]).toBe("blur");
  });
});
