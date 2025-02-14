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
      <neo-faq-accordion
        .items=${mockFAQs}
        variant="default"
        layout="stack"
        .columns=${1}
      ></neo-faq-accordion>
    `);
  });

  it("renders all FAQ items", () => {
    const items = element.shadowRoot.querySelectorAll(".accordion-item");
    expect(items.length).to.equal(mockFAQs.length);
  });

  it("renders questions and answers correctly", () => {
    const firstItem = element.shadowRoot.querySelector(".accordion-item");
    const question = firstItem.querySelector(".question-button");
    const answer = firstItem.querySelector(".answer-content");

    expect(question.textContent.trim()).to.include(mockFAQs[0].question);
    expect(answer.textContent.trim()).to.equal(mockFAQs[0].answer);
  });

  it("toggles items on click", async () => {
    const firstItem = element.shadowRoot.querySelector(".accordion-item");
    const question = firstItem.querySelector(".question-button");
    const answer = firstItem.querySelector(".answer");

    // Initially closed
    expect(answer.classList.contains("open")).to.be.false;

    // Click to open
    question.click();
    await element.updateComplete;
    expect(answer.classList.contains("open")).to.be.true;

    // Click to close
    question.click();
    await element.updateComplete;
    expect(answer.classList.contains("open")).to.be.false;
  });

  it("handles multiple open items when allowed", async () => {
    element.allowMultiple = true;
    await element.updateComplete;

    const items = element.shadowRoot.querySelectorAll(".accordion-item");
    const firstQuestion = items[0].querySelector(".question-button");
    const secondQuestion = items[1].querySelector(".question-button");
    const firstAnswer = items[0].querySelector(".answer");
    const secondAnswer = items[1].querySelector(".answer");

    // Open first item
    firstQuestion.click();
    await element.updateComplete;
    expect(firstAnswer.classList.contains("open")).to.be.true;

    // Open second item
    secondQuestion.click();
    await element.updateComplete;
    expect(firstAnswer.classList.contains("open")).to.be.true;
    expect(secondAnswer.classList.contains("open")).to.be.true;
  });

  it("closes other items when allowMultiple is false", async () => {
    element.allowMultiple = false;
    await element.updateComplete;

    const items = element.shadowRoot.querySelectorAll(".accordion-item");
    const firstQuestion = items[0].querySelector(".question-button");
    const secondQuestion = items[1].querySelector(".question-button");
    const firstAnswer = items[0].querySelector(".answer");
    const secondAnswer = items[1].querySelector(".answer");

    // Open first item
    firstQuestion.click();
    await element.updateComplete;
    expect(firstAnswer.classList.contains("open")).to.be.true;

    // Open second item
    secondQuestion.click();
    await element.updateComplete;
    expect(firstAnswer.classList.contains("open")).to.be.false;
    expect(secondAnswer.classList.contains("open")).to.be.true;
  });

  it("handles different layouts", async () => {
    // Test stack layout
    expect(element.shadowRoot.querySelector(".layout-stack")).to.exist;

    // Test grid layout
    element.layout = "grid";
    await element.updateComplete;
    expect(element.shadowRoot.querySelector(".layout-grid")).to.exist;

    // Test sections layout
    element.layout = "sections";
    await element.updateComplete;
    expect(element.shadowRoot.querySelector(".layout-sections")).to.exist;
  });

  it("handles empty items array", async () => {
    element.items = [];
    await element.updateComplete;
    expect(element.shadowRoot.querySelector(".faq-container")).to.exist;
  });

  it("supports keyboard navigation", async () => {
    const firstItem = element.shadowRoot.querySelector(".accordion-item");
    const question = firstItem.querySelector(".question-button");
    const answer = firstItem.querySelector(".answer");

    // Press Enter to open
    question.dataset.index = "0";
    question.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Enter",
        bubbles: true,
        composed: true,
        cancelable: true,
      })
    );
    await element.updateComplete;
    // Wait for any additional updates
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(answer.classList.contains("open")).to.be.true;

    // Press Space to close
    question.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: " ",
        bubbles: true,
        composed: true,
        cancelable: true,
      })
    );
    await element.updateComplete;
    // Wait for any additional updates
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(answer.classList.contains("open")).to.be.false;
  });

  it("supports default open items", async () => {
    element = await fixture(html`
      <neo-faq-accordion
        .items=${mockFAQs}
        .defaultOpen=${true}
      ></neo-faq-accordion>
    `);
    await element.updateComplete;

    const answers = element.shadowRoot.querySelectorAll(".answer");
    answers.forEach((answer) => {
      expect(answer.classList.contains("open")).to.be.true;
    });
  });

  it("handles category filtering", async () => {
    const categoryFAQs = [
      {
        category: "General",
        items: [mockFAQs[0]],
      },
    ];

    element.items = categoryFAQs;
    element.layout = "sections";
    await element.updateComplete;

    const sections = element.shadowRoot.querySelectorAll(".faq-section");
    expect(sections.length).to.equal(1);
    expect(sections[0].querySelector(".section-title").textContent).to.equal(
      "General"
    );
  });
});
