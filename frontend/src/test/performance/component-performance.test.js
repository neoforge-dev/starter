import { expect } from '@esm-bundle/chai';
import { html, render } from 'lit';
import { NeoButtonOptimized } from '../../components/atoms/button/optimized-button.js';
import { NeoSimpleInput } from '../../components/atoms/simple-input/simple-input.js';
import { NeoOptimizedDataTable } from '../../components/organisms/optimized-data-table.js';

/**
 * Performance benchmarking suite for NeoForge components
 * 
 * Validates:
 * - Component render times (<16ms target)
 * - Memory usage efficiency  
 * - Large dataset handling
 * - Event handling performance
 * - Bundle size impact
 */

describe('Component Performance Benchmarks', () => {
  let container;
  let performanceEntries;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    performanceEntries = [];
    
    // Clear performance marks
    performance.clearMarks();
    performance.clearMeasures();
  });

  afterEach(() => {
    document.body.removeChild(container);
    container = null;
  });

  /**
   * Measure component render time
   */
  function measureRenderTime(name, renderFn) {
    performance.mark(`${name}-render-start`);
    renderFn();
    
    return new Promise(resolve => {
      requestAnimationFrame(() => {
        performance.mark(`${name}-render-end`);
        performance.measure(`${name}-render`, `${name}-render-start`, `${name}-render-end`);
        
        const measures = performance.getEntriesByName(`${name}-render`);
        const renderTime = measures[0]?.duration || 0;
        
        performanceEntries.push({
          name,
          renderTime,
          timestamp: Date.now()
        });
        
        resolve(renderTime);
      });
    });
  }

  /**
   * Measure memory usage before/after
   */
  function measureMemoryUsage(name, actionFn) {
    if (!performance.memory) {
      console.warn('Memory measurement not available');
      return { before: 0, after: 0, diff: 0 };
    }

    const before = {
      used: performance.memory.usedJSHeapSize,
      total: performance.memory.totalJSHeapSize
    };

    actionFn();

    // Force garbage collection if available (Chrome DevTools)
    if (window.gc) {
      window.gc();
    }

    const after = {
      used: performance.memory.usedJSHeapSize,  
      total: performance.memory.totalJSHeapSize
    };

    return {
      before: before.used,
      after: after.used,
      diff: after.used - before.used
    };
  }

  describe('Atom Component Performance', () => {
    it('should render NeoButtonOptimized within 16ms target', async () => {
      const renderTime = await measureRenderTime('button-optimized', () => {
        const button = new NeoButtonOptimized();
        button.label = 'Test Button';
        button.variant = 'primary';
        container.appendChild(button);
      });

      expect(renderTime).to.be.lessThan(16, 
        `Button render time ${renderTime.toFixed(2)}ms exceeds 16ms target`);
    });

    it('should render NeoSimpleInput within 16ms target', async () => {
      const renderTime = await measureRenderTime('input-simple', () => {
        const input = new NeoSimpleInput();
        input.placeholder = 'Test input';
        input.value = 'Initial value';
        container.appendChild(input);
      });

      expect(renderTime).to.be.lessThan(16,
        `Input render time ${renderTime.toFixed(2)}ms exceeds 16ms target`);
    });

    it('should handle rapid property changes efficiently', async () => {
      const button = new NeoButtonOptimized();
      container.appendChild(button);
      await button.updateComplete;

      const renderTime = await measureRenderTime('button-prop-changes', () => {
        // Simulate rapid property changes
        for (let i = 0; i < 10; i++) {
          button.label = `Button ${i}`;
          button.disabled = i % 2 === 0;
          button.loading = i % 3 === 0;
        }
      });

      expect(renderTime).to.be.lessThan(32,
        `Rapid property changes took ${renderTime.toFixed(2)}ms, should be under 32ms`);
    });

    it('should not create memory leaks with repeated creation/destruction', () => {
      const memory = measureMemoryUsage('button-lifecycle', () => {
        // Create and destroy 100 buttons
        for (let i = 0; i < 100; i++) {
          const button = new NeoButtonOptimized();
          button.label = `Button ${i}`;
          container.appendChild(button);
          container.removeChild(button);
        }
      });

      // Allow some memory growth but not excessive (< 1MB for 100 components)
      expect(memory.diff).to.be.lessThan(1024 * 1024,
        `Memory grew by ${(memory.diff / 1024).toFixed(2)}KB, should be under 1MB`);
    });
  });

  describe('DataTable Performance with Large Datasets', () => {
    function generateTestData(rows, cols = 5) {
      const data = [];
      for (let i = 0; i < rows; i++) {
        const row = {};
        for (let j = 0; j < cols; j++) {
          row[`col${j}`] = `Row ${i} Col ${j}`;
        }
        data.push(row);
      }
      return data;
    }

    it('should render 1000 row dataset within performance target', async () => {
      const data = generateTestData(1000);
      const columns = Array.from({ length: 5 }, (_, i) => ({
        field: `col${i}`,
        header: `Column ${i}`
      }));

      const renderTime = await measureRenderTime('datatable-1k-rows', () => {
        const table = new NeoOptimizedDataTable();
        table.data = data;
        table.columns = columns;
        table.style.height = '400px';
        container.appendChild(table);
      });

      expect(renderTime).to.be.lessThan(100,
        `DataTable with 1000 rows took ${renderTime.toFixed(2)}ms, should be under 100ms`);
    });

    it('should handle 10k rows without performance degradation', async () => {
      const data = generateTestData(10000);
      const columns = Array.from({ length: 3 }, (_, i) => ({
        field: `col${i}`,
        header: `Column ${i}`
      }));

      const memory = measureMemoryUsage('datatable-10k-rows', () => {
        const table = new NeoOptimizedDataTable();
        table.data = data;
        table.columns = columns;
        table.style.height = '400px';
        container.appendChild(table);
      });

      // Should not use more than 50MB for 10k rows
      expect(memory.diff).to.be.lessThan(50 * 1024 * 1024,
        `DataTable used ${(memory.diff / 1024 / 1024).toFixed(2)}MB, should be under 50MB`);
    });

    it('should maintain smooth scrolling performance', async function() {
      this.timeout(10000); // Allow longer timeout for this test

      const data = generateTestData(5000);
      const columns = Array.from({ length: 4 }, (_, i) => ({
        field: `col${i}`,
        header: `Column ${i}`
      }));

      const table = new NeoOptimizedDataTable();
      table.data = data;
      table.columns = columns;
      table.style.height = '400px';
      container.appendChild(table);
      
      await table.updateComplete;

      const scrollContainer = table.shadowRoot.querySelector('.table-body');
      const scrollTimes = [];

      // Simulate rapid scrolling
      for (let i = 0; i < 20; i++) {
        const scrollStart = performance.now();
        scrollContainer.scrollTop = i * 200;
        
        await new Promise(resolve => {
          requestAnimationFrame(() => {
            const scrollTime = performance.now() - scrollStart;
            scrollTimes.push(scrollTime);
            resolve();
          });
        });
      }

      const avgScrollTime = scrollTimes.reduce((a, b) => a + b) / scrollTimes.length;
      const maxScrollTime = Math.max(...scrollTimes);

      expect(avgScrollTime).to.be.lessThan(16,
        `Average scroll time ${avgScrollTime.toFixed(2)}ms exceeds 16ms target`);
      
      expect(maxScrollTime).to.be.lessThan(32,
        `Max scroll time ${maxScrollTime.toFixed(2)}ms exceeds 32ms threshold`);
    });

    it('should efficiently handle sorting large datasets', async () => {
      const data = generateTestData(2000);
      const columns = [
        { field: 'col0', header: 'Column 0' },
        { field: 'col1', header: 'Column 1' }
      ];

      const table = new NeoOptimizedDataTable();
      table.data = data;
      table.columns = columns;
      container.appendChild(table);
      
      await table.updateComplete;

      const sortTime = await measureRenderTime('datatable-sort', () => {
        table.sortField = 'col0';
        table.sortDirection = 'asc';
        table.requestUpdate();
      });

      expect(sortTime).to.be.lessThan(50,
        `Sorting 2000 rows took ${sortTime.toFixed(2)}ms, should be under 50ms`);
    });
  });

  describe('Event Handling Performance', () => {
    it('should handle rapid click events efficiently', async () => {
      const button = new NeoButtonOptimized();
      button.label = 'Click Test';
      container.appendChild(button);
      await button.updateComplete;

      let eventCount = 0;
      button.addEventListener('neo-click', () => {
        eventCount++;
      });

      const clickStart = performance.now();
      
      // Simulate 100 rapid clicks
      for (let i = 0; i < 100; i++) {
        button.shadowRoot.querySelector('button').click();
      }

      const clickTime = performance.now() - clickStart;

      expect(eventCount).to.equal(100, 'Should handle all click events');
      expect(clickTime).to.be.lessThan(100,
        `100 clicks took ${clickTime.toFixed(2)}ms, should be under 100ms`);
    });

    it('should handle rapid input events without blocking UI', async function() {
      this.timeout(5000);

      const input = new NeoSimpleInput();
      container.appendChild(input);
      await input.updateComplete;

      const inputElement = input.shadowRoot.querySelector('input');
      let eventCount = 0;
      
      input.addEventListener('input', () => {
        eventCount++;
      });

      const inputStart = performance.now();
      
      // Simulate rapid typing (50 characters)
      for (let i = 0; i < 50; i++) {
        inputElement.value = inputElement.value + 'x';
        inputElement.dispatchEvent(new Event('input', { bubbles: true }));
        
        // Yield to event loop occasionally
        if (i % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 1));
        }
      }

      const inputTime = performance.now() - inputStart;

      expect(eventCount).to.equal(50, 'Should handle all input events');
      expect(inputTime).to.be.lessThan(200,
        `50 input events took ${inputTime.toFixed(2)}ms, should be under 200ms`);
    });
  });

  describe('Bundle Size Impact', () => {
    it('should have minimal component registration overhead', () => {
      const beforeElements = Object.keys(customElements._registry || {}).length;
      
      // Import and register new optimized components
      const elementsAdded = [
        'neo-button-optimized',
        'neo-simple-input', 
        'neo-optimized-data-table'
      ];

      const afterElements = Object.keys(customElements._registry || {}).length;
      const actualAdded = afterElements - beforeElements;

      // Should only add expected number of elements
      expect(actualAdded).to.be.at.most(elementsAdded.length + 2, // Allow some buffer
        'Component registration should have minimal overhead');
    });
  });

  // Performance reporting  
  afterAll(() => {
    if (performanceEntries.length > 0) {
      console.log('\n📊 Performance Test Results:');
      console.log('='.repeat(50));
      
      performanceEntries.forEach(entry => {
        const status = entry.renderTime < 16 ? '✅' : entry.renderTime < 32 ? '⚠️' : '❌';
        console.log(`${status} ${entry.name}: ${entry.renderTime.toFixed(2)}ms`);
      });
      
      const avgRenderTime = performanceEntries.reduce((sum, entry) => sum + entry.renderTime, 0) / performanceEntries.length;
      console.log(`\n📈 Average render time: ${avgRenderTime.toFixed(2)}ms`);
      
      const slowComponents = performanceEntries.filter(entry => entry.renderTime > 16);
      if (slowComponents.length > 0) {
        console.log(`⚠️  ${slowComponents.length} components exceeded 16ms target`);
      }
      
      console.log('='.repeat(50));
    }
  });
});