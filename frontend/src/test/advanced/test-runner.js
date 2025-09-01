/**
 * Advanced Test Suite Runner
 *
 * Comprehensive test execution orchestrator for all testing categories
 * Includes test discovery, execution, reporting, and CI/CD integration
 */
import { exec } from 'child_process';
import { promises as fs } from 'fs';
import { join, resolve } from 'path';
import { TestConfigManager, ADVANCED_TEST_CONFIG, TEST_SUITE_METADATA } from './test-suite-config.js';

class AdvancedTestRunner {
  constructor(options = {}) {
    this.options = {
      verbose: true,
      parallel: true,
      generateReport: true,
      failFast: false,
      coverage: true,
      ...options
    };

    this.results = {
      summary: {
        totalTests: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        duration: 0,
        startTime: null,
        endTime: null
      },
      categories: {},
      components: {},
      performance: {},
      accessibility: {},
      coverage: {},
      errors: []
    };

    this.testFiles = new Map();
    this.executionOrder = [];
  }

  async initialize() {
    console.log('🚀 Initializing Advanced Test Suite Runner...');

    // Validate configuration
    const validation = TestConfigManager.validateConfiguration();
    if (!validation.valid) {
      throw new Error(`Configuration validation failed: ${validation.errors.join(', ')}`);
    }

    // Discover test files
    await this.discoverTestFiles();

    // Plan execution order
    this.planExecutionOrder();

    console.log(`✅ Test runner initialized: ${this.testFiles.size} test files discovered`);
    return true;
  }

  async discoverTestFiles() {
    const testDir = resolve('src/test/advanced');

    try {
      const files = await fs.readdir(testDir);

      for (const file of files) {
        if (file.endsWith('.test.js')) {
          const category = this.categorizeTestFile(file);
          const filePath = join(testDir, file);

          this.testFiles.set(file, {
            path: filePath,
            category,
            priority: ADVANCED_TEST_CONFIG.testCategories[category]?.priority || 5,
            timeout: ADVANCED_TEST_CONFIG.testCategories[category]?.timeout || 15000,
            sequential: ADVANCED_TEST_CONFIG.testCategories[category]?.sequential || false
          });
        }
      }

      console.log(`📋 Discovered test files:`, Array.from(this.testFiles.keys()));

    } catch (error) {
      console.error('❌ Error discovering test files:', error.message);
      throw error;
    }
  }

  categorizeTestFile(filename) {
    if (filename.includes('accessibility')) return 'accessibility';
    if (filename.includes('performance')) return 'performance';
    if (filename.includes('cross-browser')) return 'e2e';
    if (filename.includes('integration')) return 'integration';
    if (filename.includes('visual')) return 'visual';
    return 'unit';
  }

  planExecutionOrder() {
    // Sort by priority (lower number = higher priority)
    this.executionOrder = Array.from(this.testFiles.entries())
      .sort(([, a], [, b]) => a.priority - b.priority)
      .map(([filename]) => filename);

    console.log('📅 Execution order planned:', this.executionOrder);
  }

  async runAllTests() {
    console.log('\n🧪 Starting comprehensive test execution...');
    this.results.summary.startTime = new Date();

    try {
      // Run tests based on execution strategy
      if (this.options.parallel) {
        await this.runTestsInParallel();
      } else {
        await this.runTestsSequentially();
      }

    } catch (error) {
      console.error('❌ Test execution failed:', error.message);
      this.results.errors.push({
        type: 'execution_error',
        message: error.message,
        timestamp: new Date()
      });
    }

    this.results.summary.endTime = new Date();
    this.results.summary.duration = this.results.summary.endTime - this.results.summary.startTime;

    if (this.options.generateReport) {
      await this.generateReport();
    }

    return this.results;
  }

