import { html, css } from 'lit';
import { BaseComponent } from '../base-component.js';
import { apiService } from '../../services/api.js';

/**
 * Project Onboarding Component
 * Guides users through creating their first project with templates and best practices.
 *
 * @element project-onboarding
 * @description Step-by-step project creation workflow
 */
export class ProjectOnboarding extends BaseComponent {
  static properties = {
    currentStep: { type: Number },
    projectData: { type: Object },
    templates: { type: Array },
    isLoading: { type: Boolean },
    isCreating: { type: Boolean },
  };

  static styles = css`
    :host {
      display: block;
      width: 100%;
    }

    .onboarding-section {
      background: var(--surface-color, #ffffff);
      border-radius: 1rem;
      padding: 2rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      margin-bottom: 2rem;
    }

    .section-header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .section-title {
      font-size: 2rem;
      font-weight: 700;
      color: var(--text-color, #334155);
      margin: 0 0 0.5rem 0;
    }

    .section-subtitle {
      font-size: 1.125rem;
      color: var(--text-secondary, #64748b);
      margin: 0;
    }

    /* Progress Steps */
    .progress-container {
      display: flex;
      justify-content: center;
      margin-bottom: 3rem;
      position: relative;
    }

    .progress-line {
      position: absolute;
      top: 20px;
      left: 0;
      right: 0;
      height: 2px;
      background: var(--border-color, #e2e8f0);
      z-index: 1;
    }

    .progress-fill {
      height: 100%;
      background: var(--primary-color, #3b82f6);
      transition: width 0.3s ease;
    }

    .steps-container {
      display: flex;
      justify-content: space-between;
      position: relative;
      z-index: 2;
      max-width: 600px;
      width: 100%;
    }

    .step {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
    }

    .step-circle {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: var(--background-color, #f8fafc);
      border: 2px solid var(--border-color, #e2e8f0);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      color: var(--text-secondary, #64748b);
      transition: all 0.3s ease;
    }

    .step.active .step-circle {
      background: var(--primary-color, #3b82f6);
      border-color: var(--primary-color, #3b82f6);
      color: white;
    }

    .step.completed .step-circle {
      background: var(--success-color, #10b981);
      border-color: var(--success-color, #10b981);
      color: white;
    }

    .step-label {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--text-secondary, #64748b);
      text-align: center;
    }

    .step.active .step-label {
      color: var(--primary-color, #3b82f6);
    }

    .step.completed .step-label {
      color: var(--success-color, #10b981);
    }

    /* Step Content */
    .step-content {
      min-height: 300px;
    }

    .step-form {
      max-width: 500px;
      margin: 0 auto;
    }

    .form-group {
      margin-bottom: 1.5rem;
    }

    .form-label {
      display: block;
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-color, #334155);
      margin-bottom: 0.5rem;
    }

    .form-input {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid var(--border-color, #e2e8f0);
      border-radius: 0.5rem;
      font-size: 1rem;
      transition: border-color 0.2s;
    }

    .form-input:focus {
      outline: none;
      border-color: var(--primary-color, #3b82f6);
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .form-textarea {
      resize: vertical;
      min-height: 100px;
    }

    /* Template Selection */
    .templates-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .template-card {
      border: 2px solid var(--border-color, #e2e8f0);
      border-radius: 0.75rem;
      padding: 1.5rem;
      cursor: pointer;
      transition: all 0.3s ease;
      background: var(--background-color, #f8fafc);
    }

    .template-card:hover {
      border-color: var(--primary-color, #3b82f6);
      background: var(--primary-light, #eff6ff);
    }

    .template-card.selected {
      border-color: var(--primary-color, #3b82f6);
      background: var(--primary-light, #eff6ff);
    }

    .template-icon {
      font-size: 2rem;
      margin-bottom: 1rem;
    }

    .template-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--text-color, #334155);
      margin: 0 0 0.5rem 0;
    }

    .template-description {
      font-size: 0.875rem;
      color: var(--text-secondary, #64748b);
      margin: 0;
    }

    /* Navigation */
    .step-navigation {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 2rem;
      padding-top: 2rem;
      border-top: 1px solid var(--border-color, #e2e8f0);
    }

    .nav-button {
      padding: 0.75rem 1.5rem;
      border: 1px solid var(--border-color, #e2e8f0);
      background: var(--background-color, #f8fafc);
      border-radius: 0.5rem;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .nav-button:hover:not(:disabled) {
      background: var(--hover-color, #f1f5f9);
    }

    .nav-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .nav-button.primary {
      background: var(--primary-color, #3b82f6);
      color: white;
      border-color: var(--primary-color, #3b82f6);
    }

    .nav-button.primary:hover:not(:disabled) {
      background: var(--primary-dark, #2563eb);
    }

    /* Success State */
    .success-state {
      text-align: center;
      padding: 3rem 1rem;
    }

    .success-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
    }

    .success-title {
      font-size: 2rem;
      font-weight: 700;
      color: var(--success-color, #10b981);
      margin: 0 0 1rem 0;
    }

    .success-message {
      font-size: 1.125rem;
      color: var(--text-color, #334155);
      margin: 0 0 2rem 0;
    }

    /* Loading States */
    .loading-spinner {
      display: inline-block;
      width: 20px;
      height: 20px;
      border: 2px solid var(--border-color, #e2e8f0);
      border-radius: 50%;
      border-top-color: var(--primary-color, #3b82f6);
      animation: spin 1s ease-in-out infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .onboarding-section {
        padding: 1.5rem;
      }

      .section-title {
        font-size: 1.5rem;
      }

      .steps-container {
        flex-direction: column;
        gap: 2rem;
      }

      .progress-line {
        display: none;
      }

      .templates-grid {
        grid-template-columns: 1fr;
      }

      .step-navigation {
        flex-direction: column;
        gap: 1rem;
      }

      .nav-button {
        width: 100%;
      }
    }

    /* Dark Mode Support */
    @media (prefers-color-scheme: dark) {
      .onboarding-section {
        background: var(--surface-color, #1e293b);
        border: 1px solid var(--border-color, #334155);
      }

      .template-card {
        background: var(--background-color, #0f172a);
        border-color: var(--border-color, #334155);
      }

      .template-card:hover,
      .template-card.selected {
        background: var(--primary-light, #1e40af);
      }
    }
  `;

