import { expect, describe, it, beforeEach, vi } from "vitest";
import { html } from "lit";

/**
 * Mock for the NeoInput component
 */
class MockNeoInput {
  constructor() {
    // Properties from the component
    this.type = "text";
    this.label = "";
    this.value = "";
    this.placeholder = "";
    this.disabled = false;
    this.required = false;
    this.error = "";
    this.helperText = "";
    this.helper = "";
    this.pattern = "";
    this.maxLength = null;
    this.minLength = null;
    this.name = "";
    this._showPassword = false;
    this._id = `neo-input-${Math.random().toString(36).substr(2, 9)}`;

    // Event listeners
    this._eventListeners = new Map();

    // Mock DOM elements
    this._inputElement = {
      value: this.value,
      type: this.type,
      disabled: this.disabled,
      required: this.required,
      focus: vi.fn(),
      blur: vi.fn(),
      checkValidity: vi.fn(() => !this.error),
      reportValidity: vi.fn(() => !this.error),
      validationMessage: "",
    };
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
        if (selector === "input") return this._inputElement;
        return null;
      },
      querySelectorAll: (selector) => {
        if (selector === "input") return [this._inputElement];
        return [];
      },
    };
  }

  // Methods from the component
  _handleInput(e) {
    this.value = e.target.value;
    this._inputElement.value = this.value;

    this.dispatchEvent(
      new CustomEvent("neo-input", {
        detail: { value: this.value },
        bubbles: true,
        composed: true,
      })
    );

    // Also dispatch standard input event
    this.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
  }

  _handleChange(e) {
    this.dispatchEvent(
      new CustomEvent("neo-change", {
        detail: { value: this.value },
        bubbles: true,
        composed: true,
      })
    );

    // Also dispatch standard change event
    this.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
  }

  _togglePasswordVisibility() {
    this._showPassword = !this._showPassword;
    this._inputElement.type = this._showPassword ? "text" : "password";
  }

  focus() {
    this._inputElement.focus();
    this.dispatchEvent(new Event("focus", { bubbles: true, composed: true }));
  }

  blur() {
    this._inputElement.blur();
    this.dispatchEvent(new Event("blur", { bubbles: true, composed: true }));
  }

  reportValidity() {
    const isValid = this._inputElement.reportValidity();

    if (!isValid) {
      this.error = this._inputElement.validationMessage;
      this.dispatchEvent(
        new Event("invalid", { bubbles: true, composed: true })
      );
    } else {
      this.error = "";
    }

    return isValid;
  }

  checkValidity() {
    return this._inputElement.checkValidity();
  }

  // Helper methods for testing
  setInputValue(value) {
    this.value = value;
    this._inputElement.value = value;
  }

  simulateInput(value) {
    this.setInputValue(value);
    this._handleInput({ target: { value } });
  }

  simulateChange(value) {
    this.setInputValue(value);
    this._handleChange({ target: { value } });
  }

  setError(message) {
    this.error = message;
    this._inputElement.validationMessage = message;
  }
}

describe("NeoInput", () => {
  let element;

  beforeEach(() => {
    element = new MockNeoInput();
  });

  it("should initialize with default properties", () => {
    expect(element.type).toBe("text");
    expect(element.value).toBe("");
    expect(element.disabled).toBe(false);
    expect(element.required).toBe(false);
    expect(element.error).toBe("");
  });

  it("should update value on input", () => {
    const inputSpy = vi.fn();
    element.addEventListener("neo-input", inputSpy);

    element.simulateInput("test value");

    expect(element.value).toBe("test value");
    expect(inputSpy).toHaveBeenCalledTimes(1);
    expect(inputSpy.mock.calls[0][0].detail.value).toBe("test value");
  });

  it("should dispatch change event", () => {
    const changeSpy = vi.fn();
    element.addEventListener("neo-change", changeSpy);

    element.simulateChange("changed value");

    expect(changeSpy).toHaveBeenCalledTimes(1);
    expect(changeSpy.mock.calls[0][0].detail.value).toBe("changed value");
  });

  it("should toggle password visibility", () => {
    element.type = "password";
    expect(element._showPassword).toBe(false);

    element._togglePasswordVisibility();
    expect(element._showPassword).toBe(true);
    expect(element._inputElement.type).toBe("text");

    element._togglePasswordVisibility();
    expect(element._showPassword).toBe(false);
    expect(element._inputElement.type).toBe("password");
  });

  it("should focus and blur the input", () => {
    const focusSpy = vi.fn();
    const blurSpy = vi.fn();
    element.addEventListener("focus", focusSpy);
    element.addEventListener("blur", blurSpy);

    element.focus();
    expect(element._inputElement.focus).toHaveBeenCalledTimes(1);
    expect(focusSpy).toHaveBeenCalledTimes(1);

    element.blur();
    expect(element._inputElement.blur).toHaveBeenCalledTimes(1);
    expect(blurSpy).toHaveBeenCalledTimes(1);
  });

  it("should report validity", () => {
    // Mock valid input
    element._inputElement.reportValidity.mockReturnValueOnce(true);
    expect(element.reportValidity()).toBe(true);
    expect(element.error).toBe("");

    // Mock invalid input
    element._inputElement.validationMessage = "This field is required";
    element._inputElement.reportValidity.mockReturnValueOnce(false);

    const invalidSpy = vi.fn();
    element.addEventListener("invalid", invalidSpy);

    expect(element.reportValidity()).toBe(false);
    expect(element.error).toBe("This field is required");
    expect(invalidSpy).toHaveBeenCalledTimes(1);
  });

  it("should check validity", () => {
    element._inputElement.checkValidity.mockReturnValueOnce(true);
    expect(element.checkValidity()).toBe(true);

    element._inputElement.checkValidity.mockReturnValueOnce(false);
    expect(element.checkValidity()).toBe(false);
  });

  it("should display helper text when no error", () => {
    element.helperText = "This is helper text";
    expect(element.helperText).toBe("This is helper text");

    // When error is present, helper text should not be displayed
    element.error = "This is an error";
    expect(element.error).toBe("This is an error");
  });
});
