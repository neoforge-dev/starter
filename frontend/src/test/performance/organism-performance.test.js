/**
 * Organism Component Performance Test
 * 
 * Verify that organism components can be loaded and switched within performance targets
 */
import { describe, it, expect } from 'vitest';

describe('Organism Component Performance', () => {
  
  it('should load organism components within 50ms performance target', async () => {
    const { ComponentLoader } = await import('../../playground/core/component-loader.js');
    const loader = new ComponentLoader();
    
    const organismComponents = ['neo-table', 'neo-data-grid', 'neo-form-builder'];
    
    for (const componentName of organismComponents) {
      const startTime = performance.now();
      
      // Load component configuration (this is what happens during component switching)
      const config = await loader.loadPlaygroundConfig('organisms', componentName);
      
      const endTime = performance.now();
      const loadTime = endTime - startTime;
      
      console.log(`${componentName} loaded in ${loadTime.toFixed(2)}ms`);
      
      // Should load within 50ms performance target
      expect(loadTime).toBeLessThan(50);
      expect(config).toBeDefined();
      expect(config.examples.length).toBeGreaterThan(0);
    }
  });

  it('should cache organism components for subsequent loads', async () => {
    const { ComponentLoader } = await import('../../playground/core/component-loader.js');
    const loader = new ComponentLoader();
    
    const componentName = 'neo-table';
    
    // First load (uncached)
    const startTime1 = performance.now();
    await loader.loadPlaygroundConfig('organisms', componentName);
    const endTime1 = performance.now();
    const firstLoad = endTime1 - startTime1;
    
    // Second load (cached)
    const startTime2 = performance.now();
    await loader.loadPlaygroundConfig('organisms', componentName);
    const endTime2 = performance.now();
    const secondLoad = endTime2 - startTime2;
    
    console.log(`First load: ${firstLoad.toFixed(2)}ms, Second load: ${secondLoad.toFixed(2)}ms`);
    
    // Cached load should be significantly faster
    expect(secondLoad).toBeLessThan(firstLoad);
    expect(secondLoad).toBeLessThan(5); // Cached loads should be very fast
  });

  it('should handle rapid component switching without performance degradation', async () => {
    const { ComponentLoader } = await import('../../playground/core/component-loader.js');
    const loader = new ComponentLoader();
    
    const components = [
      { category: 'atoms', name: 'button' },
      { category: 'organisms', name: 'neo-table' },
      { category: 'molecules', name: 'card' },
      { category: 'organisms', name: 'neo-data-grid' },
      { category: 'atoms', name: 'spinner' },
      { category: 'organisms', name: 'neo-form-builder' }
    ];
    
    const loadTimes = [];
    
    // Simulate rapid component switching
    for (const { category, name } of components) {
      const startTime = performance.now();
      await loader.loadPlaygroundConfig(category, name);
      const endTime = performance.now();
      
      loadTimes.push(endTime - startTime);
    }
    
    const avgLoadTime = loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length;
    const maxLoadTime = Math.max(...loadTimes);
    
    console.log(`Average load time: ${avgLoadTime.toFixed(2)}ms`);
    console.log(`Max load time: ${maxLoadTime.toFixed(2)}ms`);
    
    // All loads should be within performance targets
    expect(avgLoadTime).toBeLessThan(25); // Average should be well under target
    expect(maxLoadTime).toBeLessThan(50); // No single load should exceed target
  });
});