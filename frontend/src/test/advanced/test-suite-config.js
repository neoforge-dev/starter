/**
 * Advanced Testing Suite Configuration
 *
 * Central configuration for comprehensive testing across all 33 components
 * Includes test runners, thresholds, reporting, and CI/CD integration
 */

// Test suite configuration
export const ADVANCED_TEST_CONFIG = {
  // Test execution settings
  execution: {
    parallel: true,
    maxWorkers: 4,
    timeout: 30000, // 30 seconds per test
    retries: 2, // Retry flaky tests
    bail: false, // Continue running tests after failures
    verbose: true
  },

  // Coverage thresholds
  coverage: {
    global: {
      statements: 85,
      branches: 80,
      functions: 85,
      lines: 85
    },
    perFile: {
      statements: 70,
      branches: 65,
      functions: 70,
      lines: 70
    }
  },

  // Performance thresholds
  performance: {
    rendering: {
      singleComponent: 16.67, // ms - 60fps target
      batchRender: 100, // ms
      complexComponent: 50, // ms
      pageLoad: 2000 // ms - full page load
    },
    memory: {
      componentInstance: 100 * 1024, // 100KB per component
      totalHeap: 50 * 1024 * 1024, // 50MB total heap
      leakDetection: 1024 * 1024 // 1MB leak threshold
    },
    interaction: {
      clickResponse: 16, // ms - one frame
      keyboardResponse: 8, // ms
      formValidation: 100, // ms
      stateChange: 50 // ms
    }
  },

  // Accessibility thresholds (WCAG compliance)
  accessibility: {
    colorContrast: {
      normalAA: 4.5,
      largeAA: 3,
      normalAAA: 7,
      largeAAA: 4.5
    },
    interactionTargets: {
      minimumSize: 44, // px - touch target size
      minimumSpacing: 8 // px - spacing between targets
    },
    timing: {
      focusVisible: 100, // ms - focus indicator delay
      liveRegionUpdate: 200 // ms - screen reader announcement delay
    }
  },

  // Cross-browser compatibility matrix
  browserSupport: {
    required: {
      chrome: '>= 90',
      firefox: '>= 88',
      safari: '>= 14',
      edge: '>= 90'
    },
    optional: {
      ios: '>= 14',
      android: '>= 90',
      samsung: '>= 14'
    },
    polyfills: [
      '@webcomponents/webcomponentsjs',
      'intersection-observer',
      'resize-observer-polyfill'
    ]
  },

  // Test environment settings
  environment: {
    jsdom: {
      url: 'http://localhost:3000',
      pretendToBeVisual: true,
      resources: 'usable'
    },
    playwright: {
      baseURL: 'http://localhost:5173',
      trace: 'retain-on-failure',
      screenshot: 'only-on-failure',
      video: 'retain-on-failure'
    }
  },

  // Component test matrix
  components: {
    atoms: {
      critical: ['button', 'text-input', 'checkbox', 'radio', 'select'],
      standard: ['icon', 'badge', 'spinner', 'progress-bar', 'link'],
      enhanced: ['tooltip', 'dropdown', 'input']
    },
    molecules: {
      critical: ['alert', 'modal', 'toast'],
      standard: ['card', 'tabs', 'breadcrumbs'],
      enhanced: ['phone-input', 'date-picker', 'language-selector']
    },
    organisms: {
      critical: ['form', 'table', 'pagination'],
      standard: ['data-table', 'file-upload', 'form-validation'],
      enhanced: ['neo-table', 'neo-data-grid', 'neo-form-builder', 'charts', 'rich-text-editor']
    }
  },

  // Test categories and priorities
  testCategories: {
    unit: {
      priority: 1,
      timeout: 5000,
      patterns: ['**/*.test.js'],
      exclude: ['**/e2e/**', '**/integration/**']
    },
    integration: {
      priority: 2,
      timeout: 15000,
      patterns: ['**/integration/**/*.test.js'],
      sequential: true
    },
    e2e: {
      priority: 3,
      timeout: 30000,
      patterns: ['**/e2e/**/*.spec.js'],
      sequential: true,
      browser: true
    },
    accessibility: {
      priority: 2,
      timeout: 10000,
      patterns: ['**/accessibility/**/*.test.js'],
      tools: ['@axe-core/playwright']
    },
    performance: {
      priority: 3,
      timeout: 20000,
      patterns: ['**/performance/**/*.test.js'],
      warmup: true
    },
    visual: {
      priority: 4,
      timeout: 25000,
      patterns: ['**/visual/**/*.test.js'],
      updateBaselines: process.env.UPDATE_VISUALS === 'true'
    }
  },

  // Reporting configuration
  reporting: {
    formats: ['html', 'json', 'lcov', 'text'],
    outputDir: 'test-results',
    includeMetrics: {
      performance: true,
      accessibility: true,
      coverage: true,
      browserCompatibility: true
    },
    thresholdFailures: true, // Fail CI if thresholds not met
    trending: {
      enabled: true,
      historyLimit: 10
    }
  },

  // CI/CD integration
  ci: {
    collectMetrics: true,
    failFast: false,
    parallelJobs: 3,
    artifactRetention: '30d',
    notifications: {
      slack: process.env.SLACK_WEBHOOK,
      email: process.env.CI_EMAIL,
      github: true
    }
  },

  // Development workflow integration
  development: {
    watchMode: {
      testPattern: '**/*.test.js',
      ignorePattern: ['**/node_modules/**', '**/dist/**'],
      runOnSave: true,
      clearConsole: true
    },
    debugging: {
      sourceMaps: true,
      inspectBrk: false,
      verbose: true,
      logLevel: 'info'
    }
  }
};

