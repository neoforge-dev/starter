import {  LitElement, html, css  } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";
import { baseStyles } from "./styles/base.js";

export class AppFooter extends LitElement {
  static styles = [
    baseStyles,
    css`
      :host {
        display: block;
        background: #f9fafb;
        padding: var(--spacing-lg) 0;
        margin-top: auto;
      }

      .footer-content {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 var(--spacing-lg);
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: var(--spacing-xl);
      }

      .footer-section h3 {
        font-size: 1rem;
        font-weight: var(--font-weight-medium);
        margin-bottom: var(--spacing-md);
        color: var(--color-text);
      }

      .footer-links {
        list-style: none;
        padding: 0;
        margin: 0;
      }

      .footer-links li {
        margin-bottom: var(--spacing-sm);
      }

      .footer-links a {
        color: var(--color-secondary);
        text-decoration: none;
        transition: color var(--transition-fast);
      }

      .footer-links a:hover {
        color: var(--color-primary);
      }

      .copyright {
        text-align: center;
        margin-top: var(--spacing-xl);
        padding-top: var(--spacing-lg);
        border-top: 1px solid #e5e7eb;
        color: var(--color-secondary);
      }
    `,
  ];

  render() {
    return html`
      <footer>
        <div class="footer-content">
          <div class="footer-section">
            <h3>Documentation</h3>
            <ul class="footer-links">
              <li><a href="/docs/getting-started">Getting Started</a></li>
              <li><a href="/docs/components">Components</a></li>
              <li><a href="/docs/api">API Reference</a></li>
              <li><a href="/docs/examples">Examples</a></li>
            </ul>
          </div>
          <div class="footer-section">
            <h3>Community</h3>
            <ul class="footer-links">
              <li><a href="/github">GitHub</a></li>
              <li><a href="/discord">Discord</a></li>
              <li><a href="/twitter">Twitter</a></li>
              <li><a href="/blog">Blog</a></li>
            </ul>
          </div>
          <div class="footer-section">
            <h3>Resources</h3>
            <ul class="footer-links">
              <li><a href="/tutorials">Tutorials</a></li>
              <li><a href="/showcase">Showcase</a></li>
              <li><a href="/roadmap">Roadmap</a></li>
              <li><a href="/contributing">Contributing</a></li>
            </ul>
          </div>
        </div>
        <div class="copyright">
          © ${new Date().getFullYear()} NeoForge. All rights reserved.
        </div>
      </footer>
    `;
  }
}

customElements.define("app-footer", AppFooter);
