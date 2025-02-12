import { TestRunner, Assert, ComponentTester } from "../test-utils.js";
import { FAQPage } from "../../pages/faq-page.js";

const runner = new TestRunner();

runner.describe("FAQPage", () => {
  let element;

  runner.beforeEach(async () => {
    element = await ComponentTester.render(FAQPage);
  });

  runner.afterEach(() => {
    ComponentTester.cleanup();
  });

  runner.it("should render FAQ sections", async () => {
    const shadowRoot = element.shadowRoot;
    const faqItems = shadowRoot.querySelectorAll(".faq-item");

    Assert.greaterThan(faqItems.length, 0, "Should have FAQ items");
    faqItems.forEach((item) => {
      const question = item.querySelector(".question");
      const answer = item.querySelector(".answer");

      Assert.notNull(question, "FAQ item should have a question");
      Assert.notNull(answer, "FAQ item should have an answer");
    });
  });

  runner.it("should toggle FAQ answers", async () => {
    const shadowRoot = element.shadowRoot;
    const faqItems = shadowRoot.querySelectorAll(".faq-item");

    for (const item of faqItems) {
      const question = item.querySelector(".question");
      const answer = item.querySelector(".answer");

      // Initial state
      Assert.false(
        answer.classList.contains("show"),
        "Answer should be hidden initially"
      );

      // Toggle open
      await ComponentTester.click(question);
      Assert.true(
        answer.classList.contains("show"),
        "Answer should be shown after click"
      );

      // Toggle closed
      await ComponentTester.click(question);
      Assert.false(
        answer.classList.contains("show"),
        "Answer should be hidden after second click"
      );
    }
  });

  runner.it("should have working search filter", async () => {
    const shadowRoot = element.shadowRoot;
    const searchInput = shadowRoot.querySelector('input[type="search"]');
    const faqItems = shadowRoot.querySelectorAll(".faq-item");
    const initialCount = faqItems.length;

    Assert.notNull(searchInput, "Search input should be present");

    // Search for specific term
    await ComponentTester.type(searchInput, "api");

    const filteredItems = shadowRoot.querySelectorAll(".faq-item:not(.hidden)");
    Assert.lessThan(
      filteredItems.length,
      initialCount,
      "Should filter FAQ items"
    );

    // Clear search
    await ComponentTester.type(searchInput, "");
    const resetItems = shadowRoot.querySelectorAll(".faq-item:not(.hidden)");
    Assert.equal(
      resetItems.length,
      initialCount,
      "Should show all items when search is cleared"
    );
  });

  runner.it("should handle category filtering", async () => {
    const shadowRoot = element.shadowRoot;
    const categoryFilters = shadowRoot.querySelectorAll(".category-filter");
    const faqItems = shadowRoot.querySelectorAll(".faq-item");
    const initialCount = faqItems.length;

    Assert.greaterThan(
      categoryFilters.length,
      0,
      "Should have category filters"
    );

    for (const filter of categoryFilters) {
      const category = filter.dataset.category;

      // Click category filter
      await ComponentTester.click(filter);

      const visibleItems = shadowRoot.querySelectorAll(
        ".faq-item:not(.hidden)"
      );
      visibleItems.forEach((item) => {
        Assert.equal(
          item.dataset.category,
          category,
          "Visible items should match selected category"
        );
      });
    }

    // Click "All" category
    const allFilter = shadowRoot.querySelector(
      '.category-filter[data-category="all"]'
    );
    await ComponentTester.click(allFilter);

    const allItems = shadowRoot.querySelectorAll(".faq-item:not(.hidden)");
    Assert.equal(
      allItems.length,
      initialCount,
      "Should show all items when 'All' category is selected"
    );
  });
});

// Run tests
runner.run();
