/**
 * Deployment Workflow Integration
 * 
 * Integrates deployment validation and health monitoring with the existing
 * 4-step playground → production workflow.
 */

import { DeploymentValidator } from './deployment-validator.js';
import { HealthCheckTemplates } from './health-check-templates.js';
import { MonitoringIntegration } from './monitoring-integration.js';

export class DeploymentWorkflowIntegration {
  constructor(playgroundApp) {
    this.playgroundApp = playgroundApp;
    this.deploymentValidator = new DeploymentValidator();
    this.healthCheckTemplates = new HealthCheckTemplates();
    this.monitoringIntegration = new MonitoringIntegration();
    
    this.validationUI = null;
    this.currentValidation = null;
    
    this.setupIntegration();
  }

  /**
   * Setup integration with existing playground workflow
   */
  setupIntegration() {
    // Subscribe to deployment events
    this.deploymentValidator.subscribe(this.handleValidationEvent.bind(this));
    
    // Add validation UI to the DOM
    this.setupValidationUI();
    
    // Enhance existing deployment buttons
    this.enhanceDeploymentFlow();
    
    // Add validation step to workflow
    this.addValidationStep();
    
    console.log('🔗 Deployment workflow integration initialized');
  }

  /**
   * Setup validation UI component
   */
  setupValidationUI() {
    // Import and create the validation UI component
    import('../components/deployment-validation-ui.js').then(() => {
      this.validationUI = document.createElement('deployment-validation-ui');
      this.validationUI.style.display = 'none';
      
      // Add event listeners
      this.validationUI.addEventListener('retry-validation', (e) => {
        this.validateDeployment(e.detail.deploymentConfig);
      });
      
      this.validationUI.addEventListener('rerun-validation', (e) => {
        this.validateDeployment(e.detail.deploymentConfig);
      });
      
      // Add to deployment section
      const deploymentSection = document.querySelector('#app-builder .workflow-step-content[data-step="4"]');
      if (deploymentSection) {
        deploymentSection.appendChild(this.validationUI);
      } else {
        document.body.appendChild(this.validationUI);
      }
    });
  }

  /**
   * Enhance existing deployment flow with validation
   */
  enhanceDeploymentFlow() {
    // Override the selectDeploymentPlatform method to include validation
    const originalSelectDeploymentPlatform = this.playgroundApp.selectDeploymentPlatform.bind(this.playgroundApp);
    
    this.playgroundApp.selectDeploymentPlatform = async (platform) => {
      try {
        // Call original deployment method
        const deploymentResult = await originalSelectDeploymentPlatform(platform);
        
        // If deployment succeeded, validate it
        if (deploymentResult && deploymentResult.success && deploymentResult.url) {
          await this.validateDeployment({
            platform: platform,
            url: deploymentResult.url,
            type: this.getApplicationType(),
            name: this.playgroundApp.appBuilderState.appConfiguration.appName,
            version: '1.0.0',
            environment: 'production'
          });
        }
        
        return deploymentResult;
      } catch (error) {
        console.error('Deployment failed:', error);
        this.showValidationError('Deployment failed: ' + error.message);
        throw error;
      }
    };
  }

  /**
   * Add validation step to the 4-step workflow
   */
  addValidationStep() {
    // Add validation substep to step 4 (Deploy)
    const deployStep = document.querySelector('.workflow-step[data-step="4"]');
    if (deployStep) {
      // Add validation indicator
      const stepContent = deployStep.querySelector('.step-content');
      if (stepContent && !stepContent.querySelector('.validation-indicator')) {
        const validationIndicator = document.createElement('div');
        validationIndicator.className = 'validation-indicator';
        validationIndicator.innerHTML = `
          <div class="validation-badge" style="display: none;">
            <span class="badge-icon">✓</span>
            <span class="badge-text">Validated</span>
          </div>
        `;
        stepContent.appendChild(validationIndicator);
      }
    }

    // Add validation section to deployment options
    this.addValidationSection();
  }

  /**
   * Add validation section to deployment options
   */
  addValidationSection() {
    const deploymentOptions = document.getElementById('deployment-options');
    if (deploymentOptions && !deploymentOptions.querySelector('.validation-section')) {
      const validationSection = document.createElement('div');
      validationSection.className = 'validation-section';
      validationSection.innerHTML = `
        <div class="section-header">
          <h3>🔍 Deployment Validation</h3>
          <p>Automatically validate your deployment to ensure it's working correctly</p>
        </div>
        <div class="validation-options">
          <label>
            <input type="checkbox" id="auto-validate" checked>
            <span>Automatically validate after deployment</span>
          </label>
          <label>
            <input type="checkbox" id="include-monitoring" checked>
            <span>Include monitoring setup in generated app</span>
          </label>
          <label>
            <input type="checkbox" id="include-health-checks" checked>
            <span>Generate health check endpoints</span>
          </label>
        </div>
        <div class="validation-preview" style="display: none;">
          <h4>Validation will check:</h4>
          <ul>
            <li>✓ Basic connectivity and DNS resolution</li>
            <li>✓ Platform-specific configuration</li>
            <li>✓ Application health endpoints</li>
            <li>✓ Performance and load times</li>
            <li>✓ Security headers and HTTPS</li>
          </ul>
        </div>
      `;
      
      deploymentOptions.insertBefore(validationSection, deploymentOptions.firstChild);
    }
  }

