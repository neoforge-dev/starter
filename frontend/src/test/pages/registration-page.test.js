import { expect, vi, describe, it, beforeEach, afterEach } from "vitest";
import {
  createComponent,
  removeComponent,
  waitForUpdate,
  findInShadow,
  findAllInShadow,
  setInputValue,
  click,
  waitForEvent,
  fillForm,
  submitForm,
} from "../helpers/component-test-helper.js";
import "../../pages/registration-page.js";

// Mock the API service
const mockApiService = {
  checkEmailAvailability: vi.fn(),
  register: vi.fn(),
};

// Mock the router
const mockRouter = {
  navigate: vi.fn(),
};

describe("Registration Page", () => {
  let element;

  beforeEach(async () => {
    // Reset mocks
    vi.resetAllMocks();

    // Setup default mock responses
    mockApiService.checkEmailAvailability.mockResolvedValue({
      available: true,
    });
    mockApiService.register.mockResolvedValue({ success: true });

    // Attach mocks to window
    window.apiService = mockApiService;
    window.router = mockRouter;

    // Create component
    element = await createComponent("registration-page");

    // Wait for initial render
    await waitForUpdate(element);
  });

  afterEach(() => {
    // Clean up
    removeComponent(element);

    // Clean up mocks
    delete window.apiService;
    delete window.router;
  });

  it("renders the registration form with all required fields", async () => {
    // Find the form
    const form = findInShadow(element, "form");
    expect(form).to.exist;

    // Check for required fields
    const nameInput = findInShadow(element, "input[name='name']");
    const emailInput = findInShadow(element, "input[name='email']");
    const passwordInput = findInShadow(element, "input[name='password']");
    const confirmPasswordInput = findInShadow(
      element,
      "input[name='confirmPassword']"
    );
    const termsCheckbox = findInShadow(element, "input[name='terms']");
    const submitButton = findInShadow(element, "button[type='submit']");

    expect(nameInput).to.exist;
    expect(emailInput).to.exist;
    expect(passwordInput).to.exist;
    expect(confirmPasswordInput).to.exist;
    expect(termsCheckbox).to.exist;
    expect(submitButton).to.exist;
  });

  it("validates form inputs and shows error messages", async () => {
    // Find the form
    const form = findInShadow(element, "form");

    // Submit empty form
    submitForm(form);
    await waitForUpdate(element);

    // Check for error messages
    const errorMessages = findAllInShadow(element, ".error-message");
    expect(errorMessages.length).to.be.greaterThan(0);
  });

  it("validates matching passwords", async () => {
    // Find the form
    const form = findInShadow(element, "form");

    // Fill form with non-matching passwords
    fillForm(form, {
      name: "Test User",
      email: "test@example.com",
      password: "password123",
      confirmPassword: "password456",
      terms: true,
    });

    // Submit form
    submitForm(form);
    await waitForUpdate(element);

    // Check for password match error
    const passwordError = findInShadow(element, ".password-match-error");
    expect(passwordError).to.exist;
  });

  it("checks email availability", async () => {
    // Mock email check to return not available
    mockApiService.checkEmailAvailability.mockResolvedValue({
      available: false,
    });

    // Find email input
    const emailInput = findInShadow(element, "input[name='email']");

    // Set email value
    setInputValue(emailInput, "taken@example.com");

    // Trigger blur event
    emailInput.dispatchEvent(new Event("blur"));

    // Wait for API call
    await waitForUpdate(element);

    // Check that API was called
    expect(mockApiService.checkEmailAvailability).toHaveBeenCalledWith(
      "taken@example.com"
    );

    // Check for email availability error
    const emailError = findInShadow(element, ".email-error");
    expect(emailError).to.exist;
  });

  it("submits the form with valid data", async () => {
    // Find the form
    const form = findInShadow(element, "form");

    // Fill form with valid data
    fillForm(form, {
      name: "Test User",
      email: "test@example.com",
      password: "password123",
      confirmPassword: "password123",
      terms: true,
    });

    // Submit form
    submitForm(form);
    await waitForUpdate(element);

    // Check that API was called with correct data
    expect(mockApiService.register).toHaveBeenCalledWith({
      name: "Test User",
      email: "test@example.com",
      password: "password123",
    });

    // Check that router navigates to dashboard
    expect(mockRouter.navigate).toHaveBeenCalledWith("/dashboard");
  });
});
