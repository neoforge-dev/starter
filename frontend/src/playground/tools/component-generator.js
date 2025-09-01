/**
 * Component Generator - Main file generation engine
 *
 * Handles the creation of new Web Components with automatic playground integration
 */

import { generateComponentTemplate } from '../templates/component.template.js';
import { generatePlaygroundConfigTemplate } from '../templates/playground-config.template.js';
import { generateTestTemplate } from '../templates/test.template.js';
import { generateStoryTemplate } from '../templates/story.template.js';

export class ComponentGenerator {
  constructor() {
    this.generatedFiles = new Map();
    this.componentRegistry = new Set();
  }

  /**
   * Generate a new component with all associated files
   * @param {Object} config - Component configuration
   * @returns {Promise<Object>} Generation result
   */
  async generateComponent(config) {
    try {
      const startTime = performance.now();

      // Validate configuration
      const validationResult = this.validateConfig(config);
      if (!validationResult.valid) {
        throw new Error(`Invalid configuration: ${validationResult.errors.join(', ')}`);
      }

      // Normalize configuration
      const normalizedConfig = this.normalizeConfig(config);

      // Generate all files
      const files = this.generateAllFiles(normalizedConfig);

      // Create file structure
      const fileStructure = this.createFileStructure(normalizedConfig, files);

      // Update component loader
      const loaderUpdate = this.generateComponentLoaderUpdate(normalizedConfig);

      // Generate import statements for index files
      const indexUpdates = this.generateIndexUpdates(normalizedConfig);

      const endTime = performance.now();

      return {
        success: true,
        config: normalizedConfig,
        files: fileStructure,
        loaderUpdate,
        indexUpdates,
        generationTime: Math.round(endTime - startTime),
        filesGenerated: Object.keys(fileStructure).length,
        message: `Successfully generated ${normalizedConfig.componentName} component with ${Object.keys(fileStructure).length} files in ${Math.round(endTime - startTime)}ms`
      };

    } catch (error) {
      console.error('Component generation failed:', error);
      return {
        success: false,
        error: error.message,
        message: `Failed to generate component: ${error.message}`
      };
    }
  }

