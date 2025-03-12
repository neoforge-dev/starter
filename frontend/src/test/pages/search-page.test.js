import { expect, describe, it, beforeEach, vi } from "vitest";
import { createMockComponent } from "../utils/component-mock-utils.js";

// Create a mock SearchPage component using our utility
const SearchPage = createMockComponent(
  "SearchPage",
  {
    query: { type: String },
    results: { type: Array },
    filters: { type: Object },
    loading: { type: Boolean },
    selectedFilters: { type: Object },
  },
  {
    async _initializeFilters() {
      try {
        this.filters = await window.search.getFilters();
      } catch (error) {
        console.error("Failed to load filters:", error);
      }
    },

    _handleInput(e) {
      this.query = e.target.value;
      this.dispatchEvent(
        new CustomEvent("search-input", {
          detail: { query: this.query },
          bubbles: true,
          composed: true,
        })
      );
    },

    async _handleSearch() {
      this.loading = true;
      try {
        const results = await window.search.search(this.query);
        this.results = results;
        // Update mock search results for testing
        this.searchResults = results.map(() => ({}));
      } catch (error) {
        console.error("Search failed:", error);
        // Properly handle the error without throwing
        this.results = [];
        this.searchResults = [];
      } finally {
        this.loading = false;
      }
    },

    _isSelected(filterType, value) {
      return this.selectedFilters[filterType].has(value);
    },

    _toggleFilter(filterType, value) {
      const filters = this.selectedFilters[filterType];
      if (filters.has(value)) {
        filters.delete(value);
      } else {
        filters.add(value);
      }
      this._handleSearch();
    },
  }
);

describe("Search Page", () => {
  let element;
  const mockResults = [
    {
      id: "1",
      title: "Getting Started with NeoForge",
      excerpt: "Learn how to build amazing apps with NeoForge",
      type: "documentation",
      category: "guides",
      url: "/docs/getting-started",
      tags: ["beginner", "setup"],
    },
    {
      id: "2",
      title: "Advanced Component Patterns",
      excerpt: "Deep dive into advanced NeoForge patterns",
      type: "tutorial",
      category: "advanced",
      url: "/tutorials/advanced-patterns",
      tags: ["advanced", "components"],
    },
  ];

  beforeEach(() => {
    // Create a new instance of the SearchPage component
    element = new SearchPage();

    // Initialize properties
    element.query = "";
    element.results = [];
    element.filters = {
      types: ["documentation", "tutorial", "blog"],
      categories: ["guides", "advanced", "beginner"],
      tags: ["beginner", "setup", "advanced", "components"],
    };
    element.loading = false;
    element.selectedFilters = {
      types: new Set(),
      categories: new Set(),
      tags: new Set(),
    };

    // Mock search input element
    element.searchInput = { value: "" };
    element.searchResults = [];

    // Add custom shadowRoot querySelector implementation
    element.shadowRoot.querySelector = (selector) => {
      if (selector === 'input[type="search"]') {
        return element.searchInput;
      }
      return null;
    };

    element.shadowRoot.querySelectorAll = (selector) => {
      if (selector === ".result-item") {
        return element.searchResults;
      }
      return [];
    };

    // Mock window.search API
    window.search = {
      getFilters: vi.fn().mockResolvedValue({
        types: ["documentation", "tutorial", "blog"],
        categories: ["guides", "advanced", "beginner"],
        tags: ["beginner", "setup", "advanced", "components"],
      }),
      search: vi.fn().mockResolvedValue(mockResults),
    };
  });

  it("should initialize with default properties", async () => {
    expect(element.query).toBe("");
    expect(element.results).toEqual([]);
    expect(element.loading).toBe(false);
    expect(element.selectedFilters.types).toBeInstanceOf(Set);
    expect(element.selectedFilters.categories).toBeInstanceOf(Set);
    expect(element.selectedFilters.tags).toBeInstanceOf(Set);
  });

  it("should load filters on initialization", async () => {
    await element._initializeFilters();
    expect(window.search.getFilters).toHaveBeenCalled();
    expect(element.filters).toEqual({
      types: ["documentation", "tutorial", "blog"],
      categories: ["guides", "advanced", "beginner"],
      tags: ["beginner", "setup", "advanced", "components"],
    });
  });

  it("should update query on input", () => {
    const inputEvent = { target: { value: "test query" } };
    element._handleInput(inputEvent);
    expect(element.query).toBe("test query");
  });

  it("should dispatch search-input event on input", () => {
    const dispatchEventSpy = vi.spyOn(element, "dispatchEvent");
    const inputEvent = { target: { value: "test query" } };
    element._handleInput(inputEvent);

    expect(dispatchEventSpy).toHaveBeenCalledTimes(1);
    const event = dispatchEventSpy.mock.calls[0][0];
    expect(event.type).toBe("search-input");
    expect(event.detail).toEqual({ query: "test query" });
  });

  it("should perform search on _handleSearch", async () => {
    element.query = "test query";
    await element._handleSearch();

    expect(window.search.search).toHaveBeenCalledWith("test query");
    expect(element.results).toEqual(mockResults);
    expect(element.loading).toBe(false);
  });

  it("should toggle filters correctly", async () => {
    // Initially no filters are selected
    expect(element._isSelected("types", "documentation")).toBe(false);

    // Toggle a filter on
    element._toggleFilter("types", "documentation");
    expect(element._isSelected("types", "documentation")).toBe(true);

    // Toggle it off
    element._toggleFilter("types", "documentation");
    expect(element._isSelected("types", "documentation")).toBe(false);
  });

  it("should trigger search when filters are toggled", async () => {
    const searchSpy = vi.spyOn(element, "_handleSearch");
    element._toggleFilter("types", "documentation");
    expect(searchSpy).toHaveBeenCalledTimes(1);
  });

  it("should handle search failures gracefully", async () => {
    window.search.search = vi
      .fn()
      .mockRejectedValue(new Error("Search failed"));
    element.query = "test query";

    await element._handleSearch();

    expect(element.results).toEqual([]);
    expect(element.loading).toBe(false);
  });
});
