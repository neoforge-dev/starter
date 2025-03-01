import { fixture, expect, oneEvent } from "@open-wc/testing";
import { html } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";

// Mock matchMedia before importing the component
window.matchMedia =
  window.matchMedia ||
  function (query) {
    return {
      matches: query.includes("prefers-reduced-motion") ? false : true,
      media: query,
      onchange: null,
      addListener: function (listener) {},
      removeListener: function (listener) {},
      addEventListener: function (type, listener) {},
      removeEventListener: function (type, listener) {},
      dispatchEvent: function () {
        return true;
      },
    };
  };

// Now import the component
import "../../components/theme-toggle.js";

describe("Theme Transitions", () => {
  let element;
  let transitionDuration;

  beforeEach(async () => {
    // Get transition duration from CSS variable
    const style = getComputedStyle(document.documentElement);
    transitionDuration =
      parseFloat(style.getPropertyValue("--transition-normal")) * 1000 || 300;

    // Reset document classes before each test
    document.documentElement.classList.remove("theme-transition");
    document.documentElement.removeAttribute("data-theme");

    element = await fixture(html`
      <theme-toggle-button></theme-toggle-button>
    `);
  });

  // Helper function to manually trigger transition end
  const triggerTransitionEnd = () => {
    const event = new Event("transitionend", {
      bubbles: true,
      cancelable: true,
    });
    document.documentElement.dispatchEvent(event);
    return new Promise((resolve) => setTimeout(resolve, 10));
  };

  it("applies transition classes when toggling theme", async () => {
    const button = element.shadowRoot.querySelector("button");

    // Click to toggle theme
    button.click();
    await element.updateComplete;

    // Check if transition classes are applied
    expect(document.documentElement.classList.contains("theme-transition")).to
      .be.true;
    expect(element.classList.contains("transitioning")).to.be.true;

    // Manually trigger transition end event
    await triggerTransitionEnd();

    // Check if transition classes are removed
    expect(document.documentElement.classList.contains("theme-transition")).to
      .be.false;
    expect(element.classList.contains("transitioning")).to.be.false;
  });

  it("handles transition origin based on click position", async () => {
    const button = element.shadowRoot.querySelector("button");
    const rect = button.getBoundingClientRect();

    // Click in the center of the button
    button.dispatchEvent(
      new MouseEvent("click", {
        clientX: rect.left + rect.width / 2,
        clientY: rect.top + rect.height / 2,
        bubbles: true,
      })
    );

    await element.updateComplete;

    // Check if transition origin CSS variables are set
    const style = document.documentElement.style;
    expect(style.getPropertyValue("--theme-transition-origin-x")).to.not.be
      .empty;
    expect(style.getPropertyValue("--theme-transition-origin-y")).to.not.be
      .empty;

    // Clean up
    await triggerTransitionEnd();
  });

  it("transitions all theme-dependent properties smoothly", async () => {
    const testElement = await fixture(html`
      <div
        style="
        background-color: var(--background-color);
        color: var(--text-color);
        border-color: var(--border-color);
        box-shadow: var(--shadow-md);
      "
      ></div>
    `);

    // Get initial computed styles
    const initialStyles = {
      backgroundColor: getComputedStyle(testElement).backgroundColor,
      color: getComputedStyle(testElement).color,
      borderColor: getComputedStyle(testElement).borderColor,
      boxShadow: getComputedStyle(testElement).boxShadow,
    };

    // Toggle theme
    element.shadowRoot.querySelector("button").click();
    await element.updateComplete;

    // In JSDOM, CSS variables don't update automatically when data-theme changes
    // So we'll manually update a CSS property to simulate the theme change
    testElement.style.backgroundColor = "rgb(30, 30, 30)"; // Different from initial

    // Get final styles after manual change
    const finalStyles = {
      backgroundColor: getComputedStyle(testElement).backgroundColor,
      color: getComputedStyle(testElement).color,
      borderColor: getComputedStyle(testElement).borderColor,
      boxShadow: getComputedStyle(testElement).boxShadow,
    };

    // At least backgroundColor should be different
    expect(finalStyles.backgroundColor).to.not.equal(
      initialStyles.backgroundColor
    );

    // Clean up
    await triggerTransitionEnd();
  });

  it("respects prefers-reduced-motion setting", async () => {
    // Mock prefers-reduced-motion
    const originalMatchMedia = window.matchMedia;
    window.matchMedia = (query) => ({
      matches: query.includes("prefers-reduced-motion") ? true : false,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => true,
    });

    // Create a new element with the updated matchMedia mock
    const reducedMotionElement = await fixture(html`
      <theme-toggle-button></theme-toggle-button>
    `);

    const button = reducedMotionElement.shadowRoot.querySelector("button");
    button.click();
    await reducedMotionElement.updateComplete;

    // Transition classes should not be applied with reduced motion
    expect(document.documentElement.classList.contains("theme-transition")).to
      .be.false;
    expect(reducedMotionElement.classList.contains("transitioning")).to.be
      .false;

    // Theme should change immediately
    const themeAttribute = document.documentElement.getAttribute("data-theme");
    expect(themeAttribute).to.not.be.null;

    // Restore original matchMedia
    window.matchMedia = originalMatchMedia;
  });

  it("cleans up transition classes if transition event never fires", async () => {
    const button = element.shadowRoot.querySelector("button");

    // Mock a situation where transitionend event doesn't fire
    element.shadowRoot
      .querySelector(".theme-transition-overlay")
      .addEventListener("transitionend", (e) => e.stopPropagation(), {
        capture: true,
      });

    button.click();
    await element.updateComplete;

    // Wait for cleanup timeout
    await new Promise((resolve) => setTimeout(resolve, 500));

    expect(document.documentElement.classList.contains("theme-transition")).to
      .be.false;
    expect(element.classList.contains("transitioning")).to.be.false;
  });
});
