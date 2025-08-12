/**
 * Advanced Native Web Components Playground Controller
 * 
 * Main application logic that ties together all playground components to create
 * a complete Storybook replacement experience.
 */
import { ComponentLoader } from './core/component-loader.js';
import { PropEditor } from './core/prop-editor.js';
import { StoryExtractor } from './utils/story-extractor.js';
import { KeyboardNavigation } from './core/keyboard-navigation.js';
import { SmartSearch } from './core/smart-search.js';
import { SessionMemory } from './core/session-memory.js';
import { PerformanceOptimizer } from './core/performance-optimizer.js';
import { themeManager } from '../components/theme/theme-manager.js';
import './components/design-system-panel.js';
import analytics from '../services/analytics.js';

class PlaygroundApp {
  constructor() {
    this.componentLoader = new ComponentLoader();
    this.storyExtractor = new StoryExtractor();
    this.currentComponent = null;
    this.currentProps = {};
    
    // Initialize UX enhancement systems
    this.keyboardNavigation = null;
    this.smartSearch = null;
    this.sessionMemory = null;
    this.performanceOptimizer = null;
    this.designSystemPanel = null;
    
    this.initializeApp();
  }

  async initializeApp() {
    console.log('🚀 Initializing Enhanced Playground...');
    
    // Initialize UX enhancement systems first
    this.sessionMemory = new SessionMemory(this);
    this.performanceOptimizer = new PerformanceOptimizer(this);
    
    this.bindEventListeners();
    await this.populateComponentTree();
    
    // Initialize enhanced systems after DOM is ready
    this.keyboardNavigation = new KeyboardNavigation(this);
    this.smartSearch = new SmartSearch(this);
    
    this.setupDesignSystemPanel();
    this.setupPanelToggles();
    this.setupResponsiveControls();
    this.setupCodeGeneration();
    this.setupDeveloperWorkflowShortcuts();
    
    console.log('✨ Enhanced Playground Ready!', {
      keyboardShortcuts: '15 shortcuts available (Press Ctrl+H for help)',
      smartSearch: 'Fuzzy matching and suggestions enabled',
      sessionMemory: 'Component state persistence active',
      performanceOptimizations: 'Caching and lazy loading enabled'
    });
  }

  /**
   * Bind event listeners for UI interactions
   */
  bindEventListeners() {
    // Component search functionality
    const searchInput = document.getElementById('component-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => this.filterComponents(e.target.value));
    }

    // Component generator button
    document.getElementById('generate-component-button')?.addEventListener('click', () => {
      this.openComponentGenerator();
    });

    // Panel toggle buttons
    document.getElementById('toggle-props-panel')?.addEventListener('click', () => {
      this.togglePanel('props-panel');
    });

    document.getElementById('toggle-code-view')?.addEventListener('click', () => {
      this.togglePanel('code-panel');
    });

    document.getElementById('responsive-toggle')?.addEventListener('click', () => {
      this.togglePanel('responsive-panel');
    });

    document.getElementById('analytics-toggle')?.addEventListener('click', () => {
      this.togglePanel('analytics-panel');
    });

    // Listen for prop editor changes
    document.addEventListener('prop-change', (e) => {
      this.handlePropChange(e.detail);
    });

    document.addEventListener('props-reset', (e) => {
      this.handlePropsReset(e.detail);
    });

    // Listen for component generator events
    document.addEventListener('component-generated', (e) => {
      this.handleComponentGenerated(e.detail);
    });

    document.addEventListener('generator-closed', (e) => {
      this.handleGeneratorClosed();
    });
  }

  /**
   * Populate the component tree navigation
   */
  async populateComponentTree() {
    const treeContainer = document.getElementById('component-tree');
    if (!treeContainer) return;

    const availableComponents = this.componentLoader.getAvailableComponents();
    
    let treeHtml = '';
    
    // Build hierarchical component tree
    Object.entries(availableComponents).forEach(([category, components]) => {
      if (components.length > 0) {
        treeHtml += `
          <div class="component-category">
            <h3 class="category-title">${category.charAt(0).toUpperCase() + category.slice(1)}</h3>
            <ul class="component-list">
              ${components.map(componentName => `
                <li class="component-item" data-category="${category}" data-component="${componentName}">
                  <button class="component-button" onclick="playgroundApp.loadComponent('${category}', '${componentName}')">
                    <span class="component-icon">🧩</span>
                    <span class="component-name">${this.formatComponentName(componentName)}</span>
                  </button>
                </li>
              `).join('')}
            </ul>
          </div>
        `;
      }
    });

    treeContainer.innerHTML = treeHtml;
  }

