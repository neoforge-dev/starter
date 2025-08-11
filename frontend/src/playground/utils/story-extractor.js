/**
 * Story Extractor - Convert Storybook stories to playground format
 * 
 * This utility extracts story information from .stories.js files and converts them
 * to the Native Web Components playground format.
 * 
 * Browser-compatible implementation using simulation for demo purposes.
 * In production, this would be done at build time with proper AST parsing.
 */

export class StoryExtractor {
  constructor() {
    this.storyCache = new Map();
  }

  /**
   * Extract story information from a .stories.js file
   * @param {string} filePath - Path to the .stories.js file
   * @returns {Promise<Object>} Extracted story information
   */
  async extractFromFile(filePath) {
    if (this.storyCache.has(filePath)) {
      return this.storyCache.get(filePath);
    }

    try {
      // For browser environment, we'll simulate the extraction
      // In a real implementation, this would be done at build time
      const storyInfo = await this.simulateExtraction(filePath);
      this.storyCache.set(filePath, storyInfo);
      return storyInfo;
    } catch (error) {
      console.error(`Error extracting stories from ${filePath}:`, error);
      return this.createEmptyStoryInfo();
    }
  }

  /**
   * Simulate story extraction (for testing/demo purposes)
   * In production, this would use AST parsing of the actual files
   */
  async simulateExtraction(filePath) {
    // Extract component information from file path
    const pathParts = filePath.split('/');
    const fileName = pathParts[pathParts.length - 1].replace('.stories.js', '');
    
    if (filePath.includes('button')) {
      return {
        component: 'neo-button',
        title: 'Atoms/Button',
        argTypes: {
          variant: {
            control: { type: 'select' },
            options: ['primary', 'secondary', 'tertiary', 'danger', 'ghost', 'text'],
            description: 'The visual style of the button',
            defaultValue: 'primary'
          },
          size: {
            control: { type: 'select' },
            options: ['sm', 'md', 'lg'],
            description: 'The size of the button',
            defaultValue: 'md'
          },
          disabled: {
            control: { type: 'boolean' },
            description: 'Whether the button is disabled',
            defaultValue: false
          },
          loading: {
            control: { type: 'boolean' },
            description: 'Whether the button is in loading state',
            defaultValue: false
          },
          label: {
            control: { type: 'text' },
            description: 'The text label of the button',
            defaultValue: 'Button'
          }
        },
        examples: [
          {
            name: 'Default',
            props: { label: 'Button', variant: 'primary', size: 'md' }
          },
          {
            name: 'Primary',
            props: { label: 'Primary Button', variant: 'primary' }
          },
          {
            name: 'Secondary', 
            props: { label: 'Secondary Button', variant: 'secondary' }
          },
          {
            name: 'Tertiary',
            props: { label: 'Tertiary Button', variant: 'tertiary' }
          },
          {
            name: 'Danger',
            props: { label: 'Danger Button', variant: 'danger' }
          },
          {
            name: 'Loading',
            props: { label: 'Loading Button', loading: true }
          },
          {
            name: 'Disabled',
            props: { label: 'Disabled Button', disabled: true }
          },
          {
            name: 'Small',
            props: { label: 'Small Button', size: 'sm' }
          },
          {
            name: 'Large',
            props: { label: 'Large Button', size: 'lg' }
          }
        ]
      };
    }

    // Default extraction for unknown components
    return this.createDefaultStoryInfo(fileName, pathParts);
  }

  createDefaultStoryInfo(fileName, pathParts) {
    const category = this.extractCategory(pathParts);
    return {
      component: `neo-${fileName}`,
      title: `${category}/${fileName}`,
      argTypes: {},
      examples: [
        {
          name: 'Default',
          props: {}
        }
      ]
    };
  }

  createEmptyStoryInfo() {
    return {
      component: 'unknown',
      title: 'Unknown',
      argTypes: {},
      examples: []
    };
  }

  extractCategory(pathParts) {
    if (pathParts.includes('atoms')) return 'Atoms';
    if (pathParts.includes('molecules')) return 'Molecules';
    if (pathParts.includes('organisms')) return 'Organisms';
    if (pathParts.includes('pages')) return 'Pages';
    return 'Components';
  }

  /**
   * Get all story files in the project
   * @returns {Promise<Array>} Array of story file paths
   */
  async getAllStoryFiles() {
    // In a real implementation, this would scan the filesystem
    // For demo purposes, we'll return a subset
    return [
      'src/components/atoms/button/button.stories.js',
      'src/components/atoms/icon/icon.stories.js',
      'src/components/atoms/badge/badge.stories.js',
      'src/components/molecules/card/card.stories.js',
      'src/components/molecules/modal/modal.stories.js'
    ];
  }
}