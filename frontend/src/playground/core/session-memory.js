/**
 * Session Memory System for Playground
 * 
 * Provides intelligent persistence and memory:
 * - Component state memory across sessions
 * - Property value persistence per component
 * - Panel state restoration
 * - Smart defaults based on usage patterns
 * - Performance-optimized storage
 */

export class SessionMemory {
  constructor(playgroundApp) {
    this.app = playgroundApp;
    this.storagePrefix = 'playground-';
    this.memoryData = {};
    this.componentUsage = {};
    this.propertyDefaults = {};
    this.panelPreferences = {};
    
    this.initializeMemory();
  }

  /**
   * Initialize memory system
   */
  initializeMemory() {
    this.loadMemoryData();
    this.setupAutoSave();
    this.restoreSession();
  }

  /**
   * Load all memory data from storage
   */
  loadMemoryData() {
    try {
      // Load component usage statistics
      const usageData = localStorage.getItem(this.storagePrefix + 'component-usage');
      if (usageData) {
        this.componentUsage = JSON.parse(usageData);
      }

      // Load property defaults for each component
      const defaultsData = localStorage.getItem(this.storagePrefix + 'property-defaults');
      if (defaultsData) {
        this.propertyDefaults = JSON.parse(defaultsData);
      }

      // Load panel preferences
      const panelData = localStorage.getItem(this.storagePrefix + 'panel-preferences');
      if (panelData) {
        this.panelPreferences = JSON.parse(panelData);
      }

      // Load last session state
      const sessionData = localStorage.getItem(this.storagePrefix + 'last-session');
      if (sessionData) {
        this.memoryData = JSON.parse(sessionData);
      }

      console.log('Memory system loaded:', {
        components: Object.keys(this.componentUsage).length,
        propertyDefaults: Object.keys(this.propertyDefaults).length,
        lastSession: !!this.memoryData.lastComponent
      });

    } catch (e) {
      console.warn('Failed to load memory data:', e);
      this.initializeEmptyMemory();
    }
  }

  /**
   * Initialize empty memory structure
   */
  initializeEmptyMemory() {
    this.componentUsage = {};
    this.propertyDefaults = {};
    this.panelPreferences = {
      'props-panel': true,
      'code-panel': false,
      'responsive-panel': false
    };
    this.memoryData = {
      lastComponent: null,
      lastProps: {},
      sessionStartTime: Date.now()
    };
  }

