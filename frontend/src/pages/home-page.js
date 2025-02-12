import { LitElement, html, css } from "/vendor/lit-core.min.js";
import { themeVariables } from "../styles/theme.js";
import { baseStyles } from "../styles/base.js";
import { router } from "../router.js";

// Register service worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js")
      .then((registration) => {
        console.log("ServiceWorker registration successful");
      })
      .catch((err) => {
        console.log("ServiceWorker registration failed: ", err);
      });
  });
}

export class HomePage extends LitElement {
  static styles = [
    themeVariables,
    baseStyles,
    css`
      :host {
        display: block;
      }

      .hero {
        text-align: center;
        padding: var(--space-16) var(--space-4);
        background: var(--surface-2);
        border-radius: var(--radius-2);
        margin-bottom: var(--space-16);
      }

      .hero h1 {
        font-size: var(--text-4xl);
        margin-bottom: var(--space-4);
      }

      .hero p {
        font-size: var(--text-xl);
        color: var(--text-2);
        max-width: 600px;
        margin: 0 auto var(--space-8);
      }

      .hero-buttons {
        display: flex;
        gap: var(--space-4);
        justify-content: center;
      }

      .features {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: var(--space-8);
        margin-bottom: var(--space-16);
      }

      .feature {
        padding: var(--space-6);
        background: var(--surface-1);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-2);
      }

      .feature h3 {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        margin-bottom: var(--space-4);
      }

      .feature p {
        color: var(--text-2);
        margin: 0;
      }

      .cta {
        text-align: center;
        padding: var(--space-16) var(--space-4);
        background: var(--surface-2);
        border-radius: var(--radius-2);
      }

      .cta h2 {
        font-size: var(--text-3xl);
        margin-bottom: var(--space-4);
      }

      .cta p {
        color: var(--text-2);
        max-width: 600px;
        margin: 0 auto var(--space-8);
      }

      .docs-section {
        margin: 4rem 0;
        text-align: center;
      }

      .docs-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 2rem;
        margin-top: 2rem;
      }

      .doc-card {
        background-color: var(--surface-color);
        padding: 2rem;
        border-radius: 12px;
        text-decoration: none;
        transition: all 0.2s ease;
      }

      .doc-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
      }

      .doc-title {
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--text-color);
        margin-bottom: 1rem;
      }

      .doc-description {
        color: var(--text-secondary);
        line-height: 1.6;
        margin-bottom: 1rem;
      }

      .learn-more {
        color: var(--primary-color);
        font-weight: 500;
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
      }

      .interactive-demo {
        margin: var(--spacing-xl) 0;
        padding: var(--spacing-lg);
        background: var(--surface-color);
        border-radius: var(--radius-lg);
        border: 1px solid var(--border-color);
      }

      .demo-tabs {
        display: flex;
        gap: var(--spacing-md);
        margin-bottom: var(--spacing-md);
        border-bottom: 2px solid var(--border-color);
        padding-bottom: var(--spacing-sm);
      }

      .demo-tab {
        padding: var(--spacing-sm) var(--spacing-md);
        border-radius: var(--radius-sm);
        cursor: pointer;
        transition: all var(--transition-normal);
        color: var(--text-secondary);
      }

      .demo-tab.active {
        background: var(--primary-color);
        color: var(--background-color);
      }

      .demo-content {
        background: var(--code-background);
        padding: var(--spacing-md);
        border-radius: var(--radius-md);
        position: relative;
      }

      .code-block {
        font-family: var(--font-family-mono);
        font-size: var(--text-sm);
        line-height: 1.6;
        color: var(--code-text);
        margin: 0;
      }

      .copy-button {
        position: absolute;
        top: var(--spacing-sm);
        right: var(--spacing-sm);
        padding: var(--spacing-xs) var(--spacing-sm);
        background: var(--surface-color);
        border: none;
        border-radius: var(--radius-sm);
        cursor: pointer;
        opacity: 0.8;
        transition: opacity var(--transition-normal);
        color: var(--text-color);
      }

      .copy-button:hover {
        opacity: 1;
      }

      .getting-started {
        margin: var(--spacing-xl) 0;
        text-align: center;
      }

      .getting-started h2 {
        font-size: var(--text-3xl);
        font-weight: var(--font-bold);
        margin-bottom: var(--spacing-xl);
        color: var(--text-color);
      }

      .steps {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: var(--spacing-lg);
      }

      .step-card {
        background: var(--surface-color);
        padding: var(--spacing-lg);
        border-radius: var(--radius-lg);
        position: relative;
        border: 1px solid var(--border-color);
      }

      .step-number {
        position: absolute;
        top: calc(-1 * var(--spacing-md));
        left: calc(-1 * var(--spacing-md));
        width: 2.5rem;
        height: 2.5rem;
        background: var(--primary-color);
        color: var(--background-color);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: var(--font-bold);
      }

      .community-section {
        margin: var(--spacing-xl) 0;
        text-align: center;
      }

      .community-section h2 {
        font-size: var(--text-3xl);
        font-weight: var(--font-bold);
        margin-bottom: var(--spacing-xl);
        color: var(--text-color);
      }

      .metrics {
        display: flex;
        justify-content: space-around;
        margin: var(--spacing-lg) 0;
        flex-wrap: wrap;
        gap: var(--spacing-lg);
      }

      .metric {
        text-align: center;
      }

      .metric-value {
        font-size: var(--text-3xl);
        font-weight: var(--font-bold);
        color: var(--primary-color);
      }

      .metric-label {
        color: var(--text-secondary);
        margin-top: var(--spacing-xs);
      }

      @media (max-width: 768px) {
        .hero {
          padding: var(--spacing-lg) var(--spacing-md);
        }

        .hero h1 {
          font-size: var(--text-3xl);
        }

        .hero p {
          font-size: var(--text-lg);
        }

        .hero-buttons {
          flex-direction: column;
        }

        .hero-buttons button {
          width: 100%;
          text-align: center;
        }
      }
    `,
  ];

