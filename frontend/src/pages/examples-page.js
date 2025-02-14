import { LitElement, html, css } from "lit";
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
        role: article;
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
    this.selectedCategory = "";
    this.selectedDifficulty = "";
    this.searchQuery = "";
    this.isMobile = false;
    this.initialized = false;
    this.attachShadow({ mode: "open" });
  }

  async connectedCallback() {
    super.connectedCallback();
    try {
      await this.loadData();
      this.setupMobileDetection();
      this.initialized = true;
      await this.updateComplete;
    } catch (error) {
      console.error("Failed to initialize:", error);
      this.initialized = false;
      this.loading = false;
    }
  }

  async firstUpdated() {
    await this.updateComplete;
  }

  async loadData() {
    this.loading = true;
    try {
      const [examples, categories] = await Promise.all([
        window.examples.getExamples(),
        window.examples.getCategories(),
      ]);
      this.examples = examples || [];
      this.categories = categories || [];
    } catch (error) {
      console.error("Failed to load examples:", error);
      this.examples = [];
      this.categories = [];
      throw error;
    } finally {
      this.loading = false;
      await this.updateComplete;
    }
  }

  setupMobileDetection() {
    const mediaQuery = window.matchMedia("(max-width: 768px)");
    const handleMobileChange = (e) => {
      this.isMobile = e.matches;
    };
    handleMobileChange(mediaQuery);
    mediaQuery.addListener(handleMobileChange);
  }

  getFilteredExamples() {
    return this.examples.filter((example) => {
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
          .includes(this.searchQuery.toLowerCase()) ||
        example.tags.some((tag) =>
          tag.toLowerCase().includes(this.searchQuery.toLowerCase())
        );
      return matchesCategory && matchesDifficulty && matchesSearch;
    });
  }

  handleCategoryClick(category) {
    this.selectedCategory = this.selectedCategory === category ? "" : category;
  }

  handleDifficultyChange(e) {
    this.selectedDifficulty = e.target.value;
  }

  handleSearch(e) {
    this.searchQuery = e.target.value;
  }

  async handleLike(example) {
    try {
      await window.examples.likeExample(example.id);
      example.stats.likes++;
      this.requestUpdate();
    } catch (error) {
      console.error("Failed to like example:", error);
    }
  }

  async handleDownload(example) {
    try {
      await window.examples.downloadExample(example.id);
      this.dispatchEvent(
        new CustomEvent("download", {
          detail: { exampleId: example.id },
          bubbles: true,
          composed: true,
        })
      );
    } catch (error) {
      console.error("Failed to download example:", error);
    }
  }

  handlePreview(example) {
    this.dispatchEvent(
      new CustomEvent("show-preview", {
        detail: { exampleId: example.id },
        bubbles: true,
        composed: true,
      })
    );
  }

  handleKeyDown(e, nextCard) {
    if (e.key === "ArrowRight" && nextCard) {
      nextCard.focus();
    }
  }

  render() {
    if (!this.initialized) {
      return html`<div>Initializing...</div>`;
    }

    return html`
      <div class="page-container ${this.isMobile ? "mobile" : ""}">
        <h1>Examples</h1>

        ${this.loading
          ? html`
              <div class="loading-indicator">
                <span>Loading examples...</span>
              </div>
              <div class="examples-skeleton">
                ${Array(6)
                  .fill()
                  .map(
                    () => html`
                      <div class="example-card">
                        <div class="skeleton-title"></div>
                        <div class="skeleton-description"></div>
                        <div class="skeleton-tags"></div>
                      </div>
                    `
                  )}
              </div>
            `
          : html`
              <div class="filters">
                <div class="category-filters">
                  ${this.categories.map(
                    (category) => html`
                      <button
                        class="category-filter ${this.selectedCategory ===
                        category.id
                          ? "active"
                          : ""}"
                        @click=${() => this.handleCategoryClick(category.id)}
                        aria-label="Filter by ${category.name}"
                      >
                        ${category.name} (${category.count})
                      </button>
                    `
                  )}
                </div>

                <div class="search-bar">
                  <input
                    type="text"
                    class="search-input"
                    placeholder="Search examples..."
                    .value=${this.searchQuery}
                    @input=${this.handleSearch}
                  />
                </div>

                <select
                  class="difficulty-select"
                  @change=${this.handleDifficultyChange}
                  aria-label="Filter by difficulty"
                >
                  <option value="">All Difficulties</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              <div class="examples-grid">
                ${this.getFilteredExamples().map(
                  (example, index) => html`
                    <div
                      class="example-card"
                      role="article"
                      aria-labelledby="title-${example.id}"
                      tabindex="0"
                      @keydown=${(e) =>
                        this.handleKeyDown(
                          e,
                          this.shadowRoot.querySelectorAll(".example-card")[
                            index + 1
                          ]
                        )}
                    >
                      <h2 class="example-title" id="title-${example.id}">
                        ${example.title}
                      </h2>
                      <p class="example-description">${example.description}</p>
                      <div class="example-tags">
                        ${example.tags.map(
                          (tag) => html`
                            <span class="example-tag">${tag}</span>
                          `
                        )}
                      </div>
                      <div class="difficulty-badge">${example.difficulty}</div>
                      <div class="example-stats">
                        <span class="view-count"
                          >${example.stats.views} views</span
                        >
                        <span class="like-count"
                          >${example.stats.likes} likes</span
                        >
                        <span class="download-count"
                          >${example.stats.downloads} downloads</span
                        >
                      </div>
                      <div class="author-info">
                        <img
                          class="author-avatar"
                          src=${example.author.avatar}
                          alt=${example.author.name}
                        />
                        <span class="author-name">${example.author.name}</span>
                      </div>
                      <div class="example-actions">
                        <button
                          class="preview-button"
                          @click=${() => this.handlePreview(example)}
                          aria-label="Preview example"
                        >
                          Preview
                        </button>
                        <button
                          class="like-button"
                          @click=${() => this.handleLike(example)}
                          aria-label="Like example"
                        >
                          Like
                        </button>
                        <button
                          class="download-button"
                          @click=${() => this.handleDownload(example)}
                          aria-label="Download example"
                        >
                          Download
                        </button>
                      </div>
                    </div>
                  `
                )}
              </div>
            `}
      </div>
    `;
  }
}

customElements.define("examples-page", ExamplesPage);