  /**
   * Filter components based on search input
   */
  filterComponents(searchTerm) {
    const searchStart = performance.now();
    const componentItems = document.querySelectorAll('.component-item');
    const term = searchTerm.toLowerCase();
    let visibleCount = 0;

    componentItems.forEach(item => {
      const componentName = item.dataset.component.toLowerCase();
      const category = item.dataset.category.toLowerCase();
      const visible = componentName.includes(term) || category.includes(term);
      item.style.display = visible ? 'block' : 'none';
      if (visible) visibleCount++;
    });

    // Hide categories that have no visible components
    const categories = document.querySelectorAll('.component-category');
    categories.forEach(category => {
      const visibleItems = category.querySelectorAll('.component-item[style*="block"], .component-item:not([style])');
      category.style.display = visibleItems.length > 0 ? 'block' : 'none';
    });

    // Track search analytics
    const searchTime = performance.now() - searchStart;
    analytics.trackSearchQuery(searchTerm, visibleCount, searchTime);
  }

  /**
   * Load and display a component in the playground (Enhanced with UX improvements)
   */
  async loadComponent(category, name) {
    try {
      // Start performance tracking for component switching
      analytics.trackComponentSwitchStart();

      // Record component usage for memory system
      if (this.sessionMemory) {
        this.sessionMemory.recordComponentUsage(category, name);
      }

      // Update keyboard navigation index
      if (this.keyboardNavigation) {
        this.keyboardNavigation.updateCurrentComponentIndex(category, name);
      }

      // Update UI to show loading state
      this.updateComponentTitle(`Loading ${this.formatComponentName(name)}...`);
      
      // Load playground configuration (with performance optimization if available)
      let playgroundConfig;
      if (this.performanceOptimizer && this.performanceOptimizer.optimizedLoadComponent) {
        playgroundConfig = await this.performanceOptimizer.optimizedLoadComponent(category, name);
      } else {
        playgroundConfig = await this.componentLoader.loadPlayground(category, name);
      }
      
      if (playgroundConfig.error) {
        this.showComponentError(playgroundConfig);
        return;
      }

      // Auto-detect properties from actual component
      const componentName = playgroundConfig.component;
      const detectedProps = this.componentLoader.detectComponentProperties(componentName);
      
      // Merge detected properties with playground config and remembered values
      let mergedArgTypes = { ...detectedProps, ...playgroundConfig.argTypes };
      let defaultProps = this.extractDefaultProps(mergedArgTypes);
      
      // Apply remembered properties if available
      if (this.sessionMemory) {
        const rememberedProps = this.sessionMemory.getRememberedProperties(category, name);
        defaultProps = { ...defaultProps, ...rememberedProps };
      }

      this.currentComponent = { ...playgroundConfig, argTypes: mergedArgTypes };
      this.currentProps = defaultProps;

      // Update UI components with live component integration
      this.updateComponentTitle(playgroundConfig.title, playgroundConfig.description);
      this.renderLiveComponentExamples(this.currentComponent);
      
      // Setup props editor after live components are created
      setTimeout(() => {
        this.setupLivePropsEditor(mergedArgTypes, componentName);
      }, 100);
      
      this.updateCodeGeneration();

      // Highlight active component in tree
      this.highlightActiveComponent(category, name);

      // Complete performance tracking
      analytics.trackComponentSwitchEnd(category, name);

    } catch (error) {
      console.error('Error loading component:', error);
      this.showComponentError({ 
        title: `${name} (Error)`,
        description: `Failed to load component: ${error.message}`
      });
      
      // Still complete tracking even on error
      analytics.trackComponentSwitchEnd(category, name);
    }
  }

