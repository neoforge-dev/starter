import { LitElement, html, css } from "lit";
import { baseStyles } from "../styles/base.js";
import { LoadingMixin } from "../mixins/loading.js";
import "../components/ui/card.js";
import "../components/ui/button.js";

export class TutorialsPage extends LoadingMixin(LitElement) {
  static properties = {
    tutorials: { type: Array },
    selectedLevel: { type: String },
  };

  static styles = [
    baseStyles,
    css`
      :host {
        display: block;
        padding: var(--spacing-xl);
      }

      .tutorials-header {
        text-align: center;
        margin-bottom: var(--spacing-2xl);
      }

      h1 {
        color: var(--text-color);
        margin-bottom: var(--spacing-lg);
      }

      .filters {
        display: flex;
        justify-content: center;
        gap: var(--spacing-md);
        margin-bottom: var(--spacing-xl);
      }

      .tutorials-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: var(--spacing-xl);
      }

      .tutorial-card {
        display: flex;
        flex-direction: column;
        height: 100%;
      }

      .tutorial-image {
        aspect-ratio: 16/9;
        background: var(--surface-color);
        border-radius: var(--radius-md);
        margin-bottom: var(--spacing-md);
        overflow: hidden;
      }

      .tutorial-image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .tutorial-content {
        flex: 1;
      }

      .tutorial-title {
        font-size: var(--font-size-xl);
        font-weight: var(--font-weight-bold);
        margin-bottom: var(--spacing-sm);
      }

      .tutorial-meta {
        display: flex;
        gap: var(--spacing-md);
        margin-bottom: var(--spacing-md);
        color: var(--text-secondary);
        font-size: var(--font-size-sm);
      }

      .level-badge {
        padding: var(--spacing-xs) var(--spacing-sm);
        border-radius: var(--radius-sm);
        font-size: var(--font-size-xs);
        text-transform: uppercase;
      }

      .level-beginner {
        background: var(--success-color);
        color: white;
      }

      .level-intermediate {
        background: var(--warning-color);
        color: white;
      }

      .level-advanced {
        background: var(--error-color);
        color: white;
      }
    `,
  ];

  constructor() {
    super();
    this.tutorials = [];
    this.selectedLevel = "all";
  }

  connectedCallback() {
    super.connectedCallback();
    this.loadTutorials();
  }

  async loadTutorials() {
    try {
      this.startLoading();
      // Simulated API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      this.tutorials = [
        {
          id: 1,
          title: "Getting Started with NeoForge",
          description: "Learn the basics of setting up and using NeoForge.",
          image: "/assets/tutorials/getting-started.jpg",
          duration: "30 min",
          level: "beginner",
          author: "John Doe",
        },
        {
          id: 2,
          title: "Building Components",
          description: "Create reusable web components with Lit.",
          image: "/assets/tutorials/components.jpg",
          duration: "45 min",
          level: "intermediate",
          author: "Jane Smith",
        },
        {
          id: 3,
          title: "Advanced State Management",
          description: "Master state management patterns in NeoForge.",
          image: "/assets/tutorials/state.jpg",
          duration: "60 min",
          level: "advanced",
          author: "Mike Johnson",
        },
      ];
    } catch (error) {
      console.error("Error loading tutorials:", error);
    } finally {
      this.stopLoading();
    }
  }

  render() {
    const filteredTutorials =
      this.selectedLevel === "all"
        ? this.tutorials
        : this.tutorials.filter((t) => t.level === this.selectedLevel);

    return html`
      <div class="tutorials-header">
        <h1>Tutorials</h1>
        <p>Learn NeoForge through step-by-step tutorials</p>
      </div>

      <div class="filters">
        <neo-button
          ?primary=${this.selectedLevel === "all"}
          @click=${() => (this.selectedLevel = "all")}
        >
          All
        </neo-button>
        <neo-button
          ?primary=${this.selectedLevel === "beginner"}
          @click=${() => (this.selectedLevel = "beginner")}
        >
          Beginner
        </neo-button>
        <neo-button
          ?primary=${this.selectedLevel === "intermediate"}
          @click=${() => (this.selectedLevel = "intermediate")}
        >
          Intermediate
        </neo-button>
        <neo-button
          ?primary=${this.selectedLevel === "advanced"}
          @click=${() => (this.selectedLevel = "advanced")}
        >
          Advanced
        </neo-button>
      </div>

      ${this.loading
        ? this.renderLoading()
        : html`
            <div class="tutorials-grid">
              ${filteredTutorials.map(
                (tutorial) => html`
                  <neo-card class="tutorial-card">
                    <div class="tutorial-image">
                      <img src=${tutorial.image} alt=${tutorial.title} />
                    </div>
                    <div class="tutorial-content">
                      <h2 class="tutorial-title">${tutorial.title}</h2>
                      <div class="tutorial-meta">
                        <span>${tutorial.duration}</span>
                        <span>By ${tutorial.author}</span>
                        <span class="level-badge level-${tutorial.level}">
                          ${tutorial.level}
                        </span>
                      </div>
                      <p>${tutorial.description}</p>
                      <neo-button>Start Tutorial</neo-button>
                    </div>
                  </neo-card>
                `
              )}
            </div>
          `}
    `;
  }
}

customElements.define("tutorials-page", TutorialsPage);
