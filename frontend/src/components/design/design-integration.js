/**
 * Design Integration Tools - Figma sync, token management, designer-developer collaboration
 * Provides seamless integration between design tools and development workflow
 */

import { designTokens, TokenExporter } from '../tokens/token-system.js';
import { themes, themeManager } from '../theme/theme-manager.js';

/**
 * Figma Token Synchronization
 */
export class FigmaTokenSync {
  constructor() {
    this.apiEndpoint = 'https://api.figma.com/v1';
    this.accessToken = null;
    this.fileKey = null;
    this.nodeId = null;
  }

  /**
   * Configure Figma API access
   */
  configure(accessToken, fileKey, nodeId = null) {
    this.accessToken = accessToken;
    this.fileKey = fileKey;
    this.nodeId = nodeId;
  }

  /**
   * Extract design tokens from Figma styles
   */
  async extractTokensFromFigma() {
    if (!this.accessToken || !this.fileKey) {
      throw new Error('Figma API configuration required');
    }

    try {
      // Fetch file styles
      const stylesResponse = await fetch(`${this.apiEndpoint}/files/${this.fileKey}/styles`, {
        headers: {
          'X-Figma-Token': this.accessToken
        }
      });

      if (!stylesResponse.ok) {
        throw new Error(`Figma API error: ${stylesResponse.status}`);
      }

      const stylesData = await stylesResponse.json();
      
      // Fetch file details for style values
      const fileResponse = await fetch(`${this.apiEndpoint}/files/${this.fileKey}`, {
        headers: {
          'X-Figma-Token': this.accessToken
        }
      });

      const fileData = await fileResponse.json();

      // Convert Figma styles to design tokens
      return this.convertFigmaStylesToTokens(stylesData, fileData);
    } catch (error) {
      console.error('Failed to extract tokens from Figma:', error);
      throw error;
    }
  }

  /**
   * Convert Figma styles to design token format
   */
  convertFigmaStylesToTokens(stylesData, fileData) {
    const extractedTokens = {
      colors: {},
      typography: {},
      spacing: {},
      elevation: {}
    };

    // Process color styles
    stylesData.meta.styles
      .filter(style => style.style_type === 'FILL')
      .forEach(style => {
        const colorValue = this.extractColorFromStyle(style, fileData);
        if (colorValue) {
          extractedTokens.colors[this.sanitizeTokenName(style.name)] = {
            value: colorValue,
            type: 'color',
            description: style.description || `Imported from Figma: ${style.name}`,
            figmaId: style.node_id
          };
        }
      });

    // Process text styles
    stylesData.meta.styles
      .filter(style => style.style_type === 'TEXT')
      .forEach(style => {
        const textStyle = this.extractTextStyleFromFigma(style, fileData);
        if (textStyle) {
          extractedTokens.typography[this.sanitizeTokenName(style.name)] = textStyle;
        }
      });

    // Process effect styles (shadows)
    stylesData.meta.styles
      .filter(style => style.style_type === 'EFFECT')
      .forEach(style => {
        const shadowValue = this.extractShadowFromStyle(style, fileData);
        if (shadowValue) {
          extractedTokens.elevation[this.sanitizeTokenName(style.name)] = {
            value: shadowValue,
            type: 'shadow',
            description: style.description || `Imported from Figma: ${style.name}`,
            figmaId: style.node_id
          };
        }
      });

    return extractedTokens;
  }

  /**
   * Extract color value from Figma style
   */
  extractColorFromStyle(style, fileData) {
    // This is a simplified implementation
    // In a real integration, you'd need to traverse the Figma file structure
    // to find the actual color values from the style nodes
    
    // For now, return a placeholder that demonstrates the structure
    return `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`;
  }

  /**
   * Extract text style from Figma
   */
  extractTextStyleFromFigma(style, fileData) {
    // Simplified implementation - would need actual Figma API parsing
    return {
      fontSize: { value: '1rem', type: 'spacing' },
      fontWeight: { value: '400', type: 'typography' },
      lineHeight: { value: '1.5', type: 'typography' },
      fontFamily: { value: 'Inter, sans-serif', type: 'typography' },
      description: style.description || `Imported from Figma: ${style.name}`,
      figmaId: style.node_id
    };
  }

  /**
   * Extract shadow value from Figma style
   */
  extractShadowFromStyle(style, fileData) {
    // Simplified implementation
    return '0 4px 6px rgba(0, 0, 0, 0.1)';
  }