  /**
   * Enhanced application generation with validation support
   */
  async enhanceApplicationGeneration() {
    // Override the generateFullStackApp method
    const originalGenerateFullStackApp = this.playgroundApp.generateFullStackApp.bind(this.playgroundApp);
    
    this.playgroundApp.generateFullStackApp = async () => {
      // Call original generation
      const result = await originalGenerateFullStackApp();
      
      // Add health checks and monitoring if enabled
      if (this.shouldIncludeHealthChecks()) {
        result.files = {
          ...result.files,
          ...this.generateHealthCheckFiles()
        };
      }
      
      if (this.shouldIncludeMonitoring()) {
        const monitoringFiles = this.generateMonitoringFiles();
        result.files = {
          ...result.files,
          ...monitoringFiles
        };
      }
      
      return result;
    };
  }

  /**
   * Validate deployment
   */
  async validateDeployment(deploymentConfig) {
    if (!this.validationUI) {
      console.warn('Validation UI not available');
      return;
    }

    try {
      // Show validation UI
      this.showValidationUI();
      this.validationUI.startValidation(deploymentConfig);
      
      // Run validation
      this.currentValidation = await this.deploymentValidator.validateDeployment(deploymentConfig);
      
      // Update UI with results
      this.validationUI.completeValidation(this.currentValidation);
      
      // Update workflow step indicator
      this.updateValidationIndicator(this.currentValidation.status);
      
      // Show success notification
      this.playgroundApp.showNotification(
        this.currentValidation.status === 'passed' ? 'success' : 'warning',
        this.getValidationMessage(this.currentValidation)
      );
      
      return this.currentValidation;
      
    } catch (error) {
      console.error('Validation failed:', error);
      this.showValidationError(error.message);
      throw error;
    }
  }

  /**
   * Handle validation events
   */
  handleValidationEvent(event, data) {
    if (!this.validationUI) return;

    switch (event) {
      case 'validation:start':
        console.log('🔍 Validation started:', data.validationId);
        break;
        
      case 'validation:progress':
        this.validationUI.updatePhase(data.phase);
        console.log(`📊 Validation progress: ${data.phase}`, data.result);
        break;
        
      case 'validation:complete':
        console.log('✅ Validation complete:', data.results);
        break;
        
      case 'validation:error':
        console.error('❌ Validation error:', data.error);
        this.showValidationError(data.error.error);
        break;
    }
  }

  /**
   * Show validation UI
   */
  showValidationUI() {
    if (this.validationUI) {
      this.validationUI.style.display = 'block';
      
      // Scroll to validation UI
      this.validationUI.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }
  }

  /**
   * Show validation error
   */
  showValidationError(message) {
    if (this.validationUI) {
      this.validationUI.showError(message);
      this.showValidationUI();
    }
    
    this.playgroundApp.showNotification('error', `Validation failed: ${message}`);
  }

  /**
   * Update validation indicator in workflow step
   */
  updateValidationIndicator(status) {
    const indicator = document.querySelector('.validation-badge');
    if (indicator) {
      const icon = indicator.querySelector('.badge-icon');
      const text = indicator.querySelector('.badge-text');
      
      indicator.style.display = 'flex';
      
      if (status === 'passed') {
        indicator.className = 'validation-badge success';
        icon.textContent = '✓';
        text.textContent = 'Validated';
      } else if (status === 'warning') {
        indicator.className = 'validation-badge warning';
        icon.textContent = '!';
        text.textContent = 'Warnings';
      } else {
        indicator.className = 'validation-badge error';
        icon.textContent = '✕';
        text.textContent = 'Failed';
      }
    }
  }

  /**
   * Get validation message based on results
   */
  getValidationMessage(results) {
    const messages = {
      passed: `Deployment validation passed! Your app at ${results.url} is working correctly.`,
      warning: `Deployment validation completed with warnings. Your app is accessible but has some issues.`,
      failed: `Deployment validation failed. Please check the issues and redeploy.`
    };
    
    return messages[results.status] || 'Validation completed.';
  }

