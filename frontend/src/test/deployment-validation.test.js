/**
 * Deployment Validation Tests
 *
 * Tests for the comprehensive deployment validation system
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeploymentValidator } from '../playground/tools/deployment-validator.js';
import { platformValidators } from '../playground/tools/platform-validators.js';
import { HealthCheckTemplates } from '../playground/tools/health-check-templates.js';

// Mock fetch for testing
global.fetch = vi.fn();

describe('Deployment Validation System', () => {
  let deploymentValidator;
  let healthCheckTemplates;

  beforeEach(() => {
    deploymentValidator = new DeploymentValidator();
    healthCheckTemplates = new HealthCheckTemplates();
    vi.clearAllMocks();
  });

  describe('DeploymentValidator', () => {
    it('should initialize with platform validators', () => {
      expect(deploymentValidator.platformValidators).toBeDefined();
      expect(deploymentValidator.validationResults).toBeInstanceOf(Map);
      expect(deploymentValidator.listeners).toBeInstanceOf(Set);
    });

    it('should generate validation ID', () => {
      const id = deploymentValidator.generateValidationId();
      expect(id).toMatch(/^validation_\d+_[a-z0-9]+$/);
    });

    it('should validate connectivity successfully', async () => {
      // Mock successful fetch responses for all connectivity checks
      fetch.mockImplementation((url, options) => {
        const method = options?.method || 'GET';

        if (method === 'HEAD' || method === 'GET') {
          return Promise.resolve({
            ok: true,
            status: 200,
            statusText: 'OK',
            headers: new Map([
              ['content-type', 'text/html'],
              ['x-powered-by', 'Express'],
              ['location', 'https://example.com']
            ])
          });
        }

        return Promise.resolve({
          ok: true,
          status: 200
        });
      });

      const config = {
        url: 'https://example.com',
        platform: 'vercel',
        type: 'frontend-only'
      };

      const result = await deploymentValidator.validateConnectivity(config);

      expect(result.status).toBe('passed');
      expect(result.checks.httpResponse.passed).toBe(true);
      expect(result.checks.httpResponse.status).toBe(200);
    });

    it('should handle connectivity failures', async () => {
      // Mock failed fetch response
      fetch.mockRejectedValueOnce(new Error('Network error'));

      const config = {
        url: 'https://invalid-url.com',
        platform: 'vercel',
        type: 'frontend-only'
      };

      const result = await deploymentValidator.validateConnectivity(config);

      expect(result.status).toBe('failed');
      expect(result.checks.httpResponse.passed).toBe(false);
      expect(result.checks.httpResponse.error).toBe('Network error');
    });

    it('should validate platform configuration', async () => {
      const config = {
        url: 'https://app.vercel.app',
        platform: 'vercel',
        type: 'frontend-only'
      };

      // Mock the platform validator
      vi.spyOn(deploymentValidator.platformValidators, 'validatePlatform')
        .mockResolvedValueOnce({
          status: 'passed',
          passed: 3,
          total: 3,
          checks: {
            vercelHeaders: { passed: true },
            buildOutput: { passed: true },
            domainConfig: { passed: true }
          },
          recommendations: []
        });

      const result = await deploymentValidator.validatePlatform(config);

      expect(result.status).toBe('passed');
      expect(result.passed).toBe(3);
      expect(result.total).toBe(3);
    });

    it('should subscribe and notify listeners', () => {
      const listener = vi.fn();
      const unsubscribe = deploymentValidator.subscribe(listener);

      deploymentValidator.notifyListeners('test-event', { data: 'test' });

      expect(listener).toHaveBeenCalledWith('test-event', { data: 'test' });

      // Test unsubscribe
      unsubscribe();
      deploymentValidator.notifyListeners('test-event', { data: 'test2' });

      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  describe('Platform Validators', () => {
    it('should have validators for all supported platforms', () => {
      const supportedPlatforms = ['vercel', 'netlify', 'github-pages', 'firebase'];

      supportedPlatforms.forEach(platform => {
        const validator = platformValidators.getValidator(platform);
        expect(validator).toBeDefined();
        expect(typeof validator.validate).toBe('function');
      });
    });

    it('should use generic validator for unsupported platforms', () => {
      const validator = platformValidators.getValidator('unknown-platform');
      expect(validator).toBeDefined();
      expect(typeof validator.validate).toBe('function');
    });

    it('should validate Vercel deployment', async () => {
      // Mock Vercel-specific responses
      fetch.mockImplementation((url, options) => {
        if (options?.method === 'HEAD') {
          return Promise.resolve({
            ok: true,
            status: 200,
            headers: new Map([
              ['server', 'Vercel'],
              ['x-vercel-id', 'abc123']
            ])
          });
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          text: () => Promise.resolve('<html><head><title>Test</title></head><body>Content</body></html>')
        });
      });

      const config = {
        url: 'https://app.vercel.app',
        type: 'frontend-only'
      };

      const result = await platformValidators.validatePlatform('vercel', config);

      expect(result.status).toBe('passed');
      expect(result.checks.vercelHeaders.passed).toBe(true);
    });
  });

  describe('Health Check Templates', () => {
    it('should provide templates for different application types', () => {
      const types = ['frontend-only', 'fullstack', 'api-only', 'static-site'];

      types.forEach(type => {
        const template = healthCheckTemplates.getTemplate(type);
        expect(template).toBeDefined();
        expect(template.config).toBeDefined();
        expect(template.config.endpoints).toBeInstanceOf(Array);
      });
    });

    it('should generate health check system', () => {
      const appConfig = {
        name: 'Test App',
        type: 'fullstack',
        version: '1.0.0'
      };

      const healthSystem = healthCheckTemplates.generateHealthCheckSystem(appConfig);

      expect(healthSystem.files).toBeInstanceOf(Array);
      expect(healthSystem.endpoints).toBeInstanceOf(Array);
      expect(healthSystem.monitoring).toBeDefined();
      expect(healthSystem.validation).toBeDefined();

      // Should have both frontend and backend files for fullstack
      const filePaths = healthSystem.files.map(f => f.path);
      expect(filePaths.some(path => path.includes('health.html'))).toBe(true);
      expect(filePaths.some(path => path.includes('health.js'))).toBe(true);
    });

    it('should generate frontend health check HTML', () => {
      const appConfig = {
        name: 'Frontend App',
        type: 'frontend-only',
        version: '1.0.0'
      };

      const html = healthCheckTemplates.generateFrontendHealthCheck(appConfig);

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('Health Check');
      expect(html).toContain('checkDOMReady');
      expect(html).toContain('checkPerformance');
      expect(html).toContain(appConfig.name);
    });

    it('should generate monitoring configuration', () => {
      const template = healthCheckTemplates.getTemplate('frontend-only');
      const appConfig = {
        name: 'Test App',
        type: 'frontend-only'
      };

      const config = healthCheckTemplates.generateMonitoringConfig(template, appConfig);
      const configObj = JSON.parse(config);

      expect(configObj.service).toBe('Test App');
      expect(configObj.endpoints).toBeInstanceOf(Array);
      expect(configObj.thresholds).toBeDefined();
      expect(configObj.alerts).toBeDefined();
    });
  });

  describe('Integration Tests', () => {
    it('should complete full deployment validation workflow', async () => {
      // Mock all required fetch calls
      fetch.mockImplementation((url, options) => {
        const method = options?.method || 'GET';

        if (method === 'HEAD') {
          return Promise.resolve({
            ok: true,
            status: 200,
            headers: new Map([
              ['server', 'Vercel'],
              ['content-type', 'text/html'],
              ['x-vercel-id', 'test123']
            ])
          });
        }

        if (url.includes('/api/health') || url.includes('/health')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ status: 'healthy' })
          });
        }

        return Promise.resolve({
          ok: true,
          status: 200,
          text: () => Promise.resolve(`
            <html>
              <head><title>Test App</title><meta name="viewport" content="width=device-width"></head>
              <body><h1>Test Content</h1></body>
            </html>
          `)
        });
      });

      const deploymentConfig = {
        platform: 'vercel',
        url: 'https://test-app.vercel.app',
        type: 'fullstack',
        name: 'Test App',
        version: '1.0.0',
        environment: 'production'
      };

      const validationResult = await deploymentValidator.validateDeployment(deploymentConfig);

      expect(validationResult.status).toBe('passed');
      expect(validationResult.validationId).toMatch(/^validation_\d+_[a-z0-9]+$/);
      expect(validationResult.phases).toBeDefined();
      expect(validationResult.phases.connectivity).toBeDefined();
      expect(validationResult.phases.platform).toBeDefined();
      expect(validationResult.phases.health).toBeDefined();
      expect(validationResult.summary).toBeDefined();
      expect(validationResult.duration).toBeGreaterThan(0);
    });

    it('should handle validation failures gracefully', async () => {
      // Mock failed responses
      fetch.mockRejectedValue(new Error('Connection failed'));

      const deploymentConfig = {
        platform: 'vercel',
        url: 'https://failed-deployment.com',
        type: 'frontend-only',
        name: 'Failed App'
      };

      const validationResult = await deploymentValidator.validateDeployment(deploymentConfig);

      expect(validationResult.status).toBe('error');
      expect(validationResult.error).toBeDefined();
    });

    it('should calculate overall status correctly', () => {
      const phases = {
        connectivity: { status: 'passed' },
        platform: { status: 'passed' },
        health: { status: 'passed' },
        performance: { status: 'failed' },
        security: { status: 'warning' }
      };

      const status = deploymentValidator.calculateOverallStatus(phases);
      expect(status).toBe('warning'); // Critical phases pass but optional phases have issues
    });

    it('should generate validation summary with recommendations', () => {
      const results = {
        status: 'warning',
        duration: 5000,
        phases: {
          connectivity: { status: 'passed' },
          platform: { status: 'passed' },
          health: { status: 'passed' },
          performance: { status: 'failed' },
          security: { status: 'failed' }
        }
      };

      const summary = deploymentValidator.generateValidationSummary(results);

      expect(summary.overallStatus).toBe('warning');
      expect(summary.totalDuration).toBe(5000);
      expect(summary.issues).toContain('performance validation failed');
      expect(summary.issues).toContain('security validation failed');
      expect(summary.recommendations).toContain('Optimize load times and resource sizes');
      expect(summary.nextSteps).toBeInstanceOf(Array);
      expect(summary.nextSteps.length).toBeGreaterThan(0);
    });
  });
});
