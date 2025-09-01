import { html, css } from 'lit';
import { BaseComponent } from '../base-component.js';

/**
 * Dashboard Quick Actions Component
 * Provides quick access to common user actions and workflows.
 *
 * @element dashboard-quick-actions
 * @description Quick action buttons for common tasks
 */
export class DashboardQuickActions extends BaseComponent {
  static properties = {
    actions: { type: Array },
    isLoading: { type: Boolean },
    user: { type: Object },
  };

  static styles = css`
    :host {
      display: block;
      width: 100%;
    }

    .quick-actions-section {
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

    .actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1rem;
    }

    .action-card {
      background: var(--background-color, #f8fafc);
      border: 1px solid var(--border-color, #e2e8f0);
      border-radius: 0.75rem;
      padding: 1.5rem;
      text-decoration: none;
      color: var(--text-color, #334155);
      transition: all 0.3s ease;
      cursor: pointer;
    }

    .action-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
      border-color: var(--primary-color, #3b82f6);
      background: var(--primary-light, #eff6ff);
    }

    .action-card:active {
      transform: translateY(0);
    }

    .action-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .action-icon {
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

    .action-content {
      flex: 1;
    }

    .action-title {
      font-size: 1.125rem;
      font-weight: 600;
      margin: 0 0 0.5rem 0;
      color: var(--text-color, #334155);
    }

    .action-description {
      font-size: 0.875rem;
      color: var(--text-secondary, #64748b);
      margin: 0;
      line-height: 1.4;
    }

    .action-meta {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: 1rem;
      font-size: 0.75rem;
      color: var(--text-secondary, #64748b);
    }

    .action-badge {
      padding: 0.25rem 0.5rem;
      background: var(--primary-light, #eff6ff);
      color: var(--primary-color, #3b82f6);
      border-radius: 0.5rem;
      font-size: 0.75rem;
      font-weight: 500;
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

    .action-loading {
      height: 120px;
    }

    /* Empty State */
    .empty-state {
      text-align: center;
      padding: 3rem 1rem;
      color: var(--text-secondary, #64748b);
    }

    .empty-state-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
      opacity: 0.5;
    }

    .empty-state-title {
      font-size: 1.125rem;
      font-weight: 600;
      margin: 0 0 0.5rem 0;
      color: var(--text-color, #334155);
    }

    .empty-state-description {
      font-size: 0.875rem;
      margin: 0;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .quick-actions-section {
        padding: 1.5rem;
      }

      .actions-grid {
        grid-template-columns: 1fr;
        gap: 0.75rem;
      }

      .action-card {
        padding: 1rem;
      }

      .action-header {
        gap: 0.75rem;
      }

      .action-icon {
        width: 40px;
        height: 40px;
        font-size: 1.25rem;
      }

      .action-title {
        font-size: 1rem;
      }
    }

    /* Dark Mode Support */
    @media (prefers-color-scheme: dark) {
      .quick-actions-section {
        background: var(--surface-color, #1e293b);
        border: 1px solid var(--border-color, #334155);
      }

      .action-card {
        background: var(--background-color, #0f172a);
        border-color: var(--border-color, #334155);
      }

      .action-card:hover {
        background: var(--hover-color, #1e293b);
      }
    }
  `;

  constructor() {
    super();
    this.actions = [];
    this.isLoading = true;
    this.user = null;
  }

  connectedCallback() {
    super.connectedCallback();
    this._loadActions();
  }

  async _loadActions() {
    try {
      // Load actions based on user context and available features
      this.actions = await this._getAvailableActions();
    } catch (error) {
      console.error('Failed to load quick actions:', error);
      // Use default actions
      this.actions = this._getDefaultActions();
    } finally {
      this.isLoading = false;
    }
  }

