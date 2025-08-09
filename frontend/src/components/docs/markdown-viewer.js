import {   LitElement, html, css   } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";
// Import marked as a script first
import "/vendor/marked.min.js";
import "/vendor/highlight.min.js";
import { docsService } from "@services/docs.js";
import { Logger } from "@utils/logger.js";

export class MarkdownViewer extends LitElement {
  static properties = {
    content: { type: String },
    isLoading: { type: Boolean },
    path: { type: String },
    error: { type: String },
  };

  static styles = css`
    :host {
      display: block;
      color: var(--text-color);
    }

    .markdown-body {
      padding: 2rem;
      max-width: 900px;
      margin: 0 auto;
      font-size: 1.1rem;
      line-height: 1.7;
    }

    .loading {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 400px;
      color: var(--text-secondary);
    }

    /* Headings */
    h1,
    h2,
    h3,
    h4,
    h5,
    h6 {
      margin-top: 2em;
      margin-bottom: 1em;
      font-weight: 600;
      line-height: 1.25;
      color: var(--primary-color);
    }

    h1 {
      font-size: 2.5rem;
      border-bottom: 2px solid var(--surface-color);
      padding-bottom: 0.5rem;
    }

    h2 {
      font-size: 2rem;
      border-bottom: 1px solid var(--surface-color);
      padding-bottom: 0.3rem;
    }

    h3 {
      font-size: 1.5rem;
    }
    h4 {
      font-size: 1.25rem;
    }

    /* Links */
    a {
      color: var(--primary-color);
      text-decoration: none;
      transition: color 0.2s ease;
    }

    a:hover {
      color: var(--secondary-color);
      text-decoration: underline;
    }

    /* Code blocks */
    pre {
      background: var(--surface-color);
      border-radius: 8px;
      padding: 1rem;
      overflow-x: auto;
      margin: 1.5rem 0;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    code {
      font-family: "Fira Code", monospace;
      font-size: 0.9em;
      background: var(--surface-color);
      padding: 0.2em 0.4em;
      border-radius: 4px;
    }

    pre code {
      padding: 0;
      background: none;
    }

    /* Lists */
    ul,
    ol {
      padding-left: 2rem;
      margin: 1rem 0;
    }

    li {
      margin: 0.5rem 0;
    }

    /* Blockquotes */
    blockquote {
      margin: 1.5rem 0;
      padding: 1rem 1.5rem;
      border-left: 4px solid var(--primary-color);
      background: var(--surface-color);
      border-radius: 4px;
    }

    blockquote p {
      margin: 0;
    }

    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1.5rem 0;
    }

    th,
    td {
      padding: 0.75rem;
      border: 1px solid var(--surface-color);
    }

    th {
      background: var(--surface-color);
      font-weight: 600;
    }

    /* Images */
    img {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
      margin: 1.5rem 0;
    }

    /* Horizontal rule */
    hr {
      border: none;
      height: 1px;
      background: var(--surface-color);
      margin: 2rem 0;
    }

    .error {
      padding: 2rem;
      text-align: center;
      color: var(--error-color);
      background: rgba(255, 68, 68, 0.1);
      border-radius: 8px;
      margin: 2rem;
    }

    .error-title {
      font-size: 1.5rem;
      margin-bottom: 1rem;
      color: var(--error-color);
    }

    .error-message {
      color: var(--text-secondary);
      margin-bottom: 1rem;
    }

    .error-action {
      display: inline-block;
      padding: 0.5rem 1rem;
      background: var(--error-color);
      color: white;
      border-radius: 4px;
      text-decoration: none;
      margin-top: 1rem;
      transition: opacity 0.2s;
    }

    .error-action:hover {
      opacity: 0.9;
    }
  `;

  constructor() {
    super();
    this.content = "";
    this.isLoading = false;
    this.path = "";
    this.error = "";

    // Configure marked with syntax highlighting
    window.marked.setOptions({
      highlight: (code, lang) => {
        return window.hljs.highlightAuto(code).value;
      },
      breaks: true,
      gfm: true,
    });
  }

  async loadDocument(path) {
    if (!path) return;

    this.isLoading = true;
    this.error = "";

    try {
      const doc = await docsService.getDocument(path);
      this.content = doc.content;
      // Dispatch event with document metadata
      this.dispatchEvent(
        new CustomEvent("doc-loaded", {
          detail: {
            title: doc.title,
            path: doc.path,
          },
          bubbles: true,
          composed: true,
        })
      );
    } catch (error) {
      Logger.error("Error loading document:", error);
      this.error = error.message;
      this.content = "";
    } finally {
      this.isLoading = false;
    }
  }

  updated(changedProperties) {
    if (changedProperties.has("path") && this.path) {
      this.loadDocument(this.path);
    }
  }

  createRenderRoot() {
    const root = super.createRenderRoot();
    // Allow markdown content to be styled by document styles
    root.adoptedStyleSheets = [...document.adoptedStyleSheets];
    return root;
  }

  render() {
    if (this.isLoading) {
      return html`<div class="loading">Loading documentation...</div>`;
    }

    if (this.error) {
      return html`
        <div class="error">
          <div class="error-title">Error Loading Documentation</div>
          <div class="error-message">${this.error}</div>
          <a href="/docs/getting-started.md" class="error-action">
            Return to Getting Started
          </a>
        </div>
      `;
    }

    // Create a template element to safely parse the HTML
    const template = document.createElement("template");
    template.innerHTML = window.marked.parse(this.content || "");

    return html`
      <div class="markdown-body">
        ${this.content
          ? template.content
          : html`<div class="error">No content available</div>`}
      </div>
    `;
  }
}

customElements.define("markdown-viewer", MarkdownViewer);
