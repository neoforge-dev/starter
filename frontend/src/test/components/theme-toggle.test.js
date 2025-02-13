import { expect } from "@esm-bundle/chai";
import { fixture, html, oneEvent } from "@open-wc/testing";
import "../../components/theme-toggle.js";

describe("ThemeToggleButton", () => {
  let element;

  beforeEach(async () => {
    element = await fixture(html`<theme-toggle-button></theme-toggle-button>`);
  });

  afterEach(() => {
    // Clean up theme state
    localStorage.removeItem("neo-theme");
    document.documentElement.removeAttribute("data-theme");
  });

  it("renders with default properties", () => {
    const button = element.shadowRoot.querySelector("button");
    const icon = element.shadowRoot.querySelector(".icon");

    expect(button).to.exist;
    expect(icon).to.exist;
    expect(button.getAttribute("aria-label")).to.include("theme");
  });

  it("toggles theme on click", async () => {
    const button = element.shadowRoot.querySelector("button");
    const initialTheme = document.documentElement.getAttribute("data-theme");

    const changePromise = oneEvent(element, "theme-changed");
    button.click();
    const { detail } = await changePromise;

    const newTheme = document.documentElement.getAttribute("data-theme");
    expect(newTheme).to.not.equal(initialTheme);
    expect(detail.theme).to.equal(newTheme);
  });

  it("persists theme preference in localStorage", async () => {
    const button = element.shadowRoot.querySelector("button");

    button.click();
    await element.updateComplete;

    const storedTheme = localStorage.getItem("neo-theme");
    const documentTheme = document.documentElement.getAttribute("data-theme");
    expect(storedTheme).to.equal(documentTheme);
  });

  it("respects system preference when set to 'system'", async () => {
    // Simulate light system theme
    const lightMediaQuery = window.matchMedia("(prefers-color-scheme: light)");
    Object.defineProperty(lightMediaQuery, "matches", { value: true });
    element._handleSystemThemeChange({ matches: true });
    await element.updateComplete;

    expect(document.documentElement.getAttribute("data-theme")).to.equal(
      "light"
    );

    // Simulate dark system theme
    Object.defineProperty(lightMediaQuery, "matches", { value: false });
    element._handleSystemThemeChange({ matches: false });
    await element.updateComplete;

    expect(document.documentElement.getAttribute("data-theme")).to.equal(
      "dark"
    );
  });

  it("applies transition classes during theme change", async () => {
    const button = element.shadowRoot.querySelector("button");

    const changePromise = oneEvent(element, "theme-changed");
    button.click();

    // Check for transition class immediately after click
    expect(document.documentElement.classList.contains("theme-transition")).to
      .be.true;

    await changePromise;
    // Wait for transition to complete
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Transition class should be removed after transition
    expect(document.documentElement.classList.contains("theme-transition")).to
      .be.false;
  });

  it("handles rapid theme toggles gracefully", async () => {
    const button = element.shadowRoot.querySelector("button");

    // Click multiple times rapidly
    button.click();
    button.click();
    button.click();

    await element.updateComplete;

    // Wait for any transitions to complete
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Should still be in a valid state
    const theme = document.documentElement.getAttribute("data-theme");
    expect(theme).to.be.oneOf(["light", "dark"]);
    expect(document.documentElement.classList.contains("theme-transition")).to
      .be.false;
  });

  it("updates icon based on current theme", async () => {
    const button = element.shadowRoot.querySelector("button");
    const initialIcon = element.shadowRoot
      .querySelector(".icon")
      .textContent.trim();

    button.click();
    await element.updateComplete;

    const newIcon = element.shadowRoot
      .querySelector(".icon")
      .textContent.trim();
    expect(newIcon).to.not.equal(initialIcon);
  });

  it("maintains accessibility during theme transitions", async () => {
    const button = element.shadowRoot.querySelector("button");

    // Check initial state
    expect(button.hasAttribute("aria-label")).to.be.true;

    button.click();
    await element.updateComplete;

    // Check state during/after transition
    expect(button.hasAttribute("aria-label")).to.be.true;
    expect(button.getAttribute("aria-label")).to.include("theme");
  });

  it("handles theme-specific styles correctly", async () => {
    // Set initial theme to light
    document.documentElement.setAttribute("data-theme", "light");
    await element.updateComplete;

    const computedStyle = getComputedStyle(element);
    const lightBackground = computedStyle.backgroundColor;

    // Toggle to dark theme
    const button = element.shadowRoot.querySelector("button");
    button.click();
    await element.updateComplete;
    await new Promise((resolve) => setTimeout(resolve, 300)); // Wait for transition

    const newComputedStyle = getComputedStyle(element);
    const darkBackground = newComputedStyle.backgroundColor;

    expect(darkBackground).to.not.equal(lightBackground);
  });
});