  async _getAvailableActions() {
    // This would typically check user permissions and available features
    // For now, return a comprehensive set of actions
    return [
      {
        id: 'create_project',
        title: 'Create New Project',
        description: 'Start a new development project with templates and best practices',
        icon: '🚀',
        category: 'Projects',
        estimatedTime: '5 min',
        priority: 'high'
      },
      {
        id: 'invite_team',
        title: 'Invite Team Members',
        description: 'Add collaborators to your workspace and assign roles',
        icon: '👥',
        category: 'Team',
        estimatedTime: '2 min',
        priority: 'high'
      },
      {
        id: 'view_analytics',
        title: 'View Analytics',
        description: 'Check your project performance and team productivity metrics',
        icon: '📊',
        category: 'Analytics',
        estimatedTime: '3 min',
        priority: 'medium'
      },
      {
        id: 'setup_ci_cd',
        title: 'Setup CI/CD Pipeline',
        description: 'Automate your deployment process with GitHub Actions',
        icon: '⚙️',
        category: 'DevOps',
        estimatedTime: '10 min',
        priority: 'medium'
      },
      {
        id: 'browse_templates',
        title: 'Browse Templates',
        description: 'Explore pre-built project templates and boilerplates',
        icon: '📚',
        category: 'Resources',
        estimatedTime: '5 min',
        priority: 'low'
      },
      {
        id: 'get_support',
        title: 'Get Support',
        description: 'Access documentation, tutorials, and community help',
        icon: '❓',
        category: 'Support',
        estimatedTime: '2 min',
        priority: 'low'
      }
    ];
  }

  _getDefaultActions() {
    return [
      {
        id: 'create_project',
        title: 'Create New Project',
        description: 'Start building something amazing',
        icon: '🚀',
        category: 'Projects',
        estimatedTime: '5 min',
        priority: 'high'
      },
      {
        id: 'invite_team',
        title: 'Invite Team Members',
        description: 'Collaborate with your team',
        icon: '👥',
        category: 'Team',
        estimatedTime: '2 min',
        priority: 'high'
      },
      {
        id: 'view_analytics',
        title: 'View Analytics',
        description: 'Understand your progress',
        icon: '📊',
        category: 'Analytics',
        estimatedTime: '3 min',
        priority: 'medium'
      }
    ];
  }

  _handleActionClick(action) {
    this.dispatchEvent(new CustomEvent('quick-action', {
      detail: { action: action.id },
      bubbles: true,
      composed: true
    }));
  }

  _getPriorityColor(priority) {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  }

  render() {
    return html`
      <section class="quick-actions-section">
        <div class="section-header">
          <div>
            <h2 class="section-title">Quick Actions</h2>
            <p class="section-subtitle">Jump into your most common tasks</p>
          </div>
        </div>

        ${this.isLoading ? html`
          <div class="actions-grid">
            ${Array.from({ length: 6 }).map(() => html`
              <div class="action-card">
                <div class="loading-skeleton action-loading"></div>
              </div>
            `)}
          </div>
        ` : this.actions.length > 0 ? html`
          <div class="actions-grid">
            ${this.actions.map(action => html`
              <div
                class="action-card"
                @click=${() => this._handleActionClick(action)}
                role="button"
                tabindex="0"
                @keydown=${(e) => e.key === 'Enter' && this._handleActionClick(action)}
              >
                <div class="action-header">
                  <div class="action-icon">${action.icon}</div>
                  <div class="action-content">
                    <h3 class="action-title">${action.title}</h3>
                    <p class="action-description">${action.description}</p>
                  </div>
                </div>

                <div class="action-meta">
                  <span class="action-badge" style="background: ${this._getPriorityColor(action.priority)}20; color: ${this._getPriorityColor(action.priority)}">
                    ${action.priority}
                  </span>
                  <span>${action.estimatedTime}</span>
                </div>
              </div>
            `)}
          </div>
        ` : html`
          <div class="empty-state">
            <div class="empty-state-icon">⚡</div>
            <h3 class="empty-state-title">No Quick Actions Available</h3>
            <p class="empty-state-description">Check back later for personalized quick actions based on your workspace.</p>
          </div>
        `}
      </section>
    `;
  }
}

customElements.define('dashboard-quick-actions', DashboardQuickActions);