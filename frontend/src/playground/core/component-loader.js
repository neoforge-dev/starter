/**
 * Component Loader - Dynamic loading system for playground components
 * 
 * Handles loading and instantiation of components for the playground environment
 */
import { html, render } from 'lit';

export class ComponentLoader {
  constructor() {
    this.loadedComponents = new Map();
    this.componentCache = new Map();
  }

  /**
   * Load a component playground
   * @param {string} category - Component category (atoms, molecules, organisms, pages)
   * @param {string} name - Component name
   * @returns {Promise<Object>} Component playground configuration
   */
  async loadPlayground(category, name) {
    const cacheKey = `${category}/${name}`;
    
    if (this.componentCache.has(cacheKey)) {
      return this.componentCache.get(cacheKey);
    }

    try {
      // Load the actual component
      await this.loadComponent(category, name);
      
      // Load or generate playground configuration
      const playgroundConfig = await this.loadPlaygroundConfig(category, name);
      
      this.componentCache.set(cacheKey, playgroundConfig);
      return playgroundConfig;
    } catch (error) {
      console.error(`Error loading playground for ${cacheKey}:`, error);
      return this.createFallbackPlayground(category, name);
    }
  }

  /**
   * Load the actual component module
   * @param {string} category - Component category
   * @param {string} name - Component name
   */
  async loadComponent(category, name) {
    const componentKey = `${category}-${name}`;
    
    if (this.loadedComponents.has(componentKey)) {
      return this.loadedComponents.get(componentKey);
    }

    // Dynamic import based on our current working components
    let componentModule;
    try {
      if (category === 'atoms') {
        switch (name) {
          case 'button':
            componentModule = await import('../../components/atoms/button/button.js');
            break;
          case 'text-input':
            componentModule = await import('../../components/atoms/text-input/text-input.js');
            break;
          case 'icon':
            componentModule = await import('../../components/atoms/icon/icon.js');
            break;
          case 'badge':
            componentModule = await import('../../components/atoms/badge/badge.js');
            break;
          case 'checkbox':
            componentModule = await import('../../components/atoms/checkbox/checkbox.js');
            break;
          case 'link':
            componentModule = await import('../../components/atoms/link/link.js');
            break;
          case 'spinner':
            componentModule = await import('../../components/atoms/spinner/spinner.js');
            break;
          case 'progress-bar':
            componentModule = await import('../../components/atoms/progress/progress-bar.js');
            break;
          case 'radio':
            componentModule = await import('../../components/atoms/radio/radio.js');
            break;
          case 'select':
            componentModule = await import('../../components/atoms/select/select.js');
            break;
          case 'tooltip':
            componentModule = await import('../../components/atoms/tooltip/tooltip.js');
            break;
          case 'dropdown':
            componentModule = await import('../../components/atoms/dropdown.js');
            break;
          case 'input':
            componentModule = await import('../../components/atoms/input/input.js');
            break;
          default:
            throw new Error(`Component ${name} not yet migrated`);
        }
      } else if (category === 'molecules') {
        switch (name) {
          case 'alert':
            componentModule = await import('../../components/molecules/alert/alert.js');
            break;
          case 'card':
            componentModule = await import('../../components/molecules/card/card.js');
            break;
          case 'modal':
            componentModule = await import('../../components/molecules/modal/modal.js');
            break;
          case 'toast':
            componentModule = await import('../../components/molecules/toast/toast.js');
            break;
          case 'tabs':
            componentModule = await import('../../components/molecules/tabs.js');
            break;
          case 'breadcrumbs':
            componentModule = await import('../../components/molecules/breadcrumbs.js');
            break;
          case 'phone-input':
            componentModule = await import('../../components/molecules/phone-input.js');
            break;
          case 'date-picker':
            componentModule = await import('../../components/molecules/date-picker.js');
            break;
          case 'language-selector':
            componentModule = await import('../../components/molecules/language-selector.js');
            break;
          default:
            throw new Error(`Molecule component ${name} not yet migrated`);
        }
      } else {
        throw new Error(`Category ${category} not yet implemented`);
      }
      
      this.loadedComponents.set(componentKey, componentModule);
      return componentModule;
    } catch (error) {
      console.warn(`Component ${componentKey} could not be loaded:`, error.message);
      return null;
    }
  }

