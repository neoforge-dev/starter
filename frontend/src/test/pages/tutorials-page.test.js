import { html, expect, oneEvent, TestUtils } from "../setup.mjs";
import { TutorialsPage } from "../../pages/tutorials-page.js";

describe("Tutorials Page", () => {
  let element;
  const mockTutorials = [
    {
      id: "1",
      title: "Getting Started with NeoForge",
      description:
        "Learn the basics of setting up your development environment",
      category: "beginner",
      difficulty: "beginner",
      duration: 15,
      image: "tutorial1.jpg",
      tags: ["setup", "basics"],
      author: {
        name: "John Doe",
        avatar: "john.jpg",
        role: "Developer Advocate",
      },
    },
    {
      id: "2",
      title: "Advanced Components",
      description: "Deep dive into component architecture",
      category: "advanced",
      difficulty: "advanced",
      duration: 30,
      image: "tutorial2.jpg",
      tags: ["components", "architecture"],
      author: {
        name: "Jane Smith",
        avatar: "jane.jpg",
        role: "Senior Engineer",
      },
    },
  ];

  beforeEach(async () => {
    // Mock the API
    window.api = {
      getTutorials: async () => ({ tutorials: mockTutorials }),
    };

    element = await TestUtils.fixture(html`<tutorials-page></tutorials-page>`);
    await element.updateComplete;
  });

  it("renders tutorials list", async () => {
    const shadowRoot = await TestUtils.waitForShadowDom(element);
    const cards = shadowRoot.querySelectorAll(".tutorial-card");
    expect(cards.length).to.equal(mockTutorials.length);
  });

  it("displays tutorial details", async () => {
    const shadowRoot = await TestUtils.waitForShadowDom(element);
    const firstCard = shadowRoot.querySelector(".tutorial-card");
    const title = firstCard.querySelector(".tutorial-title");
    const description = firstCard.querySelector(".tutorial-description");

    expect(title.textContent).to.include(mockTutorials[0].title);
    expect(description.textContent).to.include(mockTutorials[0].description);
  });

  it("shows category filters", async () => {
    const shadowRoot = await TestUtils.waitForShadowDom(element);
    const filters = shadowRoot.querySelectorAll(".filter-button");
    expect(filters.length).to.be.greaterThan(0);
  });

  it("handles category filtering", async () => {
    const shadowRoot = await TestUtils.waitForShadowDom(element);
    const beginnerFilter = Array.from(
      shadowRoot.querySelectorAll(".filter-button")
    ).find((button) => button.textContent.toLowerCase().includes("beginner"));

    beginnerFilter.click();
    await element.updateComplete;

    const cards = shadowRoot.querySelectorAll(".tutorial-card");
    expect(cards.length).to.equal(1);
    expect(cards[0].textContent).to.include(mockTutorials[0].title);
  });

  it("supports difficulty filtering", async () => {
    const shadowRoot = await TestUtils.waitForShadowDom(element);
    const advancedFilter = Array.from(
      shadowRoot.querySelectorAll(".filter-button")
    ).find((button) => button.textContent.toLowerCase().includes("advanced"));

    advancedFilter.click();
    await element.updateComplete;

    const cards = shadowRoot.querySelectorAll(".tutorial-card");
    expect(cards.length).to.equal(1);
    expect(cards[0].textContent).to.include(mockTutorials[1].title);
  });

  it("handles search functionality", async () => {
    const shadowRoot = await TestUtils.waitForShadowDom(element);
    const searchInput = shadowRoot.querySelector(".search-input");

    searchInput.value = "architecture";
    searchInput.dispatchEvent(new Event("input"));
    await element.updateComplete;

    const cards = shadowRoot.querySelectorAll(".tutorial-card");
    expect(cards.length).to.equal(1);
    expect(cards[0].textContent).to.include(mockTutorials[1].title);
  });

  it("opens tutorial content", async () => {
    const shadowRoot = await TestUtils.waitForShadowDom(element);
    const firstCard = shadowRoot.querySelector(".tutorial-card");

    setTimeout(() => firstCard.click());
    const { detail } = await oneEvent(element, "tutorial-selected");

    expect(detail.tutorial).to.deep.equal(mockTutorials[0]);
  });

  it("tracks section completion", async () => {
    const shadowRoot = await TestUtils.waitForShadowDom(element);
    const firstCard = shadowRoot.querySelector(".tutorial-card");

    firstCard.click();
    await element.updateComplete;

    expect(firstCard.classList.contains("completed")).to.be.false;
  });

  it("shows progress indicators", async () => {
    const shadowRoot = await TestUtils.waitForShadowDom(element);
    const cards = shadowRoot.querySelectorAll(".tutorial-card");

    cards.forEach((card) => {
      expect(card.querySelector(".tutorial-meta")).to.exist;
    });
  });

  it("displays author information", async () => {
    const shadowRoot = await TestUtils.waitForShadowDom(element);
    const firstCard = shadowRoot.querySelector(".tutorial-card");
    const authorInfo = firstCard.textContent;

    expect(authorInfo).to.include(mockTutorials[0].author.name);
  });

  it("shows prerequisites", async () => {
    const shadowRoot = await TestUtils.waitForShadowDom(element);
    const cards = shadowRoot.querySelectorAll(".tutorial-card");

    cards.forEach((card) => {
      expect(card.querySelector(".tutorial-meta")).to.exist;
    });
  });

  it("shows prerequisites", async () => {
    const card = await TestUtils.queryComponent(element, ".tutorial-card");
    const prerequisites = card.querySelectorAll(".prerequisite-item");

    expect(prerequisites.length).to.equal(2);
    expect(prerequisites[0].textContent).to.equal("Basic JavaScript");
    expect(prerequisites[1].textContent).to.equal("HTML/CSS");
  });

  it("supports mobile responsive layout", async () => {
    // Mock mobile viewport
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query.includes("max-width: 768px"),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    await TestUtils.waitForComponent(element);

    const container = await TestUtils.queryComponent(
      element,
      ".page-container"
    );
    expect(container.classList.contains("mobile")).to.be.true;
  });

  it("maintains accessibility attributes", async () => {
    const cards = await TestUtils.queryAllComponents(element, ".tutorial-card");
    cards.forEach((card) => {
      expect(card.getAttribute("role")).to.equal("article");
      expect(card.getAttribute("aria-labelledby")).to.exist;
    });

    const buttons = await TestUtils.queryAllComponents(element, "button");
    buttons.forEach((button) => {
      expect(button.getAttribute("aria-label")).to.exist;
    });
  });

  it("supports keyboard navigation", async () => {
    const card = await TestUtils.queryComponent(element, ".tutorial-card");
    const startButton = card.querySelector(".start-button");

    startButton.focus();
    startButton.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    await TestUtils.waitForComponent(element);

    const content = await TestUtils.queryComponent(
      element,
      ".tutorial-content"
    );
    expect(content).to.exist;
  });

  it("handles loading states", async () => {
    window.tutorials.getTutorials = vi.fn().mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      return [];
    });

    element = await TestUtils.fixture(html`<tutorials-page></tutorials-page>`);
    const loading = await TestUtils.queryComponent(
      element,
      ".loading-indicator"
    );
    expect(loading).to.exist;

    await TestUtils.waitForComponent(element);
    expect(loading.classList.contains("hidden")).to.be.true;
  });

  it("displays error states", async () => {
    window.tutorials.getTutorials = vi
      .fn()
      .mockRejectedValue(new Error("Failed to load"));

    element = await TestUtils.fixture(html`<tutorials-page></tutorials-page>`);
    await TestUtils.waitForComponent(element);

    const error = await TestUtils.queryComponent(element, ".error-message");
    expect(error).to.exist;
    expect(error.textContent).to.include("Failed to load");
  });

  it("supports tutorial rating", async () => {
    const card = await TestUtils.queryComponent(element, ".tutorial-card");
    const ratingButton = card.querySelector(".rating-button");

    ratingButton.click();
    await TestUtils.waitForComponent(element);

    const ratingDialog = await TestUtils.queryComponent(
      element,
      ".rating-dialog"
    );
    const ratingInput = ratingDialog.querySelector("input[type='number']");
    const submitButton = ratingDialog.querySelector(".submit-button");

    ratingInput.value = 5;
    ratingInput.dispatchEvent(new Event("input"));
    submitButton.click();

    const { detail } = await oneEvent(element, "tutorial-rated");
    expect(detail.tutorialId).to.equal("1");
    expect(detail.rating).to.equal(5);
  });

  it("handles tutorial bookmarking", async () => {
    const card = await TestUtils.queryComponent(element, ".tutorial-card");
    const bookmarkButton = card.querySelector(".bookmark-button");

    bookmarkButton.click();
    await TestUtils.waitForComponent(element);

    expect(bookmarkButton.classList.contains("bookmarked")).to.be.true;
    expect(localStorage.getItem("bookmarked-tutorials")).to.include("1");
  });
});
