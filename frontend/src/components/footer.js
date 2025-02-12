import { LitElement, html, css } from "lit";

export class AppFooter extends LitElement {
  static styles = css`
    :host {
      display: block;
      background: var(--surface-color);
      padding: var(--spacing-xl) 0;
      margin-top: auto;
    }

    .footer-content {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 var(--spacing-lg);
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: var(--spacing-xl);
    }

    .footer-section h3 {
      color: var(--text-color);
      margin-bottom: var(--spacing-md);
    }

    .footer-links {
      list-style: none;
      padding: 0;
    }

    .footer-links li {
      margin-bottom: var(--spacing-sm);
    }

    .footer-links a {
      color: var(--text-secondary);
      text-decoration: none;
      transition: color var(--transition-fast);
    }

    .footer-links a:hover {
      color: var(--primary-color);
    }

    .copyright {
      text-align: center;
      margin-top: var(--spacing-xl);
      padding-top: var(--spacing-lg);
      border-top: 1px solid var(--border-color);
      color: var(--text-tertiary);
    }
  `;

  render() {
    return html`
      <footer>
        <div class="footer-content">
          <div class="footer-section">
            <h3>Resources</h3>
            <ul class="footer-links">
              <li><a href="/docs">Documentation</a></li>
              <li><a href="/tutorials">Tutorials</a></li>
              <li><a href="/examples">Examples</a></li>
            </ul>
          </div>
          <div class="footer-section">
            <h3>Community</h3>
            <ul class="footer-links">
              <li><a href="/github">GitHub</a></li>
              <li><a href="/discord">Discord</a></li>
              <li><a href="/twitter">Twitter</a></li>
            </ul>
          </div>
          <div class="footer-section">
            <h3>Support</h3>
            <ul class="footer-links">
              <li><a href="/faq">FAQ</a></li>
              <li><a href="/contact">Contact</a></li>
              <li><a href="/status">Status</a></li>
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