  /**
   * Setup auto-save mechanism
   */
  setupAutoSave() {
    // Save memory data every 30 seconds
    setInterval(() => {
      this.saveMemoryData();
    }, 30000);

    // Save on page unload
    window.addEventListener('beforeunload', () => {
      this.saveMemoryData();
    });

    // Save on visibility change (tab switch)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.saveMemoryData();
      }
    });
  }

  /**
   * Save all memory data to storage
   */
  saveMemoryData() {
    try {
      localStorage.setItem(this.storagePrefix + 'component-usage', JSON.stringify(this.componentUsage));
      localStorage.setItem(this.storagePrefix + 'property-defaults', JSON.stringify(this.propertyDefaults));
      localStorage.setItem(this.storagePrefix + 'panel-preferences', JSON.stringify(this.panelPreferences));
      localStorage.setItem(this.storagePrefix + 'last-session', JSON.stringify(this.memoryData));
      
      console.log('Memory data saved successfully');
    } catch (e) {
      console.warn('Failed to save memory data:', e);
    }
  }

  /**
   * Restore previous session state
   */
  restoreSession() {
    // Restore panel states
    this.restorePanelStates();
    
    // Restore last component if available
    if (this.memoryData.lastComponent) {
      setTimeout(() => {
        const { category, name } = this.memoryData.lastComponent;
        if (category && name) {
          console.log('Restoring last component:', category, name);
          this.app.loadComponent(category, name);
        }
      }, 500); // Small delay to ensure DOM is ready
    }
  }

  /**
   * Restore panel states
   */
  restorePanelStates() {
    Object.entries(this.panelPreferences).forEach(([panelId, isVisible]) => {
      const panel = document.getElementById(panelId);
      if (panel) {
        panel.style.display = isVisible ? 'block' : 'none';
        panel.classList.toggle('active', isVisible);
        
        // Update button state
        const button = document.querySelector(`[onclick*="${panelId}"]`);
        if (button) {
          button.classList.toggle('active', isVisible);
        }
      }
    });

    // Update app panel states if available
    if (this.app.panelStates) {
      this.app.panelStates = { ...this.app.panelStates, ...this.panelPreferences };
    }
  }

  /**
   * Record component usage
   */
  recordComponentUsage(category, name) {
    const componentKey = `${category}-${name}`;
    
    if (!this.componentUsage[componentKey]) {
      this.componentUsage[componentKey] = {
        category,
        name,
        count: 0,
        lastUsed: Date.now(),
        totalTimeSpent: 0,
        startTime: Date.now()
      };
    }
    
    const usage = this.componentUsage[componentKey];
    usage.count++;
    usage.lastUsed = Date.now();
    usage.startTime = Date.now();
    
    // Update memory data
    this.memoryData.lastComponent = { category, name };
    this.memoryData.lastComponentStartTime = Date.now();
    
    console.log(`Recorded usage for ${name}:`, usage.count, 'times');
  }

  /**
   * Record time spent on component
   */
  recordTimeSpent(category, name) {
    const componentKey = `${category}-${name}`;
    const usage = this.componentUsage[componentKey];
    
    if (usage && usage.startTime) {
      const timeSpent = Date.now() - usage.startTime;
      usage.totalTimeSpent += timeSpent;
      usage.startTime = null;
    }
  }

  /**
   * Remember property values for a component
   */
  rememberPropertyValues(category, name, properties) {
    const componentKey = `${category}-${name}`;
    
    if (!this.propertyDefaults[componentKey]) {
      this.propertyDefaults[componentKey] = {};
    }
    
    // Update remembered properties
    Object.entries(properties).forEach(([prop, value]) => {
      // Only remember if different from default
      if (value !== undefined && value !== null && value !== '') {
        this.propertyDefaults[componentKey][prop] = value;
      }
    });
    
    // Update memory data
    this.memoryData.lastProps = properties;
    
    console.log(`Remembered properties for ${name}:`, this.propertyDefaults[componentKey]);
  }

  /**
   * Get remembered property values for a component
   */
  getRememberedProperties(category, name) {
    const componentKey = `${category}-${name}`;
    const remembered = this.propertyDefaults[componentKey] || {};
    
    console.log(`Retrieved remembered properties for ${name}:`, remembered);
    return remembered;
  }

  /**
   * Remember panel state change
   */
  rememberPanelState(panelId, isVisible) {
    this.panelPreferences[panelId] = isVisible;
    console.log(`Remembered panel state: ${panelId} = ${isVisible}`);
  }

  /**
   * Get smart defaults based on usage patterns
   */
  getSmartDefaults(category, name) {
    const componentKey = `${category}-${name}`;
    const usage = this.componentUsage[componentKey];
    const remembered = this.propertyDefaults[componentKey] || {};
    
    // If this component has been used before, return remembered values
    if (usage && usage.count > 0) {
      return remembered;
    }
    
    // For new components, suggest popular property combinations
    return this.getSuggestedDefaults(category, name);
  }

  /**
   * Get suggested defaults for new components
   */
  getSuggestedDefaults(category, name) {
    const suggestions = {};
    
    // Component-specific suggestions based on common patterns
    const defaultPatterns = {
      'button': {
        variant: 'primary',
        size: 'medium',
        label: 'Click me'
      },
      'input': {
        placeholder: 'Enter text...',
        type: 'text'
      },
      'card': {
        title: 'Sample Card',
        elevated: true
      },
      'modal': {
        title: 'Modal Title',
        size: 'medium'
      },
      'badge': {
        label: 'Badge',
        variant: 'info'
      },
      'icon': {
        name: 'star',
        size: 24
      },
      'spinner': {
        size: 'medium'
      },
      'progress': {
        value: 50,
        max: 100
      }
    };

    // Find matching patterns
    Object.entries(defaultPatterns).forEach(([pattern, defaults]) => {
      if (name.includes(pattern)) {
        Object.assign(suggestions, defaults);
      }
    });

    return suggestions;
  }

  /**
   * Get frequently used components
   */
  getFrequentComponents(limit = 5) {
    return Object.values(this.componentUsage)
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
      .map(usage => ({
        category: usage.category,
        name: usage.name,
        count: usage.count,
        displayName: this.formatComponentName(usage.name)
      }));
  }

  /**
   * Get recently used components
   */
  getRecentComponents(limit = 5) {
    return Object.values(this.componentUsage)
      .sort((a, b) => b.lastUsed - a.lastUsed)
      .slice(0, limit)
      .map(usage => ({
        category: usage.category,
        name: usage.name,
        lastUsed: usage.lastUsed,
        displayName: this.formatComponentName(usage.name)
      }));
  }

  /**
   * Get component usage analytics
   */
  getUsageAnalytics() {
    const components = Object.values(this.componentUsage);
    
    return {
      totalComponents: components.length,
      totalUsage: components.reduce((sum, usage) => sum + usage.count, 0),
      totalTimeSpent: components.reduce((sum, usage) => sum + usage.totalTimeSpent, 0),
      averageTimePerComponent: components.length > 0 ? 
        components.reduce((sum, usage) => sum + usage.totalTimeSpent, 0) / components.length : 0,
      mostUsed: components.sort((a, b) => b.count - a.count)[0],
      sessionDuration: Date.now() - this.memoryData.sessionStartTime
    };
  }

  /**
   * Create property presets based on usage patterns
   */
  createPropertyPresets(category, name) {
    const componentKey = `${category}-${name}`;
    const usage = this.componentUsage[componentKey];
    
    if (!usage || usage.count < 3) {
      return this.getDefaultPresets(category, name);
    }

    // Analyze remembered properties to create intelligent presets
    const remembered = this.propertyDefaults[componentKey] || {};
    const presets = [];

    // Create presets based on component type
    if (name.includes('button')) {
      presets.push(
        { name: 'Primary', props: { variant: 'primary', size: 'medium', ...remembered } },
        { name: 'Secondary', props: { variant: 'secondary', size: 'medium', ...remembered } },
        { name: 'Small', props: { variant: 'primary', size: 'small', ...remembered } }
      );
    } else if (name.includes('card')) {
      presets.push(
        { name: 'Elevated', props: { elevated: true, ...remembered } },
        { name: 'Flat', props: { elevated: false, ...remembered } },
        { name: 'Large', props: { size: 'large', ...remembered } }
      );
    } else {
      // Generic presets
      presets.push(
        { name: 'Default', props: { ...remembered } },
        { name: 'Small', props: { size: 'small', ...remembered } },
        { name: 'Large', props: { size: 'large', ...remembered } }
      );
    }

    return presets;
  }

  /**
   * Get default presets for components
   */
  getDefaultPresets(category, name) {
    const presets = [];

    if (name.includes('button')) {
      presets.push(
        { name: 'Primary', props: { variant: 'primary', size: 'medium', label: 'Primary Button' } },
        { name: 'Secondary', props: { variant: 'secondary', size: 'medium', label: 'Secondary Button' } },
        { name: 'Danger', props: { variant: 'danger', size: 'medium', label: 'Danger Button' } }
      );
    } else if (name.includes('input')) {
      presets.push(
        { name: 'Text Input', props: { type: 'text', placeholder: 'Enter text...' } },
        { name: 'Email Input', props: { type: 'email', placeholder: 'Enter email...' } },
        { name: 'Password Input', props: { type: 'password', placeholder: 'Enter password...' } }
      );
    } else {
      presets.push(
        { name: 'Default', props: {} },
        { name: 'Small', props: { size: 'small' } },
        { name: 'Large', props: { size: 'large' } }
      );
    }

    return presets;
  }

  /**
   * Export memory data for backup
   */
  exportMemoryData() {
    const exportData = {
      componentUsage: this.componentUsage,
      propertyDefaults: this.propertyDefaults,
      panelPreferences: this.panelPreferences,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `playground-memory-${Date.now()}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    
    console.log('Memory data exported');
    return exportData;
  }

  /**
   * Import memory data from backup
   */
  importMemoryData(data) {
    try {
      if (data.version && data.componentUsage) {
        this.componentUsage = { ...this.componentUsage, ...data.componentUsage };
        this.propertyDefaults = { ...this.propertyDefaults, ...data.propertyDefaults };
        this.panelPreferences = { ...this.panelPreferences, ...data.panelPreferences };
        
        this.saveMemoryData();
        console.log('Memory data imported successfully');
        return true;
      }
    } catch (e) {
      console.error('Failed to import memory data:', e);
    }
    return false;
  }

  /**
   * Clear all memory data
   */
  clearMemoryData() {
    this.componentUsage = {};
    this.propertyDefaults = {};
    this.panelPreferences = {
      'props-panel': true,
      'code-panel': false,
      'responsive-panel': false
    };
    this.memoryData = {
      lastComponent: null,
      lastProps: {},
      sessionStartTime: Date.now()
    };

    // Clear from storage
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(this.storagePrefix)) {
        localStorage.removeItem(key);
      }
    });

    console.log('Memory data cleared');
  }

  /**
   * Format component name for display
   */
  formatComponentName(name) {
    return name.split('-').map(part => 
      part.charAt(0).toUpperCase() + part.slice(1)
    ).join(' ');
  }

  /**
   * Get memory statistics
   */
  getMemoryStats() {
    const analytics = this.getUsageAnalytics();
    
    return {
      ...analytics,
      memorySize: JSON.stringify({
        componentUsage: this.componentUsage,
        propertyDefaults: this.propertyDefaults,
        panelPreferences: this.panelPreferences
      }).length,
      componentsWithDefaults: Object.keys(this.propertyDefaults).length,
      storageKeys: Object.keys(localStorage).filter(key => key.startsWith(this.storagePrefix)).length
    };
  }
}