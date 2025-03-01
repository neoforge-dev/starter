import { fixture, html, expect, waitUntil } from "@open-wc/testing";
import { aTimeout } from "@open-wc/testing-helpers";

export class BaseComponentTest {
  constructor() {
    this.element = null;
    this.fixtureContainer = null;
  }

  async setup(template) {
    this.fixtureContainer = await fixture(template);
    this.element =
      this.fixtureContainer.querySelector("*") || this.fixtureContainer;
    await this.element.updateComplete;
    return this.element;
  }

  async teardown() {
    this.element = null;
    this.fixtureContainer = null;
  }

  // Utility methods
  async waitForUpdate() {
    await this.element.updateComplete;
    await aTimeout(0);
  }

  async waitForEvent(eventName, timeout = 1000) {
    return waitUntil(
      () =>
        new Promise((resolve) => {
          const handler = (event) => {
            this.element.removeEventListener(eventName, handler);
            resolve(event);
          };
          this.element.addEventListener(eventName, handler);
        }),
      "Event never fired",
      { timeout }
    );
  }

  // DOM query helpers
  query(selector) {
    return this.element.shadowRoot
      ? this.element.shadowRoot.querySelector(selector)
      : this.element.querySelector(selector);
  }

  queryAll(selector) {
    return this.element.shadowRoot
      ? this.element.shadowRoot.querySelectorAll(selector)
      : this.element.querySelectorAll(selector);
  }

  // Event simulation
  async click(selector) {
    const element = this.query(selector);
    if (!element) throw new Error(`Element not found: ${selector}`);
    element.click();
    await this.waitForUpdate();
  }

  async type(selector, value) {
    const element = this.query(selector);
    if (!element) throw new Error(`Element not found: ${selector}`);
    element.value = value;
    element.dispatchEvent(new Event("input"));
    element.dispatchEvent(new Event("change"));
    await this.waitForUpdate();
  }

  // Accessibility helpers
  async assertAccessible() {
    await expect(this.element).to.be.accessible();
  }

  async assertAriaLabel(selector, expectedLabel) {
    const element = this.query(selector);
    expect(element.getAttribute("aria-label")).to.equal(expectedLabel);
  }

  async assertAriaExpanded(selector, expectedValue) {
    const element = this.query(selector);
    expect(element.getAttribute("aria-expanded")).to.equal(
      expectedValue.toString()
    );
  }

  // Style assertions
  async assertComputedStyle(selector, property, expectedValue) {
    const element = this.query(selector);
    const computedStyle = getComputedStyle(element);
    expect(computedStyle[property]).to.equal(expectedValue);
  }

  async assertVisible(selector) {
    const element = this.query(selector);
    const computedStyle = getComputedStyle(element);
    expect(computedStyle.display).to.not.equal("none");
    expect(computedStyle.visibility).to.not.equal("hidden");
    expect(element.offsetHeight).to.be.above(0);
  }

  async assertHidden(selector) {
    const element = this.query(selector);
    const computedStyle = getComputedStyle(element);
    const isHidden =
      computedStyle.display === "none" ||
      computedStyle.visibility === "hidden" ||
      element.offsetHeight === 0;
    expect(isHidden).to.be.true;
  }

  // Mock helpers
  mockFetch(responseData) {
    window.__mockFetchResponse = async () => ({
      ok: true,
      status: 200,
      json: async () => responseData,
      text: async () => JSON.stringify(responseData),
    });
  }

  mockFetchError(status = 500, message = "Internal Server Error") {
    window.__mockFetchResponse = async () => ({
      ok: false,
      status,
      statusText: message,
      json: async () => ({ error: message }),
      text: async () => message,
    });
  }

  // Responsive testing helpers
  async setViewport(width, height) {
    Object.defineProperty(window, "innerWidth", { value: width });
    Object.defineProperty(window, "innerHeight", { value: height });
    window.dispatchEvent(new Event("resize"));
    await this.waitForUpdate();
  }

  async setMediaQuery(query, matches) {
    window.matchMedia = (q) => ({
      matches: q === query ? matches : false,
      media: q,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => {},
    });
    window.dispatchEvent(new Event("resize"));
    await this.waitForUpdate();
  }
}