  /**
   * Render live component examples in the showcase area
   */
  renderLiveComponentExamples(playgroundConfig) {
    const showcaseContainer = document.getElementById('component-showcase');
    if (!showcaseContainer) return;

    let showcaseHtml = `
      <div class="component-header">
        <h3>${playgroundConfig.title}</h3>
        <p>${playgroundConfig.description}</p>
      </div>
    `;

    // Render example groups with live components
    if (playgroundConfig.examples && playgroundConfig.examples.length > 0) {
      playgroundConfig.examples.forEach(exampleGroup => {
        showcaseHtml += `
          <div class="example-group">
            <h4>${exampleGroup.name}</h4>
            <p class="example-description">${exampleGroup.description || ''}</p>
            <div class="example-variants">
              ${(exampleGroup.variants || []).map((variant, index) => `
                <div class="example-variant">
                  <div class="variant-preview" id="variant-${index}">
                    <!-- Live component will be inserted here -->
                  </div>
                  <div class="variant-label">${variant.label}</div>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      });
    }

    // Add interactive playground section with live component
    showcaseHtml += `
      <div class="interactive-playground">
        <h4>Interactive Playground</h4>
        <p>Use the Properties panel to customize this component instance:</p>
        <div class="interactive-preview" id="interactive-preview">
          <!-- Live interactive component will be inserted here -->
        </div>
      </div>
    `;

    showcaseContainer.innerHTML = showcaseHtml;

    // Insert actual live components
    this.insertLiveComponents(playgroundConfig);
  }

  /**
   * Insert actual live component instances
   */
  insertLiveComponents(playgroundConfig) {
    // Insert example variants as live components
    if (playgroundConfig.examples) {
      playgroundConfig.examples.forEach(exampleGroup => {
        (exampleGroup.variants || []).forEach((variant, index) => {
          const container = document.getElementById(`variant-${index}`);
          if (container) {
            const liveComponent = this.createLiveComponent(playgroundConfig.component, variant.props);
            container.appendChild(liveComponent);
          }
        });
      });
    }

    // Insert interactive live component
    const interactiveContainer = document.getElementById('interactive-preview');
    if (interactiveContainer) {
      this.liveInteractiveComponent = this.createLiveComponent(playgroundConfig.component, this.currentProps);
      this.liveInteractiveComponent.id = 'live-interactive-component';
      interactiveContainer.appendChild(this.liveInteractiveComponent);
    }
  }

  /**
   * Create a live component instance
   */
  createLiveComponent(componentName, props) {
    const element = document.createElement(componentName);
    
    // Set properties
    Object.entries(props || {}).forEach(([key, value]) => {
      if (key === 'label' || key === 'text') {
        element.textContent = value;
      } else {
        element[key] = value;
      }
    });

    return element;
  }

  /**
   * Setup the live properties editor panel
   */
  setupLivePropsEditor(argTypes, componentName) {
    const propsContainer = document.getElementById('props-editor-container');
    if (!propsContainer) return;

    // Create or update prop editor component
    let propEditor = propsContainer.querySelector('prop-editor');
    if (!propEditor) {
      propEditor = document.createElement('prop-editor');
      propsContainer.innerHTML = '';
      propsContainer.appendChild(propEditor);
    }

    propEditor.argTypes = argTypes;
    propEditor.values = this.currentProps;
    propEditor.component = componentName;
    
    // Connect to live interactive component
    if (this.liveInteractiveComponent) {
      propEditor.targetComponent = this.liveInteractiveComponent;
    }
  }

  /**
   * Handle property changes from the editor (Enhanced with memory)
   */
  handlePropChange(detail) {
    const { property, value, allValues, targetComponent } = detail;
    this.currentProps = allValues;

    // Track property interaction analytics
    if (this.currentComponent) {
      analytics.trackPropertyInteraction(this.currentComponent.component, property, value, 'change');
    }

    // Remember property values for future sessions
    if (this.sessionMemory && this.currentComponent) {
      const { category, component } = this.parseComponentInfo();
      this.sessionMemory.rememberPropertyValues(category, component, allValues);
    }

    // Update live interactive component
    if (this.liveInteractiveComponent) {
      if (property === 'label' || property === 'text') {
        this.liveInteractiveComponent.textContent = value;
      } else {
        this.liveInteractiveComponent[property] = value;
      }
    }

    this.updateCodeGeneration();
  }