  constructor() {
    super();
    this.currentStep = 1;
    this.projectData = {
      name: '',
      description: '',
      template: null,
      category: '',
      visibility: 'private'
    };
    this.templates = [];
    this.isLoading = false;
    this.isCreating = false;
  }

  connectedCallback() {
    super.connectedCallback();
    this._loadTemplates();
  }

  async _loadTemplates() {
    try {
      // Load project templates - this would come from an API
      this.templates = [
        {
          id: 'web-app',
          name: 'Web Application',
          description: 'Modern web app with React/Vue/Angular setup',
          icon: '🌐',
          category: 'Frontend'
        },
        {
          id: 'api-service',
          name: 'API Service',
          description: 'REST API with FastAPI or Express',
          icon: '🔌',
          category: 'Backend'
        },
        {
          id: 'full-stack',
          name: 'Full Stack App',
          description: 'Complete application with frontend and backend',
          icon: '🚀',
          category: 'Full Stack'
        },
        {
          id: 'mobile-app',
          name: 'Mobile App',
          description: 'React Native or Flutter mobile application',
          icon: '📱',
          category: 'Mobile'
        },
        {
          id: 'data-science',
          name: 'Data Science',
          description: 'Python data analysis and ML projects',
          icon: '📊',
          category: 'Data Science'
        },
        {
          id: 'blank',
          name: 'Blank Project',
          description: 'Start with a clean slate',
          icon: '📝',
          category: 'General'
        }
      ];
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  }

  _selectTemplate(template) {
    this.projectData = {
      ...this.projectData,
      template: template.id,
      category: template.category
    };
    this.requestUpdate();
  }

  _updateProjectData(field, value) {
    this.projectData = {
      ...this.projectData,
      [field]: value
    };
    this.requestUpdate();
  }

  _canProceedToNext() {
    switch (this.currentStep) {
      case 1:
        return this.projectData.template !== null;
      case 2:
        return this.projectData.name.trim().length > 0;
      case 3:
        return this.projectData.description.trim().length > 0;
      default:
        return true;
    }
  }

  _goToPrevious() {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  _goToNext() {
    if (this.currentStep < 4 && this._canProceedToNext()) {
      this.currentStep++;
    }
  }

  async _createProject() {
    if (!this._canProceedToNext()) return;

    this.isCreating = true;
    try {
      const projectData = {
        ...this.projectData,
        status: 'active',
        created_at: new Date().toISOString()
      };

      const response = await apiService.request('/projects', {
        method: 'POST',
        body: JSON.stringify(projectData)
      });

      // Emit success event
      this.dispatchEvent(new CustomEvent('project-created', {
        detail: { project: response },
        bubbles: true,
        composed: true
      }));

      this.currentStep = 5; // Success step

    } catch (error) {
      console.error('Failed to create project:', error);
      // Handle error - could show error message
    } finally {
      this.isCreating = false;
    }
  }

  _renderStepContent() {
    switch (this.currentStep) {
      case 1:
        return this._renderTemplateSelection();
      case 2:
        return this._renderProjectDetails();
      case 3:
        return this._renderProjectSettings();
      case 4:
        return this._renderReviewAndCreate();
      case 5:
        return this._renderSuccess();
      default:
        return html`<p>Invalid step</p>`;
    }
  }

  _renderTemplateSelection() {
    return html`
      <div class="step-content">
        <div class="step-form">
          <div class="form-group">
            <label class="form-label">Choose a Project Template</label>
            <p style="color: var(--text-secondary); margin-bottom: 1rem;">
              Select a template to get started quickly with best practices and structure.
            </p>

            <div class="templates-grid">
              ${this.templates.map(template => html`
                <div
                  class="template-card ${this.projectData.template === template.id ? 'selected' : ''}"
                  @click=${() => this._selectTemplate(template)}
                >
                  <div class="template-icon">${template.icon}</div>
                  <h3 class="template-title">${template.name}</h3>
                  <p class="template-description">${template.description}</p>
                </div>
              `)}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  _renderProjectDetails() {
    return html`
      <div class="step-content">
        <div class="step-form">
          <div class="form-group">
            <label class="form-label">Project Name</label>
            <input
              type="text"
              class="form-input"
              placeholder="Enter your project name"
              .value=${this.projectData.name}
              @input=${(e) => this._updateProjectData('name', e.target.value)}
            >
          </div>

          <div class="form-group">
            <label class="form-label">Project Description</label>
            <textarea
              class="form-input form-textarea"
              placeholder="Describe your project..."
              .value=${this.projectData.description}
              @input=${(e) => this._updateProjectData('description', e.target.value)}
            ></textarea>
          </div>
        </div>
      </div>
    `;
  }

  _renderProjectSettings() {
    return html`
      <div class="step-content">
        <div class="step-form">
          <div class="form-group">
            <label class="form-label">Project Visibility</label>
            <select
              class="form-input"
              .value=${this.projectData.visibility}
              @change=${(e) => this._updateProjectData('visibility', e.target.value)}
            >
              <option value="private">Private - Only team members can access</option>
              <option value="team">Team - Organization members can view</option>
              <option value="public">Public - Anyone can view</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Category</label>
            <input
              type="text"
              class="form-input"
              placeholder="e.g., Web Development, Data Science"
              .value=${this.projectData.category}
              @input=${(e) => this._updateProjectData('category', e.target.value)}
            >
          </div>
        </div>
      </div>
    `;
  }

  _renderReviewAndCreate() {
    const selectedTemplate = this.templates.find(t => t.id === this.projectData.template);

    return html`
      <div class="step-content">
        <div class="step-form">
          <h3 style="text-align: center; margin-bottom: 2rem;">Review Your Project</h3>

          <div style="background: var(--background-color, #f8fafc); padding: 1.5rem; border-radius: 0.5rem; margin-bottom: 2rem;">
            <h4 style="margin: 0 0 1rem 0;">Project Details</h4>
            <p><strong>Name:</strong> ${this.projectData.name}</p>
            <p><strong>Description:</strong> ${this.projectData.description}</p>
            <p><strong>Template:</strong> ${selectedTemplate?.name || 'None'}</p>
            <p><strong>Category:</strong> ${this.projectData.category || 'General'}</p>
            <p><strong>Visibility:</strong> ${this.projectData.visibility}</p>
          </div>

          <p style="text-align: center; color: var(--text-secondary);">
            Click "Create Project" to set up your workspace and get started!
          </p>
        </div>
      </div>
    `;
  }

  _renderSuccess() {
    return html`
      <div class="success-state">
        <div class="success-icon">🎉</div>
        <h2 class="success-title">Project Created Successfully!</h2>
        <p class="success-message">
          Your project "${this.projectData.name}" has been created and is ready to use.
        </p>
        <button
          class="nav-button primary"
          @click=${() => this.dispatchEvent(new CustomEvent('onboarding-complete', {
            bubbles: true,
            composed: true
          }))}
        >
          Go to Project
        </button>
      </div>
    `;
  }

  render() {
    const steps = [
      { number: 1, label: 'Choose Template' },
      { number: 2, label: 'Project Details' },
      { number: 3, label: 'Settings' },
      { number: 4, label: 'Create' }
    ];

    const progressWidth = ((this.currentStep - 1) / 3) * 100;

    return html`
      <section class="onboarding-section">
        <div class="section-header">
          <h1 class="section-title">Create Your First Project</h1>
          <p class="section-subtitle">Let's get you set up with a new project in just a few steps</p>
        </div>

        ${this.currentStep < 5 ? html`
          <div class="progress-container">
            <div class="progress-line">
              <div class="progress-fill" style="width: ${progressWidth}%"></div>
            </div>
            <div class="steps-container">
              ${steps.map(step => html`
                <div class="step ${this.currentStep === step.number ? 'active' : this.currentStep > step.number ? 'completed' : ''}">
                  <div class="step-circle">
                    ${this.currentStep > step.number ? '✓' : step.number}
                  </div>
                  <span class="step-label">${step.label}</span>
                </div>
              `)}
            </div>
          </div>
        ` : ''}

        ${this._renderStepContent()}

        ${this.currentStep < 5 ? html`
          <div class="step-navigation">
            <button
              class="nav-button"
              ?disabled=${this.currentStep === 1}
              @click=${this._goToPrevious}
            >
              Previous
            </button>

            <span style="color: var(--text-secondary); font-size: 0.875rem;">
              Step ${this.currentStep} of 4
            </span>

            ${this.currentStep < 4 ? html`
              <button
                class="nav-button primary"
                ?disabled=${!this._canProceedToNext()}
                @click=${this._goToNext}
              >
                Next
              </button>
            ` : html`
              <button
                class="nav-button primary"
                ?disabled=${this.isCreating}
                @click=${this._createProject}
              >
                ${this.isCreating ? html`<span class="loading-spinner"></span>` : 'Create Project'}
              </button>
            `}
          </div>
        ` : ''}
      </section>
    `;
  }
}

customElements.define('project-onboarding', ProjectOnboarding);