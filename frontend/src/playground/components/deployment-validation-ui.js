/**
 * Deployment Validation UI Component
 * 
 * Provides real-time visual feedback for deployment validation process
 * with step-by-step progress, detailed results, and actionable feedback.
 */
import { LitElement, html, css } from 'lit';

export class DeploymentValidationUI extends LitElement {
  static properties = {
    validationState: { type: String },
    validationId: { type: String },
    currentPhase: { type: String },
    results: { type: Object },
    error: { type: String },
    deploymentConfig: { type: Object }
  };

  static styles = css`
    :host {
      display: block;
      font-family: system-ui, -apple-system, sans-serif;
      line-height: 1.5;
    }

    .validation-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 1rem;
    }

    .validation-header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .validation-header h2 {
      color: #1a202c;
      margin-bottom: 0.5rem;
    }

    .validation-header .subtitle {
      color: #666;
      font-size: 0.95rem;
    }

    .validation-progress {
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      padding: 1.5rem;
      margin-bottom: 2rem;
    }

    .progress-bar {
      width: 100%;
      height: 8px;
      background: #e5e7eb;
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: 1rem;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #3b82f6, #1d4ed8);
      border-radius: 4px;
      transition: width 0.3s ease;
      position: relative;
    }

    .progress-fill.error {
      background: linear-gradient(90deg, #ef4444, #dc2626);
    }

    .progress-fill.warning {
      background: linear-gradient(90deg, #f59e0b, #d97706);
    }

    .progress-fill.success {
      background: linear-gradient(90deg, #10b981, #059669);
    }

    .progress-fill::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(
        90deg,
        transparent,
        rgba(255, 255, 255, 0.3),
        transparent
      );
      animation: shimmer 2s infinite;
    }

    @keyframes shimmer {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }

    .validation-phases {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .phase {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 1rem;
      transition: all 0.3s ease;
      position: relative;
    }

    .phase.active {
      background: #eff6ff;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .phase.passed {
      background: #f0fdf4;
      border-color: #10b981;
    }

    .phase.failed {
      background: #fef2f2;
      border-color: #ef4444;
    }

    .phase.warning {
      background: #fffbeb;
      border-color: #f59e0b;
    }

    .phase-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.5rem;
    }

    .phase-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 600;
      font-size: 0.95rem;
    }

    .phase-icon {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: bold;
      color: white;
    }

    .phase-icon.pending {
      background: #94a3b8;
    }

    .phase-icon.running {
      background: #3b82f6;
      animation: pulse 2s infinite;
    }

    .phase-icon.passed {
      background: #10b981;
    }

    .phase-icon.failed {
      background: #ef4444;
    }

    .phase-icon.warning {
      background: #f59e0b;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }

    .phase-status {
      font-size: 0.875rem;
      font-weight: 500;
    }

    .phase-status.running {
      color: #3b82f6;
    }

    .phase-status.passed {
      color: #10b981;
    }

    .phase-status.failed {
      color: #ef4444;
    }

    .phase-status.warning {
      color: #f59e0b;
    }

    .phase-details {
      margin-top: 0.75rem;
      font-size: 0.875rem;
      color: #64748b;
    }

    .phase-checks {
      margin-top: 0.75rem;
    }

    .check-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.25rem 0;
      font-size: 0.875rem;
    }

    .check-icon {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      color: white;
      flex-shrink: 0;
    }

    .check-icon.passed {
      background: #10b981;
    }

    .check-icon.failed {
      background: #ef4444;
    }

    .validation-summary {
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      padding: 1.5rem;
      margin-top: 2rem;
    }

    .summary-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .summary-icon {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      color: white;
    }

    .summary-icon.success {
      background: #10b981;
    }

    .summary-icon.error {
      background: #ef4444;
    }

    .summary-icon.warning {
      background: #f59e0b;
    }

    .summary-title {
      font-size: 1.25rem;
      font-weight: 700;
      margin: 0;
    }

    .summary-subtitle {
      color: #64748b;
      margin: 0;
    }

    .summary-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 1rem;
      margin: 1rem 0;
    }

    .stat {
      text-align: center;
      padding: 0.75rem;
      background: #f8fafc;
      border-radius: 6px;
    }

    .stat-value {
      font-size: 1.5rem;
      font-weight: 700;
      margin: 0;
    }

    .stat-label {
      font-size: 0.75rem;
      color: #64748b;
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .recommendations {
      margin-top: 1.5rem;
    }

    .recommendations h4 {
      margin: 0 0 0.75rem 0;
      font-size: 1rem;
      font-weight: 600;
    }

    .recommendation-list {
      list-style: none;
      margin: 0;
      padding: 0;
    }

    .recommendation-item {
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
      padding: 0.5rem 0;
      border-bottom: 1px solid #e2e8f0;
    }

    .recommendation-item:last-child {
      border-bottom: none;
    }

    .recommendation-icon {
      width: 20px;
      height: 20px;
      border-radius: 4px;
      background: #3b82f6;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      margin-top: 2px;
      flex-shrink: 0;
    }

    .recommendation-icon.warning {
      background: #f59e0b;
    }

    .recommendation-icon.error {
      background: #ef4444;
    }

    .recommendation-text {
      font-size: 0.875rem;
      color: #374151;
    }

    .actions {
      margin-top: 2rem;
      text-align: center;
    }

    .action-button {
      background: #3b82f6;
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 6px;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      margin: 0 0.5rem;
      transition: background-color 0.2s;
    }

    .action-button:hover {
      background: #1d4ed8;
    }

    .action-button.secondary {
      background: #6b7280;
    }

    .action-button.secondary:hover {
      background: #4b5563;
    }

    .loading {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 3rem;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #e2e8f0;
      border-left: 4px solid #3b82f6;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .error-state {
      text-align: center;
      padding: 2rem;
      color: #ef4444;
    }

    .error-state h3 {
      margin-bottom: 0.5rem;
    }

    .collapsible {
      cursor: pointer;
      user-select: none;
    }

    .collapsible::after {
      content: '▼';
      float: right;
      transition: transform 0.3s ease;
    }

    .collapsible.collapsed::after {
      transform: rotate(-90deg);
    }

    .collapsible-content {
      max-height: 1000px;
      overflow: hidden;
      transition: max-height 0.3s ease;
    }

    .collapsible-content.collapsed {
      max-height: 0;
    }

    .url-display {
      font-family: monospace;
      background: #f1f5f9;
      padding: 0.5rem;
      border-radius: 4px;
      border: 1px solid #e2e8f0;
      font-size: 0.875rem;
      margin: 0.5rem 0;
    }

    @media (max-width: 768px) {
      .validation-container {
        padding: 0.5rem;
      }

      .summary-stats {
        grid-template-columns: repeat(2, 1fr);
      }

      .phase-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
      }
    }
  `;

