import { LitElement, html, css } from "/vendor/lit-core.min.js";
import { baseStyles } from "../../styles/base.js";
import { LoadingMixin } from "../../styles/base.js";

export class CodeSnippet extends LoadingMixin(LitElement) {
  static properties = {
    code: { type: String },
    language: { type: String },
    showLineNumbers: { type: Boolean },
    showCopyButton: { type: Boolean },
    theme: { type: String, reflect: true },
  };

  static styles = [
    baseStyles,
    css`
      :host {
        display: block;
        position: relative;
      }

      .code-container {
        position: relative;
        background: var(--code-background);
        border-radius: var(--radius-md);
        padding: var(--spacing-md);
        overflow: hidden;
      }

      pre {
        margin: 0;
        padding: 0;
        overflow-x: auto;
        font-family: var(--font-family-mono);
        font-size: var(--text-sm);
        line-height: 1.6;
        color: var(--code-text);
      }

      code {
        font-family: inherit;
      }

      .line-numbers {
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        padding: var(--spacing-md);
        border-right: 1px solid var(--border-color);
        background: rgba(0, 0, 0, 0.1);
        user-select: none;
        color: var(--text-tertiary);
      }

      .copy-button {
        position: absolute;
        top: var(--spacing-sm);
        right: var(--spacing-sm);
        padding: var(--spacing-xs) var(--spacing-sm);
        background: var(--surface-color);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-sm);
        color: var(--text-color);
        cursor: pointer;
        opacity: 0;
        transition: all var(--transition-normal);
      }

      .code-container:hover .copy-button {
        opacity: 1;
      }

      .copy-button:hover {
        background: var(--primary-color);
        color: var(--background-color);
      }

      .copy-button .material-icons {
        font-size: var(--text-base);
      }

      .language-tag {
        position: absolute;
        top: var(--spacing-sm);
        right: var(--spacing-lg);
        padding: var(--spacing-xs) var(--spacing-sm);
        background: var(--surface-color);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-sm);
        color: var(--text-tertiary);
        font-size: var(--text-xs);
        text-transform: uppercase;
      }

      /* Loading state */
      :host([loading]) .code-container {
        min-height: 100px;
        background: var(--surface-color);
        animation: pulse 1.5s ease-in-out infinite;
      }

      @keyframes pulse {
        0% {
          opacity: 1;
        }
        50% {
          opacity: 0.5;
        }
        100% {
          opacity: 1;
        }
      }

      /* Line highlighting */
      .highlight-line {
        background: rgba(var(--primary-color), 0.1);
        margin: 0 calc(-1 * var(--spacing-md));
        padding: 0 var(--spacing-md);
        display: block;
      }
    `,
  ];

  constructor() {
    super();
    this.code = "";
    this.language = "plaintext";
    this.showLineNumbers = false;
    this.showCopyButton = true;
    this.theme = "light";
  }

  async copyCode() {
    try {
      await navigator.clipboard.writeText(this.code);
      const button = this.shadowRoot.querySelector(".copy-button");
      const icon = button.querySelector(".material-icons");
      const originalText = icon.textContent;

      icon.textContent = "check";
      button.style.background = "var(--success-color)";

      setTimeout(() => {
        icon.textContent = originalText;
        button.style.background = "";
      }, 2000);
    } catch (err) {
      console.error("Failed to copy code:", err);
    }
  }

  renderLineNumbers() {
    if (!this.showLineNumbers) return "";

    const lines = this.code.split("\n");
    return html`
      <div class="line-numbers">
        ${lines.map((_, i) => html`<div>${i + 1}</div>`)}
      </div>
    `;
  }

  render() {
    if (this.loading) {
      return html`<div class="code-container"></div>`;
    }

    return html`
      <div class="code-container">
        ${this.renderLineNumbers()}
        <pre><code>${this.code}</code></pre>

        ${this.showCopyButton
          ? html`
              <button
                class="copy-button"
                @click=${this.copyCode}
                aria-label="Copy code"
              >
                <span class="material-icons">content_copy</span>
              </button>
            `
          : ""}
        ${this.language !== "plaintext"
          ? html` <div class="language-tag">${this.language}</div> `
          : ""}
      </div>
    `;
  }
}

customElements.define("code-snippet", CodeSnippet);
