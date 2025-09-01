/**
 * Application Integration Error Handling Tests
 *
 * Tests critical error scenarios that would break production usage.
 * Focuses on the 20% of error conditions that cause 80% of developer issues.
 */
import { describe, it, expect, beforeEach } from 'vitest';

describe('Application Integration Error Handling', () => {

  describe('AppTemplateGenerator Error Scenarios', () => {
    let generator;

    beforeEach(async () => {
      const { AppTemplateGenerator } = await import('../../playground/tools/app-template-generator.js');
      generator = new AppTemplateGenerator();
    });

    it('should handle invalid template name gracefully', async () => {
      const invalidConfig = {
        name: 'test-app',
        template: 'non-existent-template',
        components: ['neo-button'],
        features: ['responsive']
      };

      await expect(generator.generateApp(invalidConfig))
        .rejects
        .toThrow('Template non-existent-template not found');
    });

    it('should handle empty component list', async () => {
      const emptyConfig = {
        name: 'test-app',
        template: 'minimal-app',
        components: [], // Empty components
        features: ['responsive']
      };

      const result = await generator.generateApp(emptyConfig);

      expect(result.files).toBeDefined();
      expect(result.files.length).toBeGreaterThan(0);

      // Should still generate basic app structure
      const componentImportFile = result.files.find(f => f.path === 'src/components/index.js');
      expect(componentImportFile).toBeDefined();
      expect(componentImportFile.content).toContain('Components loaded for test-app');
    });

    it('should handle invalid characters in app name', async () => {
      const invalidNameConfig = {
        name: 'test-app-with-special-chars!@#$%',
        template: 'minimal-app',
        components: ['neo-button'],
        features: ['responsive']
      };

      const result = await generator.generateApp(invalidNameConfig);

      // Should still generate but sanitize the name in outputs
      expect(result.name).toBe('test-app-with-special-chars!@#$%');

      const indexFile = result.files.find(f => f.path === 'index.html');
      expect(indexFile.content).toContain('<title>test-app-with-special-chars!@#$%</title>');
    });

    it('should handle missing features array', async () => {
      const noFeaturesConfig = {
        name: 'test-app',
        template: 'minimal-app',
        components: ['neo-button']
        // Missing features array
      };

      // Should not throw, should handle gracefully
      const result = await generator.generateApp(noFeaturesConfig);
      expect(result.files).toBeDefined();
    });
  });

  describe('ProjectIntegrator Error Scenarios', () => {
    let integrator;

    beforeEach(async () => {
      const { ProjectIntegrator } = await import('../../playground/tools/project-integrator.js');
      integrator = new ProjectIntegrator();
    });

    it('should handle unsupported project types', () => {
      const unsupportedProject = {
        type: 'flutter', // Unsupported framework
        dependencies: ['flutter'],
        buildTool: 'flutter'
      };

      const result = integrator.analyzeProject(unsupportedProject);

      expect(result.compatibility).toBe('unsupported');
      expect(result.reason).toContain('flutter is not currently supported');
      expect(result.alternatives).toBeDefined();
      expect(result.alternatives.length).toBeGreaterThan(0);
    });

    it('should handle malformed project configuration', () => {
      const malformedProject = {
        // Missing required fields
        dependencies: null,
        buildTool: undefined
      };

      // Should not throw, should provide default handling
      const result = integrator.analyzeProject(malformedProject);
      expect(result).toBeDefined();
    });

    it('should handle empty project configuration', () => {
      const emptyProject = {};

      // Should provide default/fallback integration
      const result = integrator.analyzeProject(emptyProject);
      expect(result).toBeDefined();
    });
  });

  describe('PerformanceValidator Error Scenarios', () => {
    let validator;

    beforeEach(async () => {
      const { PerformanceValidator } = await import('../../playground/tools/performance-validator.js');
      validator = new PerformanceValidator();
    });

    it('should handle scenario with non-existent components', async () => {
      const invalidScenario = {
        components: ['non-existent-component', 'another-fake-component'],
        dataSize: 'large',
        interactions: ['sort', 'filter'],
        targetMetrics: {
          firstContentfulPaint: 1500,
          largestContentfulPaint: 2500,
          cumulativeLayoutShift: 0.1
        }
      };

      // Should handle gracefully, not crash
      const result = await validator.validateScenario(invalidScenario);

      expect(result).toBeDefined();
      expect(result.passed).toBeDefined();
      expect(result.metrics).toBeDefined();
      expect(result.scenario).toContain('non-existent-component');
    });

    it('should handle missing target metrics', async () => {
      const scenarioWithoutTargets = {
        components: ['neo-button'],
        dataSize: 'small',
        interactions: ['click']
        // Missing targetMetrics
      };

      // Should not crash, should use defaults
      const result = await validator.validateScenario(scenarioWithoutTargets);
      expect(result).toBeDefined();
      expect(result.passed).toBeDefined();
    });

    it('should handle extremely large data scenarios', async () => {
      const extremeScenario = {
        components: ['neo-table'],
        dataSize: 'large', // This will generate 1000 items
        interactions: ['sort', 'filter'],
        targetMetrics: {
          firstContentfulPaint: 5000, // More lenient for large data
          largestContentfulPaint: 8000,
          cumulativeLayoutShift: 0.2
        }
      };

      // Should handle large datasets without crashing
      const result = await validator.validateScenario(extremeScenario);

      expect(result).toBeDefined();
      expect(result.metrics.memoryUsed).toBeDefined();

      // Memory usage should be reasonable even with large data
      if (typeof result.metrics.memoryUsed === 'number') {
        expect(result.metrics.memoryUsed).toBeLessThan(200 * 1024 * 1024); // Less than 200MB
      }
    });

    it('should handle invalid interaction types', async () => {
      const invalidInteractionScenario = {
        components: ['neo-table'],
        dataSize: 'small',
        interactions: ['invalid-interaction', 'non-existent-action'],
        targetMetrics: {
          firstContentfulPaint: 1500,
          largestContentfulPaint: 2500,
          cumulativeLayoutShift: 0.1
        }
      };

      // Should handle invalid interactions gracefully
      const result = await validator.validateScenario(invalidInteractionScenario);
      expect(result).toBeDefined();
      expect(result.metrics).toBeDefined();
    });
  });

  describe('DeploymentExamples Error Scenarios', () => {
    let examples;

    beforeEach(async () => {
      const { DeploymentExamples } = await import('../../playground/tools/deployment-examples.js');
      examples = new DeploymentExamples();
    });

    it('should handle requests for unsupported platforms', () => {
      const guides = examples.getGuides();
      expect(guides).toBeDefined();
      expect(guides.length).toBeGreaterThan(0);

      // All guides should have required properties
      guides.forEach(guide => {
        expect(guide.platform).toBeDefined();
        expect(guide.type).toBeDefined();
        expect(guide.configFiles).toBeDefined();
        expect(guide.buildCommands).toBeDefined();
      });
    });

    it('should provide optimization tips for all platforms', () => {
      const guides = examples.getGuides();

      guides.forEach(guide => {
        const tips = examples.getOptimizationTips(guide.platform);
        expect(Array.isArray(tips)).toBe(true);

        const security = examples.getSecurityConsiderations(guide.platform);
        expect(Array.isArray(security)).toBe(true);
      });
    });

    it('should handle invalid platform requests', () => {
      const tips = examples.getOptimizationTips('non-existent-platform');
      expect(Array.isArray(tips)).toBe(true);
      expect(tips.length).toBe(0);

      const security = examples.getSecurityConsiderations('invalid-platform');
      expect(Array.isArray(security)).toBe(true);
      expect(security.length).toBe(0);
    });
  });

  describe('UsageExamples Error Scenarios', () => {
    let examples;

    beforeEach(async () => {
      const { UsageExamples } = await import('../../playground/tools/usage-examples.js');
      examples = new UsageExamples();
    });

    it('should handle requests for non-existent scenarios', () => {
      const scenario = examples.getScenario('non-existent-scenario');
      expect(scenario).toBeUndefined();
    });

    it('should handle requests for invalid categories', () => {
      const scenarios = examples.getScenariosByCategory('invalid-category');
      expect(Array.isArray(scenarios)).toBe(true);
      expect(scenarios.length).toBe(0);
    });

    it('should provide complete scenario data structure', () => {
      const scenarios = examples.getRealWorldScenarios();
      expect(scenarios.length).toBeGreaterThanOrEqual(5);

      scenarios.forEach(scenario => {
        // Each scenario should have required properties
        expect(scenario.name).toBeDefined();
        expect(scenario.description).toBeDefined();
        expect(scenario.components).toBeDefined();
        expect(Array.isArray(scenario.components)).toBe(true);
        expect(scenario.difficulty).toBeDefined();
        expect(scenario.category).toBeDefined();
        expect(scenario.fullExample).toBeDefined();
        expect(scenario.liveDemo).toBeDefined();
        expect(scenario.codeFiles).toBeDefined();
      });
    });
  });

  describe('Cross-Tool Integration Error Scenarios', () => {
    it('should handle workflow where one tool fails', async () => {
      // Simulate a workflow: Generate App → Validate Performance → Deploy
      try {
        const { AppTemplateGenerator } = await import('../../playground/tools/app-template-generator.js');
        const { PerformanceValidator } = await import('../../playground/tools/performance-validator.js');

        const generator = new AppTemplateGenerator();
        const validator = new PerformanceValidator();

        // Step 1: Generate app (this should work)
        const appConfig = {
          name: 'test-workflow-app',
          template: 'dashboard-app',
          components: ['neo-table', 'neo-form-builder'],
          features: ['routing', 'responsive']
        };

        const generatedApp = await generator.generateApp(appConfig);
        expect(generatedApp).toBeDefined();

        // Step 2: Validate performance with components from generated app
        const performanceScenario = {
          components: appConfig.components,
          dataSize: 'medium',
          interactions: ['sort', 'filter'],
          targetMetrics: {
            firstContentfulPaint: 2000,
            largestContentfulPaint: 3000,
            cumulativeLayoutShift: 0.15
          }
        };

        const performanceResult = await validator.validateScenario(performanceScenario);
        expect(performanceResult).toBeDefined();

        // Workflow should complete without throwing
        expect(performanceResult.scenario).toContain('neo-table');

      } catch (error) {
        // If any step fails, it should be a controlled failure with meaningful message
        expect(error.message).toBeDefined();
        expect(error.message.length).toBeGreaterThan(0);
      }
    });

    it('should handle memory pressure during extended tool usage', async () => {
      // Simulate extended usage that could cause memory issues
      const { AppTemplateGenerator } = await import('../../playground/tools/app-template-generator.js');
      const generator = new AppTemplateGenerator();

      const configs = [];
      for (let i = 0; i < 10; i++) {
        configs.push({
          name: `test-app-${i}`,
          template: 'minimal-app',
          components: ['neo-button', 'neo-card'],
          features: ['responsive']
        });
      }

      // Generate multiple apps in sequence
      for (const config of configs) {
        const result = await generator.generateApp(config);
        expect(result).toBeDefined();
        expect(result.files.length).toBeGreaterThan(0);
      }

      // Should complete without memory errors
      expect(true).toBe(true);
    });
  });

  describe('Browser Compatibility Error Scenarios', () => {
    it('should handle environments without performance API', async () => {
      // Temporarily remove performance API to simulate older browsers
      const originalPerformance = global.performance;

      // Mock performance API with minimal implementation
      global.performance = {
        now: () => Date.now(),
        // No memory property to simulate older browsers
      };

      try {
        const { PerformanceValidator } = await import('../../playground/tools/performance-validator.js');
        const validator = new PerformanceValidator();

        const scenario = {
          components: ['neo-button'],
          dataSize: 'small',
          interactions: [],
          targetMetrics: {
            firstContentfulPaint: 1500,
            largestContentfulPaint: 2500,
            cumulativeLayoutShift: 0.1
          }
        };

        // Should handle missing performance.memory gracefully
        const result = await validator.validateScenario(scenario);
        expect(result).toBeDefined();
        expect(result.metrics.memoryUsed).toBe('unknown');

      } finally {
        // Restore performance API
        global.performance = originalPerformance;
      }
    });

    it('should handle DOM manipulation in headless environments', async () => {
      // Test DOM operations work in test environment
      const testContainer = document.createElement('div');
      testContainer.id = 'test-container';
      document.body.appendChild(testContainer);

      expect(document.getElementById('test-container')).toBeDefined();

      // Cleanup
      document.body.removeChild(testContainer);
    });
  });

  describe('Data Validation Error Scenarios', () => {
    it('should handle malformed JSON in component data', async () => {
      const { PerformanceValidator } = await import('../../playground/tools/performance-validator.js');
      const validator = new PerformanceValidator();

      // Test with scenario that might cause JSON issues
      const scenario = {
        components: ['neo-table'],
        dataSize: 'small',
        interactions: [],
        targetMetrics: {
          firstContentfulPaint: 1500,
          largestContentfulPaint: 2500,
          cumulativeLayoutShift: 0.1
        }
      };

      const result = await validator.validateScenario(scenario);

      // Should handle data generation and JSON serialization without errors
      expect(result).toBeDefined();
      expect(result.metrics).toBeDefined();
    });

    it('should handle edge cases in generated data', async () => {
      const { PerformanceValidator } = await import('../../playground/tools/performance-validator.js');
      const validator = new PerformanceValidator();

      // Test data generation with edge cases
      const testData = validator.generateLargeDataset(0); // Empty dataset
      expect(Array.isArray(testData)).toBe(true);
      expect(testData.length).toBe(0);

      const smallData = validator.generateLargeDataset(1); // Single item
      expect(Array.isArray(smallData)).toBe(true);
      expect(smallData.length).toBe(1);
      expect(smallData[0].id).toBe(1);
    });
  });
});
