import { fixture, expect, oneEvent } from "@open-wc/testing";
import { html } from "lit";
import "../../pages/profile-page.js";

describe("Profile Page", () => {
  let element;
  const mockUser = {
    id: "123",
    name: "John Doe",
    email: "john@example.com",
    avatar: "avatar.jpg",
    role: "developer",
    company: "TechCorp",
    location: "San Francisco, CA",
    bio: "Full-stack developer with 5 years of experience",
    preferences: {
      theme: "light",
      notifications: true,
      language: "en",
    },
    socialLinks: {
      github: "github.com/johndoe",
      linkedin: "linkedin.com/in/johndoe",
      twitter: "twitter.com/johndoe",
    },
  };

  beforeEach(async () => {
    // Mock auth state and API client
    window.auth = {
      currentUser: mockUser,
      isAuthenticated: true,
    };

    window.api = {
      updateProfile: async (data) => ({ ...mockUser, ...data }),
      updateAvatar: async (file) => ({ url: "new-avatar.jpg" }),
      updatePassword: async (data) => ({ success: true }),
      deleteAccount: async () => ({ success: true }),
    };

    element = await fixture(html`<profile-page></profile-page>`);
    await element.updateComplete;
  });

  it("renders profile sections", () => {
    const header = element.shadowRoot.querySelector(".profile-header");
    const details = element.shadowRoot.querySelector(".profile-details");
    const preferences = element.shadowRoot.querySelector(
      ".preferences-section"
    );
    const security = element.shadowRoot.querySelector(".security-section");

    expect(header).to.exist;
    expect(details).to.exist;
    expect(preferences).to.exist;
    expect(security).to.exist;
  });

  it("displays user information correctly", () => {
    const name = element.shadowRoot.querySelector(".user-name");
    const email = element.shadowRoot.querySelector(".user-email");
    const avatar = element.shadowRoot.querySelector(".user-avatar");

    expect(name.textContent).to.equal(mockUser.name);
    expect(email.textContent).to.equal(mockUser.email);
    expect(avatar.src).to.include(mockUser.avatar);
  });

  it("handles profile form submission", async () => {
    const form = element.shadowRoot.querySelector(".profile-form");
    const nameInput = form.querySelector('input[name="name"]');
    const bioInput = form.querySelector('textarea[name="bio"]');

    // Update form values
    nameInput.value = "Updated Name";
    bioInput.value = "Updated bio";

    setTimeout(() => form.submit());
    const { detail } = await oneEvent(element, "profile-update");

    expect(detail.name).to.equal("Updated Name");
    expect(detail.bio).to.equal("Updated bio");
  });

  it("handles avatar upload", async () => {
    const avatarInput = element.shadowRoot.querySelector(".avatar-input");
    const file = new File([""], "test.jpg", { type: "image/jpeg" });

    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    avatarInput.files = dataTransfer.files;

    setTimeout(() => avatarInput.dispatchEvent(new Event("change")));
    const { detail } = await oneEvent(element, "avatar-update");

    expect(detail.file).to.equal(file);
  });

  it("updates user preferences", async () => {
    const themeToggle = element.shadowRoot.querySelector(".theme-toggle");
    const notificationsToggle = element.shadowRoot.querySelector(
      ".notifications-toggle"
    );

    themeToggle.click();
    await element.updateComplete;

    expect(element.preferences.theme).to.equal("dark");

    notificationsToggle.click();
    await element.updateComplete;

    expect(element.preferences.notifications).to.be.false;
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
