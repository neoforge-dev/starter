import { fixture, expect, oneEvent } from "@open-wc/testing";
import { html } from "lit";
import "../../pages/settings-page.js";

describe("Settings Page", () => {
  let element;
  const mockSettings = {
    theme: {
      mode: "light",
      primaryColor: "#007bff",
      fontSize: "medium",
    },
    notifications: {
      email: true,
      push: true,
      desktop: false,
      frequency: "daily",
    },
    privacy: {
      profileVisibility: "public",
      activityTracking: true,
      dataSharing: false,
    },
    accessibility: {
      highContrast: false,
      reducedMotion: false,
      screenReader: false,
      keyboardNavigation: true,
    },
    language: {
      preferred: "en",
      dateFormat: "MM/DD/YYYY",
      timeFormat: "12h",
    },
  };

  beforeEach(async () => {
    // Mock API client
    window.api = {
      getSettings: async () => mockSettings,
      updateSettings: async (settings) => settings,
      resetSettings: async () => ({ success: true }),
    };

    element = await fixture(html`<settings-page></settings-page>`);
    await element.updateComplete;
  });

  it("renders settings sections", () => {
    const themeSection = element.shadowRoot.querySelector(".theme-section");
    const notificationsSection = element.shadowRoot.querySelector(
      ".notifications-section"
    );
    const privacySection = element.shadowRoot.querySelector(".privacy-section");
    const accessibilitySection = element.shadowRoot.querySelector(
      ".accessibility-section"
    );
    const languageSection =
      element.shadowRoot.querySelector(".language-section");

    expect(themeSection).to.exist;
    expect(notificationsSection).to.exist;
    expect(privacySection).to.exist;
    expect(accessibilitySection).to.exist;
    expect(languageSection).to.exist;
  });

  it("displays current settings values", () => {
    const themeMode = element.shadowRoot.querySelector(".theme-mode-select");
    const emailNotifications = element.shadowRoot.querySelector(
      ".email-notifications-toggle"
    );
    const profileVisibility = element.shadowRoot.querySelector(
      ".profile-visibility-select"
    );

    expect(themeMode.value).to.equal(mockSettings.theme.mode);
    expect(emailNotifications.checked).to.equal(
      mockSettings.notifications.email
    );
    expect(profileVisibility.value).to.equal(
      mockSettings.privacy.profileVisibility
    );
  });

  it("handles theme settings updates", async () => {
    const themeMode = element.shadowRoot.querySelector(".theme-mode-select");
    const primaryColor = element.shadowRoot.querySelector(
      ".primary-color-input"
    );

    themeMode.value = "dark";
    themeMode.dispatchEvent(new Event("change"));

    primaryColor.value = "#ff0000";
    primaryColor.dispatchEvent(new Event("change"));

    await element.updateComplete;

    expect(element.settings.theme.mode).to.equal("dark");
    expect(element.settings.theme.primaryColor).to.equal("#ff0000");
  });

  it("handles notification preferences", async () => {
    const emailToggle = element.shadowRoot.querySelector(
      ".email-notifications-toggle"
    );
    const pushToggle = element.shadowRoot.querySelector(
      ".push-notifications-toggle"
    );
    const frequencySelect = element.shadowRoot.querySelector(
      ".notification-frequency-select"
    );

    emailToggle.click();
    pushToggle.click();
    frequencySelect.value = "weekly";
    frequencySelect.dispatchEvent(new Event("change"));

    await element.updateComplete;

    expect(element.settings.notifications.email).to.be.false;
    expect(element.settings.notifications.push).to.be.false;
    expect(element.settings.notifications.frequency).to.equal("weekly");
  });

  it("updates privacy settings", async () => {
    const visibilitySelect = element.shadowRoot.querySelector(
      ".profile-visibility-select"
    );
    const trackingToggle = element.shadowRoot.querySelector(
      ".activity-tracking-toggle"
    );

    visibilitySelect.value = "private";
    visibilitySelect.dispatchEvent(new Event("change"));

    trackingToggle.click();
    await element.updateComplete;

    expect(element.settings.privacy.profileVisibility).to.equal("private");
    expect(element.settings.privacy.activityTracking).to.be.false;
  });

  it("handles accessibility preferences", async () => {
    const contrastToggle = element.shadowRoot.querySelector(
      ".high-contrast-toggle"
    );
    const motionToggle = element.shadowRoot.querySelector(
      ".reduced-motion-toggle"
    );

    contrastToggle.click();
    motionToggle.click();
    await element.updateComplete;

    expect(element.settings.accessibility.highContrast).to.be.true;
    expect(element.settings.accessibility.reducedMotion).to.be.true;
  });

  it("updates language preferences", async () => {
    const languageSelect = element.shadowRoot.querySelector(".language-select");
    const dateFormatSelect = element.shadowRoot.querySelector(
      ".date-format-select"
    );

    languageSelect.value = "es";
    languageSelect.dispatchEvent(new Event("change"));

    dateFormatSelect.value = "DD/MM/YYYY";
    dateFormatSelect.dispatchEvent(new Event("change"));

    await element.updateComplete;

    expect(element.settings.language.preferred).to.equal("es");
    expect(element.settings.language.dateFormat).to.equal("DD/MM/YYYY");
  });

  it("handles settings reset", async () => {
    const resetButton = element.shadowRoot.querySelector(
      ".reset-settings-button"
    );

    setTimeout(() => resetButton.click());
    const { detail } = await oneEvent(element, "show-modal");

    expect(detail.type).to.equal("confirm-reset-settings");
  });

  it("saves settings changes", async () => {
    const saveButton = element.shadowRoot.querySelector(
      ".save-settings-button"
    );

    // Make some changes
    element.settings.theme.mode = "dark";
    element.settings.notifications.email = false;

    setTimeout(() => saveButton.click());
    const { detail } = await oneEvent(element, "settings-save");

    expect(detail.settings).to.deep.equal(element.settings);
  });

  it("shows loading state", async () => {
    element.loading = true;
    await element.updateComplete;

    const loader = element.shadowRoot.querySelector(".loading-indicator");
    expect(loader).to.exist;
    expect(loader.hasAttribute("hidden")).to.be.false;
  });

  it("displays error messages", async () => {
    const error = "Failed to save settings";
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

    const controls = element.shadowRoot.querySelectorAll("select, input");
    controls.forEach((control) => {
      expect(control.getAttribute("aria-label")).to.exist;
    });
  });

  it("supports keyboard navigation", async () => {
    const sections = element.shadowRoot.querySelectorAll(".settings-section");
    const firstSection = sections[0];

    firstSection.focus();
    firstSection.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowDown" })
    );
    await element.updateComplete;

    expect(document.activeElement).to.equal(sections[1]);
  });

  it("validates color input", async () => {
    const colorInput = element.shadowRoot.querySelector(".primary-color-input");

    // Test invalid color
    colorInput.value = "invalid-color";
    colorInput.dispatchEvent(new Event("input"));
    await element.updateComplete;

    const errorMessage =
      colorInput.parentElement.querySelector(".error-message");
    expect(errorMessage).to.exist;
    expect(errorMessage.textContent).to.include("valid color");
  });

  it("handles unsaved changes warning", async () => {
    const themeMode = element.shadowRoot.querySelector(".theme-mode-select");

    themeMode.value = "dark";
    themeMode.dispatchEvent(new Event("change"));
    await element.updateComplete;

    expect(element.hasUnsavedChanges).to.be.true;

    // Try to navigate away
    const event = new Event("beforeunload");
    event.preventDefault = () => {};
    window.dispatchEvent(event);

    expect(event.returnValue).to.be.false;
  });

  it("applies theme changes in real-time", async () => {
    const themeMode = element.shadowRoot.querySelector(".theme-mode-select");
    const primaryColor = element.shadowRoot.querySelector(
      ".primary-color-input"
    );

    themeMode.value = "dark";
    themeMode.dispatchEvent(new Event("change"));

    primaryColor.value = "#ff0000";
    primaryColor.dispatchEvent(new Event("change"));

    await element.updateComplete;

    const root = document.documentElement;
    expect(root.getAttribute("data-theme")).to.equal("dark");
    expect(getComputedStyle(root).getPropertyValue("--primary-color")).to.equal(
      "#ff0000"
    );
  });
});