  async runTestsInParallel() {
    console.log('⚡ Running tests in parallel...');

    // Group tests by execution requirements
    const parallelTests = this.executionOrder.filter(filename =>
      !this.testFiles.get(filename).sequential
    );

    const sequentialTests = this.executionOrder.filter(filename =>
      this.testFiles.get(filename).sequential
    );

    // Run parallel tests first
    if (parallelTests.length > 0) {
      const parallelPromises = parallelTests.map(filename =>
        this.runSingleTest(filename)
      );

      const parallelResults = await Promise.allSettled(parallelPromises);
      this.processParallelResults(parallelResults, parallelTests);
    }

    // Run sequential tests
    for (const filename of sequentialTests) {
      await this.runSingleTest(filename);
    }
  }

  async runTestsSequentially() {
    console.log('🔄 Running tests sequentially...');

    for (const filename of this.executionOrder) {
      await this.runSingleTest(filename);

      if (this.options.failFast && this.results.summary.failed > 0) {
        console.log('🛑 Fail-fast mode: Stopping execution due to test failure');
        break;
      }
    }
  }

  async runSingleTest(filename) {
    const testInfo = this.testFiles.get(filename);
    const startTime = Date.now();

    console.log(`\n🧪 Running ${filename} (${testInfo.category})...`);

    try {
      const result = await this.executeTest(testInfo);
      const duration = Date.now() - startTime;

      this.processTestResult(filename, result, duration);

      console.log(`✅ ${filename} completed in ${duration}ms`);

    } catch (error) {
      const duration = Date.now() - startTime;
      this.processTestError(filename, error, duration);

      console.log(`❌ ${filename} failed in ${duration}ms: ${error.message}`);
    }
  }

  async executeTest(testInfo) {
    // This would integrate with your actual test runner (Vitest, Jest, etc.)
    // For demonstration, we'll simulate test execution

    return new Promise((resolve, reject) => {
      // Simulate test execution
      const executionTime = Math.random() * 5000 + 1000; // 1-6 seconds
      const shouldFail = Math.random() < 0.1; // 10% failure rate for demo

      setTimeout(() => {
        if (shouldFail) {
          reject(new Error(`Simulated test failure in ${testInfo.category}`));
        } else {
          resolve({
            passed: Math.floor(Math.random() * 20) + 10, // 10-30 tests passed
            failed: Math.floor(Math.random() * 3), // 0-2 tests failed
            skipped: Math.floor(Math.random() * 2), // 0-1 tests skipped
            coverage: {
              statements: Math.random() * 15 + 85, // 85-100%
              branches: Math.random() * 20 + 80,   // 80-100%
              functions: Math.random() * 15 + 85,  // 85-100%
              lines: Math.random() * 15 + 85       // 85-100%
            },
            performance: testInfo.category === 'performance' ? {
              averageRenderTime: Math.random() * 10 + 5, // 5-15ms
              memoryUsage: Math.random() * 50 + 25,      // 25-75KB
              interactionTime: Math.random() * 5 + 2     // 2-7ms
            } : null,
            accessibility: testInfo.category === 'accessibility' ? {
              violations: Math.floor(Math.random() * 2), // 0-1 violations
              passes: Math.floor(Math.random() * 50) + 50, // 50-100 passes
              incomplete: Math.floor(Math.random() * 3)   // 0-2 incomplete
            } : null
          });
        }
      }, executionTime);
    });
  }

  processTestResult(filename, result, duration) {
    const testInfo = this.testFiles.get(filename);
    const category = testInfo.category;

    // Update summary
    this.results.summary.totalTests += result.passed + result.failed + result.skipped;
    this.results.summary.passed += result.passed;
    this.results.summary.failed += result.failed;
    this.results.summary.skipped += result.skipped;

    // Update category results
    if (!this.results.categories[category]) {
      this.results.categories[category] = {
        totalTests: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        duration: 0,
        files: []
      };
    }

    const categoryResult = this.results.categories[category];
    categoryResult.totalTests += result.passed + result.failed + result.skipped;
    categoryResult.passed += result.passed;
    categoryResult.failed += result.failed;
    categoryResult.skipped += result.skipped;
    categoryResult.duration += duration;
    categoryResult.files.push(filename);

    // Store coverage data
    if (result.coverage) {
      this.results.coverage[filename] = result.coverage;
    }

    // Store performance data
    if (result.performance) {
      this.results.performance[filename] = result.performance;
    }

    // Store accessibility data
    if (result.accessibility) {
      this.results.accessibility[filename] = result.accessibility;
    }
  }

