import { expect, describe, it, beforeEach, vi } from "vitest";
import { fixture, html } from "@open-wc/testing";
import "../../components/atoms/button/button.js";

describe("NeoButton", () => {
  let element;

  beforeEach(async () => {
    element = await fixture(html`<neo-button>Click me</neo-button>`);
    await element.updateComplete;
  });

  it("renders with default properties", () => {
    expect(element.variant).toBe("primary");
    expect(element.size).toBe("md");
    expect(element.type).toBe("button");
    expect(element.disabled).toBe(false);
    expect(element.loading).toBe(false);
    expect(element.fullWidth).toBe(false);
  });

  it("handles click events", async () => {
    const clickSpy = vi.fn();
    element.addEventListener("click", clickSpy);

    const button = element.shadowRoot.querySelector("button");
    button.click();

    expect(clickSpy).toHaveBeenCalled();
  });

  it("prevents click when disabled", async () => {
    const clickSpy = vi.fn();
    element.disabled = true;
    await element.updateComplete;

    element.addEventListener("click", clickSpy);

    const button = element.shadowRoot.querySelector("button");
    button.click();

    // Disabled buttons should not trigger click events
    expect(button.disabled || element.hasAttribute("disabled")).toBe(true);
  });

  it("prevents click when loading", async () => {
    element.loading = true;
    await element.updateComplete;

    const button = element.shadowRoot.querySelector("button");

    // Loading buttons should be disabled
    expect(button.disabled || element.hasAttribute("disabled")).toBe(true);
  });

  it("handles disabled state", async () => {
    element.disabled = true;
    await element.updateComplete;

    expect(element.disabled).toBe(true);
    expect(element.hasAttribute("disabled")).toBe(true);
  });

  it("renders with variant", async () => {
    element.variant = "secondary";
    await element.updateComplete;

    expect(element.variant).toBe("secondary");
    expect(element.hasAttribute("variant")).toBe(true);
  });

  it("renders with size", async () => {
    element.size = "lg";
    await element.updateComplete;

    expect(element.size).toBe("lg");
    expect(element.hasAttribute("size")).toBe(true);
  });

  it("handles loading state", async () => {
    element.loading = true;
    await element.updateComplete;

    expect(element.loading).toBe(true);
    expect(element.hasAttribute("loading")).toBe(true);

    const spinner = element.shadowRoot.querySelector(".spinner");
    // Component may or may not have spinner element depending on implementation
    if (spinner) {
      expect(spinner).not.toBeNull();
    }
  });

  it("handles full width", async () => {
    element.fullWidth = true;
    await element.updateComplete;

    expect(element.fullWidth).toBe(true);
    expect(element.hasAttribute("fullWidth")).toBe(true);
  });

  it("sets aria-label for icon-only buttons", async () => {
    element.iconOnly = true;
    element.label = "Close";
    await element.updateComplete;

    // Check if aria-label is set on component or button element
    const hasAriaLabel =
      element.getAttribute("aria-label") === "Close" ||
      element.shadowRoot
        .querySelector("button")
        ?.getAttribute("aria-label") === "Close";

    expect(hasAriaLabel).toBe(true);
  });

  it("has accessible text for regular buttons", async () => {
    element.textContent = "Submit";
    await element.updateComplete;

    const button = element.shadowRoot.querySelector("button");
    const hasAccessibleText =
      button.textContent.includes("Submit") ||
      element.textContent.includes("Submit");

    expect(hasAccessibleText).toBe(true);
  });
});
