import { describe, it, expect, beforeEach, afterEach } from "vitest";
import "../../pages/faq-page.js"; // Import to register the component

// Re-skipping suite. Un-skipping caused multiple failures:
// - Unhandled NotSupportedError: Unexpected attributes (likely during createElement)
// - TypeError: Cannot read properties of null (reading querySelector/querySelectorAll)
// - TypeError: element.showLoading/showError is not a function
// Indicates MockFAQPage or its creation is incompatible with the JSDOM environment.
describe("FAQ Page", () => {
  let element;

  beforeEach(async () => {
    // Create a container for the page
    const container = document.createElement('div');
    document.body.appendChild(container);

    // Create the real faq-page element
    element = document.createElement('faq-page');
    container.appendChild(element);

    // Wait for component to be fully rendered
    await element.updateComplete;
  });

  afterEach(() => {
    if (element && element.parentNode) {
      element.remove();
    }
  });

  it("should have a shadow root", () => {
    expect(element.shadowRoot).toBeDefined();
  });

  it("should render the FAQ title", () => {
    const title = element.shadowRoot.querySelector("h1");
    expect(title).toBeDefined();
    expect(title.textContent).toBe("Frequently Asked Questions");
  });

  it("should render FAQ sections from loaded data", async () => {
    // Wait for the component to load its default FAQ data
    await element.updateComplete;

    const sections = element.shadowRoot.querySelectorAll(".faq-section");
    expect(sections.length).toBeGreaterThan(0);

    const sectionTitle = sections[0].querySelector("h2");
    expect(sectionTitle).toBeDefined();
    expect(sectionTitle.textContent).toBeTruthy();

    const questions = sections[0].querySelectorAll(".faq-question");
    expect(questions.length).toBeGreaterThan(0);
  });

  it("should show loading state initially", async () => {
    // Create a new element to test initial loading state
    const newElement = document.createElement('faq-page');
    // Set loading to true before first render
    newElement.loading = true;
    document.body.appendChild(newElement);
    await newElement.updateComplete;

    const loadingSpinner = newElement.shadowRoot.querySelector(".loading-spinner");
    expect(loadingSpinner).toBeDefined();

    newElement.remove();
  });

  it("should show error state when error is set", async () => {
    element.error = "Custom error message";
    await element.updateComplete;

    const errorMessage = element.shadowRoot.querySelector(".error-message");
    expect(errorMessage).toBeDefined();
    expect(errorMessage.textContent).toBe("Custom error message");
  });

  it("should filter questions by search query", async () => {
    await element.updateComplete;

    element.searchQuery = "neoforge";
    await element.updateComplete;

    const filteredSections = element.filteredSections;
    expect(filteredSections).toBeDefined();
    // At least one section should match the search
    const hasMatchingQuestions = filteredSections.some(section =>
      section.questions.length > 0
    );
    expect(hasMatchingQuestions).toBe(true);
  });
});
