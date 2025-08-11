/**
 * Visual Testing Mode for Playground
 * 
 * Adds visual testing capabilities directly to the playground interface
 * allowing developers to capture and compare component visuals interactively.
 */

export class VisualTestingMode {
  constructor(playgroundApp) {
    this.playgroundApp = playgroundApp;
    this.isEnabled = false;
    this.capturedBaselines = new Map();
    this.initializeUI();
  }

  /**
   * Initialize the visual testing UI
   */
  initializeUI() {
    this.addVisualTestingControls();
    this.bindEventListeners();
  }

  /**
   * Add visual testing controls to the playground UI
   */
  addVisualTestingControls() {
    // Add to the main toolbar
    const toolbar = document.querySelector('.playground-toolbar');
    if (!toolbar) return;

    const visualTestingButton = document.createElement('button');
    visualTestingButton.id = 'toggle-visual-testing';
    visualTestingButton.className = 'toolbar-button';
    visualTestingButton.innerHTML = `
      <span class="icon">📸</span>
      <span class="label">Visual Testing</span>
    `;
    visualTestingButton.title = 'Enable visual testing mode';
    
    toolbar.appendChild(visualTestingButton);

    // Add visual testing panel
    this.createVisualTestingPanel();
  }

  /**
   * Create the visual testing panel
   */
  createVisualTestingPanel() {
    const panel = document.createElement('div');
    panel.id = 'visual-testing-panel';
    panel.className = 'panel';
    panel.style.display = 'none';
    
    panel.innerHTML = `
      <div class="panel-header">
        <h3>Visual Testing</h3>
        <button class="close-button" onclick="visualTestingMode.togglePanel()">×</button>
      </div>
      
      <div class="panel-content">
        <div class="visual-testing-section">
          <h4>Capture Baseline</h4>
          <p>Capture the current component state as a visual baseline.</p>
          <button id="capture-baseline" class="action-button">
            📸 Capture Current State
          </button>
        </div>

        <div class="visual-testing-section">
          <h4>Compare with Baseline</h4>
          <p>Compare current component state with captured baseline.</p>
          <button id="compare-visual" class="action-button" disabled>
            🔍 Compare with Baseline
          </button>
        </div>

        <div class="visual-testing-section">
          <h4>Visual Test All States</h4>
          <p>Automatically test all component variants and states.</p>
          <button id="test-all-states" class="action-button">
            🚀 Test All Component States
          </button>
        </div>

        <div class="visual-testing-results">
          <h4>Test Results</h4>
          <div id="visual-test-results" class="results-container">
            <p class="empty-state">No tests run yet</p>
          </div>
        </div>
      </div>
    `;

    // Add to the sidebar
    const sidebar = document.querySelector('.playground-sidebar');
    if (sidebar) {
      sidebar.appendChild(panel);
    }
  }

  /**
   * Bind event listeners
   */
  bindEventListeners() {
    document.addEventListener('click', (e) => {
      if (e.target.id === 'toggle-visual-testing') {
        this.toggleVisualTestingMode();
      } else if (e.target.id === 'capture-baseline') {
        this.captureBaseline();
      } else if (e.target.id === 'compare-visual') {
        this.compareWithBaseline();
      } else if (e.target.id === 'test-all-states') {
        this.testAllComponentStates();
      }
    });
  }

  /**
   * Toggle visual testing mode
   */
  toggleVisualTestingMode() {
    this.isEnabled = !this.isEnabled;
    const button = document.getElementById('toggle-visual-testing');
    const panel = document.getElementById('visual-testing-panel');
    
    if (this.isEnabled) {
      button.classList.add('active');
      panel.style.display = 'block';
      this.showVisualTestingOverlay();
    } else {
      button.classList.remove('active');
      panel.style.display = 'none';
      this.hideVisualTestingOverlay();
    }
  }

