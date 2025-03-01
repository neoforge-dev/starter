import { fixture, expect, oneEvent } from "@open-wc/testing";
import {  html  } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";
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
      createdAt: "2024-01-01T00:00:00.000Z",
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
      createdAt: "2024-01-02T00:00:00.000Z",
    },
  ];

  const mockCategories = [
    { id: "getting-started", name: "Getting Started", count: 5 },
    { id: "applications", name: "Applications", count: 8 },
    { id: "components", name: "Components", count: 12 },
  ];

  beforeEach(async () => {
    // Set up mock data
    window.mockExamples = mockExamples;
    window.mockCategories = mockCategories;

    // Mock fetch response
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            examples: mockExamples,
            categories: mockCategories,
          }),
      })
    );

    // Create the element
    element = await fixture(html`<examples-page></examples-page>`);

    // Wait for initial render
    await element.updateComplete;

    // Wait for initialization
    await new Promise((resolve) => setTimeout(resolve, 100));
  });

  afterEach(() => {
    delete window.mockExamples;
    delete window.mockCategories;
    vi.clearAllMocks();
  });

  it("renders examples grid", async () => {
    const grid = element.shadowRoot.querySelector(".examples-grid");
    expect(grid).to.exist;
    expect(grid.getAttribute("role")).to.equal("list");

    const cards = grid.querySelectorAll(".example-card");
    expect(cards.length).to.equal(mockExamples.length);
  });

  it("displays example details", async () => {
    const firstCard = element.shadowRoot.querySelector(".example-card");
    expect(firstCard).to.exist;

    const title = firstCard.querySelector(".example-title");
    const description = firstCard.querySelector(".example-description");
    const tags = firstCard.querySelectorAll(".example-tag");

    expect(title.textContent.trim()).to.equal(mockExamples[0].title);
    expect(description.textContent.trim()).to.equal(
      mockExamples[0].description
    );
    expect(tags.length).to.equal(mockExamples[0].tags.length);
  });

  it("handles search functionality", async () => {
    const searchInput = element.shadowRoot.querySelector(".search-input");
    searchInput.value = "dashboard";
    searchInput.dispatchEvent(new Event("input"));
    await element.updateComplete;

    const visibleCards = element.shadowRoot.querySelectorAll(".example-card");
    expect(visibleCards.length).to.equal(1);
    expect(
      visibleCards[0].querySelector(".example-title").textContent
    ).to.include("Dashboard");
  });

  it("handles sorting", async () => {
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

  it("handles example likes", async () => {
    const firstCard = element.shadowRoot.querySelector(".example-card");
    const likeButton = firstCard.querySelector(".like-button");
    const likeCount = firstCard.querySelector(".like-count");
    const initialLikes = parseInt(likeCount.textContent);

    likeButton.click();
    await element.updateComplete;

    expect(parseInt(likeCount.textContent)).to.equal(initialLikes + 1);
  });

  it("shows loading state", async () => {
    element.loading = true;
    await element.updateComplete;

    const loadingContainer =
      element.shadowRoot.querySelector(".loading-container");
    expect(loadingContainer).to.exist;
    expect(loadingContainer.querySelector(".loading-indicator")).to.exist;
  });

  it("shows error state", async () => {
    element.error = "Failed to load examples";
    await element.updateComplete;

    const errorContainer = element.shadowRoot.querySelector(".error-container");
    expect(errorContainer).to.exist;
    expect(errorContainer.textContent).to.include("Failed to load examples");
  });

  it("maintains accessibility attributes", async () => {
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
});
