/**
 * PerformanceValidator Unit Tests
 * 
 * Comprehensive unit tests for the Performance Validator tool.
 * Tests performance measurement accuracy and realistic validation scenarios.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PerformanceValidator } from '../../playground/tools/performance-validator.js';

describe('PerformanceValidator', () => {
  let validator;
  let mockPerformance;

  beforeEach(() => {
    validator = new PerformanceValidator();
    
    // Mock performance API for consistent testing
    mockPerformance = {
      now: vi.fn(() => Date.now()),
      memory: {
        usedJSHeapSize: 10 * 1024 * 1024, // 10MB
        totalJSHeapSize: 50 * 1024 * 1024, // 50MB
        jsHeapSizeLimit: 100 * 1024 * 1024 // 100MB
      }
    };
    
    global.performance = mockPerformance;
  });

  afterEach(() => {
    // Clean up any test containers
    const testContainers = document.querySelectorAll('#perf-test-container');
    testContainers.forEach(container => {
      if (container.parentNode) {
        container.parentNode.removeChild(container);
      }
    });
  });

  describe('Initialization', () => {
    it('should initialize with empty metrics and default thresholds', () => {
      expect(validator.metrics).toBeDefined();
      expect(validator.metrics instanceof Map).toBe(true);
      expect(validator.thresholds).toBeDefined();
    });

    it('should have sensible default performance thresholds', () => {
      const thresholds = validator.thresholds;
      
      expect(thresholds.firstContentfulPaint).toBe(1500);
      expect(thresholds.largestContentfulPaint).toBe(2500);
      expect(thresholds.cumulativeLayoutShift).toBe(0.1);
      expect(thresholds.interactionLatency).toBe(100);
      expect(thresholds.memoryUsage).toBe(100 * 1024 * 1024); // 100MB
    });
  });

  describe('Data Generation', () => {
    it('should generate test data for different sizes', () => {
      const smallData = validator.generateTestData({ dataSize: 'small' });
      const mediumData = validator.generateTestData({ dataSize: 'medium' });
      const largeData = validator.generateTestData({ dataSize: 'large' });

      expect(Array.isArray(smallData)).toBe(true);
      expect(Array.isArray(mediumData)).toBe(true);
      expect(Array.isArray(largeData)).toBe(true);

      expect(smallData.length).toBe(10);
      expect(mediumData.length).toBe(100);
      expect(largeData.length).toBe(1000);
    });

    it('should generate realistic user data structure', () => {
      const data = validator.generateLargeDataset(5);
      
      expect(data.length).toBe(5);
      
      data.forEach((item, index) => {
        expect(item.id).toBe(index + 1);
        expect(item.name).toContain('User');
        expect(item.email).toContain('@example.com');
        expect(item.department).toMatch(/^(Engineering|Sales|Marketing|Support)$/);
        expect(item.status).toMatch(/^(Active|Inactive|Pending)$/);
        expect(item.created).toBeDefined();
        expect(typeof item.score).toBe('number');
        expect(item.score).toBeGreaterThanOrEqual(0);
        expect(item.score).toBeLessThan(100);
      });
    });

    it('should handle edge cases in data generation', () => {
      const emptyData = validator.generateLargeDataset(0);
      expect(emptyData.length).toBe(0);

      const singleData = validator.generateLargeDataset(1);
      expect(singleData.length).toBe(1);
      expect(singleData[0].id).toBe(1);
    });

    it('should generate consistent data structure regardless of size', () => {
      const smallData = validator.generateLargeDataset(1);
      const largeData = validator.generateLargeDataset(100);

      const smallItem = smallData[0];
      const largeItem = largeData[0];

      // Should have same structure
      expect(Object.keys(smallItem)).toEqual(Object.keys(largeItem));
    });
  });

  describe('Component HTML Generation', () => {
    it('should generate HTML for neo-table component', () => {
      const scenario = { components: ['neo-table'] };
      const testData = [{ id: 1, name: 'Test', email: 'test@example.com' }];
      
      const html = validator.generateComponentHTML(scenario, testData);
      
      expect(html).toContain('<neo-table');
      expect(html).toContain('data=\'[{"id":1,"name":"Test","email":"test@example.com"}]\'');
      expect(html).toContain('sortable="true"');
      expect(html).toContain('filterable="true"');
      expect(html).toContain('page-size="50"');
    });

    it('should generate HTML for neo-form-builder component', () => {
      const scenario = { components: ['neo-form-builder'] };
      const testData = [];
      
      const html = validator.generateComponentHTML(scenario, testData);
      
      expect(html).toContain('<neo-form-builder');
      expect(html).toContain('"type":"text"');
      expect(html).toContain('"name":"name"');
      expect(html).toContain('"label":"Full Name"');
      expect(html).toContain('"type":"email"');
      expect(html).toContain('"type":"select"');
    });

    it('should generate HTML for neo-data-grid component', () => {
      const scenario = { components: ['neo-data-grid'] };
      const testData = [{ id: 1, name: 'Test' }];
      
      const html = validator.generateComponentHTML(scenario, testData);
      
      expect(html).toContain('<neo-data-grid');
      expect(html).toContain('editable="true"');
      expect(html).toContain('virtual-scroll="true"');
    });

    it('should generate HTML for neo-card component', () => {
      const scenario = { components: ['neo-card'] };
      const testData = [
        { id: 1, name: 'John', email: 'john@test.com', department: 'Engineering' },
        { id: 2, name: 'Jane', email: 'jane@test.com', department: 'Sales' }
      ];
      
      const html = validator.generateComponentHTML(scenario, testData);
      
      expect(html).toContain('<neo-card>');
      expect(html).toContain('<h3>John</h3>');
      expect(html).toContain('<p>john@test.com</p>');
      expect(html).toContain('<h3>Jane</h3>');
      expect(html).toContain('Department: Engineering');
      expect(html).toContain('Department: Sales');
    });

    it('should generate HTML for neo-button component', () => {
      const scenario = { components: ['neo-button'] };
      const testData = [];
      
      const html = validator.generateComponentHTML(scenario, testData);
      
      expect(html).toContain('<neo-button variant="primary">Primary Action</neo-button>');
      expect(html).toContain('<neo-button variant="secondary">Secondary Action</neo-button>');
    });

    it('should handle unknown components gracefully', () => {
      const scenario = { components: ['unknown-component'] };
      const testData = [];
      
      const html = validator.generateComponentHTML(scenario, testData);
      
      expect(html).toContain('Component unknown-component - Performance Test');
    });

    it('should wrap components in container div', () => {
      const scenario = { components: ['neo-button'] };
      const testData = [];
      
      const html = validator.generateComponentHTML(scenario, testData);
      
      expect(html).toContain('<div style="padding: 20px;">');
      expect(html).toContain('</div>');
    });
  });

  describe('Performance Measurement', () => {
    it('should setup test environment correctly', async () => {
      const scenario = {
        components: ['neo-button'],
        dataSize: 'small'
      };

      const testEnvironment = await validator.setupTestEnvironment(scenario);
      
      expect(testEnvironment.container).toBeDefined();
      expect(testEnvironment.container.id).toBe('perf-test-container');
      expect(testEnvironment.data).toBeDefined();
      expect(Array.isArray(testEnvironment.data)).toBe(true);
      expect(testEnvironment.components).toEqual(['neo-button']);
      
      // Container should be positioned off-screen
      expect(testEnvironment.container.style.position).toBe('absolute');
      expect(testEnvironment.container.style.top).toBe('-10000px');
    });

    it('should measure memory usage when performance.memory is available', () => {
      const memoryMetrics = validator.measureMemoryUsage();
      
      expect(memoryMetrics.memoryUsed).toBe(10 * 1024 * 1024);
      expect(memoryMetrics.memoryTotal).toBe(50 * 1024 * 1024);
      expect(memoryMetrics.memoryLimit).toBe(100 * 1024 * 1024);
    });

    it('should handle missing performance.memory gracefully', () => {
      global.performance = { now: mockPerformance.now };
      
      const memoryMetrics = validator.measureMemoryUsage();
      
      expect(memoryMetrics.memoryUsed).toBe('unknown');
      expect(memoryMetrics.memoryTotal).toBe('unknown');
      expect(memoryMetrics.memoryLimit).toBe('unknown');
    });

    it('should find largest contentful element', () => {
      // Create test DOM structure
      const container = document.createElement('div');
      container.style.width = '100px';
      container.style.height = '100px';
      
      const smallElement = document.createElement('div');
      smallElement.style.width = '50px';
      smallElement.style.height = '50px';
      
      const largeElement = document.createElement('div');
      largeElement.style.width = '200px';
      largeElement.style.height = '200px';
      
      container.appendChild(smallElement);
      container.appendChild(largeElement);
      document.body.appendChild(container);
      
      // Mock getBoundingClientRect
      smallElement.getBoundingClientRect = () => ({ width: 50, height: 50 });
      largeElement.getBoundingClientRect = () => ({ width: 200, height: 200 });
      
      const largest = validator.findLargestContentfulElement(container);
      
      expect(largest).toBe(largeElement);
      
      // Cleanup
      document.body.removeChild(container);
    });
  });

  describe('Interaction Simulation', () => {
    it('should simulate sort interaction', async () => {
      const testEnvironment = {
        container: document.createElement('div')
      };
      
      const table = document.createElement('neo-table');
      testEnvironment.container.appendChild(table);
      
      let eventFired = false;
      table.addEventListener('sort', (event) => {
        expect(event.detail.column).toBe('name');
        expect(event.detail.direction).toBe('asc');
        eventFired = true;
      });
      
      await validator.simulateSort(testEnvironment);
      expect(eventFired).toBe(true);
    });

    it('should simulate filter interaction', async () => {
      const testEnvironment = {
        container: document.createElement('div')
      };
      
      const table = document.createElement('neo-table');
      testEnvironment.container.appendChild(table);
      
      let eventFired = false;
      table.addEventListener('filter', (event) => {
        expect(event.detail.column).toBe('department');
        expect(event.detail.value).toBe('Engineering');
        eventFired = true;
      });
      
      await validator.simulateFilter(testEnvironment);
      expect(eventFired).toBe(true);
    });

    it('should simulate edit interaction', async () => {
      const testEnvironment = {
        container: document.createElement('div')
      };
      
      const grid = document.createElement('neo-data-grid');
      testEnvironment.container.appendChild(grid);
      
      let eventFired = false;
      grid.addEventListener('cell-edit', (event) => {
        expect(event.detail.row).toBe(0);
        expect(event.detail.column).toBe('name');
        expect(event.detail.value).toBe('Updated Name');
        eventFired = true;
      });
      
      await validator.simulateEdit(testEnvironment);
      expect(eventFired).toBe(true);
    });

    it('should simulate submit interaction', async () => {
      const testEnvironment = {
        container: document.createElement('div')
      };
      
      const form = document.createElement('neo-form-builder');
      testEnvironment.container.appendChild(form);
      
      let eventFired = false;
      form.addEventListener('submit', (event) => {
        expect(event.detail.data.name).toBe('Test User');
        eventFired = true;
      });
      
      await validator.simulateSubmit(testEnvironment);
      expect(eventFired).toBe(true);
    });

    it('should handle missing components gracefully in simulations', async () => {
      const emptyEnvironment = {
        container: document.createElement('div')
      };
      
      // Should not throw errors for missing components
      await expect(validator.simulateSort(emptyEnvironment)).resolves.toBeUndefined();
      await expect(validator.simulateFilter(emptyEnvironment)).resolves.toBeUndefined();
      await expect(validator.simulateEdit(emptyEnvironment)).resolves.toBeUndefined();
      await expect(validator.simulateSubmit(emptyEnvironment)).resolves.toBeUndefined();
    });
  });

  describe('Performance Analysis', () => {
    it('should analyze results against target metrics', () => {
      const metrics = {
        firstContentfulPaint: 1200,
        largestContentfulPaint: 2200,
        cumulativeLayoutShift: 0.08
      };
      
      const targetMetrics = {
        firstContentfulPaint: 1500,
        largestContentfulPaint: 2500,
        cumulativeLayoutShift: 0.1
      };
      
      const results = validator.analyzeResults(metrics, targetMetrics);
      
      expect(results.passed).toBe(true);
      expect(results.issues.length).toBe(0);
      expect(results.metrics.firstContentfulPaint).toBe(metrics.firstContentfulPaint);
      expect(results.metrics.largestContentfulPaint).toBe(metrics.largestContentfulPaint);
      expect(results.metrics.cumulativeLayoutShift).toBeGreaterThan(0);
    });

    it('should detect performance threshold breaches', () => {
      const slowMetrics = {
        firstContentfulPaint: 2000, // Exceeds 1500ms target
        largestContentfulPaint: 3000, // Exceeds 2500ms target
        cumulativeLayoutShift: 0.15 // Exceeds 0.1 target
      };
      
      const targetMetrics = {
        firstContentfulPaint: 1500,
        largestContentfulPaint: 2500,
        cumulativeLayoutShift: 0.1
      };
      
      const results = validator.analyzeResults(slowMetrics, targetMetrics);
      
      expect(results.passed).toBe(false);
      expect(results.issues.length).toBeGreaterThanOrEqual(2); // At least FCP and LCP issues
      expect(results.issues.some(issue => issue.includes('First Contentful Paint'))).toBe(true);
      expect(results.issues.some(issue => issue.includes('Largest Contentful Paint'))).toBe(true);
    });

    it('should simulate CLS based on render time', () => {
      const fastMetrics = { firstContentfulPaint: 500 };
      const slowMetrics = { firstContentfulPaint: 2000 };
      
      const fastCLS = validator.simulateCLS(fastMetrics);
      const slowCLS = validator.simulateCLS(slowMetrics);
      
      expect(fastCLS).toBeGreaterThan(0);
      expect(slowCLS).toBeGreaterThanOrEqual(fastCLS);
      
      // Should cap the impact
      expect(slowCLS).toBeLessThanOrEqual(0.1); // Reasonable upper bound
    });
  });

  describe('Performance Recommendations', () => {
    it('should recommend lazy loading for slow FCP', () => {
      const slowFCPResults = {
        metrics: { firstContentfulPaint: 1200 },
        issues: []
      };
      
      const recommendations = validator.generateRecommendations(slowFCPResults);
      
      expect(recommendations).toContain('Consider lazy loading non-critical components');
      expect(recommendations).toContain('Optimize component render methods for faster initial paint');
    });

    it('should recommend virtual scrolling for slow LCP', () => {
      const slowLCPResults = {
        metrics: { largestContentfulPaint: 2100 },
        issues: []
      };
      
      const recommendations = validator.generateRecommendations(slowLCPResults);
      
      expect(recommendations).toContain('Implement virtual scrolling for large data sets');
      expect(recommendations).toContain('Use progressive loading for complex components');
    });

    it('should recommend layout stability improvements for high CLS', () => {
      const highCLSResults = {
        metrics: { cumulativeLayoutShift: 0.12 },
        issues: []
      };
      
      const recommendations = validator.generateRecommendations(highCLSResults);
      
      expect(recommendations).toContain('Add explicit dimensions to prevent layout shifts');
      expect(recommendations).toContain('Use skeleton screens during loading');
    });

    it('should recommend memory optimizations for high memory usage', () => {
      const highMemoryResults = {
        metrics: { memoryUsed: 60 * 1024 * 1024 }, // 60MB
        issues: []
      };
      
      const recommendations = validator.generateRecommendations(highMemoryResults);
      
      expect(recommendations).toContain('Implement component cleanup to prevent memory leaks');
      expect(recommendations).toContain('Use object pooling for frequently created/destroyed elements');
    });

    it('should return empty recommendations for good performance', () => {
      const goodResults = {
        metrics: {
          firstContentfulPaint: 800,
          largestContentfulPaint: 1800,
          cumulativeLayoutShift: 0.05,
          memoryUsed: 30 * 1024 * 1024
        },
        issues: []
      };
      
      const recommendations = validator.generateRecommendations(goodResults);
      expect(recommendations.length).toBe(0);
    });
  });

  describe('Integration Test Scenario', () => {
    it('should validate complete performance scenario', async () => {
      const scenario = {
        components: ['neo-button'],
        dataSize: 'small',
        interactions: [],
        targetMetrics: {
          firstContentfulPaint: 2000, // Generous targets for test
          largestContentfulPaint: 3000,
          cumulativeLayoutShift: 0.2
        }
      };

      const result = await validator.validateScenario(scenario);
      
      expect(result).toBeDefined();
      expect(result.passed).toBeDefined();
      expect(result.metrics).toBeDefined();
      expect(result.issues).toBeDefined();
      expect(Array.isArray(result.issues)).toBe(true);
      expect(result.recommendations).toBeDefined();
      expect(Array.isArray(result.recommendations)).toBe(true);
      expect(result.scenario).toBe('neo-button');
    });

    it('should handle complex multi-component scenarios', async () => {
      const complexScenario = {
        components: ['neo-table', 'neo-form-builder', 'neo-card'],
        dataSize: 'medium',
        interactions: ['sort', 'filter', 'submit'],
        targetMetrics: {
          firstContentfulPaint: 3000,
          largestContentfulPaint: 4000,
          cumulativeLayoutShift: 0.3
        }
      };

      const result = await validator.validateScenario(complexScenario);
      
      expect(result.scenario).toBe('neo-table, neo-form-builder, neo-card');
      expect(result.metrics).toBeDefined();
      
      // Should have interaction timing metrics
      if (result.metrics.sortTime) {
        expect(typeof result.metrics.sortTime).toBe('number');
      }
      if (result.metrics.filterTime) {
        expect(typeof result.metrics.filterTime).toBe('number');
      }
      if (result.metrics.submitTime) {
        expect(typeof result.metrics.submitTime).toBe('number');
      }
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle scenarios without target metrics', async () => {
      const scenario = {
        components: ['neo-button'],
        dataSize: 'small'
        // No targetMetrics
      };

      const result = await validator.validateScenario(scenario);
      expect(result).toBeDefined();
      expect(result.passed).toBeDefined();
    });

    it('should handle cleanup of test environment', () => {
      const testEnvironment = {
        container: document.createElement('div')
      };
      
      document.body.appendChild(testEnvironment.container);
      expect(document.body.contains(testEnvironment.container)).toBe(true);
      
      validator.cleanup(testEnvironment);
      expect(document.body.contains(testEnvironment.container)).toBe(false);
    });

    it('should handle cleanup when container not in DOM', () => {
      const testEnvironment = {
        container: document.createElement('div')
      };
      
      // Container not added to DOM
      expect(() => validator.cleanup(testEnvironment)).not.toThrow();
    });

    it('should handle null/undefined test environment', () => {
      expect(() => validator.cleanup({})).not.toThrow();
      expect(() => validator.cleanup({ container: null })).not.toThrow();
    });
  });
});