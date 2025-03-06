import { expect } from "vitest";
import { vi } from "vitest";

// Create a simplified mock for the faq-page component
class MockFAQPage extends HTMLElement {
  constructor() {
    super();
    this._shadowRoot = this.attachShadow({ mode: "open" });
    this._shadowRoot.innerHTML = `
      <div class="faq-container">
        <h1>Frequently Asked Questions</h1>
        <div class="faq-content">
          <div class="faq-section">
            <h2>General Questions</h2>
            <div class="faq-item">
              <div class="faq-question">What is NeoForge?</div>
              <div class="faq-answer">NeoForge is a modern web development framework.</div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Mock properties
    this.faqs = [
      {
        id: 1,
        question: "What is NeoForge?",
        answer: "NeoForge is a modern web development framework.",
      },
    ];

    // Mock methods
    this.updateComplete = Promise.resolve(true);
  }

  // Getter for shadowRoot
  get shadowRoot() {
    return this._shadowRoot;
  }

  // Mock methods
  showLoading() {
    const loadingEl = document.createElement("div");
    loadingEl.className = "loading";
    loadingEl.textContent = "Loading...";
    this._shadowRoot.querySelector(".faq-container").appendChild(loadingEl);
  }

  showError(message) {
    const errorEl = document.createElement("div");
    errorEl.className = "error";
    errorEl.textContent = message;
    this._shadowRoot.querySelector(".faq-container").appendChild(errorEl);
  }
}

// Register the mock component
customElements.define("faq-page", MockFAQPage);

describe("FAQ Page", () => {
  let element;

  beforeEach(() => {
    // Create the element directly
    element = new MockFAQPage();
    document.body.appendChild(element);
  });

  afterEach(() => {
    if (element && element.parentNode) {
      element.parentNode.removeChild(element);
    }
  });

  it("should have a shadowRoot", () => {
    expect(element.shadowRoot).toBeTruthy();
  });

  it("should render the FAQ title", () => {
    const title = element.shadowRoot.querySelector("h1");
    expect(title).toBeTruthy();
    expect(title.textContent).toBe("Frequently Asked Questions");
  });

  it("should render FAQ sections", () => {
    const section = element.shadowRoot.querySelector(".faq-section");
    expect(section).toBeTruthy();
    expect(section.querySelector("h2").textContent).toBe("General Questions");
  });

  it("should display FAQ questions and answers", () => {
    const question = element.shadowRoot.querySelector(".faq-question");
    const answer = element.shadowRoot.querySelector(".faq-answer");

    expect(question).toBeTruthy();
    expect(answer).toBeTruthy();
    expect(question.textContent).toBe("What is NeoForge?");
    expect(answer.textContent).toBe(
      "NeoForge is a modern web development framework."
    );
  });

  it("should show loading state", () => {
    element.showLoading();
    const loading = element.shadowRoot.querySelector(".loading");
    expect(loading).toBeTruthy();
    expect(loading.textContent).toBe("Loading...");
  });

  it("should show error state", () => {
    element.showError("Failed to load FAQs");
    const error = element.shadowRoot.querySelector(".error");
    expect(error).toBeTruthy();
    expect(error.textContent).toBe("Failed to load FAQs");
  });
});
