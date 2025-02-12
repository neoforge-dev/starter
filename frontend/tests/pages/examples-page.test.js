import { TestRunner, Assert, ComponentTester } from "../test-utils.js";
import { ExamplesPage } from "../../pages/examples-page.js";

const runner = new TestRunner();

runner.describe("ExamplesPage", () => {
  let element;
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
        title: "Basic Authentication",
        description: "Simple authentication implementation",
        category: "basics",
        difficulty: "beginner",
        tags: ["auth", "security"],
        code: "// Example code here",
        demo: "https://example.com/demo/auth",
      },
      {
        id: 2,
        title: "Advanced Data Grid",
        description: "Complex data grid with sorting and filtering",
        category: "advanced",
        difficulty: "advanced",
        tags: ["ui", "data", "components"],
        code: "// Example code here",
        demo: "https://example.com/demo/grid",
      },
    ],
  };

  runner.beforeEach(async () => {
    element = await ComponentTester.render(ExamplesPage);
    element.examples = mockExamples;
    await element.updateComplete;
  });

  runner.afterEach(() => {
    ComponentTester.cleanup();
  });

  runner.it("should render example categories", async () => {
    const shadowRoot = element.shadowRoot;
    const categoryItems = shadowRoot.querySelectorAll(".category-item");

    Assert.equal(
      categoryItems.length,
      mockExamples.categories.length,
      "Should show all categories"
    );

    categoryItems.forEach((item, index) => {
      const category = mockExamples.categories[index];
      const title = item.querySelector(".category-title");
      const description = item.querySelector(".category-description");

      Assert.include(
        title.textContent,
        category.name,
        "Should show category name"
      );
      Assert.include(
        description.textContent,
        category.description,
        "Should show category description"
      );
    });
  });

  runner.it("should render example cards", async () => {
    const shadowRoot = element.shadowRoot;
    const exampleCards = shadowRoot.querySelectorAll(".example-card");

    Assert.equal(
      exampleCards.length,
      mockExamples.examples.length,
      "Should show all examples"
    );

    exampleCards.forEach((card, index) => {
      const example = mockExamples.examples[index];
      const title = card.querySelector(".example-title");
      const description = card.querySelector(".example-description");
      const difficulty = card.querySelector(".difficulty-badge");
      const tags = card.querySelectorAll(".tag");

      Assert.include(
        title.textContent,
        example.title,
        "Should show example title"
      );
      Assert.include(
        description.textContent,
        example.description,
        "Should show example description"
      );
      Assert.include(
        difficulty.textContent.toLowerCase(),
        example.difficulty,
        "Should show difficulty level"
      );
      Assert.equal(
        tags.length,
        example.tags.length,
        "Should show all example tags"
      );
    });
  });

  runner.it("should handle category filtering", async () => {
    const shadowRoot = element.shadowRoot;
    const categoryFilters = shadowRoot.querySelectorAll(".category-filter");

    Assert.greaterThan(
      categoryFilters.length,
      0,
      "Should have category filters"
    );

    // Filter by basics category
    const basicsFilter = Array.from(categoryFilters).find(
      (filter) => filter.dataset.category === "basics"
    );
    await ComponentTester.click(basicsFilter);

    const filteredCards = shadowRoot.querySelectorAll(
      ".example-card:not(.hidden)"
    );
    Assert.equal(filteredCards.length, 1, "Should show only basic examples");
    Assert.include(
      filteredCards[0].textContent,
      "Basic Authentication",
      "Should show correct filtered example"
    );
  });

  runner.it("should handle difficulty filtering", async () => {
    const shadowRoot = element.shadowRoot;
    const difficultyFilter = shadowRoot.querySelector(".difficulty-filter");

    Assert.notNull(difficultyFilter, "Difficulty filter should be present");

    // Filter by advanced difficulty
    await ComponentTester.select(difficultyFilter, "advanced");

    const filteredCards = shadowRoot.querySelectorAll(
      ".example-card:not(.hidden)"
    );
    Assert.equal(filteredCards.length, 1, "Should show only advanced examples");
    Assert.include(
      filteredCards[0].textContent,
      "Advanced Data Grid",
      "Should show correct filtered example"
    );
  });

  runner.it("should handle tag filtering", async () => {
    const shadowRoot = element.shadowRoot;
    const tagFilters = shadowRoot.querySelectorAll(".tag-filter");

    Assert.greaterThan(tagFilters.length, 0, "Should have tag filters");

    // Filter by UI tag
    const uiFilter = Array.from(tagFilters).find(
      (filter) => filter.dataset.tag === "ui"
    );
    await ComponentTester.click(uiFilter);

    const filteredCards = shadowRoot.querySelectorAll(
      ".example-card:not(.hidden)"
    );
    Assert.equal(filteredCards.length, 1, "Should show only UI examples");
    Assert.include(
      filteredCards[0].textContent,
      "Advanced Data Grid",
      "Should show correct filtered example"
    );
  });

  runner.it("should handle example search", async () => {
    const shadowRoot = element.shadowRoot;
    const searchInput = shadowRoot.querySelector(".example-search input");

    Assert.notNull(searchInput, "Search input should be present");

    // Search for "grid"
    await ComponentTester.type(searchInput, "grid");

    const searchResults = shadowRoot.querySelectorAll(
      ".example-card:not(.hidden)"
    );
    Assert.equal(searchResults.length, 1, "Should show matching examples");
    Assert.include(
      searchResults[0].textContent,
      "Data Grid",
      "Should show correct search result"
    );
  });

  runner.it("should handle code preview", async () => {
    const shadowRoot = element.shadowRoot;
    const firstExample = shadowRoot.querySelector(".example-card");
    const codePreviewButton = firstExample.querySelector(".preview-code");

    Assert.notNull(codePreviewButton, "Code preview button should be present");

    // Open code preview
    await ComponentTester.click(codePreviewButton);

    const codePreview = shadowRoot.querySelector(".code-preview");
    const codeContent = codePreview.querySelector("code");

    Assert.notNull(codePreview, "Code preview should be visible");
    Assert.include(
      codeContent.textContent,
      mockExamples.examples[0].code,
      "Should show example code"
    );
  });

  runner.it("should handle demo navigation", async () => {
    const shadowRoot = element.shadowRoot;
    const firstExample = shadowRoot.querySelector(".example-card");
    const demoLink = firstExample.querySelector(".view-demo");
    let navigatedTo = null;

    // Mock navigation
    window.open = (url) => {
      navigatedTo = url;
    };

    await ComponentTester.click(demoLink);
    Assert.equal(
      navigatedTo,
      mockExamples.examples[0].demo,
      "Should navigate to demo URL"
    );
  });
});

// Run tests
runner.run();
