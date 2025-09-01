import { html, css } from 'lit';
import { BaseComponent } from '../base-component.js';
import { apiService } from '../../services/api.js';

/**
 * Projects List Component
 * Displays user's projects with actions and status information.
 *
 * @element projects-list
 * @description List of user projects with management actions
 */
export class ProjectsList extends BaseComponent {
  static properties = {
    projects: { type: Array },
    isLoading: { type: Boolean },
    filter: { type: String },
    sortBy: { type: String },
    showCreateForm: { type: Boolean },
  };

  static styles = css`
    :host {
      display: block;
      width: 100%;
    }

    .projects-section {
      background: var(--surface-color, #ffffff);
      border-radius: 1rem;
      padding: 2rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      margin-bottom: 2rem;
    }

    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 2rem;
    }

    .section-title {
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--text-color, #334155);
      margin: 0;
    }

    .section-actions {
      display: flex;
      gap: 1rem;
      align-items: center;
    }

    .create-button {
      padding: 0.75rem 1.5rem;
      background: var(--primary-color, #3b82f6);
      color: white;
      border: none;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .create-button:hover {
      background: var(--primary-dark, #2563eb);
    }

    .filter-controls {
      display: flex;
      gap: 1rem;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    .filter-select {
      padding: 0.5rem 0.75rem;
      border: 1px solid var(--border-color, #e2e8f0);
      border-radius: 0.375rem;
      font-size: 0.875rem;
      background: var(--background-color, #f8fafc);
    }

    .projects-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 1.5rem;
    }

    .project-card {
      background: var(--background-color, #f8fafc);
      border: 1px solid var(--border-color, #e2e8f0);
      border-radius: 0.75rem;
      padding: 1.5rem;
      transition: all 0.3s ease;
      cursor: pointer;
    }

    .project-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
      border-color: var(--primary-color, #3b82f6);
    }

    .project-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 1rem;
    }

    .project-icon {
      width: 48px;
      height: 48px;
      border-radius: 0.75rem;
      background: var(--primary-light, #eff6ff);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      color: var(--primary-color, #3b82f6);
      flex-shrink: 0;
    }

    .project-info {
      flex: 1;
      margin-left: 1rem;
    }

    .project-name {
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--text-color, #334155);
      margin: 0 0 0.5rem 0;
      line-height: 1.3;
    }

    .project-description {
      font-size: 0.875rem;
      color: var(--text-secondary, #64748b);
      margin: 0 0 1rem 0;
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .project-meta {
      display: flex;
      align-items: center;
      gap: 1rem;
      font-size: 0.75rem;
      color: var(--text-secondary, #64748b);
    }

    .project-status {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.25rem 0.5rem;
      border-radius: 0.5rem;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .status-active {
      background: #dcfce7;
      color: #166534;
    }

    .status-completed {
      background: #dbeafe;
      color: #1e40af;
    }

    .status-paused {
      background: #fef3c7;
      color: #92400e;
    }

    .project-actions {
      opacity: 0;
      transition: opacity 0.2s;
      display: flex;
      gap: 0.5rem;
    }

    .project-card:hover .project-actions {
      opacity: 1;
    }

    .action-button {
      padding: 0.25rem;
      background: none;
      border: none;
      border-radius: 0.25rem;
      cursor: pointer;
      color: var(--text-secondary, #64748b);
      transition: all 0.2s;
    }

    .action-button:hover {
      background: var(--hover-color, #f1f5f9);
      color: var(--text-color, #334155);
    }

    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
      color: var(--text-secondary, #64748b);
    }

    .empty-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
      opacity: 0.5;
    }

    .empty-title {
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--text-color, #334155);
      margin: 0 0 0.5rem 0;
    }

    .empty-description {
      font-size: 1rem;
      margin: 0 0 2rem 0;
    }

    .loading-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 1.5rem;
    }

    .loading-card {
      background: var(--background-color, #f8fafc);
      border: 1px solid var(--border-color, #e2e8f0);
      border-radius: 0.75rem;
      padding: 1.5rem;
    }

    .loading-skeleton {
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: loading 1.5s infinite;
      border-radius: 0.375rem;
    }

    @keyframes loading {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    .loading-title {
      height: 1.5rem;
      width: 70%;
      margin-bottom: 0.5rem;
    }

    .loading-description {
      height: 1rem;
      width: 90%;
      margin-bottom: 1rem;
    }

    .loading-meta {
      height: 0.75rem;
      width: 50%;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .projects-section {
        padding: 1.5rem;
      }

      .section-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
      }

      .section-actions {
        width: 100%;
        justify-content: space-between;
      }

      .filter-controls {
        flex-wrap: wrap;
      }

      .projects-grid {
        grid-template-columns: 1fr;
      }

      .project-header {
        flex-direction: column;
        gap: 1rem;
      }

      .project-info {
        margin-left: 0;
      }
    }

    /* Dark Mode Support */
    @media (prefers-color-scheme: dark) {
      .projects-section {
        background: var(--surface-color, #1e293b);
        border: 1px solid var(--border-color, #334155);
      }

      .project-card {
        background: var(--background-color, #0f172a);
        border-color: var(--border-color, #334155);
      }

      .project-card:hover {
        border-color: var(--primary-color, #3b82f6);
      }
    }
  `;

