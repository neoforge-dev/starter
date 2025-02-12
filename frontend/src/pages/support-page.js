import { LitElement, html, css } from "lit";

export class SupportPage extends LitElement {
  static properties = {
    isLoading: { type: Boolean },
  };

  static styles = css`
    :host {
      display: block;
      color: var(--text-color);
    }

    .support-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }

    .hero {
      background: linear-gradient(
        135deg,
        var(--primary-color),
        var(--secondary-color)
      );
      padding: 3rem 2rem;
      border-radius: 8px;
      text-align: center;
      margin-bottom: 3rem;
      color: white;
    }

    .hero h1 {
      font-size: 2.5rem;
      margin-bottom: 1rem;
    }

    .hero p {
      font-size: 1.2rem;
      opacity: 0.9;
    }

    .support-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 2rem;
      margin-bottom: 3rem;
    }

    .support-card {
      background: var(--surface-color);
      padding: 2rem;
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .support-card h2 {
      color: var(--primary-color);
      margin-bottom: 1rem;
      font-size: 1.5rem;
    }

    .support-card p {
      margin-bottom: 1.5rem;
      color: var(--text-secondary);
      line-height: 1.6;
    }

    .support-link {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      color: var(--primary-color);
      text-decoration: none;
      font-weight: 500;
      transition: color 0.2s ease;
    }

    .support-link:hover {
      color: var(--secondary-color);
    }

    .faq-section {
      background: var(--surface-color);
      padding: 2rem;
      border-radius: 8px;
      margin-top: 2rem;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .faq-item {
      margin-bottom: 1.5rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .faq-item:last-child {
      margin-bottom: 0;
      padding-bottom: 0;
      border-bottom: none;
    }

    .faq-question {
      font-weight: 600;
      color: var(--primary-color);
      margin-bottom: 0.5rem;
    }

    .faq-answer {
      color: var(--text-secondary);
      line-height: 1.6;
    }

    @media (max-width: 768px) {
      .support-grid {
        grid-template-columns: 1fr;
      }
    }
  `;

  render() {
    return html`
      <div class="support-container">
        <section class="hero">
          <h1>How Can We Help?</h1>
          <p>Get the support you need to succeed with NeoForge</p>
        </section>

        <div class="support-grid">
          <div class="support-card">
            <h2>Documentation</h2>
            <p>
              Explore our comprehensive documentation to learn about features,
              best practices, and implementation guides.
            </p>
            <a href="/docs" class="support-link"> Browse Documentation → </a>
          </div>

          <div class="support-card">
            <h2>Community</h2>
            <p>
              Join our vibrant community of developers. Share knowledge, ask
              questions, and collaborate on projects.
            </p>
            <a href="/community" class="support-link"> Join Community → </a>
          </div>

          <div class="support-card">
            <h2>GitHub</h2>
            <p>
              Report issues, submit feature requests, or contribute to the
              project on our GitHub repository.
            </p>
            <a
              href="https://github.com/neoforge/neoforge"
              class="support-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              View on GitHub →
            </a>
          </div>
        </div>

        <section class="faq-section">
          <h2>Frequently Asked Questions</h2>
          <div class="faq-item">
            <div class="faq-question">How do I get started with NeoForge?</div>
            <div class="faq-answer">
              Check out our Getting Started guide in the documentation. It walks
              you through the setup process and basic concepts.
            </div>
          </div>

          <div class="faq-item">
            <div class="faq-question">Where can I report bugs?</div>
            <div class="faq-answer">
              You can report bugs on our GitHub repository's issue tracker.
              Please check existing issues first to avoid duplicates.
            </div>
          </div>

          <div class="faq-item">
            <div class="faq-question">How can I contribute to the project?</div>
            <div class="faq-answer">
              We welcome contributions! Read our contributing guidelines on
              GitHub to learn about our development process and standards.
            </div>
          </div>
        </section>
      </div>
    `;
  }
}

customElements.define("support-page", SupportPage);
