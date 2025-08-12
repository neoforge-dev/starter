/**
 * Production Scenario Integration Tests
 * 
 * Tests real-world production integration paths that developers actually use.
 * Validates the complete workflow from playground → production deployment.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('Production Scenario Integration Tests', () => {
  let generatedApps = [];

  afterEach(() => {
    // Cleanup any test containers
    generatedApps.forEach(app => {
      const containers = document.querySelectorAll(`#${app}-container`);
      containers.forEach(container => {
        if (container.parentNode) {
          container.parentNode.removeChild(container);
        }
      });
    });
    generatedApps = [];
  });

  describe('Dashboard App Generation → Validation → Deployment Workflow', () => {
    it('should complete full dashboard app development workflow', async () => {
      // Step 1: Generate Dashboard App
      const { AppTemplateGenerator } = await import('../../playground/tools/app-template-generator.js');
      const generator = new AppTemplateGenerator();

      const dashboardConfig = {
        name: 'Production Dashboard',
        template: 'dashboard-app',
        components: ['neo-table', 'neo-form-builder', 'neo-button', 'neo-card', 'neo-modal'],
        features: ['routing', 'responsive', 'data-management']
      };

      const generatedApp = await generator.generateApp(dashboardConfig);
      
      // Validate app structure
      expect(generatedApp.name).toBe('Production Dashboard');
      expect(generatedApp.template).toBe('dashboard-app');
      expect(generatedApp.files.length).toBeGreaterThanOrEqual(5);
      expect(generatedApp.dependencies).toContain('@neoforge/web-components');

      // Step 2: Validate Performance with Realistic Data
      const { PerformanceValidator } = await import('../../playground/tools/performance-validator.js');
      const validator = new PerformanceValidator();

      const performanceScenario = {
        components: dashboardConfig.components,
        dataSize: 'large', // 1000 rows - realistic for dashboard
        interactions: ['sort', 'filter', 'edit', 'submit'],
        targetMetrics: {
          firstContentfulPaint: 2000, // Reasonable for data-heavy dashboard
          largestContentfulPaint: 3500,
          cumulativeLayoutShift: 0.15
        }
      };

      const performanceResult = await validator.validateScenario(performanceScenario);
      
      expect(performanceResult.passed).toBe(true);
      expect(performanceResult.metrics.firstContentfulPaint).toBeLessThan(2000);
      expect(performanceResult.recommendations).toBeDefined();

      // Step 3: Get Deployment Configuration
      const { DeploymentExamples } = await import('../../playground/tools/deployment-examples.js');
      const deployment = new DeploymentExamples();

      const deploymentGuides = deployment.getGuides();
      const vercelGuide = deploymentGuides.find(g => g.platform === 'vercel');
      
      expect(vercelGuide).toBeDefined();
      expect(vercelGuide.configFiles['vercel.json']).toBeDefined();
      expect(vercelGuide.buildCommands.build).toBe('npm run build');

      // Workflow completed successfully
      expect(true).toBe(true);
    });

    it('should handle dashboard with extreme data loads', async () => {
      const { PerformanceValidator } = await import('../../playground/tools/performance-validator.js');
      const validator = new PerformanceValidator();

      // Extreme scenario: Large enterprise dashboard
      const extremeScenario = {
        components: ['neo-table', 'neo-data-grid', 'neo-form-builder'],
        dataSize: 'large', // 1000+ rows
        interactions: ['sort', 'filter', 'edit'],
        targetMetrics: {
          firstContentfulPaint: 3000, // More lenient for extreme loads
          largestContentfulPaint: 5000,
          cumulativeLayoutShift: 0.2
        }
      };

      const result = await validator.validateScenario(extremeScenario);
      
      expect(result).toBeDefined();
      expect(result.metrics.memoryUsed).toBeDefined();
      
      // Should provide recommendations for large datasets
      if (result.metrics.largestContentfulPaint > 3000) {
        expect(result.recommendations).toContain('Implement virtual scrolling for large data sets');
      }
    });
  });

  describe('Marketing Site Generation → Build → Deploy Workflow', () => {
    it('should complete marketing site production workflow', async () => {
      // Step 1: Generate Marketing Site
      const { AppTemplateGenerator } = await import('../../playground/tools/app-template-generator.js');
      const generator = new AppTemplateGenerator();

      const marketingConfig = {
        name: 'NeoForge Marketing',
        template: 'marketing-site',
        components: ['neo-button', 'neo-card', 'hero', 'testimonials'],
        features: ['responsive', 'seo', 'performance']
      };

      const generatedApp = await generator.generateApp(marketingConfig);
      
      expect(generatedApp.buildConfig.optimization.minify).toBe(true);
      expect(generatedApp.buildConfig.optimization.treeshaking).toBe(true);

      // Step 2: Validate Performance (Marketing sites need to be fast)
      const { PerformanceValidator } = await import('../../playground/tools/performance-validator.js');
      const validator = new PerformanceValidator();

      const marketingScenario = {
        components: marketingConfig.components,
        dataSize: 'small', // Marketing sites typically have less data
        interactions: [],
        targetMetrics: {
          firstContentfulPaint: 1200, // Strict for marketing
          largestContentfulPaint: 2000,
          cumulativeLayoutShift: 0.05
        }
      };

      const result = await validator.validateScenario(marketingScenario);
      
      // Marketing sites should meet strict performance targets
      expect(result.metrics.firstContentfulPaint).toBeLessThan(1200);

      // Step 3: Static Site Deployment
      const { DeploymentExamples } = await import('../../playground/tools/deployment-examples.js');
      const deployment = new DeploymentExamples();

      const netlifyGuide = deployment.getGuides().find(g => g.platform === 'netlify');
      expect(netlifyGuide.type).toBe('static');
      expect(netlifyGuide.buildCommands.build).toBe('npm run build');
      expect(netlifyGuide.configFiles['netlify.toml']).toBeDefined();
    });
  });

  describe('SaaS App Generation → Integration → Performance Workflow', () => {
    it('should handle complex SaaS application workflow', async () => {
      // Step 1: Generate SaaS App
      const { AppTemplateGenerator } = await import('../../playground/tools/app-template-generator.js');
      const generator = new AppTemplateGenerator();

      const saasConfig = {
        name: 'Enterprise SaaS',
        template: 'saas-app',
        components: ['neo-form-builder', 'neo-table', 'neo-data-grid', 'neo-button', 'neo-modal'],
        features: ['routing', 'auth', 'responsive', 'forms']
      };

      const generatedApp = await generator.generateApp(saasConfig);
      
      // SaaS apps should enable code splitting
      expect(generatedApp.buildConfig.optimization.codesplitting).toBe(true);

      // Step 2: Check Integration Patterns
      const { ProjectIntegrator } = await import('../../playground/tools/project-integrator.js');
      const integrator = new ProjectIntegrator();

      const reactProject = {
        type: 'vite-react',
        dependencies: ['react', 'react-dom'],
        buildTool: 'vite'
      };

      const integrationPlan = integrator.analyzeProject(reactProject);
      
      expect(integrationPlan.compatibility).toBe('supported');
      expect(integrationPlan.steps.length).toBeGreaterThan(3);
      expect(integrationPlan.codeExamples.mainEntry).toContain('import React');

      // Step 3: Validate Multi-Component Performance
      const { PerformanceValidator } = await import('../../playground/tools/performance-validator.js');
      const validator = new PerformanceValidator();

      const saasScenario = {
        components: saasConfig.components,
        dataSize: 'medium',
        interactions: ['sort', 'filter', 'edit', 'submit'],
        targetMetrics: {
          firstContentfulPaint: 2500,
          largestContentfulPaint: 4000,
          cumulativeLayoutShift: 0.1
        }
      };

      const result = await validator.validateScenario(saasScenario);
      expect(result.metrics).toBeDefined();
    });
  });

  describe('Existing Project Integration Workflows', () => {
    it('should provide React integration workflow', async () => {
      const { ProjectIntegrator } = await import('../../playground/tools/project-integrator.js');
      const integrator = new ProjectIntegrator();

      const reactProjects = [
        { type: 'vite-react', buildTool: 'vite' },
        { type: 'create-react-app', buildTool: 'webpack' },
        { type: 'next.js', buildTool: 'next' }
      ];

      for (const project of reactProjects) {
        const plan = integrator.analyzeProject(project);
        
        expect(plan.compatibility).toBe('supported');
        expect(plan.steps).toBeDefined();
        expect(plan.codeExamples).toBeDefined();
        
        // Should include framework-specific configuration
        const installStep = plan.steps.find(s => s.type === 'install');
        expect(installStep.command).toBe('npm install @neoforge/web-components');
        
        const frameworkStep = plan.steps.find(s => s.type === 'framework');
        expect(frameworkStep).toBeDefined();
      }
    });

    it('should provide Vue integration workflow', async () => {
      const { ProjectIntegrator } = await import('../../playground/tools/project-integrator.js');
      const integrator = new ProjectIntegrator();

      const vueProject = {
        type: 'vite-vue',
        dependencies: ['vue'],
        buildTool: 'vite'
      };

      const plan = integrator.analyzeProject(vueProject);
      
      expect(plan.compatibility).toBe('supported');
      expect(plan.codeExamples.mainEntry).toContain('import { createApp }');
      expect(plan.codeExamples.mainEntry).toContain('from \'vue\'');
    });

    it('should handle unsupported frameworks gracefully', async () => {
      const { ProjectIntegrator } = await import('../../playground/tools/project-integrator.js');
      const integrator = new ProjectIntegrator();

      const unsupportedProject = {
        type: 'svelte',
        dependencies: ['svelte'],
        buildTool: 'rollup'
      };

      const plan = integrator.analyzeProject(unsupportedProject);
      
      expect(plan.compatibility).toBe('unsupported');
      expect(plan.reason).toContain('svelte is not currently supported');
      expect(plan.alternatives).toBeDefined();
      expect(plan.alternatives.length).toBeGreaterThan(0);
    });
  });

  describe('Real-World Usage Scenarios', () => {
    it('should provide working user management scenario', async () => {
      const { UsageExamples } = await import('../../playground/tools/usage-examples.js');
      const examples = new UsageExamples();

      const scenarios = examples.getRealWorldScenarios();
      const userMgmt = scenarios.find(s => s.name === 'user-management-dashboard');
      
      expect(userMgmt).toBeDefined();
      expect(userMgmt.components).toContain('neo-table');
      expect(userMgmt.components).toContain('neo-form-builder');
      expect(userMgmt.components).toContain('neo-modal');
      
      expect(userMgmt.fullExample).toBeDefined();
      expect(userMgmt.fullExample.length).toBeGreaterThan(1000); // Substantial example
      expect(userMgmt.liveDemo).toBeDefined();
      expect(userMgmt.codeFiles).toBeDefined();
      expect(Array.isArray(userMgmt.codeFiles)).toBe(true);
    });

    it('should provide e-commerce scenario with components', async () => {
      const { UsageExamples } = await import('../../playground/tools/usage-examples.js');
      const examples = new UsageExamples();

      const ecommerce = examples.getScenario('e-commerce-product-catalog');
      
      expect(ecommerce).toBeDefined();
      expect(ecommerce.components).toContain('neo-card');
      expect(ecommerce.components).toContain('neo-pagination');
      expect(ecommerce.difficulty).toBe('intermediate');
      expect(ecommerce.category).toBe('e-commerce');
    });

    it('should categorize scenarios correctly', async () => {
      const { UsageExamples } = await import('../../playground/tools/usage-examples.js');
      const examples = new UsageExamples();

      const adminScenarios = examples.getScenariosByCategory('admin');
      const ecommerceScenarios = examples.getScenariosByCategory('e-commerce');
      
      expect(adminScenarios.length).toBeGreaterThan(0);
      expect(ecommerceScenarios.length).toBeGreaterThan(0);
      
      adminScenarios.forEach(scenario => {
        expect(scenario.category).toBe('admin');
      });
    });
  });

  describe('Cross-Platform Deployment Workflows', () => {
    it('should provide complete deployment configurations', async () => {
      const { DeploymentExamples } = await import('../../playground/tools/deployment-examples.js');
      const deployment = new DeploymentExamples();

      const guides = deployment.getGuides();
      
      // Should support major platforms
      const platforms = guides.map(g => g.platform);
      expect(platforms).toContain('vercel');
      expect(platforms).toContain('netlify');
      expect(platforms).toContain('github-pages');
      expect(platforms).toContain('docker');

      // Each guide should be complete
      guides.forEach(guide => {
        expect(guide.configFiles).toBeDefined();
        expect(guide.buildCommands).toBeDefined();
        expect(guide.steps).toBeDefined();
        expect(Array.isArray(guide.steps)).toBe(true);
        expect(guide.steps.length).toBeGreaterThan(0);
      });
    });

    it('should provide platform-specific optimizations', async () => {
      const { DeploymentExamples } = await import('../../playground/tools/deployment-examples.js');
      const deployment = new DeploymentExamples();

      const platforms = ['vercel', 'netlify', 'github-pages', 'docker'];
      
      platforms.forEach(platform => {
        const tips = deployment.getOptimizationTips(platform);
        const security = deployment.getSecurityConsiderations(platform);
        
        expect(Array.isArray(tips)).toBe(true);
        expect(Array.isArray(security)).toBe(true);
        
        if (tips.length > 0) {
          tips.forEach(tip => {
            expect(typeof tip).toBe('string');
            expect(tip.length).toBeGreaterThan(0);
          });
        }
      });
    });

    it('should handle containerized deployment workflow', async () => {
      const { DeploymentExamples } = await import('../../playground/tools/deployment-examples.js');
      const deployment = new DeploymentExamples();

      const dockerGuide = deployment.getGuides().find(g => g.platform === 'docker');
      
      expect(dockerGuide.type).toBe('containerized');
      expect(dockerGuide.configFiles['Dockerfile']).toBeDefined();
      expect(dockerGuide.configFiles['nginx.conf']).toBeDefined();
      expect(dockerGuide.configFiles['.dockerignore']).toBeDefined();
      
      // Should include multi-stage build
      expect(dockerGuide.configFiles['Dockerfile'].content).toContain('FROM node:18-alpine as build');
      expect(dockerGuide.configFiles['Dockerfile'].content).toContain('FROM nginx:alpine');
    });
  });

  describe('Performance Validation in Production Context', () => {
    it('should validate performance with realistic constraints', async () => {
      const { PerformanceValidator } = await import('../../playground/tools/performance-validator.js');
      const validator = new PerformanceValidator();

      // Simulate production constraints
      const productionScenario = {
        components: ['neo-table', 'neo-form-builder', 'neo-card'],
        dataSize: 'large',
        interactions: ['sort', 'filter', 'edit'],
        targetMetrics: {
          firstContentfulPaint: 1600, // Web Vitals "Good" threshold
          largestContentfulPaint: 2500, // Web Vitals "Good" threshold
          cumulativeLayoutShift: 0.1    // Web Vitals "Good" threshold
        }
      };

      const result = await validator.validateScenario(productionScenario);
      
      expect(result.metrics).toBeDefined();
      expect(result.recommendations).toBeDefined();
      
      // Should provide actionable recommendations
      if (result.recommendations.length > 0) {
        result.recommendations.forEach(rec => {
          expect(typeof rec).toBe('string');
          expect(rec.length).toBeGreaterThan(10); // Substantial recommendation
        });
      }
    });

    it('should handle memory pressure scenarios', async () => {
      const { PerformanceValidator } = await import('../../playground/tools/performance-validator.js');
      const validator = new PerformanceValidator();

      // Test memory usage with multiple components
      const memoryScenario = {
        components: ['neo-table', 'neo-data-grid', 'neo-form-builder', 'neo-card'],
        dataSize: 'large',
        interactions: ['sort', 'filter', 'edit', 'submit'],
        targetMetrics: {
          firstContentfulPaint: 3000,
          largestContentfulPaint: 4000,
          cumulativeLayoutShift: 0.15
        }
      };

      const result = await validator.validateScenario(memoryScenario);
      
      expect(result.metrics.memoryUsed).toBeDefined();
      
      // Should complete without memory errors
      expect(result.passed).toBeDefined();
    });
  });

  describe('End-to-End Production Readiness', () => {
    it('should complete full production deployment pipeline', async () => {
      // Simulate complete developer workflow:
      // Playground → Generate App → Integrate → Optimize → Deploy

      const tools = await Promise.all([
        import('../../playground/tools/app-template-generator.js'),
        import('../../playground/tools/project-integrator.js'),
        import('../../playground/tools/performance-validator.js'),
        import('../../playground/tools/deployment-examples.js'),
        import('../../playground/tools/usage-examples.js')
      ]);

      const [
        { AppTemplateGenerator },
        { ProjectIntegrator },
        { PerformanceValidator },
        { DeploymentExamples },
        { UsageExamples }
      ] = tools;

      // Step 1: Developer explores usage examples
      const examples = new UsageExamples();
      const scenarios = examples.getRealWorldScenarios();
      expect(scenarios.length).toBeGreaterThanOrEqual(5);

      // Step 2: Developer generates app based on scenario
      const generator = new AppTemplateGenerator();
      const appConfig = {
        name: 'Production Ready App',
        template: 'dashboard-app',
        components: ['neo-table', 'neo-form-builder', 'neo-button'],
        features: ['routing', 'responsive']
      };
      
      const app = await generator.generateApp(appConfig);
      expect(app.files.length).toBeGreaterThan(0);

      // Step 3: Developer integrates into existing project
      const integrator = new ProjectIntegrator();
      const integration = integrator.analyzeProject({
        type: 'vite-react',
        buildTool: 'vite'
      });
      expect(integration.compatibility).toBe('supported');

      // Step 4: Developer validates performance
      const validator = new PerformanceValidator();
      const performance = await validator.validateScenario({
        components: appConfig.components,
        dataSize: 'medium',
        interactions: ['sort', 'filter'],
        targetMetrics: {
          firstContentfulPaint: 2000,
          largestContentfulPaint: 3000,
          cumulativeLayoutShift: 0.1
        }
      });
      expect(performance.passed).toBe(true);

      // Step 5: Developer deploys to production
      const deployment = new DeploymentExamples();
      const guides = deployment.getGuides();
      expect(guides.length).toBeGreaterThan(0);

      // Complete workflow succeeded
      expect(true).toBe(true);
    });

    it('should provide recovery paths for failed workflows', async () => {
      // Test workflow resilience when things go wrong
      
      const { PerformanceValidator } = await import('../../playground/tools/performance-validator.js');
      const validator = new PerformanceValidator();

      // Scenario that might fail performance targets
      const challengingScenario = {
        components: ['neo-table', 'neo-data-grid', 'neo-form-builder'],
        dataSize: 'large',
        interactions: ['sort', 'filter', 'edit', 'submit'],
        targetMetrics: {
          firstContentfulPaint: 800,  // Very strict targets
          largestContentfulPaint: 1200,
          cumulativeLayoutShift: 0.02
        }
      };

      const result = await validator.validateScenario(challengingScenario);
      
      // Even if performance targets aren't met, should provide useful feedback
      expect(result.recommendations).toBeDefined();
      expect(Array.isArray(result.recommendations)).toBe(true);
      
      if (result.recommendations.length > 0) {
        // Should provide specific, actionable recommendations
        expect(result.recommendations.some(rec => 
          rec.includes('virtual scrolling') || 
          rec.includes('lazy loading') || 
          rec.includes('optimize')
        )).toBe(true);
      }
    });
  });
});