  /**
   * Handle props reset
   */
  handlePropsReset(detail) {
    this.currentProps = detail.values;
    
    // Reset live interactive component
    if (this.liveInteractiveComponent) {
      Object.entries(this.currentProps).forEach(([key, value]) => {
        if (key === 'label' || key === 'text') {
          this.liveInteractiveComponent.textContent = value;
        } else {
          this.liveInteractiveComponent[key] = value;
        }
      });
    }
    
    this.updateCodeGeneration();
  }

  /**
   * Render component HTML string
   */
  renderComponentHTML(componentName, props) {
    const attributes = Object.entries(props || {})
      .map(([key, value]) => {
        if (typeof value === 'boolean') {
          return value ? key : '';
        }
        if (value === null || value === undefined) {
          return '';
        }
        return `${key}="${value}"`;
      })
      .filter(Boolean)
      .join(' ');

    const textContent = props?.label || props?.text || '';
    return `<${componentName} ${attributes}>${textContent}</${componentName}>`;
  }

  /**
   * Setup panel toggle functionality
   */
  setupPanelToggles() {
    this.panelStates = {
      'props-panel': true,
      'code-panel': false,
      'responsive-panel': false,
      'analytics-panel': false,
      'design-system-panel': false
    };
  }

  /**
   * Setup design system panel
   */
  setupDesignSystemPanel() {
    // Create design system panel element
    this.designSystemPanel = document.createElement('design-system-panel');
    document.body.appendChild(this.designSystemPanel);

    // Add theme switcher button to toolbar
    const toolbar = document.querySelector('.toolbar-actions');
    if (toolbar) {
      const themeButton = document.createElement('button');
      themeButton.id = 'theme-toggle';
      themeButton.className = 'tool-button';
      themeButton.title = 'Design System & Themes';
      themeButton.innerHTML = '🎨 Design';
      
      themeButton.addEventListener('click', () => {
        this.toggleDesignSystemPanel();
      });
      
      toolbar.appendChild(themeButton);
    }

    // Initialize theme manager
    if (themeManager) {
      console.log('🎨 Theme Manager initialized with themes:', themeManager.getAvailableThemes().map(t => t.name));
    }
  }

  /**
   * Toggle design system panel visibility
   */
  toggleDesignSystemPanel() {
    if (this.designSystemPanel) {
      const isOpen = this.designSystemPanel.hasAttribute('is-open');
      
      if (isOpen) {
        this.designSystemPanel.removeAttribute('is-open');
        this.designSystemPanel.isOpen = false;
      } else {
        // Close other panels first
        this.closeAllPanels();
        this.designSystemPanel.setAttribute('is-open', '');
        this.designSystemPanel.isOpen = true;
      }
    }
  }

  /**
   * Close all open panels
   */
  closeAllPanels() {
    // Hide traditional panels
    Object.keys(this.panelStates).forEach(panelId => {
      if (panelId !== 'props-panel') { // Keep props panel open
        this.panelStates[panelId] = false;
        const panel = document.getElementById(panelId);
        if (panel) {
          panel.style.display = 'none';
          panel.classList.remove('active');
        }
      }
    });

    // Close design system panel
    if (this.designSystemPanel) {
      this.designSystemPanel.removeAttribute('is-open');
      this.designSystemPanel.isOpen = false;
    }
  }

