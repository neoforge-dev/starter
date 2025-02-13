import { fixture, expect, oneEvent } from "@open-wc/testing";
import { html } from "lit";
import "../../components/marketing/faq-accordion.js";

describe("FAQ Accordion", () => {
  const mockFAQs = [
    {
      question: "What is NeoForge?",
      answer: "NeoForge is a modern web development framework.",
      category: "general",
    },
    {
      question: "How do I get started?",
      answer: "Install via npm and follow our quick start guide.",
      category: "getting-started",
    },
    {
      question: "What are the system requirements?",
      answer: "Node.js 14+ and modern browsers.",
      category: "requirements",
    },
  ];

  let element;

  beforeEach(async () => {
    element = await fixture(html`
      <ui-faq-accordion
        .items=${mockFAQs}
        variant="default"
        layout="stack"
        .columns=${1}
      ></ui-faq-accordion>
    `);
  });

  it("renders all FAQ items", () => {
    const items = element.shadowRoot.querySelectorAll(".faq-item");
    expect(items.length).to.equal(mockFAQs.length);
  });

  it("renders questions and answers correctly", () => {
    const firstItem = element.shadowRoot.querySelector(".faq-item");

    expect(firstItem.querySelector(".faq-question").textContent).to.equal(
      mockFAQs[0].question
    );
    expect(firstItem.querySelector(".faq-answer").textContent).to.equal(
      mockFAQs[0].answer
    );
  });

  it("toggles items on click", async () => {
    const firstItem = element.shadowRoot.querySelector(".faq-item");
    const question = firstItem.querySelector(".faq-question");

    // Initially closed
    expect(firstItem.classList.contains("expanded")).to.be.false;

    // Click to open
    question.click();
    await element.updateComplete;
    expect(firstItem.classList.contains("expanded")).to.be.true;

    // Click to close
    question.click();
    await element.updateComplete;
    expect(firstItem.classList.contains("expanded")).to.be.false;
  });

  it("handles multiple open items when allowed", async () => {
    element.allowMultiple = true;
    await element.updateComplete;

    const items = element.shadowRoot.querySelectorAll(".faq-item");
    const [first, second] = items;

    // Open first item
    first.querySelector(".faq-question").click();
    await element.updateComplete;
    expect(first.classList.contains("expanded")).to.be.true;

    // Open second item
    second.querySelector(".faq-question").click();
    await element.updateComplete;
    expect(second.classList.contains("expanded")).to.be.true;
    expect(first.classList.contains("expanded")).to.be.true;
  });

  it("closes other items when allowMultiple is false", async () => {
    element.allowMultiple = false;
    await element.updateComplete;

    const items = element.shadowRoot.querySelectorAll(".faq-item");
    const [first, second] = items;

    // Open first item
    first.querySelector(".faq-question").click();
    await element.updateComplete;
    expect(first.classList.contains("expanded")).to.be.true;

    // Open second item
    second.querySelector(".faq-question").click();
    await element.updateComplete;
    expect(second.classList.contains("expanded")).to.be.true;
    expect(first.classList.contains("expanded")).to.be.false;
  });

  it("handles different layouts", async () => {
    // Test grid layout
    element.layout = "grid";
    element.columns = 2;
    await element.updateComplete;

    const container = element.shadowRoot.querySelector(".faq-grid");
    expect(container).to.exist;
    expect(container.style.gridTemplateColumns).to.include("repeat(2,");

    // Test masonry layout
    element.layout = "masonry";
    await element.updateComplete;

    expect(element.shadowRoot.querySelector(".faq-masonry")).to.exist;
  });

  it("applies different variants correctly", async () => {
    // Test minimal variant
    element.variant = "minimal";
    await element.updateComplete;

    expect(element.shadowRoot.querySelector(".variant-minimal")).to.exist;

    // Test bordered variant
    element.variant = "bordered";
    await element.updateComplete;

    expect(element.shadowRoot.querySelector(".variant-bordered")).to.exist;
  });

  it("handles empty items array", async () => {
    element.items = [];
    await element.updateComplete;

    const items = element.shadowRoot.querySelectorAll(".faq-item");
    expect(items.length).to.equal(0);

    const emptyMessage = element.shadowRoot.querySelector(".empty-message");
    expect(emptyMessage).to.exist;
  });

  it("supports keyboard navigation", async () => {
    const firstItem = element.shadowRoot.querySelector(".faq-item");
    const question = firstItem.querySelector(".faq-question");

    // Enter key
    question.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    await element.updateComplete;
    expect(firstItem.classList.contains("expanded")).to.be.true;

    // Space key
    question.dispatchEvent(new KeyboardEvent("keydown", { key: " " }));
    await element.updateComplete;
    expect(firstItem.classList.contains("expanded")).to.be.false;
  });

  it("maintains accessibility attributes", () => {
    const items = element.shadowRoot.querySelectorAll(".faq-item");

    items.forEach((item, index) => {
      const question = item.querySelector(".faq-question");
      const answer = item.querySelector(".faq-answer");

      expect(question.getAttribute("role")).to.equal("button");
      expect(question.getAttribute("aria-expanded")).to.equal("false");
      expect(question.getAttribute("aria-controls")).to.equal(
        `faq-answer-${index}`
      );

      expect(answer.getAttribute("role")).to.equal("region");
      expect(answer.getAttribute("aria-labelledby")).to.equal(
        `faq-question-${index}`
      );
    });
  });

  it("supports default open items", async () => {
    element = await fixture(html`
      <ui-faq-accordion
        .items=${mockFAQs}
        .defaultOpen=${[0]}
      ></ui-faq-accordion>
    `);

    const firstItem = element.shadowRoot.querySelector(".faq-item");
    expect(firstItem.classList.contains("expanded")).to.be.true;
  });

  it("handles category filtering", async () => {
    const category = "getting-started";
    element.activeCategory = category;
    await element.updateComplete;

    const visibleItems = element.shadowRoot.querySelectorAll(
      ".faq-item:not(.hidden)"
    );
    expect(visibleItems.length).to.equal(
      mockFAQs.filter((item) => item.category === category).length
    );
  });
});
