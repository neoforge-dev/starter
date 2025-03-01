import {  LitElement, html, css  } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";
import { baseStyles } from "../styles/base.js";

export class BlogPage extends LitElement {
  static styles = [
    baseStyles,
    css`
      :host {
        display: block;
        max-width: 800px;
        margin: 0 auto;
        padding: var(--spacing-lg);
      }

      .page-header {
        text-align: center;
        margin-bottom: var(--spacing-xl);
      }

      .page-title {
        font-size: var(--text-3xl);
        color: var(--text-color);
        margin-bottom: var(--spacing-md);
      }

      .page-description {
        color: var(--text-secondary);
        font-size: var(--text-lg);
      }

      .blog-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: var(--spacing-lg);
      }

      .blog-card {
        background: var(--surface-color);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-lg);
        overflow: hidden;
        transition: all var(--transition-normal);
      }

      .blog-card:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-lg);
      }

      .card-image {
        width: 100%;
        height: 200px;
        object-fit: cover;
      }

      .card-content {
        padding: var(--spacing-md);
      }

      .card-title {
        font-size: var(--text-xl);
        font-weight: var(--font-semibold);
        margin-bottom: var(--spacing-sm);
        color: var(--text-color);
      }

      .card-meta {
        display: flex;
        align-items: center;
        gap: var(--spacing-xs);
        color: var(--text-tertiary);
        font-size: var(--text-sm);
        margin-bottom: var(--spacing-sm);
      }

      .card-meta .material-icons {
        font-size: var(--text-base);
      }

      .card-excerpt {
        color: var(--text-secondary);
        margin-bottom: var(--spacing-md);
        line-height: 1.6;
      }

      .card-tags {
        display: flex;
        gap: var(--spacing-xs);
        flex-wrap: wrap;
      }

      .tag {
        background: var(--background-color);
        color: var(--text-secondary);
        padding: var(--spacing-xs) var(--spacing-sm);
        border-radius: var(--radius-full);
        font-size: var(--text-xs);
      }

      @media (max-width: 768px) {
        .blog-grid {
          grid-template-columns: 1fr;
        }
      }
    `
  ];

  render() {
    return html`
      <div class="page-header">
        <h1 class="page-title">NeoForge Blog</h1>
        <p class="page-description">
          Latest updates, guides, and insights about modern web development
        </p>
      </div>

      <div class="blog-grid">
        ${this._renderBlogPosts()}
      </div>
    `;
  }

  _renderBlogPosts() {
    // Sample blog posts - in a real app, this would come from an API
    const posts = [
      {
        title: "Getting Started with NeoForge",
        date: "2024-02-10",
        author: "John Doe",
        excerpt: "Learn how to build modern web applications with NeoForge's powerful features and components.",
        image: "/src/assets/blog/getting-started.jpg",
        tags: ["Tutorial", "Beginners"]
      },
      {
        title: "Building Scalable Components",
        date: "2024-02-09",
        author: "Jane Smith",
        excerpt: "Best practices for creating reusable and maintainable web components using Lit.",
        image: "/src/assets/blog/components.jpg",
        tags: ["Components", "Best Practices"]
      },
      {
        title: "Performance Optimization Tips",
        date: "2024-02-08",
        author: "Mike Johnson",
        excerpt: "Discover how to optimize your NeoForge applications for maximum performance.",
        image: "/src/assets/blog/performance.jpg",
        tags: ["Performance", "Optimization"]
      }
    ];

    return posts.map(post => html`
      <article class="blog-card">
        <img class="card-image" src="${post.image}" alt="${post.title}">
        <div class="card-content">
          <h2 class="card-title">${post.title}</h2>
          <div class="card-meta">
            <span class="material-icons">calendar_today</span>
            <span>${new Date(post.date).toLocaleDateString()}</span>
            <span class="material-icons">person</span>
            <span>${post.author}</span>
          </div>
          <p class="card-excerpt">${post.excerpt}</p>
          <div class="card-tags">
            ${post.tags.map(tag => html`
              <span class="tag">${tag}</span>
            `)}
          </div>
        </div>
      </article>
    `);
  }
}

customElements.define("blog-page", BlogPage); 