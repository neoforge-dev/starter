import {  LitElement, html, css  } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";
import { baseStyles } from "../components/styles/base.js";

export class ExamplesPage extends LitElement {
  static properties = {
    examples: { type: Array },
    categories: { type: Array },
    loading: { type: Boolean },
    selectedCategory: { type: String },
    selectedDifficulty: { type: String },
    searchQuery: { type: String },
    isMobile: { type: Boolean },
    initialized: { type: Boolean },
    error: { type: String },
  };

  static styles = [
    baseStyles,
    css`
      :host {
        display: block;
        padding: 1rem;
      }

      .page-container {
        max-width: 1200px;
        margin: 0 auto;
      }

      .page-container.mobile {
        padding: 0.5rem;
      }

      h1 {
        font-size: 2.5rem;
        margin-bottom: var(--spacing-xl);
        color: var(--color-primary);
        text-align: center;
      }

      .filters {
        display: flex;
        gap: var(--spacing-md);
        margin-bottom: var(--spacing-lg);
        flex-wrap: wrap;
      }

      .category-filters {
        display: flex;
        gap: 1rem;
        margin-bottom: 1.5rem;
        flex-wrap: wrap;
      }

      .category-filter {
        padding: 0.5rem 1rem;
        border-radius: 20px;
        border: none;
        background: var(--surface-color);
        cursor: pointer;
        transition: background-color 0.2s;
      }

      .category-filter.active {
        background: var(--primary-color);
        color: white;
      }

      .search-bar {
        margin-bottom: 1.5rem;
      }

      .search-input {
        width: 100%;
        max-width: 400px;
        padding: 0.75rem;
        border-radius: 4px;
        border: 1px solid var(--border-color);
      }

      .examples-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 1.5rem;
        margin-top: 2rem;
      }

      .example-card {
        background: var(--surface-color);
        border-radius: 8px;
        padding: 1.5rem;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        transition: transform 0.2s;
        position: relative;
      }

      .example-card:hover {
        transform: translateY(-2px);
      }

      .example-title {
        font-size: 1.25rem;
        font-weight: 600;
        margin-bottom: 0.5rem;
      }

      .example-description {
        color: var(--text-secondary);
        margin-bottom: 1rem;
      }

      .example-tag {
        display: inline-block;
        padding: 0.25rem 0.5rem;
        background: var(--tag-background);
        color: var(--tag-color);
        border-radius: 4px;
        margin-right: 0.5rem;
        margin-bottom: 0.5rem;
        font-size: 0.875rem;
      }

      .loading-container,
      .error-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 300px;
        text-align: center;
      }

      .error-message {
        color: var(--color-error);
        margin-bottom: 1rem;
      }

      .loading-container p {
        margin-top: 1rem;
        color: var(--color-text-secondary);
      }

      button {
        padding: 0.5rem 1rem;
        border-radius: 4px;
        border: none;
        background: var(--color-primary);
        color: white;
        cursor: pointer;
        transition: background-color 0.2s;
      }

      button:hover {
        background: var(--color-primary-dark);
      }

      button:focus {
        outline: 2px solid var(--color-primary);
        outline-offset: 2px;
      }

      .loading-indicator {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 200px;
      }

      .examples-skeleton {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 1.5rem;
        margin-top: 2rem;
      }

      .example-stats {
        display: flex;
        gap: var(--spacing-md);
        margin-top: var(--spacing-sm);
        color: var(--color-secondary);
        font-size: var(--font-size-sm);
      }

      .example-actions {
        display: flex;
        gap: var(--spacing-sm);
        margin-top: var(--spacing-md);
      }

      .preview-button,
      .like-button,
      .download-button {
        padding: var(--spacing-sm);
        border-radius: var(--radius-md);
        border: 1px solid var(--color-border);
        background: var(--color-surface);
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: var(--spacing-xs);
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
      }

      .difficulty-badge {
        position: absolute;
        top: var(--spacing-md);
        right: var(--spacing-md);
        padding: var(--spacing-xs) var(--spacing-sm);
        border-radius: var(--radius-sm);
        font-size: var(--font-size-sm);
        background: var(--color-surface);
      }

      .hidden {
        display: none;
      }
    `,
  ];

  constructor() {
    super();
    this.examples = [];
    this.categories = [];
    this.loading = true;
    this.selectedCategory = null;
    this.selectedDifficulty = null;
    this.searchQuery = "";
    this.isMobile = false;
    this.initialized = false;
    this.error = null;
  }

  async connectedCallback() {
    super.connectedCallback();
    this.setupMobileDetection();
    await this.loadData();
  }

  setupMobileDetection() {
    const mediaQuery = window.matchMedia("(max-width: 768px)");
    this.isMobile = mediaQuery.matches;

    // Use addListener for better compatibility
    mediaQuery.addListener((e) => {
      this.isMobile = e.matches;
      this.requestUpdate();
    });
  }

  async loadData() {
    try {
      this.loading = true;
      this.error = null;

      // For tests, use mock data if available
      if (window.mockExamples) {
        this.examples = window.mockExamples;
        this.initialized = true;
        return;
      }

      // Simulated API call
      const response = await fetch("/api/examples");
      if (!response.ok) {
        throw new Error("Failed to load examples");
      }

      const data = await response.json();
      this.examples = data.examples;
      this.categories = data.categories;
      this.initialized = true;
    } catch (err) {
      this.error = err.message;
      console.error("Error loading examples:", err);
    } finally {
      this.loading = false;
    }
  }

