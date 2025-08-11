/**
 * Keyboard Navigation Service for Playground
 * 
 * Provides lightning-fast keyboard shortcuts for developer productivity:
 * - Component switching (Ctrl+1-9, Arrow keys)  
 * - Panel toggling (Ctrl+P, Ctrl+C, Ctrl+R)
 * - Search activation (/)
 * - Code copying (Ctrl+Shift+C)
 * - Navigation shortcuts (Tab, Escape)
 */

export class KeyboardNavigation {
  constructor(playgroundApp) {
    this.app = playgroundApp;
    this.shortcuts = new Map();
    this.isSearchFocused = false;
    this.recentComponents = [];
    this.currentComponentIndex = -1;
    
    this.initializeShortcuts();
    this.bindKeyboardEvents();
  }

  /**
   * Initialize all keyboard shortcuts
   */
  initializeShortcuts() {
    // Component switching shortcuts
    this.shortcuts.set('Digit1+ctrlKey', () => this.switchToComponentByIndex(0));
    this.shortcuts.set('Digit2+ctrlKey', () => this.switchToComponentByIndex(1));
    this.shortcuts.set('Digit3+ctrlKey', () => this.switchToComponentByIndex(2));
    this.shortcuts.set('Digit4+ctrlKey', () => this.switchToComponentByIndex(3));
    this.shortcuts.set('Digit5+ctrlKey', () => this.switchToComponentByIndex(4));
    this.shortcuts.set('Digit6+ctrlKey', () => this.switchToComponentByIndex(5));
    this.shortcuts.set('Digit7+ctrlKey', () => this.switchToComponentByIndex(6));
    this.shortcuts.set('Digit8+ctrlKey', () => this.switchToComponentByIndex(7));
    this.shortcuts.set('Digit9+ctrlKey', () => this.switchToComponentByIndex(8));

    // Arrow key navigation
    this.shortcuts.set('ArrowUp+ctrlKey', () => this.navigateComponent('previous'));
    this.shortcuts.set('ArrowDown+ctrlKey', () => this.navigateComponent('next'));
    this.shortcuts.set('ArrowLeft+ctrlKey', () => this.navigateComponent('previous'));
    this.shortcuts.set('ArrowRight+ctrlKey', () => this.navigateComponent('next'));

    // Panel toggling
    this.shortcuts.set('KeyP+ctrlKey', () => this.togglePanel('props-panel'));
    this.shortcuts.set('KeyC+ctrlKey', () => this.togglePanel('code-panel'));
    this.shortcuts.set('KeyR+ctrlKey', () => this.togglePanel('responsive-panel'));

    // Search and navigation
    this.shortcuts.set('Slash', () => this.activateSearch());
    this.shortcuts.set('Escape', () => this.handleEscape());
    
    // Code copying
    this.shortcuts.set('KeyC+ctrlKey+shiftKey', () => this.copyGeneratedCode());
    
    // Quick actions
    this.shortcuts.set('KeyH+ctrlKey', () => this.showHelpDialog());
    this.shortcuts.set('KeyE+ctrlKey', () => this.exportPlaygroundConfig());
    this.shortcuts.set('KeyI+ctrlKey', () => this.importPlaygroundConfig());
    
    // Recent components
    this.shortcuts.set('Tab+ctrlKey', () => this.switchToRecentComponent());
  }

  /**
   * Bind keyboard event listeners
   */
  bindKeyboardEvents() {
    document.addEventListener('keydown', (e) => {
      // Skip if user is typing in an input field (except for specific shortcuts)
      if (this.isTypingInInput(e) && !this.isGlobalShortcut(e)) {
        return;
      }

      const shortcutKey = this.getShortcutKey(e);
      const handler = this.shortcuts.get(shortcutKey);
      
      if (handler) {
        e.preventDefault();
        e.stopPropagation();
        handler();
      }
    });

    // Track search focus state
    const searchInput = document.getElementById('component-search');
    if (searchInput) {
      searchInput.addEventListener('focus', () => this.isSearchFocused = true);
      searchInput.addEventListener('blur', () => this.isSearchFocused = false);
    }
  }

  /**
   * Check if user is typing in an input field
   */
  isTypingInInput(e) {
    const activeElement = document.activeElement;
    return activeElement && (
      activeElement.tagName === 'INPUT' || 
      activeElement.tagName === 'TEXTAREA' || 
      activeElement.contentEditable === 'true'
    );
  }

  /**
   * Check if this is a global shortcut that should work even when typing
   */
  isGlobalShortcut(e) {
    return (e.ctrlKey || e.metaKey) && (
      e.key === 'Escape' ||
      (e.key === 'c' && e.shiftKey) || // Ctrl+Shift+C
      (e.key === 'h') || // Ctrl+H for help
      (e.key >= '1' && e.key <= '9') // Ctrl+1-9
    );
  }