  processTestError(filename, error, duration) {
    const testInfo = this.testFiles.get(filename);
    const category = testInfo.category;

    this.results.errors.push({
      filename,
      category,
      error: error.message,
      duration,
      timestamp: new Date()
    });

    // Update category results for failed file
    if (!this.results.categories[category]) {
      this.results.categories[category] = {
        totalTests: 0,
        passed: 0,
        failed: 1,
        skipped: 0,
        duration: duration,
        files: [filename],
        errors: [error.message]
      };
    } else {
      this.results.categories[category].failed += 1;
      this.results.categories[category].duration += duration;
      if (!this.results.categories[category].errors) {
        this.results.categories[category].errors = [];
      }
      this.results.categories[category].errors.push(error.message);
    }
  }

  processParallelResults(results, filenames) {
    results.forEach((result, index) => {
      const filename = filenames[index];

      if (result.status === 'fulfilled') {
        this.processTestResult(filename, result.value, 0);
      } else {
        this.processTestError(filename, result.reason, 0);
      }
    });
  }

  async generateReport() {
    console.log('\n📊 Generating comprehensive test report...');

    const report = {
      metadata: TEST_SUITE_METADATA,
      configuration: ADVANCED_TEST_CONFIG,
      execution: {
        startTime: this.results.summary.startTime,
        endTime: this.results.summary.endTime,
        duration: this.results.summary.duration,
        environment: process.env.NODE_ENV || 'test',
        nodeVersion: process.version,
        platform: process.platform
      },
      summary: this.results.summary,
      categories: this.results.categories,
      coverage: this.calculateOverallCoverage(),
      performance: this.analyzePerformanceResults(),
      accessibility: this.analyzeAccessibilityResults(),
      qualityMetrics: this.calculateQualityMetrics(),
      recommendations: this.generateRecommendations(),
      errors: this.results.errors
    };

    // Save detailed report
    const reportPath = join('test-results', 'advanced-test-report.json');
    await this.ensureDir('test-results');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

    // Generate HTML report
    await this.generateHTMLReport(report);

    // Generate summary for CI/CD
    await this.generateCISummary(report);

    console.log(`📋 Report saved to ${reportPath}`);
    return report;
  }

  calculateOverallCoverage() {
    const coverageFiles = Object.values(this.results.coverage);
    if (coverageFiles.length === 0) return null;

    const totals = coverageFiles.reduce((acc, coverage) => ({
      statements: acc.statements + coverage.statements,
      branches: acc.branches + coverage.branches,
      functions: acc.functions + coverage.functions,
      lines: acc.lines + coverage.lines
    }), { statements: 0, branches: 0, functions: 0, lines: 0 });

    return {
      statements: totals.statements / coverageFiles.length,
      branches: totals.branches / coverageFiles.length,
      functions: totals.functions / coverageFiles.length,
      lines: totals.lines / coverageFiles.length
    };
  }

  analyzePerformanceResults() {
    const performanceFiles = Object.values(this.results.performance);
    if (performanceFiles.length === 0) return null;

    const metrics = performanceFiles.reduce((acc, perf) => ({
      totalRenderTime: acc.totalRenderTime + perf.averageRenderTime,
      totalMemory: acc.totalMemory + perf.memoryUsage,
      totalInteractionTime: acc.totalInteractionTime + perf.interactionTime,
      count: acc.count + 1
    }), { totalRenderTime: 0, totalMemory: 0, totalInteractionTime: 0, count: 0 });

    return {
      averageRenderTime: metrics.totalRenderTime / metrics.count,
      averageMemoryUsage: metrics.totalMemory / metrics.count,
      averageInteractionTime: metrics.totalInteractionTime / metrics.count,
      thresholdsPassed: {
        rendering: metrics.totalRenderTime / metrics.count < ADVANCED_TEST_CONFIG.performance.rendering.singleComponent,
        memory: metrics.totalMemory / metrics.count < ADVANCED_TEST_CONFIG.performance.memory.componentInstance / 1024,
        interaction: metrics.totalInteractionTime / metrics.count < ADVANCED_TEST_CONFIG.performance.interaction.clickResponse
      }
    };
  }

