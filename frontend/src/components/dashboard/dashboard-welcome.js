import { html, css } from 'lit';
import { BaseComponent } from '../base-component.js';
import { apiService } from '../../services/api.js';

/**
 * Dashboard Welcome Component
 * Provides a personalized welcome section with quick actions and user context.
 *
 * @element dashboard-welcome
 * @description Welcome section with user greeting and quick actions
 */
export class DashboardWelcome extends BaseComponent {
  static properties = {
    user: { type: Object },
    isLoading: { type: Boolean },
    quickActions: { type: Array },
    recentActivity: { type: Array },
    greeting: { type: String },
  };

  static styles = css`
    :host {
      display: block;
      width: 100%;
    }

    .welcome-section {
      background: linear-gradient(135deg, var(--primary-color, #3b82f6) 0%, var(--primary-dark, #1e40af) 100%);
      border-radius: 1rem;
      padding: 2rem;
      color: white;
      margin-bottom: 2rem;
      position: relative;
      overflow: hidden;
    }

    .welcome-section::before {
      content: '';
      position: absolute;
      top: 0;
      right: 0;
      width: 200px;
      height: 200px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 50%;
      transform: translate(50%, -50%);
    }

    .welcome-content {
      position: relative;
      z-index: 1;
    }

    .greeting {
      font-size: 2rem;
      font-weight: 700;
      margin: 0 0 0.5rem 0;
      line-height: 1.2;
    }

    .subtitle {
      font-size: 1.125rem;
      opacity: 0.9;
      margin: 0 0 2rem 0;
      font-weight: 400;
    }

    .quick-actions {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-top: 2rem;
    }

    .action-card {
      background: rgba(255, 255, 255, 0.15);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 0.75rem;
      padding: 1.5rem;
      text-decoration: none;
      color: white;
      transition: all 0.3s ease;
      backdrop-filter: blur(10px);
    }

    .action-card:hover {
      background: rgba(255, 255, 255, 0.25);
      transform: translateY(-2px);
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
    }

    .action-icon {
      font-size: 2rem;
      margin-bottom: 1rem;
      display: block;
    }

    .action-title {
      font-size: 1.125rem;
      font-weight: 600;
      margin: 0 0 0.5rem 0;
    }

    .action-description {
      font-size: 0.875rem;
      opacity: 0.8;
      margin: 0;
      line-height: 1.4;
    }

    /* Recent Activity Section */
    .recent-activity {
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
      margin-bottom: 1.5rem;
    }

    .section-title {
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--text-color, #334155);
      margin: 0;
    }

    .section-subtitle {
      font-size: 0.875rem;
      color: var(--text-secondary, #64748b);
      margin: 0;
    }

    .activity-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .activity-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: var(--background-color, #f8fafc);
      border-radius: 0.5rem;
      transition: background-color 0.2s;
    }

    .activity-item:hover {
      background: var(--hover-color, #f1f5f9);
    }

    .activity-icon {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: var(--primary-light, #eff6ff);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--primary-color, #3b82f6);
      font-size: 1.125rem;
    }

    .activity-content {
      flex: 1;
    }

    .activity-title {
      font-weight: 600;
      color: var(--text-color, #334155);
      margin: 0 0 0.25rem 0;
      font-size: 0.875rem;
    }

    .activity-description {
      color: var(--text-secondary, #64748b);
      margin: 0;
      font-size: 0.75rem;
    }

    .activity-time {
      color: var(--text-secondary, #64748b);
      font-size: 0.75rem;
      white-space: nowrap;
    }

    /* Loading States */
    .loading-skeleton {
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: loading 1.5s infinite;
      border-radius: 0.5rem;
    }

    @keyframes loading {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    .welcome-loading {
      height: 200px;
    }

    .activity-loading {
      height: 60px;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .welcome-section {
        padding: 1.5rem;
        margin-bottom: 1.5rem;
      }

      .greeting {
        font-size: 1.5rem;
      }

      .subtitle {
        font-size: 1rem;
        margin-bottom: 1.5rem;
      }

      .quick-actions {
        grid-template-columns: 1fr;
        gap: 0.75rem;
      }

      .action-card {
        padding: 1rem;
      }

      .action-icon {
        font-size: 1.5rem;
        margin-bottom: 0.75rem;
      }

      .action-title {
        font-size: 1rem;
      }

      .recent-activity {
        padding: 1.5rem;
        margin-bottom: 1.5rem;
      }

      .section-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
      }

      .activity-item {
        padding: 1rem 0.75rem;
      }

      .activity-content {
        margin-left: 0.75rem;
      }
    }

    /* Extra small screens */
    @media (max-width: 480px) {
      .welcome-section {
        padding: 1rem;
      }

      .greeting {
        font-size: 1.25rem;
      }

      .recent-activity {
        padding: 1rem;
      }

      .activity-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
      }

      .activity-content {
        margin-left: 0;
      }
    }

    /* Dark Mode Support */
    @media (prefers-color-scheme: dark) {
      .recent-activity {
        background: var(--surface-color, #1e293b);
        border: 1px solid var(--border-color, #334155);
      }

      .activity-item {
        background: var(--background-color, #0f172a);
      }

      .activity-item:hover {
        background: var(--hover-color, #1e293b);
      }
    }
  `;

  constructor() {
    super();
    this.user = null;
    this.isLoading = true;
    this.quickActions = [];
    this.recentActivity = [];
    this.greeting = this._getGreeting();
  }

  connectedCallback() {
    super.connectedCallback();
    this._loadUserData();
    this._loadRecentActivity();
    this._setupQuickActions();
  }

