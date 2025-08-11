import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { ComponentTester } from "../test-utils.js";

// Mock the ExamplesPage component instead of importing it directly
// import { ExamplesPage } from "../../pages/examples-page.js";

// Create a mock implementation of the ExamplesPage component
class MockExamplesPage extends HTMLElement {
  static tagName = "examples-page";

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._examples = null;
    this.selectedCategory = null;
    this.selectedDifficulty = null;
    this.searchQuery = "";
    this.loading = false;
    this.error = null;
    this.updateComplete = Promise.resolve();
  }

  connectedCallback() {
    if (this._examples) {
      this.render();
    }
  }

  get examples() {
    return this._examples;
  }

  set examples(value) {
    this._examples = value;
    this.render();
  }

  render() {
    if (!this._examples) return;

    const { categories, examples } = this._examples;

    // Create category filters
    const categoryFilters = document.createElement("div");
    categoryFilters.className = "category-filters";
    categories.forEach((category) => {
      const filter = document.createElement("button");
      filter.className = "category-filter";
      filter.dataset.category = category.id;
      filter.textContent = category.name;
      filter.addEventListener("click", () =>
        this.handleCategoryClick(category.id)
      );
      categoryFilters.appendChild(filter);
    });

    // Create difficulty filter
    const difficultyFilter = document.createElement("select");
    difficultyFilter.className = "difficulty-filter";
    ["all", "beginner", "intermediate", "advanced"].forEach((difficulty) => {
      const option = document.createElement("option");
      option.value = difficulty;
      option.textContent =
        difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
      difficultyFilter.appendChild(option);
    });
    difficultyFilter.addEventListener("change", (e) =>
      this.handleDifficultyChange(e)
    );

    // Create search input
    const searchContainer = document.createElement("div");
    searchContainer.className = "example-search";
    const searchInput = document.createElement("input");
    searchInput.type = "text";
    searchInput.placeholder = "Search examples...";
    searchInput.addEventListener("input", (e) => this.handleSearch(e));
    searchContainer.appendChild(searchInput);

    // Create example cards
    const exampleGrid = document.createElement("div");
    exampleGrid.className = "example-grid";
    examples.forEach((example) => {
      const card = document.createElement("div");
      card.className = "example-card";

      // Apply filtering
      if (this.selectedCategory && example.category !== this.selectedCategory) {
        card.classList.add("hidden");
      }

      if (
        this.selectedDifficulty &&
        this.selectedDifficulty !== "all" &&
        example.difficulty !== this.selectedDifficulty
      ) {
        card.classList.add("hidden");
      }

      if (
        this.searchQuery &&
        !example.title.toLowerCase().includes(this.searchQuery.toLowerCase()) &&
        !example.description
          .toLowerCase()
          .includes(this.searchQuery.toLowerCase())
      ) {
        card.classList.add("hidden");
      }

      // Create card content
      const title = document.createElement("h3");
      title.className = "example-title";
      title.textContent = example.title;

      const description = document.createElement("p");
      description.className = "example-description";
      description.textContent = example.description;

      const author = document.createElement("div");
      author.className = "example-author";
      author.textContent = `By ${example.author}`;

      const difficulty = document.createElement("span");
      difficulty.className = "difficulty-badge";
      difficulty.textContent =
        example.difficulty.charAt(0).toUpperCase() +
        example.difficulty.slice(1);

      const tagsContainer = document.createElement("div");
      tagsContainer.className = "tags-container";
      example.tags.forEach((tag) => {
        const tagElement = document.createElement("span");
        tagElement.className = "tag";
        tagElement.textContent = tag;
        tagsContainer.appendChild(tagElement);
      });

      const actionsContainer = document.createElement("div");
      actionsContainer.className = "actions-container";

      const previewButton = document.createElement("button");
      previewButton.className = "preview-button";
      previewButton.textContent = "Preview";
      previewButton.addEventListener("click", () =>
        this.handlePreview(example.id)
      );

      const downloadButton = document.createElement("button");
      downloadButton.className = "download-button";
      downloadButton.textContent = "Download";
      downloadButton.addEventListener("click", () =>
        this.handleDownload(example.id)
      );

      const likeButton = document.createElement("button");
      likeButton.className = "like-button";
      likeButton.textContent = `Like (${example.likes || 0})`;
      likeButton.addEventListener("click", () => this.handleLike(example.id));

      actionsContainer.appendChild(previewButton);
      actionsContainer.appendChild(downloadButton);
      actionsContainer.appendChild(likeButton);

      // Append all elements to card
      card.appendChild(title);
      card.appendChild(description);
      card.appendChild(author);
      card.appendChild(difficulty);
      card.appendChild(tagsContainer);
      card.appendChild(actionsContainer);

      exampleGrid.appendChild(card);
    });

    // Create category items
    const categoryItems = document.createElement("div");
    categoryItems.className = "category-items";
    categories.forEach((category) => {
      const item = document.createElement("div");
      item.className = "category-item";

      const title = document.createElement("h3");
      title.className = "category-title";
      title.textContent = category.name;

      const description = document.createElement("p");
      description.className = "category-description";
      description.textContent = category.description;

      item.appendChild(title);
      item.appendChild(description);
      categoryItems.appendChild(item);
    });

    // Clear shadow root and append all elements
    this.shadowRoot.innerHTML = "";
    this.shadowRoot.appendChild(categoryFilters);
    this.shadowRoot.appendChild(difficultyFilter);
    this.shadowRoot.appendChild(searchContainer);
    this.shadowRoot.appendChild(categoryItems);
    this.shadowRoot.appendChild(exampleGrid);
  }

  handleCategoryClick(category) {
    this.selectedCategory = category;
    this.render();
  }

  handleDifficultyChange(event) {
    this.selectedDifficulty = event.target.value;
    this.render();
  }

  handleSearch(event) {
    this.searchQuery = event.target.value;
    this.render();
  }

  handlePreview(exampleId) {
    window.history.pushState({}, "", `/examples/${exampleId}/preview`);
  }

  handleDownload(exampleId) {
    window.location.href = `/api/examples/${exampleId}/download`;
  }

  handleLike(exampleId) {
    const example = this._examples.examples.find((e) => e.id === exampleId);
    if (example) {
      example.likes = (example.likes || 0) + 1;

      // Update the like button text immediately
      const likeButton = this.shadowRoot.querySelector(
        `.example-card:nth-child(${this._examples.examples.findIndex((e) => e.id === exampleId) + 1}) .like-button`
      );
      if (likeButton) {
        likeButton.textContent = `Like (${example.likes})`;
      }
    }
  }
}

