/**
 * Design Token System - Centralized token management with runtime theming
 * Provides token validation, type safety, and dynamic theme switching
 */

// Token format validation schema
const TokenSchema = {
  color: (value) => /^(#[0-9a-fA-F]{6}|rgb\(|rgba\(|hsl\(|hsla\(|var\()/.test(value),
  spacing: (value) => /^(\d+(\.\d+)?(px|rem|em|%)|var\()/.test(value),
  typography: (value) => typeof value === 'string' && value.length > 0,
  duration: (value) => /^(\d+(\.\d+)?ms|var\()/.test(value),
  shadow: (value) => /^(none|\d+px|var\()/.test(value),
  radius: (value) => /^(\d+(\.\d+)?(px|rem|%)|var\()/.test(value)
};

// Base design tokens with fallbacks and validation
export const designTokens = {
  // Color system with semantic naming
  colors: {
    // Brand colors
    brand: {
      primary: { value: '#2563eb', fallback: '#3b82f6', type: 'color' },
      secondary: { value: '#4f46e5', fallback: '#6366f1', type: 'color' },
      accent: { value: '#0ea5e9', fallback: '#38bdf8', type: 'color' },

      // Primary variations
      primary50: { value: '#eff6ff', fallback: '#f0f9ff', type: 'color' },
      primary100: { value: '#dbeafe', fallback: '#e0f2fe', type: 'color' },
      primary200: { value: '#bfdbfe', fallback: '#bae6fd', type: 'color' },
      primary300: { value: '#93c5fd', fallback: '#7dd3fc', type: 'color' },
      primary400: { value: '#60a5fa', fallback: '#38bdf8', type: 'color' },
      primary500: { value: '#3b82f6', fallback: '#0ea5e9', type: 'color' },
      primary600: { value: '#2563eb', fallback: '#0284c7', type: 'color' },
      primary700: { value: '#1d4ed8', fallback: '#0369a1', type: 'color' },
      primary800: { value: '#1e40af', fallback: '#075985', type: 'color' },
      primary900: { value: '#1e3a8a', fallback: '#0c4a6e', type: 'color' }
    },

    // Semantic colors
    semantic: {
      success: { value: '#059669', fallback: '#10b981', type: 'color' },
      warning: { value: '#d97706', fallback: '#f59e0b', type: 'color' },
      error: { value: '#dc2626', fallback: '#ef4444', type: 'color' },
      info: { value: '#0ea5e9', fallback: '#38bdf8', type: 'color' }
    },

    // Neutral color scale
    neutral: {
      0: { value: '#ffffff', fallback: '#ffffff', type: 'color' },
      50: { value: '#f8fafc', fallback: '#f9fafb', type: 'color' },
      100: { value: '#f1f5f9', fallback: '#f3f4f6', type: 'color' },
      200: { value: '#e2e8f0', fallback: '#e5e7eb', type: 'color' },
      300: { value: '#cbd5e1', fallback: '#d1d5db', type: 'color' },
      400: { value: '#94a3b8', fallback: '#9ca3af', type: 'color' },
      500: { value: '#64748b', fallback: '#6b7280', type: 'color' },
      600: { value: '#475569', fallback: '#4b5563', type: 'color' },
      700: { value: '#334155', fallback: '#374151', type: 'color' },
      800: { value: '#1e293b', fallback: '#1f2937', type: 'color' },
      900: { value: '#0f172a', fallback: '#111827', type: 'color' },
      1000: { value: '#000000', fallback: '#000000', type: 'color' }
    }
  },

  // Typography system
  typography: {
    fontFamilies: {
      primary: {
        value: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
        fallback: 'Arial, sans-serif',
        type: 'typography'
      },
      secondary: {
        value: 'Georgia, "Times New Roman", serif',
        fallback: 'serif',
        type: 'typography'
      },
      mono: {
        value: '"SF Mono", "Monaco", "Cascadia Code", monospace',
        fallback: 'monospace',
        type: 'typography'
      }
    },

    fontSizes: {
      xs: { value: '0.75rem', fallback: '12px', type: 'spacing' },
      sm: { value: '0.875rem', fallback: '14px', type: 'spacing' },
      base: { value: '1rem', fallback: '16px', type: 'spacing' },
      lg: { value: '1.125rem', fallback: '18px', type: 'spacing' },
      xl: { value: '1.25rem', fallback: '20px', type: 'spacing' },
      '2xl': { value: '1.5rem', fallback: '24px', type: 'spacing' },
      '3xl': { value: '1.875rem', fallback: '30px', type: 'spacing' },
      '4xl': { value: '2.25rem', fallback: '36px', type: 'spacing' },
      '5xl': { value: '3rem', fallback: '48px', type: 'spacing' },
      '6xl': { value: '3.75rem', fallback: '60px', type: 'spacing' }
    },

    fontWeights: {
      thin: { value: '100', fallback: '100', type: 'typography' },
      light: { value: '300', fallback: '300', type: 'typography' },
      normal: { value: '400', fallback: '400', type: 'typography' },
      medium: { value: '500', fallback: '500', type: 'typography' },
      semibold: { value: '600', fallback: '600', type: 'typography' },
      bold: { value: '700', fallback: '700', type: 'typography' },
      extrabold: { value: '800', fallback: '800', type: 'typography' },
      black: { value: '900', fallback: '900', type: 'typography' }
    },

    lineHeights: {
      none: { value: '1', fallback: '1', type: 'typography' },
      tight: { value: '1.25', fallback: '1.25', type: 'typography' },
      snug: { value: '1.375', fallback: '1.375', type: 'typography' },
      normal: { value: '1.5', fallback: '1.5', type: 'typography' },
      relaxed: { value: '1.625', fallback: '1.625', type: 'typography' },
      loose: { value: '2', fallback: '2', type: 'typography' }
    }
  },

  // Spacing system based on 8px grid
  spacing: {
    px: { value: '1px', fallback: '1px', type: 'spacing' },
    0: { value: '0', fallback: '0', type: 'spacing' },
    0.5: { value: '0.125rem', fallback: '2px', type: 'spacing' },
    1: { value: '0.25rem', fallback: '4px', type: 'spacing' },
    1.5: { value: '0.375rem', fallback: '6px', type: 'spacing' },
    2: { value: '0.5rem', fallback: '8px', type: 'spacing' },
    2.5: { value: '0.625rem', fallback: '10px', type: 'spacing' },
    3: { value: '0.75rem', fallback: '12px', type: 'spacing' },
    3.5: { value: '0.875rem', fallback: '14px', type: 'spacing' },
    4: { value: '1rem', fallback: '16px', type: 'spacing' },
    5: { value: '1.25rem', fallback: '20px', type: 'spacing' },
    6: { value: '1.5rem', fallback: '24px', type: 'spacing' },
    7: { value: '1.75rem', fallback: '28px', type: 'spacing' },
    8: { value: '2rem', fallback: '32px', type: 'spacing' },
    9: { value: '2.25rem', fallback: '36px', type: 'spacing' },
    10: { value: '2.5rem', fallback: '40px', type: 'spacing' },
    11: { value: '2.75rem', fallback: '44px', type: 'spacing' },
    12: { value: '3rem', fallback: '48px', type: 'spacing' },
    14: { value: '3.5rem', fallback: '56px', type: 'spacing' },
    16: { value: '4rem', fallback: '64px', type: 'spacing' },
    20: { value: '5rem', fallback: '80px', type: 'spacing' },
    24: { value: '6rem', fallback: '96px', type: 'spacing' },
    28: { value: '7rem', fallback: '112px', type: 'spacing' },
    32: { value: '8rem', fallback: '128px', type: 'spacing' },
    36: { value: '9rem', fallback: '144px', type: 'spacing' },
    40: { value: '10rem', fallback: '160px', type: 'spacing' },
    44: { value: '11rem', fallback: '176px', type: 'spacing' },
    48: { value: '12rem', fallback: '192px', type: 'spacing' },
    52: { value: '13rem', fallback: '208px', type: 'spacing' },
    56: { value: '14rem', fallback: '224px', type: 'spacing' },
    60: { value: '15rem', fallback: '240px', type: 'spacing' },
    64: { value: '16rem', fallback: '256px', type: 'spacing' },
    72: { value: '18rem', fallback: '288px', type: 'spacing' },
    80: { value: '20rem', fallback: '320px', type: 'spacing' },
    96: { value: '24rem', fallback: '384px', type: 'spacing' }
  },

  // Border radius system
  borderRadius: {
    none: { value: '0', fallback: '0', type: 'radius' },
    sm: { value: '0.125rem', fallback: '2px', type: 'radius' },
    base: { value: '0.25rem', fallback: '4px', type: 'radius' },
    md: { value: '0.375rem', fallback: '6px', type: 'radius' },
    lg: { value: '0.5rem', fallback: '8px', type: 'radius' },
    xl: { value: '0.75rem', fallback: '12px', type: 'radius' },
    '2xl': { value: '1rem', fallback: '16px', type: 'radius' },
    '3xl': { value: '1.5rem', fallback: '24px', type: 'radius' },
    full: { value: '9999px', fallback: '9999px', type: 'radius' }
  },

  // Elevation system (shadows)
  elevation: {
    none: { value: 'none', fallback: 'none', type: 'shadow' },
    xs: { value: '0 1px 2px 0 rgb(0 0 0 / 0.05)', fallback: '0 1px 3px rgba(0,0,0,0.12)', type: 'shadow' },
    sm: { value: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)', fallback: '0 3px 6px rgba(0,0,0,0.15)', type: 'shadow' },
    md: { value: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)', fallback: '0 10px 20px rgba(0,0,0,0.15)', type: 'shadow' },
    lg: { value: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', fallback: '0 15px 25px rgba(0,0,0,0.15)', type: 'shadow' },
    xl: { value: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)', fallback: '0 25px 50px rgba(0,0,0,0.25)', type: 'shadow' },
    '2xl': { value: '0 25px 50px -12px rgb(0 0 0 / 0.25)', fallback: '0 25px 50px rgba(0,0,0,0.25)', type: 'shadow' },
    inner: { value: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)', fallback: 'inset 0 2px 4px rgba(0,0,0,0.1)', type: 'shadow' }
  },

  // Animation system
  animation: {
    durations: {
      instant: { value: '0ms', fallback: '0ms', type: 'duration' },
      fast: { value: '150ms', fallback: '150ms', type: 'duration' },
      normal: { value: '200ms', fallback: '200ms', type: 'duration' },
      slow: { value: '300ms', fallback: '300ms', type: 'duration' },
      slower: { value: '500ms', fallback: '500ms', type: 'duration' }
    },

    easings: {
      linear: { value: 'linear', fallback: 'linear', type: 'typography' },
      default: { value: 'cubic-bezier(0.4, 0, 0.2, 1)', fallback: 'ease', type: 'typography' },
      in: { value: 'cubic-bezier(0.4, 0, 1, 1)', fallback: 'ease-in', type: 'typography' },
      out: { value: 'cubic-bezier(0, 0, 0.2, 1)', fallback: 'ease-out', type: 'typography' },
      inOut: { value: 'cubic-bezier(0.4, 0, 0.2, 1)', fallback: 'ease-in-out', type: 'typography' }
    }
  },

  // Z-index system
  zIndex: {
    auto: { value: 'auto', fallback: 'auto', type: 'typography' },
    0: { value: '0', fallback: '0', type: 'typography' },
    10: { value: '10', fallback: '10', type: 'typography' },
    20: { value: '20', fallback: '20', type: 'typography' },
    30: { value: '30', fallback: '30', type: 'typography' },
    40: { value: '40', fallback: '40', type: 'typography' },
    50: { value: '50', fallback: '50', type: 'typography' },
    dropdown: { value: '1000', fallback: '1000', type: 'typography' },
    sticky: { value: '1020', fallback: '1020', type: 'typography' },
    fixed: { value: '1030', fallback: '1030', type: 'typography' },
    modalBackdrop: { value: '1040', fallback: '1040', type: 'typography' },
    modal: { value: '1050', fallback: '1050', type: 'typography' },
    popover: { value: '1060', fallback: '1060', type: 'typography' },
    tooltip: { value: '1070', fallback: '1070', type: 'typography' },
    toast: { value: '1080', fallback: '1080', type: 'typography' }
  },

  // Breakpoints for responsive design
  breakpoints: {
    xs: { value: '475px', fallback: '475px', type: 'spacing' },
    sm: { value: '640px', fallback: '640px', type: 'spacing' },
    md: { value: '768px', fallback: '768px', type: 'spacing' },
    lg: { value: '1024px', fallback: '1024px', type: 'spacing' },
    xl: { value: '1280px', fallback: '1280px', type: 'spacing' },
    '2xl': { value: '1536px', fallback: '1536px', type: 'spacing' }
  }
};

/**
 * Token validation utility
 */
export function validateToken(token, type) {
  const validator = TokenSchema[type];
  if (!validator) {
    console.warn(`Unknown token type: ${type}`);
    return false;
  }
  return validator(token.value);
}

/**
 * Get token value with fallback
 */
export function getTokenValue(tokenPath, fallback = null) {
  const pathParts = tokenPath.split('.');
  let current = designTokens;

  for (const part of pathParts) {
    current = current[part];
    if (!current) {
      console.warn(`Token path not found: ${tokenPath}`);
      return fallback;
    }
  }

  return current.value || fallback || current.fallback;
}

/**
 * Generate CSS custom properties from tokens
 */
export function generateCSSCustomProperties(tokens = designTokens, prefix = '--') {
  const properties = {};

  function traverse(obj, path = '') {
    for (const [key, value] of Object.entries(obj)) {
      const currentPath = path ? `${path}-${key}` : key;

      if (value && typeof value === 'object' && value.value !== undefined) {
        // This is a token with value and type
        properties[`${prefix}${currentPath}`] = value.value;
        // Also add fallback property
        if (value.fallback) {
          properties[`${prefix}${currentPath}-fallback`] = value.fallback;
        }
      } else if (value && typeof value === 'object') {
        // This is a nested object, continue traversing
        traverse(value, currentPath);
      }
    }
  }

  traverse(tokens);
  return properties;
}

/**
 * Apply tokens to CSS stylesheet
 */
export function applyTokensToStylesheet(tokens = designTokens, selector = ':root') {
  const properties = generateCSSCustomProperties(tokens);
  let css = `${selector} {\n`;

  for (const [property, value] of Object.entries(properties)) {
    css += `  ${property}: ${value};\n`;
  }

  css += '}\n';
  return css;
}

/**
 * Runtime token update utility
 */
export function updateToken(tokenPath, newValue) {
  const cssProperty = `--${tokenPath.replace(/\./g, '-')}`;
  document.documentElement.style.setProperty(cssProperty, newValue);

  // Dispatch custom event for token updates
  window.dispatchEvent(new CustomEvent('design-token-updated', {
    detail: { path: tokenPath, value: newValue, cssProperty }
  }));
}

/**
 * Batch token updates for performance
 */
export function batchUpdateTokens(updates) {
  const root = document.documentElement;

  // Use requestAnimationFrame for smooth updates
  requestAnimationFrame(() => {
    for (const [tokenPath, newValue] of Object.entries(updates)) {
      const cssProperty = `--${tokenPath.replace(/\./g, '-')}`;
      root.style.setProperty(cssProperty, newValue);
    }

    // Dispatch batch update event
    window.dispatchEvent(new CustomEvent('design-tokens-batch-updated', {
      detail: { updates }
    }));
  });
}

/**
 * Export tokens in various formats
 */
export const TokenExporter = {
  // Export as CSS custom properties
  toCSS(tokens = designTokens, selector = ':root') {
    return applyTokensToStylesheet(tokens, selector);
  },

  // Export as JSON for design tools
  toJSON(tokens = designTokens) {
    return JSON.stringify(tokens, null, 2);
  },

  // Export as JavaScript object
  toJS(tokens = designTokens, varName = 'designTokens') {
    return `export const ${varName} = ${JSON.stringify(tokens, null, 2)};`;
  },

  // Export as SCSS variables
  toSCSS(tokens = designTokens, prefix = '$') {
    const properties = generateCSSCustomProperties(tokens, '');
    let scss = '';

    for (const [property, value] of Object.entries(properties)) {
      const scssVar = property.replace(/^--/, prefix).replace(/-([a-z])/g, (match, letter) => letter.toUpperCase());
      scss += `${scssVar}: ${value};\n`;
    }

    return scss;
  },

  // Export for Figma tokens plugin format
  toFigmaTokens(tokens = designTokens) {
    function convertToFigmaFormat(obj, path = '') {
      const figmaTokens = {};

      for (const [key, value] of Object.entries(obj)) {
        if (value && typeof value === 'object' && value.value !== undefined) {
          figmaTokens[key] = {
            value: value.value,
            type: value.type,
            description: value.description || `Token: ${path ? path + '.' : ''}${key}`
          };
        } else if (value && typeof value === 'object') {
          figmaTokens[key] = convertToFigmaFormat(value, path ? `${path}.${key}` : key);
        }
      }

      return figmaTokens;
    }

    return JSON.stringify(convertToFigmaFormat(tokens), null, 2);
  }
};

// Initialize CSS custom properties on module load
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = applyTokensToStylesheet(designTokens);
  document.head.appendChild(style);
}

export default {
  tokens: designTokens,
  validate: validateToken,
  getValue: getTokenValue,
  update: updateToken,
  batchUpdate: batchUpdateTokens,
  export: TokenExporter
};