  /**
   * Load playground configuration for a component
   * @param {string} category - Component category  
   * @param {string} name - Component name
   * @returns {Promise<Object>} Playground configuration
   */
  async loadPlaygroundConfig(category, name) {
    // For components we know work, provide detailed configuration
    if (category === 'atoms' && name === 'button') {
      return {
        component: 'neo-button',
        title: 'Button Component',
        description: 'Interactive button component with multiple variants and states',
        examples: [
          {
            name: 'Primary Variants',
            description: 'Different button variants',
            variants: [
              { props: { variant: 'primary', size: 'sm' }, label: 'Small Primary' },
              { props: { variant: 'primary', size: 'md' }, label: 'Medium Primary' },
              { props: { variant: 'primary', size: 'lg' }, label: 'Large Primary' }
            ]
          },
          {
            name: 'Secondary Variants', 
            description: 'Secondary button styles',
            variants: [
              { props: { variant: 'secondary', size: 'sm' }, label: 'Small Secondary' },
              { props: { variant: 'secondary', size: 'md' }, label: 'Medium Secondary' },
              { props: { variant: 'secondary', size: 'lg' }, label: 'Large Secondary' }
            ]
          },
          {
            name: 'Button States',
            description: 'Different button states',
            variants: [
              { props: { variant: 'primary' }, label: 'Normal' },
              { props: { variant: 'primary', disabled: true }, label: 'Disabled' },
              { props: { variant: 'primary', loading: true }, label: 'Loading' }
            ]
          }
        ],
        argTypes: {
          variant: {
            control: 'select',
            options: ['primary', 'secondary', 'tertiary', 'danger', 'ghost', 'text'],
            defaultValue: 'primary',
            description: 'Visual style variant'
          },
          size: {
            control: 'select',
            options: ['sm', 'md', 'lg'],
            defaultValue: 'md',
            description: 'Button size'
          },
          disabled: {
            control: 'boolean',
            defaultValue: false,
            description: 'Disabled state'
          },
          loading: {
            control: 'boolean', 
            defaultValue: false,
            description: 'Loading state'
          },
          label: {
            control: 'text',
            defaultValue: 'Button',
            description: 'Button text content'
          }
        }
      };
    }

    // Add specific configurations for key components
    if (category === 'atoms' && name === 'link') {
      return {
        component: 'neo-link',
        title: 'Link Component',
        description: 'Navigation link with multiple variants and states',
        examples: [
          {
            name: 'Link Variants',
            description: 'Different link styles',
            variants: [
              { props: { href: '#', variant: 'default', label: 'Default Link' } },
              { props: { href: '#', variant: 'primary', label: 'Primary Link' } },
              { props: { href: '#', variant: 'secondary', label: 'Secondary Link' } }
            ]
          }
        ],
        argTypes: {
          href: { control: 'text', defaultValue: '#', description: 'Link destination' },
          variant: { control: 'select', options: ['default', 'primary', 'secondary', 'subtle'], defaultValue: 'default' },
          size: { control: 'select', options: ['sm', 'md', 'lg'], defaultValue: 'md' },
          underline: { control: 'select', options: ['none', 'hover', 'always'], defaultValue: 'hover' },
          disabled: { control: 'boolean', defaultValue: false },
          external: { control: 'boolean', defaultValue: false },
          label: { control: 'text', defaultValue: 'Link text', description: 'Link text content' }
        }
      };
    }

    if (category === 'atoms' && name === 'spinner') {
      return {
        component: 'neo-spinner',
        title: 'Spinner Component', 
        description: 'Loading spinner with multiple variants and sizes',
        examples: [
          {
            name: 'Spinner Variants',
            description: 'Different spinner styles',
            variants: [
              { props: { variant: 'border', size: 'md' } },
              { props: { variant: 'dots', size: 'md' } },
              { props: { variant: 'pulse', size: 'md' } }
            ]
          }
        ],
        argTypes: {
          size: { control: 'select', options: ['sm', 'md', 'lg'], defaultValue: 'md' },
          color: { control: 'select', options: ['primary', 'secondary', 'success', 'error'], defaultValue: 'primary' },
          variant: { control: 'select', options: ['border', 'dots', 'pulse'], defaultValue: 'border' },
          label: { control: 'text', defaultValue: 'Loading...', description: 'Screen reader label' }
        }
      };
    }

    if (category === 'atoms' && name === 'progress-bar') {
      return {
        component: 'neo-progress-bar',
        title: 'Progress Bar Component',
        description: 'Progress indicator with value display',
        examples: [
          {
            name: 'Progress States',
            description: 'Different progress values',
            variants: [
              { props: { value: 25 } },
              { props: { value: 50 } },
              { props: { value: 75 } },
              { props: { value: 100 } }
            ]
          }
        ],
        argTypes: {
          value: { control: 'number', defaultValue: 50, description: 'Progress value (0-100)' },
          max: { control: 'number', defaultValue: 100, description: 'Maximum value' },
          variant: { control: 'select', options: ['default', 'success', 'error'], defaultValue: 'default' },
          size: { control: 'select', options: ['sm', 'md', 'lg'], defaultValue: 'md' },
          indeterminate: { control: 'boolean', defaultValue: false },
          showLabel: { control: 'boolean', defaultValue: false },
          label: { control: 'text', defaultValue: '', description: 'Custom label text' }
        }
      };
    }

    if (category === 'molecules' && name === 'card') {
      return {
        component: 'neo-card',
        title: 'Card Component',
        description: 'Flexible content container with header, body, and footer sections',
        examples: [
          {
            name: 'Card Variants',
            description: 'Different card styles',
            variants: [
              { props: { title: 'Basic Card', text: 'Simple card content' } },
              { props: { title: 'Elevated Card', elevated: true, text: 'Card with elevation' } }
            ]
          }
        ],
        argTypes: {
          title: { control: 'text', defaultValue: 'Card Title', description: 'Card title' },
          text: { control: 'text', defaultValue: 'Card content goes here', description: 'Card body text' },
          elevated: { control: 'boolean', defaultValue: false, description: 'Add elevation shadow' },
          clickable: { control: 'boolean', defaultValue: false, description: 'Enable click interactions' }
        }
      };
    }

    if (category === 'molecules' && name === 'alert') {
      return {
        component: 'neo-alert',
        title: 'Alert Component',
        description: 'Contextual feedback messages for user actions',
        examples: [
          {
            name: 'Alert Types',
            description: 'Different alert severities',
            variants: [
              { props: { type: 'info', message: 'Information alert' } },
              { props: { type: 'success', message: 'Success alert' } },
              { props: { type: 'warning', message: 'Warning alert' } },
              { props: { type: 'error', message: 'Error alert' } }
            ]
          }
        ],
        argTypes: {
          type: { control: 'select', options: ['info', 'success', 'warning', 'error'], defaultValue: 'info' },
          message: { control: 'text', defaultValue: 'Alert message', description: 'Alert content' },
          title: { control: 'text', defaultValue: '', description: 'Alert title (optional)' },
          dismissible: { control: 'boolean', defaultValue: false, description: 'Show close button' },
          icon: { control: 'boolean', defaultValue: true, description: 'Show status icon' }
        }
      };
    }

    // Default configuration for other components
    return this.createDefaultPlaygroundConfig(category, name);
  }

