import { fixture, expect, oneEvent } from "@open-wc/testing";
import { html } from "lit";
import "../../pages/tutorials-page.js";

describe("Tutorials Page", () => {
  let element;
  const mockTutorials = [
    {
      id: "getting-started",
      title: "Getting Started with NeoForge",
      description: "Learn the basics of NeoForge development",
      category: "fundamentals",
      difficulty: "beginner",
      duration: "30 min",
      author: {
        name: "John Doe",
        avatar: "john-avatar.jpg",
        role: "Lead Developer",
      },
      sections: [
        {
          id: "setup",
          title: "Setup Environment",
          content: "# Setup\nFirst, install the required dependencies...",
          duration: "5 min",
        },
        {
          id: "first-component",
          title: "Create First Component",
          content: "# Components\nLets create our first component...",
          duration: "10 min",
        },
      ],
      prerequisites: ["Basic JavaScript", "HTML/CSS"],
      tags: ["web-components", "basics"],
      stats: {
        views: 1500,
        completions: 800,
        rating: 4.8,
      },
    },
    {
      id: "advanced-patterns",
      title: "Advanced Design Patterns",
      description: "Deep dive into advanced patterns",
      category: "advanced",
      difficulty: "expert",
      duration: "60 min",
      author: {
        name: "Jane Smith",
        avatar: "jane-avatar.jpg",
        role: "Senior Developer",
      },
      sections: [
        {
          id: "patterns-intro",
          title: "Introduction to Patterns",
          content: "# Patterns\nUnderstanding design patterns...",
          duration: "15 min",
        },
      ],
      prerequisites: ["JavaScript", "Web Components", "Basic Patterns"],
      tags: ["patterns", "architecture"],
      stats: {
        views: 800,
        completions: 300,
        rating: 4.9,
      },
    },
  ];

  const mockCategories = [
    { id: "fundamentals", name: "Fundamentals", count: 10 },
    { id: "advanced", name: "Advanced", count: 5 },
    { id: "best-practices", name: "Best Practices", count: 8 },
  ];

  beforeEach(async () => {
    // Mock tutorials service
    window.tutorials = {
      getTutorials: async () => mockTutorials,
      getCategories: async () => mockCategories,
      getTutorialById: async (id) => mockTutorials.find((t) => t.id === id),
      markComplete: async (id, sectionId) => ({ success: true }),
      submitRating: async (id, rating) => ({ success: true }),
      trackProgress: async (id, progress) => ({ success: true }),
    };

    element = await fixture(html`<tutorials-page></tutorials-page>`);
    await element.updateComplete;
  });

  it("renders tutorials list", () => {
    const list = element.shadowRoot.querySelector(".tutorials-list");
    const cards = list.querySelectorAll(".tutorial-card");

    expect(list).to.exist;
    expect(cards.length).to.equal(mockTutorials.length);
  });

  it("displays tutorial details", () => {
    const firstCard = element.shadowRoot.querySelector(".tutorial-card");
    const title = firstCard.querySelector(".tutorial-title");
    const description = firstCard.querySelector(".tutorial-description");
    const duration = firstCard.querySelector(".duration");

    expect(title.textContent).to.equal(mockTutorials[0].title);
    expect(description.textContent).to.equal(mockTutorials[0].description);
    expect(duration.textContent).to.include(mockTutorials[0].duration);
  });

  it("shows category filters", () => {
    const filters = element.shadowRoot.querySelector(".category-filters");
    const filterButtons = filters.querySelectorAll(".category-filter");

    expect(filters).to.exist;
    expect(filterButtons.length).to.equal(mockCategories.length);
  });

  it("handles category filtering", async () => {
    const filters = element.shadowRoot.querySelectorAll(".category-filter");
    const advancedFilter = Array.from(filters).find((f) =>
      f.textContent.includes("Advanced")
    );

    advancedFilter.click();
    await element.updateComplete;

    const visibleCards = element.shadowRoot.querySelectorAll(
      ".tutorial-card:not(.hidden)"
    );
    expect(visibleCards.length).to.equal(1);
    expect(
      visibleCards[0].querySelector(".tutorial-title").textContent
    ).to.equal(mockTutorials[1].title);
  });

  it("supports difficulty filtering", async () => {
    const difficultySelect =
      element.shadowRoot.querySelector(".difficulty-select");
    difficultySelect.value = "expert";
    difficultySelect.dispatchEvent(new Event("change"));
    await element.updateComplete;

    const visibleCards = element.shadowRoot.querySelectorAll(
      ".tutorial-card:not(.hidden)"
    );
    expect(visibleCards.length).to.equal(1);
    expect(
      visibleCards[0].querySelector(".difficulty-badge").textContent
    ).to.include("expert");
  });

  it("handles search functionality", async () => {
    const searchInput = element.shadowRoot.querySelector(".search-input");
    searchInput.value = "patterns";
    searchInput.dispatchEvent(new Event("input"));
    await element.updateComplete;

    const visibleCards = element.shadowRoot.querySelectorAll(
      ".tutorial-card:not(.hidden)"
    );
    expect(visibleCards.length).to.equal(1);
    expect(
      visibleCards[0].querySelector(".tutorial-title").textContent
    ).to.include("Patterns");
  });

  it("opens tutorial content", async () => {
    const firstCard = element.shadowRoot.querySelector(".tutorial-card");
    const startButton = firstCard.querySelector(".start-button");

    startButton.click();
    await element.updateComplete;

    const content = element.shadowRoot.querySelector(".tutorial-content");
    const sections = content.querySelectorAll(".tutorial-section");

    expect(content).to.exist;
    expect(sections.length).to.equal(mockTutorials[0].sections.length);
  });

  it("tracks section completion", async () => {
    const firstCard = element.shadowRoot.querySelector(".tutorial-card");
    const startButton = firstCard.querySelector(".start-button");

    startButton.click();
    await element.updateComplete;

    const firstSection = element.shadowRoot.querySelector(".tutorial-section");
    const completeButton = firstSection.querySelector(".complete-button");

    setTimeout(() => completeButton.click());
    const { detail } = await oneEvent(element, "section-complete");

    expect(detail.tutorialId).to.equal(mockTutorials[0].id);
    expect(detail.sectionId).to.equal(mockTutorials[0].sections[0].id);
  });

  it("shows progress indicators", () => {
    const firstCard = element.shadowRoot.querySelector(".tutorial-card");
    const progress = firstCard.querySelector(".progress-indicator");
    const progressText = progress.querySelector(".progress-text");

    expect(progress).to.exist;
    expect(progressText.textContent).to.include(
      Math.round(
        (mockTutorials[0].stats.completions / mockTutorials[0].stats.views) *
          100
      )
    );
  });

  it("displays author information", () => {
    const firstCard = element.shadowRoot.querySelector(".tutorial-card");
    const authorName = firstCard.querySelector(".author-name");
    const authorRole = firstCard.querySelector(".author-role");
    const authorAvatar = firstCard.querySelector(".author-avatar");

    expect(authorName.textContent).to.equal(mockTutorials[0].author.name);
    expect(authorRole.textContent).to.equal(mockTutorials[0].author.role);
    expect(authorAvatar.src).to.include(mockTutorials[0].author.avatar);
  });

  it("shows prerequisites", () => {
    const firstCard = element.shadowRoot.querySelector(".tutorial-card");
    const prerequisites = firstCard.querySelectorAll(".prerequisite-item");

    expect(prerequisites.length).to.equal(
      mockTutorials[0].prerequisites.length
    );
    prerequisites.forEach((item, index) => {
      expect(item.textContent).to.equal(mockTutorials[0].prerequisites[index]);
    });
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
    const cards = element.shadowRoot.querySelectorAll(".tutorial-card");
    cards.forEach((card) => {
      expect(card.getAttribute("role")).to.equal("article");
      expect(card.getAttribute("aria-labelledby")).to.exist;
    });

    const buttons = element.shadowRoot.querySelectorAll("button");
    buttons.forEach((button) => {
      expect(button.getAttribute("aria-label")).to.exist;
    });
  });

  it("supports keyboard navigation", async () => {
    const cards = element.shadowRoot.querySelectorAll(".tutorial-card");
    const firstCard = cards[0];

    firstCard.focus();
    firstCard.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowRight" })
    );
    await element.updateComplete;

    expect(document.activeElement).to.equal(cards[1]);
  });

  it("handles loading states", async () => {
    element.loading = true;
    await element.updateComplete;

    const loader = element.shadowRoot.querySelector(".loading-indicator");
    const skeleton = element.shadowRoot.querySelector(".tutorials-skeleton");

    expect(loader).to.exist;
    expect(skeleton).to.exist;
  });

  it("displays error states", async () => {
    const error = "Failed to load tutorials";
    element.error = error;
    await element.updateComplete;

    const errorMessage = element.shadowRoot.querySelector(".error-message");
    expect(errorMessage).to.exist;
    expect(errorMessage.textContent).to.include(error);
  });

  it("supports tutorial rating", async () => {
    const firstCard = element.shadowRoot.querySelector(".tutorial-card");
    const ratingStars = firstCard.querySelectorAll(".rating-star");
    const fourthStar = ratingStars[3];

    setTimeout(() => fourthStar.click());
    const { detail } = await oneEvent(element, "tutorial-rate");

    expect(detail.tutorialId).to.equal(mockTutorials[0].id);
    expect(detail.rating).to.equal(4);
  });

  it("handles tutorial bookmarking", async () => {
    const firstCard = element.shadowRoot.querySelector(".tutorial-card");
    const bookmarkButton = firstCard.querySelector(".bookmark-button");

    bookmarkButton.click();
    await element.updateComplete;

    expect(bookmarkButton.classList.contains("bookmarked")).to.be.true;
    expect(localStorage.getItem("bookmarked_tutorials")).to.include(
      mockTutorials[0].id
    );
  });
});
