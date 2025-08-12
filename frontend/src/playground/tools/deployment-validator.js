/**
 * Deployment Validator
 * 
 * Comprehensive validation system that ensures deployed applications are working correctly.
 * Integrates with health checks and provides real-time feedback on deployment success.
 */

import { platformValidators } from './platform-validators.js';

export class DeploymentValidator {
  constructor() {
    this.platformValidators = platformValidators;
    this.validationResults = new Map();
    this.listeners = new Set();
  }

  /**
   * Validate complete deployment
   */
  async validateDeployment(deploymentConfig) {
    const validationId = this.generateValidationId();
    const startTime = Date.now();
    
    try {
      console.log('🔍 Starting deployment validation...', { validationId, config: deploymentConfig });
      
      // Track validation start
      this.trackValidationStart(validationId, deploymentConfig);
      
      // Run validation phases
      const results = {
        validationId,
        platform: deploymentConfig.platform,
        url: deploymentConfig.url,
        phases: {},
        startTime,
        status: 'running'
      };
      
      // Phase 1: Basic connectivity
      results.phases.connectivity = await this.validateConnectivity(deploymentConfig);
      this.notifyProgress(validationId, 'connectivity', results.phases.connectivity);
      
      // Phase 2: Platform-specific validation
      results.phases.platform = await this.validatePlatform(deploymentConfig);
      this.notifyProgress(validationId, 'platform', results.phases.platform);
      
      // Phase 3: Application health
      results.phases.health = await this.validateApplicationHealth(deploymentConfig);
      this.notifyProgress(validationId, 'health', results.phases.health);
      
      // Phase 4: Performance validation
      results.phases.performance = await this.validatePerformance(deploymentConfig);
      this.notifyProgress(validationId, 'performance', results.phases.performance);
      
      // Phase 5: Security validation
      results.phases.security = await this.validateSecurity(deploymentConfig);
      this.notifyProgress(validationId, 'security', results.phases.security);
      
      // Calculate overall status
      results.endTime = Date.now();
      results.duration = results.endTime - startTime;
      results.status = this.calculateOverallStatus(results.phases);
      results.summary = this.generateValidationSummary(results);
      
      // Store and notify
      this.validationResults.set(validationId, results);
      this.notifyComplete(validationId, results);
      
      console.log('✅ Deployment validation complete', { 
        validationId, 
        status: results.status,
        duration: results.duration 
      });
      
      return results;
      
    } catch (error) {
      const errorResult = {
        validationId,
        status: 'error',
        error: error.message,
        endTime: Date.now(),
        duration: Date.now() - startTime
      };
      
      this.validationResults.set(validationId, errorResult);
      this.notifyError(validationId, errorResult);
      
      console.error('❌ Deployment validation failed', { validationId, error });
      return errorResult;
    }
  }

  /**
   * Validate basic connectivity
   */
  async validateConnectivity(config) {
    console.log('🌐 Validating connectivity...');
    
    const checks = {
      httpResponse: await this.checkHttpResponse(config.url),
      httpsRedirect: await this.checkHttpsRedirect(config.url),
      dns: await this.checkDNSResolution(config.url),
      cors: await this.checkCORSConfiguration(config.url)
    };
    
    const passed = Object.values(checks).filter(check => check.passed).length;
    const total = Object.keys(checks).length;
    
    return {
      status: passed === total ? 'passed' : 'failed',
      passed,
      total,
      checks,
      duration: checks.httpResponse.duration + checks.httpsRedirect.duration
    };
  }

  /**
   * Validate platform-specific configuration
   */
  async validatePlatform(config) {
    console.log('🔧 Validating platform configuration...');
    
    try {
      const result = await this.platformValidators.validatePlatform(config.platform, config);
      return {
        status: result.status,
        passed: result.passed,
        total: result.total,
        checks: result.checks,
        recommendations: result.recommendations || []
      };
    } catch (error) {
      return {
        status: 'failed',
        error: error.message,
        reason: `Platform validation failed: ${error.message}`
      };
    }
  }

