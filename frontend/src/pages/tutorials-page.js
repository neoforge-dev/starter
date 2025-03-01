import {  html, css  } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";
import { BaseComponent } from "../components/base-component.js";
import { baseStyles } from "../styles/base.js";

/**
 * @element tutorials-page
 * @description Tutorials page component with filtering and grid layout
 */
export class TutorialsPage extends BaseComponent {
  static properties = {
    tutorials: { type: Array, state: true },
    selectedCategory: { type: String, state: true },
    selectedDifficulty: { type: String, state: true },
    searchQuery: { type: String, state: true },
    loading: { type: Boolean, state: true },
    error: { type: String, state: true },
  };

  static styles = [
    baseStyles,
    css`
      :host {
        display: block;
        padding: var(--spacing-lg);
      }

      .tutorials-container {
        max-width: var(--content-width);
        margin: 0 auto;
      }

      h1 {
        font-size: var(--font-size-xxl);
        margin-bottom: var(--spacing-xl);
        text-align: center;
      }

      .filters {
        display: flex;
        gap: var(--spacing-md);
        margin-bottom: var(--spacing-xl);
        flex-wrap: wrap;
      }

      .filter-button {
        padding: var(--spacing-sm) var(--spacing-md);
        background: var(--color-surface);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-sm);
        cursor: pointer;
        transition: all 0.2s;
      }

      .filter-button.active {
        background: var(--color-primary);
        color: white;
        border-color: var(--color-primary);
      }

      .search-bar {
        width: 100%;
        max-width: 500px;
        margin: 0 auto var(--spacing-xl);
      }

      .search-input {
        width: 100%;
        padding: var(--spacing-sm);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-sm);
        font-size: var(--font-size-base);
      }

      .tutorials-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: var(--spacing-lg);
      }

      .tutorial-card {
        background: var(--color-surface);
        border-radius: var(--radius-lg);
        overflow: hidden;
        transition: transform 0.2s;
        cursor: pointer;
      }

      .tutorial-card:hover {
        transform: translateY(-4px);
      }

      .tutorial-image {
        width: 100%;
        height: 200px;
        object-fit: cover;
      }

      .tutorial-content {
        padding: var(--spacing-md);
      }

      .tutorial-title {
        font-size: var(--font-size-lg);
        margin-bottom: var(--spacing-sm);
      }

      .tutorial-description {
        color: var(--color-text-light);
        margin-bottom: var(--spacing-md);
      }

      .tutorial-meta {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
        font-size: var(--font-size-sm);
      }

      .tutorial-tags {
        display: flex;
        flex-wrap: wrap;
        gap: var(--spacing-xs);
        margin-top: var(--spacing-sm);
      }

      .tutorial-tag {
        padding: var(--spacing-xs) var(--spacing-sm);
        background: var(--color-surface-variant);
        border-radius: var(--radius-sm);
        font-size: var(--font-size-sm);
      }

      .author-info {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
        margin-top: var(--spacing-md);
      }

      .author-avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        object-fit: cover;
      }

      .author-details {
        font-size: var(--font-size-sm);
      }

      .author-name {
        font-weight: 500;
      }

      .author-role {
        color: var(--color-text-light);
      }

      .loading-indicator {
        text-align: center;
        padding: var(--spacing-xl);
      }

      .error-message {
        color: var(--color-error);
        text-align: center;
        padding: var(--spacing-xl);
      }

      @media (max-width: 768px) {
        .filters {
          flex-direction: column;
        }

        .filter-button {
          width: 100%;
        }
      }
    `,
  ];

  constructor() {
    super();
    this.tutorials = [];
    this.selectedCategory = null;
    this.selectedDifficulty = null;
    this.searchQuery = "";
    this.loading = true;
    this.error = null;
    this.handleEvent = this.handleEvent.bind(this);
  }

  async connectedCallback() {
    super.connectedCallback();
    await this.loadTutorials();
  }

  async loadTutorials() {
    try {
      this.loading = true;
      const { tutorials } = await window.api.getTutorials();
      this.tutorials = tutorials;
    } catch (error) {
      console.error("Failed to load tutorials:", error);
      this.error = "Failed to load tutorials";
    } finally {
      this.loading = false;
    }
  }

  handleEvent(event) {
    if (event.type === "click") {
      const action = event.target.dataset.action;
      if (action === "category") {
        this.handleCategoryFilter(event.target.dataset.value);
      } else if (action === "difficulty") {
        this.handleDifficultyFilter(event.target.dataset.value);
      } else if (action === "tutorial") {
        this.handleTutorialClick(
          event.target.closest(".tutorial-card").dataset.id
        );
      }
    } else if (event.type === "input") {
      this.handleSearch(event);
    }
  }

  handleCategoryFilter(category) {
    this.selectedCategory =
      this.selectedCategory === category ? null : category;
    this.dispatchFilterChange();
  }

  handleDifficultyFilter(difficulty) {
    this.selectedDifficulty =
      this.selectedDifficulty === difficulty ? null : difficulty;
    this.dispatchFilterChange();
  }