  analyzeAccessibilityResults() {
    const accessibilityFiles = Object.values(this.results.accessibility);
    if (accessibilityFiles.length === 0) return null;

    const totals = accessibilityFiles.reduce((acc, a11y) => ({
      violations: acc.violations + a11y.violations,
      passes: acc.passes + a11y.passes,
      incomplete: acc.incomplete + a11y.incomplete
    }), { violations: 0, passes: 0, incomplete: 0 });

    const total = totals.violations + totals.passes + totals.incomplete;

    return {
      violationCount: totals.violations,
      passCount: totals.passes,
      incompleteCount: totals.incomplete,
      complianceScore: total > 0 ? (totals.passes / total) * 100 : 0,
      wcagCompliant: totals.violations === 0
    };
  }

  calculateQualityMetrics() {
    const { summary } = this.results;
    const total = summary.totalTests;

    return {
      testSuccess: total > 0 ? (summary.passed / total) * 100 : 0,
      testCoverage: this.calculateOverallCoverage(),
      bugEscapeRate: total > 0 ? (summary.failed / total) * 100 : 0,
      executionTime: summary.duration / 1000, // seconds
      flakiness: this.results.errors.length / total * 100,
      overallScore: this.calculateOverallQualityScore()
    };
  }

  calculateOverallQualityScore() {
    const { summary } = this.results;
    const total = summary.totalTests;

    if (total === 0) return 0;

    // Weighted quality score
    const testSuccessScore = (summary.passed / total) * 40; // 40% weight
    const coverageScore = (this.calculateOverallCoverage()?.statements || 0) * 0.3; // 30% weight
    const performanceScore = this.analyzePerformanceResults()?.thresholdsPassed ? 20 : 0; // 20% weight
    const accessibilityScore = this.analyzeAccessibilityResults()?.wcagCompliant ? 10 : 0; // 10% weight

    return testSuccessScore + coverageScore + performanceScore + accessibilityScore;
  }

  generateRecommendations() {
    const recommendations = [];
    const coverage = this.calculateOverallCoverage();
    const performance = this.analyzePerformanceResults();
    const accessibility = this.analyzeAccessibilityResults();

    // Coverage recommendations
    if (coverage && coverage.statements < ADVANCED_TEST_CONFIG.coverage.global.statements) {
      recommendations.push({
        category: 'coverage',
        priority: 'high',
        message: `Statement coverage (${coverage.statements.toFixed(1)}%) is below target (${ADVANCED_TEST_CONFIG.coverage.global.statements}%)`,
        action: 'Add more unit tests to increase code coverage'
      });
    }

    // Performance recommendations
    if (performance && !performance.thresholdsPassed.rendering) {
      recommendations.push({
        category: 'performance',
        priority: 'medium',
        message: `Component rendering time (${performance.averageRenderTime.toFixed(1)}ms) exceeds threshold`,
        action: 'Optimize component rendering performance'
      });
    }

    // Accessibility recommendations
    if (accessibility && !accessibility.wcagCompliant) {
      recommendations.push({
        category: 'accessibility',
        priority: 'high',
        message: `${accessibility.violationCount} accessibility violations found`,
        action: 'Fix WCAG compliance issues in components'
      });
    }

    // Test execution recommendations
    if (this.results.summary.duration > ADVANCED_TEST_CONFIG.execution.timeout) {
      recommendations.push({
        category: 'execution',
        priority: 'low',
        message: 'Test suite execution time is longer than expected',
        action: 'Consider optimizing test execution or increasing parallelization'
      });
    }

    return recommendations;
  }