  /**
   * Toggle visibility of panels (Enhanced with memory)
   */
  togglePanel(panelId) {
    const panel = document.getElementById(panelId);
    if (!panel) return;

    const isVisible = this.panelStates[panelId];
    this.panelStates[panelId] = !isVisible;

    if (!isVisible) {
      panel.style.display = 'block';
      panel.classList.add('active');
      
      // Special handling for analytics panel
      if (panelId === 'analytics-panel') {
        const analyticsComponent = document.getElementById('playground-analytics');
        if (analyticsComponent) {
          analyticsComponent.isVisible = true;
        }
      }
    } else {
      panel.style.display = 'none';
      panel.classList.remove('active');
      
      // Special handling for analytics panel
      if (panelId === 'analytics-panel') {
        const analyticsComponent = document.getElementById('playground-analytics');
        if (analyticsComponent) {
          analyticsComponent.isVisible = false;
        }
      }
    }

    // Update button state
    const buttonSelector = panelId === 'analytics-panel' ? '#analytics-toggle' : `[onclick*="${panelId}"]`;
    const button = document.querySelector(buttonSelector);
    if (button) {
      button.classList.toggle('active', !isVisible);
    }

    // Remember panel state preference
    if (this.sessionMemory) {
      this.sessionMemory.rememberPanelState(panelId, !isVisible);
    }
  }

  /**
   * Setup responsive testing controls
   */
  setupResponsiveControls() {
    const viewportButtons = document.querySelectorAll('.viewport-btn');
    viewportButtons.forEach(button => {
      button.addEventListener('click', () => {
        const width = button.dataset.width;
        const height = button.dataset.height;
        this.setViewportSize(width, height);
        
        // Update active button
        viewportButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
      });
    });
  }

  /**
   * Set viewport size for responsive testing
   */
  setViewportSize(width, height) {
    const showcaseArea = document.getElementById('component-showcase');
    if (!showcaseArea) return;

    if (width === '100%' && height === '100%') {
      showcaseArea.style.maxWidth = '';
      showcaseArea.style.maxHeight = '';
    } else {
      showcaseArea.style.maxWidth = width + 'px';
      showcaseArea.style.maxHeight = height + 'px';
    }
  }

