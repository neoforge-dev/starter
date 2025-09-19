/**
 * DashboardPage Component - VANILLA JAVASCRIPT VERSION
 * Uses atomic design components (Button, Input, Card, FormField)
 */
export class DashboardPage extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.stats = {
      totalProjects: 12,
      activeProjects: 8,
      completedTasks: 47,
      pendingTasks: 23,
    };
    this.recentActivity = [
      { description: 'Completed project "Website Redesign"', timestamp: new Date(Date.now() - 1000 * 60 * 30) },
      { description: 'Added new team member to "Mobile App"', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2) },
      { description: 'Updated project timeline for "API Integration"', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4) },
      { description: 'Created new project "Data Analytics Dashboard"', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6) },
    ];
    this.projects = [
      { name: 'Website Redesign', status: 'in_progress', progress: 75, dueDate: '2024-02-15' },
      { name: 'Mobile App', status: 'planning', progress: 20, dueDate: '2024-03-01' },
      { name: 'API Integration', status: 'in_progress', progress: 60, dueDate: '2024-02-28' },
      { name: 'Data Analytics', status: 'completed', progress: 100, dueDate: '2024-01-30' },
    ];
    this.filteredProjects = [...this.projects];
    this.filterValue = 'all';
    this.searchQuery = '';
  }

  connectedCallback() {
    this.render();
    this.attachEventListeners();
  }

  render() {
    const styles = `
      :host {
        display: block;
        min-height: 100vh;
        background: #f8fafc;
        padding: 2rem;
      }

      .dashboard {
        max-width: 1200px;
        margin: 0 auto;
      }

      .dashboard-header {
        margin-bottom: 2rem;
      }

      .dashboard-title {
        font-size: 2.5rem;
        font-weight: 700;
        color: #1f2937;
        margin: 0 0 0.5rem 0;
      }

      .dashboard-subtitle {
        color: #6b7280;
        margin: 0;
        font-size: 1.125rem;
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 1.5rem;
        margin-bottom: 3rem;
      }

      .stat-card {
        background: white;
        padding: 2rem;
        border-radius: 12px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        border: 1px solid #e5e7eb;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }

      .stat-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
      }

      .stat-header {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 1rem;
      }

      .stat-icon {
        width: 3rem;
        height: 3rem;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.5rem;
      }

      .stat-icon.projects { background: #dbeafe; color: #2563eb; }
      .stat-icon.active { background: #dcfce7; color: #16a34a; }
      .stat-icon.completed { background: #fef3c7; color: #d97706; }
      .stat-icon.pending { background: #fee2e2; color: #dc2626; }

      .stat-title {
        font-size: 0.875rem;
        font-weight: 500;
        color: #6b7280;
        margin: 0;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .stat-value {
        font-size: 2.5rem;
        font-weight: 700;
        color: #1f2937;
        margin: 0;
      }

      .content-grid {
        display: grid;
        grid-template-columns: 2fr 1fr;
        gap: 2rem;
      }

      .main-content {
        display: flex;
        flex-direction: column;
        gap: 2rem;
      }

      .section-card {
        background: white;
        border-radius: 12px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        border: 1px solid #e5e7eb;
        overflow: hidden;
      }

      .section-header {
        padding: 1.5rem 2rem;
        border-bottom: 1px solid #e5e7eb;
        background: #f9fafb;
      }

      .section-title {
        font-size: 1.25rem;
        font-weight: 600;
        color: #1f2937;
        margin: 0;
      }

      .section-content {
        padding: 2rem;
      }

      .projects-controls {
        display: flex;
        gap: 1rem;
        margin-bottom: 1.5rem;
      }

      .search-input {
        flex: 1;
        padding: 0.75rem 1rem;
        border: 1px solid #d1d5db;
        border-radius: 8px;
        font-size: 1rem;
        background: white;
      }

      .search-input:focus {
        outline: none;
        border-color: #2563eb;
        box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
      }

      .filter-select {
        padding: 0.75rem 1rem;
        border: 1px solid #d1d5db;
        border-radius: 8px;
        font-size: 1rem;
        background: white;
        min-width: 150px;
      }

      .filter-select:focus {
        outline: none;
        border-color: #2563eb;
        box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
      }

      .projects-grid {
        display: grid;
        gap: 1rem;
      }

      .project-card {
        padding: 1.5rem;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        background: white;
        transition: all 0.2s ease;
      }

      .project-card:hover {
        border-color: #2563eb;
        box-shadow: 0 4px 12px rgba(37, 99, 235, 0.1);
      }

      .project-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 1rem;
      }

      .project-title {
        font-size: 1.125rem;
        font-weight: 600;
        color: #1f2937;
        margin: 0;
      }

      .project-status {
        padding: 0.25rem 0.75rem;
        border-radius: 9999px;
        font-size: 0.75rem;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .status-in_progress {
        background: #dbeafe;
        color: #2563eb;
      }

      .status-planning {
        background: #fef3c7;
        color: #d97706;
      }

      .status-completed {
        background: #dcfce7;
        color: #16a34a;
      }

      .progress-bar {
        width: 100%;
        height: 8px;
        background: #e5e7eb;
        border-radius: 4px;
        overflow: hidden;
        margin-bottom: 0.75rem;
      }

      .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #2563eb, #3b82f6);
        border-radius: 4px;
        transition: width 0.3s ease;
      }

      .project-meta {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 0.875rem;
        color: #6b7280;
      }

      .activity-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .activity-item {
        padding: 1rem;
        border-left: 3px solid #2563eb;
        background: #f8fafc;
        border-radius: 0 8px 8px 0;
      }

      .activity-description {
        font-size: 0.875rem;
        color: #1f2937;
        margin: 0 0 0.5rem 0;
      }

      .activity-timestamp {
        font-size: 0.75rem;
        color: #6b7280;
        margin: 0;
      }

      .sidebar {
        display: flex;
        flex-direction: column;
        gap: 2rem;
      }

      .quick-actions {
        background: white;
        padding: 2rem;
        border-radius: 12px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        border: 1px solid #e5e7eb;
      }

      .quick-actions-title {
        font-size: 1.125rem;
        font-weight: 600;
        color: #1f2937;
        margin: 0 0 1.5rem 0;
      }

      .quick-actions-grid {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      .quick-action-btn {
        width: 100%;
        padding: 0.75rem 1rem;
        background: #f8fafc;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        color: #374151;
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        text-align: left;
      }

      .quick-action-btn:hover {
        background: #2563eb;
        border-color: #2563eb;
        color: white;
      }

      @media (max-width: 768px) {
        .content-grid {
          grid-template-columns: 1fr;
        }

        .stats-grid {
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        }

        .dashboard {
          padding: 1rem;
        }
      }
    `;

    this.shadowRoot.innerHTML = `
      <style>${styles}</style>
      <div class="dashboard">
        <div class="dashboard-header">
          <h1 class="dashboard-title">Dashboard</h1>
          <p class="dashboard-subtitle">Welcome back! Here's what's happening with your projects.</p>
        </div>

        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-header">
              <div class="stat-icon projects">📊</div>
              <h3 class="stat-title">Total Projects</h3>
            </div>
            <p class="stat-value">${this.stats.totalProjects}</p>
          </div>

          <div class="stat-card">
            <div class="stat-header">
              <div class="stat-icon active">🚀</div>
              <h3 class="stat-title">Active Projects</h3>
            </div>
            <p class="stat-value">${this.stats.activeProjects}</p>
          </div>

          <div class="stat-card">
            <div class="stat-header">
              <div class="stat-icon completed">✅</div>
              <h3 class="stat-title">Completed Tasks</h3>
            </div>
            <p class="stat-value">${this.stats.completedTasks}</p>
          </div>

          <div class="stat-card">
            <div class="stat-header">
              <div class="stat-icon pending">⏳</div>
              <h3 class="stat-title">Pending Tasks</h3>
            </div>
            <p class="stat-value">${this.stats.pendingTasks}</p>
          </div>
        </div>

        <div class="content-grid">
          <div class="main-content">
            <div class="section-card">
              <div class="section-header">
                <h2 class="section-title">Projects</h2>
              </div>
              <div class="section-content">
                <div class="projects-controls">
                  <input
                    type="text"
                    class="search-input"
                    placeholder="Search projects..."
                    value="${this.searchQuery}"
                  />
                  <select class="filter-select" value="${this.filterValue}">
                    <option value="all">All Projects</option>
                    <option value="in_progress">In Progress</option>
                    <option value="planning">Planning</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <div class="projects-grid">
                  ${this.filteredProjects.map(project => `
                    <div class="project-card">
                      <div class="project-header">
                        <h3 class="project-title">${project.name}</h3>
                        <span class="project-status status-${project.status}">
                          ${project.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div class="progress-bar">
                        <div class="progress-fill" style="width: ${project.progress}%"></div>
                      </div>
                      <div class="project-meta">
                        <span>Due: ${new Date(project.dueDate).toLocaleDateString()}</span>
                        <span>${project.progress}% complete</span>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>
          </div>

          <div class="sidebar">
            <div class="section-card">
              <div class="section-header">
                <h2 class="section-title">Recent Activity</h2>
              </div>
              <div class="section-content">
                <div class="activity-list">
                  ${this.recentActivity.map(activity => `
                    <div class="activity-item">
                      <p class="activity-description">${activity.description}</p>
                      <p class="activity-timestamp">${activity.timestamp.toLocaleString()}</p>
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>

            <div class="quick-actions">
              <h3 class="quick-actions-title">Quick Actions</h3>
              <div class="quick-actions-grid">
                <button class="quick-action-btn">➕ New Project</button>
                <button class="quick-action-btn">👥 Invite Team Member</button>
                <button class="quick-action-btn">📊 View Reports</button>
                <button class="quick-action-btn">⚙️ Settings</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  attachEventListeners() {
    const searchInput = this.shadowRoot.querySelector('.search-input');
    const filterSelect = this.shadowRoot.querySelector('.filter-select');

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value;
        this.updateFilteredProjects();
      });
    }

    if (filterSelect) {
      filterSelect.addEventListener('change', (e) => {
        this.filterValue = e.target.value;
        this.updateFilteredProjects();
      });
    }

    // Quick action buttons
    const quickActions = this.shadowRoot.querySelectorAll('.quick-action-btn');
    quickActions.forEach((btn, index) => {
      btn.addEventListener('click', () => {
        const actions = ['new-project', 'invite-member', 'view-reports', 'settings'];
        this.handleQuickAction(actions[index]);
      });
    });
  }

  updateFilteredProjects() {
    let filtered = [...this.projects];

    // Apply status filter
    if (this.filterValue !== 'all') {
      filtered = filtered.filter(project => project.status === this.filterValue);
    }

    // Apply search filter
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(project =>
        project.name.toLowerCase().includes(query)
      );
    }

    this.filteredProjects = filtered;
    this.render();
  }

  handleQuickAction(action) {
    switch (action) {
      case 'new-project':
        console.log('Navigate to new project page');
        // window.location.href = '/projects/new';
        break;
      case 'invite-member':
        console.log('Open invite member modal');
        // this.showInviteModal();
        break;
      case 'view-reports':
        console.log('Navigate to reports page');
        // window.location.href = '/reports';
        break;
      case 'settings':
        console.log('Navigate to settings page');
        // window.location.href = '/settings';
        break;
    }
  }
}

customElements.define('dashboard-page', DashboardPage);