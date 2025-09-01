/**
 * Design System Panel - Theme switcher and token editor for playground
 * Real-time theme switching, token editing, and design system browser
 */

import { LitElement, html, css } from 'lit';
import { themeManager, themes } from '../../components/theme/theme-manager.js';
import { designTokens, updateToken, batchUpdateTokens } from '../../components/tokens/token-system.js';
import { DesignIntegration } from '../../components/design/design-integration.js';

export class DesignSystemPanel extends LitElement {
  static properties = {
    isOpen: { type: Boolean },
    activeTab: { type: String },
    currentTheme: { type: String },
    selectedTokenCategory: { type: String },
    customThemes: { type: Array },
    unsavedChanges: { type: Boolean }
  };

  static styles = css`
    :host {
      display: block;
      position: fixed;
      top: 0;
      right: 0;
      height: 100vh;
      width: 400px;
      background: var(--colors-background, #ffffff);
      border-left: 1px solid var(--colors-border, #e2e8f0);
      box-shadow: var(--elevation-xl, 0 20px 25px -5px rgba(0, 0, 0, 0.1));
      transform: translateX(100%);
      transition: transform var(--animation-durations-normal, 200ms) var(--animation-easings-default, cubic-bezier(0.4, 0, 0.2, 1));
      z-index: var(--zIndex-modal, 1050);
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    :host([is-open]) {
      transform: translateX(0);
    }

    .panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--spacing-4, 1rem);
      border-bottom: 1px solid var(--colors-border, #e2e8f0);
      background: var(--colors-surface, #f8fafc);
    }

    .panel-title {
      font-size: var(--typography-fontSizes-lg, 1.125rem);
      font-weight: var(--typography-fontWeights-semibold, 600);
      color: var(--colors-text, #0f172a);
      margin: 0;
    }

    .close-button {
      background: none;
      border: none;
      font-size: var(--typography-fontSizes-xl, 1.25rem);
      color: var(--colors-textSecondary, #475569);
      cursor: pointer;
      padding: var(--spacing-2, 0.5rem);
      border-radius: var(--borderRadius-md, 0.375rem);
      transition: background-color var(--animation-durations-fast, 150ms);
    }

    .close-button:hover {
      background: var(--colors-hover, rgba(0, 0, 0, 0.05));
    }

    .tab-navigation {
      display: flex;
      border-bottom: 1px solid var(--colors-border, #e2e8f0);
      background: var(--colors-surface, #f8fafc);
    }

    .tab-button {
      flex: 1;
      padding: var(--spacing-3, 0.75rem) var(--spacing-2, 0.5rem);
      background: none;
      border: none;
      border-bottom: 2px solid transparent;
      color: var(--colors-textSecondary, #475569);
      font-size: var(--typography-fontSizes-sm, 0.875rem);
      font-weight: var(--typography-fontWeights-medium, 500);
      cursor: pointer;
      transition: all var(--animation-durations-fast, 150ms);
    }

    .tab-button:hover {
      color: var(--colors-text, #0f172a);
      background: var(--colors-hover, rgba(0, 0, 0, 0.05));
    }

    .tab-button.active {
      color: var(--colors-brand-primary, #2563eb);
      border-bottom-color: var(--colors-brand-primary, #2563eb);
      background: var(--colors-background, #ffffff);
    }

    .panel-content {
      flex: 1;
      padding: var(--spacing-4, 1rem);
      overflow-y: auto;
    }

    .theme-selector {
      margin-bottom: var(--spacing-6, 1.5rem);
    }

    .theme-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: var(--spacing-3, 0.75rem);
      margin-top: var(--spacing-3, 0.75rem);
    }

    .theme-card {
      padding: var(--spacing-3, 0.75rem);
      border: 2px solid var(--colors-border, #e2e8f0);
      border-radius: var(--borderRadius-lg, 0.5rem);
      cursor: pointer;
      transition: all var(--animation-durations-fast, 150ms);
      background: var(--colors-background, #ffffff);
    }

    .theme-card:hover {
      border-color: var(--colors-borderHover, #cbd5e1);
      transform: translateY(-2px);
      box-shadow: var(--elevation-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1));
    }

    .theme-card.active {
      border-color: var(--colors-brand-primary, #2563eb);
      background: var(--colors-brand-primary, #2563eb);
      color: white;
    }

    .theme-card.active .theme-name {
      color: white;
    }

    .theme-preview {
      width: 100%;
      height: 40px;
      border-radius: var(--borderRadius-md, 0.375rem);
      margin-bottom: var(--spacing-2, 0.5rem);
      display: flex;
      overflow: hidden;
    }

    .theme-preview-color {
      flex: 1;
      height: 100%;
    }

    .theme-name {
      font-size: var(--typography-fontSizes-xs, 0.75rem);
      font-weight: var(--typography-fontWeights-medium, 500);
      color: var(--colors-text, #0f172a);
      text-align: center;
    }

    .token-browser {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-4, 1rem);
    }

    .token-category-selector {
      display: flex;
      flex-wrap: wrap;
      gap: var(--spacing-2, 0.5rem);
      margin-bottom: var(--spacing-4, 1rem);
    }

    .category-button {
      padding: var(--spacing-2, 0.5rem) var(--spacing-3, 0.75rem);
      background: var(--colors-surface, #f8fafc);
      border: 1px solid var(--colors-border, #e2e8f0);
      border-radius: var(--borderRadius-md, 0.375rem);
      font-size: var(--typography-fontSizes-xs, 0.75rem);
      color: var(--colors-textSecondary, #475569);
      cursor: pointer;
      transition: all var(--animation-durations-fast, 150ms);
    }

    .category-button:hover {
      background: var(--colors-hover, rgba(0, 0, 0, 0.05));
      border-color: var(--colors-borderHover, #cbd5e1);
    }

    .category-button.active {
      background: var(--colors-brand-primary, #2563eb);
      border-color: var(--colors-brand-primary, #2563eb);
      color: white;
    }

    .token-list {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-2, 0.5rem);
    }

    .token-item {
      display: flex;
      align-items: center;
      gap: var(--spacing-3, 0.75rem);
      padding: var(--spacing-3, 0.75rem);
      background: var(--colors-surface, #f8fafc);
      border: 1px solid var(--colors-border, #e2e8f0);
      border-radius: var(--borderRadius-md, 0.375rem);
      transition: border-color var(--animation-durations-fast, 150ms);
    }

    .token-item:hover {
      border-color: var(--colors-borderHover, #cbd5e1);
    }

    .token-preview {
      width: 24px;
      height: 24px;
      border-radius: var(--borderRadius-sm, 0.125rem);
      border: 1px solid var(--colors-border, #e2e8f0);
      flex-shrink: 0;
    }

    .token-info {
      flex: 1;
      min-width: 0;
    }

    .token-name {
      font-size: var(--typography-fontSizes-sm, 0.875rem);
      font-weight: var(--typography-fontWeights-medium, 500);
      color: var(--colors-text, #0f172a);
      margin-bottom: var(--spacing-1, 0.25rem);
    }

    .token-value {
      font-size: var(--typography-fontSizes-xs, 0.75rem);
      font-family: var(--typography-fontFamilies-mono, monospace);
      color: var(--colors-textSecondary, #475569);
      word-break: break-all;
    }

    .token-editor-input {
      width: 80px;
      padding: var(--spacing-1, 0.25rem) var(--spacing-2, 0.5rem);
      border: 1px solid var(--colors-border, #e2e8f0);
      border-radius: var(--borderRadius-sm, 0.125rem);
      font-size: var(--typography-fontSizes-xs, 0.75rem);
      font-family: var(--typography-fontFamilies-mono, monospace);
    }

    .token-editor-input:focus {
      outline: 2px solid var(--colors-focus, #2563eb);
      outline-offset: 2px;
    }

    .export-section {
      margin-top: var(--spacing-6, 1.5rem);
      padding-top: var(--spacing-4, 1rem);
      border-top: 1px solid var(--colors-border, #e2e8f0);
    }

    .export-buttons {
      display: flex;
      flex-wrap: wrap;
      gap: var(--spacing-2, 0.5rem);
      margin-top: var(--spacing-3, 0.75rem);
    }

    .export-button {
      padding: var(--spacing-2, 0.5rem) var(--spacing-3, 0.75rem);
      background: var(--colors-brand-secondary, #4f46e5);
      color: white;
      border: none;
      border-radius: var(--borderRadius-md, 0.375rem);
      font-size: var(--typography-fontSizes-xs, 0.75rem);
      cursor: pointer;
      transition: background-color var(--animation-durations-fast, 150ms);
    }

    .export-button:hover {
      opacity: 0.9;
    }

    .custom-theme-section {
      margin-top: var(--spacing-6, 1.5rem);
      padding-top: var(--spacing-4, 1rem);
      border-top: 1px solid var(--colors-border, #e2e8f0);
    }

    .create-theme-button {
      width: 100%;
      padding: var(--spacing-3, 0.75rem);
      background: var(--colors-brand-accent, #0ea5e9);
      color: white;
      border: none;
      border-radius: var(--borderRadius-md, 0.375rem);
      font-size: var(--typography-fontSizes-sm, 0.875rem);
      font-weight: var(--typography-fontWeights-medium, 500);
      cursor: pointer;
      transition: background-color var(--animation-durations-fast, 150ms);
    }

    .create-theme-button:hover {
      opacity: 0.9;
    }

    .unsaved-indicator {
      display: inline-block;
      width: 8px;
      height: 8px;
      background: var(--colors-semantic-warning, #d97706);
      border-radius: 50%;
      margin-left: var(--spacing-2, 0.5rem);
    }

    .section-title {
      font-size: var(--typography-fontSizes-base, 1rem);
      font-weight: var(--typography-fontWeights-semibold, 600);
      color: var(--colors-text, #0f172a);
      margin-bottom: var(--spacing-3, 0.75rem);
      display: flex;
      align-items: center;
    }

    @media (max-width: 768px) {
      :host {
        width: 100vw;
        transform: translateX(100vw);
      }

      :host([is-open]) {
        transform: translateX(0);
      }
    }
  `;

