import { LitElement, html, css } from "lit";
import "../components/header.js";
import "../components/footer.js";

export class LandingPage extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    .hero {
      padding: var(--spacing-3xl) 0;
      text-align: center;
      background: linear-gradient(
        to bottom,
        var(--surface-color),
        var(--background-color)
      );
    }

    .hero h1 {
      font-size: var(--font-size-4xl);
      margin-bottom: var(--spacing-lg);
      color: var(--text-color);
    }

    .hero p {
      font-size: var(--font-size-lg);
      color: var(--text-secondary);
      max-width: 600px;
      margin: 0 auto var(--spacing-xl);
    }

    .cta-buttons {
      display: flex;
      gap: var(--spacing-md);
      justify-content: center;
      margin-bottom: var(--spacing-2xl);
    }

    .features {
      padding: var(--spacing-2xl) var(--spacing-lg);
      max-width: 1200px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: var(--spacing-xl);
    }

    .feature-card {
      padding: var(--spacing-lg);
      background: var(--surface-color);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-md);
    }

    .feature-card h3 {
      margin-bottom: var(--spacing-md);
    }
  `;

  render() {
    return html`
      <main>
        <section class="hero">
          <h1>Build Better Apps Faster</h1>
          <p>
            A modern full-stack starter kit with FastAPI, Lit, and best
            practices built-in.
          </p>
          <div class="cta-buttons">
            <app-button primary>Get Started</app-button>
            <app-button>View on GitHub</app-button>
          </div>
        </section>

        <section class="features">
          <div class="feature-card">
            <h3>Fast Development</h3>
            <p>Quick setup and hot reloading for rapid development cycles.</p>
          </div>
          <div class="feature-card">
            <h3>Production Ready</h3>
            <p>Optimized for performance with security best practices.</p>
          </div>
          <div class="feature-card">
            <h3>Modern Stack</h3>
            <p>Latest technologies and patterns for modern web development.</p>
          </div>
        </section>
      </main>
    `;
  }
}

customElements.define("landing-page", LandingPage);
