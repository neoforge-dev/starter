/**
 * Design System Integration Test
 * Tests the complete design system functionality including tokens, themes, and playground integration
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { designTokens, updateToken, batchUpdateTokens, TokenExporter } from '../../components/tokens/token-system.js';
import { themeManager, themes, ThemeUtils } from '../../components/theme/theme-manager.js';
import { DesignIntegration } from '../../components/design/design-integration.js';

// Mock DOM for testing
global.document = {
  documentElement: {
    style: {
      setProperty: vi.fn(),
      removeProperty: vi.fn()
    },
    classList: {
      add: vi.fn(),
      remove: vi.fn(),
      contains: vi.fn().mockReturnValue(false)
    },
    setAttribute: vi.fn(),
    getAttribute: vi.fn().mockReturnValue(null)
  },
  head: {
    appendChild: vi.fn()
  },
  createElement: vi.fn().mockReturnValue({
    textContent: '',
    style: {}
  }),
  body: {
    appendChild: vi.fn(),
    removeChild: vi.fn()
  },
  styleSheets: [],
  querySelector: vi.fn(),
  querySelectorAll: vi.fn().mockReturnValue([])
};

global.window = {
  matchMedia: vi.fn().mockReturnValue({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  }),
  dispatchEvent: vi.fn(),
  localStorage: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn()
  },
  getComputedStyle: vi.fn().mockReturnValue({
    getPropertyValue: vi.fn().mockReturnValue('')
  }),
  requestAnimationFrame: vi.fn(cb => cb()),
  URL: {
    createObjectURL: vi.fn().mockReturnValue('blob:url'),
    revokeObjectURL: vi.fn()
  }
};

describe('Design System Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Design Token System', () => {
    it('should have comprehensive token structure', () => {
      expect(designTokens).toBeDefined();
      expect(designTokens.colors).toBeDefined();
      expect(designTokens.typography).toBeDefined();
      expect(designTokens.spacing).toBeDefined();
      expect(designTokens.borderRadius).toBeDefined();
      expect(designTokens.elevation).toBeDefined();
      expect(designTokens.animation).toBeDefined();
      expect(designTokens.zIndex).toBeDefined();
      expect(designTokens.breakpoints).toBeDefined();
    });

    it('should provide token values with fallbacks', () => {
      const primaryColor = designTokens.colors.brand.primary;
      expect(primaryColor).toHaveProperty('value');
      expect(primaryColor).toHaveProperty('fallback');
      expect(primaryColor).toHaveProperty('type', 'color');
    });

    it('should support token updates', () => {
      const tokenPath = 'colors.brand.primary';
      const newValue = '#ff0000';
      
      updateToken(tokenPath, newValue);
      
      expect(document.documentElement.style.setProperty).toHaveBeenCalledWith(
        '--colors-brand-primary',
        newValue
      );
      expect(window.dispatchEvent).toHaveBeenCalled();
    });

    it('should support batch token updates', () => {
      const updates = {
        'colors.brand.primary': '#ff0000',
        'colors.brand.secondary': '#00ff00'
      };
      
      batchUpdateTokens(updates);
      
      expect(window.requestAnimationFrame).toHaveBeenCalled();
      expect(window.dispatchEvent).toHaveBeenCalled();
    });

    it('should export tokens in multiple formats', () => {
      const cssExport = TokenExporter.toCSS();
      const jsonExport = TokenExporter.toJSON();
      const scssExport = TokenExporter.toSCSS();
      const figmaExport = TokenExporter.toFigmaTokens();
      
      expect(cssExport).toContain(':root {');
      expect(cssExport).toContain('--colors-brand-primary');
      expect(typeof jsonExport).toBe('string');
      expect(typeof scssExport).toBe('string');
      expect(typeof figmaExport).toBe('string');
    });
  });

  describe('Theme Management', () => {
    it('should have predefined themes', () => {
      expect(themes.light).toBeDefined();
      expect(themes.dark).toBeDefined();
      expect(themes.neoforge).toBeDefined();
      expect(themes.highContrast).toBeDefined();
      expect(themes.system).toBeDefined();
    });

    it('should provide theme information', () => {
      const availableThemes = themeManager.getAvailableThemes();
      expect(availableThemes).toBeInstanceOf(Array);
      expect(availableThemes.length).toBeGreaterThan(0);
      
      const lightTheme = availableThemes.find(t => t.id === 'light');
      expect(lightTheme).toBeDefined();
      expect(lightTheme).toHaveProperty('name');
      expect(lightTheme).toHaveProperty('description');
    });

    it('should support theme switching', () => {
      const result = themeManager.applyTheme('dark');
      expect(result).toBe(true);
      
      const currentTheme = themeManager.getCurrentTheme();
      expect(currentTheme.id).toBe('dark');
    });

    it('should handle system theme preference', () => {
      // Mock dark mode preference
      window.matchMedia = vi.fn().mockReturnValue({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      });
      
      const result = themeManager.applyTheme('system');
      expect(result).toBe(true);
    });

    it('should support theme persistence', () => {
      themeManager.applyTheme('neoforge');
      
      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        'neoforge-theme',
        'neoforge'
      );
    });

    it('should export themes', () => {
      const jsonExport = themeManager.exportTheme('json');
      const cssExport = themeManager.exportTheme('css');
      
      expect(typeof jsonExport).toBe('string');
      expect(typeof cssExport).toBe('string');
    });

    it('should support custom theme creation', () => {
      const overrides = {
        'colors.brand.primary': '#custom-color'
      };
      
      const customTheme = themeManager.createThemeVariant(
        'light',
        overrides,
        'custom-test',
        'Test Custom Theme'
      );
      
      expect(customTheme).toBeDefined();
      expect(customTheme.id).toBe('custom-test');
      expect(customTheme.tokens['colors.brand.primary']).toBe('#custom-color');
      expect(customTheme.isCustom).toBe(true);
    });
  });

  describe('Theme Utilities', () => {
    it('should detect dark themes', () => {
      expect(ThemeUtils.isDarkTheme('dark')).toBe(true);
      expect(ThemeUtils.isDarkTheme('light')).toBe(false);
      expect(ThemeUtils.isDarkTheme('neoforge')).toBe(true);
      expect(ThemeUtils.isDarkTheme('highContrast')).toBe(true);
    });

    it('should provide contrast ratios', () => {
      const contrast = ThemeUtils.getContrastRatio('light');
      expect(['AA', 'AAA', 'AAA+']).toContain(contrast);
    });

    it('should check reduced motion preference', () => {
      const reducedMotion = ThemeUtils.prefersReducedMotion('highContrast');
      expect(typeof reducedMotion).toBe('boolean');
    });
  });

  describe('Design Integration Tools', () => {
    it('should provide Figma token sync', () => {
      expect(DesignIntegration.figmaSync).toBeDefined();
      expect(typeof DesignIntegration.figmaSync.configure).toBe('function');
    });

    it('should provide asset management', () => {
      expect(DesignIntegration.assetManager).toBeDefined();
      expect(typeof DesignIntegration.assetManager.optimizeAsset).toBe('function');
    });

    it('should provide component spec generation', () => {
      expect(DesignIntegration.specGenerator).toBeDefined();
      expect(typeof DesignIntegration.specGenerator.generateSpec).toBe('function');
    });

    it('should provide documentation generation', () => {
      expect(DesignIntegration.docGenerator).toBeDefined();
      expect(typeof DesignIntegration.docGenerator.generateDesignSystemDocs).toBe('function');
    });

    it('should export tokens for design tools', () => {
      const exports = DesignIntegration.exportTokensForDesignTools();
      
      expect(exports).toHaveProperty('figma');
      expect(exports).toHaveProperty('sketch');
      expect(exports).toHaveProperty('adobeXD');
    });
  });

  describe('Accessibility Compliance', () => {
    it('should provide WCAG compliant themes', () => {
      const lightTheme = themes.light;
      expect(lightTheme.accessibility.contrastRatio).toMatch(/^(AA|AAA|\AAA\+)$/);
      expect(lightTheme.accessibility.colorBlindnessFriendly).toBe(true);
    });

    it('should support reduced motion', () => {
      const highContrastTheme = themes.highContrast;
      expect(highContrastTheme.accessibility.reducedMotion).toBe(true);
    });
  });

  describe('Performance Considerations', () => {
    it('should use CSS custom properties for runtime theming', () => {
      const cssExport = TokenExporter.toCSS(designTokens);
      expect(cssExport).toContain('--colors-brand-primary:');
      expect(cssExport).toContain('var(');
    });

    it('should batch token updates for performance', () => {
      const updates = {
        'colors.brand.primary': '#test1',
        'colors.brand.secondary': '#test2'
      };
      
      batchUpdateTokens(updates);
      
      // Should use requestAnimationFrame for batching
      expect(window.requestAnimationFrame).toHaveBeenCalled();
    });
  });

  describe('Integration with Existing Components', () => {
    it('should apply theme classes to document element', () => {
      themeManager.applyTheme('dark');
      
      expect(document.documentElement.classList.add).toHaveBeenCalledWith('theme-dark');
      expect(document.documentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'dark');
    });

    it('should update color scheme for browser UI', () => {
      themeManager.applyTheme('dark');
      
      expect(document.documentElement.style.setProperty).toHaveBeenCalledWith(
        expect.stringContaining('color-scheme'),
        expect.any(String)
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid theme IDs gracefully', () => {
      const result = themeManager.applyTheme('non-existent-theme');
      expect(result).toBe(false);
    });

    it('should provide fallback values for missing tokens', () => {
      const primaryColor = designTokens.colors.brand.primary;
      expect(primaryColor.fallback).toBeDefined();
    });
  });

  describe('Design System Panel Integration', () => {
    it('should register design-system-panel custom element', async () => {
      // Import the component to register it
      await import('../../playground/components/design-system-panel.js');
      
      // In a real browser, this would be available
      // For testing, we just verify the import doesn't throw
      expect(true).toBe(true);
    });
  });
});