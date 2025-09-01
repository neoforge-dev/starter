/**
 * Health Check Templates for Generated Applications
 *
 * Provides reusable health check templates that get embedded into generated applications
 * to ensure proper deployment validation and monitoring readiness.
 */

export class HealthCheckTemplates {
  constructor() {
    this.templates = this.initializeTemplates();
  }

  /**
   * Get health check template for specific application type
   */
  getTemplate(appType, config = {}) {
    const template = this.templates[appType];
    if (!template) {
      throw new Error(`No health check template available for: ${appType}`);
    }

    return {
      ...template,
      config: { ...template.config, ...config }
    };
  }

  /**
   * Generate complete health check system for application
   */
  generateHealthCheckSystem(appConfig) {
    const template = this.getTemplate(appConfig.type, appConfig.healthConfig);

    return {
      files: this.generateHealthCheckFiles(template, appConfig),
      endpoints: template.config.endpoints || [],
      middleware: [],
      monitoring: this.generateMonitoringConfig(template, appConfig),
      validation: this.generateValidationRules(template, appConfig)
    };
  }

  /**
   * Generate health check files for different app types
   */
  generateHealthCheckFiles(template, appConfig) {
    const files = [];

    // Frontend health check
    if (template.frontend) {
      files.push({
        path: 'public/health.html',
        content: this.generateFrontendHealthCheck(appConfig)
      });

      files.push({
        path: 'src/utils/health-monitor.js',
        content: this.generateFrontendHealthMonitor(appConfig)
      });
    }

    // Backend health check
    if (template.backend) {
      files.push({
        path: 'src/routes/health.js',
        content: this.generateBackendHealthRoute(appConfig)
      });

      files.push({
        path: 'src/middleware/health-middleware.js',
        content: this.generateBackendHealthMiddleware(appConfig)
      });
    }

    // Universal monitoring
    files.push({
      path: 'monitoring/health-config.json',
      content: this.generateMonitoringConfig(template, appConfig)
    });

    // Docker health check (if containerized)
    if (appConfig.deployment?.docker) {
      files.push({
        path: 'Dockerfile.healthcheck',
        content: this.generateDockerHealthCheck(appConfig)
      });
    }

    return files;
  }