  handleCategoryClick(category) {
    this.selectedCategory =
      this.selectedCategory === category ? null : category;
  }

  handleDifficultyChange(event) {
    this.selectedDifficulty =
      event.target.value === "all" ? null : event.target.value;
  }

  handleSearch(event) {
    this.searchQuery = event.target.value;
  }

  async handleLike(exampleId) {
    try {
      await window.examples.likeExample(exampleId);
      this.examples = this.examples.map((example) => {
        if (example.id === exampleId) {
          return {
            ...example,
            stats: { ...example.stats, likes: example.stats.likes + 1 },
          };
        }
        return example;
      });
    } catch (err) {
      console.error("Error liking example:", err);
    }
  }

  handleSort(event) {
    const sortValue = event.target.value;
    this.examples = [...this.examples].sort((a, b) => {
      switch (sortValue) {
        case "most-liked":
          return b.stats.likes - a.stats.likes;
        case "most-downloaded":
          return b.stats.downloads - a.stats.downloads;
        case "newest":
        default:
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });
  }

  handlePreview(exampleId) {
    this.dispatchEvent(
      new CustomEvent("show-preview", {
        detail: { exampleId },
        bubbles: true,
        composed: true,
      })
    );
  }

  handleDownload(exampleId) {
    this.dispatchEvent(
      new CustomEvent("download", {
        detail: { exampleId },
        bubbles: true,
        composed: true,
      })
    );
  }

  handleReport(exampleId) {
    this.dispatchEvent(
      new CustomEvent("report-issue", {
        detail: { exampleId },
        bubbles: true,
        composed: true,
      })
    );
  }

  render() {
    const containerClass = this.isMobile
      ? "page-container mobile"
      : "page-container";

    if (this.loading) {
      return html`
        <div class="loading-container">
          <div class="loading-indicator">Loading...</div>
          <div class="examples-skeleton">
            ${Array(6)
              .fill(0)
              .map(
                () => html`
                  <div class="example-card" aria-hidden="true">
                    <div class="skeleton-title"></div>
                    <div class="skeleton-description"></div>
                    <div class="skeleton-tags"></div>
                  </div>
                `
              )}
          </div>
        </div>
      `;
    }

    if (this.error) {
      return html`
        <div class="error-container">
          <p class="error-message">${this.error}</p>
          <button @click=${this.loadData}>Retry</button>
        </div>
      `;
    }

    const filteredExamples = this.examples.filter((example) => {
      const matchesCategory =
        !this.selectedCategory || example.category === this.selectedCategory;
      const matchesDifficulty =
        !this.selectedDifficulty ||
        example.difficulty === this.selectedDifficulty;
      const matchesSearch =
        !this.searchQuery ||
        example.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        example.description
          .toLowerCase()
          .includes(this.searchQuery.toLowerCase());

      return matchesCategory && matchesDifficulty && matchesSearch;
    });

    return html`
      <div class=${containerClass}>
        <h1>Example Projects</h1>

        <div class="filters">
          <select
            class="sort-select"
            @change=${this.handleSort}
            aria-label="Sort examples"
          >
            <option value="newest">Newest First</option>
            <option value="most-liked">Most Liked</option>
            <option value="most-downloaded">Most Downloaded</option>
          </select>

          <input
            type="text"
            class="search-input"
            placeholder="Search examples..."
            .value=${this.searchQuery}
            @input=${this.handleSearch}
            aria-label="Search examples"
          />
        </div>

        <div class="examples-grid" role="list">
          ${filteredExamples.map(
            (example) => html`
              <article
                class="example-card"
                role="article"
                aria-labelledby="title-${example.id}"
              >
                <h2 class="example-title" id="title-${example.id}">
                  ${example.title}
                </h2>
                <p class="example-description">${example.description}</p>

                <div class="example-tags">
                  ${example.tags.map(
                    (tag) => html` <span class="example-tag">${tag}</span> `
                  )}
                </div>

                <div class="difficulty-badge">${example.difficulty}</div>

                <div class="example-stats">
                  <span class="view-count">${example.stats.views} views</span>
                  <span class="like-count">${example.stats.likes} likes</span>
                  <span class="download-count"
                    >${example.stats.downloads} downloads</span
                  >
                </div>

                <div class="author-info">
                  <img
                    class="author-avatar"
                    src=${example.author.avatar}
                    alt="${example.author.name}'s avatar"
                  />
                  <span class="author-name">${example.author.name}</span>
                </div>

                <div class="example-actions">
                  <button
                    class="preview-button"
                    @click=${() => this.handlePreview(example.id)}
                    aria-label="Preview example"
                  >
                    Preview
                  </button>
                  <button
                    class="like-button"
                    @click=${() => this.handleLike(example.id)}
                    aria-label="Like example"
                  >
                    Like
                  </button>
                  <button
                    class="download-button"
                    @click=${() => this.handleDownload(example.id)}
                    aria-label="Download example"
                  >
                    Download
                  </button>
                  <button
                    class="report-button"
                    @click=${() => this.handleReport(example.id)}
                    aria-label="Report issue"
                  >
                    Report
                  </button>
                </div>
              </article>
            `
          )}
        </div>
      </div>
    `;
  }
}

customElements.define("examples-page", ExamplesPage);