// Test suite metadata
export const TEST_SUITE_METADATA = {
  name: 'NeoForge Advanced Testing Suite',
  version: '1.0.0',
  description: 'Comprehensive testing framework for 33 playground components',
  author: 'NeoForge Development Team',
  created: '2024-01-01',
  lastUpdated: new Date().toISOString(),

  // Component coverage tracking
  componentCoverage: {
    totalComponents: 33,
    testedComponents: 33,
    coveragePercentage: 100,
    breakdown: {
      atoms: { total: 13, tested: 13 },
      molecules: { total: 9, tested: 9 },
      organisms: { total: 11, tested: 11 }
    }
  },

  // Test type coverage
  testTypeCoverage: {
    unit: true,
    integration: true,
    e2e: true,
    accessibility: true,
    performance: true,
    crossBrowser: true,
    visual: true
  },

  // Quality metrics targets
  qualityTargets: {
    testCoverage: 85, // % code coverage
    bugEscapeRate: 5, // % bugs found in production
    testExecutionTime: 300, // seconds - full suite
    flakiness: 2, // % flaky tests
    maintenanceScore: 90 // % test maintainability
  }
};

// Utility functions for test configuration
export class TestConfigManager {
  static getComponentConfig(category, componentName) {
    const categoryConfig = ADVANCED_TEST_CONFIG.components[category];
    if (!categoryConfig) {
      throw new Error(`Unknown component category: ${category}`);
    }

    // Find component tier (critical, standard, enhanced)
    let tier = 'standard';
    for (const [tierName, components] of Object.entries(categoryConfig)) {
      if (components.includes(componentName)) {
        tier = tierName;
        break;
      }
    }

    return {
      category,
      tier,
      timeout: tier === 'critical' ? 10000 : tier === 'enhanced' ? 20000 : 15000,
      retries: tier === 'critical' ? 3 : 2,
      priority: tier === 'critical' ? 1 : tier === 'enhanced' ? 3 : 2
    };
  }

  static getPerformanceThresholds(testType, componentTier = 'standard') {
    const baseThresholds = ADVANCED_TEST_CONFIG.performance[testType];
    if (!baseThresholds) {
      throw new Error(`Unknown performance test type: ${testType}`);
    }

    // Adjust thresholds based on component tier
    const multipliers = {
      critical: 0.8, // Stricter requirements
      standard: 1.0, // Normal requirements
      enhanced: 1.5  // More relaxed requirements
    };

    const multiplier = multipliers[componentTier] || 1.0;

    if (typeof baseThresholds === 'object') {
      return Object.entries(baseThresholds).reduce((acc, [key, value]) => {
        acc[key] = value * multiplier;
        return acc;
      }, {});
    } else {
      return baseThresholds * multiplier;
    }
  }

  static getBrowserTestMatrix(componentName) {
    const config = this.getComponentConfig('atoms', componentName) ||
                  this.getComponentConfig('molecules', componentName) ||
                  this.getComponentConfig('organisms', componentName);

    const browsers = ['chrome', 'firefox', 'safari', 'edge'];

    if (config.tier === 'critical') {
      return browsers; // Test on all browsers
    } else if (config.tier === 'enhanced') {
      return ['chrome', 'firefox']; // Test on modern browsers only
    } else {
      return ['chrome', 'firefox', 'safari']; // Standard browser set
    }
  }

  static generateTestSuiteReport() {
    const executionDate = new Date().toISOString();

    return {
      metadata: TEST_SUITE_METADATA,
      configuration: ADVANCED_TEST_CONFIG,
      execution: {
        date: executionDate,
        environment: process.env.NODE_ENV || 'test',
        nodeVersion: process.version,
        platform: process.platform
      },
      summary: {
        totalTests: 0, // Will be populated during test run
        passed: 0,
        failed: 0,
        skipped: 0,
        duration: 0,
        coverage: 0
      }
    };
  }

  static validateConfiguration() {
    const errors = [];

    // Validate component counts
    const configuredComponents = Object.values(ADVANCED_TEST_CONFIG.components)
      .flatMap(category => Object.values(category))
      .flat();

    if (configuredComponents.length !== TEST_SUITE_METADATA.componentCoverage.totalComponents) {
      errors.push('Component count mismatch between configuration and metadata');
    }

    // Validate thresholds
    if (ADVANCED_TEST_CONFIG.coverage.global.statements < 70) {
      errors.push('Coverage threshold too low for production readiness');
    }

    // Validate performance thresholds
    if (ADVANCED_TEST_CONFIG.performance.rendering.singleComponent > 20) {
      errors.push('Rendering performance threshold too high for 60fps target');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// Export default configuration
export default ADVANCED_TEST_CONFIG;
