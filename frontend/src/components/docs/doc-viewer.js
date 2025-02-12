import { LitElement, html, css } from "lit";
import { baseStyles } from "../../styles/base.js";
import { LoadingMixin, ErrorMixin } from "../../styles/base.js";
import "../code/code-snippet.js";

export class DocViewer extends LoadingMixin(ErrorMixin(LitElement)) {
  static properties = {
    path: { type: String },
    content: { type: String },
    toc: { type: Array },
    currentSection: { type: String },
  };

  static styles = [
    baseStyles,
    css`
      :host {
        display: grid;
        grid-template-columns: minmax(200px, 1fr) minmax(0, 3fr);
        gap: var(--spacing-lg);
        max-width: 1200px;
        margin: 0 auto;
        padding: var(--spacing-lg);
      }

      .sidebar {
        position: sticky;
        top: var(--spacing-lg);
        height: calc(100vh - 2 * var(--spacing-lg));
        overflow-y: auto;
        padding-right: var(--spacing-md);
        border-right: 1px solid var(--border-color);
      }

      .content {
        min-width: 0;
      }

      .toc {
        list-style: none;
        padding: 0;
      }

      .toc-item {
        margin-bottom: var(--spacing-xs);
      }

      .toc-link {
        display: block;
        padding: var(--spacing-xs) var(--spacing-sm);
        color: var(--text-secondary);
        text-decoration: none;
        border-radius: var(--radius-sm);
        transition: all var(--transition-normal);
      }

      .toc-link:hover {
        background: var(--surface-color);
        color: var(--text-color);
      }

      .toc-link.active {
        background: var(--primary-color);
        color: var(--background-color);
      }

      .toc-link[data-level="2"] {
        padding-left: calc(2 * var(--spacing-md));
      }

      .toc-link[data-level="3"] {
        padding-left: calc(3 * var(--spacing-md));
      }

      .content h1 {
        font-size: var(--text-4xl);
        margin-bottom: var(--spacing-lg);
      }

      .content h2 {
        font-size: var(--text-3xl);
        margin-top: var(--spacing-xl);
        margin-bottom: var(--spacing-md);
      }

      .content h3 {
        font-size: var(--text-2xl);
        margin-top: var(--spacing-lg);
        margin-bottom: var(--spacing-md);
      }

      .content p {
        margin-bottom: var(--spacing-md);
        line-height: 1.8;
      }

      .content ul,
      .content ol {
        margin-bottom: var(--spacing-md);
        padding-left: var(--spacing-lg);
      }

      .content li {
        margin-bottom: var(--spacing-xs);
      }

      .content code-snippet {
        margin: var(--spacing-md) 0;
      }

      .content blockquote {
        margin: var(--spacing-md) 0;
        padding: var(--spacing-md);
        border-left: 4px solid var(--primary-color);
        background: var(--surface-color);
        border-radius: var(--radius-md);
      }

      .content img {
        max-width: 100%;
        height: auto;
        border-radius: var(--radius-md);
      }

      .content table {
        width: 100%;
        margin: var(--spacing-md) 0;
        border-collapse: collapse;
      }

      .content th,
      .content td {
        padding: var(--spacing-sm);
        border: 1px solid var(--border-color);
        text-align: left;
      }

      .content th {
        background: var(--surface-color);
        font-weight: var(--font-semibold);
      }

      .content hr {
        margin: var(--spacing-lg) 0;
        border: none;
        border-top: 1px solid var(--border-color);
      }

      /* Mobile styles */
      @media (max-width: 768px) {
        :host {
          grid-template-columns: 1fr;
        }

        .sidebar {
          position: fixed;
          left: 0;
          right: 0;
          bottom: 0;
          height: auto;
          background: var(--background-color);
          border-top: 1px solid var(--border-color);
          z-index: var(--z-fixed);
          padding: var(--spacing-sm);
        }

        .toc {
          display: flex;
          overflow-x: auto;
          gap: var(--spacing-sm);
          padding-bottom: var(--spacing-sm);
        }

        .toc-item {
          margin: 0;
        }

        .toc-link[data-level] {
          padding-left: var(--spacing-sm);
        }
      }
    `,
  ];

  constructor() {
    super();
    this.path = "";
    this.content = "";
    this.toc = [];
    this.currentSection = "";
    this._observer = null;
  }

  connectedCallback() {
    super.connectedCallback();
    this._setupIntersectionObserver();
    window.addEventListener("scroll", this._handleScroll.bind(this));
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._observer) {
      this._observer.disconnect();
    }
    window.removeEventListener("scroll", this._handleScroll);
  }

  _setupIntersectionObserver() {
    this._observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.currentSection = entry.target.id;
          }
        });
      },
      {
        rootMargin: "-20% 0px -80% 0px",
      }
    );
  }

  _handleScroll() {
    // Throttle scroll handling
    if (!this._scrollTimeout) {
      this._scrollTimeout = setTimeout(() => {
        this._updateActiveSection();
        this._scrollTimeout = null;
      }, 100);
    }
  }

  _updateActiveSection() {
    const headings = this.shadowRoot.querySelectorAll("h1, h2, h3");
    for (const heading of headings) {
      const rect = heading.getBoundingClientRect();
      if (rect.top >= 0 && rect.top <= window.innerHeight * 0.3) {
        this.currentSection = heading.id;
        break;
      }
    }
  }

  updated(changedProperties) {
    if (changedProperties.has("content")) {
      this._processContent();
    }
  }

  _processContent() {
    // Process markdown content and extract TOC
    // This would use a markdown parser in a real implementation
    const container = this.shadowRoot.querySelector(".content");
    if (container) {
      const headings = container.querySelectorAll("h1, h2, h3");
      this.toc = Array.from(headings).map((heading) => ({
        id: heading.id,
        text: heading.textContent,
        level: parseInt(heading.tagName[1]),
      }));

      headings.forEach((heading) => {
        this._observer?.observe(heading);
      });
    }
  }

  _handleTocClick(e, id) {
    e.preventDefault();
    const element = this.shadowRoot.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  }

  render() {
    if (this.loading) {
      return html`<div class="loading">Loading...</div>`;
    }

    if (this.error) {
      return html`<div class="error">${this.error}</div>`;
    }

    return html`
      <nav class="sidebar">
        <ul class="toc">
          ${this.toc.map(
            (item) => html`
              <li class="toc-item">
                <a
                  href="#${item.id}"
                  class="toc-link ${this.currentSection === item.id
                    ? "active"
                    : ""}"
                  data-level="${item.level}"
                  @click=${(e) => this._handleTocClick(e, item.id)}
                >
                  ${item.text}
                </a>
              </li>
            `
          )}
        </ul>
      </nav>

      <main class="content">${this.content}</main>
    `;
  }
}

customElements.define("doc-viewer", DocViewer);