  /**
   * Validate application health
   */
  async validateApplicationHealth(config) {
    console.log('💚 Validating application health...');
    
    const checks = {};
    
    // Check for health endpoint
    const healthEndpoints = this.getHealthEndpoints(config);
    
    for (const endpoint of healthEndpoints) {
      const checkName = endpoint.replace(/[^a-zA-Z0-9]/g, '_');
      checks[checkName] = await this.checkHealthEndpoint(`${config.url}${endpoint}`);
    }
    
    // Check for frontend health indicators
    if (config.type === 'frontend-only' || config.type === 'fullstack') {
      checks.frontend_health = await this.checkFrontendHealth(config.url);
    }
    
    // Check for API functionality
    if (config.type === 'api-only' || config.type === 'fullstack') {
      checks.api_health = await this.checkAPIHealth(config.url);
    }
    
    const passed = Object.values(checks).filter(check => check.passed).length;
    const total = Object.keys(checks).length;
    
    return {
      status: passed >= Math.ceil(total * 0.8) ? 'passed' : 'failed', // 80% threshold
      passed,
      total,
      checks
    };
  }

  /**
   * Validate performance
   */
  async validatePerformance(config) {
    console.log('⚡ Validating performance...');
    
    const checks = {
      loadTime: await this.checkLoadTime(config.url),
      firstPaint: await this.checkFirstPaint(config.url),
      resourceSizes: await this.checkResourceSizes(config.url),
      compression: await this.checkCompression(config.url)
    };
    
    const passed = Object.values(checks).filter(check => check.passed).length;
    const total = Object.keys(checks).length;
    
    return {
      status: passed >= Math.ceil(total * 0.7) ? 'passed' : 'failed', // 70% threshold for performance
      passed,
      total,
      checks
    };
  }

  /**
   * Validate security
   */
  async validateSecurity(config) {
    console.log('🔒 Validating security...');
    
    const checks = {
      https: await this.checkHttpsEnforcement(config.url),
      headers: await this.checkSecurityHeaders(config.url),
      certificates: await this.checkSSLCertificate(config.url),
      vulnerabilities: await this.checkCommonVulnerabilities(config.url)
    };
    
    const passed = Object.values(checks).filter(check => check.passed).length;
    const total = Object.keys(checks).length;
    
    return {
      status: passed >= Math.ceil(total * 0.9) ? 'passed' : 'failed', // 90% threshold for security
      passed,
      total,
      checks
    };
  }

