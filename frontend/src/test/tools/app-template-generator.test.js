/**
 * AppTemplateGenerator Unit Tests
 *
 * Comprehensive unit tests for the Application Template Generator tool.
 * Tests all public methods and edge cases for reliable app generation.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { AppTemplateGenerator } from '../../playground/tools/app-template-generator.js';

describe('AppTemplateGenerator', () => {
  let generator;

  beforeEach(() => {
    generator = new AppTemplateGenerator();
  });

  describe('Initialization', () => {
    it('should initialize with available templates', () => {
      expect(generator.templates).toBeDefined();
      expect(typeof generator.templates).toBe('object');
    });

    it('should have required template configurations', () => {
      const templates = generator.templates;

      // Check required template types exist
      expect(templates['dashboard-app']).toBeDefined();
      expect(templates['marketing-site']).toBeDefined();
      expect(templates['saas-app']).toBeDefined();
      expect(templates['minimal-app']).toBeDefined();

      // Check template structure
      Object.values(templates).forEach(template => {
        expect(template.pages).toBeDefined();
        expect(Array.isArray(template.pages)).toBe(true);
        expect(template.layout).toBeDefined();
      });
    });
  });

  describe('getAvailableTemplates', () => {
    it('should return array of template definitions', () => {
      const templates = generator.getAvailableTemplates();

      expect(Array.isArray(templates)).toBe(true);
      expect(templates.length).toBeGreaterThanOrEqual(4);
    });

    it('should return templates with required properties', () => {
      const templates = generator.getAvailableTemplates();

      templates.forEach(template => {
        expect(template.name).toBeDefined();
        expect(template.description).toBeDefined();
        expect(template.components).toBeDefined();
        expect(Array.isArray(template.components)).toBe(true);
        expect(template.features).toBeDefined();
        expect(Array.isArray(template.features)).toBe(true);
        expect(template.complexity).toBeDefined();
      });
    });

    it('should include all expected template types', () => {
      const templates = generator.getAvailableTemplates();
      const templateNames = templates.map(t => t.name);

      expect(templateNames).toContain('dashboard-app');
      expect(templateNames).toContain('marketing-site');
      expect(templateNames).toContain('saas-app');
      expect(templateNames).toContain('minimal-app');
    });

    it('should have correct component mapping for each template', () => {
      const templates = generator.getAvailableTemplates();

      const dashboardTemplate = templates.find(t => t.name === 'dashboard-app');
      expect(dashboardTemplate.components).toContain('neo-table');
      expect(dashboardTemplate.components).toContain('neo-form-builder');

      const marketingTemplate = templates.find(t => t.name === 'marketing-site');
      expect(marketingTemplate.components).toContain('neo-button');
      expect(marketingTemplate.components).toContain('neo-card');
    });
  });

  describe('generateApp', () => {
    it('should generate complete app structure for dashboard template', async () => {
      const appConfig = {
        name: 'test-dashboard',
        template: 'dashboard-app',
        components: ['neo-table', 'neo-form-builder', 'neo-button', 'neo-card'],
        features: ['routing', 'responsive']
      };

      const result = await generator.generateApp(appConfig);

      expect(result.name).toBe('test-dashboard');
      expect(result.template).toBe('dashboard-app');
      expect(result.files).toBeDefined();
      expect(Array.isArray(result.files)).toBe(true);
      expect(result.dependencies).toBeDefined();
      expect(result.buildConfig).toBeDefined();
    });

    it('should generate correct file structure for routing apps', async () => {
      const appConfig = {
        name: 'routing-app',
        template: 'dashboard-app',
        components: ['neo-table', 'neo-button'],
        features: ['routing', 'responsive']
      };

      const result = await generator.generateApp(appConfig);

      const filePaths = result.files.map(f => f.path);
      expect(filePaths).toContain('index.html');
      expect(filePaths).toContain('src/app.js');
      expect(filePaths).toContain('src/routes.js');
      expect(filePaths).toContain('src/components/index.js');
      expect(filePaths).toContain('src/pages/home.js');
    });

    it('should generate correct file structure for non-routing apps', async () => {
      const appConfig = {
        name: 'simple-app',
        template: 'minimal-app',
        components: ['neo-button', 'neo-card'],
        features: ['responsive']
      };

      const result = await generator.generateApp(appConfig);

      const filePaths = result.files.map(f => f.path);
      expect(filePaths).toContain('index.html');
      expect(filePaths).toContain('src/app.js');
      expect(filePaths).toContain('src/components/index.js');
      expect(filePaths).not.toContain('src/routes.js');
      expect(filePaths).not.toContain('src/pages/home.js');
    });

    it('should include dashboard page for dashboard template', async () => {
      const appConfig = {
        name: 'dashboard-test',
        template: 'dashboard-app',
        components: ['neo-table', 'neo-form-builder'],
        features: ['routing', 'responsive']
      };

      const result = await generator.generateApp(appConfig);

      const filePaths = result.files.map(f => f.path);
      expect(filePaths).toContain('src/pages/dashboard.js');
    });

    it('should throw error for invalid template', async () => {
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
  });

  describe('generateIndexHTML', () => {
    it('should generate valid HTML structure', () => {
      const appConfig = {
        name: 'Test App',
        template: 'minimal-app',
        components: ['neo-button'],
        features: ['responsive']
      };

      const html = generator.generateIndexHTML(appConfig);

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<html lang="en">');
      expect(html).toContain('<title>Test App</title>');
      expect(html).toContain('<div id="app"');
      expect(html).toContain('src="./src/app.js"');
    });

    it('should include responsive viewport meta tag', () => {
      const appConfig = {
        name: 'Mobile App',
        template: 'minimal-app',
        components: ['neo-button'],
        features: ['responsive']
      };

      const html = generator.generateIndexHTML(appConfig);

      expect(html).toContain('viewport');
      expect(html).toContain('width=device-width');
    });

    it('should include basic CSS reset and app container styles', () => {
      const appConfig = {
        name: 'Styled App',
        template: 'minimal-app',
        components: ['neo-button'],
        features: ['responsive']
      };

      const html = generator.generateIndexHTML(appConfig);

      expect(html).toContain('margin: 0');
      expect(html).toContain('font-family: system-ui');
      expect(html).toContain('.app-container');
      expect(html).toContain('min-height: 100vh');
    });
  });

  describe('generateMainApp', () => {
    it('should generate routing setup for routing apps', () => {
      const appConfig = {
        name: 'Routing App',
        template: 'dashboard-app',
        components: ['neo-table'],
        features: ['routing', 'responsive']
      };

      const appJs = generator.generateMainApp(appConfig);

      expect(appJs).toContain("import { router } from './routes.js'");
      expect(appJs).toContain('this.setupRouting()');
      expect(appJs).toContain('setupRouting()');
      expect(appJs).toContain('router.init(this.container)');
    });

    it('should generate simple render setup for non-routing apps', () => {
      const appConfig = {
        name: 'Simple App',
        template: 'minimal-app',
        components: ['neo-button', 'neo-card'],
        features: ['responsive']
      };

      const appJs = generator.generateMainApp(appConfig);

      expect(appJs).not.toContain("import { router }");
      expect(appJs).toContain('this.render()');
      expect(appJs).toContain('render()');
      expect(appJs).toContain('this.container.innerHTML');
    });

    it('should include component imports', () => {
      const appConfig = {
        name: 'Component App',
        template: 'minimal-app',
        components: ['neo-button'],
        features: ['responsive']
      };

      const appJs = generator.generateMainApp(appConfig);

      expect(appJs).toContain("import './components/index.js'");
    });

    it('should include app name in generated code comments', () => {
      const appConfig = {
        name: 'My Test App',
        template: 'minimal-app',
        components: ['neo-button'],
        features: ['responsive']
      };

      const appJs = generator.generateMainApp(appConfig);

      expect(appJs).toContain('My Test App - Generated from NeoForge Playground');
      expect(appJs).toContain('Template: minimal-app');
    });

    it('should include components in rendered content for simple apps', () => {
      const appConfig = {
        name: 'Component Test',
        template: 'minimal-app',
        components: ['neo-button', 'neo-card'],
        features: ['responsive']
      };

      const appJs = generator.generateMainApp(appConfig);

      expect(appJs).toContain('<neo-button style="margin: 1rem 0;"></neo-button>');
      expect(appJs).toContain('<neo-card style="margin: 1rem 0;"></neo-card>');
    });
  });

  describe('generateComponentImports', () => {
    it('should generate correct import statements for known components', () => {
      const appConfig = {
        name: 'Test App',
        template: 'minimal-app',
        components: ['neo-button', 'neo-card', 'neo-table'],
        features: ['responsive']
      };

      const imports = generator.generateComponentImports(appConfig);

      expect(imports).toContain("import '../../../components/atoms/button/button.js'");
      expect(imports).toContain("import '../../../components/molecules/card/card.js'");
      expect(imports).toContain("import '../../../components/organisms/neo-table.js'");
    });

    it('should handle unknown components gracefully', () => {
      const appConfig = {
        name: 'Test App',
        template: 'minimal-app',
        components: ['neo-button', 'unknown-component'],
        features: ['responsive']
      };

      const imports = generator.generateComponentImports(appConfig);

      expect(imports).toContain("import '../../../components/atoms/button/button.js'");
      expect(imports).toContain('// unknown-component - add import path');
    });

    it('should include descriptive comments', () => {
      const appConfig = {
        name: 'Import Test App',
        template: 'minimal-app',
        components: ['neo-button'],
        features: ['responsive']
      };

      const imports = generator.generateComponentImports(appConfig);

      expect(imports).toContain('Component imports for Import Test App');
      expect(imports).toContain('All NeoForge components used in this application');
      expect(imports).toContain('Components loaded for Import Test App');
    });
  });

  describe('generateDependencies', () => {
    it('should always include core neoforge package', () => {
      const appConfig = {
        name: 'Dep Test',
        template: 'minimal-app',
        components: ['neo-button'],
        features: ['responsive']
      };

      const deps = generator.generateDependencies(appConfig);

      expect(Array.isArray(deps)).toBe(true);
      expect(deps).toContain('@neoforge/web-components');
    });

    it('should not add extra dependencies for routing apps', () => {
      const appConfig = {
        name: 'Routing Dep Test',
        template: 'dashboard-app',
        components: ['neo-table'],
        features: ['routing', 'responsive']
      };

      const deps = generator.generateDependencies(appConfig);

      // Should use vanilla JS routing, no extra deps
      expect(deps.length).toBe(1);
      expect(deps[0]).toBe('@neoforge/web-components');
    });
  });

  describe('generateBuildConfig', () => {
    it('should generate standard build configuration', () => {
      const appConfig = {
        name: 'Build Test',
        template: 'minimal-app',
        components: ['neo-button'],
        features: ['responsive']
      };

      const buildConfig = generator.generateBuildConfig(appConfig);

      expect(buildConfig.bundler).toBe('vite');
      expect(buildConfig.entry).toBe('src/app.js');
      expect(buildConfig.outDir).toBe('dist');
      expect(buildConfig.features).toEqual(appConfig.features);
      expect(buildConfig.optimization).toBeDefined();
    });

    it('should enable code splitting for routing apps', () => {
      const appConfig = {
        name: 'Code Split Test',
        template: 'dashboard-app',
        components: ['neo-table'],
        features: ['routing', 'responsive']
      };

      const buildConfig = generator.generateBuildConfig(appConfig);

      expect(buildConfig.optimization.codesplitting).toBe(true);
    });

    it('should disable code splitting for simple apps', () => {
      const appConfig = {
        name: 'No Split Test',
        template: 'minimal-app',
        components: ['neo-button'],
        features: ['responsive']
      };

      const buildConfig = generator.generateBuildConfig(appConfig);

      expect(buildConfig.optimization.codesplitting).toBe(false);
    });

    it('should always enable minification and tree shaking', () => {
      const appConfig = {
        name: 'Optimization Test',
        template: 'minimal-app',
        components: ['neo-button'],
        features: ['responsive']
      };

      const buildConfig = generator.generateBuildConfig(appConfig);

      expect(buildConfig.optimization.minify).toBe(true);
      expect(buildConfig.optimization.treeshaking).toBe(true);
    });
  });

  describe('Page Generation', () => {
    it('should generate home page with correct structure', () => {
      const appConfig = {
        name: 'Page Test App',
        template: 'dashboard-app',
        components: ['neo-card', 'neo-button'],
        features: ['routing', 'responsive']
      };

      const homePage = generator.generateHomePage(appConfig);

      expect(homePage).toContain('Page Test App');
      expect(homePage).toContain('Built with NeoForge Web Components');
      expect(homePage).toContain('export default class HomePage');
      expect(homePage).toContain('render()');
    });

    it('should include card sections when neo-card is used', () => {
      const appConfig = {
        name: 'Card Test',
        template: 'dashboard-app',
        components: ['neo-card', 'neo-button'],
        features: ['routing', 'responsive']
      };

      const homePage = generator.generateHomePage(appConfig);

      expect(homePage).toContain('<neo-card style="padding: 1.5rem;">');
      expect(homePage).toContain('<h3>Feature 1</h3>');
      expect(homePage).toContain('<neo-button variant="primary">Learn More</neo-button>');
    });

    it('should include dashboard navigation for dashboard apps', () => {
      const appConfig = {
        name: 'Dashboard Nav Test',
        template: 'dashboard-app',
        components: ['neo-card'],
        features: ['routing', 'responsive']
      };

      const homePage = generator.generateHomePage(appConfig);

      expect(homePage).toContain('Go to Dashboard');
      expect(homePage).toContain("router.navigate('/dashboard')");
    });

    it('should generate dashboard page with data components', () => {
      const appConfig = {
        name: 'Dashboard Page Test',
        template: 'dashboard-app',
        components: ['neo-table', 'neo-form-builder'],
        features: ['routing', 'responsive']
      };

      const dashboardPage = generator.generateDashboardPage(appConfig);

      expect(dashboardPage).toContain('export default class DashboardPage');
      expect(dashboardPage).toContain('<h1>Dashboard</h1>');
      expect(dashboardPage).toContain("router.navigate('/')");
    });

    it('should include table section when neo-table is used', () => {
      const appConfig = {
        name: 'Table Test',
        template: 'dashboard-app',
        components: ['neo-table'],
        features: ['routing', 'responsive']
      };

      const dashboardPage = generator.generateDashboardPage(appConfig);

      expect(dashboardPage).toContain('<neo-table');
      expect(dashboardPage).toContain('John Doe');
      expect(dashboardPage).toContain('jane@example.com');
      expect(dashboardPage).toContain('pageable="true"');
    });

    it('should include form section when neo-form-builder is used', () => {
      const appConfig = {
        name: 'Form Test',
        template: 'dashboard-app',
        components: ['neo-form-builder'],
        features: ['routing', 'responsive']
      };

      const dashboardPage = generator.generateDashboardPage(appConfig);

      expect(dashboardPage).toContain('<neo-form-builder');
      expect(dashboardPage).toContain('Quick Form');
      expect(dashboardPage).toContain('"type":"text"');
      expect(dashboardPage).toContain('"type":"email"');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty components array', async () => {
      const appConfig = {
        name: 'Empty Components',
        template: 'minimal-app',
        components: [],
        features: ['responsive']
      };

      const result = await generator.generateApp(appConfig);

      expect(result.files).toBeDefined();
      expect(result.files.length).toBeGreaterThan(0);

      const componentImports = result.files.find(f => f.path === 'src/components/index.js');
      expect(componentImports.content).toContain('Components loaded for Empty Components');
    });

    it('should handle undefined features array', async () => {
      const appConfig = {
        name: 'No Features',
        template: 'minimal-app',
        components: ['neo-button']
        // features intentionally undefined
      };

      // Should handle gracefully without throwing
      const result = await generator.generateApp(appConfig);
      expect(result.files).toBeDefined();
    });

    it('should handle special characters in app name', () => {
      const appConfig = {
        name: 'Test-App_With.Special@Chars!',
        template: 'minimal-app',
        components: ['neo-button'],
        features: ['responsive']
      };

      const html = generator.generateIndexHTML(appConfig);
      const appJs = generator.generateMainApp(appConfig);

      expect(html).toContain('Test-App_With.Special@Chars!');
      expect(appJs).toContain('Test-App_With.Special@Chars!');
    });
  });
});
