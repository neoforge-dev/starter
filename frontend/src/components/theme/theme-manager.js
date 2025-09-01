/**
 * Theme Manager - Advanced theme management with light/dark/brand variations
 * Supports runtime theme switching, accessibility compliance, and persistence
 */

import { designTokens, batchUpdateTokens } from '../tokens/token-system.js';

// Theme definitions with complete token overrides
export const themes = {
  light: {
    id: 'light',
    name: 'Light Theme',
    description: 'Clean and bright interface for optimal daylight viewing',
    tokens: {
      // Color mappings
      'colors.background': '#ffffff',
      'colors.surface': '#f8fafc',
      'colors.surfaceElevated': '#ffffff',
      'colors.border': '#e2e8f0',
      'colors.borderHover': '#cbd5e1',

      // Text colors
      'colors.text': '#0f172a',
      'colors.textSecondary': '#475569',
      'colors.textTertiary': '#94a3b8',
      'colors.textInverse': '#ffffff',

      // Brand colors
      'colors.brand.primary': '#2563eb',
      'colors.brand.primaryHover': '#1d4ed8',
      'colors.brand.primaryActive': '#1e40af',
      'colors.brand.secondary': '#4f46e5',
      'colors.brand.accent': '#0ea5e9',

      // Semantic colors
      'colors.semantic.success': '#059669',
      'colors.semantic.warning': '#d97706',
      'colors.semantic.error': '#dc2626',
      'colors.semantic.info': '#0ea5e9',

      // Interactive states
      'colors.hover': 'rgba(0, 0, 0, 0.05)',
      'colors.active': 'rgba(0, 0, 0, 0.1)',
      'colors.focus': '#2563eb',

      // Shadows (elevated surfaces)
      'elevation.xs': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      'elevation.sm': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
      'elevation.md': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      'elevation.lg': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
      'elevation.xl': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
    },
    accessibility: {
      contrastRatio: 'AAA', // WCAG AAA compliant
      colorBlindnessFriendly: true,
      reducedMotion: false
    }
  },

  dark: {
    id: 'dark',
    name: 'Dark Theme',
    description: 'Sophisticated dark interface for low-light environments',
    tokens: {
      // Background colors
      'colors.background': '#0f172a',
      'colors.surface': '#1e293b',
      'colors.surfaceElevated': '#334155',
      'colors.border': '#475569',
      'colors.borderHover': '#64748b',

      // Text colors
      'colors.text': '#f8fafc',
      'colors.textSecondary': '#cbd5e1',
      'colors.textTertiary': '#94a3b8',
      'colors.textInverse': '#0f172a',

      // Brand colors (adjusted for dark background)
      'colors.brand.primary': '#3b82f6',
      'colors.brand.primaryHover': '#60a5fa',
      'colors.brand.primaryActive': '#2563eb',
      'colors.brand.secondary': '#6366f1',
      'colors.brand.accent': '#38bdf8',

      // Semantic colors (enhanced for dark)
      'colors.semantic.success': '#10b981',
      'colors.semantic.warning': '#f59e0b',
      'colors.semantic.error': '#ef4444',
      'colors.semantic.info': '#38bdf8',

      // Interactive states
      'colors.hover': 'rgba(255, 255, 255, 0.05)',
      'colors.active': 'rgba(255, 255, 255, 0.1)',
      'colors.focus': '#3b82f6',

      // Enhanced shadows for dark mode
      'elevation.xs': '0 1px 2px 0 rgb(0 0 0 / 0.3)',
      'elevation.sm': '0 1px 3px 0 rgb(0 0 0 / 0.4), 0 1px 2px -1px rgb(0 0 0 / 0.4)',
      'elevation.md': '0 4px 6px -1px rgb(0 0 0 / 0.5), 0 2px 4px -2px rgb(0 0 0 / 0.5)',
      'elevation.lg': '0 10px 15px -3px rgb(0 0 0 / 0.6), 0 4px 6px -4px rgb(0 0 0 / 0.6)',
      'elevation.xl': '0 20px 25px -5px rgb(0 0 0 / 0.7), 0 8px 10px -6px rgb(0 0 0 / 0.7)'
    },
    accessibility: {
      contrastRatio: 'AAA',
      colorBlindnessFriendly: true,
      reducedMotion: false
    }
  },

  neoforge: {
    id: 'neoforge',
    name: 'NeoForge Brand',
    description: 'Official NeoForge brand theme with custom colors',
    tokens: {
      // NeoForge brand background
      'colors.background': '#0a0e1a',
      'colors.surface': '#1a1f2e',
      'colors.surfaceElevated': '#242b3d',
      'colors.border': '#3d4663',
      'colors.borderHover': '#4a5578',

      // NeoForge brand text
      'colors.text': '#e2e8f0',
      'colors.textSecondary': '#a0aec0',
      'colors.textTertiary': '#718096',
      'colors.textInverse': '#0a0e1a',

      // Custom NeoForge brand colors
      'colors.brand.primary': '#00d4ff', // Cyan primary
      'colors.brand.primaryHover': '#33ddff',
      'colors.brand.primaryActive': '#0099cc',
      'colors.brand.secondary': '#6c5ce7', // Purple secondary
      'colors.brand.accent': '#fd79a8', // Pink accent

      // Enhanced semantic colors
      'colors.semantic.success': '#00cec9',
      'colors.semantic.warning': '#fdcb6e',
      'colors.semantic.error': '#e84393',
      'colors.semantic.info': '#74b9ff',

      // Brand-specific interactive states
      'colors.hover': 'rgba(0, 212, 255, 0.1)',
      'colors.active': 'rgba(0, 212, 255, 0.2)',
      'colors.focus': '#00d4ff',

      // Deep shadows for brand theme
      'elevation.xs': '0 1px 2px 0 rgba(0, 212, 255, 0.1)',
      'elevation.sm': '0 1px 3px 0 rgba(0, 212, 255, 0.15), 0 1px 2px -1px rgba(0, 0, 0, 0.3)',
      'elevation.md': '0 4px 6px -1px rgba(0, 212, 255, 0.2), 0 2px 4px -2px rgba(0, 0, 0, 0.4)',
      'elevation.lg': '0 10px 15px -3px rgba(0, 212, 255, 0.25), 0 4px 6px -4px rgba(0, 0, 0, 0.5)',
      'elevation.xl': '0 20px 25px -5px rgba(0, 212, 255, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.6)'
    },
    accessibility: {
      contrastRatio: 'AA',
      colorBlindnessFriendly: true,
      reducedMotion: false
    }
  },

  highContrast: {
    id: 'highContrast',
    name: 'High Contrast',
    description: 'Maximum contrast theme for accessibility',
    tokens: {
      // High contrast backgrounds
      'colors.background': '#000000',
      'colors.surface': '#1a1a1a',
      'colors.surfaceElevated': '#333333',
      'colors.border': '#ffffff',
      'colors.borderHover': '#ffff00',

      // High contrast text
      'colors.text': '#ffffff',
      'colors.textSecondary': '#ffffff',
      'colors.textTertiary': '#cccccc',
      'colors.textInverse': '#000000',

      // High contrast brand colors
      'colors.brand.primary': '#ffff00', // Yellow for visibility
      'colors.brand.primaryHover': '#ffff66',
      'colors.brand.primaryActive': '#cccc00',
      'colors.brand.secondary': '#00ffff', // Cyan
      'colors.brand.accent': '#ff00ff', // Magenta

      // High contrast semantic colors
      'colors.semantic.success': '#00ff00',
      'colors.semantic.warning': '#ffff00',
      'colors.semantic.error': '#ff0000',
      'colors.semantic.info': '#00ffff',

      // High contrast interactive states
      'colors.hover': 'rgba(255, 255, 0, 0.3)',
      'colors.active': 'rgba(255, 255, 0, 0.5)',
      'colors.focus': '#ffff00',

      // Strong shadows
      'elevation.xs': '0 0 0 2px #ffffff',
      'elevation.sm': '0 0 0 3px #ffffff',
      'elevation.md': '0 0 0 4px #ffffff',
      'elevation.lg': '0 0 0 5px #ffffff',
      'elevation.xl': '0 0 0 6px #ffffff'
    },
    accessibility: {
      contrastRatio: 'AAA+',
      colorBlindnessFriendly: true,
      reducedMotion: true
    }
  },

  system: {
    id: 'system',
    name: 'System Preference',
    description: 'Automatically follows system dark/light mode',
    isAutomatic: true,
    lightTheme: 'light',
    darkTheme: 'dark'
  }
};

