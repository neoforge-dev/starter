import {  LitElement, html  } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";
import { baseStyles } from "../../styles/base.js";

export class AppFooter extends LitElement {
  static styles = [baseStyles];

  render() {
    return html`
      <footer class="app-footer">
        <div class="container">
          <div class="footer-content">
            <div class="footer-section">
              <h3>NeoForge</h3>
              <p>Modern web development, simplified.</p>
            </div>
            <div class="footer-section">
              <h4>Resources</h4>
              <a href="/docs">Documentation</a>
              <a href="/components">Components</a>
              <a href="/examples">Examples</a>
            </div>
            <div class="footer-section">
              <h4>Community</h4>
              <a href="https://github.com/neoforge/neoforge">GitHub</a>
              <a href="https://discord.gg/neoforge">Discord</a>
              <a href="/contributing">Contributing</a>
            </div>
          </div>
          <div class="footer-bottom">
            <p>
              &copy; ${new Date().getFullYear()} NeoForge. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    `;
  }
}

customElements.define("app-footer", AppFooter);
