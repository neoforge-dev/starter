/**
 * Test-Driven Development: Application Integration Test
 *
 * This test defines the expected behavior for developers integrating
 * playground components into real applications.
 */
import { describe, it, expect, beforeEach } from 'vitest';

describe('Application Integration System', () => {
  let appIntegrator;

  beforeEach(() => {
    // Will implement AppIntegrator class based on failing tests
  });

  it('should provide working application templates', async () => {
    const { AppTemplateGenerator } = await import('../../playground/tools/app-template-generator.js');
    const generator = new AppTemplateGenerator();

    const templates = generator.getAvailableTemplates();

    // Core application types that developers actually build
    expect(templates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'dashboard-app', description: 'Admin dashboard with tables and forms' }),
        expect.objectContaining({ name: 'marketing-site', description: 'Marketing website with landing pages' }),
        expect.objectContaining({ name: 'saas-app', description: 'SaaS application with auth and billing' }),
        expect.objectContaining({ name: 'minimal-app', description: 'Minimal starting point with essential components' })
      ])
    );

    expect(templates.length).toBeGreaterThanOrEqual(4);
  });

  it('should generate working application with playground components', async () => {
    const { AppTemplateGenerator } = await import('../../playground/tools/app-template-generator.js');
    const generator = new AppTemplateGenerator();

    const appConfig = {
      name: 'test-dashboard',
      template: 'dashboard-app',
      components: ['neo-table', 'neo-form-builder', 'neo-button', 'neo-card'],
      features: ['routing', 'auth', 'responsive']
    };

    const generatedApp = await generator.generateApp(appConfig);

    expect(generatedApp.files).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: 'index.html', type: 'entry' }),
        expect.objectContaining({ path: 'src/app.js', type: 'main' }),
        expect.objectContaining({ path: 'src/routes.js', type: 'routing' }),
        expect.objectContaining({ path: 'src/components/index.js', type: 'components' })
      ])
    );

    expect(generatedApp.dependencies).toContain('@neoforge/web-components');
    expect(generatedApp.buildConfig).toBeDefined();
  });

  it('should provide integration guide for existing projects', async () => {
    const { ProjectIntegrator } = await import('../../playground/tools/project-integrator.js');
    const integrator = new ProjectIntegrator();

    const existingProject = {
      type: 'vite-react', // or 'create-react-app', 'next.js', 'vanilla'
      dependencies: ['react', 'react-dom'],
      buildTool: 'vite'
    };

    const integrationPlan = integrator.analyzeProject(existingProject);

    expect(integrationPlan.steps).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'install',
          description: 'Install NeoForge Web Components'
        }),
        expect.objectContaining({
          type: 'configure',
          description: 'Configure build tool for Web Components'
        }),
        expect.objectContaining({
          type: 'import',
          description: 'Import and register components'
        })
      ])
    );

    expect(integrationPlan.codeExamples).toBeDefined();
    expect(integrationPlan.compatibility).toBe('supported');
  });

  it('should provide production deployment examples', async () => {
    const { DeploymentExamples } = await import('../../playground/tools/deployment-examples.js');
    const examples = new DeploymentExamples();

    const deploymentGuides = examples.getGuides();

    expect(deploymentGuides).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ platform: 'vercel', type: 'static' }),
        expect.objectContaining({ platform: 'netlify', type: 'static' }),
        expect.objectContaining({ platform: 'github-pages', type: 'static' }),
        expect.objectContaining({ platform: 'docker', type: 'containerized' })
      ])
    );

    // Each guide should include working configuration
    const vercelGuide = deploymentGuides.find(g => g.platform === 'vercel');
    expect(vercelGuide.configFiles).toBeDefined();
    expect(vercelGuide.buildCommands).toBeDefined();
  });

  it('should validate component performance in real applications', async () => {
    const { PerformanceValidator } = await import('../../playground/tools/performance-validator.js');
    const validator = new PerformanceValidator();

    // Test with realistic application scenario
    const appScenario = {
      components: ['neo-table', 'neo-form-builder', 'neo-card'],
      dataSize: 'large', // 1000+ table rows
      interactions: ['sort', 'filter', 'edit', 'submit'],
      targetMetrics: {
        firstContentfulPaint: 1500, // ms
        largestContentfulPaint: 2500, // ms
        cumulativeLayoutShift: 0.1
      }
    };

    const performanceResults = await validator.validateScenario(appScenario);

    expect(performanceResults.passed).toBe(true);
    expect(performanceResults.metrics.firstContentfulPaint).toBeLessThan(1500);
    expect(performanceResults.metrics.largestContentfulPaint).toBeLessThan(2500);
    expect(performanceResults.metrics.cumulativeLayoutShift).toBeLessThan(0.1);
  });

  it('should provide component usage examples for real-world scenarios', async () => {
    const { UsageExamples } = await import('../../playground/tools/usage-examples.js');
    const examples = new UsageExamples();

    const scenarios = examples.getRealWorldScenarios();

    // Essential scenarios that every developer needs
    expect(scenarios).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'user-management-dashboard',
          components: expect.arrayContaining(['neo-table', 'neo-form-builder', 'neo-modal'])
        }),
        expect.objectContaining({
          name: 'e-commerce-product-catalog',
          components: expect.arrayContaining(['neo-card', 'neo-pagination', 'neo-select'])
        }),
        expect.objectContaining({
          name: 'blog-content-management',
          components: expect.arrayContaining(['rich-text-editor', 'neo-form', 'file-upload'])
        })
      ])
    );

    // Each scenario should include complete working code
    const userMgmt = scenarios.find(s => s.name === 'user-management-dashboard');
    expect(userMgmt.fullExample).toBeDefined();
    expect(userMgmt.liveDemo).toBeDefined();
  });
});