  /**
   * Generate frontend health check HTML
   */
  generateFrontendHealthCheck(appConfig) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Health Check - ${appConfig.name}</title>
    <style>
        body { font-family: system-ui, sans-serif; padding: 2rem; max-width: 800px; margin: 0 auto; }
        .status { padding: 1rem; border-radius: 8px; margin: 1rem 0; }
        .healthy { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        .unhealthy { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
        .loading { background: #fff3cd; color: #856404; border: 1px solid #ffeaa7; }
        .metric { display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid #eee; }
        .metric:last-child { border-bottom: none; }
        .metric-label { font-weight: 600; }
        .metric-value { font-family: monospace; }
        .timestamp { font-size: 0.875rem; color: #666; margin-top: 1rem; }
    </style>
</head>
<body>
    <h1>Application Health Check</h1>
    <div id="health-status" class="status loading">
        <strong>Status:</strong> Checking...
    </div>

    <div id="health-details">
        <h2>System Metrics</h2>
        <div id="metrics-container"></div>
    </div>

    <div class="timestamp">
        Last checked: <span id="last-check">Loading...</span>
    </div>

    <script>
        class HealthMonitor {
            constructor() {
                this.checks = {
                    dom: this.checkDOMReady.bind(this),
                    scripts: this.checkScriptsLoaded.bind(this),
                    styles: this.checkStylesLoaded.bind(this),
                    api: this.checkAPIConnectivity.bind(this),
                    localStorage: this.checkLocalStorage.bind(this),
                    performance: this.checkPerformance.bind(this)
                };
                this.results = {};
            }

            async runHealthChecks() {
                const startTime = Date.now();

                for (const [name, check] of Object.entries(this.checks)) {
                    try {
                        this.results[name] = await check();
                    } catch (error) {
                        this.results[name] = {
                            status: 'unhealthy',
                            error: error.message,
                            timestamp: new Date().toISOString()
                        };
                    }
                }

                this.results.totalCheckTime = Date.now() - startTime;
                this.updateDisplay();
                return this.results;
            }

            checkDOMReady() {
                return {
                    status: document.readyState === 'complete' ? 'healthy' : 'unhealthy',
                    value: document.readyState,
                    timestamp: new Date().toISOString()
                };
            }

            checkScriptsLoaded() {
                const scripts = document.scripts.length;
                const errors = document.querySelectorAll('script[data-error]').length;
                return {
                    status: errors === 0 ? 'healthy' : 'unhealthy',
                    value: \`\${scripts - errors}/\${scripts} loaded\`,
                    timestamp: new Date().toISOString()
                };
            }

            checkStylesLoaded() {
                const styles = document.styleSheets.length;
                return {
                    status: styles > 0 ? 'healthy' : 'unhealthy',
                    value: \`\${styles} stylesheets loaded\`,
                    timestamp: new Date().toISOString()
                };
            }

            async checkAPIConnectivity() {
                if (!window.API_BASE_URL && !window.location.pathname.includes('/api/')) {
                    return {
                        status: 'healthy',
                        value: 'No API configured (frontend-only)',
                        timestamp: new Date().toISOString()
                    };
                }

                try {
                    const response = await fetch('/api/health', {
                        method: 'GET',
                        timeout: 5000
                    });
                    return {
                        status: response.ok ? 'healthy' : 'unhealthy',
                        value: \`HTTP \${response.status}\`,
                        timestamp: new Date().toISOString()
                    };
                } catch (error) {
                    return {
                        status: 'unhealthy',
                        value: error.message,
                        timestamp: new Date().toISOString()
                    };
                }
            }

            checkLocalStorage() {
                try {
                    localStorage.setItem('health-test', 'test');
                    localStorage.removeItem('health-test');
                    return {
                        status: 'healthy',
                        value: 'Available',
                        timestamp: new Date().toISOString()
                    };
                } catch (error) {
                    return {
                        status: 'unhealthy',
                        value: 'Unavailable',
                        timestamp: new Date().toISOString()
                    };
                }
            }

            checkPerformance() {
                const timing = performance.timing;
                const loadTime = timing.loadEventEnd - timing.navigationStart;

                return {
                    status: loadTime < 3000 ? 'healthy' : 'unhealthy',
                    value: \`\${loadTime}ms load time\`,
                    timestamp: new Date().toISOString()
                };
            }

            updateDisplay() {
                const statusEl = document.getElementById('health-status');
                const metricsEl = document.getElementById('metrics-container');
                const timestampEl = document.getElementById('last-check');

                const overallHealth = this.getOverallHealth();
                statusEl.className = \`status \${overallHealth}\`;
                statusEl.innerHTML = \`<strong>Status:</strong> \${overallHealth.charAt(0).toUpperCase() + overallHealth.slice(1)}\`;

                metricsEl.innerHTML = Object.entries(this.results)
                    .filter(([key]) => key !== 'totalCheckTime')
                    .map(([key, result]) => \`
                        <div class="metric">
                            <span class="metric-label">\${key.charAt(0).toUpperCase() + key.slice(1)}:</span>
                            <span class="metric-value \${result.status}">\${result.value || result.status}</span>
                        </div>
                    \`).join('');

                timestampEl.textContent = new Date().toLocaleString();
            }

            getOverallHealth() {
                const statuses = Object.values(this.results)
                    .filter(result => result && result.status)
                    .map(result => result.status);

                if (statuses.includes('unhealthy')) return 'unhealthy';
                if (statuses.every(status => status === 'healthy')) return 'healthy';
                return 'loading';
            }
        }

        // Initialize and run health checks
        const monitor = new HealthMonitor();

        document.addEventListener('DOMContentLoaded', () => {
            monitor.runHealthChecks();

            // Re-run checks every 30 seconds
            setInterval(() => {
                monitor.runHealthChecks();
            }, 30000);
        });

        // Expose for external monitoring
        window.healthMonitor = monitor;
    </script>
</body>
</html>`;
  }

  /**
   * Generate frontend health monitoring utility
   */
  generateFrontendHealthMonitor(appConfig) {
    return `/**
 * Frontend Health Monitor
 * Embedded health monitoring for ${appConfig.name}
 */

export class HealthMonitor {
  constructor(config = {}) {
    this.config = {
      checkInterval: 60000, // 1 minute
      apiTimeout: 5000,
      performanceThreshold: 3000,
      ...config
    };

    this.checks = new Map();
    this.results = new Map();
    this.listeners = new Set();

    this.setupDefaultChecks();
    this.startMonitoring();
  }

  /**
   * Add custom health check
   */
  addCheck(name, checkFunction) {
    this.checks.set(name, checkFunction);
  }

  /**
   * Remove health check
   */
  removeCheck(name) {
    this.checks.delete(name);
  }

  /**
   * Subscribe to health status updates
   */
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Run all health checks
   */
  async runHealthChecks() {
    const results = new Map();
    const startTime = Date.now();

    for (const [name, check] of this.checks) {
      try {
        const result = await Promise.race([
          check(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Check timeout')), this.config.apiTimeout)
          )
        ]);

        results.set(name, {
          status: 'healthy',
          ...result,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        results.set(name, {
          status: 'unhealthy',
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }

    results.set('_meta', {
      totalCheckTime: Date.now() - startTime,
      timestamp: new Date().toISOString()
    });

    this.results = results;
    this.notifyListeners();

    return this.getHealthSummary();
  }

  /**
   * Get current health status
   */
  getHealthSummary() {
    const checks = Array.from(this.results.entries())
      .filter(([key]) => key !== '_meta');

    const healthy = checks.filter(([, result]) => result.status === 'healthy').length;
    const total = checks.length;

    return {
      status: healthy === total ? 'healthy' : 'unhealthy',
      healthy,
      total,
      checks: Object.fromEntries(this.results),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Setup default health checks
   */
  setupDefaultChecks() {
    // DOM readiness check
    this.addCheck('dom', () => ({
      value: document.readyState,
      healthy: document.readyState === 'complete'
    }));

    // Performance check
    this.addCheck('performance', () => {
      const timing = performance.timing;
      const loadTime = timing.loadEventEnd - timing.navigationStart;

      return {
        value: \`\${loadTime}ms\`,
        healthy: loadTime < this.config.performanceThreshold
      };
    });

    // Local storage check
    this.addCheck('localStorage', () => {
      try {
        const testKey = '__health_test_\${Date.now()}';
        localStorage.setItem(testKey, 'test');
        localStorage.removeItem(testKey);
        return { value: 'available', healthy: true };
      } catch (error) {
        return { value: 'unavailable', healthy: false };
      }
    });

    // Console errors check
    this.addCheck('console', () => {
      const errorCount = (window.__consoleErrors || []).length;
      return {
        value: \`\${errorCount} errors\`,
        healthy: errorCount === 0
      };
    });

    // Network connectivity check
    this.addCheck('network', async () => {
      if (!navigator.onLine) {
        return { value: 'offline', healthy: false };
      }

      try {
        await fetch('/health.html', { method: 'HEAD', cache: 'no-cache' });
        return { value: 'online', healthy: true };
      } catch (error) {
        return { value: 'connection_failed', healthy: false };
      }
    });

    // Memory usage check (if available)
    this.addCheck('memory', () => {
      if (!performance.memory) {
        return { value: 'unavailable', healthy: true };
      }

      const used = performance.memory.usedJSHeapSize;
      const limit = performance.memory.jsHeapSizeLimit;
      const percentage = Math.round((used / limit) * 100);

      return {
        value: \`\${percentage}% used\`,
        healthy: percentage < 90
      };
    });
  }

  /**
   * Start monitoring
   */
  startMonitoring() {
    // Initial check
    this.runHealthChecks();

    // Periodic checks
    this.intervalId = setInterval(() => {
      this.runHealthChecks();
    }, this.config.checkInterval);

    // Monitor console errors
    this.setupConsoleMonitoring();

    // Monitor page visibility
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.runHealthChecks();
      }
    });
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  /**
   * Setup console error monitoring
   */
  setupConsoleMonitoring() {
    if (!window.__consoleErrors) {
      window.__consoleErrors = [];
    }

    const originalError = console.error;
    console.error = (...args) => {
      window.__consoleErrors.push({
        message: args.join(' '),
        timestamp: new Date().toISOString()
      });

      // Keep only last 10 errors
      if (window.__consoleErrors.length > 10) {
        window.__consoleErrors = window.__consoleErrors.slice(-10);
      }

      originalError.apply(console, args);
    };
  }

  /**
   * Notify all listeners
   */
  notifyListeners() {
    const summary = this.getHealthSummary();
    this.listeners.forEach(callback => {
      try {
        callback(summary);
      } catch (error) {
        console.error('Health monitor listener error:', error);
      }
    });
  }

  /**
   * Export health data for external monitoring
   */
  exportHealthData() {
    return {
      app: '${appConfig.name}',
      version: '${appConfig.version || '1.0.0'}',
      timestamp: new Date().toISOString(),
      health: this.getHealthSummary(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };
  }
}

// Global instance
export const healthMonitor = new HealthMonitor();

// Expose for debugging
if (typeof window !== 'undefined') {
  window.healthMonitor = healthMonitor;
}`;
  }

  /**
   * Generate backend health route
   */
  generateBackendHealthRoute(appConfig) {
    const isExpress = appConfig.backend?.framework === 'express';
    const isFastAPI = appConfig.backend?.framework === 'fastapi';

    if (isFastAPI) {
      return `"""
Health check endpoints for ${appConfig.name}
"""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime
import psutil
import asyncio
from typing import Dict, Any
from ..core.database import get_db
from ..core.redis import get_redis
import aioredis
import sqlalchemy

router = APIRouter(prefix="/health", tags=["health"])

@router.get("/")
async def health_check():
    """Basic health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "${appConfig.name}",
        "version": "${appConfig.version || '1.0.0'}"
    }

@router.get("/detailed")
async def detailed_health_check(db = Depends(get_db), redis = Depends(get_redis)):
    """Detailed health check with all dependencies"""
    checks = {}
    overall_status = "healthy"

    # Database check
    try:
        await db.execute("SELECT 1")
        checks["database"] = {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        checks["database"] = {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }
        overall_status = "unhealthy"

    # Redis check
    try:
        await redis.ping()
        checks["redis"] = {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        checks["redis"] = {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }
        overall_status = "unhealthy"

    # System resources
    try:
        cpu_percent = psutil.cpu_percent()
        memory = psutil.virtual_memory()

        checks["system"] = {
            "status": "healthy" if cpu_percent < 80 and memory.percent < 85 else "degraded",
            "cpu_percent": cpu_percent,
            "memory_percent": memory.percent,
            "timestamp": datetime.utcnow().isoformat()
        }

        if checks["system"]["status"] == "degraded":
            overall_status = "degraded"

    except Exception as e:
        checks["system"] = {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }
        overall_status = "unhealthy"

    return {
        "status": overall_status,
        "timestamp": datetime.utcnow().isoformat(),
        "service": "${appConfig.name}",
        "version": "${appConfig.version || '1.0.0'}",
        "checks": checks
    }

@router.get("/ready")
async def readiness_check(db = Depends(get_db), redis = Depends(get_redis)):
    """Kubernetes readiness probe endpoint"""
    try:
        # Check database connection
        await db.execute("SELECT 1")

        # Check Redis connection
        await redis.ping()

        return {"status": "ready"}
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Service not ready: {str(e)}")

@router.get("/live")
async def liveness_check():
    """Kubernetes liveness probe endpoint"""
    return {"status": "alive"}
`;
    }

    return `/**
 * Health check routes for ${appConfig.name}
 */
const express = require('express');
const router = express.Router();

// Basic health check
router.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: '${appConfig.name}',
    version: '${appConfig.version || '1.0.0'}'
  });
});

// Detailed health check
router.get('/detailed', async (req, res) => {
  const checks = {};
  let overallStatus = 'healthy';

  // Database check
  try {
    if (req.db) {
      await req.db.raw('SELECT 1');
      checks.database = {
        status: 'healthy',
        timestamp: new Date().toISOString()
      };
    }
  } catch (error) {
    checks.database = {
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    };
    overallStatus = 'unhealthy';
  }

  // Redis check
  try {
    if (req.redis) {
      await req.redis.ping();
      checks.redis = {
        status: 'healthy',
        timestamp: new Date().toISOString()
      };
    }
  } catch (error) {
    checks.redis = {
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    };
    overallStatus = 'unhealthy';
  }

  // Memory check
  const memUsage = process.memoryUsage();
  const memUsageMB = Math.round(memUsage.rss / 1024 / 1024);
  checks.memory = {
    status: memUsageMB < 512 ? 'healthy' : 'degraded',
    usage_mb: memUsageMB,
    timestamp: new Date().toISOString()
  };

  if (checks.memory.status === 'degraded' && overallStatus === 'healthy') {
    overallStatus = 'degraded';
  }

  res.json({
    status: overallStatus,
    timestamp: new Date().toISOString(),
    service: '${appConfig.name}',
    version: '${appConfig.version || '1.0.0'}',
    checks
  });
});

// Kubernetes readiness probe
router.get('/ready', async (req, res) => {
  try {
    // Check critical dependencies
    if (req.db) {
      await req.db.raw('SELECT 1');
    }

    if (req.redis) {
      await req.redis.ping();
    }

    res.json({ status: 'ready' });
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      error: error.message
    });
  }
});

// Kubernetes liveness probe
router.get('/live', (req, res) => {
  res.json({ status: 'alive' });
});

module.exports = router;`;
  }

  /**
   * Generate backend health middleware
   */
  generateBackendHealthMiddleware(appConfig) {
    const isExpress = appConfig.backend?.framework === 'express';
    const isFastAPI = appConfig.backend?.framework === 'fastapi';

    if (isFastAPI) {
      return `"""
Health monitoring middleware for ${appConfig.name}
"""
from fastapi import Request, Response
from datetime import datetime
import time
import psutil

class HealthMiddleware:
    def __init__(self, app):
        self.app = app
        self.start_time = datetime.utcnow()

    async def __call__(self, request: Request, call_next):
        start_time = time.time()

        # Process request
        response = await call_next(request)

        # Add health headers
        process_time = time.time() - start_time
        response.headers["X-Process-Time"] = str(process_time)
        response.headers["X-Service-Name"] = "${appConfig.name}"
        response.headers["X-Service-Version"] = "${appConfig.version || '1.0.0'}"

        # Add system health indicators
        if request.url.path.startswith('/health'):
            memory_usage = psutil.virtual_memory().percent
            cpu_usage = psutil.cpu_percent()

            response.headers["X-Memory-Usage"] = str(memory_usage)
            response.headers["X-CPU-Usage"] = str(cpu_usage)
            response.headers["X-Uptime"] = str((datetime.utcnow() - self.start_time).total_seconds())

        return response
`;
    }

    return `/**
 * Health monitoring middleware for ${appConfig.name}
 */

const startTime = Date.now();

const healthMiddleware = (req, res, next) => {
  // Add health headers to all responses
  res.set('X-Service-Name', '${appConfig.name}');
  res.set('X-Service-Version', '${appConfig.version || '1.0.0'}');
  res.set('X-Request-ID', req.id || 'unknown');

  // Add timing
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    res.set('X-Response-Time', \`\${duration}ms\`);
  });

  // Add system health for health endpoints
  if (req.path.startsWith('/health') || req.path.startsWith('/api/health')) {
    const memUsage = process.memoryUsage();
    const uptime = Date.now() - startTime;

    res.set('X-Memory-Usage', Math.round(memUsage.rss / 1024 / 1024) + 'MB');
    res.set('X-Uptime', Math.round(uptime / 1000) + 's');
    res.set('X-Node-Version', process.version);
  }

  next();
};

module.exports = healthMiddleware;`;
  }

  /**
   * Initialize health check templates
   */
  initializeTemplates() {
    return {
      'frontend-only': {
        frontend: true,
        backend: false,
        config: {
          endpoints: ['/health.html'],
          checks: ['dom', 'performance', 'localStorage', 'console', 'network']
        }
      },
      'fullstack': {
        frontend: true,
        backend: true,
        config: {
          endpoints: ['/health.html', '/api/health', '/api/health/ready', '/api/health/live'],
          checks: ['dom', 'performance', 'api', 'database', 'localStorage']
        }
      },
      'api-only': {
        frontend: false,
        backend: true,
        config: {
          endpoints: ['/health', '/health/ready', '/health/live'],
          checks: ['database', 'redis', 'system', 'memory']
        }
      },
      'static-site': {
        frontend: true,
        backend: false,
        config: {
          endpoints: ['/health.html'],
          checks: ['dom', 'performance', 'network', 'localStorage']
        }
      }
    };
  }

  /**
   * Generate Docker health check
   */
  generateDockerHealthCheck(appConfig) {
    return `# Health check configuration for ${appConfig.name}
FROM alpine:latest

# Install curl for health checks
RUN apk add --no-cache curl

# Copy health check script
COPY docker-health-check.sh /usr/local/bin/health-check
RUN chmod +x /usr/local/bin/health-check

# Set health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \\
  CMD /usr/local/bin/health-check

# Health check script
cat > /usr/local/bin/health-check << 'EOF'
#!/bin/sh
set -e

# Check if the application is responding
if [ "${appConfig.type}" = "frontend-only" ]; then
  curl -f http://localhost:${appConfig.port || 3000}/health.html || exit 1
else
  curl -f http://localhost:${appConfig.port || 8000}/health || exit 1
fi

# Check if all required services are healthy
if [ "${appConfig.type}" = "fullstack" ]; then
  curl -f http://localhost:${appConfig.port || 8000}/health/ready || exit 1
fi

echo "Health check passed"
exit 0
EOF`;
  }

  /**
   * Generate monitoring configuration
   */
  generateMonitoringConfig(template, appConfig) {
    const config = {
      service: appConfig.name,
      version: appConfig.version || '1.0.0',
      endpoints: template.config.endpoints,
      checks: template.config.checks,
      thresholds: {
        responseTime: 5000,
        errorRate: 0.05,
        availability: 0.99
      },
      alerts: {
        channels: ['email', 'slack'],
        severity: {
          critical: ['service_down', 'database_down'],
          warning: ['high_response_time', 'high_error_rate'],
          info: ['deployment_complete', 'health_check_restored']
        }
      },
      deployment: {
        platform: appConfig.deployment?.platform || 'unknown',
        environment: appConfig.environment || 'production',
        healthCheckUrl: this.getHealthCheckUrl(appConfig),
        validationRules: this.generateValidationRules(template, appConfig)
      }
    };

    return JSON.stringify(config, null, 2);
  }

  /**
   * Get health check URL for platform
   */
  getHealthCheckUrl(appConfig) {
    const baseUrl = appConfig.deployment?.url || 'https://your-app.com';
    const healthEndpoint = appConfig.type === 'frontend-only' ? '/health.html' : '/api/health';
    return `${baseUrl}${healthEndpoint}`;
  }

  /**
   * Generate validation rules
   */
  generateValidationRules(template, appConfig) {
    return {
      required: template.config.checks,
      thresholds: {
        loadTime: 3000,
        memoryUsage: 512,
        cpuUsage: 80
      },
      dependencies: this.getDependencyValidation(appConfig)
    };
  }

  /**
   * Get dependency validation rules
   */
  getDependencyValidation(appConfig) {
    const rules = {};

    if (appConfig.database) {
      rules.database = {
        type: appConfig.database,
        required: true,
        healthCheck: 'SELECT 1'
      };
    }

    if (appConfig.redis) {
      rules.redis = {
        required: true,
        healthCheck: 'PING'
      };
    }

    return rules;
  }
}

export const healthCheckTemplates = new HealthCheckTemplates();
