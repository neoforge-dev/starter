import { fixture, expect, oneEvent } from "@open-wc/testing";
import { html } from "lit";
import "../../pages/faq-page.js";

describe("FAQ Page", () => {
  let element;
  const mockFAQs = [
    {
      id: "1",
      question: "What is NeoForge?",
      answer: "NeoForge is a modern web development framework...",
      category: "general",
      tags: ["basics", "introduction"],
      helpful: 45,
      notHelpful: 5,
      relatedArticles: [
        { id: "2", title: "Getting Started" },
        { id: "3", title: "Core Concepts" },
      ],
    },
    {
      id: "2",
      question: "How do I install NeoForge?",
      answer: "You can install NeoForge using npm...",
      category: "installation",
      tags: ["setup", "installation"],
      helpful: 120,
      notHelpful: 8,
      relatedArticles: [
        { id: "4", title: "Dependencies" },
        { id: "5", title: "Configuration" },
      ],
    },
  ];

  const mockCategories = [
    { id: "general", name: "General", count: 10 },
    { id: "installation", name: "Installation", count: 5 },
    { id: "troubleshooting", name: "Troubleshooting", count: 15 },
  ];

  beforeEach(async () => {
    // Mock FAQ service
    window.faq = {
      getFAQs: async () => mockFAQs,
      getCategories: async () => mockCategories,
      getFAQById: async (id) => mockFAQs.find((f) => f.id === id),
      submitFeedback: async (id, helpful) => ({ success: true }),
      searchFAQs: async (query) =>
        mockFAQs.filter(
          (f) =>
            f.question.toLowerCase().includes(query.toLowerCase()) ||
            f.answer.toLowerCase().includes(query.toLowerCase())
        ),
    };

    element = await fixture(html`<faq-page></faq-page>`);
    await element.updateComplete;
  });

  it("renders FAQ sections", () => {
    const list = element.shadowRoot.querySelector(".faq-list");
    const items = list.querySelectorAll(".faq-item");
    const categories = element.shadowRoot.querySelector(".category-list");

    expect(list).to.exist;
    expect(items.length).to.equal(mockFAQs.length);
    expect(categories).to.exist;
  });

  it("displays FAQ questions and answers", () => {
    const firstItem = element.shadowRoot.querySelector(".faq-item");
    const question = firstItem.querySelector(".faq-question");
    const answer = firstItem.querySelector(".faq-answer");

    expect(question.textContent).to.equal(mockFAQs[0].question);
    expect(answer.textContent).to.equal(mockFAQs[0].answer);
  });

  it("handles category filtering", async () => {
    const categoryButtons =
      element.shadowRoot.querySelectorAll(".category-button");
    const installationButton = Array.from(categoryButtons).find((b) =>
      b.textContent.includes("Installation")
    );

    installationButton.click();
    await element.updateComplete;

    const visibleItems = element.shadowRoot.querySelectorAll(
      ".faq-item:not(.hidden)"
    );
    expect(visibleItems.length).to.equal(1);
    expect(visibleItems[0].querySelector(".faq-question").textContent).to.equal(
      mockFAQs[1].question
    );
  });

  it("supports search functionality", async () => {
    const searchInput = element.shadowRoot.querySelector(".search-input");
    searchInput.value = "install";
    searchInput.dispatchEvent(new Event("input"));
    await element.updateComplete;

    const visibleItems = element.shadowRoot.querySelectorAll(
      ".faq-item:not(.hidden)"
    );
    expect(visibleItems.length).to.equal(1);
    expect(
      visibleItems[0].querySelector(".faq-question").textContent
    ).to.include("install");
  });

  it("expands and collapses FAQ items", async () => {
    const firstItem = element.shadowRoot.querySelector(".faq-item");
    const question = firstItem.querySelector(".faq-question");
    const answer = firstItem.querySelector(".faq-answer");

    // Initially collapsed
    expect(answer.classList.contains("hidden")).to.be.true;

    // Expand
    question.click();
    await element.updateComplete;
    expect(answer.classList.contains("hidden")).to.be.false;

    // Collapse
    question.click();
    await element.updateComplete;
    expect(answer.classList.contains("hidden")).to.be.true;
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

  it("handles loading states", async () => {
    element.loading = true;
    await element.updateComplete;

    const loader = element.shadowRoot.querySelector(".loading-indicator");
    const skeleton = element.shadowRoot.querySelector(".faq-skeleton");

    expect(loader).to.exist;
    expect(skeleton).to.exist;
  });

  it("displays error states", async () => {
    const error = "Failed to load FAQs";
    element.error = error;
    await element.updateComplete;

    const errorMessage = element.shadowRoot.querySelector(".error-message");
    expect(errorMessage).to.exist;
    expect(errorMessage.textContent).to.include(error);
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
