import {
  fixture,
  expect,
  oneEvent,
  waitForComponentUpdate,
  waitForShadowDom,
  TestUtils,
} from "../setup.mjs";
import {  html  } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";
import "../../pages/faq-page.js";

describe("FAQ Page", () => {
  let element;

  beforeEach(async () => {
    // Mock API service
    window.api = {
      getFAQ: vi.fn().mockResolvedValue({
        categories: [
          {
            id: "general",
            title: "General Questions",
            questions: [
              {
                id: "what-is",
                question: "What is NeoForge?",
                answer: "NeoForge is a modern web development framework.",
              },
              {
                id: "how-to-start",
                question: "How do I get started?",
                answer: "Follow our quick start guide.",
              },
            ],
          },
          {
            id: "technical",
            title: "Technical Questions",
            questions: [
              {
                id: "requirements",
                question: "What are the requirements?",
                answer: "Node.js 18+ and npm 9+",
              },
            ],
          },
        ],
      }),
    };

    element = await fixture(html`<faq-page></faq-page>`);
    await TestUtils.waitForAll(element);
  });

  it("renders FAQ sections", async () => {
    const sections = await TestUtils.queryAllComponents(
      element,
      ".faq-section"
    );
    expect(sections.length).to.equal(2);
    expect(sections[0].querySelector(".section-title").textContent).to.include(
      "General Questions"
    );
  });

  it("displays FAQ questions and answers", async () => {
    const questions = await TestUtils.queryAllComponents(
      element,
      ".faq-question"
    );
    expect(questions.length).to.equal(3);

    const firstQuestion = questions[0];
    expect(
      firstQuestion.querySelector(".question-text").textContent
    ).to.include("What is NeoForge?");
    expect(firstQuestion.querySelector(".answer-text").textContent).to.include(
      "modern web development framework"
    );
  });

  it("handles category filtering", async () => {
    const categoryFilter = await TestUtils.queryComponent(
      element,
      ".category-filter"
    );
    const technicalButton = Array.from(
      categoryFilter.querySelectorAll("button")
    ).find((button) => button.textContent.includes("Technical"));

    technicalButton.click();
    await element.updateComplete;

    const questions = await TestUtils.queryAllComponents(
      element,
      ".faq-question"
    );
    expect(questions.length).to.equal(1);
    expect(questions[0].querySelector(".question-text").textContent).to.include(
      "requirements"
    );
  });

  it("shows loading state", async () => {
    // Mock a delayed response
    window.api.getFAQ = vi.fn().mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      return { categories: [] };
    });

    element = await fixture(html`<faq-page></faq-page>`);
    const spinner = await TestUtils.queryComponent(element, "neo-spinner");
    expect(spinner).to.exist;
  });

  it("handles error state", async () => {
    // Mock an error response
    window.api.getFAQ = vi
      .fn()
      .mockRejectedValue(new Error("Failed to load FAQ"));

    element = await fixture(html`<faq-page></faq-page>`);
    await element.updateComplete;
    const errorMessage = await TestUtils.queryComponent(
      element,
      ".error-message"
    );
    expect(errorMessage).to.exist;
    expect(errorMessage.textContent).to.include("Failed to load FAQ");
  });

  it("expands and collapses questions", async () => {
    const question = await TestUtils.queryComponent(element, ".faq-question");
    const answer = question.querySelector(".answer-text");

    expect(answer).to.not.be.visible;
    question.click();
    await element.updateComplete;
    expect(answer).to.be.visible;

    question.click();
    await element.updateComplete;
    expect(answer).to.not.be.visible;
  });

  it("supports search functionality", async () => {
    const searchInput = await TestUtils.queryComponent(
      element,
      ".search-input"
    );
    searchInput.value = "requirements";
    searchInput.dispatchEvent(new Event("input"));
    await element.updateComplete;

    const questions = await TestUtils.queryAllComponents(
      element,
      ".faq-question"
    );
    expect(questions.length).to.equal(1);
    expect(questions[0].querySelector(".question-text").textContent).to.include(
      "requirements"
    );
  });

  it("handles feedback submission", async () => {
    const firstItem = element.shadowRoot.querySelector(".faq-item");
    const helpfulButton = firstItem.querySelector(".helpful-button");
    const notHelpfulButton = firstItem.querySelector(".not-helpful-button");

    setTimeout(() => helpfulButton.click());
    const { detail: helpfulDetail } = await oneEvent(
      element,
      "feedback-submit"
    );
    expect(helpfulDetail.helpful).to.be.true;

    setTimeout(() => notHelpfulButton.click());
    const { detail: notHelpfulDetail } = await oneEvent(
      element,
      "feedback-submit"
    );
    expect(notHelpfulDetail.helpful).to.be.false;
  });

  it("shows related articles", () => {
    const firstItem = element.shadowRoot.querySelector(".faq-item");
    const relatedArticles = firstItem.querySelectorAll(".related-article");

    expect(relatedArticles.length).to.equal(mockFAQs[0].relatedArticles.length);
    relatedArticles.forEach((article, index) => {
      expect(article.textContent).to.include(
        mockFAQs[0].relatedArticles[index].title
      );
    });
  });

  it("displays feedback statistics", () => {
    const firstItem = element.shadowRoot.querySelector(".faq-item");
    const helpfulCount = firstItem.querySelector(".helpful-count");
    const notHelpfulCount = firstItem.querySelector(".not-helpful-count");

    expect(helpfulCount.textContent).to.include(mockFAQs[0].helpful.toString());
    expect(notHelpfulCount.textContent).to.include(
      mockFAQs[0].notHelpful.toString()
    );
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
    const items = element.shadowRoot.querySelectorAll(".faq-item");
    items.forEach((item) => {
      const question = item.querySelector(".faq-question");
      const answer = item.querySelector(".faq-answer");

      expect(question.getAttribute("role")).to.equal("button");
      expect(question.getAttribute("aria-expanded")).to.exist;
      expect(question.getAttribute("aria-controls")).to.exist;
      expect(answer.getAttribute("role")).to.equal("region");
      expect(answer.getAttribute("aria-labelledby")).to.exist;
    });
  });

  it("supports keyboard navigation", async () => {
    const items = element.shadowRoot.querySelectorAll(".faq-item");
    const firstQuestion = items[0].querySelector(".faq-question");

    firstQuestion.focus();
    firstQuestion.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    await element.updateComplete;

    const answer = items[0].querySelector(".faq-answer");
    expect(answer.classList.contains("hidden")).to.be.false;
  });

  it("supports tag filtering", async () => {
    const tagFilters = element.shadowRoot.querySelectorAll(".tag-filter");
    const setupTag = Array.from(tagFilters).find((t) =>
      t.textContent.includes("setup")
    );

    setupTag.click();
    await element.updateComplete;

    const visibleItems = element.shadowRoot.querySelectorAll(
      ".faq-item:not(.hidden)"
    );
    expect(visibleItems.length).to.equal(1);
    expect(visibleItems[0].querySelector(".faq-question").textContent).to.equal(
      mockFAQs[1].question
    );
  });

  it("handles contact support link", async () => {
    const supportLink = element.shadowRoot.querySelector(
      ".contact-support-link"
    );

    setTimeout(() => supportLink.click());
    const { detail } = await oneEvent(element, "navigate");

    expect(detail.path).to.equal("/support");
  });

  it("supports print mode", async () => {
    // Mock print media query
    window.matchMedia = (query) => ({
      matches: query.includes("print"),
      addListener: () => {},
      removeListener: () => {},
    });

    await element.updateComplete;

    const container = element.shadowRoot.querySelector(".page-container");
    expect(container.classList.contains("print-mode")).to.be.true;

    const items = element.shadowRoot.querySelectorAll(".faq-item");
    items.forEach((item) => {
      const answer = item.querySelector(".faq-answer");
      expect(answer.classList.contains("hidden")).to.be.false;
    });
  });
});