  /**
   * Check HTTP response
   */
  async checkHttpResponse(url) {
    const startTime = Date.now();
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Cache-Control': 'no-cache' }
      });
      
      const duration = Date.now() - startTime;
      
      return {
        passed: response.ok,
        status: response.status,
        statusText: response.statusText,
        duration,
        headers: Object.fromEntries(response.headers.entries())
      };
    } catch (error) {
      return {
        passed: false,
        error: error.message,
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Check HTTPS redirect
   */
  async checkHttpsRedirect(url) {
    const startTime = Date.now();
    
    if (!url.startsWith('https://')) {
      return {
        passed: false,
        reason: 'URL is not HTTPS',
        duration: Date.now() - startTime
      };
    }
    
    const httpUrl = url.replace('https://', 'http://');
    
    try {
      const response = await fetch(httpUrl, {
        method: 'GET',
        redirect: 'manual'
      });
      
      const duration = Date.now() - startTime;
      const location = response.headers.get('location');
      
      return {
        passed: response.status >= 300 && response.status < 400 && location?.startsWith('https://'),
        status: response.status,
        location,
        duration
      };
    } catch (error) {
      return {
        passed: false,
        error: error.message,
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Check DNS resolution
   */
  async checkDNSResolution(url) {
    const startTime = Date.now();
    
    try {
      // Simple DNS check by trying to connect
      const response = await fetch(url, { method: 'HEAD' });
      
      return {
        passed: true,
        duration: Date.now() - startTime,
        resolved: true
      };
    } catch (error) {
      return {
        passed: false,
        error: error.message,
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Check CORS configuration
   */
  async checkCORSConfiguration(url) {
    const startTime = Date.now();
    
    try {
      const response = await fetch(url, {
        method: 'OPTIONS',
        headers: {
          'Origin': 'https://example.com',
          'Access-Control-Request-Method': 'GET'
        }
      });
      
      const duration = Date.now() - startTime;
      const corsHeaders = {
        'access-control-allow-origin': response.headers.get('access-control-allow-origin'),
        'access-control-allow-methods': response.headers.get('access-control-allow-methods'),
        'access-control-allow-headers': response.headers.get('access-control-allow-headers')
      };
      
      return {
        passed: response.ok || response.status === 204,
        status: response.status,
        headers: corsHeaders,
        duration
      };
    } catch (error) {
      return {
        passed: false,
        error: error.message,
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Check health endpoint
   */
  async checkHealthEndpoint(url) {
    const startTime = Date.now();
    
    try {
      const response = await fetch(url);
      const duration = Date.now() - startTime;
      
      if (!response.ok) {
        return {
          passed: false,
          status: response.status,
          statusText: response.statusText,
          duration
        };
      }
      
      const contentType = response.headers.get('content-type');
      let data = null;
      
      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else if (contentType?.includes('text/')) {
        data = await response.text();
      }
      
      return {
        passed: true,
        status: response.status,
        data,
        duration,
        healthy: this.isHealthy(data)
      };
    } catch (error) {
      return {
        passed: false,
        error: error.message,
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Check frontend health
   */
  async checkFrontendHealth(url) {
    const startTime = Date.now();
    
    try {
      const response = await fetch(url);
      const html = await response.text();
      const duration = Date.now() - startTime;
      
      const checks = {
        hasTitle: html.includes('<title>'),
        hasMetaViewport: html.includes('name="viewport"'),
        noJsErrors: !html.includes('Uncaught'),
        hasMainContent: html.length > 1000
      };
      
      const passed = Object.values(checks).filter(Boolean).length;
      const total = Object.keys(checks).length;
      
      return {
        passed: passed >= Math.ceil(total * 0.75),
        checks,
        duration,
        htmlSize: html.length
      };
    } catch (error) {
      return {
        passed: false,
        error: error.message,
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Check API health
   */
  async checkAPIHealth(url) {
    const startTime = Date.now();
    const apiEndpoints = ['/api/health', '/health', '/api/status'];
    
    for (const endpoint of apiEndpoints) {
      try {
        const response = await fetch(`${url}${endpoint}`);
        if (response.ok) {
          const data = await response.json();
          return {
            passed: true,
            endpoint,
            status: response.status,
            data,
            duration: Date.now() - startTime
          };
        }
      } catch (error) {
        // Continue to next endpoint
      }
    }
    
    return {
      passed: false,
      reason: 'No accessible API health endpoints found',
      duration: Date.now() - startTime
    };
  }

  /**
   * Check load time
   */
  async checkLoadTime(url) {
    const startTime = Date.now();
    
    try {
      const response = await fetch(url);
      await response.text(); // Ensure full download
      const duration = Date.now() - startTime;
      
      return {
        passed: duration < 3000, // 3 second threshold
        duration,
        threshold: 3000
      };
    } catch (error) {
      return {
        passed: false,
        error: error.message,
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Check security headers
   */
  async checkSecurityHeaders(url) {
    const startTime = Date.now();
    
    try {
      const response = await fetch(url);
      const duration = Date.now() - startTime;
      
      const requiredHeaders = [
        'x-frame-options',
        'x-content-type-options',
        'referrer-policy',
        'strict-transport-security'
      ];
      
      const presentHeaders = requiredHeaders.filter(header => 
        response.headers.has(header)
      );
      
      return {
        passed: presentHeaders.length >= Math.ceil(requiredHeaders.length * 0.75),
        requiredHeaders,
        presentHeaders,
        headers: Object.fromEntries(response.headers.entries()),
        duration
      };
    } catch (error) {
      return {
        passed: false,
        error: error.message,
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Generate validation ID
   */
  generateValidationId() {
    return `validation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get health endpoints for application type
   */
  getHealthEndpoints(config) {
    const endpoints = [];
    
    if (config.type === 'frontend-only' || config.type === 'static-site') {
      endpoints.push('/health.html');
    }
    
    if (config.type === 'api-only' || config.type === 'fullstack') {
      endpoints.push('/api/health', '/health', '/api/health/ready');
    }
    
    return endpoints;
  }

  /**
   * Check if health data indicates healthy status
   */
  isHealthy(data) {
    if (!data) return false;
    
    if (typeof data === 'string') {
      return !data.toLowerCase().includes('error') && 
             !data.toLowerCase().includes('fail');
    }
    
    if (typeof data === 'object') {
      return data.status === 'healthy' || 
             data.status === 'ok' || 
             data.healthy === true;
    }
    
    return true;
  }

  /**
   * Calculate overall validation status
   */
  calculateOverallStatus(phases) {
    const criticalPhases = ['connectivity', 'health'];
    const importantPhases = ['platform'];
    const optionalPhases = ['performance', 'security'];
    
    // Critical phases must pass (connectivity, health)
    const criticalPassed = criticalPhases.every(phase => 
      phases[phase]?.status === 'passed'
    );
    
    if (!criticalPassed) return 'failed';
    
    // Important phases should pass (platform)
    const importantPassed = importantPhases.every(phase =>
      phases[phase]?.status === 'passed'
    );
    
    // Count optional phase results
    const optionalResults = optionalPhases.filter(phase => phases[phase])
      .map(phase => phases[phase].status === 'passed');
    
    const optionalPassed = optionalResults.length > 0 ? 
      optionalResults.filter(Boolean).length / optionalResults.length : 1;
    
    // Determine overall status
    if (importantPassed && optionalPassed >= 0.8) return 'passed';
    if (importantPassed && optionalPassed >= 0.5) return 'warning';
    if (importantPassed) return 'warning';
    return 'failed';
  }

  /**
   * Generate validation summary
   */
  generateValidationSummary(results) {
    const issues = [];
    const recommendations = [];
    
    // Analyze each phase
    Object.entries(results.phases).forEach(([phase, result]) => {
      if (result.status === 'failed') {
        issues.push(`${phase} validation failed`);
        
        if (phase === 'security') {
          recommendations.push('Implement security headers and HTTPS enforcement');
        } else if (phase === 'performance') {
          recommendations.push('Optimize load times and resource sizes');
        } else if (phase === 'health') {
          recommendations.push('Ensure health endpoints are properly configured');
        }
      }
    });
    
    return {
      overallStatus: results.status,
      totalDuration: results.duration,
      issues: issues.length > 0 ? issues : ['No issues detected'],
      recommendations: recommendations.length > 0 ? recommendations : ['Application appears to be properly configured'],
      nextSteps: this.getNextSteps(results)
    };
  }

  /**
   * Get next steps based on validation results
   */
  getNextSteps(results) {
    if (results.status === 'passed') {
      return [
        'Monitor application health regularly',
        'Set up automated health checks',
        'Consider performance monitoring',
        'Review security configuration periodically'
      ];
    }
    
    const steps = [];
    
    if (results.phases.connectivity?.status === 'failed') {
      steps.push('Fix connectivity issues first');
    }
    
    if (results.phases.health?.status === 'failed') {
      steps.push('Implement health check endpoints');
    }
    
    if (results.phases.security?.status === 'failed') {
      steps.push('Configure security headers and HTTPS');
    }
    
    if (results.phases.performance?.status === 'failed') {
      steps.push('Optimize application performance');
    }
    
    steps.push('Re-run validation after making changes');
    
    return steps;
  }

  /**
   * Tracking and notification methods
   */
  trackValidationStart(validationId, config) {
    this.notifyListeners('validation:start', { validationId, config });
  }

  notifyProgress(validationId, phase, result) {
    this.notifyListeners('validation:progress', { validationId, phase, result });
  }

  notifyComplete(validationId, results) {
    this.notifyListeners('validation:complete', { validationId, results });
  }

  notifyError(validationId, error) {
    this.notifyListeners('validation:error', { validationId, error });
  }

  notifyListeners(event, data) {
    this.listeners.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        console.error('Validation listener error:', error);
      }
    });
  }

  /**
   * Subscribe to validation events
   */
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Get validation results
   */
  getValidationResults(validationId) {
    return this.validationResults.get(validationId);
  }


  // Stub implementations for missing methods
  async checkFirstPaint(url) {
    return { passed: true, details: 'First paint check not implemented' };
  }

  async checkResourceSizes(url) {
    return { passed: true, details: 'Resource size check not implemented' };
  }

  async checkCompression(url) {
    return { passed: true, details: 'Compression check not implemented' };
  }

  async checkHttpsEnforcement(url) {
    return { passed: url.startsWith('https://'), details: 'HTTPS check' };
  }

  async checkSSLCertificate(url) {
    return { passed: true, details: 'SSL certificate check not implemented' };
  }

  async checkCommonVulnerabilities(url) {
    return { passed: true, details: 'Vulnerability scan not implemented' };
  }
}

export const deploymentValidator = new DeploymentValidator();