  handleSearch(event) {
    this.searchQuery = event.target.value;
    this.dispatchFilterChange();
  }

  handleTutorialClick(tutorialId) {
    const tutorial = this.tutorials.find((t) => t.id === tutorialId);
    if (tutorial) {
      this.dispatchEvent(
        new CustomEvent("tutorial-selected", {
          detail: { tutorial },
          bubbles: true,
          composed: true,
        })
      );
    }
  }

  dispatchFilterChange() {
    this.dispatchEvent(
      new CustomEvent("filter-change", {
        detail: {
          category: this.selectedCategory,
          difficulty: this.selectedDifficulty,
          searchQuery: this.searchQuery,
        },
        bubbles: true,
        composed: true,
      })
    );
  }

  getFilteredTutorials() {
    return this.tutorials.filter((tutorial) => {
      // Category filter
      if (
        this.selectedCategory &&
        tutorial.category !== this.selectedCategory
      ) {
        return false;
      }

      // Difficulty filter
      if (
        this.selectedDifficulty &&
        tutorial.difficulty !== this.selectedDifficulty
      ) {
        return false;
      }

      // Search filter
      if (this.searchQuery) {
        const searchLower = this.searchQuery.toLowerCase();
        return (
          tutorial.title.toLowerCase().includes(searchLower) ||
          tutorial.description.toLowerCase().includes(searchLower) ||
          tutorial.tags.some((tag) => tag.toLowerCase().includes(searchLower))
        );
      }

      return true;
    });
  }

  render() {
    if (this.loading) {
      return html`<div class="loading-indicator">Loading tutorials...</div>`;
    }

    if (this.error) {
      return html`<div class="error-message">${this.error}</div>`;
    }

    const filteredTutorials = this.getFilteredTutorials();

    return html`
      <div class="tutorials-container">
        <h1>Tutorials</h1>

        <div class="search-bar">
          <input
            type="text"
            class="search-input"
            placeholder="Search tutorials..."
            .value=${this.searchQuery}
            @input=${this.handleEvent}
          />
        </div>

        <div class="filters">
          <button
            class="filter-button ${this.selectedCategory === "beginner"
              ? "active"
              : ""}"
            data-action="category"
            data-value="beginner"
            @click=${this.handleEvent}
          >
            Beginner
          </button>
          <button
            class="filter-button ${this.selectedCategory === "intermediate"
              ? "active"
              : ""}"
            data-action="category"
            data-value="intermediate"
            @click=${this.handleEvent}
          >
            Intermediate
          </button>
          <button
            class="filter-button ${this.selectedCategory === "advanced"
              ? "active"
              : ""}"
            data-action="category"
            data-value="advanced"
            @click=${this.handleEvent}
          >
            Advanced
          </button>
        </div>

        <div class="filters">
          <button
            class="filter-button ${this.selectedDifficulty === "easy"
              ? "active"
              : ""}"
            data-action="difficulty"
            data-value="easy"
            @click=${this.handleEvent}
          >
            Easy
          </button>
          <button
            class="filter-button ${this.selectedDifficulty === "medium"
              ? "active"
              : ""}"
            data-action="difficulty"
            data-value="medium"
            @click=${this.handleEvent}
          >
            Medium
          </button>
          <button
            class="filter-button ${this.selectedDifficulty === "hard"
              ? "active"
              : ""}"
            data-action="difficulty"
            data-value="hard"
            @click=${this.handleEvent}
          >
            Hard
          </button>
        </div>

        <div class="tutorials-grid">
          ${filteredTutorials.map(
            (tutorial) => html`
              <div
                class="tutorial-card"
                data-id=${tutorial.id}
                @click=${this.handleEvent}
                data-action="tutorial"
              >
                <img
                  class="tutorial-image"
                  src=${tutorial.image}
                  alt=${tutorial.title}
                  loading="lazy"
                />
                <div class="tutorial-content">
                  <h2 class="tutorial-title">${tutorial.title}</h2>
                  <p class="tutorial-description">${tutorial.description}</p>
                  <div class="tutorial-meta">
                    <span>${tutorial.duration} minutes</span>
                    <span>•</span>
                    <span>${tutorial.category}</span>
                    <span>•</span>
                    <span>${tutorial.difficulty}</span>
                  </div>
                  <div class="tutorial-tags">
                    ${tutorial.tags.map(
                      (tag) => html` <span class="tutorial-tag">${tag}</span> `
                    )}
                  </div>
                  <div class="author-info">
                    <img
                      class="author-avatar"
                      src=${tutorial.author.avatar}
                      alt=${tutorial.author.name}
                      loading="lazy"
                    />
                    <div class="author-details">
                      <div class="author-name">${tutorial.author.name}</div>
                      <div class="author-role">${tutorial.author.role}</div>
                    </div>
                  </div>
                </div>
              </div>
            `
          )}
        </div>
      </div>
    `;
  }
}

customElements.define("tutorials-page", TutorialsPage);
