import { LitElement, html, css } from "lit";
import { customElement } from "lit/decorators.js";
import { baseStyles } from "../styles/base.js";

@customElement("search-page")
export class SearchPage extends LitElement {
  static styles = [
    baseStyles,
    css`
      :host {
        display: block;
        padding: var(--spacing-lg);
      }

      .search-container {
        max-width: var(--content-width);
        margin: 0 auto;
      }

      .search-header {
        margin-bottom: var(--spacing-xl);
      }

      h1 {
        font-size: var(--font-size-xxl);
        margin-bottom: var(--spacing-md);
      }

      .search-box {
        display: flex;
        gap: var(--spacing-sm);
      }

      input {
        flex: 1;
      }

      .search-results {
        display: grid;
        gap: var(--spacing-lg);
      }

      .result-item {
        padding: var(--spacing-lg);
        border-radius: var(--border-radius);
        box-shadow: var(--shadow-sm);
      }

      .result-title {
        font-size: var(--font-size-lg);
        margin-bottom: var(--spacing-sm);
      }

      .result-excerpt {
        color: var(--color-text-secondary);
        margin-bottom: var(--spacing-sm);
      }

      .result-meta {
        font-size: var(--font-size-sm);
        color: var(--color-text-tertiary);
      }
    `,
  ];

  render() {
    return html`
      <div class="search-container">
        <div class="search-header">
          <h1>Search</h1>
          <div class="search-box">
            <input type="search" placeholder="Search..." />
            <button>Search</button>
          </div>
        </div>

        <div class="search-results">
          <div class="result-item">
            <div class="result-title">
              <a href="#">Getting Started with NeoForge</a>
            </div>
            <div class="result-excerpt">
              Learn how to set up your development environment and create your
              first project with NeoForge...
            </div>
            <div class="result-meta">
              Documentation • Last updated 2 days ago
            </div>
          </div>

          <div class="result-item">
            <div class="result-title">
              <a href="#">Best Practices for Component Design</a>
            </div>
            <div class="result-excerpt">
              Discover the recommended patterns and practices for building
              maintainable components...
            </div>
            <div class="result-meta">Blog • Published 1 week ago</div>
          </div>

          <div class="result-item">
            <div class="result-title">
              <a href="#">Performance Optimization Guide</a>
            </div>
            <div class="result-excerpt">
              Tips and techniques for optimizing your NeoForge applications for
              better performance...
            </div>
            <div class="result-meta">Tutorial • Published 3 weeks ago</div>
          </div>
        </div>
      </div>
    `;
  }
}
