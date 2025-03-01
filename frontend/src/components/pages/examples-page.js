import {  LitElement, html, css  } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";
import { baseStyles } from "../styles/base.js";
import "../components/ui/card.js";
import "../components/ui/button.js";
import { router } from "../router.js";

export class ExamplesPage extends LitElement {
  static styles = [
    baseStyles,
    css`
      :host {
        display: block;
        padding: var(--spacing-xl);
      }
      h1 {
        color: var(--text-color);
        margin-bottom: var(--spacing-lg);
      }

      .examples-header {
        margin-bottom: var(--space-8);
        text-align: center;
      }

      .examples-title {
        font-size: var(--text-4xl);
        font-weight: var(--weight-bold);
        color: var(--text-1);
        margin-bottom: var(--space-4);
      }

      .examples-description {
        color: var(--text-2);
        font-size: var(--text-lg);
        max-width: 600px;
        margin: 0 auto;
      }

      .examples-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: var(--space-6);
        margin-bottom: var(--space-8);
      }

      .example-card {
        display: flex;
        flex-direction: column;
        height: 100%;
        cursor: pointer;
        transition: transform 0.2s ease;
      }

      .example-card:hover {
        transform: translateY(-4px);
      }

      .example-image {
        width: 100%;
        height: 200px;
        background: var(--surface-2);
        border-radius: var(--radius-2);
        margin-bottom: var(--space-4);
        overflow: hidden;
      }

      .example-image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .example-content {
        flex: 1;
      }

      .example-title {
        font-size: var(--text-xl);
        font-weight: var(--weight-bold);
        color: var(--text-1);
        margin-bottom: var(--space-2);
      }

      .example-description {
        color: var(--text-2);
        margin-bottom: var(--space-4);
      }

      .example-meta {
        display: flex;
        align-items: center;
        gap: var(--space-4);
        color: var(--text-2);
        font-size: var(--text-sm);
        margin-bottom: var(--space-4);
      }

      .example-meta-item {
        display: flex;
        align-items: center;
        gap: var(--space-1);
      }

      .example-tags {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-2);
        margin-bottom: var(--space-4);
      }

      .example-tag {
        padding: var(--space-1) var(--space-2);
        background: var(--surface-2);
        color: var(--text-2);
        border-radius: var(--radius-1);
        font-size: var(--text-sm);
      }

      .categories {
        display: flex;
        justify-content: center;
        gap: var(--space-4);
        margin-bottom: var(--space-8);
        flex-wrap: wrap;
      }

      .category-button {
        padding: var(--space-2) var(--space-4);
        background: var(--surface-2);
        color: var(--text-2);
        border: none;
        border-radius: var(--radius-2);
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .category-button:hover,
      .category-button.active {
        background: var(--brand);
        color: white;
      }

      @media (max-width: 640px) {
        .examples-grid {
          grid-template-columns: 1fr;
        }

        .categories {
          flex-direction: column;
        }

        .category-button {
          width: 100%;
        }
      }
    `,
  ];

  static properties = {
    activeCategory: { type: String },
  };

  constructor() {
    super();
    this.activeCategory = "all";
  }

  _handleCategoryClick(category) {
    this.activeCategory = category;
  }

  _renderExamples() {
    const examples = [
      {
        id: "todo-app",
        title: "Todo App",
        description:
          "A classic todo application showcasing state management and persistence.",
        image: "/assets/examples/todo-app.png",
        difficulty: "Beginner",
        timeToComplete: "1 hour",
        category: "state-management",
        tags: ["Components", "State", "LocalStorage"],
      },
      {
        id: "chat-app",
        title: "Real-time Chat",
        description: "Real-time chat application using WebSocket and FastAPI.",
        image: "/assets/examples/chat-app.png",
        difficulty: "Intermediate",
        timeToComplete: "2 hours",
        category: "real-time",
        tags: ["WebSocket", "Authentication", "Real-time"],
      },
      {
        id: "dashboard",
        title: "Analytics Dashboard",
        description:
          "Interactive dashboard with charts and data visualization.",
        image: "/assets/examples/dashboard.png",
        difficulty: "Advanced",
        timeToComplete: "4 hours",
        category: "data-visualization",
        tags: ["Charts", "Data", "Responsive"],
      },
      {
        id: "auth-flow",
        title: "Authentication Flow",
        description:
          "Complete authentication flow with JWT and refresh tokens.",
        image: "/assets/examples/auth-flow.png",
        difficulty: "Intermediate",
        timeToComplete: "2 hours",
        category: "authentication",
        tags: ["JWT", "Security", "Forms"],
      },
      {
        id: "file-upload",
        title: "File Upload",
        description: "File upload with progress tracking and preview.",
        image: "/assets/examples/file-upload.png",
        difficulty: "Intermediate",
        timeToComplete: "1.5 hours",
        category: "file-handling",
        tags: ["Upload", "Progress", "Preview"],
      },
      {
        id: "crud-app",
        title: "CRUD Application",
        description: "Complete CRUD operations with REST API.",
        image: "/assets/examples/crud-app.png",
        difficulty: "Beginner",
        timeToComplete: "2 hours",
        category: "data-management",
        tags: ["REST", "API", "Forms"],
      },
    ];

    const filteredExamples =
      this.activeCategory === "all"
        ? examples
        : examples.filter(
            (example) => example.category === this.activeCategory
          );

    return html`
      <div class="examples-grid">
        ${filteredExamples.map(
          (example) => html`
            <neo-card
              class="example-card"
              @click=${() => router.navigate(`/examples/${example.id}`)}
            >
              <div class="example-image">
                <img src=${example.image} alt=${example.title} loading="lazy" />
              </div>
              <div class="example-content">
                <h3 class="example-title">${example.title}</h3>
                <p class="example-description">${example.description}</p>
                <div class="example-meta">
                  <div class="example-meta-item">
                    <span class="material-icons">speed</span>
                    ${example.difficulty}
                  </div>
                  <div class="example-meta-item">
                    <span class="material-icons">schedule</span>
                    ${example.timeToComplete}
                  </div>
                </div>
                <div class="example-tags">
                  ${example.tags.map(
                    (tag) => html` <span class="example-tag">${tag}</span> `
                  )}
                </div>
                <neo-button variant="text">View Example →</neo-button>
              </div>
            </neo-card>
          `
        )}
      </div>
    `;
  }

  render() {
    const categories = [
      { id: "all", label: "All Examples" },
      { id: "state-management", label: "State Management" },
      { id: "real-time", label: "Real-time" },
      { id: "data-visualization", label: "Data Visualization" },
      { id: "authentication", label: "Authentication" },
      { id: "file-handling", label: "File Handling" },
      { id: "data-management", label: "Data Management" },
    ];

    return html`
      <div class="examples-header">
        <h1 class="examples-title">Example Projects</h1>
        <p class="examples-description">
          Explore real-world examples built with NeoForge to learn best
          practices and common patterns.
        </p>
      </div>

      <div class="categories">
        ${categories.map(
          (category) => html`
            <button
              class="category-button ${this.activeCategory === category.id
                ? "active"
                : ""}"
              @click=${() => this._handleCategoryClick(category.id)}
            >
              ${category.label}
            </button>
          `
        )}
      </div>

      ${this._renderExamples()}
    `;
  }
}

customElements.define("examples-page", ExamplesPage);
