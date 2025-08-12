import {   LitElement, html, css   } from 'lit';

export class ProjectsPage extends LitElement {
  static styles = css`
    :host {
      display: block;
      padding: 2rem;
    }

    h1 {
      font-size: 2.5rem;
      margin-bottom: 1.5rem;
      color: var(--color-primary, #3f51b5);
    }

    .content {
      max-width: 1200px;
      margin: 0 auto;
    }

    .project-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 2rem;
      margin-top: 2rem;
    }

    .project-card {
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 1.5rem;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    h2 {
      font-size: 1.5rem;
      margin-bottom: 0.5rem;
      color: var(--color-secondary, #303f9f);
    }

    p {
      line-height: 1.6;
      margin-bottom: 1rem;
    }
  `;

  render() {
    return html`
      <div class="content">
        <h1>NeoForge Projects</h1>

        <p>
          Explore projects built with NeoForge or contribute to our open source
          initiatives.
        </p>

        <div class="project-grid">
          <div class="project-card">
            <h2>Component Library</h2>
            <p>A collection of reusable web components built with NeoForge.</p>
          </div>

          <div class="project-card">
            <h2>Documentation Site</h2>
            <p>The official NeoForge documentation and guides.</p>
          </div>

          <div class="project-card">
            <h2>Starter Templates</h2>
            <p>Ready-to-use project templates for different use cases.</p>
          </div>

          <div class="project-card">
            <h2>Community Plugins</h2>
            <p>Extensions and plugins developed by the community.</p>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define("projects-page", ProjectsPage);