  /**
   * Create default playground configuration
   */
  createDefaultPlaygroundConfig(category, name) {
    return {
      component: `neo-${name}`,
      title: `${name.charAt(0).toUpperCase() + name.slice(1)} Component`,
      description: `${name} component from ${category} category`,
      examples: [
        {
          name: 'Default',
          description: 'Default component state',
          variants: [
            { props: {}, label: 'Default' }
          ]
        }
      ],
      argTypes: {}
    };
  }

  /**
   * Create fallback playground when component fails to load
   */
  createFallbackPlayground(category, name) {
    return {
      component: `neo-${name}`,
      title: `${name} (Not Available)`,
      description: `Component ${name} from ${category} is not yet available in the playground`,
      examples: [],
      argTypes: {},
      error: true
    };
  }

  /**
   * Render a component example
   * @param {string} componentName - Name of the component
   * @param {Object} props - Component properties
   * @returns {TemplateResult} Lit template
   */
  renderExample(componentName, props) {
    // Create attributes string from props
    const attributes = Object.entries(props)
      .map(([key, value]) => {
        if (typeof value === 'boolean') {
          return value ? key : '';
        }
        return `${key}="${value}"`;
      })
      .filter(Boolean)
      .join(' ');

    // Create the component HTML
    const componentHtml = `<${componentName} ${attributes}>${props.label || ''}</${componentName}>`;
    
    return html`${componentHtml}`;
  }

