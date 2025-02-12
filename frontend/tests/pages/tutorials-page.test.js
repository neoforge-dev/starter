import { TestRunner, Assert, ComponentTester } from "../test-utils.js";
import { TutorialsPage } from "../../pages/tutorials-page.js";

const runner = new TestRunner();

runner.describe("TutorialsPage", () => {
  let element;
  const mockTutorials = {
    categories: [
      {
        id: "getting-started",
        name: "Getting Started",
        description: "Basic tutorials for beginners",
      },
      {
        id: "advanced-topics",
        name: "Advanced Topics",
        description: "In-depth technical tutorials",
      },
    ],
    tutorials: [
      {
        id: 1,
        title: "Quick Start Guide",
        description: "Get up and running in 5 minutes",
        category: "getting-started",
        duration: "5 mins",
        author: "John Doe",
        publishedAt: "2024-02-01T10:00:00Z",
        difficulty: "beginner",
        prerequisites: [],
        sections: [
          {
            title: "Installation",
            content: "Installation steps here...",
          },
          {
            title: "Configuration",
            content: "Configuration steps here...",
          },
        ],
        tags: ["setup", "configuration"],
      },
      {
        id: 2,
        title: "Advanced Performance Optimization",
        description: "Learn how to optimize your application",
        category: "advanced-topics",
        duration: "30 mins",
        author: "Jane Smith",
        publishedAt: "2024-02-05T14:00:00Z",
        difficulty: "advanced",
        prerequisites: ["Basic JavaScript", "Web Performance"],
        sections: [
          {
            title: "Performance Metrics",
            content: "Understanding metrics...",
          },
          {
            title: "Optimization Techniques",
            content: "Advanced techniques...",
          },
        ],
        tags: ["performance", "optimization"],
      },
    ],
  };

  runner.beforeEach(async () => {
    element = await ComponentTester.render(TutorialsPage);
    element.tutorials = mockTutorials;
    await element.updateComplete;
  });

  runner.afterEach(() => {
    ComponentTester.cleanup();
  });

  runner.it("should render tutorial categories", async () => {
    const shadowRoot = element.shadowRoot;
    const categoryItems = shadowRoot.querySelectorAll(".category-item");

    Assert.equal(
      categoryItems.length,
      mockTutorials.categories.length,
      "Should show all categories"
    );

    categoryItems.forEach((item, index) => {
      const category = mockTutorials.categories[index];
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

  runner.it("should render tutorial cards", async () => {
    const shadowRoot = element.shadowRoot;
    const tutorialCards = shadowRoot.querySelectorAll(".tutorial-card");

    Assert.equal(
      tutorialCards.length,
      mockTutorials.tutorials.length,
      "Should show all tutorials"
    );

    tutorialCards.forEach((card, index) => {
      const tutorial = mockTutorials.tutorials[index];
      const title = card.querySelector(".tutorial-title");
      const description = card.querySelector(".tutorial-description");
      const author = card.querySelector(".tutorial-author");
      const duration = card.querySelector(".tutorial-duration");
      const difficulty = card.querySelector(".difficulty-badge");
      const tags = card.querySelectorAll(".tag");

      Assert.include(
        title.textContent,
        tutorial.title,
        "Should show tutorial title"
      );
      Assert.include(
        description.textContent,
        tutorial.description,
        "Should show tutorial description"
      );
      Assert.include(
        author.textContent,
        tutorial.author,
        "Should show tutorial author"
      );
      Assert.include(
        duration.textContent,
        tutorial.duration,
        "Should show tutorial duration"
      );
      Assert.include(
        difficulty.textContent.toLowerCase(),
        tutorial.difficulty,
        "Should show difficulty level"
      );
      Assert.equal(
        tags.length,
        tutorial.tags.length,
        "Should show all tutorial tags"
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

    // Filter by getting started category
    const gettingStartedFilter = Array.from(categoryFilters).find(
      (filter) => filter.dataset.category === "getting-started"
    );
    await ComponentTester.click(gettingStartedFilter);

    const filteredCards = shadowRoot.querySelectorAll(
      ".tutorial-card:not(.hidden)"
    );
    Assert.equal(
      filteredCards.length,
      1,
      "Should show only getting started tutorials"
    );
    Assert.include(
      filteredCards[0].textContent,
      "Quick Start Guide",
      "Should show correct filtered tutorial"
    );
  });

  runner.it("should handle difficulty filtering", async () => {
    const shadowRoot = element.shadowRoot;
    const difficultyFilter = shadowRoot.querySelector(".difficulty-filter");

    Assert.notNull(difficultyFilter, "Difficulty filter should be present");

    // Filter by advanced difficulty
    await ComponentTester.select(difficultyFilter, "advanced");

    const filteredCards = shadowRoot.querySelectorAll(
      ".tutorial-card:not(.hidden)"
    );
    Assert.equal(
      filteredCards.length,
      1,
      "Should show only advanced tutorials"
    );
    Assert.include(
      filteredCards[0].textContent,
      "Advanced Performance",
      "Should show correct filtered tutorial"
    );
  });

  runner.it("should handle tutorial search", async () => {
    const shadowRoot = element.shadowRoot;
    const searchInput = shadowRoot.querySelector(".tutorial-search input");

    Assert.notNull(searchInput, "Search input should be present");

    // Search for "performance"
    await ComponentTester.type(searchInput, "performance");

    const searchResults = shadowRoot.querySelectorAll(
      ".tutorial-card:not(.hidden)"
    );
    Assert.equal(searchResults.length, 1, "Should show matching tutorials");
    Assert.include(
      searchResults[0].textContent,
      "Performance Optimization",
      "Should show correct search result"
    );
  });

  runner.it("should handle tutorial navigation", async () => {
    const shadowRoot = element.shadowRoot;
    const firstTutorial = shadowRoot.querySelector(".tutorial-card");
    const startButton = firstTutorial.querySelector(".start-tutorial");
    let navigatedTo = null;

    // Mock navigation
    window.history.pushState = (data, title, url) => {
      navigatedTo = url;
    };

    await ComponentTester.click(startButton);
    Assert.equal(
      navigatedTo,
      `/tutorials/${mockTutorials.tutorials[0].id}`,
      "Should navigate to tutorial page"
    );
  });

  runner.it("should render tutorial content", async () => {
    const shadowRoot = element.shadowRoot;
    const firstTutorial = shadowRoot.querySelector(".tutorial-card");
    const startButton = firstTutorial.querySelector(".start-tutorial");

    // Open tutorial content
    await ComponentTester.click(startButton);

    const tutorialContent = shadowRoot.querySelector(".tutorial-content");
    const sections = tutorialContent.querySelectorAll(".tutorial-section");
    const prerequisites = tutorialContent.querySelector(".prerequisites");

    Assert.notNull(tutorialContent, "Tutorial content should be visible");
    Assert.equal(
      sections.length,
      mockTutorials.tutorials[0].sections.length,
      "Should show all tutorial sections"
    );

    if (mockTutorials.tutorials[0].prerequisites.length > 0) {
      Assert.notNull(prerequisites, "Prerequisites should be shown if any");
    }
  });

  runner.it("should handle tutorial progress tracking", async () => {
    const shadowRoot = element.shadowRoot;
    const firstTutorial = shadowRoot.querySelector(".tutorial-card");
    const startButton = firstTutorial.querySelector(".start-tutorial");

    // Open tutorial content
    await ComponentTester.click(startButton);

    const sections = shadowRoot.querySelectorAll(".tutorial-section");
    const firstSection = sections[0];
    const completeButton = firstSection.querySelector(".mark-complete");

    Assert.notNull(completeButton, "Complete button should be present");

    // Mark section as complete
    await ComponentTester.click(completeButton);
    Assert.true(
      firstSection.classList.contains("completed"),
      "Section should be marked as completed"
    );

    const progressIndicator = shadowRoot.querySelector(".progress-indicator");
    Assert.include(
      progressIndicator.textContent,
      "50%",
      "Should show correct progress percentage"
    );
  });
});

// Run tests
runner.run();