  constructor() {
    super();
    this.validationState = 'idle'; // idle, running, completed, error
    this.validationId = '';
    this.currentPhase = '';
    this.results = null;
    this.error = '';
    this.deploymentConfig = {};
    this.collapsedPhases = new Set();
  }

  render() {
    return html`
      <div class="validation-container">
        ${this.renderHeader()}
        ${this.renderContent()}
      </div>
    `;
  }

  renderHeader() {
    return html`
      <div class="validation-header">
        <h2>Deployment Validation</h2>
        <div class="subtitle">
          ${this.deploymentConfig.url 
            ? html`Validating deployment at <code class="url-display">${this.deploymentConfig.url}</code>`
            : 'Checking deployment health and configuration'
          }
        </div>
      </div>
    `;
  }

  renderContent() {
    switch (this.validationState) {
      case 'idle':
        return this.renderIdle();
      case 'running':
        return this.renderRunning();
      case 'completed':
        return this.renderCompleted();
      case 'error':
        return this.renderError();
      default:
        return this.renderIdle();
    }
  }

  renderIdle() {
    return html`
      <div class="loading">
        <p>Ready to validate deployment...</p>
      </div>
    `;
  }

  renderRunning() {
    const phases = this.getValidationPhases();
    const currentPhaseIndex = phases.findIndex(p => p.key === this.currentPhase);
    const progress = currentPhaseIndex >= 0 ? ((currentPhaseIndex + 1) / phases.length) * 100 : 0;

    return html`
      <div class="validation-progress">
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${progress}%"></div>
        </div>
        <div class="validation-phases">
          ${phases.map(phase => this.renderPhase(phase))}
        </div>
      </div>
    `;
  }

  renderCompleted() {
    if (!this.results) return this.renderError();

    const phases = this.getValidationPhases();
    const overallStatus = this.results.status;

    return html`
      <div class="validation-progress">
        <div class="progress-bar">
          <div class="progress-fill ${overallStatus}" style="width: 100%"></div>
        </div>
        <div class="validation-phases">
          ${phases.map(phase => this.renderPhase(phase))}
        </div>
      </div>
      ${this.renderSummary()}
    `;
  }