  constructor() {
    super();
    this.isOpen = false;
    this.activeTab = 'themes';
    this.currentTheme = 'light';
    this.selectedTokenCategory = 'colors';
    this.customThemes = [];
    this.unsavedChanges = false;
    this.tokenEdits = new Map();
  }

  connectedCallback() {
    super.connectedCallback();

    // Listen to theme changes
    this.themeUnsubscribe = themeManager.addListener((event, data) => {
      if (event === 'themeChanged') {
        this.currentTheme = data.themeId;
        this.requestUpdate();
      }
    });

    // Get initial theme
    const current = themeManager.getCurrentTheme();
    this.currentTheme = current.id;
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.themeUnsubscribe) {
      this.themeUnsubscribe();
    }
  }

  render() {
    return html`
      <div class="panel-header">
        <h2 class="panel-title">
          Design System
          ${this.unsavedChanges ? html`<span class="unsaved-indicator"></span>` : ''}
        </h2>
        <button class="close-button" @click=${this.close}>✕</button>
      </div>

      <nav class="tab-navigation">
        <button
          class="tab-button ${this.activeTab === 'themes' ? 'active' : ''}"
          @click=${() => this.setActiveTab('themes')}>
          Themes
        </button>
        <button
          class="tab-button ${this.activeTab === 'tokens' ? 'active' : ''}"
          @click=${() => this.setActiveTab('tokens')}>
          Tokens
        </button>
        <button
          class="tab-button ${this.activeTab === 'export' ? 'active' : ''}"
          @click=${() => this.setActiveTab('export')}>
          Export
        </button>
      </nav>

      <div class="panel-content">
        ${this.renderTabContent()}
      </div>
    `;
  }

  renderTabContent() {
    switch (this.activeTab) {
      case 'themes':
        return this.renderThemesTab();
      case 'tokens':
        return this.renderTokensTab();
      case 'export':
        return this.renderExportTab();
      default:
        return html`<div>Select a tab</div>`;
    }
  }

  renderThemesTab() {
    const availableThemes = themeManager.getAvailableThemes();

    return html`
      <div class="theme-selector">
        <h3 class="section-title">Select Theme</h3>
        <div class="theme-grid">
          ${availableThemes.map(theme => html`
            <div
              class="theme-card ${this.currentTheme === theme.id ? 'active' : ''}"
              @click=${() => this.switchTheme(theme.id)}>
              <div class="theme-preview">
                ${this.renderThemePreview(theme.id)}
              </div>
              <div class="theme-name">${theme.name}</div>
            </div>
          `)}
        </div>
      </div>

      <div class="custom-theme-section">
        <h3 class="section-title">Custom Themes</h3>
        <button class="create-theme-button" @click=${this.createCustomTheme}>
          + Create Custom Theme
        </button>

        ${this.customThemes.length > 0 ? html`
          <div class="theme-grid" style="margin-top: var(--spacing-3, 0.75rem);">
            ${this.customThemes.map(theme => html`
              <div
                class="theme-card ${this.currentTheme === theme.id ? 'active' : ''}"
                @click=${() => this.switchTheme(theme.id)}>
                <div class="theme-preview">
                  ${this.renderThemePreview(theme.id)}
                </div>
                <div class="theme-name">${theme.name}</div>
              </div>
            `)}
          </div>
        ` : ''}
      </div>
    `;
  }

  renderThemePreview(themeId) {
    const theme = themes[themeId];
    if (!theme || !theme.tokens) {
      return html`<div class="theme-preview-color" style="background: #ccc;"></div>`;
    }

    const colors = [
      theme.tokens['colors.brand.primary'] || '#2563eb',
      theme.tokens['colors.brand.secondary'] || '#4f46e5',
      theme.tokens['colors.semantic.success'] || '#059669',
      theme.tokens['colors.semantic.warning'] || '#d97706'
    ];

    return html`
      ${colors.map(color => html`
        <div class="theme-preview-color" style="background-color: ${color};"></div>
      `)}
    `;
  }

  renderTokensTab() {
    const categories = Object.keys(designTokens);

    return html`
      <div class="token-browser">
        <div class="token-category-selector">
          ${categories.map(category => html`
            <button
              class="category-button ${this.selectedTokenCategory === category ? 'active' : ''}"
              @click=${() => this.selectTokenCategory(category)}>
              ${this.formatCategoryName(category)}
            </button>
          `)}
        </div>

        <div class="token-list">
          ${this.renderTokenList()}
        </div>
      </div>
    `;
  }

  renderTokenList() {
    const category = designTokens[this.selectedTokenCategory];
    if (!category) return html`<div>No tokens found</div>`;

    return html`
      ${this.renderTokenGroup(category, this.selectedTokenCategory)}
    `;
  }

  renderTokenGroup(tokenGroup, basePath = '') {
    return Object.entries(tokenGroup).map(([key, value]) => {
      const tokenPath = basePath ? `${basePath}.${key}` : key;

      if (value && typeof value === 'object' && value.value !== undefined) {
        // This is a token with a value
        return this.renderTokenItem(tokenPath, value);
      } else if (value && typeof value === 'object') {
        // This is a nested group
        return html`
          <div style="margin: var(--spacing-4, 1rem) 0;">
            <h4 style="margin: 0 0 var(--spacing-2, 0.5rem) 0; color: var(--colors-textSecondary, #475569); font-size: var(--typography-fontSizes-sm, 0.875rem);">
              ${this.formatTokenName(key)}
            </h4>
            ${this.renderTokenGroup(value, tokenPath)}
          </div>
        `;
      }
      return '';
    });
  }

  renderTokenItem(tokenPath, tokenData) {
    const currentValue = this.tokenEdits.get(tokenPath) || tokenData.value;

    return html`
      <div class="token-item">
        <div class="token-preview" style="${this.getTokenPreviewStyle(tokenData.type, currentValue)}"></div>
        <div class="token-info">
          <div class="token-name">${this.formatTokenName(tokenPath.split('.').pop())}</div>
          <div class="token-value">${currentValue}</div>
        </div>
        <input
          class="token-editor-input"
          type="text"
          .value=${currentValue}
          @input=${(e) => this.editToken(tokenPath, e.target.value)}
          @blur=${() => this.applyTokenEdit(tokenPath)}
        />
      </div>
    `;
  }

  renderExportTab() {
    return html`
      <div class="export-section">
        <h3 class="section-title">Export Tokens</h3>
        <div class="export-buttons">
          <button class="export-button" @click=${() => this.exportTokens('css')}>
            CSS Variables
          </button>
          <button class="export-button" @click=${() => this.exportTokens('json')}>
            JSON
          </button>
          <button class="export-button" @click=${() => this.exportTokens('scss')}>
            SCSS
          </button>
          <button class="export-button" @click=${() => this.exportTokens('figma')}>
            Figma Tokens
          </button>
        </div>
      </div>

      <div class="export-section">
        <h3 class="section-title">Export Theme</h3>
        <div class="export-buttons">
          <button class="export-button" @click=${() => this.exportCurrentTheme('json')}>
            Current Theme (JSON)
          </button>
          <button class="export-button" @click=${() => this.exportCurrentTheme('css')}>
            Current Theme (CSS)
          </button>
        </div>
      </div>

      <div class="export-section">
        <h3 class="section-title">Import/Export</h3>
        <div class="export-buttons">
          <button class="export-button" @click=${this.importTheme}>
            Import Theme
          </button>
          <button class="export-button" @click=${this.syncWithFigma}>
            Sync with Figma
          </button>
        </div>
      </div>
    `;
  }

  // Event handlers
  open() {
    this.isOpen = true;
  }

  close() {
    this.isOpen = false;
  }

  setActiveTab(tab) {
    this.activeTab = tab;
  }

  switchTheme(themeId) {
    themeManager.applyTheme(themeId);
    this.currentTheme = themeId;
  }

  selectTokenCategory(category) {
    this.selectedTokenCategory = category;
  }

  editToken(tokenPath, value) {
    this.tokenEdits.set(tokenPath, value);
    this.unsavedChanges = true;
  }

  applyTokenEdit(tokenPath) {
    const newValue = this.tokenEdits.get(tokenPath);
    if (newValue) {
      updateToken(tokenPath, newValue);
    }
  }

  createCustomTheme() {
    const baseTheme = this.currentTheme;
    const customThemeId = `custom-${Date.now()}`;
    const customThemeName = prompt('Enter custom theme name:', 'My Custom Theme');

    if (customThemeName) {
      const customTheme = themeManager.createThemeVariant(
        baseTheme,
        Object.fromEntries(this.tokenEdits),
        customThemeId,
        customThemeName,
        `Custom theme based on ${baseTheme}`
      );

      this.customThemes = [...this.customThemes, customTheme];
      this.tokenEdits.clear();
      this.unsavedChanges = false;
    }
  }

  exportTokens(format) {
    const exported = DesignIntegration.exportTokensForDesignTools()[format] ||
                    DesignIntegration.TokenExporter.toCSS(designTokens);

    this.downloadFile(`neoforge-tokens.${format}`, exported, 'application/json');
  }

  exportCurrentTheme(format) {
    const exported = themeManager.exportTheme(format);
    const extension = format === 'css' ? 'css' : 'json';
    this.downloadFile(`neoforge-theme-${this.currentTheme}.${extension}`, exported, 'text/plain');
  }

  async importTheme() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (file) {
        try {
          const text = await file.text();
          const themeConfig = JSON.parse(text);
          themeManager.importTheme(themeConfig, true);
          this.requestUpdate();
        } catch (error) {
          alert('Failed to import theme: ' + error.message);
        }
      }
    };

    input.click();
  }

  async syncWithFigma() {
    const accessToken = prompt('Enter Figma Access Token:');
    const fileKey = prompt('Enter Figma File Key:');

    if (accessToken && fileKey) {
      try {
        const tokens = await DesignIntegration.syncWithFigma(accessToken, fileKey);
        console.log('Figma tokens:', tokens);
        alert('Figma sync completed! Check console for details.');
      } catch (error) {
        alert('Figma sync failed: ' + error.message);
      }
    }
  }

  // Utility methods
  formatCategoryName(category) {
    return category.charAt(0).toUpperCase() + category.slice(1);
  }

  formatTokenName(name) {
    return name.replace(/([a-z])([A-Z])/g, '$1 $2')
               .replace(/[\-_]/g, ' ')
               .split(' ')
               .map(word => word.charAt(0).toUpperCase() + word.slice(1))
               .join(' ');
  }

  getTokenPreviewStyle(type, value) {
    switch (type) {
      case 'color':
        return `background-color: ${value};`;
      case 'shadow':
        return `background-color: var(--colors-surface, #f8fafc); box-shadow: ${value};`;
      case 'spacing':
        return `background-color: var(--colors-brand-primary, #2563eb); width: ${value}; height: 4px; margin: 10px 0;`;
      default:
        return `background-color: var(--colors-surface, #f8fafc);`;
    }
  }

  downloadFile(filename, content, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

customElements.define('design-system-panel', DesignSystemPanel);
