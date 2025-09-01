import {   html, css   } from 'lit';
import { BaseComponent } from "../components/base-component.js";
import './components/dashboard/dashboard-layout.js';
import './components/dashboard/dashboard-welcome.js';
import './components/dashboard/dashboard-metrics.js';
import './components/dashboard/dashboard-quick-actions.js';
import './components/dashboard/project-onboarding.js';
import './components/dashboard/projects-list.js';

/**
 * Dashboard page component
 * @element dashboard-page
 * @description Main dashboard with layout, welcome section, and key metrics
 */
export class DashboardPage extends BaseComponent {
  static properties = {
    currentView: { type: String },
    isLoading: { type: Boolean },
    user: { type: Object },
  };

  static styles = css`
    :host {
      display: block;
      height: 100vh;
      width: 100%;
    }

    .dashboard-content {
      padding: 0;
    }

    .overview-content {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    /* Mobile responsive adjustments */
    @media (max-width: 768px) {
      .dashboard-content {
        padding: 0;
      }

      .overview-content {
        gap: 1.5rem;
      }
    }

    /* Touch-friendly interactions */
    .touch-target {
      min-height: 44px;
      min-width: 44px;
    }

    /* Improved mobile scrolling */
    .mobile-scroll {
      -webkit-overflow-scrolling: touch;
      overflow-y: auto;
    }

    /* Better mobile text sizing */
    @media (max-width: 768px) {
      .overview-content > * {
        margin-bottom: 1.5rem;
      }
    }
  `;

  constructor() {
    super();
    this.currentView = 'overview';
    this.isLoading = true;
    this.user = null;
  }

  connectedCallback() {
    super.connectedCallback();
    this._loadUserData();
  }

  async _loadUserData() {
    try {
      // Try to load user data from API
      const userData = await this.fetchData('/auth/me');
      this.user = userData;
    } catch (error) {
      console.error('Failed to load user data:', error);
      // Use fallback user data
      this.user = {
        name: 'Developer',
        email: 'developer@example.com',
        role: 'Team Member'
      };
    } finally {
      this.isLoading = false;
    }
  }

  _handleNavigation(event) {
    this.currentView = event.detail.view;
    this.requestUpdate();
  }

  _handleQuickAction(event) {
    const action = event.detail.action;
    console.log('Quick action triggered:', action);

    // Handle different quick actions
    switch (action) {
      case 'create_project':
        this._showProjectOnboarding();
        break;
      case 'invite_team':
        this._navigateToTeam();
        break;
      case 'view_analytics':
        this._navigateToAnalytics();
        break;
      case 'get_help':
        this._navigateToHelp();
        break;
    }
  }

  _showProjectOnboarding() {
    this.currentView = 'onboarding';
    this.requestUpdate();
  }

  _handleProjectCreated(event) {
    console.log('Project created:', event.detail.project);
    // Refresh projects and go back to overview
    this.currentView = 'overview';
    this.requestUpdate();
  }

  _handleOnboardingComplete() {
    this.currentView = 'overview';
    this.requestUpdate();
  }

  _handleProjectSelected(event) {
    console.log('Project selected:', event.detail.project);
    // Navigate to project detail view (could be implemented later)
  }

  _handleCreateProject() {
    this._showProjectOnboarding();
  }

  _navigateToProjects() {
    this.currentView = 'projects';
    this.dispatchEvent(new CustomEvent('dashboard-navigate', {
      detail: { view: 'projects' },
      bubbles: true,
      composed: true
    }));
  }

  _navigateToTeam() {
    this.currentView = 'team';
    this.dispatchEvent(new CustomEvent('dashboard-navigate', {
      detail: { view: 'team' },
      bubbles: true,
      composed: true
    }));
  }

  _navigateToAnalytics() {
    this.currentView = 'analytics';
    this.dispatchEvent(new CustomEvent('dashboard-navigate', {
      detail: { view: 'analytics' },
      bubbles: true,
      composed: true
    }));
  }

  _navigateToHelp() {
    this.currentView = 'community';
    this.dispatchEvent(new CustomEvent('dashboard-navigate', {
      detail: { view: 'community' },
      bubbles: true,
      composed: true
    }));
  }

  render() {
    return html`
      <dashboard-layout
        .currentView=${this.currentView}
        @dashboard-navigate=${this._handleNavigation}
      >
        <div class="dashboard-content">
          ${this.currentView === 'overview' ? html`
            <div class="overview-content">
              <dashboard-welcome
                .user=${this.user}
                @quick-action=${this._handleQuickAction}
              ></dashboard-welcome>

              <dashboard-metrics
                .user=${this.user}
              ></dashboard-metrics>

              <dashboard-quick-actions
                .user=${this.user}
                @quick-action=${this._handleQuickAction}
              ></dashboard-quick-actions>

              <projects-list
                @project-selected=${this._handleProjectSelected}
                @create-project=${this._handleCreateProject}
              ></projects-list>
            </div>
          ` : this.currentView === 'onboarding' ? html`
            <project-onboarding
              @project-created=${this._handleProjectCreated}
              @onboarding-complete=${this._handleOnboardingComplete}
            ></project-onboarding>
          ` : html`
            <div class="placeholder-content">
              <h2>${this.currentView.charAt(0).toUpperCase() + this.currentView.slice(1)} Section</h2>
              <p>This section is under development. Check back soon!</p>
            </div>
          `}
        </div>
      </dashboard-layout>
    `;
  }
}
