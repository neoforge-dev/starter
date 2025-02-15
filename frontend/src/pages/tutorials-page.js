import { LitElement, html, css } from "lit";
import { customElement } from "lit/decorators.js";
import { baseStyles } from "../styles/base.js";

@customElement("tutorials-page")
export class TutorialsPage extends LitElement {
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
        border-radius: var(--border-radius);
        border: 1px solid var(--color-border);
        background: none;
        cursor: pointer;
      }

      .filter-button.active {
        background: var(--color-primary);
        color: white;
        border-color: var(--color-primary);
      }

      .tutorials-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: var(--spacing-lg);
      }

      .tutorial-card {
        border-radius: var(--border-radius);
        box-shadow: var(--shadow-md);
        overflow: hidden;
      }

      .tutorial-image {
        width: 100%;
        height: 200px;
        background: var(--color-background-alt);
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .tutorial-content {
        padding: var(--spacing-lg);
      }

      .tutorial-title {
        font-size: var(--font-size-lg);
        margin-bottom: var(--spacing-sm);
      }

      .tutorial-description {
        color: var(--color-text-secondary);
        margin-bottom: var(--spacing-md);
      }

      .tutorial-meta {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: var(--font-size-sm);
        color: var(--color-text-tertiary);
      }

      .tutorial-tags {
        display: flex;
        gap: var(--spacing-sm);
        margin-top: var(--spacing-md);
      }

      .tag {
        padding: var(--spacing-xs) var(--spacing-sm);
        border-radius: var(--border-radius);
        background: var(--color-background-alt);
        font-size: var(--font-size-sm);
      }
    `,
  ];

  render() {
    return html`
      <div class="tutorials-container">
        <h1>Tutorials</h1>

        <div class="filters">
          <button class="filter-button active">All</button>
          <button class="filter-button">Beginner</button>
          <button class="filter-button">Intermediate</button>
          <button class="filter-button">Advanced</button>
          <button class="filter-button">Latest</button>
        </div>

        <div class="tutorials-grid">
          <article class="tutorial-card">
            <div class="tutorial-image">Tutorial Preview</div>
            <div class="tutorial-content">
              <h2 class="tutorial-title">Getting Started with NeoForge</h2>
              <p class="tutorial-description">
                Learn the basics of setting up your development environment and
                creating your first project.
              </p>
              <div class="tutorial-meta">
                <span>15 min read</span>
                <span>Beginner</span>
              </div>
              <div class="tutorial-tags">
                <span class="tag">Setup</span>
                <span class="tag">Basics</span>
              </div>
            </div>
          </article>

          <article class="tutorial-card">
            <div class="tutorial-image">Tutorial Preview</div>
            <div class="tutorial-content">
              <h2 class="tutorial-title">Building Custom Components</h2>
              <p class="tutorial-description">
                Master the art of creating reusable and maintainable components.
              </p>
              <div class="tutorial-meta">
                <span>25 min read</span>
                <span>Intermediate</span>
              </div>
              <div class="tutorial-tags">
                <span class="tag">Components</span>
                <span class="tag">Best Practices</span>
              </div>
            </div>
          </article>

          <article class="tutorial-card">
            <div class="tutorial-image">Tutorial Preview</div>
            <div class="tutorial-content">
              <h2 class="tutorial-title">Advanced State Management</h2>
              <p class="tutorial-description">
                Deep dive into state management patterns and advanced
                techniques.
              </p>
              <div class="tutorial-meta">
                <span>30 min read</span>
                <span>Advanced</span>
              </div>
              <div class="tutorial-tags">
                <span class="tag">State</span>
                <span class="tag">Architecture</span>
              </div>
            </div>
          </article>
        </div>
      </div>
    `;
  }
}
