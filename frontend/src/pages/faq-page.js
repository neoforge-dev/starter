import {  html, css  } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";
import {
  BaseComponent,
  defineComponent,
} from "../components/base-component.js";
import { baseStyles } from "../styles/base.js";

/**
 * @element faq-page
 * @description FAQ page component with sections, search, and filtering
 */
@defineComponent("faq-page")
export class FAQPage extends BaseComponent {
  static properties = {
    sections: { type: Array, state: true },
    selectedCategory: { type: String, state: true },
    searchQuery: { type: String, state: true },
    loading: { type: Boolean, state: true },
    error: { type: String, state: true },
  };

  static styles = [
    baseStyles,
    css`
      :host {
        display: block;
        padding: var(--spacing-xl);
        max-width: 800px;
        margin: 0 auto;
      }

      h1 {
        text-align: center;
        margin-bottom: var(--spacing-lg);
        color: var(--text-color);
      }

      .search-bar {
        margin-bottom: var(--spacing-lg);
      }

      .search-input {
        width: 100%;
        padding: var(--spacing-sm);
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius);
        font-size: 1rem;
      }

      .category-filter {
        display: flex;
        gap: var(--spacing-sm);
        margin-bottom: var(--spacing-lg);
        overflow-x: auto;
        padding-bottom: var(--spacing-sm);
      }

      .category-filter button {
        padding: var(--spacing-sm) var(--spacing-md);
        background-color: var(--surface-color);
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius);
        color: var(--text-color);
        cursor: pointer;
        white-space: nowrap;
        transition: all 0.2s;
      }

      .category-filter button.active {
        background-color: var(--primary-color);
        border-color: var(--primary-color);
        color: white;
      }

      .faq-section {
        background: var(--surface-color);
        border-radius: var(--border-radius);
        margin-bottom: var(--spacing-md);
        overflow: hidden;
      }

      .faq-section h2 {
        padding: var(--spacing-md);
        margin: 0;
        background-color: var(--surface-color-dark);
        color: var(--text-color);
      }

      .faq-question {
        padding: var(--spacing-md);
        background-color: var(--surface-color);
        border: none;
        width: 100%;
        text-align: left;
        cursor: pointer;
        display: flex;
        justify-content: space-between;
        align-items: center;
        color: var(--text-color);
        font-weight: 500;
      }

      .faq-question:hover {
        background-color: var(--surface-color-hover);
      }

      .faq-answer {
        padding: 0;
        max-height: 0;
        overflow: hidden;
        transition: all 0.3s ease-out;
      }

      .faq-answer.expanded {
        padding: var(--spacing-md);
        max-height: 500px;
      }

      .error-message {
        color: var(--error-color);
        text-align: center;
        padding: var(--spacing-lg);
      }

      .loading-spinner {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 200px;
      }

      .search-result {
        padding: var(--spacing-sm);
        border-bottom: 1px solid var(--border-color);
      }

      .search-result:last-child {
        border-bottom: none;
      }
    `,
  ];

  constructor() {
    super();
    this.sections = [];
    this.selectedCategory = "all";
    this.searchQuery = "";
    this.loading = true;
    this.error = "";
  }

  async connectedCallback() {
    super.connectedCallback();
    await this.loadFAQs();
  }

  async loadFAQs() {
    try {
      this.loading = true;
      // Simulated API call
      this.sections = [
        {
          category: "general",
          title: "General Questions",
          questions: [
            {
              question: "What is NeoForge?",
              answer: "NeoForge is a modern web development framework...",
            },
            {
              question: "How do I get started?",
              answer:
                "You can get started by following our quick start guide...",
            },
          ],
        },
        {
          category: "technical",
          title: "Technical Questions",
          questions: [
            {
              question: "What are the system requirements?",
              answer: "NeoForge requires Node.js 14+ and npm 6+...",
            },
            {
              question: "How do I deploy my application?",
              answer: "We provide several deployment options...",
            },
          ],
        },
      ];
    } catch (error) {
      this.error = error.message;
    } finally {
      this.loading = false;
    }
  }

  handleCategoryChange(category) {
    this.selectedCategory = category;
  }

  handleSearch(e) {
    this.searchQuery = e.target.value.toLowerCase();
  }

  toggleAnswer(e) {
    const answer = e.target.nextElementSibling;
    answer.classList.toggle("expanded");
  }

  get filteredSections() {
    return this.sections
      .filter((section) => {
        if (this.selectedCategory === "all") return true;
        return section.category === this.selectedCategory;
      })
      .map((section) => ({
        ...section,
        questions: section.questions.filter(
          (q) =>
            q.question.toLowerCase().includes(this.searchQuery) ||
            q.answer.toLowerCase().includes(this.searchQuery)
        ),
      }))
      .filter((section) => section.questions.length > 0);
  }

  render() {
    if (this.loading) {
      return html`<div class="loading-spinner"></div>`;
    }

    if (this.error) {
      return html`<div class="error-message">${this.error}</div>`;
    }

    const categories = [
      "all",
      ...new Set(this.sections.map((s) => s.category)),
    ];

    return html`
      <h1>Frequently Asked Questions</h1>

      <div class="search-bar">
        <input
          type="text"
          class="search-input"
          placeholder="Search FAQs..."
          @input=${this.handleSearch}
        />
      </div>

      <div class="category-filter">
        ${categories.map(
          (category) => html`
            <button
              class="${this.selectedCategory === category ? "active" : ""}"
              @click=${() => this.handleCategoryChange(category)}
            >
              ${category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          `
        )}
      </div>

      ${this.filteredSections.map(
        (section) => html`
          <div class="faq-section">
            <h2>${section.title}</h2>
            ${section.questions.map(
              (q) => html`
                <button class="faq-question" @click=${this.toggleAnswer}>
                  ${q.question}
                  <span class="icon">▼</span>
                </button>
                <div class="faq-answer">${q.answer}</div>
              `
            )}
          </div>
        `
      )}
    `;
  }
}
