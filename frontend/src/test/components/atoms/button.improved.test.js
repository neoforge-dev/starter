/**
 * Improved Button Component Test
 *
 * This test demonstrates the improved approach to testing web components
 * using the new component registration helper.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { html } from "lit";
import {
  setupTestEnvironment,
  cleanupTestEnvironment,
  TestUtils,
} from "../../improved-setup.js";

describe("NeoButton", () => {
  let helpers;

  // Set up the test environment before all tests
  beforeEach(async () => {
    helpers = await setupTestEnvironment();
  });

  // Clean up the test environment after all tests
  afterEach(() => {
    cleanupTestEnvironment();
  });

  it("renders with default properties", async () => {
    // Create a button fixture
    const button = await helpers.createComponentFixture("neo-button", {
      label: "Click me",
    });

    // Verify the button was created
    expect(button).toBeDefined();
    expect(button.tagName.toLowerCase()).toBe("neo-button");

    // Verify the button properties
    expect(button.label).toBe("Click me");
    expect(button.variant).toBe("primary"); // Default variant
    expect(button.disabled).toBe(false); // Default disabled state

    // Verify the button's shadow DOM
    const buttonElement = TestUtils.queryComponent(button, "button");
    expect(buttonElement).toBeDefined();
    expect(buttonElement.textContent.trim()).toBe("Click me");
    expect(buttonElement.classList.contains("primary")).toBe(true);
    expect(buttonElement.disabled).toBe(false);

    // Clean up
    helpers.cleanupComponentFixture(button);
  });

  it("reflects attribute changes", async () => {
    // Create a button fixture
    const button = await helpers.createComponentFixture("neo-button", {
      label: "Click me",
      variant: "primary",
    });

    // Change the button properties
    button.variant = "secondary";
    button.disabled = true;

    // Wait for the button to update
    await button.updateComplete;

    // Verify the button properties were updated
    expect(button.variant).toBe("secondary");
    expect(button.disabled).toBe(true);

    // Verify the button's shadow DOM was updated
    const buttonElement = TestUtils.queryComponent(button, "button");
    expect(buttonElement.classList.contains("secondary")).toBe(true);
    expect(buttonElement.classList.contains("primary")).toBe(false);
    expect(buttonElement.disabled).toBe(true);

    // Clean up
    helpers.cleanupComponentFixture(button);
  });

  it("handles click events", async () => {
    // Create a button fixture
    const button = await helpers.createComponentFixture("neo-button", {
      label: "Click me",
    });

    // Set up a click handler
    let clicked = false;
    button.addEventListener("click", () => {
      clicked = true;
    });

    // Click the button
    const buttonElement = TestUtils.queryComponent(button, "button");
    buttonElement.click();

    // Verify the click handler was called
    expect(clicked).toBe(true);

    // Clean up
    helpers.cleanupComponentFixture(button);
  });

  it("supports different variants", async () => {
    // Create buttons with different variants
    const variants = [
      "primary",
      "secondary",
      "tertiary",
      "danger",
      "success",
      "warning",
      "info",
    ];
    const buttons = await Promise.all(
      variants.map((variant) =>
        helpers.createComponentFixture("neo-button", {
          label: `${variant} button`,
          variant,
        })
      )
    );

    // Verify each button has the correct variant
    buttons.forEach((button, index) => {
      const variant = variants[index];
      const buttonElement = TestUtils.queryComponent(button, "button");

      expect(button.variant).toBe(variant);
      expect(buttonElement.classList.contains(variant)).toBe(true);
    });

    // Clean up
    buttons.forEach((button) => helpers.cleanupComponentFixture(button));
  });

  it("supports icon buttons", async () => {
    // Create a button with an icon
    const button = await helpers.createComponentFixture("neo-button", {
      icon: "user",
      label: "User",
    });

    // Verify the button has an icon
    const iconElement = TestUtils.queryComponent(button, "neo-icon");
    expect(iconElement).toBeDefined();
    expect(iconElement.icon).toBe("user");

    // Clean up
    helpers.cleanupComponentFixture(button);
  });

  it("supports icon-only buttons", async () => {
    // Create a button with only an icon
    const button = await helpers.createComponentFixture("neo-button", {
      icon: "user",
      iconOnly: true,
      label: "User", // Label is still required for accessibility
    });

    // Verify the button has an icon and the icon-only class
    const buttonElement = TestUtils.queryComponent(button, "button");
    const iconElement = TestUtils.queryComponent(button, "neo-icon");

    expect(iconElement).toBeDefined();
    expect(iconElement.icon).toBe("user");
    expect(buttonElement.classList.contains("icon-only")).toBe(true);

    // Verify the button has an aria-label for accessibility
    expect(buttonElement.getAttribute("aria-label")).toBe("User");

    // Clean up
    helpers.cleanupComponentFixture(button);
  });

  it("supports loading state", async () => {
    // Create a button in loading state
    const button = await helpers.createComponentFixture("neo-button", {
      label: "Loading",
      loading: true,
    });

    // Verify the button is in loading state
    const buttonElement = TestUtils.queryComponent(button, "button");
    const spinnerElement = TestUtils.queryComponent(button, ".spinner");

    expect(button.loading).toBe(true);
    expect(buttonElement.disabled).toBe(true);
    expect(spinnerElement).toBeDefined();

    // Change the loading state
    button.loading = false;
    await button.updateComplete;

    // Verify the button is no longer in loading state
    const updatedSpinnerElement = TestUtils.queryComponent(button, ".spinner");

    expect(button.loading).toBe(false);
    expect(buttonElement.disabled).toBe(false);
    expect(updatedSpinnerElement).toBeNull();

    // Clean up
    helpers.cleanupComponentFixture(button);
  });

  it("supports different sizes", async () => {
    // Create buttons with different sizes
    const sizes = ["small", "medium", "large"];
    const buttons = await Promise.all(
      sizes.map((size) =>
        helpers.createComponentFixture("neo-button", {
          label: `${size} button`,
          size,
        })
      )
    );

    // Verify each button has the correct size
    buttons.forEach((button, index) => {
      const size = sizes[index];
      const buttonElement = TestUtils.queryComponent(button, "button");

      expect(button.size).toBe(size);
      expect(buttonElement.classList.contains(size)).toBe(true);
    });

    // Clean up
    buttons.forEach((button) => helpers.cleanupComponentFixture(button));
  });
});
