import { fixture, expect, oneEvent } from "@open-wc/testing";
import { html } from "lit";
import "../../pages/404-page.js";

describe("404 Page", () => {
  let element;

  beforeEach(async () => {
    // Mock router service
    window.router = {
      navigate: async (path) => ({ success: true }),
      getPreviousRoute: () => "/previous-page",
      getRequestedPath: () => "/non-existent-page",
    };

    element = await fixture(html`<not-found-page></not-found-page>`);
    await element.updateComplete;
  });

  it("renders 404 content", () => {
    const title = element.shadowRoot.querySelector(".error-title");
    const message = element.shadowRoot.querySelector(".error-message");
    const illustration = element.shadowRoot.querySelector(
      ".error-illustration"
    );

    expect(title).to.exist;
    expect(message).to.exist;
    expect(illustration).to.exist;
    expect(title.textContent).to.include("404");
  });

  it("displays requested path", () => {
    const requestedPath = element.shadowRoot.querySelector(".requested-path");
    expect(requestedPath.textContent).to.include("/non-existent-page");
  });

  it("shows suggested pages", () => {
    const suggestions = element.shadowRoot.querySelector(".page-suggestions");
    const links = suggestions.querySelectorAll("a");

    expect(suggestions).to.exist;
    expect(links.length).to.be.greaterThan(0);
  });

  it("handles home navigation", async () => {
    const homeButton = element.shadowRoot.querySelector(".home-button");

    setTimeout(() => homeButton.click());
    const { detail } = await oneEvent(element, "navigate");

    expect(detail.path).to.equal("/");
  });

  it("supports back navigation", async () => {
    const backButton = element.shadowRoot.querySelector(".back-button");

    setTimeout(() => backButton.click());
    const { detail } = await oneEvent(element, "navigate");

    expect(detail.path).to.equal("/previous-page");
  });

  it("handles search functionality", async () => {
    const searchInput = element.shadowRoot.querySelector(".search-input");
    const searchButton = element.shadowRoot.querySelector(".search-button");

    searchInput.value = "test search";
    setTimeout(() => searchButton.click());
    const { detail } = await oneEvent(element, "search");

    expect(detail.query).to.equal("test search");
  });

  it("shows search suggestions", async () => {
    const searchInput = element.shadowRoot.querySelector(".search-input");

    searchInput.value = "test";
    searchInput.dispatchEvent(new Event("input"));
    await element.updateComplete;

    const suggestions = element.shadowRoot.querySelector(".search-suggestions");
    expect(suggestions).to.exist;
    expect(suggestions.children.length).to.be.greaterThan(0);
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
    const main = element.shadowRoot.querySelector("main");
    expect(main.getAttribute("role")).to.equal("main");

    const buttons = element.shadowRoot.querySelectorAll("button");
    buttons.forEach((button) => {
      expect(button.getAttribute("aria-label")).to.exist;
    });

    const links = element.shadowRoot.querySelectorAll("a");
    links.forEach((link) => {
      expect(link.getAttribute("aria-label")).to.exist;
    });
  });

  it("supports keyboard navigation", async () => {
    const buttons = element.shadowRoot.querySelectorAll("button");
    const firstButton = buttons[0];

    firstButton.focus();
    firstButton.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab" }));
    await element.updateComplete;

    expect(document.activeElement).to.equal(buttons[1]);
  });

  it("handles animation states", async () => {
    const illustration = element.shadowRoot.querySelector(
      ".error-illustration"
    );

    // Test animation start
    element.startAnimation();
    await element.updateComplete;
    expect(illustration.classList.contains("animate")).to.be.true;

    // Test animation end
    element.stopAnimation();
    await element.updateComplete;
    expect(illustration.classList.contains("animate")).to.be.false;
  });

  it("supports reduced motion preferences", async () => {
    // Mock reduced motion preference
    window.matchMedia = (query) => ({
      matches: query.includes("reduced-motion"),
      addListener: () => {},
      removeListener: () => {},
    });

    await element.updateComplete;

    const illustration = element.shadowRoot.querySelector(
      ".error-illustration"
    );
    expect(illustration.classList.contains("no-animation")).to.be.true;
  });

  it("handles error reporting", async () => {
    const reportButton = element.shadowRoot.querySelector(".report-button");

    setTimeout(() => reportButton.click());
    const { detail } = await oneEvent(element, "report-error");

    expect(detail.path).to.equal("/non-existent-page");
    expect(detail.timestamp).to.exist;
  });

  it("displays related content", () => {
    const relatedContent = element.shadowRoot.querySelector(".related-content");
    const contentItems = relatedContent.querySelectorAll(".content-item");

    expect(relatedContent).to.exist;
    expect(contentItems.length).to.be.greaterThan(0);
  });

  it("supports dark mode", async () => {
    element.darkMode = true;
    await element.updateComplete;

    const container = element.shadowRoot.querySelector(".page-container");
    expect(container.classList.contains("dark")).to.be.true;
  });

  it("handles contact support link", async () => {
    const supportLink = element.shadowRoot.querySelector(".support-link");

    setTimeout(() => supportLink.click());
    const { detail } = await oneEvent(element, "navigate");

    expect(detail.path).to.equal("/support");
  });

  it("shows browser information", () => {
    const browserInfo = element.shadowRoot.querySelector(".browser-info");
    expect(browserInfo).to.exist;
    expect(browserInfo.textContent).to.include(navigator.userAgent);
  });

  it("maintains scroll position on resize", async () => {
    const container = element.shadowRoot.querySelector(".page-container");
    container.scrollTop = 100;

    // Trigger resize
    window.dispatchEvent(new Event("resize"));
    await element.updateComplete;

    expect(container.scrollTop).to.equal(100);
  });

  it("supports custom error messages", async () => {
    element.customMessage = "Custom error message";
    await element.updateComplete;

    const message = element.shadowRoot.querySelector(".error-message");
    expect(message.textContent).to.include("Custom error message");
  });
});
