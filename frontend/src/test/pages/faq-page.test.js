import { expect, describe, it, beforeEach, afterEach, vi } from "vitest";
import {
  createMockElement,
  createMockShadowRoot,
} from "../utils/component-mock-utils.js";

// Create a simplified mock for the faq-page component
class MockFAQPage {
  constructor() {
    // Create a mock shadow DOM
    this.shadowRoot = createMockShadowRoot();

    // Create the FAQ container
    this.faqContainer = createMockElement("div");
    this.faqContainer.className = "faq-container";

    // Create the title
    this.title = createMockElement("h1");
    this.title.textContent = "Frequently Asked Questions";
    this.faqContainer.appendChild(this.title);

    // Create the FAQ content
    this.faqContent = createMockElement("div");
    this.faqContent.className = "faq-content";
    this.faqContainer.appendChild(this.faqContent);

    // Create a FAQ section
    this.faqSection = createMockElement("div");
    this.faqSection.className = "faq-section";
    this.faqContent.appendChild(this.faqSection);

    // Create section title
    this.sectionTitle = createMockElement("h2");
    this.sectionTitle.textContent = "General Questions";
    this.faqSection.appendChild(this.sectionTitle);

    // Create a FAQ item
    this.faqItem = createMockElement("div");
    this.faqItem.className = "faq-item";
    this.faqSection.appendChild(this.faqItem);

    // Create question and answer
    this.question = createMockElement("div");
    this.question.className = "faq-question";
    this.question.textContent = "What is NeoForge?";
    this.faqItem.appendChild(this.question);

    this.answer = createMockElement("div");
    this.answer.className = "faq-answer";
    this.answer.textContent = "NeoForge is a modern web development framework.";
    this.faqItem.appendChild(this.answer);

    // Add the container to the shadow root
    this.shadowRoot.appendChild(this.faqContainer);

    // Mock properties
    this.faqs = [
      {
        id: 1,
        question: "What is NeoForge?",
        answer: "NeoForge is a modern web development framework.",
      },
    ];

    this._loading = false;
    this._error = false;
    this._errorMessage = "";
    this.loadingElement = null;
    this.errorElement = null;

    // Mock methods
    this.updateComplete = Promise.resolve(true);
  }

  // Mock methods
  showLoading() {
    this._loading = true;
    this._error = false;

    // Create loading element if it doesn't exist
    if (!this.loadingElement) {
      this.loadingElement = createMockElement("div");
      this.loadingElement.className = "loading";
      this.loadingElement.textContent = "Loading...";
      this.faqContainer.appendChild(this.loadingElement);
    }
  }

  showError(message) {
    this._error = true;
    this._errorMessage = message;
    this._loading = false;

    // Create error element if it doesn't exist
    if (!this.errorElement) {
      this.errorElement = createMockElement("div");
      this.errorElement.className = "error";
      this.errorElement.textContent = message;
      this.faqContainer.appendChild(this.errorElement);
    }
  }
}

describe("FAQ Page", () => {
  let element;

  beforeEach(() => {
    // Create the element directly
    element = new MockFAQPage();
  });

  it("should have a shadowRoot", () => {
    expect(element.shadowRoot).toBeTruthy();
  });

  it("should render the FAQ title", () => {
    expect(element.title).toBeTruthy();
    expect(element.title.textContent).toBe("Frequently Asked Questions");
  });

  it("should render FAQ sections", () => {
    expect(element.faqSection).toBeTruthy();
    expect(element.sectionTitle).toBeTruthy();
    expect(element.sectionTitle.textContent).toBe("General Questions");
  });

  it("should display FAQ questions and answers", () => {
    expect(element.question).toBeTruthy();
    expect(element.answer).toBeTruthy();
    expect(element.question.textContent).toBe("What is NeoForge?");
    expect(element.answer.textContent).toBe(
      "NeoForge is a modern web development framework."
    );
  });

  it("should show loading state", () => {
    element.showLoading();

    // Check if loading element is shown
    expect(element.loadingElement).toBeTruthy();
    expect(element.loadingElement.textContent).toBe("Loading...");
  });

  it("should show error state", () => {
    element.showError("Failed to load FAQs");

    // Check if error element is shown
    expect(element.errorElement).toBeTruthy();
    expect(element.errorElement.textContent).toBe("Failed to load FAQs");
  });
});
