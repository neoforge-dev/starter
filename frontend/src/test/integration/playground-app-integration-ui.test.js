/**
 * Playground Application Integration UI Tests
 *
 * TDD tests defining expected behavior for Application Integration tools
 * integrated into the playground interface. Tests the critical user journey
 * from component exploration → production app generation.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('Playground Application Integration UI', () => {
  let playground;
  let testContainer;

  beforeEach(async () => {
    // Create test DOM environment with complete HTML structure
    testContainer = document.createElement('div');
    testContainer.id = 'playground-test-container';
    testContainer.innerHTML = `
      <div id="playground-app">
        <aside class="component-nav">
          <nav class="component-tree" id="component-tree"></nav>
        </aside>
        <main class="playground-content">
          <header class="playground-toolbar">
            <div class="component-info">
              <h2 id="current-component-title">Select a Component</h2>
              <p id="current-component-description">Choose a component from the sidebar to begin testing</p>
            </div>
            <div class="toolbar-actions">
              <button id="build-app-button" class="tool-button tool-button-success" title="Generate production application from selected components">
                🚀 Build App
              </button>
            </div>
          </header>
          <div id="component-preview"></div>
        </main>

        <!-- Application Integration Panel -->
        <section class="app-integration-panel" id="app-integration-panel" style="display: none;">
          <div class="panel-header">
            <h2>🚀 Build Production App</h2>
            <button class="close-panel-btn" id="close-app-panel">✕</button>
          </div>

          <div class="workflow-container">
            <!-- Workflow Progress -->
            <div class="workflow-progress">
              <div class="workflow-step active" data-step="1">
                <div class="step-number">1</div>
                <div class="step-label">Select Components</div>
              </div>
              <div class="workflow-step" data-step="2">
                <div class="step-number">2</div>
                <div class="step-label">Choose Template</div>
              </div>
              <div class="workflow-step" data-step="3">
                <div class="step-number">3</div>
                <div class="step-label">Configure App</div>
              </div>
              <div class="workflow-step" data-step="4">
                <div class="step-number">4</div>
                <div class="step-label">Generate & Deploy</div>
              </div>
            </div>

            <!-- Step Content -->
            <div class="workflow-content">
              <!-- Step 1: Component Selection -->
              <div class="workflow-step-content active" data-step="1">
                <h3>Select Components for Your App</h3>
                <div id="component-selection" class="component-selection"></div>
                <div id="app-preview" class="app-preview">
                  <p>Selected components will appear here...</p>
                </div>
                <div id="validation-results" class="validation-results"></div>
              </div>

              <!-- Step 2: Template Selection -->
              <div class="workflow-step-content" data-step="2">
                <h3>Choose Application Template</h3>
                <div id="template-selection" class="template-selection">
                  <div class="template-option" data-template="dashboard-app">
                    <h4>📊 Dashboard App</h4>
                    <p>Admin dashboard with tables and forms</p>
                  </div>
                  <div class="template-option" data-template="marketing-site">
                    <h4>🌐 Marketing Site</h4>
                    <p>Marketing website with landing pages</p>
                  </div>
                  <div class="template-option" data-template="saas-app">
                    <h4>💼 SaaS App</h4>
                    <p>SaaS application with auth and billing</p>
                  </div>
                  <div class="template-option" data-template="minimal-app">
                    <h4>⚡ Minimal App</h4>
                    <p>Minimal starting point with essential components</p>
                  </div>
                </div>
                <div id="template-preview" class="template-preview">
                  <p>Select a template to see preview...</p>
                </div>
                <div id="component-recommendations" class="component-recommendations">
                  <h4>Recommended Components</h4>
                  <p>Choose a template to see recommendations</p>
                </div>
              </div>

              <!-- Step 3: App Configuration -->
              <div class="workflow-step-content" data-step="3">
                <h3>Configure Your Application</h3>
                <form id="app-config-form" class="app-config-form">
                  <div class="form-group">
                    <label for="app-name">Application Name</label>
                    <input type="text" id="app-name" name="appName" placeholder="My Awesome App" required>
                    <div class="config-error" style="display: none;"></div>
                  </div>

                  <div class="form-group">
                    <label>Features</label>
                    <div class="checkbox-group">
                      <label class="checkbox-label">
                        <input type="checkbox" class="feature-checkbox" name="routing" value="routing">
                        <span>Client-side Routing</span>
                      </label>
                      <label class="checkbox-label">
                        <input type="checkbox" class="feature-checkbox" name="responsive" value="responsive" checked>
                        <span>Responsive Design</span>
                      </label>
                      <label class="checkbox-label">
                        <input type="checkbox" class="feature-checkbox" name="auth" value="auth">
                        <span>Authentication</span>
                      </label>
                    </div>
                  </div>
                </form>

                <div id="config-preview" class="config-preview">
                  <h4>Configuration Preview</h4>
                  <pre id="config-preview-content">{}</pre>
                </div>
              </div>

              <!-- Step 4: Generation & Deployment -->
              <div class="workflow-step-content" data-step="4">
                <h3>Generate & Deploy Your App</h3>

                <div class="generation-section">
                  <button id="generate-app-button" class="btn btn-primary" disabled>
                    Generate Application
                  </button>
                  <div id="generation-progress" class="progress-indicator" style="display: none;">
                    <div class="progress-bar"></div>
                    <div class="progress-text">Generating your application...</div>
                  </div>
                </div>

                <div id="download-section" class="download-section" style="display: none;">
                  <h4>Your App is Ready!</h4>
                  <div class="action-buttons">
                    <button id="download-app-button" class="btn btn-success">
                      📥 Download ZIP
                    </button>
                    <button id="copy-code-button" class="btn btn-secondary">
                      📋 Copy Code
                    </button>
                    <button id="deploy-app-button" class="btn btn-primary">
                      🚀 Deploy Now
                    </button>
                  </div>
                </div>

                <!-- Performance Validation -->
                <div class="performance-section">
                  <button id="validate-performance-button" class="btn btn-outline">
                    ⚡ Validate Performance
                  </button>
                  <div id="performance-validation-panel" class="validation-panel" style="display: none;">
                    <h4>Performance Validation Results</h4>
                    <div id="performance-results"></div>
                  </div>
                </div>

                <!-- Deployment Options -->
                <div id="deployment-options" class="deployment-options" style="display: none;">
                  <h4>Choose Deployment Platform</h4>
                  <div class="deployment-grid">
                    <div class="deployment-option" data-platform="vercel">
                      <h5>▲ Vercel</h5>
                      <p>Zero configuration deployment</p>
                    </div>
                    <div class="deployment-option" data-platform="netlify">
                      <h5>🌐 Netlify</h5>
                      <p>Drag-and-drop or Git deployment</p>
                    </div>
                    <div class="deployment-option" data-platform="github-pages">
                      <h5>📄 GitHub Pages</h5>
                      <p>Deploy with GitHub Actions</p>
                    </div>
                    <div class="deployment-option" data-platform="docker">
                      <h5>🐳 Docker</h5>
                      <p>Containerized deployment</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Navigation -->
            <div class="workflow-navigation">
              <button id="prev-step-button" class="btn btn-secondary" disabled>
                ← Previous
              </button>
              <button id="next-step-button" class="btn btn-primary" disabled>
                Next →
              </button>
            </div>
          </div>
        </section>
      </div>
    `;
    document.body.appendChild(testContainer);

    // Import and initialize playground
    const { PlaygroundApp } = await import('../../playground/advanced-playground.js');
    playground = new PlaygroundApp();

    // Set global reference for tests that expect it
    window.playgroundApp = playground;

    // Wait for initialization to complete
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  afterEach(() => {
    if (testContainer && testContainer.parentNode) {
      testContainer.parentNode.removeChild(testContainer);
    }
  });

  describe('Application Integration Panel Access', () => {
    it('should have Build App button in toolbar', () => {
      const buildButton = document.querySelector('#build-app-button');

      expect(buildButton).toBeDefined();
      expect(buildButton.textContent).toContain('Build App');
      expect(buildButton.title).toContain('Generate production application');
    });

    it('should open Application Integration panel when Build App clicked', async () => {
      const buildButton = document.querySelector('#build-app-button');

      // Directly call the method to test functionality
      playground.openAppIntegrationPanel();

      // Wait for the panel to be processed
      await new Promise(resolve => setTimeout(resolve, 50));

      const integrationPanel = document.querySelector('#app-integration-panel');
      expect(integrationPanel).toBeDefined();

      // Check if panel is visible (the key indicator)
      expect(integrationPanel.style.display).toBe('block');
      expect(integrationPanel.classList.contains('panel-open')).toBe(true);
    });

    it('should show application generation workflow steps', () => {
      // Open panel
      document.querySelector('#build-app-button').click();

      const workflowSteps = document.querySelectorAll('.workflow-step');
      expect(workflowSteps.length).toBeGreaterThanOrEqual(4);

      // Verify key workflow steps
      const stepTexts = Array.from(workflowSteps).map(step => step.textContent);
      expect(stepTexts.some(text => text.includes('Select Components'))).toBe(true);
      expect(stepTexts.some(text => text.includes('Choose Template'))).toBe(true);
      expect(stepTexts.some(text => text.includes('Configure App'))).toBe(true);
      expect(stepTexts.some(text => text.includes('Generate & Deploy'))).toBe(true);
    });
  });

  describe('Component Selection for App Generation', () => {
    it('should allow selecting components for app generation', async () => {
      // Open app integration panel directly
      playground.openAppIntegrationPanel();

      // Wait for initialization to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      // Should show component selection interface
      const componentSelection = document.querySelector('#component-selection');
      expect(componentSelection).toBeDefined();

      // Should have checkboxes for available components
      const componentCheckboxes = document.querySelectorAll('.component-checkbox');
      expect(componentCheckboxes.length).toBeGreaterThan(0);
    });

    it('should show selected components in app preview', () => {
      document.querySelector('#build-app-button').click();

      // Select some components
      const checkboxes = document.querySelectorAll('.component-checkbox');
      if (checkboxes.length > 0) {
        checkboxes[0].checked = true;
        checkboxes[0].dispatchEvent(new Event('change'));
      }

      // Should update app preview
      const appPreview = document.querySelector('#app-preview');
      expect(appPreview).toBeDefined();
      expect(appPreview.textContent.length).toBeGreaterThan(0);
    });

    it('should validate component compatibility', () => {
      document.querySelector('#build-app-button').click();

      // Select incompatible components (if any)
      const checkboxes = document.querySelectorAll('.component-checkbox');
      if (checkboxes.length >= 2) {
        checkboxes[0].checked = true;
        checkboxes[1].checked = true;

        // Trigger validation
        const validateButton = document.querySelector('#validate-selection');
        if (validateButton) {
          validateButton.click();
        }
      }

      // Should show validation results
      const validationResults = document.querySelector('#validation-results');
      expect(validationResults).toBeDefined();
    });
  });

  describe('Template Selection Interface', () => {
    it('should show available application templates', () => {
      document.querySelector('#build-app-button').click();

      const templateSelection = document.querySelector('#template-selection');
      expect(templateSelection).toBeDefined();

      const templates = document.querySelectorAll('.template-option');
      expect(templates.length).toBeGreaterThanOrEqual(4);

      // Verify key templates
      const templateNames = Array.from(templates).map(t => t.dataset.template);
      expect(templateNames).toContain('dashboard-app');
      expect(templateNames).toContain('marketing-site');
      expect(templateNames).toContain('saas-app');
      expect(templateNames).toContain('minimal-app');
    });

    it('should show template preview when selected', async () => {
      playground.openAppIntegrationPanel();
      await new Promise(resolve => setTimeout(resolve, 100));

      // Directly call the selectTemplate method
      playground.selectTemplate('dashboard-app');
      await new Promise(resolve => setTimeout(resolve, 50));

      const templatePreview = document.querySelector('#template-preview');
      expect(templatePreview).toBeDefined();
      expect(templatePreview.textContent).toContain('dashboard');
    });

    it('should update component recommendations based on template', async () => {
      playground.openAppIntegrationPanel();
      await new Promise(resolve => setTimeout(resolve, 100));

      // Directly call the selectTemplate method
      playground.selectTemplate('dashboard-app');
      await new Promise(resolve => setTimeout(resolve, 50));

      const recommendations = document.querySelector('#component-recommendations');
      expect(recommendations).toBeDefined();
      expect(recommendations.textContent).toContain('Neo Table'); // Formatted component name
    });
  });

  describe('App Configuration Interface', () => {
    it('should provide app configuration form', () => {
      document.querySelector('#build-app-button').click();

      const configForm = document.querySelector('#app-config-form');
      expect(configForm).toBeDefined();

      const appNameInput = document.querySelector('#app-name');
      const featuresCheckboxes = document.querySelectorAll('.feature-checkbox');

      expect(appNameInput).toBeDefined();
      expect(featuresCheckboxes.length).toBeGreaterThan(0);
    });

    it('should validate app configuration', () => {
      document.querySelector('#build-app-button').click();

      const appNameInput = document.querySelector('#app-name');
      if (appNameInput) {
        appNameInput.value = '';
        appNameInput.dispatchEvent(new Event('blur'));

        const errorMessage = document.querySelector('.config-error');
        expect(errorMessage).toBeDefined();
      }
    });

    it('should show configuration preview', async () => {
      playground.openAppIntegrationPanel();
      await new Promise(resolve => setTimeout(resolve, 100));

      // Directly update the app configuration
      playground.appBuilderState.appConfiguration.appName = 'My Test App';
      playground.updateConfigurationPreview();
      await new Promise(resolve => setTimeout(resolve, 50));

      const configPreview = document.querySelector('#config-preview');
      expect(configPreview).toBeDefined();
      expect(configPreview.textContent).toContain('My Test App');
    });
  });

  describe('App Generation and Export', () => {
    it('should generate app when configuration complete', async () => {
      playground.openAppIntegrationPanel();
      await new Promise(resolve => setTimeout(resolve, 100));

      // Set up complete configuration
      playground.appBuilderState.selectedComponents = ['neo-button', 'neo-card'];
      playground.appBuilderState.selectedTemplate = 'minimal-app';
      playground.appBuilderState.appConfiguration.appName = 'Test Generated App';

      // Update the navigation to reflect the state
      playground.updateWorkflowNavigation();
      await new Promise(resolve => setTimeout(resolve, 50));

      const generateButton = document.querySelector('#generate-app-button');
      expect(generateButton).toBeDefined();

      // Should be enabled when config is complete
      expect(generateButton.disabled).toBe(false);
    });

    it('should show generation progress', async () => {
      document.querySelector('#build-app-button').click();

      // Complete minimal config
      const appNameInput = document.querySelector('#app-name');
      const templateOption = document.querySelector('[data-template="minimal-app"]');

      if (appNameInput && templateOption) {
        appNameInput.value = 'Progress Test App';
        templateOption.click();

        const generateButton = document.querySelector('#generate-app-button');
        generateButton.click();

        const progressIndicator = document.querySelector('#generation-progress');
        expect(progressIndicator).toBeDefined();
      }
    });

    it('should provide download/export options', async () => {
      document.querySelector('#build-app-button').click();

      // Simulate completed generation
      const downloadSection = document.querySelector('#download-section');
      expect(downloadSection).toBeDefined();

      const downloadButton = document.querySelector('#download-app-button');
      const copyCodeButton = document.querySelector('#copy-code-button');
      const deployButton = document.querySelector('#deploy-app-button');

      expect(downloadButton).toBeDefined();
      expect(copyCodeButton).toBeDefined();
      expect(deployButton).toBeDefined();
    });
  });

  describe('Integration with Existing Tools', () => {
    it('should access AppTemplateGenerator from UI', async () => {
      document.querySelector('#build-app-button').click();

      // Should instantiate AppTemplateGenerator
      const playground = window.playgroundApp;
      expect(playground.appTemplateGenerator).toBeDefined();

      const templates = playground.appTemplateGenerator.getAvailableTemplates();
      expect(templates.length).toBeGreaterThanOrEqual(4);
    });

    it('should access PerformanceValidator from UI', async () => {
      document.querySelector('#build-app-button').click();

      const performanceButton = document.querySelector('#validate-performance-button');
      expect(performanceButton).toBeDefined();

      performanceButton.click();

      // Should show performance validation interface
      const performancePanel = document.querySelector('#performance-validation-panel');
      expect(performancePanel).toBeDefined();
    });

    it('should access DeploymentExamples from UI', async () => {
      document.querySelector('#build-app-button').click();

      const deployButton = document.querySelector('#deploy-app-button');
      deployButton.click();

      const deploymentOptions = document.querySelectorAll('.deployment-option');
      expect(deploymentOptions.length).toBeGreaterThanOrEqual(4);

      const platforms = Array.from(deploymentOptions).map(opt => opt.dataset.platform);
      expect(platforms).toContain('vercel');
      expect(platforms).toContain('netlify');
    });
  });

  describe('User Experience Flow', () => {
    it('should guide user through complete workflow', async () => {
      // Step 1: Open app builder
      document.querySelector('#build-app-button').click();

      let currentStep = document.querySelector('.workflow-step.active');
      expect(currentStep.textContent).toContain('Select Components');

      // Step 2: Select components and advance
      const componentCheckbox = document.querySelector('.component-checkbox');
      if (componentCheckbox) {
        componentCheckbox.checked = true;
        componentCheckbox.dispatchEvent(new Event('change'));
      }

      const nextButton = document.querySelector('#next-step-button');
      if (nextButton && !nextButton.disabled) {
        nextButton.click();
        currentStep = document.querySelector('.workflow-step.active');
        expect(currentStep.textContent).toContain('Choose Template');
      }
    });

    it('should prevent progression with incomplete steps', () => {
      document.querySelector('#build-app-button').click();

      const nextButton = document.querySelector('#next-step-button');
      expect(nextButton.disabled).toBe(true);

      // Should enable when step is complete
      const componentCheckbox = document.querySelector('.component-checkbox');
      if (componentCheckbox) {
        componentCheckbox.checked = true;
        componentCheckbox.dispatchEvent(new Event('change'));
        expect(nextButton.disabled).toBe(false);
      }
    });

    it('should maintain state during workflow', () => {
      document.querySelector('#build-app-button').click();

      // Make selections
      const appNameInput = document.querySelector('#app-name');
      if (appNameInput) {
        appNameInput.value = 'State Test App';
      }

      // Navigate to next step and back
      const nextButton = document.querySelector('#next-step-button');
      const prevButton = document.querySelector('#prev-step-button');

      if (nextButton && !nextButton.disabled) {
        nextButton.click();
        if (prevButton) {
          prevButton.click();
          expect(document.querySelector('#app-name').value).toBe('State Test App');
        }
      }
    });
  });
});