  /**
   * Generate health check files for the application
   */
  generateHealthCheckFiles() {
    const appType = this.getApplicationType();
    const appConfig = {
      name: this.playgroundApp.appBuilderState.appConfiguration.appName,
      type: appType,
      version: '1.0.0'
    };
    
    const healthSystem = this.healthCheckTemplates.generateHealthCheckSystem(appConfig);
    const files = {};
    
    // Convert health check files to the format expected by the app generator
    healthSystem.files.forEach(file => {
      files[file.path] = file.content;
    });
    
    return files;
  }

  /**
   * Generate monitoring files for the application
   */
  generateMonitoringFiles() {
    const appConfig = {
      name: this.playgroundApp.appBuilderState.appConfiguration.appName,
      type: this.getApplicationType(),
      version: '1.0.0'
    };
    
    const deploymentResult = {
      platform: 'unknown',
      environment: 'production',
      url: 'https://your-app.com'
    };
    
    const monitoringSetup = this.monitoringIntegration.generateMonitoringSetup(appConfig, deploymentResult);
    const files = {};
    
    // Convert monitoring files to the format expected by the app generator
    monitoringSetup.files.forEach(file => {
      files[file.path] = file.content;
    });
    
    // Add monitoring configuration
    files['monitoring/config.json'] = JSON.stringify(monitoringSetup.config, null, 2);
    
    return files;
  }

  /**
   * Determine application type based on selected template and components
   */
  getApplicationType() {
    const template = this.playgroundApp.appBuilderState.selectedTemplate;
    const components = this.playgroundApp.appBuilderState.selectedComponents;
    
    if (template === 'fullstack' || template === 'full-stack') {
      return 'fullstack';
    }
    
    if (template === 'api' || template === 'backend') {
      return 'api-only';
    }
    
    if (components.some(comp => comp.includes('api') || comp.includes('backend'))) {
      return 'fullstack';
    }
    
    return 'frontend-only';
  }

  /**
   * Check if health checks should be included
   */
  shouldIncludeHealthChecks() {
    const checkbox = document.getElementById('include-health-checks');
    return checkbox ? checkbox.checked : true; // Default to true
  }

  /**
   * Check if monitoring should be included
   */
  shouldIncludeMonitoring() {
    const checkbox = document.getElementById('include-monitoring');
    return checkbox ? checkbox.checked : true; // Default to true
  }

  /**
   * Check if auto-validation is enabled
   */
  shouldAutoValidate() {
    const checkbox = document.getElementById('auto-validate');
    return checkbox ? checkbox.checked : true; // Default to true
  }

  /**
   * Add validation results to application export
   */
  enhanceExportWithValidationResults() {
    const originalExportProject = this.playgroundApp.exportToFile.bind(this.playgroundApp);
    
    this.playgroundApp.exportToFile = () => {
      // Get current export data
      const exportData = {
        ...this.playgroundApp.appBuilderState.generatedApp,
        validation: this.currentValidation ? {
          status: this.currentValidation.status,
          timestamp: this.currentValidation.endTime,
          summary: this.currentValidation.summary,
          url: this.currentValidation.url
        } : null
      };
      
      // Create and download export file
      const dataBlob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `${this.playgroundApp.appBuilderState.appConfiguration.appName}-with-validation.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    };
  }

  /**
   * Get validation summary for display
   */
  getValidationSummary() {
    if (!this.currentValidation) {
      return {
        status: 'not-validated',
        message: 'Deployment not yet validated'
      };
    }
    
    return {
      status: this.currentValidation.status,
      message: this.getValidationMessage(this.currentValidation),
      url: this.currentValidation.url,
      timestamp: new Date(this.currentValidation.endTime).toLocaleString(),
      issues: this.currentValidation.summary?.issues || [],
      recommendations: this.currentValidation.summary?.recommendations || []
    };
  }

  /**
   * Add validation badge to deployment buttons
   */
  addValidationBadges() {
    const deploymentButtons = document.querySelectorAll('.deployment-option');
    deploymentButtons.forEach(button => {
      if (!button.querySelector('.validation-support-badge')) {
        const badge = document.createElement('div');
        badge.className = 'validation-support-badge';
        badge.innerHTML = '🔍 Auto-validates';
        badge.title = 'Deployment will be automatically validated';
        button.appendChild(badge);
      }
    });
  }

  /**
   * Initialize the integration after playground is ready
   */
  initialize() {
    // Wait for playground to be fully loaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => this.finalizeIntegration(), 1000);
      });
    } else {
      setTimeout(() => this.finalizeIntegration(), 1000);
    }
  }

  /**
   * Finalize integration after DOM is ready
   */
  finalizeIntegration() {
    this.enhanceApplicationGeneration();
    this.enhanceExportWithValidationResults();
    this.addValidationBadges();
    
    console.log('✅ Deployment workflow integration complete');
  }
}

export default DeploymentWorkflowIntegration;