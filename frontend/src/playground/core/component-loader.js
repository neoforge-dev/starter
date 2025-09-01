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
      } else if (category === 'organisms') {
        switch (name) {
          case 'neo-table':
            componentModule = await import('../../components/organisms/neo-table.js');
            break;
          case 'neo-data-grid':
            componentModule = await import('../../components/organisms/neo-data-grid.js');
            break;
          case 'neo-form-builder':
            componentModule = await import('../../components/organisms/neo-form-builder.js');
            break;
          case 'data-table':
            componentModule = await import('../../components/organisms/data-table.js');
            break;
          case 'form':
            componentModule = await import('../../components/organisms/form.js');
            break;
          case 'pagination':
            componentModule = await import('../../components/organisms/pagination.js');
            break;
          case 'charts':
            componentModule = await import('../../components/organisms/charts.js');
            break;
          case 'file-upload':
            componentModule = await import('../../components/organisms/file-upload.js');
            break;
          case 'rich-text-editor':
            componentModule = await import('../../components/organisms/rich-text-editor.js');
            break;
          case 'form-validation':
            componentModule = await import('../../components/organisms/form-validation.js');
            break;
          case 'table':
            componentModule = await import('../../components/organisms/table/table.js');
            break;
          default:
            throw new Error(`Organism component ${name} not yet migrated`);
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

    // Add organism component configurations
    if (category === 'organisms' && name === 'neo-table') {
      return {
        component: 'neo-table',
        title: 'Neo Table Component',
        description: 'Advanced data table with sorting, filtering, and pagination capabilities',
        examples: [
          {
            name: 'Basic Table',
            description: 'Simple data table with basic features',
            variants: [
              {
                props: {
                  data: JSON.stringify([
                    { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin' },
                    { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User' },
                    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'Editor' }
                  ]),
                  columns: JSON.stringify([
                    { key: 'name', label: 'Name', sortable: true },
                    { key: 'email', label: 'Email', sortable: true },
                    { key: 'role', label: 'Role' }
                  ])
                }
              }
            ]
          },
          {
            name: 'Advanced Features',
            description: 'Table with sorting, filtering, and selection',
            variants: [
              {
                props: {
                  data: JSON.stringify([
                    { id: 1, name: 'Alice Brown', email: 'alice@example.com', role: 'Admin', status: 'Active' },
                    { id: 2, name: 'Charlie Davis', email: 'charlie@example.com', role: 'User', status: 'Inactive' },
                    { id: 3, name: 'Diana Wilson', email: 'diana@example.com', role: 'Editor', status: 'Active' }
                  ]),
                  columns: JSON.stringify([
                    { key: 'name', label: 'Name', sortable: true, filterable: true },
                    { key: 'email', label: 'Email', sortable: true },
                    { key: 'role', label: 'Role', filterable: true },
                    { key: 'status', label: 'Status', filterable: true }
                  ]),
                  selectable: true,
                  searchable: true
                }
              }
            ]
          }
        ],
        argTypes: {
          data: { control: 'text', defaultValue: '[]', description: 'JSON array of table data' },
          columns: { control: 'text', defaultValue: '[]', description: 'JSON array of column definitions' },
          selectable: { control: 'boolean', defaultValue: false, description: 'Enable row selection' },
          searchable: { control: 'boolean', defaultValue: false, description: 'Enable search functionality' },
          sortable: { control: 'boolean', defaultValue: true, description: 'Enable column sorting' },
          filterable: { control: 'boolean', defaultValue: false, description: 'Enable column filters' },
          pageSize: { control: 'number', defaultValue: 10, description: 'Number of rows per page' },
          striped: { control: 'boolean', defaultValue: false, description: 'Striped row styling' },
          bordered: { control: 'boolean', defaultValue: false, description: 'Table border styling' },
          compact: { control: 'boolean', defaultValue: false, description: 'Compact row spacing' }
        }
      };
    }

    if (category === 'organisms' && name === 'neo-data-grid') {
      return {
        component: 'neo-data-grid',
        title: 'Neo Data Grid Component',
        description: 'Interactive data grid with inline editing and advanced features',
        examples: [
          {
            name: 'Editable Grid',
            description: 'Data grid with inline editing capabilities',
            variants: [
              {
                props: {
                  data: JSON.stringify([
                    { id: 1, product: 'Laptop', price: 999.99, category: 'Electronics', inStock: true },
                    { id: 2, product: 'Mouse', price: 29.99, category: 'Electronics', inStock: false },
                    { id: 3, product: 'Keyboard', price: 79.99, category: 'Electronics', inStock: true }
                  ]),
                  columns: JSON.stringify([
                    { key: 'product', label: 'Product', editable: true, type: 'text' },
                    { key: 'price', label: 'Price', editable: true, type: 'number' },
                    { key: 'category', label: 'Category', editable: true, type: 'select', options: ['Electronics', 'Clothing', 'Books'] },
                    { key: 'inStock', label: 'In Stock', editable: true, type: 'boolean' }
                  ]),
                  editable: true
                }
              }
            ]
          },
          {
            name: 'Virtual Scrolling',
            description: 'Grid with virtual scrolling for large datasets',
            variants: [
              {
                props: {
                  data: JSON.stringify(Array.from({ length: 100 }, (_, i) => ({
                    id: i + 1,
                    name: `Item ${i + 1}`,
                    value: Math.floor(Math.random() * 1000),
                    category: ['A', 'B', 'C'][i % 3]
                  }))),
                  columns: JSON.stringify([
                    { key: 'name', label: 'Name' },
                    { key: 'value', label: 'Value' },
                    { key: 'category', label: 'Category' }
                  ]),
                  virtualScrolling: true,
                  height: 400
                }
              }
            ]
          }
        ],
        argTypes: {
          data: { control: 'text', defaultValue: '[]', description: 'JSON array of grid data' },
          columns: { control: 'text', defaultValue: '[]', description: 'JSON array of column definitions' },
          editable: { control: 'boolean', defaultValue: false, description: 'Enable inline editing' },
          virtualScrolling: { control: 'boolean', defaultValue: false, description: 'Enable virtual scrolling' },
          height: { control: 'number', defaultValue: 400, description: 'Grid height in pixels' },
          rowHeight: { control: 'number', defaultValue: 40, description: 'Row height in pixels' },
          selectionMode: { control: 'select', options: ['none', 'single', 'multiple'], defaultValue: 'none', description: 'Row selection mode' },
          showRowNumbers: { control: 'boolean', defaultValue: false, description: 'Show row numbers column' },
          autoSave: { control: 'boolean', defaultValue: false, description: 'Auto-save changes' },
          validateOnEdit: { control: 'boolean', defaultValue: true, description: 'Validate data on edit' }
        }
      };
    }

    if (category === 'organisms' && name === 'neo-form-builder') {
      return {
        component: 'neo-form-builder',
        title: 'Neo Form Builder Component',
        description: 'Dynamic form builder with drag-and-drop field management',
        examples: [
          {
            name: 'Contact Form',
            description: 'Pre-built contact form configuration',
            variants: [
              {
                props: {
                  schema: JSON.stringify({
                    fields: [
                      { type: 'text', name: 'name', label: 'Full Name', required: true, placeholder: 'Enter your name' },
                      { type: 'email', name: 'email', label: 'Email Address', required: true, placeholder: 'Enter your email' },
                      { type: 'select', name: 'subject', label: 'Subject', required: true, options: ['General Inquiry', 'Support', 'Sales'] },
                      { type: 'textarea', name: 'message', label: 'Message', required: true, placeholder: 'Your message...', rows: 4 }
                    ]
                  }),
                  layout: 'vertical'
                }
              }
            ]
          },
          {
            name: 'Registration Form',
            description: 'User registration form with validation',
            variants: [
              {
                props: {
                  schema: JSON.stringify({
                    fields: [
                      { type: 'text', name: 'firstName', label: 'First Name', required: true, validation: { minLength: 2 } },
                      { type: 'text', name: 'lastName', label: 'Last Name', required: true, validation: { minLength: 2 } },
                      { type: 'email', name: 'email', label: 'Email', required: true },
                      { type: 'password', name: 'password', label: 'Password', required: true, validation: { minLength: 8 } },
                      { type: 'password', name: 'confirmPassword', label: 'Confirm Password', required: true },
                      { type: 'checkbox', name: 'terms', label: 'I agree to the terms and conditions', required: true },
                      { type: 'checkbox', name: 'newsletter', label: 'Subscribe to newsletter' }
                    ]
                  }),
                  layout: 'horizontal',
                  validateOnChange: true
                }
              }
            ]
          },
          {
            name: 'Survey Form',
            description: 'Multi-step survey with conditional fields',
            variants: [
              {
                props: {
                  schema: JSON.stringify({
                    steps: [
                      {
                        title: 'Personal Information',
                        fields: [
                          { type: 'text', name: 'name', label: 'Name', required: true },
                          { type: 'number', name: 'age', label: 'Age', required: true, min: 18, max: 100 },
                          { type: 'radio', name: 'role', label: 'Role', required: true, options: ['Developer', 'Designer', 'Manager', 'Other'] }
                        ]
                      },
                      {
                        title: 'Preferences',
                        fields: [
                          { type: 'checkbox-group', name: 'interests', label: 'Interests', options: ['Technology', 'Design', 'Business', 'Marketing'] },
                          { type: 'range', name: 'experience', label: 'Years of Experience', min: 0, max: 20, step: 1 },
                          { type: 'textarea', name: 'feedback', label: 'Additional Comments', rows: 3 }
                        ]
                      }
                    ]
                  }),
                  multiStep: true,
                  showProgress: true
                }
              }
            ]
          }
        ],
        argTypes: {
          schema: { control: 'text', defaultValue: '{"fields":[]}', description: 'JSON form schema' },
          layout: { control: 'select', options: ['vertical', 'horizontal', 'inline'], defaultValue: 'vertical', description: 'Form layout' },
          validateOnChange: { control: 'boolean', defaultValue: false, description: 'Validate fields on change' },
          validateOnBlur: { control: 'boolean', defaultValue: true, description: 'Validate fields on blur' },
          showValidation: { control: 'boolean', defaultValue: true, description: 'Show validation messages' },
          multiStep: { control: 'boolean', defaultValue: false, description: 'Enable multi-step form' },
          showProgress: { control: 'boolean', defaultValue: false, description: 'Show progress indicator' },
          readonly: { control: 'boolean', defaultValue: false, description: 'Make form read-only' },
          disabled: { control: 'boolean', defaultValue: false, description: 'Disable form inputs' },
          submitText: { control: 'text', defaultValue: 'Submit', description: 'Submit button text' }
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
      organisms: [
        'neo-table', 'neo-data-grid', 'neo-form-builder', 'data-table', 'form',
        'pagination', 'charts', 'file-upload', 'rich-text-editor', 'form-validation', 'table'
      ],
      pages: []
    };
  }
}