  renderError() {
    return html`
      <div class="error-state">
        <h3>Validation Failed</h3>
        <p>${this.error || 'An unexpected error occurred during validation.'}</p>
        <div class="actions">
          <button class="action-button" @click="${this.retryValidation}">
            Retry Validation
          </button>
        </div>
      </div>
    `;
  }

  renderPhase(phase) {
    const phaseResult = this.results?.phases?.[phase.key];
    const status = this.getPhaseStatus(phase, phaseResult);
    const isCollapsed = this.collapsedPhases.has(phase.key);

    return html`
      <div class="phase ${status}">
        <div class="phase-header collapsible ${isCollapsed ? 'collapsed' : ''}" 
             @click="${() => this.togglePhase(phase.key)}">
          <div class="phase-title">
            <div class="phase-icon ${status}">
              ${this.getPhaseIcon(status)}
            </div>
            ${phase.title}
          </div>
          <div class="phase-status ${status}">
            ${this.getPhaseStatusText(status)}
          </div>
        </div>
        
        <div class="collapsible-content ${isCollapsed ? 'collapsed' : ''}">
          <div class="phase-details">
            ${phase.description}
          </div>
          
          ${phaseResult ? this.renderPhaseResults(phaseResult) : ''}
          
          ${status === 'running' ? this.renderLoadingSpinner() : ''}
        </div>
      </div>
    `;
  }

  renderPhaseResults(phaseResult) {
    if (!phaseResult.checks) return '';

    return html`
      <div class="phase-checks">
        ${Object.entries(phaseResult.checks).map(([checkName, checkResult]) => html`
          <div class="check-item">
            <div class="check-icon ${checkResult.passed ? 'passed' : 'failed'}">
              ${checkResult.passed ? '✓' : '✕'}
            </div>
            <span>${this.formatCheckName(checkName)}</span>
            ${checkResult.duration ? html`
              <span style="color: #94a3b8; font-size: 0.75rem; margin-left: auto;">
                ${checkResult.duration}ms
              </span>
            ` : ''}
          </div>
        `)}
      </div>
    `;
  }

  renderLoadingSpinner() {
    return html`
      <div style="text-align: center; padding: 1rem;">
        <div class="spinner"></div>
      </div>
    `;
  }

  renderSummary() {
    const status = this.results.status;
    const summary = this.results.summary;

    return html`
      <div class="validation-summary">
        <div class="summary-header">
          <div class="summary-icon ${status}">
            ${this.getSummaryIcon(status)}
          </div>
          <div>
            <h3 class="summary-title">${this.getSummaryTitle(status)}</h3>
            <p class="summary-subtitle">
              Validation completed in ${this.formatDuration(this.results.duration)}
            </p>
          </div>
        </div>

        <div class="summary-stats">
          <div class="stat">
            <div class="stat-value" style="color: ${status === 'passed' ? '#10b981' : '#ef4444'}">
              ${this.getOverallScore()}
            </div>
            <div class="stat-label">Overall Score</div>
          </div>
          <div class="stat">
            <div class="stat-value">${this.results.duration}ms</div>
            <div class="stat-label">Total Time</div>
          </div>
          <div class="stat">
            <div class="stat-value">${this.getPassedChecks()}</div>
            <div class="stat-label">Checks Passed</div>
          </div>
          <div class="stat">
            <div class="stat-value">${this.getFailedChecks()}</div>
            <div class="stat-label">Issues Found</div>
          </div>
        </div>

        ${summary?.recommendations?.length ? this.renderRecommendations(summary.recommendations) : ''}
        ${summary?.nextSteps?.length ? this.renderNextSteps(summary.nextSteps) : ''}
        
        <div class="actions">
          <button class="action-button" @click="${this.rerunValidation}">
            Run Validation Again
          </button>
          <button class="action-button secondary" @click="${this.viewDeployment}">
            Visit Deployment
          </button>
        </div>
      </div>
    `;
  }

  renderRecommendations(recommendations) {
    return html`
      <div class="recommendations">
        <h4>Recommendations</h4>
        <ul class="recommendation-list">
          ${recommendations.map(rec => html`
            <li class="recommendation-item">
              <div class="recommendation-icon">!</div>
              <div class="recommendation-text">${rec}</div>
            </li>
          `)}
        </ul>
      </div>
    `;
  }

  renderNextSteps(nextSteps) {
    return html`
      <div class="recommendations">
        <h4>Next Steps</h4>
        <ul class="recommendation-list">
          ${nextSteps.map((step, index) => html`
            <li class="recommendation-item">
              <div class="recommendation-icon">${index + 1}</div>
              <div class="recommendation-text">${step}</div>
            </li>
          `)}
        </ul>
      </div>
    `;
  }