  constructor() {
    super();
    this.activeTab = "backend";
  }

  setActiveTab(tab) {
    this.activeTab = tab;
    this.requestUpdate();
  }

  copyCode() {
    const code = this.shadowRoot.querySelector(".code-block").textContent;
    navigator.clipboard.writeText(code).then(() => {
      const button = this.shadowRoot.querySelector(".copy-button");
      const originalText = button.textContent;
      button.textContent = "Copied!";
      setTimeout(() => {
        button.textContent = originalText;
      }, 2000);
    });
  }

  render() {
    return html`
      <div class="hero">
        <h1>Welcome to NeoForge</h1>
        <p>
          A modern web development framework for building fast, scalable, and
          maintainable applications.
        </p>
        <div class="hero-buttons">
          <button class="button" @click=${() => router.navigate("/docs")}>
            Get Started
          </button>
          <button
            class="button button--outline"
            @click=${() => router.navigate("/examples")}
          >
            View Examples
          </button>
        </div>
      </div>

      <div class="features">
        <div class="feature">
          <h3>
            <span class="material-icons">speed</span>
            Lightning Fast
          </h3>
          <p>
            Built with performance in mind, NeoForge delivers blazing fast load
            times and smooth interactions.
          </p>
        </div>

        <div class="feature">
          <h3>
            <span class="material-icons">extension</span>
            Modular Design
          </h3>
          <p>
            Create reusable components and build complex applications with ease
            using our modular architecture.
          </p>
        </div>

        <div class="feature">
          <h3>
            <span class="material-icons">security</span>
            Secure by Default
          </h3>
          <p>
            Built-in security features and best practices to keep your
            applications safe and protected.
          </p>
        </div>

        <div class="feature">
          <h3>
            <span class="material-icons">auto_fix_high</span>
            Developer Experience
          </h3>
          <p>
            Intuitive APIs, comprehensive documentation, and powerful
            development tools for a great DX.
          </p>
        </div>

        <div class="feature">
          <h3>
            <span class="material-icons">devices</span>
            Cross-Platform
          </h3>
          <p>
            Build once, deploy everywhere. NeoForge works seamlessly across all
            modern browsers and devices.
          </p>
        </div>

        <div class="feature">
          <h3>
            <span class="material-icons">group</span>
            Active Community
          </h3>
          <p>
            Join our growing community of developers, share knowledge, and get
            help when you need it.
          </p>
        </div>
      </div>

      <div class="cta">
        <h2>Ready to Get Started?</h2>
        <p>
          Join thousands of developers already building amazing applications
          with NeoForge.
        </p>
        <button
          class="button"
          @click=${() => router.navigate("/auth/register")}
        >
          Create Free Account
        </button>
      </div>

      <section class="docs-section">
        <h2>Comprehensive Documentation</h2>
        <div class="docs-grid">
          <a href="/docs/getting-started" class="doc-card">
            <h3 class="doc-title">Getting Started</h3>
            <p class="doc-description">
              Quick start guide to get your project up and running.
            </p>
            <span class="learn-more">
              Learn more
              <span class="material-icons">arrow_forward</span>
            </span>
          </a>
          <a href="/docs/components" class="doc-card">
            <h3 class="doc-title">Components</h3>
            <p class="doc-description">
              Explore our library of reusable web components.
            </p>
            <span class="learn-more">
              Learn more
              <span class="material-icons">arrow_forward</span>
            </span>
          </a>
          <a href="/docs/deployment" class="doc-card">
            <h3 class="doc-title">Deployment</h3>
            <p class="doc-description">
              Learn how to deploy your application to production.
            </p>
            <span class="learn-more">
              Learn more
              <span class="material-icons">arrow_forward</span>
            </span>
          </a>
        </div>
      </section>
    `;
  }

  getCodeExample() {
    switch (this.activeTab) {
      case "backend":
        return `from fastapi import FastAPI
from neoforge import NeoForge

app = FastAPI()
neo = NeoForge()

@app.get("/")
async def hello_world():
    return {"message": "Welcome to NeoForge!"}`;
      case "frontend":
        return `import { LitElement, html } from 'lit';

class MyApp extends LitElement {
  render() {
    return html\`
      <h1>Hello NeoForge!</h1>
      <p>Build amazing web apps</p>
    \`;
  }
}`;
      case "deploy":
        return `# Deploy to Digital Ocean
make deploy

# Your app is live! 🚀
https://your-app.neoforge.dev`;
    }
  }
}

customElements.define("home-page", HomePage);
