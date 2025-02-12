import { LitElement, html, css } from "lit";
import { apiService } from "../services/api.js";
import { Logger } from "../utils/logger.js";

export class ProjectsPage extends LitElement {
  static properties = {
    projects: { type: Array },
    isLoading: { type: Boolean },
    error: { type: String },
  };

  static styles = css`
    :host {
      display: block;
    }

    .projects-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }

    .hero {
      text-align: center;
      padding: 4rem 2rem;
      background: linear-gradient(
        135deg,
        var(--primary-color) 0%,
        var(--secondary-color) 100%
      );
      border-radius: 12px;
      margin-bottom: 4rem;
      color: white;
    }

    .hero h1 {
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    .hero p {
      font-size: 1.25rem;
      opacity: 0.9;
      max-width: 600px;
      margin: 0 auto;
    }

    .submit-project {
      display: inline-block;
      margin-top: 2rem;
      padding: 0.75rem 1.5rem;
      background: white;
      color: var(--primary-color);
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      transition: transform 0.2s;
    }

    .submit-project:hover {
      transform: translateY(-2px);
    }

    .projects-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 2rem;
      margin-bottom: 4rem;
    }

    .project-card {
      background: var(--surface-color);
      border-radius: 12px;
      overflow: hidden;
      transition: transform 0.2s;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .project-card:hover {
      transform: translateY(-4px);
    }

    .project-image {
      width: 100%;
      height: 200px;
      object-fit: cover;
    }

    .project-content {
      padding: 1.5rem;
    }

    .project-title {
      font-size: 1.25rem;
      font-weight: 600;
      margin: 0 0 0.5rem;
      color: var(--text-color);
    }

    .project-description {
      color: var(--text-secondary);
      margin-bottom: 1rem;
      line-height: 1.6;
    }

    .project-tags {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
      margin-bottom: 1rem;
    }

    .tag {
      padding: 0.25rem 0.75rem;
      background: rgba(0, 163, 255, 0.1);
      color: var(--primary-color);
      border-radius: 16px;
      font-size: 0.875rem;
    }

    .project-links {
      display: flex;
      gap: 1rem;
    }

    .project-link {
      color: var(--primary-color);
      text-decoration: none;
      display: flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.875rem;
    }

    .project-link:hover {
      text-decoration: underline;
    }

    .loading {
      text-align: center;
      padding: 4rem;
      color: var(--text-secondary);
    }

    .error {
      text-align: center;
      padding: 2rem;
      color: var(--error-color);
      background: rgba(255, 68, 68, 0.1);
      border-radius: 8px;
      margin: 2rem;
    }

    @media (max-width: 768px) {
      .hero {
        padding: 3rem 1rem;
      }

      .hero h1 {
        font-size: 2.5rem;
      }

      .projects-grid {
        grid-template-columns: 1fr;
      }
    }
  `;

  constructor() {
    super();
    this.projects = [];
    this.isLoading = true;
    this.error = null;
  }

  connectedCallback() {
    super.connectedCallback();
    this.loadProjects();
  }

  async loadProjects() {
    try {
      const data = await apiService.getProjects();
      this.projects = data.projects;
    } catch (error) {
      Logger.error("Failed to load projects:", error);
      this.error = "Failed to load projects. Please try again later.";
    } finally {
      this.isLoading = false;
    }
  }

  render() {
    if (this.isLoading) {
      return html`<div class="loading">Loading projects...</div>`;
    }

    if (this.error) {
      return html`<div class="error">${this.error}</div>`;
    }

    // Example projects (replace with actual data from API)
    const featuredProjects = [
      {
        title: "TechBlog Platform",
        description: "A modern blogging platform built with NeoForge",
        image: "/src/assets/projects/techblog.jpg",
        tags: ["Blog", "Content", "SSR"],
        liveUrl: "https://techblog.example.com",
        githubUrl: "https://github.com/example/techblog",
      },
      {
        title: "Task Manager Pro",
        description: "Professional task management application",
        image: "/src/assets/projects/taskmanager.jpg",
        tags: ["Productivity", "SaaS", "Real-time"],
        liveUrl: "https://taskpro.example.com",
        githubUrl: "https://github.com/example/taskpro",
      },
      {
        title: "E-commerce Store",
        description: "Full-featured e-commerce solution",
        image: "/src/assets/projects/ecommerce.jpg",
        tags: ["E-commerce", "Payments", "Analytics"],
        liveUrl: "https://store.example.com",
        githubUrl: "https://github.com/example/store",
      },
    ];

    return html`
      <div class="projects-container">
        <section class="hero">
          <h1>Built with NeoForge</h1>
          <p>
            Discover amazing projects built by our community using NeoForge.
            Submit your own project to inspire others!
          </p>
          <a
            href="https://github.com/neoforge/showcase"
            class="submit-project"
            target="_blank"
          >
            Submit Your Project
          </a>
        </section>

        <div class="projects-grid">
          ${featuredProjects.map(
            (project) => html`
              <div class="project-card">
                <img
                  src=${project.image}
                  alt=${project.title}
                  class="project-image"
                />
                <div class="project-content">
                  <h3 class="project-title">${project.title}</h3>
                  <p class="project-description">${project.description}</p>
                  <div class="project-tags">
                    ${project.tags.map(
                      (tag) => html`<span class="tag">${tag}</span>`
                    )}
                  </div>
                  <div class="project-links">
                    <a
                      href=${project.liveUrl}
                      class="project-link"
                      target="_blank"
                    >
                      <span class="material-icons">launch</span>
                      Live Demo
                    </a>
                    <a
                      href=${project.githubUrl}
                      class="project-link"
                      target="_blank"
                    >
                      <span class="material-icons">code</span>
                      Source Code
                    </a>
                  </div>
                </div>
              </div>
            `
          )}
        </div>
      </div>
    `;
  }
}

customElements.define("projects-page", ProjectsPage);
