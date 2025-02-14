import { LitElement, html, css } from "lit";
import { baseStyles } from "../../styles/base.js";
import { unsafeHTML } from "lit/directives/unsafe-html.js";
import { marked } from "marked";
import hljs from "highlight.js";
import "highlight.js/styles/github-dark.css";

/**
 * Documentation content component
 * @customElement documentation-content
 */
export class DocumentationContent extends LitElement {
  static styles = [
    baseStyles,
    css`
      :host {
        display: block;
      }

      .content {
        max-width: 800px;
        margin: 0 auto;
      }

      /* Markdown styles */
      .markdown {
        line-height: 1.6;
      }

      .markdown h1,
      .markdown h2,
      .markdown h3,
      .markdown h4,
      .markdown h5,
      .markdown h6 {
        margin: 2em 0 1em;
        line-height: 1.3;
      }

      .markdown h1 {
        font-size: 2rem;
        border-bottom: 2px solid var(--color-border);
        padding-bottom: 0.5em;
      }

      .markdown h2 {
        font-size: 1.5rem;
      }

      .markdown h3 {
        font-size: 1.25rem;
      }

      .markdown p {
        margin: 1em 0;
      }

      .markdown a {
        color: var(--color-primary);
        text-decoration: none;
      }

      .markdown a:hover {
        text-decoration: underline;
      }

      .markdown code {
        background: var(--color-surface);
        padding: 0.2em 0.4em;
        border-radius: var(--radius-sm);
        font-family: var(--font-mono);
        font-size: 0.9em;
      }

      .markdown pre {
        background: var(--color-surface);
        padding: var(--spacing-md);
        border-radius: var(--radius-md);
        overflow-x: auto;
        margin: 1.5em 0;
      }

      .markdown pre code {
        background: none;
        padding: 0;
        font-size: 0.9em;
      }

      .markdown blockquote {
        border-left: 4px solid var(--color-primary);
        margin: 1.5em 0;
        padding: 0.5em 1em;
        background: var(--color-surface);
        border-radius: var(--radius-sm);
      }

      .markdown ul,
      .markdown ol {
        margin: 1em 0;
        padding-left: 2em;
      }

      .markdown li {
        margin: 0.5em 0;
      }

      .markdown table {
        width: 100%;
        border-collapse: collapse;
        margin: 1.5em 0;
      }

      .markdown th,
      .markdown td {
        padding: var(--spacing-sm) var(--spacing-md);
        border: 1px solid var(--color-border);
      }

      .markdown th {
        background: var(--color-surface);
        font-weight: 500;
      }

      .markdown img {
        max-width: 100%;
        height: auto;
        border-radius: var(--radius-md);
      }

      /* Interactive example styles */
      .example {
        margin: 2em 0;
        border: 1px solid var(--color-border);
        border-radius: var(--radius-lg);
      }

      .example-preview {
        padding: var(--spacing-lg);
        border-bottom: 1px solid var(--color-border);
      }

      .example-code {
        position: relative;
      }

      .copy-button {
        position: absolute;
        top: var(--spacing-sm);
        right: var(--spacing-sm);
        padding: var(--spacing-xs) var(--spacing-sm);
        background: var(--color-surface);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-sm);
        font-size: 0.8rem;
        cursor: pointer;
        transition: all var(--transition-fast);
      }

      .copy-button:hover {
        background: var(--color-surface-hover);
      }

      /* Dark mode adjustments */
      @media (prefers-color-scheme: dark) {
        .markdown code {
          background: var(--color-surface-dark);
        }

        .markdown pre {
          background: var(--color-surface-dark);
        }

        .markdown blockquote {
          background: var(--color-surface-dark);
        }

        .markdown th {
          background: var(--color-surface-dark);
        }
      }
    `,
  ];

  static properties = {
    content: { type: String },
    path: { type: String },
  };

  constructor() {
    super();
    this.content = "";
    this.path = "";
    this._setupMarked();
  }

  async firstUpdated() {
    if (this.path) {
      await this._loadContent();
    }
  }

  updated(changedProperties) {
    if (changedProperties.has("path")) {
      this._loadContent();
    }
  }

  render() {
    return html`
      <div class="content">
        <div class="markdown" @click=${this._handleClick}>
          ${unsafeHTML(this._renderContent())}
        </div>
      </div>
    `;
  }

  _setupMarked() {
    // Configure marked with highlight.js
    marked.setOptions({
      highlight: (code, lang) => {
        if (lang && hljs.getLanguage(lang)) {
          return hljs.highlight(code, { language: lang }).value;
        }
        return hljs.highlightAuto(code).value;
      },
      breaks: true,
      gfm: true,
    });

    // Add custom renderer for code blocks
    const renderer = new marked.Renderer();
    renderer.code = (code, language) => {
      const highlighted = language
        ? hljs.highlight(code, { language }).value
        : hljs.highlightAuto(code).value;

      return `
        <div class="example">
          <div class="example-preview">
            ${this._renderExample(code, language)}
          </div>
          <div class="example-code">
            <button class="copy-button" data-code="${encodeURIComponent(code)}">
              Copy
            </button>
            <pre><code class="hljs language-${language}">${highlighted}</code></pre>
          </div>
        </div>
      `;
    };

    marked.use({ renderer });
  }

  async _loadContent() {
    try {
      const response = await fetch(this.path);
      if (!response.ok) throw new Error("Failed to load documentation");
      this.content = await response.text();
    } catch (error) {
      console.error("Error loading documentation:", error);
      this.content = "# Error\nFailed to load documentation content.";
    }
  }

  _renderContent() {
    return marked(this.content);
  }

  _renderExample(code, language) {
    if (language === "html") {
      return code;
    }
    return ""; // For non-HTML examples, don't render a preview
  }

  _handleClick(e) {
    const copyButton = e.target.closest(".copy-button");
    if (copyButton) {
      const code = decodeURIComponent(copyButton.dataset.code);
      navigator.clipboard.writeText(code);
      copyButton.textContent = "Copied!";
      setTimeout(() => {
        copyButton.textContent = "Copy";
      }, 2000);
    }
  }
}

customElements.define("documentation-content", DocumentationContent);
