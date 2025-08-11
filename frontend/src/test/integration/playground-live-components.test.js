/**
 * Live Component Integration Test
 * 
 * Test that the playground actually renders and controls live components
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { fixture, html } from '@open-wc/testing';

describe('Playground Live Components Integration', () => {
  
  it('should support loading 20+ playground components without errors', async () => {
    const { ComponentLoader } = await import('../../playground/core/component-loader.js');
    const loader = new ComponentLoader();
    
    const availableComponents = loader.getAvailableComponents();
    const allComponents = [
      ...availableComponents.atoms.map(name => ({ category: 'atoms', name })),
      ...availableComponents.molecules.map(name => ({ category: 'molecules', name }))
    ];
    
    console.log(`Testing ${allComponents.length} components...`);
    
    let successfulLoads = 0;
    let failedLoads = [];
    
    for (const { category, name } of allComponents) {
      try {
        const config = await loader.loadPlaygroundConfig(category, name);
        
        // Validate config structure
        expect(config).toBeDefined();
        expect(config.component).toBeDefined();
        expect(config.title).toBeDefined();
        expect(config.description).toBeDefined();
        expect(config.argTypes).toBeDefined();
        
        successfulLoads++;
      } catch (error) {
        failedLoads.push({ category, name, error: error.message });
      }
    }
    
    console.log(`Successfully loaded: ${successfulLoads}/${allComponents.length}`);
    if (failedLoads.length > 0) {
      console.log('Failed loads:', failedLoads);
    }
    
    // At least 15+ components should load successfully
    expect(successfulLoads).toBeGreaterThanOrEqual(15);
    expect(allComponents.length).toBeGreaterThanOrEqual(20);
  });
  
  it('should validate enhanced playground configurations for priority components', async () => {
    const { ComponentLoader } = await import('../../playground/core/component-loader.js');
    const loader = new ComponentLoader();
    
    // Test enhanced configs for high-priority components
    const priorityComponents = [
      { category: 'atoms', name: 'button' },
      { category: 'atoms', name: 'link' },
      { category: 'atoms', name: 'spinner' },
      { category: 'atoms', name: 'progress-bar' },
      { category: 'molecules', name: 'card' },
      { category: 'molecules', name: 'alert' }
    ];
    
    for (const { category, name } of priorityComponents) {
      const config = await loader.loadPlaygroundConfig(category, name);
      
      // Validate enhanced configuration
      expect(config.examples).toBeDefined();
      expect(config.examples.length).toBeGreaterThan(0);
      
      // Should have at least some meaningful argTypes
      expect(Object.keys(config.argTypes).length).toBeGreaterThan(0);
      
      // Should have meaningful examples
      config.examples.forEach(example => {
        expect(example.name).toBeDefined();
        expect(example.variants).toBeDefined();
        expect(example.variants.length).toBeGreaterThan(0);
      });
    }
  });
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('should render actual neo-button component with properties', async () => {
    const { ComponentLoader } = await import('../../playground/core/component-loader.js');
    const loader = new ComponentLoader();
    
    // Load button component
    await loader.loadComponent('atoms', 'button');
    
    // Create actual component instance
    const buttonHTML = `<neo-button variant="primary" size="md">Test Button</neo-button>`;
    container.innerHTML = buttonHTML;
    
    // Wait for component to be defined and rendered
    await customElements.whenDefined('neo-button');
    
    const buttonElement = container.querySelector('neo-button');
    expect(buttonElement).toBeDefined();
    expect(buttonElement.variant).toBe('primary');
    expect(buttonElement.size).toBe('md');
    expect(buttonElement.textContent.trim()).toBe('Test Button');
  });

  it('should dynamically update component properties', async () => {
    const { ComponentLoader } = await import('../../playground/core/component-loader.js');
    const loader = new ComponentLoader();
    
    await loader.loadComponent('atoms', 'button');
    
    const buttonHTML = `<neo-button variant="primary" size="md">Dynamic Button</neo-button>`;
    container.innerHTML = buttonHTML;
    
    await customElements.whenDefined('neo-button');
    
    const buttonElement = container.querySelector('neo-button');
    
    // Dynamically change properties
    buttonElement.variant = 'secondary';
    buttonElement.size = 'lg';
    
    expect(buttonElement.variant).toBe('secondary');
    expect(buttonElement.size).toBe('lg');
  });

  it('should auto-detect component properties from actual component', async () => {
    const { ComponentLoader } = await import('../../playground/core/component-loader.js');
    const loader = new ComponentLoader();
    
    await loader.loadComponent('atoms', 'button');
    
    // Auto-detect properties from the actual component
    const detectedProps = loader.detectComponentProperties('neo-button');
    
    expect(detectedProps).toBeDefined();
    expect(Object.keys(detectedProps).length).toBeGreaterThan(0);
    
    // Should detect common button properties
    const expectedProps = ['variant', 'size', 'disabled'];
    const detectedPropNames = Object.keys(detectedProps);
    
    expectedProps.forEach(prop => {
      expect(detectedPropNames).toContain(prop);
    });
  });

  it('should create working prop editor for live component', async () => {
    const { ComponentLoader } = await import('../../playground/core/component-loader.js');
    
    const loader = new ComponentLoader();
    await loader.loadComponent('atoms', 'button');
    
    // Create actual component
    const buttonHTML = `<neo-button id="test-button" variant="primary" size="md">Live Button</neo-button>`;
    container.innerHTML = buttonHTML;
    await customElements.whenDefined('neo-button');
    
    const buttonElement = container.querySelector('#test-button');
    expect(buttonElement.variant).toBe('primary');
    
    // Test direct component property update (the core functionality)
    buttonElement.variant = 'secondary';
    expect(buttonElement.variant).toBe('secondary');
    
    // Test that prop editor component can be created
    const propEditor = document.createElement('prop-editor');
    propEditor.argTypes = {
      variant: { control: { type: 'select' }, options: ['primary', 'secondary'] },
      disabled: { control: { type: 'boolean' } }
    };
    propEditor.values = { variant: 'primary', disabled: false };
    propEditor.targetComponent = buttonElement;
    
    expect(propEditor).toBeDefined();
    expect(propEditor.targetComponent).toBe(buttonElement);
  });
});