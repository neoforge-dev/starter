import { html, expect, oneEvent, TestUtils } from "../setup.mjs";
import { ProfilePage } from "../../pages/profile-page.js";

describe("Profile Page", () => {
  let element;

  beforeEach(async () => {
    // Mock auth service
    window.auth = {
      getCurrentUser: vi.fn().mockResolvedValue({
        id: "123",
        email: "test@example.com",
        name: "Test User",
        avatar: "https://example.com/avatar.jpg",
        preferences: {
          theme: "light",
          notifications: true,
        },
      }),
      updateProfile: vi.fn().mockResolvedValue({ success: true }),
      updatePassword: vi.fn().mockResolvedValue({ success: true }),
      updatePreferences: vi.fn().mockResolvedValue({ success: true }),
    };

    element = await TestUtils.fixture(html`<profile-page></profile-page>`);
    await element.updateComplete;
  });

  it("renders profile sections", async () => {
    const shadowRoot = await TestUtils.waitForShadowDom(element);

    // Check header section
    const header = shadowRoot.querySelector(".profile-header");
    expect(header).to.exist;

    // Check tabs
    const tabs = shadowRoot.querySelector(".profile-tabs");
    expect(tabs).to.exist;

    // Check tab buttons
    const tabButtons = shadowRoot.querySelectorAll(".profile-tab");
    expect(tabButtons.length).to.equal(3); // Details, Security, Preferences tabs

    // Check initial active tab (details)
    const detailsSection = shadowRoot.querySelector(".profile-section");
    expect(detailsSection).to.exist;
  });

  it("displays user information correctly", async () => {
    const shadowRoot = await TestUtils.waitForShadowDom(element);
    const name = shadowRoot.querySelector(".profile-name");
    const email = shadowRoot.querySelector(".profile-email");
    const avatar = shadowRoot.querySelector(".profile-avatar");

    expect(name.textContent.trim()).to.equal("Test User");
    expect(email.textContent.trim()).to.equal("test@example.com");
    expect(avatar.src).to.equal("https://example.com/avatar.jpg");
  });

  it("switches between tabs correctly", async () => {
    const shadowRoot = await TestUtils.waitForShadowDom(element);

    // Click security tab
    const securityTab = shadowRoot.querySelector('[data-tab="security"]');
    securityTab.click();
    await element.updateComplete;

    const securitySection = shadowRoot.querySelector(".profile-section");
    expect(securitySection).to.exist;
    expect(securitySection.querySelector('[data-action="password"]')).to.exist;

    // Click preferences tab
    const preferencesTab = shadowRoot.querySelector('[data-tab="preferences"]');
    preferencesTab.click();
    await element.updateComplete;

    const preferencesSection = shadowRoot.querySelector(".profile-section");
    expect(preferencesSection).to.exist;
    expect(preferencesSection.querySelector(".preference-toggle")).to.exist;
  });

  it("handles profile form submission", async () => {
    const shadowRoot = await TestUtils.waitForShadowDom(element);
    const form = shadowRoot.querySelector("form.profile-form");
    const nameInput = form.querySelector('input[name="name"]');

    // Set up form data
    nameInput.value = "Updated Name";
    const inputEvent = new Event("input", {
      bubbles: true,
      composed: true,
    });
    nameInput.dispatchEvent(inputEvent);
    await element.updateComplete;

    // Set up form submission
    const submitPromise = oneEvent(element, "profile-updated");
    const submitEvent = new Event("submit", {
      bubbles: true,
      cancelable: true,
      composed: true,
    });
    submitEvent.preventDefault = () => {};

    // Submit form
    form.dispatchEvent(submitEvent);

    // Wait for update and check results
    const { detail } = await submitPromise;
    expect(detail.success).to.be.true;
    expect(window.auth.updateProfile).to.have.been.calledWith({
      name: "Updated Name",
    });
  });

  it("handles avatar upload", async () => {
    const shadowRoot = await TestUtils.waitForShadowDom(element);
    const fileInput = shadowRoot.querySelector('input[type="file"]');
    const file = new File(["test"], "avatar.jpg", { type: "image/jpeg" });

    // Create a change event
    const changeEvent = new Event("change", {
      bubbles: true,
      composed: true,
    });
    Object.defineProperty(changeEvent, "target", {
      value: { files: [file] },
      enumerable: true,
    });

    // Dispatch event and wait for update
    fileInput.dispatchEvent(changeEvent);
    await element.updateComplete;

    expect(window.auth.updateProfile).to.have.been.called;
  });

  it("updates user preferences", async () => {
    const themeToggle = await TestUtils.queryComponent(
      element,
      '.preference-toggle[name="theme"]'
    );
    const notificationsToggle = await TestUtils.queryComponent(
      element,
      '.preference-toggle[name="notifications"]'
    );

    TestUtils.dispatchEvent(themeToggle, "change", {
      target: { checked: false },
    });
    TestUtils.dispatchEvent(notificationsToggle, "change", {
      target: { checked: false },
    });

    await element.updateComplete;

    expect(window.auth.updatePreferences).to.have.been.calledWith({
      theme: "dark",
      notifications: false,
    });
  });

  it("handles password change", async () => {
    const passwordForm = element.shadowRoot.querySelector(".password-form");
    const currentPassword = passwordForm.querySelector(
      'input[name="currentPassword"]'
    );
    const newPassword = passwordForm.querySelector('input[name="newPassword"]');
    const confirmPassword = passwordForm.querySelector(
      'input[name="confirmPassword"]'
    );

    currentPassword.value = "oldpass123";
    newPassword.value = "newpass123";
    confirmPassword.value = "newpass123";

    setTimeout(() => passwordForm.submit());
    const { detail } = await oneEvent(element, "password-change");

    expect(detail.currentPassword).to.equal("oldpass123");
    expect(detail.newPassword).to.equal("newpass123");
  });

  it("validates password requirements", async () => {
    const passwordForm = element.shadowRoot.querySelector(".password-form");
    const newPassword = passwordForm.querySelector('input[name="newPassword"]');

    // Test weak password
    newPassword.value = "weak";
    newPassword.dispatchEvent(new Event("input"));
    await element.updateComplete;

    const errorMessage = passwordForm.querySelector(".error-message");
    expect(errorMessage).to.exist;
    expect(errorMessage.textContent).to.include("password requirements");
  });

  it("handles social links updates", async () => {
    const socialForm = element.shadowRoot.querySelector(".social-links-form");
    const githubInput = socialForm.querySelector('input[name="github"]');

    githubInput.value = "github.com/newhandle";
    setTimeout(() => socialForm.submit());
    const { detail } = await oneEvent(element, "social-update");

    expect(detail.github).to.equal("github.com/newhandle");
  });

  it("shows account deletion confirmation", async () => {
    const deleteButton = element.shadowRoot.querySelector(
      ".delete-account-button"
    );

    setTimeout(() => deleteButton.click());
    const { detail } = await oneEvent(element, "show-modal");

    expect(detail.type).to.equal("confirm-delete-account");
  });

  it("handles loading states", async () => {
    element.loading = true;
    await element.updateComplete;

    const loader = element.shadowRoot.querySelector(".loading-indicator");
    const skeleton = element.shadowRoot.querySelector(".profile-skeleton");

    expect(loader).to.exist;
    expect(skeleton).to.exist;
  });

  it("displays error messages", async () => {
    const error = "Failed to update profile";
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
    const sections = element.shadowRoot.querySelectorAll("section");
    sections.forEach((section) => {
      expect(section.getAttribute("aria-labelledby")).to.exist;
    });

    const inputs = element.shadowRoot.querySelectorAll("input");
    inputs.forEach((input) => {
      expect(input.getAttribute("aria-label")).to.exist;
    });
  });

  it("supports keyboard navigation", async () => {
    const tabs = element.shadowRoot.querySelectorAll(".profile-tab");
    const firstTab = tabs[0];

    firstTab.focus();
    firstTab.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }));
    await element.updateComplete;

    expect(document.activeElement).to.equal(tabs[1]);
  });

  it("validates form inputs", async () => {
    const form = element.shadowRoot.querySelector(".profile-form");
    const emailInput = form.querySelector('input[name="email"]');

    // Test invalid email
    emailInput.value = "invalid-email";
    emailInput.dispatchEvent(new Event("input"));
    await element.updateComplete;

    const errorMessage = form.querySelector(".error-message");
    expect(errorMessage).to.exist;
    expect(errorMessage.textContent).to.include("valid email");
  });

  it("handles unsaved changes warning", async () => {
    const form = element.shadowRoot.querySelector(".profile-form");
    const nameInput = form.querySelector('input[name="name"]');

    nameInput.value = "Changed Name";
    nameInput.dispatchEvent(new Event("input"));
    await element.updateComplete;

    expect(element.hasUnsavedChanges).to.be.true;

    // Try to navigate away
    const event = new Event("beforeunload");
    event.preventDefault = () => {};
    window.dispatchEvent(event);

    expect(event.returnValue).to.be.false;
  });
});