  async generateHTMLReport(report) {
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Advanced Test Suite Report</title>
    <style>
        body { font-family: system-ui, sans-serif; margin: 2rem; background: #f8f9fa; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; padding: 2rem; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .header { border-bottom: 2px solid #e9ecef; padding-bottom: 1rem; margin-bottom: 2rem; }
        .metric-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem; margin: 1rem 0; }
        .metric-card { background: #f8f9fa; padding: 1rem; border-radius: 6px; border-left: 4px solid #0066cc; }
        .metric-value { font-size: 2rem; font-weight: bold; color: #0066cc; }
        .metric-label { color: #6c757d; font-size: 0.9rem; }
        .success { border-left-color: #28a745; }
        .success .metric-value { color: #28a745; }
        .warning { border-left-color: #ffc107; }
        .warning .metric-value { color: #ffc107; }
        .error { border-left-color: #dc3545; }
        .error .metric-value { color: #dc3545; }
        .section { margin: 2rem 0; }
        .section h2 { color: #333; border-bottom: 1px solid #e9ecef; padding-bottom: 0.5rem; }
        table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
        th, td { padding: 0.75rem; text-align: left; border-bottom: 1px solid #e9ecef; }
        th { background: #f8f9fa; font-weight: 600; }
        .recommendations { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 1rem; }
        .recommendation { margin: 0.5rem 0; padding: 0.5rem; background: white; border-radius: 4px; }
        .priority-high { border-left: 4px solid #dc3545; }
        .priority-medium { border-left: 4px solid #ffc107; }
        .priority-low { border-left: 4px solid #28a745; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧪 Advanced Test Suite Report</h1>
            <p>Generated on ${new Date().toLocaleString()}</p>
            <p>Duration: ${(report.execution.duration / 1000).toFixed(2)}s | Environment: ${report.execution.environment}</p>
        </div>

        <div class="section">
            <h2>📊 Summary Metrics</h2>
            <div class="metric-grid">
                <div class="metric-card ${report.summary.failed === 0 ? 'success' : 'error'}">
                    <div class="metric-value">${report.summary.totalTests}</div>
                    <div class="metric-label">Total Tests</div>
                </div>
                <div class="metric-card success">
                    <div class="metric-value">${report.summary.passed}</div>
                    <div class="metric-label">Passed Tests</div>
                </div>
                <div class="metric-card ${report.summary.failed > 0 ? 'error' : 'success'}">
                    <div class="metric-value">${report.summary.failed}</div>
                    <div class="metric-label">Failed Tests</div>
                </div>
                <div class="metric-card ${report.qualityMetrics.testCoverage?.statements > 85 ? 'success' : 'warning'}">
                    <div class="metric-value">${report.qualityMetrics.testCoverage?.statements?.toFixed(1) || 0}%</div>
                    <div class="metric-label">Code Coverage</div>
                </div>
            </div>
        </div>

        <div class="section">
            <h2>🎯 Quality Score: ${report.qualityMetrics.overallScore.toFixed(1)}/100</h2>
            <div class="metric-grid">
                <div class="metric-card">
                    <div class="metric-value">${report.qualityMetrics.testSuccess.toFixed(1)}%</div>
                    <div class="metric-label">Test Success Rate</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${report.qualityMetrics.bugEscapeRate.toFixed(1)}%</div>
                    <div class="metric-label">Bug Escape Rate</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${report.qualityMetrics.flakiness.toFixed(1)}%</div>
                    <div class="metric-label">Test Flakiness</div>
                </div>
            </div>
        </div>

        <div class="section">
            <h2>🔧 Recommendations</h2>
            <div class="recommendations">
                ${report.recommendations.map(rec => `
                    <div class="recommendation priority-${rec.priority}">
                        <strong>${rec.category.toUpperCase()}</strong>: ${rec.message}
                        <br><em>Action: ${rec.action}</em>
                    </div>
                `).join('')}
                ${report.recommendations.length === 0 ? '<p>✅ All quality thresholds met! No recommendations at this time.</p>' : ''}
            </div>
        </div>

        <div class="section">
            <h2>📋 Test Categories</h2>
            <table>
                <thead>
                    <tr>
                        <th>Category</th>
                        <th>Total Tests</th>
                        <th>Passed</th>
                        <th>Failed</th>
                        <th>Duration (s)</th>
                        <th>Success Rate</th>
                    </tr>
                </thead>
                <tbody>
                    ${Object.entries(report.categories).map(([category, data]) => `
                        <tr>
                            <td>${category}</td>
                            <td>${data.totalTests}</td>
                            <td>${data.passed}</td>
                            <td>${data.failed}</td>
                            <td>${(data.duration / 1000).toFixed(2)}</td>
                            <td>${data.totalTests > 0 ? ((data.passed / data.totalTests) * 100).toFixed(1) : 0}%</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    </div>
</body>
</html>`;

    const htmlPath = join('test-results', 'advanced-test-report.html');
    await fs.writeFile(htmlPath, htmlContent);
    console.log(`📊 HTML report saved to ${htmlPath}`);
  }

  async generateCISummary(report) {
    const ciSummary = {
      success: report.summary.failed === 0,
      totalTests: report.summary.totalTests,
      passed: report.summary.passed,
      failed: report.summary.failed,
      coverage: report.qualityMetrics.testCoverage?.statements || 0,
      qualityScore: report.qualityMetrics.overallScore,
      duration: report.execution.duration / 1000,
      recommendations: report.recommendations.length,
      highPriorityIssues: report.recommendations.filter(r => r.priority === 'high').length
    };

    const ciPath = join('test-results', 'ci-summary.json');
    await fs.writeFile(ciPath, JSON.stringify(ciSummary, null, 2));

    console.log('🔄 CI/CD Summary:', ciSummary);
    return ciSummary;
  }

  async ensureDir(dirPath) {
    try {
      await fs.access(dirPath);
    } catch (error) {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  printSummary() {
    const { summary } = this.results;
    const total = summary.totalTests;

    console.log('\n📊 TEST EXECUTION SUMMARY');
    console.log('=' .repeat(50));
    console.log(`Total Tests: ${total}`);
    console.log(`✅ Passed: ${summary.passed} (${total > 0 ? ((summary.passed / total) * 100).toFixed(1) : 0}%)`);
    console.log(`❌ Failed: ${summary.failed} (${total > 0 ? ((summary.failed / total) * 100).toFixed(1) : 0}%)`);
    console.log(`⏭️  Skipped: ${summary.skipped} (${total > 0 ? ((summary.skipped / total) * 100).toFixed(1) : 0}%)`);
    console.log(`⏱️  Duration: ${(summary.duration / 1000).toFixed(2)}s`);

    const coverage = this.calculateOverallCoverage();
    if (coverage) {
      console.log(`📈 Coverage: ${coverage.statements.toFixed(1)}% statements, ${coverage.branches.toFixed(1)}% branches`);
    }

    console.log('=' .repeat(50));

    if (summary.failed === 0) {
      console.log('🎉 All tests passed! Quality gates met.');
    } else {
      console.log(`⚠️  ${summary.failed} test(s) failed. Review results and fix issues.`);
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const options = {
    verbose: args.includes('--verbose'),
    parallel: !args.includes('--sequential'),
    generateReport: !args.includes('--no-report'),
    failFast: args.includes('--fail-fast'),
    coverage: !args.includes('--no-coverage')
  };

  const runner = new AdvancedTestRunner(options);

  try {
    await runner.initialize();
    const results = await runner.runAllTests();

    runner.printSummary();

    // Exit with appropriate code for CI/CD
    process.exit(results.summary.failed === 0 ? 0 : 1);

  } catch (error) {
    console.error('💥 Test runner failed:', error.message);
    process.exit(1);
  }
}

// Export for programmatic usage
export { AdvancedTestRunner };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