  /**
   * Auto-detect component properties from actual component definition
   * @param {string} componentName - Name of the custom element
   * @returns {Object} Detected properties configuration
   */
  detectComponentProperties(componentName) {
    const elementConstructor = customElements.get(componentName);
    if (!elementConstructor) {
      console.warn(`Component ${componentName} not found in custom elements registry`);
      return {};
    }

    const detectedProps = {};

    // Check for Lit static properties
    if (elementConstructor.properties) {
      Object.entries(elementConstructor.properties).forEach(([propName, config]) => {
        detectedProps[propName] = this.createPropertyConfig(propName, config);
      });
    }

    // Check for observed attributes (standard web components)
    if (elementConstructor.observedAttributes) {
      elementConstructor.observedAttributes.forEach(attr => {
        if (!detectedProps[attr]) {
          detectedProps[attr] = this.createPropertyConfig(attr, { type: String });
        }
      });
    }

    // Add common component properties if not already detected
    const commonProps = {
      disabled: { control: { type: 'boolean' }, defaultValue: false },
      className: { control: { type: 'text' }, defaultValue: '' },
      id: { control: { type: 'text' }, defaultValue: '' }
    };

    Object.entries(commonProps).forEach(([prop, config]) => {
      if (!detectedProps[prop]) {
        detectedProps[prop] = config;
      }
    });

    return detectedProps;
  }

  /**
   * Create property configuration from Lit property definition
   */
  createPropertyConfig(propName, litConfig) {
    const config = {
      description: `${propName} property`,
      defaultValue: litConfig.defaultValue || this.getDefaultForType(litConfig.type)
    };

    // Map Lit types to control types
    switch (litConfig.type) {
      case Boolean:
        config.control = { type: 'boolean' };
        break;
      case Number:
        config.control = { type: 'number' };
        break;
      case String:
      default:
        config.control = { type: 'text' };
    }

    // Special handling for known properties
    if (propName === 'variant' && this.isButtonComponent(propName)) {
      config.control = { type: 'select' };
      config.options = ['primary', 'secondary', 'tertiary', 'danger', 'ghost', 'text'];
    }
    
    if (propName === 'size' && this.isButtonComponent(propName)) {
      config.control = { type: 'select' };
      config.options = ['sm', 'md', 'lg'];
    }

    return config;
  }

  /**
   * Get default value for Lit property type
   */
  getDefaultForType(type) {
    switch (type) {
      case Boolean: return false;
      case Number: return 0;
      case Array: return [];
      case Object: return {};
      case String:
      default: return '';
    }
  }

  /**
   * Check if this is a button-like component
   */
  isButtonComponent(propName) {
    // Simple heuristic - could be made more sophisticated
    return true; // For now, assume all components might have these properties
  }

  /**
   * Get list of available components
   * @returns {Array} Array of available components by category
   */
  getAvailableComponents() {
    return {
      atoms: [
        'button', 'text-input', 'icon', 'badge', 'checkbox',
        'link', 'spinner', 'progress-bar', 'radio', 'select', 
        'tooltip', 'dropdown', 'input'
      ],
      molecules: [
        'alert', 'card', 'modal', 'toast', 'tabs',
        'breadcrumbs', 'phone-input', 'date-picker', 'language-selector'
      ],
      organisms: [],
      pages: []
    };
  }
}