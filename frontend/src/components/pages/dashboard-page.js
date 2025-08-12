import {   LitElement, html, css   } from 'lit';
// baseStyles import removed - not used
// authService import removed - not used
import "../components/ui/card.js";
import "../components/ui/spinner.js";
import "../components/ui/tabs.js";
import "../components/ui/badge.js";

export class DashboardPage extends LitElement {
  static get properties() {
    return {
      stats: { type: Object },
      recentActivity: { type: Array },
      projects: { type: Array },
      filteredProjects: { type: Array, state: true },
      filterValue: { type: String, state: true },
      searchQuery: { type: String, state: true },
    };
  }

  constructor() {
    super();
    this.stats = {
      totalProjects: 0,
      activeProjects: 0,
      completedTasks: 0,
      pendingTasks: 0,
    };
    this.recentActivity = [];
    this.projects = [];
    this.filteredProjects = [];
    this.filterValue = "all";
    this.searchQuery = "";
  }

  connectedCallback() {
    super.connectedCallback();
    this.updateFilteredProjects();
  }

  updateFilteredProjects() {
    let filtered = [...this.projects];

    // Apply status filter
    if (this.filterValue !== "all") {
      filtered = filtered.filter(
        (project) => project.status === this.filterValue
      );
    }

    // Apply search filter
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter((project) =>
        project.name.toLowerCase().includes(query)
      );
    }

    this.filteredProjects = filtered;
  }

  handleFilterChange(e) {
    this.filterValue = e.target.value;
    this.updateFilteredProjects();
  }

  handleSearchInput(e) {
    this.searchQuery = e.target.value;
    this.updateFilteredProjects();
  }

  render() {
    return html`
      <div class="dashboard">
        <header>
          <h1>Dashboard</h1>
        </header>
        <div class="sidebar">
          <nav>
            <ul>
              <li><a href="#overview">Overview</a></li>
              <li><a href="#projects">Projects</a></li>
              <li><a href="#tasks">Tasks</a></li>
              <li><a href="#activity">Activity</a></li>
            </ul>
          </nav>
        </div>
        <main>
          <section class="stats-section">
            <div class="stat-card">
              <h3>Total Projects</h3>
              <p>${this.stats.totalProjects}</p>
            </div>
            <div class="stat-card">
              <h3>Active Projects</h3>
              <p>${this.stats.activeProjects}</p>
            </div>
            <div class="stat-card">
              <h3>Completed Tasks</h3>
              <p>${this.stats.completedTasks}</p>
            </div>
            <div class="stat-card">
              <h3>Pending Tasks</h3>
              <p>${this.stats.pendingTasks}</p>
            </div>
          </section>
          <section class="activity-section">
            <h2>Recent Activity</h2>
            ${this.recentActivity.map(
              (activity) => html`
                <div class="activity-item">
                  <p>${activity.description}</p>
                  <span class="timestamp"
                    >${new Date(activity.timestamp).toLocaleString()}</span
                  >
                </div>
              `
            )}
          </section>
          <section class="projects-section">
            <h2>Projects</h2>
            <div class="projects-controls">
              <div class="project-search">
                <input
                  type="text"
                  placeholder="Search projects..."
                  .value="${this.searchQuery}"
                  @input="${this.handleSearchInput}"
                />
              </div>
              <select
                class="project-filter"
                @change="${this.handleFilterChange}"
              >
                <option value="all">All Projects</option>
                <option value="in_progress">In Progress</option>
                <option value="planning">Planning</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            ${this.filteredProjects.map(
              (project) => html`
                <div class="project-item">
                  <h3>${project.name}</h3>
                  <div class="progress-bar" value="${project.progress}"></div>
                  <span class="status-badge">${project.status}</span>
                  <p>Due: ${project.dueDate}</p>
                </div>
              `
            )}
          </section>
        </main>
      </div>
    `;
  }

  static get styles() {
    return css`
      :host {
        display: block;
      }

      .dashboard {
        display: grid;
        grid-template-columns: 200px 1fr;
        grid-template-rows: auto 1fr;
        gap: 1rem;
        height: 100vh;
      }

      header {
        grid-column: 1 / -1;
        padding: 1rem;
        background: var(--surface-color);
      }

      .sidebar {
        padding: 1rem;
        background: var(--surface-color);
      }

      main {
        padding: 1rem;
      }

      .stats-section {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
        margin-bottom: 2rem;
      }

      .stat-card {
        padding: 1rem;
        background: var(--surface-color);
        border-radius: var(--radius-md);
        box-shadow: var(--shadow-sm);
      }

      .activity-section,
      .projects-section {
        background: var(--surface-color);
        padding: 1rem;
        border-radius: var(--radius-md);
        margin-bottom: 2rem;
      }

      .projects-controls {
        display: flex;
        gap: 1rem;
        margin-bottom: 1rem;
      }

      .project-search input {
        padding: 0.5rem;
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        width: 200px;
      }

      .project-filter {
        padding: 0.5rem;
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
      }

      .activity-item,
      .project-item {
        padding: 1rem;
        border-bottom: 1px solid var(--border-color);
      }

      .activity-item:last-child,
      .project-item:last-child {
        border-bottom: none;
      }

      .timestamp {
        color: var(--text-tertiary);
        font-size: var(--font-size-sm);
      }

      .progress-bar {
        height: 4px;
        background: var(--border-color);
        border-radius: var(--radius-full);
        margin: 0.5rem 0;
      }

      .status-badge {
        display: inline-block;
        padding: 0.25rem 0.5rem;
        border-radius: var(--radius-full);
        font-size: var(--font-size-sm);
        background: var(--primary-light);
        color: white;
      }

      .hidden {
        display: none;
      }
    `;
  }
}

customElements.define("dashboard-page", DashboardPage);
