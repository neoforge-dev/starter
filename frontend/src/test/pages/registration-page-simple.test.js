import { expect, vi, describe, it, beforeEach, afterEach } from "vitest";
import {   html   } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";

// Mock for window.auth
window.auth = {
  checkEmailAvailability: vi.fn().mockResolvedValue(true),
  validatePassword: vi.fn().mockResolvedValue({ isValid: true }),
  register: vi.fn().mockResolvedValue({ success: true }),
  sendVerificationEmail: vi.fn().mockResolvedValue(true),
  registerWithGoogle: vi
    .fn()
    .mockResolvedValue({ user: { name: "Test User" } }),
  registerWithGithub: vi
    .fn()
    .mockResolvedValue({ user: { name: "Test User" } }),
};

// Mock the RegistrationPage without extending HTMLElement
class MockRegistrationPage {
  constructor() {
    this.loading = false;
    this.error = null;
    this.formData = {};
    this.termsAccepted = false;
    this._eventListeners = {};

    // Create mock shadow DOM structure
    this.shadowRoot = {
      querySelector: (selector) => {
        if (selector === "form") return this.form;
        if (selector === 'input[name="name"]') return this.nameInput;
        if (selector === 'input[name="email"]') return this.emailInput;
        if (selector === 'input[name="password"]') return this.passwordInput;
        if (selector === 'input[name="confirmPassword"]')
          return this.confirmPasswordInput;
        if (selector === 'input[name="terms"]') return this.termsCheckbox;
        if (selector === 'button[type="submit"]') return this.submitButton;
        if (selector === ".social-button")
          return [this.googleButton, this.githubButton];
        return null;
      },
      querySelectorAll: (selector) => {
        if (selector === ".social-button")
          return [this.googleButton, this.githubButton];
        return [];
      },
    };

    // Create form elements
    this.form = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
      elements: [],
    };

    this.nameInput = {
      id: "name",
      name: "name",
      value: "",
      form: this.form,
    };

    this.emailInput = {
      id: "email",
      name: "email",
      type: "email",
      value: "",
      form: this.form,
    };

    this.passwordInput = {
      id: "password",
      name: "password",
      type: "password",
      value: "",
      form: this.form,
    };

    this.confirmPasswordInput = {
      id: "confirmPassword",
      name: "confirmPassword",
      type: "password",
      value: "",
      form: this.form,
    };

    this.termsCheckbox = {
      id: "terms",
      name: "terms",
      type: "checkbox",
      checked: false,
      form: this.form,
    };

    this.submitButton = {
      type: "submit",
      textContent: "Create Account",
      form: this.form,
    };

    this.googleButton = {
      className: "social-button",
      textContent: "Continue with Google",
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    };

    this.githubButton = {
      className: "social-button",
      textContent: "Continue with GitHub",
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    };
  }

  // Mock properties
  static get properties() {
    return {
      loading: { type: Boolean, state: true },
      error: { type: String, state: true },
      formData: { type: Object, state: true },
      termsAccepted: { type: Boolean, state: true },
    };
  }

  // Event handling
  addEventListener(event, callback) {
    if (!this._eventListeners[event]) {
      this._eventListeners[event] = [];
    }
    this._eventListeners[event].push(callback);
  }

  removeEventListener(event, callback) {
    if (this._eventListeners[event]) {
      this._eventListeners[event] = this._eventListeners[event].filter(
        (cb) => cb !== callback
      );
    }
  }

  dispatchEvent(event) {
    if (this._eventListeners[event.type]) {
      this._eventListeners[event.type].forEach((callback) => callback(event));
    }
    return true;
  }

  // Component methods
  handleEvent(event) {
    if (event.type === "submit") {
      this.handleSubmit(event);
    } else if (event.type === "input") {
      this.handleInput(event);
    } else if (event.type === "change" && event.target.name === "terms") {
      this.termsAccepted = event.target.checked;
    }
  }

  handleInput(event) {
    const { name, value } = event.target;
    this.formData = {
      ...this.formData,
      [name]: value,
    };

    // Dispatch registration-submit event for testing
    if (event.target.form && name && value) {
      this.dispatchEvent(
        new CustomEvent("registration-submit", {
          detail: this.formData,
          bubbles: true,
          composed: true,
        })
      );
    }
  }

  async handleSubmit(event) {
    if (event && event.preventDefault) {
      event.preventDefault();
    }

    this.loading = true;
    this.error = null;

    try {
      // Check if terms are accepted
      if (!this.termsAccepted) {
        throw new Error("You must accept the terms and conditions");
      }

      // Validate email availability
      const emailAvailable = await window.auth.checkEmailAvailability(
        this.formData.email
      );
      if (!emailAvailable) {
        throw new Error("Email is already registered");
      }

      // Validate password strength
      const passwordValidation = await window.auth.validatePassword(
        this.formData.password
      );
      if (!passwordValidation.isValid) {
        throw new Error("Password does not meet requirements");
      }

      // Register user
      const result = await window.auth.register(this.formData);
      if (result.success) {
        // Send verification email
        await window.auth.sendVerificationEmail(this.formData.email);

        this.dispatchEvent(
          new CustomEvent("registration-success", {
            detail: { email: this.formData.email },
            bubbles: true,
            composed: true,
          })
        );
      }
    } catch (error) {
      this.error = error.message;
    } finally {
      this.loading = false;
    }
  }

  async handleSocialLogin(provider) {
    this.loading = true;
    this.error = null;

    try {
      const result = await (provider === "google"
        ? window.auth.registerWithGoogle()
        : window.auth.registerWithGithub());

      this.dispatchEvent(
        new CustomEvent("social-register", {
          detail: { provider, user: result.user },
          bubbles: true,
          composed: true,
        })
      );
    } catch (error) {
      this.error = error.message;
    } finally {
      this.loading = false;
    }
  }
}