/**
 * Theme Manager Class
 */
export class ThemeManager {
  constructor() {
    this.currentTheme = null;
    this.systemPreference = null;
    this.persistenceKey = 'neoforge-theme';
    this.listeners = new Set();

    // Initialize system preference detection
    this.initializeSystemPreference();

    // Load persisted theme or use system default
    this.initialize();

    // Set up system preference change listening
    this.watchSystemPreference();
  }

  /**
   * Initialize system preference detection
   */
  initializeSystemPreference() {
    if (typeof window !== 'undefined' && window.matchMedia) {
      this.systemPreference = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
  }

  /**
   * Initialize theme manager
   */
  initialize() {
    const savedTheme = this.getPersistedTheme();
    const initialTheme = savedTheme || 'system';
    this.applyTheme(initialTheme);
  }

  /**
   * Watch for system preference changes
   */
  watchSystemPreference() {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e) => {
        this.systemPreference = e.matches ? 'dark' : 'light';

        // If using system theme, update automatically
        if (this.currentTheme === 'system') {
          this.applySystemTheme();
        }

        this.notifyListeners('systemPreferenceChanged', {
          systemPreference: this.systemPreference
        });
      };

      mediaQuery.addEventListener('change', handleChange);

      // Store cleanup function
      this.cleanupSystemWatcher = () => {
        mediaQuery.removeEventListener('change', handleChange);
      };
    }
  }

  /**
   * Apply a theme by ID
   */
  applyTheme(themeId) {
    const theme = themes[themeId];
    if (!theme) {
      console.warn(`Theme not found: ${themeId}`);
      return false;
    }

    // Handle system theme
    if (theme.isAutomatic) {
      return this.applySystemTheme();
    }

    // Apply theme tokens
    this.applyThemeTokens(theme);

    // Update current theme
    this.currentTheme = themeId;

    // Apply theme class to document
    this.updateDocumentTheme(themeId);

    // Persist theme choice
    this.persistTheme(themeId);

    // Handle accessibility settings
    this.applyAccessibilitySettings(theme.accessibility);

    // Notify listeners
    this.notifyListeners('themeChanged', {
      themeId,
      theme,
      tokens: theme.tokens
    });

    console.log(`Applied theme: ${theme.name}`);
    return true;
  }

  /**
   * Apply system-based theme
   */
  applySystemTheme() {
    const systemTheme = themes.system;
    const targetThemeId = this.systemPreference === 'dark'
      ? systemTheme.darkTheme
      : systemTheme.lightTheme;

    const targetTheme = themes[targetThemeId];
    if (!targetTheme) {
      console.warn(`System theme target not found: ${targetThemeId}`);
      return false;
    }

    // Apply the target theme tokens
    this.applyThemeTokens(targetTheme);

    // Update current theme to system
    this.currentTheme = 'system';

    // Apply theme class
    this.updateDocumentTheme(`system-${targetThemeId}`);

    // Persist system preference
    this.persistTheme('system');

    // Apply accessibility settings
    this.applyAccessibilitySettings(targetTheme.accessibility);

    // Notify listeners
    this.notifyListeners('themeChanged', {
      themeId: 'system',
      resolvedTheme: targetThemeId,
      theme: targetTheme,
      tokens: targetTheme.tokens
    });

    return true;
  }

  /**
   * Apply theme tokens to CSS custom properties
   */
  applyThemeTokens(theme) {
    const updates = {};

    // Convert theme tokens to CSS custom property format
    for (const [tokenPath, value] of Object.entries(theme.tokens)) {
      const cssProperty = tokenPath.replace(/\./g, '-');
      updates[tokenPath] = value;
    }

    // Batch update for performance
    batchUpdateTokens(updates);
  }

  /**
   * Update document theme class
   */
  updateDocumentTheme(themeId) {
    if (typeof document !== 'undefined') {
      // Remove existing theme classes
      const existingClasses = Array.from(document.documentElement.classList)
        .filter(className => className.startsWith('theme-'));

      existingClasses.forEach(className => {
        document.documentElement.classList.remove(className);
      });

      // Add new theme class
      document.documentElement.classList.add(`theme-${themeId}`);

      // Add data attribute for CSS targeting
      document.documentElement.setAttribute('data-theme', themeId);

      // Update color scheme for browser UI
      const resolvedTheme = this.getResolvedTheme();
      document.documentElement.style.colorScheme = resolvedTheme === 'dark' ? 'dark' : 'light';
    }
  }

  /**
   * Apply accessibility settings
   */
  applyAccessibilitySettings(settings) {
    if (typeof document !== 'undefined') {
      // Handle reduced motion preference
      if (settings.reducedMotion) {
        document.documentElement.classList.add('reduce-motion');
      } else {
        document.documentElement.classList.remove('reduce-motion');
      }

      // Add contrast level class
      document.documentElement.setAttribute('data-contrast', settings.contrastRatio.toLowerCase());
    }
  }

  /**
   * Get resolved theme (handles system theme)
   */
  getResolvedTheme() {
    if (this.currentTheme === 'system') {
      return this.systemPreference;
    }
    return this.currentTheme;
  }

  /**
   * Get current theme information
   */
  getCurrentTheme() {
    const themeId = this.currentTheme;
    const theme = themes[themeId];

    if (themeId === 'system') {
      const resolvedId = this.systemPreference === 'dark'
        ? theme.darkTheme
        : theme.lightTheme;
      return {
        id: themeId,
        resolvedId,
        theme,
        resolvedTheme: themes[resolvedId]
      };
    }

    return {
      id: themeId,
      theme
    };
  }

  /**
   * Get all available themes
   */
  getAvailableThemes() {
    return Object.values(themes).map(theme => ({
      id: theme.id,
      name: theme.name,
      description: theme.description,
      isAutomatic: theme.isAutomatic || false,
      accessibility: theme.accessibility
    }));
  }

  /**
   * Toggle between light and dark themes
   */
  toggleTheme() {
    const resolvedTheme = this.getResolvedTheme();
    const newTheme = resolvedTheme === 'dark' ? 'light' : 'dark';
    return this.applyTheme(newTheme);
  }

  /**
   * Persist theme preference
   */
  persistTheme(themeId) {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.persistenceKey, themeId);
    }
  }

  /**
   * Get persisted theme preference
   */
  getPersistedTheme() {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(this.persistenceKey);
    }
    return null;
  }

  /**
   * Add theme change listener
   */
  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Remove theme change listener
   */
  removeListener(callback) {
    return this.listeners.delete(callback);
  }

  /**
   * Notify all listeners
   */
  notifyListeners(event, data) {
    this.listeners.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        console.error('Theme listener error:', error);
      }
    });
  }

  /**
   * Create custom theme variant
   */
  createThemeVariant(baseThemeId, overrides, id, name, description) {
    const baseTheme = themes[baseThemeId];
    if (!baseTheme) {
      throw new Error(`Base theme not found: ${baseThemeId}`);
    }

    const customTheme = {
      id,
      name: name || `Custom ${baseTheme.name}`,
      description: description || `Custom variant of ${baseTheme.name}`,
      tokens: { ...baseTheme.tokens, ...overrides },
      accessibility: { ...baseTheme.accessibility },
      isCustom: true,
      baseTheme: baseThemeId
    };

    // Add to themes registry
    themes[id] = customTheme;

    // Notify listeners
    this.notifyListeners('customThemeCreated', {
      themeId: id,
      theme: customTheme,
      baseTheme: baseThemeId
    });

    return customTheme;
  }

  /**
   * Export current theme
   */
  exportTheme(format = 'json') {
    const currentTheme = this.getCurrentTheme();
    const theme = currentTheme.resolvedTheme || currentTheme.theme;

    switch (format) {
      case 'json':
        return JSON.stringify(theme, null, 2);
      case 'css':
        return this.themeToCSS(theme);
      case 'js':
        return `export const customTheme = ${JSON.stringify(theme, null, 2)};`;
      default:
        throw new Error(`Unknown export format: ${format}`);
    }
  }

  /**
   * Convert theme to CSS custom properties
   */
  themeToCSS(theme) {
    let css = `:root {\n`;
    for (const [tokenPath, value] of Object.entries(theme.tokens)) {
      const cssProperty = `--${tokenPath.replace(/\./g, '-')}`;
      css += `  ${cssProperty}: ${value};\n`;
    }
    css += '}\n';
    return css;
  }

  /**
   * Import theme from configuration
   */
  importTheme(themeConfig, applyImmediately = false) {
    if (!themeConfig.id) {
      throw new Error('Theme configuration must include an id');
    }

    // Add to themes registry
    themes[themeConfig.id] = themeConfig;

    if (applyImmediately) {
      this.applyTheme(themeConfig.id);
    }

    this.notifyListeners('themeImported', {
      themeId: themeConfig.id,
      theme: themeConfig
    });

    return themeConfig;
  }

  /**
   * Cleanup resources
   */
  destroy() {
    if (this.cleanupSystemWatcher) {
      this.cleanupSystemWatcher();
    }
    this.listeners.clear();
  }
}

// Create singleton instance
export const themeManager = new ThemeManager();

// Export theme utilities
export const ThemeUtils = {
  // Check if theme is dark
  isDarkTheme(themeId = null) {
    const currentThemeId = themeId || themeManager.getResolvedTheme();
    return currentThemeId === 'dark' || currentThemeId === 'neoforge' || currentThemeId === 'highContrast';
  },

  // Get contrast ratio for accessibility
  getContrastRatio(themeId = null) {
    const resolvedId = themeId || themeManager.getResolvedTheme();
    const theme = themes[resolvedId];
    return theme?.accessibility?.contrastRatio || 'AA';
  },

  // Check if reduced motion is preferred
  prefersReducedMotion(themeId = null) {
    const resolvedId = themeId || themeManager.getResolvedTheme();
    const theme = themes[resolvedId];
    return theme?.accessibility?.reducedMotion || false;
  },

  // Get theme-aware color
  getThemeColor(colorPath, themeId = null) {
    const resolvedId = themeId || themeManager.getResolvedTheme();
    const theme = themes[resolvedId];
    return theme?.tokens?.[colorPath] || null;
  }
};

export default themeManager;
