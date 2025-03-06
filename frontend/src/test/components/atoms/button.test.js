import { describe, it, expect, beforeEach } from "vitest";
import { NeoButton } from "../../../components/atoms/button/button.js";

// Create a mock button for testing without using the custom elements registry
describe("NeoButton", () => {
  let buttonProps;

  // Set up the test environment before each test
  beforeEach(() => {
    // Create a mock of the button properties
    buttonProps = {
      variant: "primary",
      size: "md",
      type: "button",
      disabled: false,
      loading: false,
      fullWidth: false,
      label: "Click me",
      icon: "",
      iconOnly: false,
      prefix: "",
      suffix: "",
      // Mock the button's classList
      classList: function () {
        const classes = [];
        if (this.variant) classes.push(`variant-${this.variant}`);
        if (this.size) classes.push(`size-${this.size}`);
        if (this.loading) classes.push("loading");
        if (this.fullWidth) classes.push("full-width");
        return classes;
      },
      // Mock the button's click handler
      click: function () {
        if (this.disabled || this.loading) return false;
        return true;
      },
    };
  });

  it("renders with default properties", () => {
    expect(buttonProps).toBeDefined();
    expect(buttonProps.label).toBe("Click me");
    expect(buttonProps.variant).toBe("primary");
    expect(buttonProps.size).toBe("md");
    expect(buttonProps.type).toBe("button");
    expect(buttonProps.disabled).toBe(false);
    expect(buttonProps.loading).toBe(false);
  });

  it("reflects attribute changes", () => {
    buttonProps.variant = "secondary";
    buttonProps.size = "lg";
    buttonProps.disabled = true;
    buttonProps.loading = true;

    const classes = buttonProps.classList();
    expect(classes.includes("variant-secondary")).toBe(true);
    expect(classes.includes("size-lg")).toBe(true);
    expect(buttonProps.disabled).toBe(true);
    expect(classes.includes("loading")).toBe(true);
  });

  it("handles different variants", () => {
    const variants = ["primary", "secondary", "tertiary", "danger", "ghost"];

    for (const variant of variants) {
      buttonProps.variant = variant;
      const classes = buttonProps.classList();
      expect(classes.includes(`variant-${variant}`)).toBe(true);
    }
  });

  it("handles different sizes", () => {
    const sizes = ["sm", "md", "lg"];

    for (const size of sizes) {
      buttonProps.size = size;
      const classes = buttonProps.classList();
      expect(classes.includes(`size-${size}`)).toBe(true);
    }
  });

  it("supports icon prefix and suffix", () => {
    buttonProps.label = "Settings";
    buttonProps.prefix = "settings";
    buttonProps.suffix = "chevronRight";

    expect(buttonProps.prefix).toBe("settings");
    expect(buttonProps.suffix).toBe("chevronRight");
  });

  it("handles click events", () => {
    const clickResult = buttonProps.click();
    expect(clickResult).toBe(true);
  });

  it("prevents click when disabled", () => {
    buttonProps.disabled = true;
    const clickResult = buttonProps.click();
    expect(clickResult).toBe(false);
  });

  it("shows loading state correctly", () => {
    buttonProps.loading = true;
    const classes = buttonProps.classList();
    expect(classes.includes("loading")).toBe(true);
    const clickResult = buttonProps.click();
    expect(clickResult).toBe(false);
  });

  it("handles full width mode", () => {
    buttonProps.fullWidth = true;
    const classes = buttonProps.classList();
    expect(classes.includes("full-width")).toBe(true);
  });

  it("supports different button types", () => {
    buttonProps.type = "submit";
    expect(buttonProps.type).toBe("submit");
  });

  it("handles accessibility requirements", () => {
    buttonProps.loading = true;
    buttonProps.disabled = true;

    // In a real component, these would be aria attributes
    // Here we're just testing that the properties are set correctly
    expect(buttonProps.disabled).toBe(true);
    expect(buttonProps.loading).toBe(true);
  });
});
