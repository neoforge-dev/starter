import { fixture, expect, oneEvent } from "@open-wc/testing";
import { html } from "lit";
import "../../components/theme-toggle.js";

describe("Theme Transitions", () => {
  let element;
  let transitionDuration;

  beforeEach(async () => {
    // Get transition duration from CSS variable
    const style = getComputedStyle(document.documentElement);
    transitionDuration =
      parseFloat(style.getPropertyValue("--transition-normal")) * 1000 || 300;

    element = await fixture(html`
      <theme-toggle-button></theme-toggle-button>
    `);
  });

  it("applies transition classes when toggling theme", async () => {
    const button = element.shadowRoot.querySelector("button");

    // Click to toggle theme
    button.click();
    await element.updateComplete;

    // Check if transition classes are applied
    expect(document.documentElement.classList.contains("theme-transition")).to
      .be.true;
    expect(element.classList.contains("transitioning")).to.be.true;

    // Wait for transition to complete
    await new Promise((resolve) =>
      setTimeout(resolve, transitionDuration + 50)
    );

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

    // Check mid-transition styles (should be different from initial)
    await new Promise((resolve) => setTimeout(resolve, transitionDuration / 2));
    const midStyles = {
      backgroundColor: getComputedStyle(testElement).backgroundColor,
      color: getComputedStyle(testElement).color,
      borderColor: getComputedStyle(testElement).borderColor,
      boxShadow: getComputedStyle(testElement).boxShadow,
    };

    // At least one property should be different mid-transition
    expect(
      midStyles.backgroundColor !== initialStyles.backgroundColor ||
        midStyles.color !== initialStyles.color ||
        midStyles.borderColor !== initialStyles.borderColor ||
        midStyles.boxShadow !== initialStyles.boxShadow
    ).to.be.true;

    // Wait for transition to complete
    await new Promise((resolve) =>
      setTimeout(resolve, transitionDuration / 2 + 50)
    );

    // Final styles should be different from initial
    const finalStyles = {
      backgroundColor: getComputedStyle(testElement).backgroundColor,
      color: getComputedStyle(testElement).color,
      borderColor: getComputedStyle(testElement).borderColor,
      boxShadow: getComputedStyle(testElement).boxShadow,
    };

    expect(finalStyles).to.not.deep.equal(initialStyles);
  });

  it("respects prefers-reduced-motion setting", async () => {
    // Mock prefers-reduced-motion
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    Object.defineProperty(mediaQuery, "matches", { value: true });

    const button = element.shadowRoot.querySelector("button");
    button.click();
    await element.updateComplete;

    // Transition classes should not be applied
    expect(document.documentElement.classList.contains("theme-transition")).to
      .be.false;
    expect(element.classList.contains("transitioning")).to.be.false;

    // Theme should change immediately
    const themeAttribute = document.documentElement.getAttribute("data-theme");
    expect(themeAttribute).to.equal(element.theme);
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
    await new Promise((resolve) => setTimeout(resolve, 400));

    expect(document.documentElement.classList.contains("theme-transition")).to
      .be.false;
    expect(element.classList.contains("transitioning")).to.be.false;
  });
});
