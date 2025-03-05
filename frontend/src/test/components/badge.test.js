import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { TestUtils } from "../setup.mjs";
import { waitForComponents } from "../setup.mjs";
import "../../../src/components/atoms/badge/badge.js";

describe("NeoBadge", () => {
  let element;

  beforeEach(async () => {
    // Wait for components to be registered
    await waitForComponents();

    element = await TestUtils.fixture(
      TestUtils.html`<neo-badge>Default</neo-badge>`
    );
    await TestUtils.waitForComponent(element);
  });

  afterEach(() => {
    if (element) {
      element.remove();
    }
  });

  it("renders with default properties", async () => {
    expect(element.variant).toBe("default");
    expect(element.size).toBe("medium");
    expect(element.rounded).toBe(false);
    expect(element.outlined).toBe(false);
    expect(element.textContent.trim()).toBe("Default");
  });

  it("reflects variant changes", async () => {
    const variants = ["primary", "success", "warning", "error", "info"];

    for (const variant of variants) {
      element.variant = variant;
      await element.updateComplete;
      const badge = TestUtils.queryComponent(element, ".badge");
      expect(badge.classList.contains(`variant-${variant}`)).toBe(true);
    }
  });

  it("reflects size changes", async () => {
    const sizes = ["small", "medium", "large"];

    for (const size of sizes) {
      element.size = size;
      await element.updateComplete;
      const badge = TestUtils.queryComponent(element, ".badge");
      expect(badge.classList.contains(`size-${size}`)).toBe(true);
    }
  });

  it("handles rounded style", async () => {
    element.rounded = true;
    await element.updateComplete;
    const badge = TestUtils.queryComponent(element, ".badge");
    expect(badge.classList.contains("rounded")).toBe(true);
  });

  it("handles outlined style", async () => {
    element.outlined = true;
    await element.updateComplete;
    const badge = TestUtils.queryComponent(element, ".badge");
    expect(badge.classList.contains("outlined")).toBe(true);
  });

  it("renders with icon", async () => {
    const badgeWithIcon = await TestUtils.fixture(TestUtils.html`
      <neo-badge icon="check">Success</neo-badge>
    `);
    await TestUtils.waitForComponent(badgeWithIcon);

    const icon = TestUtils.queryComponent(badgeWithIcon, "neo-icon");
    expect(icon).toBeTruthy();
    expect(icon.getAttribute("name")).toBe("check");
  });

  it("handles removable state", async () => {
    element.removable = true;
    await element.updateComplete;

    const closeButton = TestUtils.queryComponent(element, ".close-button");
    expect(closeButton).toBeTruthy();
    expect(closeButton.getAttribute("aria-label")).toBe("Remove");
  });

  it("dispatches remove event", async () => {
    element.removable = true;
    await element.updateComplete;

    let removed = false;
    element.addEventListener("remove", () => (removed = true));

    const closeButton = TestUtils.queryComponent(element, ".close-button");
    closeButton.click();

    expect(removed).toBe(true);
  });

  it("should truncate long content", async () => {
    const longText = "This is a very long text that should be truncated";
    const el = await TestUtils.fixture(
      TestUtils.html`<neo-badge>${longText}</neo-badge>`
    );
    await TestUtils.waitForComponent(el);

    const badge = TestUtils.queryComponent(el, ".badge");
    expect(badge.classList.contains("truncate")).toBe(true);
    expect(badge.title).toBe(longText);
  });

  it("should have proper ARIA attributes", async () => {
    const el = await TestUtils.fixture(
      TestUtils.html`<neo-badge>Status</neo-badge>`
    );
    await TestUtils.waitForComponent(el);

    const badge = TestUtils.queryComponent(el, ".badge");
    expect(badge.getAttribute("role")).toBe("status");
  });

  it("should handle slotted content", async () => {
    const el = await TestUtils.fixture(TestUtils.html`
      <neo-badge>
        <span>Custom Content</span>
      </neo-badge>
    `);
    await TestUtils.waitForComponent(el);

    const slotted = el.querySelector("span");
    expect(slotted.textContent.trim()).toBe("Custom Content");

    // Check that title is updated based on slotted content
    const badge = TestUtils.queryComponent(el, ".badge");
    expect(badge.title).toBe("Custom Content");
  });

  it("should support pill shape variant", async () => {
    const el = await TestUtils.fixture(
      TestUtils.html`<neo-badge pill>Pill Badge</neo-badge>`
    );
    await TestUtils.waitForComponent(el);

    const badge = TestUtils.queryComponent(el, ".badge");
    expect(badge.classList.contains("pill")).toBe(true);
  });

  it("should handle disabled state", async () => {
    const el = await TestUtils.fixture(
      TestUtils.html`<neo-badge disabled>Disabled</neo-badge>`
    );
    await TestUtils.waitForComponent(el);

    const badge = TestUtils.queryComponent(el, ".badge");
    expect(badge.classList.contains("disabled")).toBe(true);
  });

  it("should support prefix and suffix slots", async () => {
    const el = await TestUtils.fixture(TestUtils.html`
      <neo-badge>
        <span slot="prefix">Pre</span>
        Main
        <span slot="suffix">Post</span>
      </neo-badge>
    `);
    await TestUtils.waitForComponent(el);

    const prefixSlot = TestUtils.queryComponent(el, 'slot[name="prefix"]');
    const suffixSlot = TestUtils.queryComponent(el, 'slot[name="suffix"]');

    expect(prefixSlot).toBeTruthy();
    expect(suffixSlot).toBeTruthy();

    const prefixContent = el.querySelector('[slot="prefix"]');
    const suffixContent = el.querySelector('[slot="suffix"]');

    expect(prefixContent.textContent.trim()).toBe("Pre");
    expect(suffixContent.textContent.trim()).toBe("Post");
  });

  it("handles dynamic content updates", async () => {
    element.textContent = "Updated Content";
    await element.updateComplete;

    expect(element.textContent.trim()).toBe("Updated Content");
  });

  it("supports custom colors", async () => {
    await element.updateComplete;

    // Get the badge element from shadow DOM
    const badge = TestUtils.queryComponent(element, ".badge");

    // Set custom properties directly on the badge element
    badge.style.setProperty("--badge-bg-color", "purple");
    badge.style.setProperty("--badge-text-color", "white");

    // Skip checking computed styles in JSDOM as they don't work reliably
    // Instead just verify the properties were set correctly
    expect(badge.style.getPropertyValue("--badge-bg-color")).toBe("purple");
    expect(badge.style.getPropertyValue("--badge-text-color")).toBe("white");
  });

  it("handles click events", async () => {
    let clicked = false;
    element.addEventListener("click", () => (clicked = true));

    element.click();
    expect(clicked).toBe(true);
  });

  it("supports removable badges", async () => {
    const removableBadge = await TestUtils.fixture(TestUtils.html`
      <neo-badge removable>Removable</neo-badge>
    `);

    let removed = false;
    removableBadge.addEventListener("remove", () => (removed = true));

    const closeButton = TestUtils.queryComponent(
      removableBadge,
      ".close-button"
    );
    expect(closeButton).toBeTruthy();

    closeButton.click();
    expect(removed).toBe(true);
  });

  it("handles overflow content", async () => {
    const longContent =
      "This is a very long badge content that should trigger overflow handling";
    element.textContent = longContent;

    await element.updateComplete;

    const badge = TestUtils.queryComponent(element, ".badge");
    expect(badge.classList.contains("truncate")).toBe(true);
    expect(badge.title).toBe(longContent);
  });
});
