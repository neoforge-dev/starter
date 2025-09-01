#!/usr/bin/env node

/**
 * Visual Testing Runner Script
 *
 * Orchestrates visual testing workflow:
 * 1. Starts playground server
 * 2. Runs Playwright visual tests
 * 3. Generates visual test report
 * 4. Cleans up
 */

import { spawn, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

class VisualTestRunner {
  constructor() {
    this.playgroundServer = null;
    this.serverPort = 5173;
    this.serverUrl = `http://localhost:${this.serverPort}`;
    this.testResults = {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      skippedTests: 0,
      duration: 0,
      components: {}
    };
  }

  /**
   * Main execution flow
   */
  async run() {
    console.log('🎯 Starting Visual Testing Suite...\n');

    const startTime = Date.now();

    try {
      // Step 1: Check prerequisites
      await this.checkPrerequisites();

      // Step 2: Start playground server
      await this.startPlaygroundServer();

      // Step 3: Wait for server to be ready
      await this.waitForServer();

      // Step 4: Run visual tests
      const testResults = await this.runVisualTests();

      // Step 5: Generate report
      await this.generateReport(testResults);

      // Step 6: Display summary
      this.displaySummary(testResults, Date.now() - startTime);

    } catch (error) {
      console.error('❌ Visual testing failed:', error.message);
      process.exit(1);
    } finally {
      await this.cleanup();
    }
  }

  /**
   * Check if all prerequisites are met
   */
  async checkPrerequisites() {
    console.log('📋 Checking prerequisites...');

    // Check if Playwright is installed
    try {
      execSync('npx playwright --version', { stdio: 'pipe' });
      console.log('✅ Playwright is installed');
    } catch (error) {
      throw new Error('Playwright is not installed. Run: npm install');
    }

    // Check if playground files exist
    const playgroundPath = path.join(projectRoot, 'playground.html');
    if (!fs.existsSync(playgroundPath)) {
      throw new Error('Playground HTML file not found. Run: npm run playground:build');
    }
    console.log('✅ Playground files found');

    console.log('');
  }

  /**
   * Start the playground server
   */
  async startPlaygroundServer() {
    console.log('🚀 Starting playground server...');

    return new Promise((resolve, reject) => {
      this.playgroundServer = spawn('npm', ['run', 'playground'], {
        cwd: projectRoot,
        stdio: ['ignore', 'pipe', 'pipe']
      });

      let serverOutput = '';

      this.playgroundServer.stdout.on('data', (data) => {
        serverOutput += data.toString();
        if (data.toString().includes('Local:')) {
          console.log('✅ Playground server started');
          resolve();
        }
      });

      this.playgroundServer.stderr.on('data', (data) => {
        console.error('Server error:', data.toString());
      });

      this.playgroundServer.on('error', (error) => {
        reject(new Error(`Failed to start server: ${error.message}`));
      });

      // Timeout after 30 seconds
      setTimeout(() => {
        if (this.playgroundServer) {
          reject(new Error('Server startup timeout'));
        }
      }, 30000);
    });
  }

  /**
   * Wait for server to be responsive
   */
  async waitForServer() {
    console.log('⏳ Waiting for server to be ready...');

    const maxAttempts = 30;
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const response = await fetch(this.serverUrl);
        if (response.ok) {
          console.log('✅ Server is ready\n');
          return;
        }
      } catch (error) {
        // Server not ready yet
      }

      attempts++;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    throw new Error('Server did not become ready within timeout');
  }

  /**
   * Run the visual tests
   */
  async runVisualTests() {
    console.log('📸 Running visual tests...\n');

    try {
      const result = execSync(
        'npx playwright test --config=playwright.visual.config.js --reporter=json',
        {
          cwd: projectRoot,
          encoding: 'utf8',
          maxBuffer: 1024 * 1024 * 10 // 10MB buffer
        }
      );

      return JSON.parse(result);
    } catch (error) {
      // Playwright returns non-zero exit code for failing tests
      if (error.stdout) {
        try {
          return JSON.parse(error.stdout);
        } catch (parseError) {
          console.error('Failed to parse test results:', parseError);
        }
      }
      throw new Error(`Visual tests failed: ${error.message}`);
    }
  }

  /**
   * Generate visual test report
   */
  async generateReport(testResults) {
    console.log('📊 Generating visual test report...');

    const reportDir = path.join(projectRoot, 'test-results/visual-report');

    // Ensure report directory exists
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    // Generate HTML report
    const reportHtml = this.generateHtmlReport(testResults);
    fs.writeFileSync(path.join(reportDir, 'visual-test-report.html'), reportHtml);

    // Generate JSON summary
    const summary = this.generateSummary(testResults);
    fs.writeFileSync(path.join(reportDir, 'summary.json'), JSON.stringify(summary, null, 2));

    console.log('✅ Report generated in test-results/visual-report/\n');
  }

  /**
   * Generate HTML report
   */
  generateHtmlReport(testResults) {
    const { stats, tests } = testResults;

    return `
<!DOCTYPE html>
<html>
<head>
    <title>Visual Testing Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; margin: 20px; }
        .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px; }
        .stat-card { background: white; padding: 15px; border-radius: 8px; border: 1px solid #e0e0e0; text-align: center; }
        .stat-number { font-size: 2em; font-weight: bold; margin-bottom: 5px; }
        .passed { color: #28a745; }
        .failed { color: #dc3545; }
        .skipped { color: #ffc107; }
        .test-list { background: white; border-radius: 8px; border: 1px solid #e0e0e0; }
        .test-item { padding: 15px; border-bottom: 1px solid #f0f0f0; }
        .test-item:last-child { border-bottom: none; }
        .test-title { font-weight: bold; margin-bottom: 5px; }
        .test-status { display: inline-block; padding: 3px 8px; border-radius: 4px; font-size: 0.9em; }
        .status-passed { background: #d4edda; color: #155724; }
        .status-failed { background: #f8d7da; color: #721c24; }
        .status-skipped { background: #fff3cd; color: #856404; }
    </style>
</head>
<body>
    <div class="header">
        <h1>📸 Visual Testing Report</h1>
        <p>Generated on ${new Date().toLocaleString()}</p>
    </div>

    <div class="stats">
        <div class="stat-card">
            <div class="stat-number">${stats?.expected || 0}</div>
            <div>Total Tests</div>
        </div>
        <div class="stat-card">
            <div class="stat-number passed">${stats?.passed || 0}</div>
            <div>Passed</div>
        </div>
        <div class="stat-card">
            <div class="stat-number failed">${stats?.failed || 0}</div>
            <div>Failed</div>
        </div>
        <div class="stat-card">
            <div class="stat-number skipped">${stats?.skipped || 0}</div>
            <div>Skipped</div>
        </div>
    </div>

    <div class="test-list">
        ${(tests || []).map(test => `
            <div class="test-item">
                <div class="test-title">${test.title}</div>
                <span class="test-status status-${test.outcome || 'unknown'}">${test.outcome || 'unknown'}</span>
                <div style="margin-top: 5px; font-size: 0.9em; color: #666;">
                    Duration: ${test.duration || 0}ms
                </div>
            </div>
        `).join('')}
    </div>
</body>
</html>`;
  }

  /**
   * Generate test summary
   */
  generateSummary(testResults) {
    const { stats, tests } = testResults;

    const components = {};
    (tests || []).forEach(test => {
      const match = test.title.match(/(atom|molecule): (\w+)/);
      if (match) {
        const [, category, name] = match;
        const key = `${category}s/${name}`;
        if (!components[key]) {
          components[key] = { passed: 0, failed: 0, skipped: 0 };
        }
        components[key][test.outcome || 'failed']++;
      }
    });

    return {
      summary: {
        total: stats?.expected || 0,
        passed: stats?.passed || 0,
        failed: stats?.failed || 0,
        skipped: stats?.skipped || 0,
        duration: stats?.duration || 0
      },
      components,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Display test summary
   */
  displaySummary(testResults, duration) {
    const { stats } = testResults;

    console.log('📊 VISUAL TESTING SUMMARY');
    console.log('='.repeat(50));
    console.log(`Total Tests: ${stats?.expected || 0}`);
    console.log(`✅ Passed: ${stats?.passed || 0}`);
    console.log(`❌ Failed: ${stats?.failed || 0}`);
    console.log(`⏸️  Skipped: ${stats?.skipped || 0}`);
    console.log(`⏱️  Duration: ${Math.round(duration / 1000)}s`);
    console.log('');

    if (stats?.failed > 0) {
      console.log('❌ Some visual tests failed. Check the report for details.');
      console.log('   Report: test-results/visual-report/visual-test-report.html');
    } else {
      console.log('✅ All visual tests passed! Your components look great.');
    }

    console.log('');
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    console.log('🧹 Cleaning up...');

    if (this.playgroundServer) {
      this.playgroundServer.kill('SIGTERM');

      // Wait a bit for graceful shutdown
      await new Promise(resolve => setTimeout(resolve, 2000));

      if (!this.playgroundServer.killed) {
        this.playgroundServer.kill('SIGKILL');
      }

      console.log('✅ Server stopped');
    }
  }
}

// Run if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const runner = new VisualTestRunner();
  runner.run().catch(error => {
    console.error('Visual testing failed:', error);
    process.exit(1);
  });
}

export default VisualTestRunner;