  constructor() {
    super();
    this.projects = [];
    this.isLoading = true;
    this.filter = 'all';
    this.sortBy = 'recent';
    this.showCreateForm = false;
  }

  connectedCallback() {
    super.connectedCallback();
    this._loadProjects();
  }

  async _loadProjects() {
    try {
      const response = await apiService.request('/projects');
      this.projects = response.data || [];
    } catch (error) {
      console.error('Failed to load projects:', error);
      // Use fallback data
      this._loadFallbackProjects();
    } finally {
      this.isLoading = false;
    }
  }

  _loadFallbackProjects() {
    this.projects = [
      {
        id: 1,
        name: 'Welcome Project',
        description: 'Your first project to get started with NeoForge',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        category: 'Getting Started'
      }
    ];
  }

  _getProjectIcon(project) {
    const category = project.category?.toLowerCase() || 'general';
    const icons = {
      'web development': '🌐',
      'data science': '📊',
      'mobile': '📱',
      'backend': '🔌',
      'full stack': '🚀',
      'getting started': '🎯',
      'general': '📁'
    };
    return icons[category] || icons.general;
  }

  _getStatusClass(status) {
    return `status-${status}`;
  }

  _formatDate(dateString) {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch (error) {
      return 'Unknown';
    }
  }

  _handleProjectClick(project) {
    this.dispatchEvent(new CustomEvent('project-selected', {
      detail: { project },
      bubbles: true,
      composed: true
    }));
  }

  _handleCreateProject() {
    this.dispatchEvent(new CustomEvent('create-project', {
      bubbles: true,
      composed: true
    }));
  }

  _getFilteredProjects() {
    let filtered = [...this.projects];

    // Apply filter
    if (this.filter !== 'all') {
      filtered = filtered.filter(project => project.status === this.filter);
    }

    // Apply sorting
    switch (this.sortBy) {
      case 'recent':
        filtered.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
        break;
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'created':
        filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        break;
    }

    return filtered;
  }

  render() {
    const filteredProjects = this._getFilteredProjects();

    return html`
      <section class="projects-section">
        <div class="section-header">
          <h2 class="section-title">Your Projects</h2>
          <div class="section-actions">
            <button class="create-button" @click=${this._handleCreateProject}>
              + New Project
            </button>
          </div>
        </div>

        <div class="filter-controls">
          <label>
            Status:
            <select
              class="filter-select"
              .value=${this.filter}
              @change=${(e) => this.filter = e.target.value}
            >
              <option value="all">All Projects</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="paused">Paused</option>
            </select>
          </label>

          <label>
            Sort by:
            <select
              class="filter-select"
              .value=${this.sortBy}
              @change=${(e) => this.sortBy = e.target.value}
            >
              <option value="recent">Recently Updated</option>
              <option value="name">Name</option>
              <option value="created">Date Created</option>
            </select>
          </label>
        </div>

        ${this.isLoading ? html`
          <div class="loading-grid">
            ${Array.from({ length: 3 }).map(() => html`
              <div class="loading-card">
                <div class="loading-skeleton loading-title"></div>
                <div class="loading-skeleton loading-description"></div>
                <div class="loading-skeleton loading-meta" style="width: 30%;"></div>
              </div>
            `)}
          </div>
        ` : filteredProjects.length > 0 ? html`
          <div class="projects-grid">
            ${filteredProjects.map(project => html`
              <div
                class="project-card"
                @click=${() => this._handleProjectClick(project)}
              >
                <div class="project-header">
                  <div class="project-icon">
                    ${this._getProjectIcon(project)}
                  </div>
                  <div class="project-info">
                    <h3 class="project-name">${project.name}</h3>
                    <p class="project-description">${project.description}</p>
                    <div class="project-meta">
                      <span class="project-status ${this._getStatusClass(project.status)}">
                        ● ${project.status}
                      </span>
                      <span>Updated ${this._formatDate(project.updated_at)}</span>
                    </div>
                  </div>
                  <div class="project-actions">
                    <button class="action-button" title="Edit project">
                      ✏️
                    </button>
                    <button class="action-button" title="Project settings">
                      ⚙️
                    </button>
                  </div>
                </div>
              </div>
            `)}
          </div>
        ` : html`
          <div class="empty-state">
            <div class="empty-icon">📁</div>
            <h3 class="empty-title">No projects yet</h3>
            <p class="empty-description">
              Create your first project to get started with NeoForge.
            </p>
            <button class="create-button" @click=${this._handleCreateProject}>
              Create Your First Project
            </button>
          </div>
        `}
      </section>
    `;
  }
}

customElements.define('projects-list', ProjectsList);