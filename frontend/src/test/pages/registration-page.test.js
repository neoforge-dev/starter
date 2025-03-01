import {
  html,
  expect,
  oneEvent,
  waitForComponentUpdate,
  waitForShadowDom,
  TestUtils,
} from "../setup.mjs";
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
      register: vi.fn().mockResolvedValue({ success: true }),
      checkEmailAvailability: vi.fn().mockResolvedValue(true),
      validatePassword: vi.fn().mockResolvedValue({ isValid: true, score: 4 }),
      sendVerificationEmail: vi.fn().mockResolvedValue({ success: true }),
      registerWithGoogle: vi.fn().mockResolvedValue({
        user: mockUser,
        token: "google-token",
      }),
      registerWithGithub: vi.fn().mockResolvedValue({
        user: mockUser,
        token: "github-token",
      }),
      validateEmail: vi.fn().mockResolvedValue({ available: true }),
      sendVerification: vi.fn().mockResolvedValue({ success: true }),
      isAuthenticated: false,
    };

    element = await TestUtils.fixture(
      html`<registration-page></registration-page>`
    );
    await TestUtils.waitForAll(element);
  });

  it("renders registration form", async () => {
    const form = await TestUtils.waitForComponent(
      element,
      ".registration-form"
    );
    const inputs = await TestUtils.queryAllComponents(element, "input");
    const submitButton = await TestUtils.queryComponent(
      element,
      "button[type='submit']"
    );

    expect(form).to.exist;
    expect(inputs.length).to.be.greaterThan(3);
    expect(submitButton).to.exist;
  });

  it("handles form submission", async () => {
    const form = await TestUtils.queryComponent(element, ".registration-form");
    const nameInput = form.querySelector("input[name='name']");
    const emailInput = form.querySelector("input[name='email']");
    const passwordInput = form.querySelector("input[name='password']");
    const confirmPasswordInput = form.querySelector(
      "input[name='confirmPassword']"
    );
    const submitButton = form.querySelector("button[type='submit']");

    nameInput.value = "John Doe";
    emailInput.value = "john@example.com";
    passwordInput.value = "Password123!";
    confirmPasswordInput.value = "Password123!";

    nameInput.dispatchEvent(new Event("input"));
    emailInput.dispatchEvent(new Event("input"));
    passwordInput.dispatchEvent(new Event("input"));
    confirmPasswordInput.dispatchEvent(new Event("input"));
    submitButton.click();

    const { detail } = await oneEvent(element, "registration-submit");
    expect(detail.name).to.equal("John Doe");
    expect(detail.email).to.equal("john@example.com");
  });

  it("validates form inputs", async () => {
    const form = await TestUtils.queryComponent(element, ".registration-form");
    const submitButton = form.querySelector("button[type='submit']");

    submitButton.click();
    await TestUtils.waitForComponent(element);

    const errors = await TestUtils.queryAllComponents(element, ".form-error");
    expect(errors.length).to.be.greaterThan(0);
  });

  it("checks password match", async () => {
    const form = await TestUtils.queryComponent(element, ".registration-form");
    const passwordInput = form.querySelector("input[name='password']");
    const confirmPasswordInput = form.querySelector(
      "input[name='confirmPassword']"
    );

    passwordInput.value = "Password123!";
    confirmPasswordInput.value = "DifferentPassword123!";

    passwordInput.dispatchEvent(new Event("input"));
    confirmPasswordInput.dispatchEvent(new Event("input"));

    const error = await TestUtils.queryComponent(
      element,
      ".password-match-error"
    );
    expect(error).to.exist;
    expect(error.textContent).to.include("match");
  });

  it("validates email availability", async () => {
    window.auth.checkEmailAvailability = vi.fn().mockResolvedValue(false);

    const form = await TestUtils.queryComponent(element, ".registration-form");
    const emailInput = form.querySelector("input[name='email']");

    emailInput.value = "taken@example.com";
    emailInput.dispatchEvent(new Event("input"));
    await TestUtils.waitForComponent(element);

    const error = await TestUtils.queryComponent(element, ".email-error");
    expect(error).to.exist;
    expect(error.textContent).to.include("already taken");
  });

  it("handles social registration buttons", async () => {
    const socialButtons = await TestUtils.queryAllComponents(
      element,
      ".social-button"
    );
    expect(socialButtons.length).to.be.greaterThan(0);

    const googleButton = Array.from(socialButtons).find((button) =>
      button.textContent.toLowerCase().includes("google")
    );
    googleButton.click();

    const { detail } = await oneEvent(element, "social-register");
    expect(detail.provider).to.equal("google");
  });

  it("shows terms and conditions modal", async () => {
    const termsLink = await TestUtils.queryComponent(element, ".terms-link");
    termsLink.click();
    await TestUtils.waitForComponent(element);

    const modal = await TestUtils.queryComponent(element, ".terms-modal");
    expect(modal).to.exist;
    expect(modal.classList.contains("open")).to.be.true;
  });

  it("handles terms acceptance", async () => {
    const form = await TestUtils.queryComponent(element, ".registration-form");
    const termsCheckbox = form.querySelector("input[name='terms']");
    const submitButton = form.querySelector("button[type='submit']");

    submitButton.click();
    await TestUtils.waitForComponent(element);

    const error = await TestUtils.queryComponent(element, ".terms-error");
    expect(error).to.exist;

    termsCheckbox.checked = true;
    termsCheckbox.dispatchEvent(new Event("change"));
    submitButton.click();

    const success = await TestUtils.queryComponent(element, ".success-message");
    expect(success).to.exist;
  });

  it("shows loading state during registration", async () => {
    window.auth.register = vi.fn().mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      return { success: true };
    });

    const form = await TestUtils.queryComponent(element, ".registration-form");
    const submitButton = form.querySelector("button[type='submit']");

    submitButton.click();
    const loading = await TestUtils.queryComponent(
      element,
      ".loading-indicator"
    );
    expect(loading).to.exist;

    await TestUtils.waitForComponent(element);
    expect(loading.classList.contains("hidden")).to.be.true;
  });

  it("displays error messages", async () => {
    window.auth.register = vi
      .fn()
      .mockRejectedValue(new Error("Registration failed"));

    const form = await TestUtils.queryComponent(element, ".registration-form");
    const submitButton = form.querySelector("button[type='submit']");

    submitButton.click();
    await TestUtils.waitForComponent(element);

    const error = await TestUtils.queryComponent(element, ".error-message");
    expect(error).to.exist;
    expect(error.textContent).to.include("Registration failed");
  });

  it("supports mobile responsive layout", async () => {
    // Mock mobile viewport
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query.includes("max-width: 768px"),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    await TestUtils.waitForComponent(element);

    const container = await TestUtils.queryComponent(
      element,
      ".page-container"
    );
    expect(container.classList.contains("mobile")).to.be.true;
  });

  it("maintains accessibility attributes", async () => {
    const form = await TestUtils.queryComponent(element, ".registration-form");
    const inputs = form.querySelectorAll("input");

    inputs.forEach((input) => {
      expect(input.getAttribute("aria-label")).to.exist;
      if (input.hasAttribute("aria-invalid")) {
        expect(input.getAttribute("aria-describedby")).to.exist;
      }
    });
  });

  it("supports keyboard navigation", async () => {
    const form = await TestUtils.queryComponent(element, ".registration-form");
    const inputs = form.querySelectorAll("input");
    const firstInput = inputs[0];
    const lastInput = inputs[inputs.length - 1];

    firstInput.focus();
    firstInput.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab" }));
    expect(document.activeElement).to.equal(inputs[1]);

    lastInput.focus();
    lastInput.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Tab", shiftKey: true })
    );
    expect(document.activeElement).to.equal(inputs[inputs.length - 2]);
  });

  it("validates password strength", async () => {
    const form = await TestUtils.queryComponent(element, ".registration-form");
    const passwordInput = form.querySelector("input[name='password']");

    passwordInput.value = "weak";
    passwordInput.dispatchEvent(new Event("input"));
    await TestUtils.waitForComponent(element);

    const strengthIndicator = await TestUtils.queryComponent(
      element,
      ".password-strength"
    );
    expect(strengthIndicator.textContent).to.include("weak");

    passwordInput.value = "StrongP@ssw0rd";
    passwordInput.dispatchEvent(new Event("input"));
    await TestUtils.waitForComponent(element);

    expect(strengthIndicator.textContent).to.include("strong");
  });

  it("handles email verification", async () => {
    const form = await TestUtils.queryComponent(element, ".registration-form");
    const emailInput = form.querySelector("input[name='email']");
    const verifyButton = form.querySelector(".verify-email");

    emailInput.value = "john@example.com";
    emailInput.dispatchEvent(new Event("input"));
    verifyButton.click();

    const { detail } = await oneEvent(element, "verify-email");
    expect(detail.email).to.equal("john@example.com");
  });

  it("supports password requirements tooltip", async () => {
    const form = await TestUtils.queryComponent(element, ".registration-form");
    const passwordInput = form.querySelector("input[name='password']");
    const requirementsButton = form.querySelector(".requirements-info");

    requirementsButton.click();
    await TestUtils.waitForComponent(element);

    const tooltip = await TestUtils.queryComponent(
      element,
      ".requirements-tooltip"
    );
    expect(tooltip).to.exist;
    expect(tooltip.textContent).to.include("uppercase");
    expect(tooltip.textContent).to.include("number");
  });

  it("handles form validation in real-time", async () => {
    const form = await TestUtils.queryComponent(element, ".registration-form");
    const emailInput = form.querySelector("input[name='email']");

    emailInput.value = "invalid-email";
    emailInput.dispatchEvent(new Event("input"));
    await TestUtils.waitForComponent(element);

    const error = await TestUtils.queryComponent(element, ".email-error");
    expect(error).to.exist;

    emailInput.value = "valid@example.com";
    emailInput.dispatchEvent(new Event("input"));
    await TestUtils.waitForComponent(element);

    expect(error.classList.contains("hidden")).to.be.true;
  });

  it("shows success message after registration", async () => {
    const form = await TestUtils.queryComponent(element, ".registration-form");
    const nameInput = form.querySelector("input[name='name']");
    const emailInput = form.querySelector("input[name='email']");
    const passwordInput = form.querySelector("input[name='password']");
    const confirmPasswordInput = form.querySelector(
      "input[name='confirmPassword']"
    );
    const termsCheckbox = form.querySelector("input[name='terms']");
    const submitButton = form.querySelector("button[type='submit']");

    nameInput.value = "John Doe";
    emailInput.value = "john@example.com";
    passwordInput.value = "StrongP@ssw0rd";
    confirmPasswordInput.value = "StrongP@ssw0rd";
    termsCheckbox.checked = true;

    nameInput.dispatchEvent(new Event("input"));
    emailInput.dispatchEvent(new Event("input"));
    passwordInput.dispatchEvent(new Event("input"));
    confirmPasswordInput.dispatchEvent(new Event("input"));
    termsCheckbox.dispatchEvent(new Event("change"));
    submitButton.click();

    await TestUtils.waitForComponent(element);

    const success = await TestUtils.queryComponent(element, ".success-message");
    expect(success).to.exist;
    expect(success.textContent).to.include("successfully registered");
  });
});
