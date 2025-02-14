import { fixture, expect, oneEvent } from "@open-wc/testing";
import { html } from "lit";
import "../../pages/examples-page.js";

describe("Examples Page", () => {
  let element;
  const mockExamples = [
    {
      id: "basic-app",
      title: "Basic Application",
      description: "A simple starter application",
      category: "getting-started",
      difficulty: "beginner",
      tags: ["web-components", "routing", "state"],
      liveDemo: "https://demo.example.com/basic-app",
      sourceCode: "https://github.com/example/basic-app",
      author: {
        name: "John Doe",
        avatar: "john-avatar.jpg",
      },
      stats: {
        views: 1200,
        likes: 45,
        downloads: 300,
      },
    },
    {
      id: "advanced-dashboard",
      title: "Advanced Dashboard",
      description: "Complex dashboard with analytics",
      category: "applications",
      difficulty: "advanced",
      tags: ["dashboard", "charts", "real-time"],
      liveDemo: "https://demo.example.com/dashboard",
      sourceCode: "https://github.com/example/dashboard",
      author: {
        name: "Jane Smith",
        avatar: "jane-avatar.jpg",
      },
      stats: {
        views: 2500,
        likes: 120,
        downloads: 800,
      },
    },
  ];

  const mockCategories = [
    { id: "getting-started", name: "Getting Started", count: 5 },
    { id: "applications", name: "Applications", count: 8 },
    { id: "components", name: "Components", count: 12 },
  ];

  beforeEach(async () => {
    // Mock examples service
    window.examples = {
      getExamples: async () => mockExamples,
      getCategories: async () => mockCategories,
      getExampleById: async (id) => mockExamples.find((e) => e.id === id),
      likeExample: async (id) => ({ success: true }),
      downloadExample: async (id) => ({ success: true }),
      reportIssue: async (id, issue) => ({
        success: true,
        ticketId: "ISSUE-123",
      }),
    };

    element = await fixture(html`<examples-page></examples-page>`);

    // Wait for initial render and data loading
    await element.updateComplete;

    // Wait for initialization with a reasonable timeout
    const maxWaitTime = 2000; // 2 seconds should be plenty for tests
    const startTime = Date.now();

    while (!element.initialized && Date.now() - startTime < maxWaitTime) {
      await new Promise((resolve) => requestAnimationFrame(resolve));
    }

    if (!element.initialized) {
      throw new Error("Component failed to initialize within timeout period");
    }
  });

  afterEach(() => {
    // Clean up the element properly
    if (element && element.parentNode) {
      element.parentNode.removeChild(element);
    }
    element = null;
  });

  it("renders examples grid", () => {
    const grid = element.shadowRoot.querySelector(".examples-grid");
    const cards = grid.querySelectorAll(".example-card");

    expect(grid).to.exist;
    expect(cards.length).to.equal(mockExamples.length);
  });

  it("displays example details", () => {
    const firstCard = element.shadowRoot.querySelector(".example-card");
    const title = firstCard.querySelector(".example-title");
    const description = firstCard.querySelector(".example-description");
    const tags = firstCard.querySelectorAll(".example-tag");

    expect(title.textContent).to.equal(mockExamples[0].title);
    expect(description.textContent).to.equal(mockExamples[0].description);
    expect(tags.length).to.equal(mockExamples[0].tags.length);
  });

  it("shows category filters", () => {
    const filters = element.shadowRoot.querySelector(".category-filters");
    const filterButtons = filters.querySelectorAll(".category-filter");

    expect(filters).to.exist;
    expect(filterButtons.length).to.equal(mockCategories.length);
  });

  it("handles category filtering", async () => {
    const filters = element.shadowRoot.querySelectorAll(".category-filter");
    const applicationsFilter = Array.from(filters).find((f) =>
      f.textContent.includes("Applications")
    );

    applicationsFilter.click();
    await element.updateComplete;

    const visibleCards = element.shadowRoot.querySelectorAll(
      ".example-card:not(.hidden)"
    );
    expect(visibleCards.length).to.equal(1);
    expect(
      visibleCards[0].querySelector(".example-title").textContent
    ).to.equal(mockExamples[1].title);
  });

  it("supports difficulty filtering", async () => {
    const difficultySelect =
      element.shadowRoot.querySelector(".difficulty-select");
    difficultySelect.value = "advanced";
    difficultySelect.dispatchEvent(new Event("change"));
    await element.updateComplete;

    const visibleCards = element.shadowRoot.querySelectorAll(
      ".example-card:not(.hidden)"
    );
    expect(visibleCards.length).to.equal(1);
    expect(
      visibleCards[0].querySelector(".difficulty-badge").textContent
    ).to.include("advanced");
  });

  it("handles search functionality", async () => {
    const searchInput = element.shadowRoot.querySelector(".search-input");
    searchInput.value = "dashboard";
    searchInput.dispatchEvent(new Event("input"));
    await element.updateComplete;

    const visibleCards = element.shadowRoot.querySelectorAll(
      ".example-card:not(.hidden)"
    );
    expect(visibleCards.length).to.equal(1);
    expect(
      visibleCards[0].querySelector(".example-title").textContent
    ).to.include("Dashboard");
  });

  it("opens example preview", async () => {
    const firstCard = element.shadowRoot.querySelector(".example-card");
    const previewButton = firstCard.querySelector(".preview-button");

    setTimeout(() => previewButton.click());
    const { detail } = await oneEvent(element, "show-preview");

    expect(detail.exampleId).to.equal(mockExamples[0].id);
  });

  it("handles example likes", async () => {
    const firstCard = element.shadowRoot.querySelector(".example-card");
    const likeButton = firstCard.querySelector(".like-button");
    const likeCount = firstCard.querySelector(".like-count");

    likeButton.click();
    await element.updateComplete;

    expect(parseInt(likeCount.textContent)).to.equal(
      mockExamples[0].stats.likes + 1
    );
  });

  it("triggers example download", async () => {
    const firstCard = element.shadowRoot.querySelector(".example-card");
    const downloadButton = firstCard.querySelector(".download-button");

    setTimeout(() => downloadButton.click());
    const { detail } = await oneEvent(element, "download");

    expect(detail.exampleId).to.equal(mockExamples[0].id);
  });

  it("shows author information", () => {
    const firstCard = element.shadowRoot.querySelector(".example-card");
    const authorName = firstCard.querySelector(".author-name");
    const authorAvatar = firstCard.querySelector(".author-avatar");

    expect(authorName.textContent).to.equal(mockExamples[0].author.name);
    expect(authorAvatar.src).to.include(mockExamples[0].author.avatar);
  });

  it("displays example statistics", () => {
    const firstCard = element.shadowRoot.querySelector(".example-card");
    const views = firstCard.querySelector(".view-count");
    const downloads = firstCard.querySelector(".download-count");

    expect(views.textContent).to.include(
      mockExamples[0].stats.views.toString()
    );
    expect(downloads.textContent).to.include(
      mockExamples[0].stats.downloads.toString()
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
    const cards = element.shadowRoot.querySelectorAll(".example-card");
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
    const cards = element.shadowRoot.querySelectorAll(".example-card");
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
    const skeleton = element.shadowRoot.querySelector(".examples-skeleton");

    expect(loader).to.exist;
    expect(skeleton).to.exist;
  });

  it("displays error states", async () => {
    const error = "Failed to load examples";
    element.error = error;
    await element.updateComplete;

    const errorMessage = element.shadowRoot.querySelector(".error-message");
    expect(errorMessage).to.exist;
    expect(errorMessage.textContent).to.include(error);
  });

  it("supports sorting options", async () => {
    const sortSelect = element.shadowRoot.querySelector(".sort-select");
    sortSelect.value = "most-liked";
    sortSelect.dispatchEvent(new Event("change"));
    await element.updateComplete;

    const cards = element.shadowRoot.querySelectorAll(".example-card");
    const firstCardLikes = parseInt(
      cards[0].querySelector(".like-count").textContent
    );
    const secondCardLikes = parseInt(
      cards[1].querySelector(".like-count").textContent
    );

    expect(firstCardLikes).to.be.greaterThan(secondCardLikes);
  });

  it("handles issue reporting", async () => {
    const firstCard = element.shadowRoot.querySelector(".example-card");
    const reportButton = firstCard.querySelector(".report-button");

    setTimeout(() => reportButton.click());
    const { detail } = await oneEvent(element, "report-issue");

    expect(detail.exampleId).to.equal(mockExamples[0].id);
  });

  it("supports grid/list view toggle", async () => {
    const viewToggle = element.shadowRoot.querySelector(".view-toggle");
    viewToggle.click();
    await element.updateComplete;

    const container = element.shadowRoot.querySelector(".examples-container");
    expect(container.classList.contains("list-view")).to.be.true;
  });
});