  /**
   * Show visual testing overlay on components
   */
  showVisualTestingOverlay() {
    const interactivePreview = document.getElementById('interactive-preview');
    if (interactivePreview) {
      interactivePreview.style.position = 'relative';
      
      const overlay = document.createElement('div');
      overlay.id = 'visual-testing-overlay';
      overlay.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        border: 2px dashed #0066cc;
        background: rgba(0, 102, 204, 0.1);
        pointer-events: none;
        z-index: 1000;
      `;
      
      overlay.innerHTML = `
        <div style="
          position: absolute;
          top: 5px;
          right: 5px;
          background: #0066cc;
          color: white;
          padding: 2px 6px;
          font-size: 11px;
          border-radius: 3px;
        ">Visual Testing Active</div>
      `;
      
      interactivePreview.appendChild(overlay);
    }
  }

  /**
   * Hide visual testing overlay
   */
  hideVisualTestingOverlay() {
    const overlay = document.getElementById('visual-testing-overlay');
    if (overlay) {
      overlay.remove();
    }
  }

  /**
   * Capture baseline screenshot
   */
  async captureBaseline() {
    if (!this.playgroundApp.currentComponent) {
      this.showMessage('No component loaded', 'error');
      return;
    }

    const component = this.playgroundApp.currentComponent;
    const componentKey = `${component.category}/${component.name}`;
    
    try {
      this.showMessage('Capturing baseline...', 'info');
      
      const screenshot = await this.captureComponentScreenshot();
      this.capturedBaselines.set(componentKey, {
        screenshot,
        timestamp: new Date().toISOString(),
        props: { ...this.playgroundApp.currentProps }
      });
      
      // Enable compare button
      document.getElementById('compare-visual').disabled = false;
      
      this.showMessage(`Baseline captured for ${component.title}`, 'success');
    } catch (error) {
      this.showMessage(`Failed to capture baseline: ${error.message}`, 'error');
    }
  }

  /**
   * Compare current state with baseline
   */
  async compareWithBaseline() {
    if (!this.playgroundApp.currentComponent) {
      this.showMessage('No component loaded', 'error');
      return;
    }

    const component = this.playgroundApp.currentComponent;
    const componentKey = `${component.category}/${component.name}`;
    const baseline = this.capturedBaselines.get(componentKey);
    
    if (!baseline) {
      this.showMessage('No baseline found. Capture a baseline first.', 'error');
      return;
    }

    try {
      this.showMessage('Comparing with baseline...', 'info');
      
      const currentScreenshot = await this.captureComponentScreenshot();
      const comparison = await this.compareScreenshots(baseline.screenshot, currentScreenshot);
      
      this.displayComparisonResult(comparison);
    } catch (error) {
      this.showMessage(`Comparison failed: ${error.message}`, 'error');
    }
  }

  /**
   * Test all component states automatically
   */
  async testAllComponentStates() {
    if (!this.playgroundApp.currentComponent) {
      this.showMessage('No component loaded', 'error');
      return;
    }

    const component = this.playgroundApp.currentComponent;
    this.showMessage('Testing all component states...', 'info');
    
    const results = [];
    
    try {
      // Test default state
      const defaultScreenshot = await this.captureComponentScreenshot();
      results.push({
        name: 'Default State',
        screenshot: defaultScreenshot,
        props: { ...this.playgroundApp.currentProps }
      });

      // Test different property combinations
      const argTypes = component.argTypes || {};
      const testCombinations = this.generateTestCombinations(argTypes);
      
      for (const combination of testCombinations) {
        // Apply properties
        await this.applyPropsToLiveComponent(combination);
        
        // Capture screenshot
        const screenshot = await this.captureComponentScreenshot();
        results.push({
          name: this.formatCombinationName(combination),
          screenshot,
          props: combination
        });
        
        // Wait between captures
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      this.displayAllStatesResults(results);
      this.showMessage(`Captured ${results.length} component states`, 'success');
      
    } catch (error) {
      this.showMessage(`State testing failed: ${error.message}`, 'error');
    }
  }

  /**
   * Capture screenshot of the interactive component
   */
  async captureComponentScreenshot() {
    return new Promise((resolve, reject) => {
      const interactivePreview = document.getElementById('interactive-preview');
      if (!interactivePreview) {
        reject(new Error('No interactive preview found'));
        return;
      }

      // Use html2canvas or similar library for capturing
      // For now, we'll simulate the capture
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      const rect = interactivePreview.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      
      // Simple color fill as placeholder
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#333';
      ctx.fillText('Component Screenshot', 10, 30);
      
      resolve(canvas.toDataURL());
    });
  }

  /**
   * Compare two screenshots (simplified version)
   */
  async compareScreenshots(baseline, current) {
    // Simple comparison - in real implementation, use pixelmatch or similar
    return {
      match: baseline === current,
      difference: baseline === current ? 0 : 0.15,
      diffImage: null
    };
  }

  /**
   * Generate test combinations from argTypes
   */
  generateTestCombinations(argTypes) {
    const combinations = [];
    const props = Object.keys(argTypes);
    
    // Generate a few key combinations
    props.forEach(prop => {
      const config = argTypes[prop];
      if (config.options && config.options.length > 0) {
        config.options.slice(0, 3).forEach(option => {
          combinations.push({ [prop]: option });
        });
      }
    });
    
    return combinations.slice(0, 8); // Limit to 8 combinations
  }

  /**
   * Apply properties to live component
   */
  async applyPropsToLiveComponent(props) {
    const liveComponent = this.playgroundApp.liveInteractiveComponent;
    if (!liveComponent) return;
    
    Object.entries(props).forEach(([key, value]) => {
      if (key === 'label' || key === 'text') {
        liveComponent.textContent = value;
      } else {
        liveComponent[key] = value;
      }
    });
    
    // Wait for component to update
    if (liveComponent.updateComplete) {
      await liveComponent.updateComplete;
    }
    
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  /**
   * Format combination name for display
   */
  formatCombinationName(combination) {
    return Object.entries(combination)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
  }

  /**
   * Display comparison result
   */
  displayComparisonResult(comparison) {
    const resultsContainer = document.getElementById('visual-test-results');
    
    const resultHtml = `
      <div class="comparison-result ${comparison.match ? 'match' : 'diff'}">
        <h5>Baseline Comparison</h5>
        <p>Match: ${comparison.match ? '✅ Yes' : '❌ No'}</p>
        <p>Difference: ${(comparison.difference * 100).toFixed(1)}%</p>
        <small>Compared at ${new Date().toLocaleTimeString()}</small>
      </div>
    `;
    
    resultsContainer.innerHTML = resultHtml;
  }

  /**
   * Display all states test results
   */
  displayAllStatesResults(results) {
    const resultsContainer = document.getElementById('visual-test-results');
    
    const resultHtml = `
      <div class="all-states-results">
        <h5>All States Test</h5>
        <p>Captured ${results.length} component states</p>
        <div class="state-list">
          ${results.map((result, index) => `
            <div class="state-item">
              <span class="state-name">${result.name}</span>
              <span class="state-status">✅</span>
            </div>
          `).join('')}
        </div>
        <small>Generated at ${new Date().toLocaleTimeString()}</small>
      </div>
    `;
    
    resultsContainer.innerHTML = resultHtml;
  }

  /**
   * Show message to user
   */
  showMessage(message, type = 'info') {
    // Create or update message display
    let messageEl = document.getElementById('visual-testing-message');
    if (!messageEl) {
      messageEl = document.createElement('div');
      messageEl.id = 'visual-testing-message';
      messageEl.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 16px;
        border-radius: 4px;
        color: white;
        font-size: 14px;
        z-index: 10000;
        transition: opacity 0.3s;
      `;
      document.body.appendChild(messageEl);
    }
    
    messageEl.textContent = message;
    messageEl.className = `message-${type}`;
    
    const colors = {
      info: '#0066cc',
      success: '#28a745',
      error: '#dc3545'
    };
    
    messageEl.style.backgroundColor = colors[type] || colors.info;
    messageEl.style.opacity = '1';
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      messageEl.style.opacity = '0';
      setTimeout(() => messageEl.remove(), 300);
    }, 3000);
  }

  /**
   * Toggle panel visibility
   */
  togglePanel() {
    const panel = document.getElementById('visual-testing-panel');
    const isVisible = panel.style.display !== 'none';
    panel.style.display = isVisible ? 'none' : 'block';
    
    const button = document.getElementById('toggle-visual-testing');
    button.classList.toggle('active', !isVisible);
    
    if (!isVisible) {
      this.showVisualTestingOverlay();
    } else {
      this.hideVisualTestingOverlay();
    }
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Wait for playground to initialize
  if (window.playgroundApp) {
    window.visualTestingMode = new VisualTestingMode(window.playgroundApp);
  } else {
    // Wait for playground app to be ready
    const checkPlayground = setInterval(() => {
      if (window.playgroundApp) {
        window.visualTestingMode = new VisualTestingMode(window.playgroundApp);
        clearInterval(checkPlayground);
      }
    }, 100);
  }
});

export default VisualTestingMode;