  getValidationPhases() {
    return [
      {
        key: 'connectivity',
        title: 'Connectivity Check',
        description: 'Verifying basic connectivity and DNS resolution'
      },
      {
        key: 'platform',
        title: 'Platform Configuration',
        description: 'Checking platform-specific settings and features'
      },
      {
        key: 'health',
        title: 'Application Health',
        description: 'Testing application health endpoints and functionality'
      },
      {
        key: 'performance',
        title: 'Performance Validation',
        description: 'Measuring load times and performance metrics'
      },
      {
        key: 'security',
        title: 'Security Check',
        description: 'Validating HTTPS, security headers, and certificates'
      }
    ];
  }

  getPhaseStatus(phase, phaseResult) {
    if (!phaseResult) {
      return this.currentPhase === phase.key ? 'running' : 'pending';
    }
    return phaseResult.status === 'passed' ? 'passed' :
           phaseResult.status === 'warning' ? 'warning' : 'failed';
  }

  getPhaseIcon(status) {
    const icons = {
      pending: '○',
      running: '◐',
      passed: '✓',
      failed: '✕',
      warning: '!'
    };
    return icons[status] || '○';
  }

  getPhaseStatusText(status) {
    const texts = {
      pending: 'Pending',
      running: 'Running...',
      passed: 'Passed',
      failed: 'Failed',
      warning: 'Warning'
    };
    return texts[status] || 'Unknown';
  }

  getSummaryIcon(status) {
    const icons = {
      passed: '✓',
      failed: '✕',
      warning: '!'
    };
    return icons[status] || '?';
  }

  getSummaryTitle(status) {
    const titles = {
      passed: 'Validation Passed',
      failed: 'Validation Failed',
      warning: 'Validation Completed with Warnings'
    };
    return titles[status] || 'Validation Complete';
  }

  getOverallScore() {
    if (!this.results?.phases) return '0%';
    
    const phases = Object.values(this.results.phases);
    const passed = phases.filter(p => p.status === 'passed').length;
    const total = phases.length;
    
    return `${Math.round((passed / total) * 100)}%`;
  }

  getPassedChecks() {
    if (!this.results?.phases) return 0;
    
    return Object.values(this.results.phases)
      .reduce((total, phase) => {
        if (phase.checks) {
          return total + Object.values(phase.checks).filter(c => c.passed).length;
        }
        return total;
      }, 0);
  }

  getFailedChecks() {
    if (!this.results?.phases) return 0;
    
    return Object.values(this.results.phases)
      .reduce((total, phase) => {
        if (phase.checks) {
          return total + Object.values(phase.checks).filter(c => !c.passed).length;
        }
        return total;
      }, 0);
  }

  formatCheckName(checkName) {
    return checkName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .replace(/_/g, ' ');
  }

  formatDuration(ms) {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  }

  togglePhase(phaseKey) {
    if (this.collapsedPhases.has(phaseKey)) {
      this.collapsedPhases.delete(phaseKey);
    } else {
      this.collapsedPhases.add(phaseKey);
    }
    this.requestUpdate();
  }

  retryValidation() {
    this.dispatchEvent(new CustomEvent('retry-validation', {
      detail: { deploymentConfig: this.deploymentConfig }
    }));
  }

  rerunValidation() {
    this.dispatchEvent(new CustomEvent('rerun-validation', {
      detail: { deploymentConfig: this.deploymentConfig }
    }));
  }

  viewDeployment() {
    if (this.deploymentConfig.url) {
      window.open(this.deploymentConfig.url, '_blank');
    }
  }

  // Public methods for integration
  startValidation(deploymentConfig) {
    this.deploymentConfig = deploymentConfig;
    this.validationState = 'running';
    this.currentPhase = 'connectivity';
    this.results = null;
    this.error = '';
    this.requestUpdate();
  }

  updatePhase(phase) {
    this.currentPhase = phase;
    this.requestUpdate();
  }

  updateResults(results) {
    this.results = results;
    this.requestUpdate();
  }

  completeValidation(results) {
    this.results = results;
    this.validationState = 'completed';
    this.currentPhase = '';
    this.requestUpdate();
  }

  showError(error) {
    this.error = error;
    this.validationState = 'error';
    this.requestUpdate();
  }
}

customElements.define('deployment-validation-ui', DeploymentValidationUI);