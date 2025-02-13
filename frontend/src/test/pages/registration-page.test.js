import { fixture, expect, oneEvent } from "@open-wc/testing";
import { html } from "lit";
import "../../pages/registration-page.js";

describe("Registration Page", () => {
  let element;
  const mockUser = {
    email: "test@example.com",
    name: "Test User",
    avatar: "avatar.jpg",
  };

  beforeEach(async () => {
    // Mock auth service
    window.auth = {
      register: async (data) => ({ user: mockUser, token: "test-token" }),
      registerWithGoogle: async () => ({
        user: mockUser,
        token: "google-token",
      }),
      registerWithGithub: async () => ({
        user: mockUser,
        token: "github-token",
      }),
      validateEmail: async (email) => ({ available: true }),
      sendVerification: async (email) => ({ success: true }),
      isAuthenticated: false,
    };

    element = await fixture(html`<registration-page></registration-page>`);
    await element.updateComplete;
  });

  it("renders registration form", () => {
    const form = element.shadowRoot.querySelector(".registration-form");
    const nameInput = form.querySelector('input[name="name"]');
    const emailInput = form.querySelector('input[type="email"]');
    const passwordInput = form.querySelector('input[type="password"]');
    const confirmPasswordInput = form.querySelector(
      'input[name="confirmPassword"]'
    );
    const submitButton = form.querySelector('button[type="submit"]');

    expect(form).to.exist;
    expect(nameInput).to.exist;
    expect(emailInput).to.exist;
    expect(passwordInput).to.exist;
    expect(confirmPasswordInput).to.exist;
    expect(submitButton).to.exist;
  });

  it("handles form submission", async () => {
    const form = element.shadowRoot.querySelector(".registration-form");
    const nameInput = form.querySelector('input[name="name"]');
    const emailInput = form.querySelector('input[type="email"]');
    const passwordInput = form.querySelector('input[type="password"]');
    const confirmPasswordInput = form.querySelector(
      'input[name="confirmPassword"]'
    );

    nameInput.value = "Test User";
    emailInput.value = "test@example.com";
    passwordInput.value = "Password123!";
    confirmPasswordInput.value = "Password123!";

    setTimeout(() => form.submit());
    const { detail } = await oneEvent(element, "registration-submit");

    expect(detail.name).to.equal("Test User");
    expect(detail.email).to.equal("test@example.com");
    expect(detail.password).to.equal("Password123!");
  });

  it("validates form inputs", async () => {
    const form = element.shadowRoot.querySelector(".registration-form");
    const submitButton = form.querySelector('button[type="submit"]');

    submitButton.click();
    await element.updateComplete;

    const errorMessages = form.querySelectorAll(".error-message");
    expect(errorMessages.length).to.be.greaterThan(0);
  });

  it("checks password match", async () => {
    const form = element.shadowRoot.querySelector(".registration-form");
    const passwordInput = form.querySelector('input[type="password"]');
    const confirmPasswordInput = form.querySelector(
      'input[name="confirmPassword"]'
    );

    passwordInput.value = "Password123!";
    confirmPasswordInput.value = "DifferentPass123!";
    confirmPasswordInput.dispatchEvent(new Event("input"));
    await element.updateComplete;

    const errorMessage = form.querySelector(".password-match-error");
    expect(errorMessage).to.exist;
    expect(errorMessage.textContent).to.include("passwords do not match");
  });

  it("validates email availability", async () => {
    const emailInput = element.shadowRoot.querySelector('input[type="email"]');

    // Mock unavailable email
    window.auth.validateEmail = async () => ({ available: false });

    emailInput.value = "taken@example.com";
    emailInput.dispatchEvent(new Event("blur"));
    await element.updateComplete;

    const errorMessage = element.shadowRoot.querySelector(".email-error");
    expect(errorMessage).to.exist;
    expect(errorMessage.textContent).to.include("already registered");
  });

  it("handles social registration buttons", async () => {
    const googleButton = element.shadowRoot.querySelector(".google-register");
    const githubButton = element.shadowRoot.querySelector(".github-register");

    setTimeout(() => googleButton.click());
    const googleEvent = await oneEvent(element, "social-register");
    expect(googleEvent.detail.provider).to.equal("google");

    setTimeout(() => githubButton.click());
    const githubEvent = await oneEvent(element, "social-register");
    expect(githubEvent.detail.provider).to.equal("github");
  });

  it("shows terms and conditions modal", async () => {
    const termsLink = element.shadowRoot.querySelector(".terms-link");

    setTimeout(() => termsLink.click());
    const { detail } = await oneEvent(element, "show-modal");

    expect(detail.type).to.equal("terms-modal");
  });

  it("handles terms acceptance", async () => {
    const termsCheckbox = element.shadowRoot.querySelector(".terms-checkbox");
    const submitButton = element.shadowRoot.querySelector(
      'button[type="submit"]'
    );

    expect(submitButton.disabled).to.be.true;

    termsCheckbox.click();
    await element.updateComplete;

    expect(submitButton.disabled).to.be.false;
  });

  it("shows loading state during registration", async () => {
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
    const error = "Registration failed";
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
    const form = element.shadowRoot.querySelector(".registration-form");
    const inputs = form.querySelectorAll("input, button");
    const firstInput = inputs[0];

    firstInput.focus();
    firstInput.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab" }));
    await element.updateComplete;

    expect(document.activeElement).to.equal(inputs[1]);
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

  it("handles email verification", async () => {
    const form = element.shadowRoot.querySelector(".registration-form");
    const emailInput = form.querySelector('input[type="email"]');

    emailInput.value = "test@example.com";
    form.submit();
    await element.updateComplete;

    const verificationMessage = element.shadowRoot.querySelector(
      ".verification-message"
    );
    expect(verificationMessage).to.exist;
    expect(verificationMessage.textContent).to.include("verification email");
  });

  it("supports password requirements tooltip", async () => {
    const passwordInput = element.shadowRoot.querySelector(
      'input[type="password"]'
    );
    const requirements = element.shadowRoot.querySelector(
      ".password-requirements"
    );

    passwordInput.focus();
    await element.updateComplete;

    expect(requirements.classList.contains("visible")).to.be.true;

    const requirementItems = requirements.querySelectorAll(".requirement-item");
    expect(requirementItems.length).to.be.greaterThan(0);
  });

  it("handles form validation in real-time", async () => {
    const form = element.shadowRoot.querySelector(".registration-form");
    const nameInput = form.querySelector('input[name="name"]');

    // Test invalid name
    nameInput.value = "a";
    nameInput.dispatchEvent(new Event("input"));
    await element.updateComplete;

    let errorMessage = form.querySelector(".name-error");
    expect(errorMessage).to.exist;
    expect(errorMessage.textContent).to.include("at least");

    // Test valid name
    nameInput.value = "Valid Name";
    nameInput.dispatchEvent(new Event("input"));
    await element.updateComplete;

    errorMessage = form.querySelector(".name-error");
    expect(errorMessage).to.not.exist;
  });

  it("shows success message after registration", async () => {
    const form = element.shadowRoot.querySelector(".registration-form");
    const nameInput = form.querySelector('input[name="name"]');
    const emailInput = form.querySelector('input[type="email"]');
    const passwordInput = form.querySelector('input[type="password"]');
    const confirmPasswordInput = form.querySelector(
      'input[name="confirmPassword"]'
    );
    const termsCheckbox = form.querySelector(".terms-checkbox");

    nameInput.value = "Test User";
    emailInput.value = "test@example.com";
    passwordInput.value = "StrongPass123!";
    confirmPasswordInput.value = "StrongPass123!";
    termsCheckbox.click();

    form.submit();
    await element.updateComplete;

    const successMessage = element.shadowRoot.querySelector(".success-message");
    expect(successMessage).to.exist;
    expect(successMessage.textContent).to.include("successfully registered");
  });
});