  /**
   * Validate component configuration
   * @param {Object} config - Configuration to validate
   * @returns {Object} Validation result
   */
  validateConfig(config) {
    const errors = [];

    if (!config.name || typeof config.name !== 'string') {
      errors.push('Component name is required and must be a string');
    }

    if (!config.category || !['atoms', 'molecules', 'organisms'].includes(config.category)) {
      errors.push('Category must be one of: atoms, molecules, organisms');
    }

    if (!config.description || typeof config.description !== 'string') {
      errors.push('Component description is required');
    }

    // Check if component already exists
    if (this.componentRegistry.has(`${config.category}/${config.name}`)) {
      errors.push('Component with this name already exists in the specified category');
    }

    // Validate properties if provided
    if (config.properties) {
      if (!Array.isArray(config.properties)) {
        errors.push('Properties must be an array');
      } else {
        config.properties.forEach((prop, index) => {
          if (!prop.name || typeof prop.name !== 'string') {
            errors.push(`Property ${index}: name is required and must be a string`);
          }
          if (!prop.type || !['String', 'Boolean', 'Number', 'Array', 'Object'].includes(prop.type)) {
            errors.push(`Property ${index}: type must be one of String, Boolean, Number, Array, Object`);
          }
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Normalize and enrich component configuration
   * @param {Object} config - Raw configuration
   * @returns {Object} Normalized configuration
   */
  normalizeConfig(config) {
    const name = this.normalizeComponentName(config.name);
    const componentName = `neo-${name}`;
    const className = this.toPascalCase(`Neo${name}`);

    // Add default properties based on category
    const defaultProperties = this.getDefaultProperties(config.category, config.properties || []);

    return {
      ...config,
      name,
      componentName,
      className,
      properties: defaultProperties,
      hasSlots: config.hasSlots !== false, // Default to true
      hasEvents: config.hasEvents !== false, // Default to true
      timestamp: Date.now(),
      author: 'Component Generator'
    };
  }

  /**
   * Normalize component name to kebab-case
   * @param {string} name - Raw component name
   * @returns {string} Normalized name
   */
  normalizeComponentName(name) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  }

  /**
   * Convert string to PascalCase
   * @param {string} str - Input string
   * @returns {string} PascalCase string
   */
  toPascalCase(str) {
    return str
      .replace(/[-_\s]+(.)?/g, (_, char) => char ? char.toUpperCase() : '')
      .replace(/^./, char => char.toUpperCase());
  }

  /**
   * Get default properties based on component category
   * @param {string} category - Component category
   * @param {Array} userProperties - User-defined properties
   * @returns {Array} Combined properties
   */
  getDefaultProperties(category, userProperties = []) {
    const defaultProps = [
      { name: 'title', type: 'String', description: 'Component title', defaultValue: '', reflect: true }
    ];

    // Category-specific defaults
    switch (category) {
      case 'atoms':
        defaultProps.push(
          { name: 'variant', type: 'String', description: 'Visual variant', defaultValue: 'default', reflect: true },
          { name: 'size', type: 'String', description: 'Component size', defaultValue: 'md', reflect: true },
          { name: 'disabled', type: 'Boolean', description: 'Disabled state', defaultValue: false, reflect: true }
        );
        break;
      case 'molecules':
        defaultProps.push(
          { name: 'elevated', type: 'Boolean', description: 'Elevated appearance', defaultValue: false, reflect: true },
          { name: 'clickable', type: 'Boolean', description: 'Clickable behavior', defaultValue: false, reflect: true }
        );
        break;
      case 'organisms':
        defaultProps.push(
          { name: 'data', type: 'String', description: 'Component data (JSON)', defaultValue: '[]', reflect: false },
          { name: 'loading', type: 'Boolean', description: 'Loading state', defaultValue: false, reflect: true }
        );
        break;
    }

    // Merge with user properties (user properties take precedence)
    const userPropNames = userProperties.map(p => p.name);
    const filteredDefaults = defaultProps.filter(p => !userPropNames.includes(p.name));

    return [...filteredDefaults, ...userProperties];
  }

  /**
   * Generate all component files
   * @param {Object} config - Normalized configuration
   * @returns {Object} Generated file contents
   */
  generateAllFiles(config) {
    return {
      component: generateComponentTemplate(config),
      playgroundConfig: generatePlaygroundConfigTemplate(config),
      test: generateTestTemplate(config),
      story: generateStoryTemplate(config)
    };
  }

  /**
   * Create complete file structure with paths
   * @param {Object} config - Component configuration
   * @param {Object} files - Generated file contents
   * @returns {Object} File structure with paths
   */
  createFileStructure(config, files) {
    const basePath = `src/components/${config.category}`;
    const componentDir = `${basePath}/${config.name}`;

    return {
      [`${componentDir}/${config.name}.js`]: files.component,
      [`${componentDir}/${config.name}.test.js`]: files.test,
      [`${componentDir}/${config.name}.stories.js`]: files.story,
      [`${componentDir}/playground.config.js`]: files.playgroundConfig
    };
  }

  /**
   * Generate update for component loader
   * @param {Object} config - Component configuration
   * @returns {Object} Loader update information
   */
  generateComponentLoaderUpdate(config) {
    const importStatement = `case '${config.name}':
            componentModule = await import('../../components/${config.category}/${config.name}/${config.name}.js');
            break;`;

    const categoryUpdate = {
      category: config.category,
      componentName: config.name,
      importStatement
    };

    // Update available components list
    const availableComponentsUpdate = `'${config.name}'`;

    return {
      categoryUpdate,
      availableComponentsUpdate,
      instructions: [
        `1. Add to ${config.category} switch statement in ComponentLoader.loadComponent()`,
        `2. Add '${config.name}' to ${config.category} array in getAvailableComponents()`,
        `3. Consider adding specific playground configuration in loadPlaygroundConfig()`
      ]
    };
  }

  /**
   * Generate updates for index files
   * @param {Object} config - Component configuration
   * @returns {Object} Index file updates
   */
  generateIndexUpdates(config) {
    const exportStatement = `export { ${config.className} } from './${config.name}/${config.name}.js';`;

    return {
      [`src/components/${config.category}/index.js`]: {
        export: exportStatement,
        instructions: `Add this export to the ${config.category} index file`
      }
    };
  }

  /**
   * Preview generated files without creating them
   * @param {Object} config - Component configuration
   * @returns {Object} Preview result
   */
  previewComponent(config) {
    try {
      const validationResult = this.validateConfig(config);
      if (!validationResult.valid) {
        return {
          success: false,
          errors: validationResult.errors
        };
      }

      const normalizedConfig = this.normalizeConfig(config);
      const files = this.generateAllFiles(normalizedConfig);
      const fileStructure = this.createFileStructure(normalizedConfig, files);

      return {
        success: true,
        config: normalizedConfig,
        preview: {
          componentName: normalizedConfig.componentName,
          className: normalizedConfig.className,
          filesWillBeCreated: Object.keys(fileStructure),
          estimatedSize: this.calculateFileSize(fileStructure),
          properties: normalizedConfig.properties,
          category: normalizedConfig.category
        },
        fileContents: fileStructure
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Calculate total file size for generated components
   * @param {Object} fileStructure - File structure object
   * @returns {number} Estimated size in bytes
   */
  calculateFileSize(fileStructure) {
    return Object.values(fileStructure).reduce((total, content) => {
      return total + new Blob([content]).size;
    }, 0);
  }

  /**
   * Register a component as generated
   * @param {string} category - Component category
   * @param {string} name - Component name
   */
  registerComponent(category, name) {
    this.componentRegistry.add(`${category}/${name}`);
  }

  /**
   * Get list of generated components
   * @returns {Array} List of generated components
   */
  getGeneratedComponents() {
    return Array.from(this.componentRegistry).map(key => {
      const [category, name] = key.split('/');
      return { category, name };
    });
  }

  /**
   * Export component configuration
   * @param {Object} config - Component configuration
   * @returns {string} JSON configuration
   */
  exportConfig(config) {
    return JSON.stringify(config, null, 2);
  }

  /**
   * Import component configuration
   * @param {string} configJson - JSON configuration string
   * @returns {Object} Parsed configuration
   */
  importConfig(configJson) {
    try {
      return JSON.parse(configJson);
    } catch (error) {
      throw new Error(`Invalid configuration JSON: ${error.message}`);
    }
  }

  /**
   * Get generation statistics
   * @returns {Object} Generation statistics
   */
  getStatistics() {
    const components = this.getGeneratedComponents();
    const stats = components.reduce((acc, comp) => {
      acc[comp.category] = (acc[comp.category] || 0) + 1;
      return acc;
    }, {});

    return {
      total: components.length,
      byCategory: stats,
      recentGenerations: Array.from(this.generatedFiles.entries())
        .sort((a, b) => b[1].timestamp - a[1].timestamp)
        .slice(0, 10)
        .map(([name, data]) => ({
          name,
          timestamp: data.timestamp,
          category: data.category
        }))
    };
  }
}

// Export singleton instance
export const componentGenerator = new ComponentGenerator();