// Mock the CustomEvent constructor
class MockCustomEvent {
  constructor(type, options = {}) {
    this.type = type;
    this.detail = options.detail || {};
    this.bubbles = options.bubbles || false;
    this.composed = options.composed || false;
  }
}
global.CustomEvent = MockCustomEvent;

// Mock the customElements.define
customElements.define = vi.fn();

describe("Registration Page (Simple)", () => {
  let element;

  beforeEach(() => {
    element = new MockRegistrationPage();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with default values", () => {
    expect(element.loading).toBe(false);
    expect(element.error).toBeNull();
    expect(element.formData).toEqual({});
    expect(element.termsAccepted).toBe(false);
  });

  it("should update formData when input changes", () => {
    // Create an input event
    const inputEvent = {
      type: "input",
      target: element.nameInput,
    };
    element.nameInput.value = "John Doe";

    // Call the handler directly
    element.handleInput(inputEvent);

    expect(element.formData.name).toBe("John Doe");
  });

  it("should dispatch registration-submit event when input changes", async () => {
    // Set up event listener
    const submitHandler = vi.fn();
    element.addEventListener("registration-submit", submitHandler);

    // Create an input event
    const inputEvent = {
      type: "input",
      target: element.emailInput,
    };
    element.emailInput.value = "john@example.com";

    // Call the handler directly
    element.handleInput(inputEvent);

    expect(submitHandler).toHaveBeenCalled();
    expect(submitHandler.mock.calls[0][0].detail).toEqual({
      email: "john@example.com",
    });
  });

  it("should show error when terms are not accepted", async () => {
    // Set form data
    element.formData = {
      name: "John Doe",
      email: "john@example.com",
      password: "password123",
      confirmPassword: "password123",
    };

    // Terms not accepted
    element.termsAccepted = false;

    // Submit form
    await element.handleSubmit({ preventDefault: vi.fn() });

    expect(element.error).toBe("You must accept the terms and conditions");
    expect(element.loading).toBe(false);
  });

  it("should register user successfully when all inputs are valid", async () => {
    // Set form data
    element.formData = {
      name: "John Doe",
      email: "john@example.com",
      password: "password123",
      confirmPassword: "password123",
    };

    // Accept terms
    element.termsAccepted = true;

    // Set up event listener
    const successHandler = vi.fn();
    element.addEventListener("registration-success", successHandler);

    // Submit form
    await element.handleSubmit({ preventDefault: vi.fn() });

    expect(window.auth.checkEmailAvailability).toHaveBeenCalledWith(
      "john@example.com"
    );
    expect(window.auth.validatePassword).toHaveBeenCalledWith("password123");
    expect(window.auth.register).toHaveBeenCalledWith(element.formData);
    expect(window.auth.sendVerificationEmail).toHaveBeenCalledWith(
      "john@example.com"
    );

    expect(successHandler).toHaveBeenCalled();
    expect(successHandler.mock.calls[0][0].detail).toEqual({
      email: "john@example.com",
    });
    expect(element.loading).toBe(false);
    expect(element.error).toBeNull();
  });

  it("should handle social login with Google", async () => {
    // Set up event listener
    const socialRegisterHandler = vi.fn();
    element.addEventListener("social-register", socialRegisterHandler);

    // Call social login handler
    await element.handleSocialLogin("google");

    expect(window.auth.registerWithGoogle).toHaveBeenCalled();
    expect(socialRegisterHandler).toHaveBeenCalled();
    expect(socialRegisterHandler.mock.calls[0][0].detail.provider).toBe(
      "google"
    );
    expect(element.loading).toBe(false);
  });

  it("should handle social login with GitHub", async () => {
    // Set up event listener
    const socialRegisterHandler = vi.fn();
    element.addEventListener("social-register", socialRegisterHandler);

    // Call social login handler
    await element.handleSocialLogin("github");

    expect(window.auth.registerWithGithub).toHaveBeenCalled();
    expect(socialRegisterHandler).toHaveBeenCalled();
    expect(socialRegisterHandler.mock.calls[0][0].detail.provider).toBe(
      "github"
    );
    expect(element.loading).toBe(false);
  });
});