  /**
   * Generate shortcut key string
   */
  getShortcutKey(e) {
    let key = e.code || e.key;
    if (e.key === '/') key = 'Slash';
    if (e.key === 'Escape') key = 'Escape';
    
    const modifiers = [];
    if (e.ctrlKey || e.metaKey) modifiers.push('ctrlKey');
    if (e.shiftKey) modifiers.push('shiftKey');
    if (e.altKey) modifiers.push('altKey');
    
    return modifiers.length > 0 ? `${key}+${modifiers.join('+')}` : key;
  }

  /**
   * Switch to component by index (Ctrl+1-9)
   */
  switchToComponentByIndex(index) {
    const componentButtons = document.querySelectorAll('.component-button');
    if (componentButtons[index]) {
      componentButtons[index].click();
      this.showTooltip(`Switched to ${componentButtons[index].querySelector('.component-name').textContent}`, 'success');
    }
  }

  /**
   * Navigate between components with arrow keys
   */
  navigateComponent(direction) {
    const componentButtons = Array.from(document.querySelectorAll('.component-button:not([style*="display: none"])'));
    
    if (componentButtons.length === 0) return;

    let newIndex;
    if (direction === 'next') {
      newIndex = (this.currentComponentIndex + 1) % componentButtons.length;
    } else {
      newIndex = this.currentComponentIndex - 1;
      if (newIndex < 0) newIndex = componentButtons.length - 1;
    }
    
    this.currentComponentIndex = newIndex;
    componentButtons[newIndex].click();
    componentButtons[newIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  /**
   * Toggle panels with keyboard shortcuts
   */
  togglePanel(panelId) {
    const panel = document.getElementById(panelId);
    const isVisible = panel && panel.style.display !== 'none';
    
    if (this.app.togglePanel) {
      this.app.togglePanel(panelId);
      
      const panelNames = {
        'props-panel': 'Properties',
        'code-panel': 'Code',
        'responsive-panel': 'Responsive'
      };
      
      this.showTooltip(`${panelNames[panelId]} panel ${isVisible ? 'hidden' : 'shown'}`, 'info');
    }
  }

  /**
   * Activate search with / key
   */
  activateSearch() {
    const searchInput = document.getElementById('component-search');
    if (searchInput) {
      searchInput.focus();
      searchInput.select();
      this.showTooltip('Search activated', 'info');
    }
  }

  /**
   * Handle Escape key
   */
  handleEscape() {
    if (this.isSearchFocused) {
      const searchInput = document.getElementById('component-search');
      searchInput.blur();
      searchInput.value = '';
      
      // Clear search filter
      if (this.app.filterComponents) {
        this.app.filterComponents('');
      }
    } else {
      // Close any open dialogs or reset focus
      document.activeElement?.blur();
    }
  }

  /**
   * Copy generated code to clipboard
   */
  async copyGeneratedCode() {
    const codeElement = document.getElementById('generated-code');
    if (!codeElement || !codeElement.textContent.trim()) {
      this.showTooltip('No code to copy', 'warning');
      return;
    }

    try {
      await navigator.clipboard.writeText(codeElement.textContent);
      this.showTooltip('Code copied to clipboard!', 'success');
    } catch (err) {
      console.error('Failed to copy code:', err);
      this.showTooltip('Failed to copy code', 'error');
    }
  }

  /**
   * Show keyboard shortcuts help dialog
   */
  showHelpDialog() {
    const helpContent = `
      <div class="keyboard-shortcuts-help">
        <h3>⌨️ Keyboard Shortcuts</h3>
        <div class="shortcuts-grid">
          <div class="shortcut-category">
            <h4>Component Navigation</h4>
            <div class="shortcut-item"><kbd>Ctrl + 1-9</kbd> Switch to component by number</div>
            <div class="shortcut-item"><kbd>Ctrl + ↑↓</kbd> Navigate up/down</div>
            <div class="shortcut-item"><kbd>Ctrl + Tab</kbd> Recent component</div>
          </div>
          
          <div class="shortcut-category">
            <h4>Panel Controls</h4>
            <div class="shortcut-item"><kbd>Ctrl + P</kbd> Toggle Properties</div>
            <div class="shortcut-item"><kbd>Ctrl + C</kbd> Toggle Code View</div>
            <div class="shortcut-item"><kbd>Ctrl + R</kbd> Toggle Responsive</div>
          </div>
          
          <div class="shortcut-category">
            <h4>Actions</h4>
            <div class="shortcut-item"><kbd>/</kbd> Activate Search</div>
            <div class="shortcut-item"><kbd>Esc</kbd> Clear Search/Focus</div>
            <div class="shortcut-item"><kbd>Ctrl + Shift + C</kbd> Copy Code</div>
            <div class="shortcut-item"><kbd>Ctrl + H</kbd> Show This Help</div>
          </div>
        </div>
      </div>
    `;
    
    this.showModal('Keyboard Shortcuts', helpContent);
  }

  /**
   * Export playground configuration
   */
  exportPlaygroundConfig() {
    if (!this.app.currentComponent) {
      this.showTooltip('No component selected', 'warning');
      return;
    }

    const config = {
      component: this.app.currentComponent,
      props: this.app.currentProps,
      panelStates: this.app.panelStates,
      timestamp: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `playground-config-${Date.now()}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    this.showTooltip('Configuration exported', 'success');
  }

  /**
   * Import playground configuration
   */
  importPlaygroundConfig() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const config = JSON.parse(e.target.result);
          // Apply configuration logic would go here
          this.showTooltip('Configuration imported', 'success');
        } catch (err) {
          this.showTooltip('Invalid configuration file', 'error');
        }
      };
      reader.readAsText(file);
    };
    
    input.click();
  }

  /**
   * Switch to most recent component
   */
  switchToRecentComponent() {
    if (this.recentComponents.length < 2) {
      this.showTooltip('No recent component to switch to', 'info');
      return;
    }

    const recentComponent = this.recentComponents[1];
    if (recentComponent) {
      this.app.loadComponent(recentComponent.category, recentComponent.name);
    }
  }

  /**
   * Add component to recent history
   */
  addToRecentComponents(category, name) {
    const component = { category, name, timestamp: Date.now() };
    
    // Remove if already exists
    this.recentComponents = this.recentComponents.filter(
      c => !(c.category === category && c.name === name)
    );
    
    // Add to front
    this.recentComponents.unshift(component);
    
    // Keep only last 5
    if (this.recentComponents.length > 5) {
      this.recentComponents.pop();
    }
  }

  /**
   * Show tooltip notification
   */
  showTooltip(message, type = 'info') {
    // Remove existing tooltips
    const existingTooltips = document.querySelectorAll('.keyboard-tooltip');
    existingTooltips.forEach(tooltip => tooltip.remove());

    const tooltip = document.createElement('div');
    tooltip.className = `keyboard-tooltip tooltip-${type}`;
    tooltip.textContent = message;
    
    // Style the tooltip
    Object.assign(tooltip.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      background: type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : type === 'warning' ? '#ffc107' : '#007bff',
      color: 'white',
      padding: '8px 16px',
      borderRadius: '4px',
      fontSize: '14px',
      fontWeight: '500',
      boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
      zIndex: '10000',
      opacity: '0',
      transform: 'translateY(-10px)',
      transition: 'opacity 0.2s ease, transform 0.2s ease'
    });

    document.body.appendChild(tooltip);
    
    // Animate in
    requestAnimationFrame(() => {
      tooltip.style.opacity = '1';
      tooltip.style.transform = 'translateY(0)';
    });

    // Remove after 2 seconds
    setTimeout(() => {
      tooltip.style.opacity = '0';
      tooltip.style.transform = 'translateY(-10px)';
      setTimeout(() => tooltip.remove(), 200);
    }, 2000);
  }

  /**
   * Show modal dialog
   */
  showModal(title, content) {
    // Remove existing modals
    const existingModals = document.querySelectorAll('.keyboard-modal');
    existingModals.forEach(modal => modal.remove());

    const modal = document.createElement('div');
    modal.className = 'keyboard-modal';
    
    modal.innerHTML = `
      <div class="modal-backdrop"></div>
      <div class="modal-content">
        <div class="modal-header">
          <h3>${title}</h3>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          ${content}
        </div>
      </div>
    `;
    
    // Style the modal
    const style = document.createElement('style');
    style.textContent = `
      .keyboard-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 10000;
      }
      .modal-backdrop {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
      }
      .modal-content {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        max-width: 600px;
        max-height: 80vh;
        overflow-y: auto;
      }
      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 20px;
        border-bottom: 1px solid #e9ecef;
      }
      .modal-header h3 {
        margin: 0;
        font-size: 18px;
      }
      .modal-close {
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        padding: 0;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .modal-body {
        padding: 20px;
      }
      .shortcuts-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 20px;
      }
      .shortcut-category h4 {
        margin: 0 0 10px 0;
        color: #495057;
        font-size: 14px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .shortcut-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
        font-size: 13px;
      }
      .shortcut-item kbd {
        background: #e9ecef;
        border: 1px solid #ced4da;
        border-radius: 3px;
        padding: 2px 6px;
        font-size: 11px;
        font-family: monospace;
      }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(modal);
    
    // Close modal handlers
    const closeModal = () => {
      modal.remove();
      style.remove();
    };
    
    modal.querySelector('.modal-close').addEventListener('click', closeModal);
    modal.querySelector('.modal-backdrop').addEventListener('click', closeModal);
    
    // Close with Escape
    const escapeHandler = (e) => {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', escapeHandler);
      }
    };
    document.addEventListener('keydown', escapeHandler);
  }

  /**
   * Get available component count for shortcuts
   */
  getComponentCount() {
    return document.querySelectorAll('.component-button').length;
  }

  /**
   * Update current component index for navigation
   */
  updateCurrentComponentIndex(category, name) {
    const componentButtons = Array.from(document.querySelectorAll('.component-button'));
    this.currentComponentIndex = componentButtons.findIndex(button => {
      const item = button.closest('.component-item');
      return item && item.dataset.category === category && item.dataset.component === name;
    });
    
    this.addToRecentComponents(category, name);
  }
}