  async _loadUserData() {
    try {
      this.user = await apiService.request('/auth/me');
    } catch (error) {
      console.error('Failed to load user data:', error);
      // Use fallback user data
      this.user = {
        name: 'Developer',
        role: 'Team Member'
      };
    } finally {
      this.isLoading = false;
    }
  }

  async _loadRecentActivity() {
    try {
      // Try to load real activity data from various endpoints
      const [projectsResponse, userResponse] = await Promise.all([
        apiService.request('/projects').catch(() => ({ data: [] })),
        apiService.request('/auth/me').catch(() => ({}))
      ]);

      const projects = projectsResponse.data || [];

      // Generate activity based on real data
      const activities = [];

      // Add recent projects
      const recentProjects = projects.slice(0, 2);
      recentProjects.forEach((project, index) => {
        activities.push({
          id: `project_${project.id || index}`,
          type: 'project_created',
          title: 'Project created',
          description: `You created "${project.name || project.title || 'New Project'}"`,
          time: this._getRelativeTime(project.created_at || new Date()),
          icon: '📁'
        });
      });

      // Add some contextual activities based on user data
      if (this.user?.name) {
        activities.push({
          id: 'welcome_activity',
          type: 'user_joined',
          title: 'Welcome to NeoForge!',
          description: `${this.user.name} joined the platform`,
          time: '1 day ago',
          icon: '🎉'
        });
      }

      // Add system activity
      activities.push({
        id: 'system_activity',
        type: 'system_update',
        title: 'System updated',
        description: 'NeoForge received performance improvements',
        time: '3 days ago',
        icon: '⚡'
      });

      this.recentActivity = activities.slice(0, 4); // Limit to 4 items

    } catch (error) {
      console.error('Failed to load recent activity:', error);
      // Use fallback data
      this._loadFallbackActivity();
    }
  }

  _loadFallbackActivity() {
    this.recentActivity = [
      {
        id: 1,
        type: 'getting_started',
        title: 'Getting started',
        description: 'Welcome to your NeoForge dashboard!',
        time: 'Just now',
        icon: '🚀'
      },
      {
        id: 2,
        type: 'tip',
        title: 'Pro tip',
        description: 'Create your first project to get started',
        time: '1 minute ago',
        icon: '💡'
      }
    ];
  }

  _getRelativeTime(dateString) {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

      if (diffInHours < 1) return 'Just now';
      if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;

      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    } catch (error) {
      return 'Recently';
    }
  }

  _setupQuickActions() {
    this.quickActions = [
      {
        id: 'create_project',
        title: 'Create Project',
        description: 'Start a new development project',
        icon: '🚀',
        action: () => this._handleQuickAction('create_project')
      },
      {
        id: 'invite_team',
        title: 'Invite Team',
        description: 'Add members to your workspace',
        icon: '👥',
        action: () => this._handleQuickAction('invite_team')
      },
      {
        id: 'view_analytics',
        title: 'View Analytics',
        description: 'Check your project insights',
        icon: '📊',
        action: () => this._handleQuickAction('view_analytics')
      },
      {
        id: 'get_help',
        title: 'Get Help',
        description: 'Browse documentation and guides',
        icon: '❓',
        action: () => this._handleQuickAction('get_help')
      }
    ];
  }

  _getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }

  _handleQuickAction(actionId) {
    this.dispatchEvent(new CustomEvent('quick-action', {
      detail: { action: actionId },
      bubbles: true,
      composed: true
    }));
  }

  _formatTimeAgo(timeString) {
    // Simple time formatting - could be enhanced with a proper library
    return timeString;
  }

  render() {
    return html`
      <!-- Welcome Section -->
      <section class="welcome-section">
        <div class="welcome-content">
          <h1 class="greeting">
            ${this.isLoading ? 'Loading...' : `${this.greeting}${this.user?.name ? `, ${this.user.name.split(' ')[0]}` : ''}!`}
          </h1>
          <p class="subtitle">
            Ready to build something amazing? Here's what's happening in your workspace.
          </p>

          <div class="quick-actions">
            ${this.quickActions.map(action => html`
              <a
                href="#"
                class="action-card"
                @click=${(e) => { e.preventDefault(); action.action(); }}
              >
                <span class="action-icon">${action.icon}</span>
                <h3 class="action-title">${action.title}</h3>
                <p class="action-description">${action.description}</p>
              </a>
            `)}
          </div>
        </div>
      </section>

      <!-- Recent Activity Section -->
      <section class="recent-activity">
        <div class="section-header">
          <div>
            <h2 class="section-title">Recent Activity</h2>
            <p class="section-subtitle">Stay updated with your team's progress</p>
          </div>
        </div>

        <div class="activity-list">
          ${this.isLoading ? html`
            ${Array.from({ length: 3 }).map(() => html`
              <div class="activity-item">
                <div class="activity-icon loading-skeleton"></div>
                <div class="activity-content">
                  <div class="activity-title loading-skeleton" style="height: 16px; width: 60%;"></div>
                  <div class="activity-description loading-skeleton" style="height: 12px; width: 80%; margin-top: 4px;"></div>
                </div>
                <div class="activity-time loading-skeleton" style="height: 12px; width: 40px;"></div>
              </div>
            `)}
          ` : html`
            ${this.recentActivity.map(activity => html`
              <div class="activity-item">
                <div class="activity-icon">${activity.icon}</div>
                <div class="activity-content">
                  <h4 class="activity-title">${activity.title}</h4>
                  <p class="activity-description">${activity.description}</p>
                </div>
                <span class="activity-time">${this._formatTimeAgo(activity.time)}</span>
              </div>
            `)}
          `}
        </div>
      </section>
    `;
  }
}

customElements.define('dashboard-welcome', DashboardWelcome);