  /**
   * Setup code generation functionality
   */
  setupCodeGeneration() {
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        const tabType = button.dataset.tab;
        this.updateCodeGeneration(tabType);
        
        // Update active tab
        tabButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
      });
    });
  }

  /**
   * Update code generation display
   */
  updateCodeGeneration(format = 'html') {
    const codeElement = document.getElementById('generated-code');
    if (!codeElement || !this.currentComponent) return;

    let generatedCode = '';

    switch (format) {
      case 'html':
        generatedCode = this.generateHTMLCode();
        break;
      case 'lit':
        generatedCode = this.generateLitCode();
        break;
      case 'react':
        generatedCode = this.generateReactCode();
        break;
      default:
        generatedCode = this.generateHTMLCode();
    }

    codeElement.textContent = generatedCode;
  }

  /**
   * Generate HTML code
   */
  generateHTMLCode() {
    return this.renderComponentHTML(this.currentComponent.component, this.currentProps);
  }

  /**
   * Generate Lit template code
   */
  generateLitCode() {
    const componentHTML = this.renderComponentHTML(this.currentComponent.component, this.currentProps);
    return `import { html } from 'lit';

render() {
  return html\`
    ${componentHTML}
  \`;
}`;
  }

  /**
   * Generate React JSX code
   */
  generateReactCode() {
    const componentName = this.currentComponent.component
      .split('-')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join('');

    const propsString = Object.entries(this.currentProps)
      .map(([key, value]) => {
        if (typeof value === 'string') {
          return `${key}="${value}"`;
        } else if (typeof value === 'boolean') {
          return value ? key : '';
        } else {
          return `${key}={${JSON.stringify(value)}}`;
        }
      })
      .filter(Boolean)
      .join(' ');

    const textContent = this.currentProps?.label || this.currentProps?.text || '';

    return `function MyComponent() {
  return (
    <${componentName} ${propsString}>
      ${textContent}
    </${componentName}>
  );
}`;
  }

  /**
   * Utility functions
   */
  formatComponentName(name) {
    return name.split('-').map(part => 
      part.charAt(0).toUpperCase() + part.slice(1)
    ).join(' ');
  }

  updateComponentTitle(title, description = '') {
    const titleElement = document.getElementById('current-component-title');
    const descElement = document.getElementById('current-component-description');
    
    if (titleElement) titleElement.textContent = title;
    if (descElement) descElement.textContent = description;
  }

  extractDefaultProps(argTypes) {
    const defaults = {};
    Object.entries(argTypes || {}).forEach(([prop, config]) => {
      if (config.defaultValue !== undefined) {
        defaults[prop] = config.defaultValue;
      }
    });
    return defaults;
  }

  highlightActiveComponent(category, name) {
    // Remove previous highlights
    document.querySelectorAll('.component-item').forEach(item => {
      item.classList.remove('active');
    });

    // Add highlight to current component
    const activeItem = document.querySelector(
      `.component-item[data-category="${category}"][data-component="${name}"]`
    );
    if (activeItem) {
      activeItem.classList.add('active');
    }
  }

  showComponentError(errorConfig) {
    const showcaseContainer = document.getElementById('component-showcase');
    if (!showcaseContainer) return;

    showcaseContainer.innerHTML = `
      <div class="error-message">
        <h3>⚠️ ${errorConfig.title}</h3>
        <p>${errorConfig.description}</p>
        <p><em>This component may need additional migration work to be playground-ready.</em></p>
      </div>
    `;
  }

  /**
   * Setup developer workflow shortcuts
   */
  setupDeveloperWorkflowShortcuts() {
    this.createPropertyPresets();
    this.setupQuickActions();
  }

  /**
   * Create property presets for components
   */
  createPropertyPresets() {
    // Property presets will be created dynamically based on component usage
    // This is handled by the session memory system
  }

  /**
   * Setup quick action buttons
   */
  setupQuickActions() {
    const toolbar = document.querySelector('.playground-toolbar .toolbar-actions');
    if (!toolbar) return;

    // Add quick copy button
    const copyButton = document.createElement('button');
    copyButton.className = 'tool-button';
    copyButton.innerHTML = '📋 Copy Code';
    copyButton.title = 'Copy generated code (Ctrl+Shift+C)';
    copyButton.addEventListener('click', () => {
      if (this.keyboardNavigation) {
        this.keyboardNavigation.copyGeneratedCode();
      }
    });
    toolbar.appendChild(copyButton);

    // Add performance metrics button
    const metricsButton = document.createElement('button');
    metricsButton.className = 'tool-button';
    metricsButton.innerHTML = '📊 Metrics';
    metricsButton.title = 'Show performance metrics';
    metricsButton.addEventListener('click', () => {
      this.showPerformanceMetrics();
    });
    toolbar.appendChild(metricsButton);

    // Add export/import buttons
    const exportButton = document.createElement('button');
    exportButton.className = 'tool-button';
    exportButton.innerHTML = '💾 Export';
    exportButton.title = 'Export playground configuration (Ctrl+E)';
    exportButton.addEventListener('click', () => {
      if (this.keyboardNavigation) {
        this.keyboardNavigation.exportPlaygroundConfig();
      }
    });
    toolbar.appendChild(exportButton);
  }

  /**
   * Show performance metrics dialog
   */
  showPerformanceMetrics() {
    if (!this.performanceOptimizer) {
      alert('Performance optimizer not initialized');
      return;
    }

    const metrics = this.performanceOptimizer.getPerformanceMetrics();
    const memoryStats = this.sessionMemory ? this.sessionMemory.getMemoryStats() : null;

    const metricsHtml = `
      <div class="performance-metrics">
        <h3>⚡ Performance Metrics</h3>
        
        <div class="metrics-grid">
          <div class="metric-category">
            <h4>Component Switching</h4>
            <div class="metric-item">
              <span>Average Time:</span>
              <span class="metric-value ${metrics.componentSwitching.average < 100 ? 'good' : 'warning'}">
                ${metrics.componentSwitching.average.toFixed(1)}ms
              </span>
            </div>
            <div class="metric-item">
              <span>Target Met:</span>
              <span class="metric-value ${metrics.componentSwitching.percentage > 90 ? 'good' : 'warning'}">
                ${metrics.componentSwitching.percentage.toFixed(1)}%
              </span>
            </div>
          </div>
          
          <div class="metric-category">
            <h4>Search Performance</h4>
            <div class="metric-item">
              <span>Average Time:</span>
              <span class="metric-value ${metrics.search.average < 50 ? 'good' : 'warning'}">
                ${metrics.search.average.toFixed(1)}ms
              </span>
            </div>
            <div class="metric-item">
              <span>Target Met:</span>
              <span class="metric-value ${metrics.search.percentage > 90 ? 'good' : 'warning'}">
                ${metrics.search.percentage.toFixed(1)}%
              </span>
            </div>
          </div>
          
          <div class="metric-category">
            <h4>Caching</h4>
            <div class="metric-item">
              <span>Hit Rate:</span>
              <span class="metric-value ${metrics.caching.hitRate > 70 ? 'good' : 'warning'}">
                ${metrics.caching.hitRate.toFixed(1)}%
              </span>
            </div>
            <div class="metric-item">
              <span>Cache Size:</span>
              <span class="metric-value">${metrics.caching.cacheSize} components</span>
            </div>
          </div>
          
          ${memoryStats ? `
          <div class="metric-category">
            <h4>Session Memory</h4>
            <div class="metric-item">
              <span>Components Used:</span>
              <span class="metric-value">${memoryStats.totalComponents}</span>
            </div>
            <div class="metric-item">
              <span>Total Usage:</span>
              <span class="metric-value">${memoryStats.totalUsage}</span>
            </div>
          </div>
          ` : ''}
        </div>
      </div>
    `;

    if (this.keyboardNavigation) {
      this.keyboardNavigation.showModal('Performance Metrics', metricsHtml);
    }
  }

  /**
   * Parse current component info
   */
  parseComponentInfo() {
    if (!this.currentComponent || !this.currentComponent.component) {
      return { category: null, component: null };
    }

    // Try to determine category from current selection
    const activeItem = document.querySelector('.component-item.active');
    if (activeItem) {
      return {
        category: activeItem.dataset.category,
        component: activeItem.dataset.component
      };
    }

    // Fallback - try to guess from component name
    const componentName = this.currentComponent.component;
    if (componentName.includes('atom') || ['button', 'input', 'icon', 'badge'].some(atom => componentName.includes(atom))) {
      return { category: 'atoms', component: componentName };
    } else if (componentName.includes('molecule') || ['card', 'modal', 'form'].some(mol => componentName.includes(mol))) {
      return { category: 'molecules', component: componentName };
    } else {
      return { category: 'organisms', component: componentName };
    }
  }

  /**
   * Open the component generator modal
   */
  openComponentGenerator() {
    const generatorModal = document.getElementById('component-generator-modal');
    if (generatorModal) {
      generatorModal.open();
    }
  }

  /**
   * Handle successful component generation
   * @param {Object} generationResult - Result from component generator
   */
  handleComponentGenerated(generationResult) {
    console.log('🧩 Component Generated:', generationResult);
    
    // Show success notification
    this.showNotification('success', `Component "${generationResult.config.componentName}" generated successfully!`);
    
    // Log the generation result for developer
    console.group('📋 Component Generation Result');
    console.log('Config:', generationResult.config);
    console.log('Files:', generationResult.files);
    console.log('Loader Update:', generationResult.loaderUpdate);
    console.log('Index Updates:', generationResult.indexUpdates);
    console.groupEnd();

    // Show integration instructions
    setTimeout(() => {
      this.showIntegrationInstructions(generationResult);
    }, 2000);
  }

  /**
   * Handle component generator modal closed
   */
  handleGeneratorClosed() {
    // Focus back to playground
    const toolbar = document.querySelector('.playground-toolbar');
    if (toolbar) {
      toolbar.focus();
    }
  }

  /**
   * Show notification message
   * @param {string} type - Notification type (success, error, info)
   * @param {string} message - Message to display
   */
  showNotification(type, message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <span class="notification-icon">
          ${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}
        </span>
        <span class="notification-message">${message}</span>
        <button class="notification-close">×</button>
      </div>
    `;

    // Add styles
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? '#d4edda' : type === 'error' ? '#f8d7da' : '#cce7ff'};
      color: ${type === 'success' ? '#155724' : type === 'error' ? '#721c24' : '#004085'};
      padding: 1rem;
      border-radius: 6px;
      border: 1px solid ${type === 'success' ? '#c3e6cb' : type === 'error' ? '#f5c6cb' : '#bee5eb'};
      z-index: 1001;
      max-width: 400px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      animation: slideInRight 0.3s ease;
    `;

    // Add animation styles
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideInRight {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      .notification-content {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      .notification-message {
        flex: 1;
      }
      .notification-close {
        background: none;
        border: none;
        font-size: 1.2rem;
        cursor: pointer;
        color: inherit;
        opacity: 0.7;
      }
      .notification-close:hover {
        opacity: 1;
      }
    `;
    document.head.appendChild(style);

    // Add to page
    document.body.appendChild(notification);

    // Close functionality
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
      notification.remove();
    });

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 5000);
  }

  /**
   * Show integration instructions modal
   * @param {Object} generationResult - Generation result
   */
  showIntegrationInstructions(generationResult) {
    const instructions = `
      <div style="max-width: 600px; padding: 1rem;">
        <h3>🚀 Integration Instructions</h3>
        <p style="margin: 1rem 0;">Your component has been generated! Follow these steps to integrate it:</p>
        
        <div style="background: #f8f9fa; padding: 1rem; border-radius: 6px; margin: 1rem 0;">
          <h4>1. Create Files</h4>
          <p>Create these files in your project:</p>
          <ul style="margin: 0.5rem 0 0 1.5rem;">
            ${Object.keys(generationResult.files).map(file => `<li><code>${file}</code></li>`).join('')}
          </ul>
        </div>
        
        <div style="background: #f8f9fa; padding: 1rem; border-radius: 6px; margin: 1rem 0;">
          <h4>2. Update ComponentLoader</h4>
          <p>Add the following to <code>ComponentLoader.loadComponent()</code> in the <code>${generationResult.config.category}</code> switch statement:</p>
          <pre style="background: #fff; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px; font-size: 0.8rem; overflow-x: auto;"><code>${generationResult.loaderUpdate.categoryUpdate.importStatement}</code></pre>
        </div>
        
        <div style="background: #f8f9fa; padding: 1rem; border-radius: 6px; margin: 1rem 0;">
          <h4>3. Update Available Components</h4>
          <p>Add <code>'${generationResult.config.name}'</code> to the <code>${generationResult.config.category}</code> array in <code>getAvailableComponents()</code></p>
        </div>
        
        <div style="background: #e8f5e8; padding: 1rem; border-radius: 6px; margin: 1rem 0; border-left: 4px solid #28a745;">
          <h4>✨ What's Next?</h4>
          <ul style="margin: 0.5rem 0 0 1.5rem;">
            <li>Customize the component's styles and functionality</li>
            <li>Add more properties as needed</li>
            <li>Test the component in the playground</li>
            <li>Write additional tests</li>
          </ul>
        </div>
        
        <p style="margin: 1rem 0 0 0; font-size: 0.9rem; color: #666;">
          💡 <strong>Tip:</strong> All generated code follows the existing project patterns and includes comprehensive tests!
        </p>
      </div>
    `;

    if (this.keyboardNavigation) {
      this.keyboardNavigation.showModal('Component Integration', instructions);
    } else {
      // Fallback: show in console
      console.log('Integration Instructions:', generationResult);
    }
  }

  /**
   * Get UX enhancement statistics
   */
  getUXStats() {
    const stats = {
      keyboardShortcuts: this.keyboardNavigation ? 15 : 0,
      searchFeatures: this.smartSearch ? this.smartSearch.getSearchMetrics() : null,
      memoryFeatures: this.sessionMemory ? this.sessionMemory.getMemoryStats() : null,
      performanceFeatures: this.performanceOptimizer ? this.performanceOptimizer.getMemoryStats() : null
    };

    console.log('UX Enhancement Statistics:', stats);
    return stats;
  }
}

// Initialize playground when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.playgroundApp = new PlaygroundApp();
});

// Export for testing
export { PlaygroundApp };