import { fixture, expect, oneEvent } from "@open-wc/testing";
import { html } from "lit";
import "../../pages/login-page.js";

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
      login: async (email, password) => ({
        user: mockUser,
        token: "test-token",
      }),
      loginWithGoogle: async () => ({ user: mockUser, token: "google-token" }),
      loginWithGithub: async () => ({ user: mockUser, token: "github-token" }),
      resetPassword: async (email) => ({ success: true }),
      validateToken: async (token) => ({ valid: true }),
      isAuthenticated: false,
    };

    element = await fixture(html`<login-page></login-page>`);
    await element.updateComplete;
  });

  it("renders login form", () => {
    const form = element.shadowRoot.querySelector(".login-form");
    const emailInput = form.querySelector('input[type="email"]');
    const passwordInput = form.querySelector('input[type="password"]');
    const submitButton = form.querySelector('button[type="submit"]');

    expect(form).to.exist;
    expect(emailInput).to.exist;
    expect(passwordInput).to.exist;
    expect(submitButton).to.exist;
  });

  it("handles form submission", async () => {
    const form = element.shadowRoot.querySelector(".login-form");
    const emailInput = form.querySelector('input[type="email"]');
    const passwordInput = form.querySelector('input[type="password"]');

    emailInput.value = "test@example.com";
    passwordInput.value = "password123";

    setTimeout(() => form.submit());
    const { detail } = await oneEvent(element, "login-submit");

    expect(detail.email).to.equal("test@example.com");
    expect(detail.password).to.equal("password123");
  });

  it("validates form inputs", async () => {
    const form = element.shadowRoot.querySelector(".login-form");
    const submitButton = form.querySelector('button[type="submit"]');

    submitButton.click();
    await element.updateComplete;

    const errorMessages = form.querySelectorAll(".error-message");
    expect(errorMessages.length).to.be.greaterThan(0);
  });

  it("shows password requirements", async () => {
    const passwordInput = element.shadowRoot.querySelector(
      'input[type="password"]'
    );
    const requirements = element.shadowRoot.querySelector(
      ".password-requirements"
    );

    passwordInput.focus();
    await element.updateComplete;

    expect(requirements).to.exist;
    expect(requirements.classList.contains("visible")).to.be.true;
  });

  it("toggles password visibility", async () => {
    const passwordInput = element.shadowRoot.querySelector(
      'input[type="password"]'
    );
    const toggleButton = element.shadowRoot.querySelector(".toggle-password");

    toggleButton.click();
    await element.updateComplete;

    expect(passwordInput.type).to.equal("text");

    toggleButton.click();
    await element.updateComplete;

    expect(passwordInput.type).to.equal("password");
  });

  it("handles social login buttons", async () => {
    const googleButton = element.shadowRoot.querySelector(".google-login");
    const githubButton = element.shadowRoot.querySelector(".github-login");

    setTimeout(() => googleButton.click());
    const googleEvent = await oneEvent(element, "social-login");
    expect(googleEvent.detail.provider).to.equal("google");

    setTimeout(() => githubButton.click());
    const githubEvent = await oneEvent(element, "social-login");
    expect(githubEvent.detail.provider).to.equal("github");
  });

  it("shows forgot password form", async () => {
    const forgotLink = element.shadowRoot.querySelector(
      ".forgot-password-link"
    );

    forgotLink.click();
    await element.updateComplete;

    const forgotForm = element.shadowRoot.querySelector(
      ".forgot-password-form"
    );
    expect(forgotForm).to.exist;
    expect(forgotForm.classList.contains("visible")).to.be.true;
  });

  it("handles password reset request", async () => {
    const forgotLink = element.shadowRoot.querySelector(
      ".forgot-password-link"
    );
    forgotLink.click();
    await element.updateComplete;

    const forgotForm = element.shadowRoot.querySelector(
      ".forgot-password-form"
    );
    const emailInput = forgotForm.querySelector('input[type="email"]');

    emailInput.value = "test@example.com";
    setTimeout(() => forgotForm.submit());
    const { detail } = await oneEvent(element, "reset-password");

    expect(detail.email).to.equal("test@example.com");
  });

  it("shows loading state during authentication", async () => {
    element.loading = true;
    await element.updateComplete;

    const loader = element.shadowRoot.querySelector(".loading-indicator");
    const submitButton = element.shadowRoot.querySelector(
      'button[type="submit"]'
    );

    expect(loader).to.exist;
    expect(loader.hasAttribute("hidden")).to.be.false;
    expect(submitButton.disabled).to.be.true;
  });

  it("displays error messages", async () => {
    const error = "Invalid credentials";
    element.error = error;
    await element.updateComplete;

    const errorMessage = element.shadowRoot.querySelector(".error-message");
    expect(errorMessage).to.exist;
    expect(errorMessage.textContent).to.include(error);
  });

  it("supports mobile responsive layout", async () => {
    // Mock mobile viewport
    window.matchMedia = (query) => ({
      matches: query.includes("max-width"),
      addListener: () => {},
      removeListener: () => {},
    });

    await element.updateComplete;

    const container = element.shadowRoot.querySelector(".page-container");
    expect(container.classList.contains("mobile")).to.be.true;
  });

  it("maintains accessibility attributes", () => {
    const form = element.shadowRoot.querySelector("form");
    expect(form.getAttribute("role")).to.equal("form");

    const inputs = form.querySelectorAll("input");
    inputs.forEach((input) => {
      expect(input.getAttribute("aria-label")).to.exist;
    });

    const submitButton = form.querySelector('button[type="submit"]');
    expect(submitButton.getAttribute("aria-label")).to.exist;
  });

  it("supports keyboard navigation", async () => {
    const form = element.shadowRoot.querySelector(".login-form");
    const inputs = form.querySelectorAll("input, button");
    const firstInput = inputs[0];

    firstInput.focus();
    firstInput.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab" }));
    await element.updateComplete;

    expect(document.activeElement).to.equal(inputs[1]);
  });

  it("remembers user preferences", async () => {
    const rememberMe = element.shadowRoot.querySelector(".remember-me");
    rememberMe.click();
    await element.updateComplete;

    expect(element.rememberUser).to.be.true;
    expect(localStorage.getItem("remember_user")).to.equal("true");
  });

  it("validates password strength", async () => {
    const passwordInput = element.shadowRoot.querySelector(
      'input[type="password"]'
    );
    const strengthIndicator =
      element.shadowRoot.querySelector(".password-strength");

    // Test weak password
    passwordInput.value = "weak";
    passwordInput.dispatchEvent(new Event("input"));
    await element.updateComplete;

    expect(strengthIndicator.classList.contains("weak")).to.be.true;

    // Test strong password
    passwordInput.value = "StrongPass123!";
    passwordInput.dispatchEvent(new Event("input"));
    await element.updateComplete;

    expect(strengthIndicator.classList.contains("strong")).to.be.true;
  });

  it("handles authentication token validation", async () => {
    const token = "valid-token";
    element.token = token;
    await element.updateComplete;

    expect(element.isValidToken).to.be.true;
    expect(element.shadowRoot.querySelector(".token-validation-message")).to
      .exist;
  });

  it("supports remember me functionality", async () => {
    const form = element.shadowRoot.querySelector(".login-form");
    const emailInput = form.querySelector('input[type="email"]');
    const rememberMe = form.querySelector(".remember-me");

    emailInput.value = "test@example.com";
    rememberMe.click();
    form.submit();

    await element.updateComplete;

    expect(localStorage.getItem("remembered_email")).to.equal(
      "test@example.com"
    );
  });

  it("handles session timeout", async () => {
    const timeoutMessage = "Your session has expired";
    element.sessionTimeout = true;
    element.timeoutMessage = timeoutMessage;
    await element.updateComplete;

    const message = element.shadowRoot.querySelector(".timeout-message");
    expect(message).to.exist;
    expect(message.textContent).to.include(timeoutMessage);
  });
});
