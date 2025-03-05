import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { TestUtils } from "../setup.mjs";
import { waitForComponents } from "../setup.mjs";
import "../../../src/components/pages/profile-page.js";

describe("Profile Page", () => {
  let element;

  beforeEach(async () => {
    // Wait for components to be registered
    await waitForComponents();

    element = await TestUtils.fixture(
      TestUtils.html`<profile-page></profile-page>`
    );
    await element.updateComplete;
  });

  afterEach(() => {
    if (element) {
      element.remove();
    }
  });

  it("renders profile sections", async () => {
    const sections = TestUtils.queryAllComponents(element, "section");
    expect(sections.length).toBeGreaterThan(0);
    expect(sections[0].classList.contains("profile-section")).toBe(true);
  });

  it("displays user information correctly", async () => {
    const userInfo = TestUtils.queryComponent(element, ".user-info");
    expect(userInfo).toBeTruthy();
    expect(userInfo.querySelector(".user-name")).toBeTruthy();
    expect(userInfo.querySelector(".user-email")).toBeTruthy();
  });

  it("switches between tabs correctly", async () => {
    const tabs = TestUtils.queryAllComponents(element, ".tab");
    const firstTab = tabs[0];
    firstTab.click();
    await element.updateComplete;

    expect(firstTab.classList.contains("active")).toBe(true);
  });

  it("handles profile form submission", async () => {
    const form = TestUtils.queryComponent(element, "form");
    const nameInput = TestUtils.queryComponent(element, "input[name='name']");
    const emailInput = TestUtils.queryComponent(element, "input[name='email']");
    const submitButton = TestUtils.queryComponent(
      element,
      "button[type='submit']"
    );

    nameInput.value = "John Doe";
    emailInput.value = "john@example.com";
    nameInput.dispatchEvent(new Event("input"));
    emailInput.dispatchEvent(new Event("input"));
    await element.updateComplete;

    let formSubmitted = false;
    element.addEventListener("profile-update", () => (formSubmitted = true));

    submitButton.click();
    await element.updateComplete;

    expect(formSubmitted).toBe(true);
  });

  it("handles avatar upload", async () => {
    const fileInput = TestUtils.queryComponent(element, "input[type='file']");
    const file = new File(["test"], "avatar.jpg", { type: "image/jpeg" });
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    fileInput.files = dataTransfer.files;
    fileInput.dispatchEvent(new Event("change"));
    await element.updateComplete;

    expect(element.avatar).toBeTruthy();
  });

  it("updates user preferences", async () => {
    const preferences = TestUtils.queryComponent(element, ".preferences");
    const themeToggle = TestUtils.queryComponent(
      element,
      "input[name='theme']"
    );
    themeToggle.checked = true;
    themeToggle.dispatchEvent(new Event("change"));
    await element.updateComplete;

    expect(element.preferences.theme).toBe("dark");
  });

  it("handles password change", async () => {
    const passwordForm = TestUtils.queryComponent(element, "#password-form");
    const currentPassword = TestUtils.queryComponent(
      element,
      "input[name='current-password']"
    );
    const newPassword = TestUtils.queryComponent(
      element,
      "input[name='new-password']"
    );
    const confirmPassword = TestUtils.queryComponent(
      element,
      "input[name='confirm-password']"
    );
    const submitButton = TestUtils.queryComponent(
      element,
      "button[type='submit']"
    );

    currentPassword.value = "oldpassword";
    newPassword.value = "newpassword";
    confirmPassword.value = "newpassword";
    currentPassword.dispatchEvent(new Event("input"));
    newPassword.dispatchEvent(new Event("input"));
    confirmPassword.dispatchEvent(new Event("input"));
    await element.updateComplete;

    let passwordChanged = false;
    element.addEventListener("password-change", () => (passwordChanged = true));

    submitButton.click();
    await element.updateComplete;

    expect(passwordChanged).toBe(true);
  });

  it("validates password requirements", async () => {
    const newPassword = TestUtils.queryComponent(
      element,
      "input[name='new-password']"
    );
    newPassword.value = "weak";
    newPassword.dispatchEvent(new Event("input"));
    await element.updateComplete;

    const errorMessage = TestUtils.queryComponent(element, "#password-error");
    expect(errorMessage.textContent.trim()).toBe(
      "Password must be at least 8 characters long"
    );
  });

  it("handles social links updates", async () => {
    const socialLinks = TestUtils.queryComponent(element, ".social-links");
    const twitterInput = TestUtils.queryComponent(
      element,
      "input[name='twitter']"
    );
    twitterInput.value = "https://twitter.com/johndoe";
    twitterInput.dispatchEvent(new Event("input"));
    await element.updateComplete;

    expect(element.socialLinks.twitter).toBe("https://twitter.com/johndoe");
  });

  it("shows account deletion confirmation", async () => {
    const deleteButton = TestUtils.queryComponent(element, ".delete-account");
    deleteButton.click();
    await element.updateComplete;

    const confirmationDialog = TestUtils.queryComponent(
      element,
      ".confirmation-dialog"
    );
    expect(confirmationDialog).toBeTruthy();
  });

  it("handles loading states", async () => {
    element.loading = true;
    await element.updateComplete;

    const loadingSpinner = TestUtils.queryComponent(
      element,
      ".loading-spinner"
    );
    expect(loadingSpinner).toBeTruthy();
  });

  it("displays error messages", async () => {
    element.error = "Failed to update profile";
    await element.updateComplete;

    const errorMessage = TestUtils.queryComponent(element, ".error-message");
    expect(errorMessage.textContent.trim()).toBe("Failed to update profile");
  });

  it("supports mobile responsive layout", async () => {
    const container = TestUtils.queryComponent(element, ".profile-container");
    expect(container.classList.contains("responsive")).toBe(true);
  });

  it("maintains accessibility attributes", async () => {
    const form = TestUtils.queryComponent(element, "form");
    expect(form.getAttribute("aria-label")).toBe("Profile form");
    expect(form.getAttribute("role")).toBe("form");
  });

  it("supports keyboard navigation", async () => {
    const nameInput = TestUtils.queryComponent(element, "input[name='name']");
    const emailInput = TestUtils.queryComponent(element, "input[name='email']");
    const submitButton = TestUtils.queryComponent(
      element,
      "button[type='submit']"
    );

    nameInput.focus();
    nameInput.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Tab", shiftKey: false })
    );
    await element.updateComplete;
    expect(document.activeElement).toBe(emailInput);

    emailInput.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Tab", shiftKey: false })
    );
    await element.updateComplete;
    expect(document.activeElement).toBe(submitButton);
  });

  it("validates form inputs", async () => {
    const form = TestUtils.queryComponent(element, "form");
    const submitButton = TestUtils.queryComponent(
      element,
      "button[type='submit']"
    );

    submitButton.click();
    await element.updateComplete;

    const nameError = TestUtils.queryComponent(element, "#name-error");
    const emailError = TestUtils.queryComponent(element, "#email-error");

    expect(nameError.textContent.trim()).toBe("Name is required");
    expect(emailError.textContent.trim()).toBe("Email is required");
  });

  it("handles unsaved changes warning", async () => {
    const nameInput = TestUtils.queryComponent(element, "input[name='name']");
    nameInput.value = "New Name";
    nameInput.dispatchEvent(new Event("input"));
    await element.updateComplete;

    expect(element.hasUnsavedChanges).toBe(true);
  });
});
