import { fixture, expect, oneEvent } from "@open-wc/testing";
import { html } from "lit";
import "../../pages/search-page.js";

describe("Search Page", () => {
  let element;
  const mockResults = {
    docs: [
      {
        id: "doc-1",
        title: "Getting Started Guide",
        excerpt: "Learn how to get started with NeoForge...",
        type: "documentation",
        section: "guides",
        url: "/docs/getting-started",
        relevance: 0.95,
      },
      {
        id: "example-1",
        title: "Basic Web Component",
        excerpt: "Example of a simple web component...",
        type: "example",
        tags: ["web-components", "beginner"],
        url: "/examples/basic-component",
        relevance: 0.85,
      },
    ],
    tutorials: [
      {
        id: "tutorial-1",
        title: "Web Components Tutorial",
        excerpt: "Learn how to create web components...",
        difficulty: "beginner",
        duration: "30 min",
        url: "/tutorials/web-components",
        relevance: 0.9,
      },
    ],
    api: [
      {
        id: "api-1",
        title: "createElement()",
        excerpt: "API reference for createElement function...",
        type: "function",
        module: "core",
        url: "/api/core/create-element",
        relevance: 0.8,
      },
    ],
  };

  const mockFilters = {
    types: ["documentation", "example", "tutorial", "api"],
    categories: ["guides", "examples", "tutorials", "api-reference"],
    tags: ["web-components", "beginner", "advanced"],
  };

  beforeEach(async () => {
    // Mock search service
    window.search = {
      search: async (query, filters) => mockResults,
      getFilters: async () => mockFilters,
      getSuggestions: async (query) => [
        "web components",
        "web development",
        "webpack",
      ],
      getRecentSearches: () => ["components", "routing", "state management"],
      saveRecentSearch: (query) => {},
    };

    element = await fixture(html`<search-page></search-page>`);
    await element.updateComplete;
  });

  it("renders search interface", () => {
    const searchInput = element.shadowRoot.querySelector(".search-input");
    const resultsContainer =
      element.shadowRoot.querySelector(".search-results");
    const filters = element.shadowRoot.querySelector(".search-filters");

    expect(searchInput).to.exist;
    expect(resultsContainer).to.exist;
    expect(filters).to.exist;
  });

  it("displays search results", async () => {
    const searchInput = element.shadowRoot.querySelector(".search-input");
    searchInput.value = "web components";
    searchInput.dispatchEvent(new Event("input"));
    await element.updateComplete;

    const results = element.shadowRoot.querySelectorAll(".result-item");
    expect(results.length).to.equal(
      mockResults.docs.length +
        mockResults.tutorials.length +
        mockResults.api.length
    );
  });

  it("shows result categories", () => {
    const categories = element.shadowRoot.querySelectorAll(".result-category");
    expect(categories.length).to.equal(3); // docs, tutorials, api

    const categoryTitles = Array.from(categories).map(
      (c) => c.querySelector(".category-title").textContent
    );
    expect(categoryTitles).to.include("Documentation");
    expect(categoryTitles).to.include("Tutorials");
    expect(categoryTitles).to.include("API");
  });

  it("handles filter selection", async () => {
    const typeFilters = element.shadowRoot.querySelectorAll(".type-filter");
    const docsFilter = Array.from(typeFilters).find((f) =>
      f.textContent.includes("Documentation")
    );

    docsFilter.click();
    await element.updateComplete;

    const results = element.shadowRoot.querySelectorAll(".result-item");
    results.forEach((result) => {
      expect(result.getAttribute("data-type")).to.equal("documentation");
    });
  });

  it("supports tag filtering", async () => {
    const tagFilters = element.shadowRoot.querySelectorAll(".tag-filter");
    const beginnerTag = Array.from(tagFilters).find((t) =>
      t.textContent.includes("beginner")
    );

    beginnerTag.click();
    await element.updateComplete;

    const results = element.shadowRoot.querySelectorAll(
      ".result-item:not(.hidden)"
    );
    results.forEach((result) => {
      const tags = result.getAttribute("data-tags");
      expect(tags).to.include("beginner");
    });
  });

  it("shows search suggestions", async () => {
    const searchInput = element.shadowRoot.querySelector(".search-input");
    searchInput.value = "web";
    searchInput.dispatchEvent(new Event("input"));
    await element.updateComplete;

    const suggestions = element.shadowRoot.querySelector(".search-suggestions");
    const suggestionItems = suggestions.querySelectorAll(".suggestion-item");

    expect(suggestions).to.exist;
    expect(suggestionItems.length).to.be.greaterThan(0);
  });

  it("displays recent searches", () => {
    const recentSearches = element.shadowRoot.querySelector(".recent-searches");
    const searchItems = recentSearches.querySelectorAll(".recent-search-item");

    expect(searchItems.length).to.equal(3);
    expect(searchItems[0].textContent).to.include("components");
  });

  it("handles result navigation", async () => {
    const firstResult = element.shadowRoot.querySelector(".result-item");

    setTimeout(() => firstResult.click());
    const { detail } = await oneEvent(element, "navigate");

    expect(detail.url).to.equal(mockResults.docs[0].url);
  });

  it("shows result relevance", () => {
    const results = element.shadowRoot.querySelectorAll(".result-item");
    const firstResult = results[0];
    const relevance = firstResult.querySelector(".relevance-score");

    expect(relevance.textContent).to.include("95%");
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
    const searchInput = element.shadowRoot.querySelector(".search-input");
    expect(searchInput.getAttribute("role")).to.equal("searchbox");

    const results = element.shadowRoot.querySelectorAll(".result-item");
    results.forEach((result) => {
      expect(result.getAttribute("role")).to.equal("listitem");
      expect(result.getAttribute("aria-label")).to.exist;
    });
  });

  it("supports keyboard navigation", async () => {
    const results = element.shadowRoot.querySelectorAll(".result-item");
    const firstResult = results[0];

    firstResult.focus();
    firstResult.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowDown" })
    );
    await element.updateComplete;

    expect(document.activeElement).to.equal(results[1]);
  });

  it("handles loading states", async () => {
    element.loading = true;
    await element.updateComplete;

    const loader = element.shadowRoot.querySelector(".loading-indicator");
    const skeleton = element.shadowRoot.querySelector(".results-skeleton");

    expect(loader).to.exist;
    expect(skeleton).to.exist;
  });

  it("displays error states", async () => {
    const error = "Search service unavailable";
    element.error = error;
    await element.updateComplete;

    const errorMessage = element.shadowRoot.querySelector(".error-message");
    expect(errorMessage).to.exist;
    expect(errorMessage.textContent).to.include(error);
  });

  it("supports result sorting", async () => {
    const sortSelect = element.shadowRoot.querySelector(".sort-select");
    sortSelect.value = "relevance";
    sortSelect.dispatchEvent(new Event("change"));
    await element.updateComplete;

    const results = element.shadowRoot.querySelectorAll(".result-item");
    const relevanceScores = Array.from(results).map((r) =>
      parseFloat(r.querySelector(".relevance-score").textContent)
    );

    expect(relevanceScores).to.deep.equal(
      [...relevanceScores].sort((a, b) => b - a)
    );
  });

  it("handles empty search results", async () => {
    // Mock empty search results
    window.search.search = async () => ({ docs: [], tutorials: [], api: [] });

    const searchInput = element.shadowRoot.querySelector(".search-input");
    searchInput.value = "nonexistent";
    searchInput.dispatchEvent(new Event("input"));
    await element.updateComplete;

    const emptyState = element.shadowRoot.querySelector(".empty-state");
    expect(emptyState).to.exist;
    expect(emptyState.textContent).to.include("No results found");
  });

  it("saves recent searches", async () => {
    const searchInput = element.shadowRoot.querySelector(".search-input");
    const searchForm = element.shadowRoot.querySelector(".search-form");

    searchInput.value = "new search";
    setTimeout(() => searchForm.submit());
    await oneEvent(element, "search");

    const recentSearches = element.shadowRoot.querySelector(".recent-searches");
    expect(recentSearches.textContent).to.include("new search");
  });
});