  /**
   * Sanitize Figma style names for token usage
   */
  sanitizeTokenName(name) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * Push tokens to Figma (requires Figma plugin)
   */
  async pushTokensToFigma(tokens) {
    // This would require a custom Figma plugin to receive the tokens
    // For now, we'll generate a format that can be manually imported
    
    const figmaTokens = TokenExporter.toFigmaTokens(tokens);
    
    // Create a downloadable file for manual import
    this.downloadTokensForFigma(figmaTokens, 'neoforge-tokens.json');
    
    return {
      success: true,
      message: 'Tokens exported for Figma import',
      format: 'figma-tokens',
      data: figmaTokens
    };
  }

  /**
   * Download tokens in Figma-compatible format
   */
  downloadTokensForFigma(tokens, filename) {
    const blob = new Blob([tokens], { type: 'application/json' });
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

/**
 * Design Asset Management
 */
export class AssetManager {
  constructor() {
    this.assetCache = new Map();
    this.optimizationSettings = {
      images: {
        formats: ['webp', 'avif', 'png'],
        sizes: [320, 640, 960, 1280, 1920],
        quality: 85
      },
      icons: {
        formats: ['svg'],
        optimize: true
      }
    };
  }

  /**
   * Optimize and cache design assets
   */
  async optimizeAsset(file, options = {}) {
    const settings = { ...this.optimizationSettings, ...options };
    
    // Check cache first
    const cacheKey = `${file.name}-${file.size}-${JSON.stringify(settings)}`;
    if (this.assetCache.has(cacheKey)) {
      return this.assetCache.get(cacheKey);
    }

    try {
      let optimizedAsset;
      
      if (file.type.startsWith('image/')) {
        optimizedAsset = await this.optimizeImage(file, settings.images);
      } else if (file.type === 'image/svg+xml') {
        optimizedAsset = await this.optimizeIcon(file, settings.icons);
      } else {
        optimizedAsset = { original: file, optimized: file };
      }

      // Cache the result
      this.assetCache.set(cacheKey, optimizedAsset);
      
      return optimizedAsset;
    } catch (error) {
      console.error('Asset optimization failed:', error);
      return { original: file, optimized: file, error };
    }
  }

  /**
   * Optimize image assets
   */
  async optimizeImage(file, settings) {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        const optimizedVersions = {};
        
        // Generate different sizes
        settings.sizes.forEach(size => {
          const aspectRatio = img.width / img.height;
          const width = Math.min(size, img.width);
          const height = width / aspectRatio;
          
          canvas.width = width;
          canvas.height = height;
          
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to different formats
          settings.formats.forEach(format => {
            const mimeType = format === 'jpg' ? 'image/jpeg' : `image/${format}`;
            const quality = settings.quality / 100;
            
            try {
              const dataUrl = canvas.toDataURL(mimeType, quality);
              if (!optimizedVersions[format]) {
                optimizedVersions[format] = {};
              }
              optimizedVersions[format][`${width}w`] = dataUrl;
            } catch (e) {
              console.warn(`Format ${format} not supported`);
            }
          });
        });
        
        resolve({
          original: file,
          optimized: optimizedVersions,
          metadata: {
            originalSize: file.size,
            originalDimensions: { width: img.width, height: img.height },
            formats: Object.keys(optimizedVersions),
            sizes: settings.sizes
          }
        });
      };
      
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Optimize SVG icons
   */
  async optimizeIcon(file, settings) {
    const text = await file.text();
    
    if (settings.optimize) {
      // Basic SVG optimization (remove comments, unnecessary whitespace)
      const optimized = text
        .replace(/<!--[\s\S]*?-->/g, '') // Remove comments
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();
      
      return {
        original: file,
        optimized: new Blob([optimized], { type: 'image/svg+xml' }),
        metadata: {
          originalSize: file.size,
          optimizedSize: optimized.length,
          compression: ((file.size - optimized.length) / file.size * 100).toFixed(1) + '%'
        }
      };
    }
    
    return { original: file, optimized: file };
  }

  /**
   * Generate responsive image HTML
   */
  generateResponsiveImageHTML(optimizedAsset, alt = '', className = '') {
    if (!optimizedAsset.optimized) {
      return `<img src="${URL.createObjectURL(optimizedAsset.original)}" alt="${alt}" class="${className}">`;
    }

    const formats = Object.keys(optimizedAsset.optimized);
    let html = '<picture>\n';
    
    // Add source elements for different formats (modern formats first)
    const formatPriority = ['avif', 'webp', 'png', 'jpg'];
    formatPriority.forEach(format => {
      if (formats.includes(format)) {
        const sizes = optimizedAsset.optimized[format];
        const srcset = Object.entries(sizes)
          .map(([size, url]) => `${url} ${size}`)
          .join(', ');
        
        html += `  <source srcset="${srcset}" type="image/${format}">\n`;
      }
    });
    
    // Fallback img element
    const fallbackFormat = formats.includes('png') ? 'png' : formats[0];
    const fallbackSizes = optimizedAsset.optimized[fallbackFormat];
    const fallbackSrc = Object.values(fallbackSizes)[0];
    
    html += `  <img src="${fallbackSrc}" alt="${alt}" class="${className}">\n`;
    html += '</picture>';
    
    return html;
  }
}

/**
 * Component Specification Generator
 */
export class ComponentSpecGenerator {
  constructor() {
    this.specTemplate = {
      name: '',
      description: '',
      category: '',
      tokens: {},
      props: {},
      states: {},
      variants: {},
      accessibility: {},
      usage: {
        dos: [],
        donts: []
      }
    };
  }

  /**
   * Generate component specification from component analysis
   */
  generateSpec(componentElement, additionalData = {}) {
    const spec = { ...this.specTemplate };
    
    // Extract basic information
    spec.name = componentElement.tagName.toLowerCase();
    spec.description = additionalData.description || 'Component specification';
    spec.category = this.categorizeComponent(componentElement);
    
    // Analyze CSS custom properties used
    spec.tokens = this.extractUsedTokens(componentElement);
    
    // Extract component properties
    spec.props = this.extractComponentProps(componentElement);
    
    // Analyze component states
    spec.states = this.analyzeComponentStates(componentElement);
    
    // Extract variants
    spec.variants = this.extractVariants(componentElement);
    
    // Check accessibility features
    spec.accessibility = this.analyzeAccessibility(componentElement);
    
    // Add usage guidelines
    spec.usage = additionalData.usage || spec.usage;
    
    return spec;
  }

  /**
   * Categorize component based on atomic design
   */
  categorizeComponent(element) {
    const tagName = element.tagName.toLowerCase();
    
    // Basic categorization logic
    if (tagName.includes('button') || tagName.includes('input') || tagName.includes('icon')) {
      return 'atom';
    } else if (tagName.includes('card') || tagName.includes('modal') || tagName.includes('form')) {
      return 'molecule';
    } else if (tagName.includes('header') || tagName.includes('footer') || tagName.includes('navigation')) {
      return 'organism';
    } else if (tagName.includes('page')) {
      return 'template';
    }
    
    return 'molecule'; // Default
  }

  /**
   * Extract design tokens used by component
   */
  extractUsedTokens(element) {
    const computedStyle = window.getComputedStyle(element);
    const usedTokens = {};
    
    // Get all CSS custom properties
    const allProperties = Array.from(document.styleSheets)
      .flatMap(sheet => {
        try {
          return Array.from(sheet.cssRules);
        } catch (e) {
          return [];
        }
      })
      .filter(rule => rule.style)
      .flatMap(rule => Array.from(rule.style))
      .filter(prop => prop.startsWith('--'));
    
    // Check which tokens are used
    allProperties.forEach(prop => {
      const value = computedStyle.getPropertyValue(prop);
      if (value && value.trim()) {
        usedTokens[prop.replace('--', '')] = {
          value: value.trim(),
          type: this.inferTokenType(prop, value)
        };
      }
    });
    
    return usedTokens;
  }

  /**
   * Infer token type from property name and value
   */
  inferTokenType(property, value) {
    if (property.includes('color') || value.match(/^#|rgb|hsl/)) {
      return 'color';
    } else if (property.includes('spacing') || property.includes('margin') || property.includes('padding')) {
      return 'spacing';
    } else if (property.includes('font') || property.includes('text')) {
      return 'typography';
    } else if (property.includes('shadow')) {
      return 'elevation';
    } else if (property.includes('duration') || property.includes('timing')) {
      return 'animation';
    }
    return 'other';
  }

  /**
   * Extract component properties
   */
  extractComponentProps(element) {
    const props = {};
    
    // Get all attributes
    Array.from(element.attributes).forEach(attr => {
      props[attr.name] = {
        type: this.inferPropType(attr.value),
        default: attr.value,
        required: false
      };
    });
    
    // Try to get property definitions from constructor
    if (element.constructor.observedAttributes) {
      element.constructor.observedAttributes.forEach(attrName => {
        if (!props[attrName]) {
          props[attrName] = {
            type: 'string',
            default: null,
            required: false
          };
        }
      });
    }
    
    return props;
  }

  /**
   * Infer property type from value
   */
  inferPropType(value) {
    if (value === 'true' || value === 'false') return 'boolean';
    if (!isNaN(Number(value))) return 'number';
    if (value.includes(',')) return 'array';
    return 'string';
  }

  /**
   * Analyze component states
   */
  analyzeComponentStates(element) {
    const states = {};
    
    // Check common states
    const commonStates = ['disabled', 'loading', 'active', 'focused', 'error'];
    
    commonStates.forEach(state => {
      if (element.hasAttribute(state) || element.classList.contains(state)) {
        states[state] = {
          description: `Component in ${state} state`,
          trigger: `Set ${state} attribute or class`
        };
      }
    });
    
    return states;
  }

  /**
   * Extract component variants
   */
  extractVariants(element) {
    const variants = {};
    
    // Look for variant attributes/classes
    const variantIndicators = ['variant', 'type', 'size', 'color'];
    
    variantIndicators.forEach(indicator => {
      const attrValue = element.getAttribute(indicator);
      const classVariant = Array.from(element.classList)
        .find(cls => cls.includes(indicator));
      
      if (attrValue) {
        variants[indicator] = {
          options: [attrValue],
          default: attrValue,
          description: `${indicator} variant`
        };
      } else if (classVariant) {
        variants[indicator] = {
          options: [classVariant.replace(indicator + '-', '')],
          description: `${indicator} variant (CSS class)`
        };
      }
    });
    
    return variants;
  }

  /**
   * Analyze accessibility features
   */
  analyzeAccessibility(element) {
    const accessibility = {
      ariaLabels: {},
      keyboardSupport: false,
      focusManagement: false,
      semanticHTML: false,
      colorContrast: 'unknown'
    };
    
    // Check ARIA attributes
    Array.from(element.attributes)
      .filter(attr => attr.name.startsWith('aria-'))
      .forEach(attr => {
        accessibility.ariaLabels[attr.name] = attr.value;
      });
    
    // Check for semantic HTML
    const semanticTags = ['button', 'input', 'select', 'textarea', 'nav', 'main', 'section', 'article'];
    accessibility.semanticHTML = semanticTags.some(tag => 
      element.tagName.toLowerCase() === tag || element.querySelector(tag)
    );
    
    // Check tabindex for keyboard support
    accessibility.keyboardSupport = element.hasAttribute('tabindex') || 
      element.tabIndex >= 0;
    
    return accessibility;
  }

  /**
   * Export specification in various formats
   */
  exportSpec(spec, format = 'json') {
    switch (format) {
      case 'json':
        return JSON.stringify(spec, null, 2);
      
      case 'markdown':
        return this.specToMarkdown(spec);
      
      case 'figma':
        return this.specToFigmaFormat(spec);
      
      default:
        throw new Error(`Unknown export format: ${format}`);
    }
  }

  /**
   * Convert specification to Markdown documentation
   */
  specToMarkdown(spec) {
    let md = `# ${spec.name}\n\n`;
    md += `${spec.description}\n\n`;
    md += `**Category:** ${spec.category}\n\n`;
    
    // Props section
    if (Object.keys(spec.props).length > 0) {
      md += `## Properties\n\n`;
      md += `| Name | Type | Default | Required | Description |\n`;
      md += `|------|------|---------|----------|--------------|\n`;
      
      Object.entries(spec.props).forEach(([name, prop]) => {
        md += `| ${name} | ${prop.type} | ${prop.default || 'N/A'} | ${prop.required ? 'Yes' : 'No'} | ${prop.description || ''} |\n`;
      });
      md += '\n';
    }
    
    // Tokens section
    if (Object.keys(spec.tokens).length > 0) {
      md += `## Design Tokens\n\n`;
      Object.entries(spec.tokens).forEach(([token, data]) => {
        md += `- **${token}**: ${data.value} (${data.type})\n`;
      });
      md += '\n';
    }
    
    // Usage guidelines
    if (spec.usage.dos.length > 0 || spec.usage.donts.length > 0) {
      md += `## Usage Guidelines\n\n`;
      
      if (spec.usage.dos.length > 0) {
        md += `### Do\n\n`;
        spec.usage.dos.forEach(item => md += `- ${item}\n`);
        md += '\n';
      }
      
      if (spec.usage.donts.length > 0) {
        md += `### Don't\n\n`;
        spec.usage.donts.forEach(item => md += `- ${item}\n`);
        md += '\n';
      }
    }
    
    return md;
  }

  /**
   * Convert specification to Figma-compatible format
   */
  specToFigmaFormat(spec) {
    return {
      componentName: spec.name,
      description: spec.description,
      category: spec.category,
      designTokens: spec.tokens,
      variants: spec.variants,
      states: spec.states,
      accessibility: spec.accessibility
    };
  }
}

/**
 * Design System Documentation Generator
 */
export class DocumentationGenerator {
  constructor() {
    this.assetManager = new AssetManager();
    this.specGenerator = new ComponentSpecGenerator();
  }

  /**
   * Generate complete design system documentation
   */
  async generateDesignSystemDocs(components = []) {
    const documentation = {
      designSystem: {
        name: 'NeoForge Design System',
        version: '1.0.0',
        description: 'Comprehensive design system for modern web applications',
        tokens: designTokens,
        themes: Object.values(themes).map(theme => ({
          id: theme.id,
          name: theme.name,
          description: theme.description
        }))
      },
      components: {},
      guidelines: {},
      assets: {}
    };

    // Generate component specifications
    for (const component of components) {
      const spec = this.specGenerator.generateSpec(component);
      documentation.components[spec.name] = spec;
    }

    // Add design guidelines
    documentation.guidelines = this.generateDesignGuidelines();

    return documentation;
  }

  /**
   * Generate design guidelines
   */
  generateDesignGuidelines() {
    return {
      colorUsage: {
        title: 'Color Usage',
        description: 'Guidelines for using colors in the design system',
        rules: [
          'Use semantic colors for status and feedback',
          'Ensure sufficient contrast ratios (minimum 4.5:1)',
          'Test colors for color blindness accessibility',
          'Use brand colors sparingly for emphasis'
        ]
      },
      typography: {
        title: 'Typography',
        description: 'Guidelines for typography usage',
        rules: [
          'Use consistent font scales across components',
          'Ensure readable line heights (1.4-1.6)',
          'Limit font weights to 3-4 variations',
          'Consider reading distance for sizing'
        ]
      },
      spacing: {
        title: 'Spacing',
        description: 'Guidelines for consistent spacing',
        rules: [
          'Use 8px base grid system',
          'Maintain consistent padding and margins',
          'Use spacing tokens instead of hardcoded values',
          'Consider touch targets for interactive elements'
        ]
      }
    };
  }

  /**
   * Export documentation in multiple formats
   */
  exportDocumentation(documentation, format = 'json') {
    switch (format) {
      case 'json':
        return JSON.stringify(documentation, null, 2);
      
      case 'html':
        return this.generateHTMLDocumentation(documentation);
      
      case 'storybook':
        return this.generateStorybookDocs(documentation);
      
      default:
        throw new Error(`Unknown documentation format: ${format}`);
    }
  }

  /**
   * Generate HTML documentation
   */
  generateHTMLDocumentation(documentation) {
    let html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${documentation.designSystem.name} Documentation</title>
      <style>
        body { font-family: system-ui, sans-serif; line-height: 1.6; margin: 0; padding: 20px; }
        .container { max-width: 1200px; margin: 0 auto; }
        .component { margin-bottom: 40px; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; }
        .token-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; }
        .token-card { padding: 16px; background: #f8fafc; border-radius: 4px; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>${documentation.designSystem.name}</h1>
        <p>${documentation.designSystem.description}</p>
    `;
    
    // Add components documentation
    Object.entries(documentation.components).forEach(([name, spec]) => {
      html += `
        <div class="component">
          <h2>${spec.name}</h2>
          <p>${spec.description}</p>
          <p><strong>Category:</strong> ${spec.category}</p>
        </div>
      `;
    });
    
    html += `
      </div>
    </body>
    </html>
    `;
    
    return html;
  }

  /**
   * Generate Storybook documentation
   */
  generateStorybookDocs(documentation) {
    // Generate Storybook-compatible documentation structure
    return {
      title: documentation.designSystem.name,
      parameters: {
        docs: {
          description: {
            component: documentation.designSystem.description
          }
        }
      },
      argTypes: {},
      args: {}
    };
  }
}

// Export integrated design system
export const DesignIntegration = {
  figmaSync: new FigmaTokenSync(),
  assetManager: new AssetManager(),
  specGenerator: new ComponentSpecGenerator(),
  docGenerator: new DocumentationGenerator(),
  
  // Utility methods
  async syncWithFigma(accessToken, fileKey) {
    const figmaSync = new FigmaTokenSync();
    figmaSync.configure(accessToken, fileKey);
    return await figmaSync.extractTokensFromFigma();
  },

  async generateFullDocumentation(components) {
    const docGenerator = new DocumentationGenerator();
    return await docGenerator.generateDesignSystemDocs(components);
  },

  exportTokensForDesignTools() {
    return {
      figma: TokenExporter.toFigmaTokens(),
      sketch: TokenExporter.toJSON(),
      adobeXD: TokenExporter.toJSON()
    };
  }
};

export default DesignIntegration;