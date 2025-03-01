import { fixture, expect, oneEvent } from "@open-wc/testing";
import {  html  } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";
import "../../pages/components-page.js";

describe("Components Page", () => {
  let element;

  beforeEach(async () => {
    element = await fixture(html`<components-page></components-page>`);
  });

  it("renders the page title and description", () => {
    const title = element.shadowRoot.querySelector("h1");
    const description = element.shadowRoot.querySelector(".page-description");

    expect(title).to.exist;
    expect(title.textContent).to.include("Components");
    expect(description).to.exist;
  });

  it("displays component categories", () => {
    const categories = element.shadowRoot.querySelectorAll(
      ".component-category"
    );
    expect(categories.length).to.be.greaterThan(0);
  });

  it("shows component details when category is selected", async () => {
    const category = element.shadowRoot.querySelector(".component-category");
    category.click();
    await element.updateComplete;

    const details = element.shadowRoot.querySelector(".component-details");
    expect(details).to.exist;
    expect(details.classList.contains("active")).to.be.true;
  });

  it("displays code examples for components", () => {
    const codeExamples = element.shadowRoot.querySelectorAll("code-example");
    expect(codeExamples.length).to.be.greaterThan(0);
  });

  it("handles tab switching", async () => {
    const tabs = element.shadowRoot.querySelectorAll(".tab");
    const secondTab = tabs[1];

    secondTab.click();
    await element.updateComplete;

    expect(element.activeTab).to.equal(secondTab.dataset.tab);
    expect(secondTab.classList.contains("active")).to.be.true;
  });

  it("shows component documentation", () => {
    const docs = element.shadowRoot.querySelector(".component-docs");
    expect(docs).to.exist;

    const properties = docs.querySelectorAll(".component-property");
    expect(properties.length).to.be.greaterThan(0);
  });

  it("displays interactive examples", async () => {
    const example = element.shadowRoot.querySelector(".interactive-example");
    expect(example).to.exist;

    // Test interaction
    const button = example.querySelector("button");
    setTimeout(() => button.click());
    const { detail } = await oneEvent(example, "example-event");
    expect(detail).to.exist;
  });

  it("shows component variants", () => {
    const variants = element.shadowRoot.querySelectorAll(".component-variant");
    expect(variants.length).to.be.greaterThan(0);
  });

  it("handles search filtering", async () => {
    const searchInput = element.shadowRoot.querySelector(".search-input");
    const searchTerm = "button";

    searchInput.value = searchTerm;
    searchInput.dispatchEvent(new Event("input"));
    await element.updateComplete;

    const visibleComponents = element.shadowRoot.querySelectorAll(
      ".component-item:not(.hidden)"
    );
    visibleComponents.forEach((component) => {
      expect(component.textContent.toLowerCase()).to.include(searchTerm);
    });
  });

  it("maintains scroll position on tab switch", async () => {
    const container = element.shadowRoot.querySelector(".content-container");
    const scrollPosition = 100;

    container.scrollTop = scrollPosition;
    const tab = element.shadowRoot.querySelector(".tab:not(.active)");
    tab.click();
    await element.updateComplete;

    expect(container.scrollTop).to.equal(scrollPosition);
  });

  it("supports keyboard navigation", async () => {
    const firstCategory = element.shadowRoot.querySelector(
      ".component-category"
    );
    firstCategory.focus();

    // Test arrow key navigation
    firstCategory.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowDown" })
    );
    await element.updateComplete;

    const secondCategory = element.shadowRoot.querySelectorAll(
      ".component-category"
    )[1];
    expect(document.activeElement).to.equal(secondCategory);
  });

  it("handles mobile responsive layout", async () => {
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

  it("loads component examples asynchronously", async () => {
    const loadingIndicator =
      element.shadowRoot.querySelector(".loading-indicator");
    expect(loadingIndicator).to.exist;

    // Wait for examples to load
    await element.updateComplete;
    expect(loadingIndicator.classList.contains("hidden")).to.be.true;
  });

  it("maintains accessibility attributes", () => {
    const tabs = element.shadowRoot.querySelector('[role="tablist"]');
    expect(tabs).to.exist;

    const searchInput = element.shadowRoot.querySelector(".search-input");
    expect(searchInput.getAttribute("aria-label")).to.exist;

    const examples = element.shadowRoot.querySelectorAll('[role="region"]');
    expect(examples.length).to.be.greaterThan(0);
  });
});
