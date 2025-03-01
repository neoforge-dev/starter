import { fixture, expect, oneEvent, TestUtils } from "../setup.mjs";
import {  html  } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";
import "../../pages/login-page.js";
import { LoginPage } from "../../pages/login-page.js";
import { ComponentTester } from "../setup.mjs";

describe("Login Page", () => {
  let element;
  const mockUser = {
    email: "test@example.com",
    name: "Test User",
    avatar: "avatar.jpg",
  };

  beforeEach(async () => {
    // Mock auth service
    window.auth = {
      login: vi.fn().mockResolvedValue({ success: true }),
      resetPassword: vi.fn().mockResolvedValue({ success: true }),
      validateEmail: vi.fn().mockResolvedValue({ isValid: true }),
    };

    element = await fixture(html`<login-page></login-page>`);
    await TestUtils.waitForComponentToLoad(element);
  });

  it("renders login form", async () => {
    const form = await TestUtils.waitForComponent(element, ".login-form");
    expect(form).to.exist;

    const emailInput = await TestUtils.waitForComponent(element, "#email");
    const passwordInput = await TestUtils.waitForComponent(
      element,
      "#password"
    );
    const submitButton = await TestUtils.waitForComponent(
      element,
      "button[type='submit']"
    );

    expect(emailInput).to.exist;
    expect(passwordInput).to.exist;
    expect(submitButton).to.exist;
    expect(submitButton.textContent.trim()).to.equal("Login");
  });

  it("validates required fields", async () => {
    const submitButton = await TestUtils.waitForComponent(
      element,
      "button[type='submit']"
    );
    await TestUtils.dispatchEvent(submitButton, "click");

    const emailError = await TestUtils.waitForComponent(
      element,
      ".email-error"
    );
    const passwordError = await TestUtils.waitForComponent(
      element,
      ".password-error"
    );

    expect(emailError).to.exist;
    expect(passwordError).to.exist;
    expect(emailError.textContent).to.include("required");
    expect(passwordError.textContent).to.include("required");
  });

  it("validates email format", async () => {
    const emailInput = await TestUtils.waitForComponent(element, "#email");
    await ComponentTester.type(emailInput, "invalid-email");

    const submitButton = await TestUtils.waitForComponent(
      element,
      "button[type='submit']"
    );
    await TestUtils.dispatchEvent(submitButton, "click");

    const emailError = await TestUtils.waitForComponent(
      element,
      ".email-error"
    );
    expect(emailError).to.exist;
    expect(emailError.textContent).to.include("valid email");
  });

  it("handles successful login", async () => {
    const emailInput = await TestUtils.waitForComponent(element, "#email");
    const passwordInput = await TestUtils.waitForComponent(
      element,
      "#password"
    );
    const form = await TestUtils.waitForComponent(element, ".login-form");

    await ComponentTester.type(emailInput, "test@example.com");
    await ComponentTester.type(passwordInput, "password123");

    const submitPromise = oneEvent(element, "login-success");
    await TestUtils.dispatchEvent(form, "submit");
    const { detail } = await submitPromise;

    expect(detail).to.exist;
    expect(window.auth.login).to.have.been.calledWith({
      email: "test@example.com",
      password: "password123",
    });
  });

  it("handles login error", async () => {
    window.auth.login.mockRejectedValueOnce(new Error("Invalid credentials"));

    const emailInput = await TestUtils.waitForComponent(element, "#email");
    const passwordInput = await TestUtils.waitForComponent(
      element,
      "#password"
    );
    const form = await TestUtils.waitForComponent(element, ".login-form");

    await ComponentTester.type(emailInput, "test@example.com");
    await ComponentTester.type(passwordInput, "wrong-password");

    await TestUtils.dispatchEvent(form, "submit");

    const errorMessage = await TestUtils.waitForComponent(
      element,
      ".error-message"
    );
    expect(errorMessage).to.exist;
    expect(errorMessage.textContent).to.include("Invalid credentials");
  });

  it("shows forgot password form", async () => {
    const forgotPasswordLink = await TestUtils.waitForComponent(
      element,
      ".forgot-password"
    );
    await TestUtils.dispatchEvent(forgotPasswordLink, "click");

    const resetForm = await TestUtils.waitForComponent(element, ".reset-form");
    expect(resetForm).to.exist;
  });

  it("handles password reset request", async () => {
    const forgotPasswordLink = await TestUtils.waitForComponent(
      element,
      ".forgot-password"
    );
    await TestUtils.dispatchEvent(forgotPasswordLink, "click");

    const emailInput = await TestUtils.waitForComponent(
      element,
      "#reset-email"
    );
    const resetForm = await TestUtils.waitForComponent(element, ".reset-form");

    await ComponentTester.type(emailInput, "test@example.com");

    const resetPromise = oneEvent(element, "reset-requested");
    await TestUtils.dispatchEvent(resetForm, "submit");
    const { detail } = await resetPromise;

    expect(detail).to.exist;
    expect(window.auth.resetPassword).to.have.been.calledWith(
      "test@example.com"
    );
  });

  it("toggles password visibility", async () => {
    const toggleButton = await TestUtils.waitForComponent(
      element,
      ".toggle-password"
    );
    const passwordInput = await TestUtils.waitForComponent(
      element,
      "#password"
    );

    expect(passwordInput.type).to.equal("password");

    await TestUtils.dispatchEvent(toggleButton, "click");
    expect(passwordInput.type).to.equal("text");

    await TestUtils.dispatchEvent(toggleButton, "click");
    expect(passwordInput.type).to.equal("password");
  });

  it("handles loading state", async () => {
    element.loading = true;
    await TestUtils.waitForComponentToLoad(element);

    const loadingSpinner = await TestUtils.waitForComponent(
      element,
      ".loading-spinner"
    );
    expect(loadingSpinner).to.exist;
    expect(loadingSpinner).to.be.visible;
  });

  it("shows password requirements", async () => {
    const passwordInput = await TestUtils.waitForComponent(
      element,
      'input[type="password"]'
    );
    const requirementsTooltip = await TestUtils.waitForComponent(
      element,
      ".password-requirements"
    );

    await TestUtils.dispatchEvent(passwordInput, "focus");
    expect(requirementsTooltip).to.be.visible;

    await TestUtils.dispatchEvent(passwordInput, "blur");
    expect(requirementsTooltip).to.not.be.visible;
  });

  it("shows loading state during authentication", async () => {
    const form = await TestUtils.waitForComponent(element, ".login-form");
    const loadingSpinner = await TestUtils.waitForComponent(
      element,
      ".loading-spinner"
    );

    element.loading = true;
    await TestUtils.waitForComponentToLoad(element);

    expect(form).to.not.be.visible;
    expect(loadingSpinner).to.be.visible;

    element.loading = false;
    await TestUtils.waitForComponentToLoad(element);

    expect(form).to.be.visible;
    expect(loadingSpinner).to.not.be.visible;
  });

  it("displays error messages", async () => {
    const errorContainer = await TestUtils.waitForComponent(
      element,
      ".error-container"
    );

    element.error = "Invalid credentials";
    await TestUtils.waitForComponentToLoad(element);

    expect(errorContainer).to.be.visible;
    expect(errorContainer.textContent).to.include("Invalid credentials");

    element.error = null;
    await TestUtils.waitForComponentToLoad(element);

    expect(errorContainer).to.not.be.visible;
  });

  it("supports mobile responsive layout", async () => {
    // Mock mobile viewport
    window.matchMedia = (query) => ({
      matches: query.includes("max-width"),
      addListener: () => {},
      removeListener: () => {},
    });

    await TestUtils.waitForComponentToLoad(element);

    const container = await TestUtils.waitForComponent(
      element,
      ".page-container"
    );
    expect(container.classList.contains("mobile")).to.be.true;
  });

  it("maintains accessibility attributes", async () => {
    const form = await TestUtils.waitForComponent(element, "form");
    expect(form.getAttribute("role")).to.equal("form");
  });

  it("supports keyboard navigation", async () => {
    const form = await TestUtils.waitForComponent(element, ".login-form");
    const inputs = form.querySelectorAll("input, button");
    const firstInput = inputs[0];

    firstInput.focus();
    firstInput.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab" }));
    await TestUtils.waitForComponentToLoad(element);

    expect(document.activeElement).to.equal(inputs[1]);
  });

  it("remembers user preferences", async () => {
    const rememberMe = await TestUtils.waitForComponent(
      element,
      ".remember-me"
    );
    rememberMe.click();
    await TestUtils.waitForComponentToLoad(element);

    expect(element.rememberUser).to.be.true;
    expect(localStorage.getItem("remember_user")).to.equal("true");
  });

  it("validates password strength", async () => {
    const passwordInput = await TestUtils.waitForComponent(
      element,
      'input[type="password"]'
    );
    const strengthIndicator = await TestUtils.waitForComponent(
      element,
      ".password-strength"
    );

    // Test weak password
    await ComponentTester.type(passwordInput, "weak");
    await TestUtils.waitForComponentToLoad(element);

    expect(strengthIndicator.classList.contains("weak")).to.be.true;

    // Test strong password
    await ComponentTester.type(passwordInput, "StrongPass123!");
    await TestUtils.waitForComponentToLoad(element);

    expect(strengthIndicator.classList.contains("strong")).to.be.true;
  });

  it("handles authentication token validation", async () => {
    const token = "valid-token";
    element.token = token;
    await TestUtils.waitForComponentToLoad(element);

    expect(element.isValidToken).to.be.true;
    expect(element.shadowRoot.querySelector(".token-validation-message")).to
      .exist;
  });

  it("supports remember me functionality", async () => {
    const form = await TestUtils.waitForComponent(element, ".login-form");
    const emailInput = form.querySelector('input[type="email"]');
    const rememberMe = form.querySelector(".remember-me");

    await ComponentTester.type(emailInput, "test@example.com");
    rememberMe.click();
    await TestUtils.dispatchEvent(form, "submit");

    await TestUtils.waitForComponentToLoad(element);

    expect(localStorage.getItem("remembered_email")).to.equal(
      "test@example.com"
    );
  });

  it("handles session timeout", async () => {
    const timeoutMessage = "Your session has expired";
    element.sessionTimeout = true;
    element.timeoutMessage = timeoutMessage;
    await TestUtils.waitForComponentToLoad(element);

    const message = element.shadowRoot.querySelector(".timeout-message");
    expect(message).to.exist;
    expect(message.textContent).to.include(timeoutMessage);
  });
});
