#!/usr/bin/env node

/**
 * CI/CD Pipeline Validation Script
 *
 * This script validates the complete CI/CD pipeline setup to ensure all
 * components are working correctly before production deployment.
 *
 * Validation includes:
 * - GitHub Actions workflow validation
 * - Component testing infrastructure
 * - Visual regression testing setup
 * - Build and deployment processes
 * - Quality gates and pre-commit hooks
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../..');

class CIPipelineValidator {
  constructor() {
    this.validationResults = {
      timestamp: new Date().toISOString(),
      overall: 'pending',
      categories: {
        github_actions: { status: 'pending', tests: [] },
        testing_infrastructure: { status: 'pending', tests: [] },
        visual_regression: { status: 'pending', tests: [] },
        build_process: { status: 'pending', tests: [] },
        quality_gates: { status: 'pending', tests: [] },
        deployment: { status: 'pending', tests: [] },
        component_library: { status: 'pending', tests: [] }
      }
    };
  }

  async validate() {
    console.log('🔍 Validating CI/CD Pipeline...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    try {
      // Run all validation categories
      await this.validateGitHubActions();
      await this.validateTestingInfrastructure();
      await this.validateVisualRegression();
      await this.validateBuildProcess();
      await this.validateQualityGates();
      await this.validateDeployment();
      await this.validateComponentLibrary();

      // Calculate overall status
      this.calculateOverallStatus();

      // Generate report
      await this.generateValidationReport();

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`🎯 Overall Pipeline Status: ${this.getStatusEmoji(this.validationResults.overall)} ${this.validationResults.overall.toUpperCase()}`);

      if (this.validationResults.overall === 'failed') {
        console.log('❌ Pipeline validation failed - check issues above');
        process.exit(1);
      } else if (this.validationResults.overall === 'warning') {
        console.log('⚠️ Pipeline validation completed with warnings');
      } else {
        console.log('✅ Pipeline validation successful - ready for production!');
      }

      return this.validationResults;

    } catch (error) {
      console.error('💥 Pipeline validation failed:', error.message);
      this.validationResults.overall = 'failed';
      throw error;
    }
  }

  async validateGitHubActions() {
    console.log('\\n🔧 Validating GitHub Actions...');

    const category = this.validationResults.categories.github_actions;

    // Test 1: Check if workflow files exist
    const workflowPath = path.join(projectRoot, '.github/workflows');
    const workflowTest = await this.runTest('GitHub Actions workflow files exist', async () => {
      const files = await fs.readdir(workflowPath);
      const hasPlaygroundCI = files.includes('playground-ci.yml');
      const hasPreCommit = files.includes('pre-commit-hooks.yml');

      if (!hasPlaygroundCI) throw new Error('playground-ci.yml not found');
      if (!hasPreCommit) throw new Error('pre-commit-hooks.yml not found');

      return `Found ${files.length} workflow files`;
    });
    category.tests.push(workflowTest);

    // Test 2: Validate workflow syntax
    const syntaxTest = await this.runTest('GitHub Actions workflow syntax', async () => {
      const playgroundWorkflow = path.join(workflowPath, 'playground-ci.yml');
      const content = await fs.readFile(playgroundWorkflow, 'utf-8');

      // Basic YAML validation
      if (!content.includes('name:')) throw new Error('Missing workflow name');
      if (!content.includes('on:')) throw new Error('Missing trigger configuration');
      if (!content.includes('jobs:')) throw new Error('Missing jobs configuration');

      const jobCount = (content.match(/^\\s+[a-zA-Z][a-zA-Z0-9_-]*:/gm) || []).length;
      return `Workflow syntax valid, ${jobCount} jobs defined`;
    });
    category.tests.push(syntaxTest);

    // Test 3: Check for required secrets and variables
    const secretsTest = await this.runTest('Required secrets configuration', async () => {
      const workflowContent = await fs.readFile(path.join(workflowPath, 'playground-ci.yml'), 'utf-8');

      const requiredSecrets = ['CODECOV_TOKEN', 'NPM_TOKEN'];
      const missingSecrets = requiredSecrets.filter(secret =>
        !workflowContent.includes(`secrets.${secret}`)
      );

      if (missingSecrets.length > 0) {
        return { status: 'warning', message: `Missing secrets: ${missingSecrets.join(', ')}` };
      }

      return 'All required secrets configured';
    });
    category.tests.push(secretsTest);

    category.status = this.calculateCategoryStatus(category.tests);
    console.log(`   GitHub Actions: ${this.getStatusEmoji(category.status)} ${category.status.toUpperCase()}`);
  }

  async validateTestingInfrastructure() {
    console.log('\\n🧪 Validating Testing Infrastructure...');

    const category = this.validationResults.categories.testing_infrastructure;
    const frontendDir = path.join(projectRoot, 'frontend');

    // Test 1: Vitest configuration
    const vitestTest = await this.runTest('Vitest configuration', async () => {
      const vitestConfig = path.join(frontendDir, 'vitest.config.js');
      const configContent = await fs.readFile(vitestConfig, 'utf-8');

      if (!configContent.includes('coverage')) throw new Error('Coverage not configured');
      if (!configContent.includes('setupFiles')) throw new Error('Setup files not configured');

      return 'Vitest configuration valid';
    });
    category.tests.push(vitestTest);

    // Test 2: Playwright configuration
    const playwrightTest = await this.runTest('Playwright configuration', async () => {
      const configs = [
        'playwright.visual.config.js',
        'playwright.a11y.config.js',
        'playwright.e2e.config.js'
      ];

      const missingConfigs = [];
      for (const config of configs) {
        const configPath = path.join(frontendDir, config);
        try {
          await fs.access(configPath);
        } catch (error) {
          missingConfigs.push(config);
        }
      }

      if (missingConfigs.length > 0) {
        throw new Error(`Missing Playwright configs: ${missingConfigs.join(', ')}`);
      }

      return `All Playwright configurations present (${configs.length})`;
    });
    category.tests.push(playwrightTest);

    // Test 3: Test coverage threshold
    const coverageTest = await this.runTest('Test coverage thresholds', async () => {
      const packageJson = JSON.parse(await fs.readFile(path.join(frontendDir, 'package.json'), 'utf-8'));

      if (!packageJson.vitest?.coverage?.thresholds) {
        return { status: 'warning', message: 'No coverage thresholds defined' };
      }

      const thresholds = packageJson.vitest.coverage.thresholds.global;
      if (!thresholds || thresholds.lines < 75) {
        return { status: 'warning', message: 'Coverage thresholds below recommended 75%' };
      }

      return `Coverage thresholds: ${thresholds.lines}% lines, ${thresholds.functions}% functions`;
    });
    category.tests.push(coverageTest);

    // Test 4: Component test coverage
    const componentCoverageTest = await this.runTest('Component test coverage', async () => {
      const componentsDir = path.join(frontendDir, 'src/components');
      const testDir = path.join(frontendDir, 'src/test/components');

      // Count components
      const categories = ['atoms', 'molecules', 'organisms', 'pages'];
      let totalComponents = 0;
      let testedComponents = 0;

      for (const category of categories) {
        const categoryDir = path.join(componentsDir, category);
        try {
          const files = await fs.readdir(categoryDir);
          const jsFiles = files.filter(f => f.endsWith('.js') && !f.endsWith('.test.js') && !f.endsWith('.stories.js'));
          totalComponents += jsFiles.length;

          // Check for corresponding test files
          for (const file of jsFiles) {
            const testFile = path.join(testDir, `${path.basename(file, '.js')}.test.js`);
            try {
              await fs.access(testFile);
              testedComponents++;
            } catch (error) {
              // Test file doesn't exist
            }
          }
        } catch (error) {
          // Category doesn't exist
        }
      }

      const coveragePercent = totalComponents > 0 ? Math.round((testedComponents / totalComponents) * 100) : 0;

      if (coveragePercent < 60) {
        return { status: 'warning', message: `Low component test coverage: ${coveragePercent}% (${testedComponents}/${totalComponents})` };
      }

      return `Component test coverage: ${coveragePercent}% (${testedComponents}/${totalComponents})`;
    });
    category.tests.push(componentCoverageTest);

    category.status = this.calculateCategoryStatus(category.tests);
    console.log(`   Testing Infrastructure: ${this.getStatusEmoji(category.status)} ${category.status.toUpperCase()}`);
  }

  async validateVisualRegression() {
    console.log('\\n📸 Validating Visual Regression Testing...');

    const category = this.validationResults.categories.visual_regression;
    const frontendDir = path.join(projectRoot, 'frontend');

    // Test 1: Visual test files exist
    const visualTestsTest = await this.runTest('Visual regression test files', async () => {
      const visualTestPath = path.join(frontendDir, 'src/test/visual/component-regression.test.js');
      await fs.access(visualTestPath);

      const content = await fs.readFile(visualTestPath, 'utf-8');
      const testCount = (content.match(/test\(/g) || []).length;

      return `Visual regression tests configured with ${testCount} test cases`;
    });
    category.tests.push(visualTestsTest);

    // Test 2: Baseline management script
    const baselineManagementTest = await this.runTest('Baseline management system', async () => {
      const baselineScript = path.join(frontendDir, 'scripts/manage-visual-baselines.js');
      await fs.access(baselineScript);

      return 'Visual baseline management system present';
    });
    category.tests.push(baselineManagementTest);

    // Test 3: Playwright visual config
    const visualConfigTest = await this.runTest('Playwright visual configuration', async () => {
      const configPath = path.join(frontendDir, 'playwright.visual.config.js');
      const configContent = await fs.readFile(configPath, 'utf-8');

      if (!configContent.includes('toHaveScreenshot')) {
        throw new Error('Screenshot comparison not configured');
      }

      if (!configContent.includes('maxDiffPixels')) {
        return { status: 'warning', message: 'Diff pixel threshold not configured' };
      }

      return 'Playwright visual configuration complete';
    });
    category.tests.push(visualConfigTest);

    category.status = this.calculateCategoryStatus(category.tests);
    console.log(`   Visual Regression: ${this.getStatusEmoji(category.status)} ${category.status.toUpperCase()}`);
  }

  async validateBuildProcess() {
    console.log('\\n🏗️ Validating Build Process...');

    const category = this.validationResults.categories.build_process;
    const frontendDir = path.join(projectRoot, 'frontend');

    // Test 1: Build scripts exist
    const buildScriptsTest = await this.runTest('Build scripts configuration', async () => {
      const packageJson = JSON.parse(await fs.readFile(path.join(frontendDir, 'package.json'), 'utf-8'));

      const requiredScripts = ['build', 'playground:build', 'test', 'lint'];
      const missingScripts = requiredScripts.filter(script => !packageJson.scripts[script]);

      if (missingScripts.length > 0) {
        throw new Error(`Missing scripts: ${missingScripts.join(', ')}`);
      }

      return `All required build scripts present (${requiredScripts.length})`;
    });
    category.tests.push(buildScriptsTest);

    // Test 2: Vite configuration
    const viteConfigTest = await this.runTest('Vite build configuration', async () => {
      const viteConfigs = [
        'vite.config.js',
        'vite.config.playground.js'
      ];

      for (const config of viteConfigs) {
        const configPath = path.join(frontendDir, config);
        await fs.access(configPath);
      }

      return `Vite configurations present (${viteConfigs.length})`;
    });
    category.tests.push(viteConfigTest);

    // Test 3: Actual build test
    const buildTest = await this.runTest('Build execution test', async () => {
      const startTime = Date.now();

      try {
        execSync('npm run build', {
          cwd: frontendDir,
          stdio: 'pipe',
          timeout: 60000 // 60 second timeout
        });

        const buildTime = Date.now() - startTime;

        // Check if dist directory was created
        const distDir = path.join(frontendDir, 'dist');
        await fs.access(distDir);

        // Check for main files
        const files = await fs.readdir(distDir);
        if (!files.some(f => f.endsWith('.html'))) {
          throw new Error('No HTML files in build output');
        }

        return `Build successful in ${buildTime}ms, ${files.length} output files`;
      } catch (error) {
        if (error.signal === 'SIGTERM') {
          throw new Error('Build timeout (>60s)');
        }
        throw new Error(`Build failed: ${error.message}`);
      }
    });
    category.tests.push(buildTest);

    category.status = this.calculateCategoryStatus(category.tests);
    console.log(`   Build Process: ${this.getStatusEmoji(category.status)} ${category.status.toUpperCase()}`);
  }

  async validateQualityGates() {
    console.log('\\n🚦 Validating Quality Gates...');

    const category = this.validationResults.categories.quality_gates;
    const frontendDir = path.join(projectRoot, 'frontend');

    // Test 1: Git hooks setup script
    const gitHooksTest = await this.runTest('Git hooks setup', async () => {
      const hooksScript = path.join(frontendDir, 'scripts/setup-git-hooks.js');
      await fs.access(hooksScript);

      return 'Git hooks setup script present';
    });
    category.tests.push(gitHooksTest);

    // Test 2: ESLint configuration
    const eslintTest = await this.runTest('ESLint configuration', async () => {
      const packageJson = JSON.parse(await fs.readFile(path.join(frontendDir, 'package.json'), 'utf-8'));

      if (!packageJson.devDependencies.eslint) {
        throw new Error('ESLint not installed');
      }

      // Check if lint script works
      try {
        execSync('npm run lint', {
          cwd: frontendDir,
          stdio: 'pipe',
          timeout: 30000
        });
        return 'ESLint configuration working';
      } catch (error) {
        return { status: 'warning', message: 'ESLint issues found - review and fix' };
      }
    });
    category.tests.push(eslintTest);

    // Test 3: Prettier configuration
    const prettierTest = await this.runTest('Prettier configuration', async () => {
      const packageJson = JSON.parse(await fs.readFile(path.join(frontendDir, 'package.json'), 'utf-8'));

      if (!packageJson.devDependencies.prettier) {
        throw new Error('Prettier not installed');
      }

      // Check if format check works
      try {
        execSync('npx prettier --check "src/**/*.{js,json}" --loglevel=error', {
          cwd: frontendDir,
          stdio: 'pipe',
          timeout: 15000
        });
        return 'Prettier configuration working';
      } catch (error) {
        return { status: 'warning', message: 'Code formatting issues found' };
      }
    });
    category.tests.push(prettierTest);

    category.status = this.calculateCategoryStatus(category.tests);
    console.log(`   Quality Gates: ${this.getStatusEmoji(category.status)} ${category.status.toUpperCase()}`);
  }

  async validateDeployment() {
    console.log('\\n🚀 Validating Deployment Setup...');

    const category = this.validationResults.categories.deployment;
    const frontendDir = path.join(projectRoot, 'frontend');

    // Test 1: Deployment script exists
    const deploymentScriptTest = await this.runTest('Deployment script', async () => {
      const deployScript = path.join(frontendDir, 'scripts/deploy-playground.js');
      await fs.access(deployScript);

      return 'Deployment script present';
    });
    category.tests.push(deploymentScriptTest);

    // Test 2: GitHub Pages configuration
    const githubPagesTest = await this.runTest('GitHub Pages configuration', async () => {
      const workflowPath = path.join(projectRoot, '.github/workflows/playground-ci.yml');
      const workflowContent = await fs.readFile(workflowPath, 'utf-8');

      if (!workflowContent.includes('deploy-pages')) {
        throw new Error('GitHub Pages deployment not configured');
      }

      if (!workflowContent.includes('permissions:')) {
        return { status: 'warning', message: 'Permissions may not be configured for Pages deployment' };
      }

      return 'GitHub Pages deployment configured';
    });
    category.tests.push(githubPagesTest);

    // Test 3: Deployment manifest generation
    const manifestTest = await this.runTest('Deployment manifest generation', async () => {
      // Test if deployment script can generate manifest
      const deployScript = path.join(frontendDir, 'scripts/deploy-playground.js');
      const deployContent = await fs.readFile(deployScript, 'utf-8');

      if (!deployContent.includes('deployment-manifest.json')) {
        return { status: 'warning', message: 'Deployment manifest generation not configured' };
      }

      return 'Deployment manifest generation configured';
    });
    category.tests.push(manifestTest);

    category.status = this.calculateCategoryStatus(category.tests);
    console.log(`   Deployment: ${this.getStatusEmoji(category.status)} ${category.status.toUpperCase()}`);
  }

  async validateComponentLibrary() {
    console.log('\\n📦 Validating Component Library...');

    const category = this.validationResults.categories.component_library;
    const frontendDir = path.join(projectRoot, 'frontend');

    // Test 1: Component library build script
    const buildScriptTest = await this.runTest('Component library build script', async () => {
      const buildScript = path.join(frontendDir, 'scripts/build-component-library.js');
      await fs.access(buildScript);

      return 'Component library build script present';
    });
    category.tests.push(buildScriptTest);

    // Test 2: Component discovery
    const discoveryTest = await this.runTest('Component discovery', async () => {
      const componentsDir = path.join(frontendDir, 'src/components');
      const categories = ['atoms', 'molecules', 'organisms', 'pages'];

      let totalComponents = 0;
      for (const category of categories) {
        const categoryDir = path.join(componentsDir, category);
        try {
          const files = await fs.readdir(categoryDir);
          const jsFiles = files.filter(f => f.endsWith('.js') && !f.endsWith('.test.js') && !f.endsWith('.stories.js'));
          totalComponents += jsFiles.length;
        } catch (error) {
          // Category doesn't exist
        }
      }

      if (totalComponents === 0) {
        throw new Error('No components found');
      }

      return `Discovered ${totalComponents} components across ${categories.length} categories`;
    });
    category.tests.push(discoveryTest);

    // Test 3: Package.json for library
    const packageTest = await this.runTest('Library package configuration', async () => {
      const buildScript = path.join(frontendDir, 'scripts/build-component-library.js');
      const scriptContent = await fs.readFile(buildScript, 'utf-8');

      if (!scriptContent.includes('generatePackageJson')) {
        throw new Error('Package.json generation not configured');
      }

      if (!scriptContent.includes('exports')) {
        return { status: 'warning', message: 'ES modules exports may not be configured' };
      }

      return 'Library package configuration present';
    });
    category.tests.push(packageTest);

    category.status = this.calculateCategoryStatus(category.tests);
    console.log(`   Component Library: ${this.getStatusEmoji(category.status)} ${category.status.toUpperCase()}`);
  }

  async runTest(name, testFunction) {
    try {
      const result = await testFunction();

      if (typeof result === 'object' && result.status) {
        console.log(`   ${this.getStatusEmoji(result.status)} ${name}: ${result.message}`);
        return { name, status: result.status, message: result.message };
      } else {
        console.log(`   ✅ ${name}: ${result}`);
        return { name, status: 'passed', message: result };
      }
    } catch (error) {
      console.log(`   ❌ ${name}: ${error.message}`);
      return { name, status: 'failed', message: error.message };
    }
  }

  calculateCategoryStatus(tests) {
    const failed = tests.filter(t => t.status === 'failed').length;
    const warning = tests.filter(t => t.status === 'warning').length;

    if (failed > 0) return 'failed';
    if (warning > 0) return 'warning';
    return 'passed';
  }

  calculateOverallStatus() {
    const categoryStatuses = Object.values(this.validationResults.categories).map(cat => cat.status);

    if (categoryStatuses.some(status => status === 'failed')) {
      this.validationResults.overall = 'failed';
    } else if (categoryStatuses.some(status => status === 'warning')) {
      this.validationResults.overall = 'warning';
    } else {
      this.validationResults.overall = 'passed';
    }
  }

  getStatusEmoji(status) {
    const emojis = {
      'passed': '✅',
      'warning': '⚠️',
      'failed': '❌',
      'pending': '⏳'
    };
    return emojis[status] || '❓';
  }

  async generateValidationReport() {
    const reportPath = path.join(projectRoot, 'frontend/test-results/ci-pipeline-validation.json');

    // Ensure directory exists
    await fs.mkdir(path.dirname(reportPath), { recursive: true });

    // Write detailed report
    await fs.writeFile(reportPath, JSON.stringify(this.validationResults, null, 2));

    // Generate summary report
    const summaryPath = path.join(projectRoot, 'frontend/test-results/ci-pipeline-summary.md');
    const summary = this.generateSummaryReport();
    await fs.writeFile(summaryPath, summary);

    console.log(`\\n📊 Validation reports generated:`);
    console.log(`   Detailed: ${reportPath}`);
    console.log(`   Summary:  ${summaryPath}`);
  }

  generateSummaryReport() {
    const { overall, categories } = this.validationResults;

    let summary = `# CI/CD Pipeline Validation Report

**Generated:** ${this.validationResults.timestamp}
**Overall Status:** ${this.getStatusEmoji(overall)} ${overall.toUpperCase()}

## Category Summary

| Category | Status | Tests |
|----------|--------|-------|
`;

    for (const [name, category] of Object.entries(categories)) {
      const passed = category.tests.filter(t => t.status === 'passed').length;
      const total = category.tests.length;
      const displayName = name.replace(/_/g, ' ').replace(/\\b\\w/g, l => l.toUpperCase());

      summary += `| ${displayName} | ${this.getStatusEmoji(category.status)} ${category.status} | ${passed}/${total} |\n`;
    }

    summary += `\n## Detailed Results\n\n`;

    for (const [name, category] of Object.entries(categories)) {
      const displayName = name.replace(/_/g, ' ').replace(/\\b\\w/g, l => l.toUpperCase());
      summary += `### ${displayName}\n\n`;

      for (const test of category.tests) {
        summary += `- ${this.getStatusEmoji(test.status)} **${test.name}**: ${test.message}\n`;
      }

      summary += '\n';
    }

    summary += `## Recommendations\n\n`;

    const failedTests = Object.values(categories).flatMap(cat =>
      cat.tests.filter(t => t.status === 'failed')
    );

    if (failedTests.length > 0) {
      summary += `### Critical Issues (${failedTests.length})\n\n`;
      failedTests.forEach(test => {
        summary += `- ❌ **${test.name}**: ${test.message}\n`;
      });
      summary += '\n';
    }

    const warningTests = Object.values(categories).flatMap(cat =>
      cat.tests.filter(t => t.status === 'warning')
    );

    if (warningTests.length > 0) {
      summary += `### Warnings (${warningTests.length})\n\n`;
      warningTests.forEach(test => {
        summary += `- ⚠️ **${test.name}**: ${test.message}\n`;
      });
      summary += '\n';
    }

    if (overall === 'passed') {
      summary += `### ✅ Pipeline Ready\n\nAll critical components of the CI/CD pipeline are properly configured and functional.\n`;
    }

    return summary;
  }
}

// CLI Interface
async function main() {
  const validator = new CIPipelineValidator();

  try {
    await validator.validate();
  } catch (error) {
    console.error('💥 Validation failed:', error.message);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { CIPipelineValidator };