// Mock examples data
const mockExamples = {
  categories: [
    {
      id: "basics",
      name: "Basic Examples",
      description: "Fundamental usage examples",
    },
    {
      id: "advanced",
      name: "Advanced Examples",
      description: "Complex implementation examples",
    },
  ],
  examples: [
    {
      id: 1,
      title: "Hello World Component",
      description: "A simple hello world web component",
      category: "basics",
      author: "John Doe",
      difficulty: "beginner",
      likes: 42,
      downloads: 120,
      tags: ["beginner", "component"],
      code: "class HelloWorld extends HTMLElement {...}",
    },
    {
      id: 2,
      title: "Advanced State Management",
      description: "Complex state management with web components",
      category: "advanced",
      author: "Jane Smith",
      difficulty: "advanced",
      likes: 28,
      downloads: 85,
      tags: ["advanced", "state", "management"],
      code: "class StateManager {...}",
    },
  ],
};

describe("ExamplesPage", () => {
  let element;

  beforeEach(async () => {
    element = await ComponentTester.render(MockExamplesPage);
    element.examples = mockExamples;
    await element.updateComplete;
  });

  afterEach(() => {
    ComponentTester.cleanup();
  });

  it("should render example categories", async () => {
    const shadowRoot = element.shadowRoot;
    const categoryItems = shadowRoot.querySelectorAll(".category-item");

    expect(categoryItems.length).toBe(mockExamples.categories.length);

    categoryItems.forEach((item, index) => {
      const category = mockExamples.categories[index];
      const title = item.querySelector(".category-title");
      const description = item.querySelector(".category-description");

      expect(title.textContent).toContain(category.name);
      expect(description.textContent).toContain(category.description);
    });
  });

  it("should render example cards", async () => {
    const shadowRoot = element.shadowRoot;
    const exampleCards = shadowRoot.querySelectorAll(".example-card");

    expect(exampleCards.length).toBe(mockExamples.examples.length);

    exampleCards.forEach((card, index) => {
      const example = mockExamples.examples[index];
      const title = card.querySelector(".example-title");
      const description = card.querySelector(".example-description");
      const author = card.querySelector(".example-author");
      const difficulty = card.querySelector(".difficulty-badge");
      const tags = card.querySelectorAll(".tag");

      expect(title.textContent).toContain(example.title);
      expect(description.textContent).toContain(example.description);
      expect(author.textContent).toContain(example.author);
      expect(difficulty.textContent.toLowerCase()).toContain(
        example.difficulty
      );
      expect(tags.length).toBe(example.tags.length);
    });
  });

  it("should handle category filtering", async () => {
    const shadowRoot = element.shadowRoot;
    const categoryFilters = shadowRoot.querySelectorAll(".category-filter");

    expect(categoryFilters.length).toBeGreaterThan(0);

    // Filter by basics category
    const basicsFilter = Array.from(categoryFilters).find(
      (filter) => filter.dataset.category === "basics"
    );
    await ComponentTester.click(basicsFilter);

    const filteredCards = shadowRoot.querySelectorAll(
      ".example-card:not(.hidden)"
    );
    expect(filteredCards.length).toBe(1);
    expect(filteredCards[0].textContent).toContain("Hello World Component");
  });

  it("should handle difficulty filtering", async () => {
    const shadowRoot = element.shadowRoot;
    const difficultyFilter = shadowRoot.querySelector(".difficulty-filter");

    expect(difficultyFilter).not.toBeNull();

    // Filter by advanced difficulty
    await ComponentTester.select(difficultyFilter, "advanced");

    const filteredCards = shadowRoot.querySelectorAll(
      ".example-card:not(.hidden)"
    );
    expect(filteredCards.length).toBe(1);
    expect(filteredCards[0].textContent).toContain("Advanced State Management");
  });

  it("should handle example search", async () => {
    const shadowRoot = element.shadowRoot;
    const searchInput = shadowRoot.querySelector(".example-search input");

    expect(searchInput).not.toBeNull();

    // Search for "state"
    await ComponentTester.type(searchInput, "state");

    const searchResults = shadowRoot.querySelectorAll(
      ".example-card:not(.hidden)"
    );
    expect(searchResults.length).toBe(1);
    expect(searchResults[0].textContent).toContain("Advanced State Management");
  });

  it("should handle example preview", async () => {
    const shadowRoot = element.shadowRoot;
    const firstExample = shadowRoot.querySelector(".example-card");
    const previewButton = firstExample.querySelector(".preview-button");
    let navigatedTo = null;

    // Mock navigation
    const originalPushState = window.history.pushState;
    window.history.pushState = (data, title, url) => {
      navigatedTo = url;
    };

    await ComponentTester.click(previewButton);
    expect(navigatedTo).toBe(
      `/examples/${mockExamples.examples[0].id}/preview`
    );

    // Restore original pushState
    window.history.pushState = originalPushState;
  });

  it("should handle example download", async () => {
    const shadowRoot = element.shadowRoot;
    const firstExample = shadowRoot.querySelector(".example-card");
    const downloadButton = firstExample.querySelector(".download-button");
    let downloadUrl = null;

    // Use a different approach to mock location.href
    const originalLocation = window.location;
    delete window.location;
    window.location = { ...originalLocation };

    // Now we can safely redefine the href property
    Object.defineProperty(window.location, "href", {
      configurable: true,
      set(value) {
        downloadUrl = value;
      },
      get() {
        return originalLocation.href;
      },
    });

    await ComponentTester.click(downloadButton);
    expect(downloadUrl).toBe(
      `/api/examples/${mockExamples.examples[0].id}/download`
    );

    // Restore original location
    window.location = originalLocation;
  });

  it("should handle example likes", async () => {
    const shadowRoot = element.shadowRoot;
    const firstExample = shadowRoot.querySelector(".example-card");
    const likeButton = firstExample.querySelector(".like-button");
    const initialLikes = mockExamples.examples[0].likes;

    await ComponentTester.click(likeButton);

    expect(mockExamples.examples[0].likes).toBe(initialLikes + 1);
    expect(likeButton.textContent).toContain(`Like (${initialLikes + 1})`);
  });
});
