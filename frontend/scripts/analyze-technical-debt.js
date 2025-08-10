#!/usr/bin/env node
/**
 * Technical Debt Analysis and Monitoring Tool
 * 
 * This script provides comprehensive technical debt detection and monitoring by:
 * - Running ESLint analysis and categorizing issues by severity and type
 * - Analyzing code complexity and maintainability metrics
 * - Tracking test coverage and quality metrics
 * - Monitoring bundle size and performance impacts
 * - Generating actionable reports with prioritized recommendations
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class TechnicalDebtAnalyzer {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.reportDir = path.join(this.projectRoot, 'reports', 'technical-debt');
    this.previousReportsDir = path.join(this.reportDir, 'history');
    
    // Ensure report directories exist
    this.ensureDirectories();
    
    // Technical debt categories and severity levels
    this.categories = {
      'CRITICAL': {
        description: 'Issues that break functionality or cause runtime errors',
        priority: 1,
        slaHours: 4
      },
      'HIGH': {
        description: 'Major code quality issues affecting maintainability',
        priority: 2,
        slaHours: 48
      },
      'MEDIUM': {
        description: 'Moderate issues that should be addressed in next sprint',
        priority: 3,
        slaHours: 168 // 1 week
      },
      'LOW': {
        description: 'Minor issues and style improvements',
        priority: 4,
        slaHours: 720 // 30 days
      }
    };

    this.eslintRuleCategories = {
      // Critical runtime errors
      'no-undef': 'CRITICAL',
      'no-unreachable': 'CRITICAL',
      'no-dupe-keys': 'CRITICAL',
      'no-const-assign': 'CRITICAL',
      'no-redeclare': 'CRITICAL',
      
      // High priority maintainability issues
      'no-unused-vars': 'HIGH',
      'no-unused-imports': 'HIGH',
      'no-console': 'MEDIUM',
      'prefer-const': 'MEDIUM',
      
      // Lower priority style issues
      'semi': 'LOW',
      'quotes': 'LOW',
      'indent': 'LOW'
    };
  }

  ensureDirectories() {
    [this.reportDir, this.previousReportsDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  async analyzeESLint() {
    console.log('🔍 Running ESLint analysis...');
    
    try {
      // Run ESLint with JSON output
      const eslintOutput = execSync(
        'npx eslint src --format json', 
        { 
          cwd: this.projectRoot,
          encoding: 'utf8'
        }
      );
      
      const results = JSON.parse(eslintOutput);
      return this.categorizeESLintResults(results);
      
    } catch (error) {
      // ESLint returns non-zero exit code when issues are found
      if (error.stdout) {
        try {
          const results = JSON.parse(error.stdout);
          return this.categorizeESLintResults(results);
        } catch (parseError) {
          console.error('❌ Failed to parse ESLint output:', parseError.message);
          return this.getEmptyESLintResults();
        }
      }
      console.error('❌ ESLint analysis failed:', error.message);
      return this.getEmptyESLintResults();
    }
  }

  categorizeESLintResults(results) {
    const categorized = {
      CRITICAL: [],
      HIGH: [],
      MEDIUM: [],
      LOW: [],
      totalFiles: results.length,
      totalIssues: 0,
      errorCount: 0,
      warningCount: 0
    };

    results.forEach(fileResult => {
      fileResult.messages.forEach(message => {
        const severity = this.eslintRuleCategories[message.ruleId] || 
                        (message.severity === 2 ? 'HIGH' : 'MEDIUM');
        
        const issue = {
          file: fileResult.filePath.replace(this.projectRoot, ''),
          line: message.line,
          column: message.column,
          rule: message.ruleId,
          message: message.message,
          severity: message.severity === 2 ? 'error' : 'warning'
        };

        categorized[severity].push(issue);
        categorized.totalIssues++;
        
        if (message.severity === 2) {
          categorized.errorCount++;
        } else {
          categorized.warningCount++;
        }
      });
    });

    return categorized;
  }

  getEmptyESLintResults() {
    return {
      CRITICAL: [],
      HIGH: [],
      MEDIUM: [],
      LOW: [],
      totalFiles: 0,
      totalIssues: 0,
      errorCount: 0,
      warningCount: 0
    };
  }

  async analyzeTestCoverage() {
    console.log('📊 Analyzing test coverage...');
    
    try {
      // Run test coverage analysis
      const coverageOutput = execSync(
        'npm run test:coverage -- --reporter=json',
        { 
          cwd: this.projectRoot,
          encoding: 'utf8'
        }
      );

      // Parse coverage data if available
      const coverage = this.parseCoverageData();
      return coverage;
      
    } catch (error) {
      console.warn('⚠️  Test coverage analysis failed:', error.message);
      return {
        lines: { covered: 0, total: 0, percentage: 0 },
        functions: { covered: 0, total: 0, percentage: 0 },
        branches: { covered: 0, total: 0, percentage: 0 },
        statements: { covered: 0, total: 0, percentage: 0 }
      };
    }
  }

  parseCoverageData() {
    const coverageFile = path.join(this.projectRoot, 'coverage', 'coverage-summary.json');
    
    if (fs.existsSync(coverageFile)) {
      try {
        const coverageData = JSON.parse(fs.readFileSync(coverageFile, 'utf8'));
        return coverageData.total || {};
      } catch (error) {
        console.warn('⚠️  Failed to parse coverage data:', error.message);
      }
    }
    
    return {
      lines: { covered: 0, total: 0, percentage: 0 },
      functions: { covered: 0, total: 0, percentage: 0 },
      branches: { covered: 0, total: 0, percentage: 0 },
      statements: { covered: 0, total: 0, percentage: 0 }
    };
  }

  async analyzeBundleSize() {
    console.log('📦 Analyzing bundle size...');
    
    try {
      // Run build and analyze bundle
      execSync('npm run build', { cwd: this.projectRoot, stdio: 'pipe' });
      
      const distDir = path.join(this.projectRoot, 'dist');
      const bundleStats = this.getBundleStats(distDir);
      
      return bundleStats;
      
    } catch (error) {
      console.warn('⚠️  Bundle analysis failed:', error.message);
      return {
        totalSize: 0,
        jsSize: 0,
        cssSize: 0,
        assetSize: 0,
        files: []
      };
    }
  }

  getBundleStats(distDir) {
    const stats = {
      totalSize: 0,
      jsSize: 0,
      cssSize: 0,
      assetSize: 0,
      files: []
    };

    if (!fs.existsSync(distDir)) {
      return stats;
    }

    const files = this.getAllFiles(distDir);
    
    files.forEach(file => {
      const filePath = path.relative(distDir, file);
      const fileStats = fs.statSync(file);
      const size = fileStats.size;
      const ext = path.extname(file);
      
      stats.files.push({
        path: filePath,
        size: size,
        sizeFormatted: this.formatBytes(size)
      });
      
      stats.totalSize += size;
      
      if (ext === '.js') {
        stats.jsSize += size;
      } else if (ext === '.css') {
        stats.cssSize += size;
      } else {
        stats.assetSize += size;
      }
    });

    return stats;
  }

  getAllFiles(dir) {
    const files = [];
    
    function traverse(currentDir) {
      const items = fs.readdirSync(currentDir);
      
      items.forEach(item => {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          traverse(fullPath);
        } else {
          files.push(fullPath);
        }
      });
    }
    
    traverse(dir);
    return files;
  }

  formatBytes(bytes) {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async analyzeCodeComplexity() {
    console.log('🧮 Analyzing code complexity...');
    
    const srcDir = path.join(this.projectRoot, 'src');
    const complexity = await this.calculateComplexity(srcDir);
    
    return complexity;
  }

  async calculateComplexity(dir) {
    const complexity = {
      totalFiles: 0,
      totalLines: 0,
      avgComplexity: 0,
      highComplexityFiles: [],
      duplicateCode: []
    };

    const files = this.getAllFiles(dir).filter(file => file.endsWith('.js'));
    complexity.totalFiles = files.length;

    files.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n').length;
      complexity.totalLines += lines;

      // Simple complexity heuristics
      const cyclomaticComplexity = this.calculateCyclomaticComplexity(content);
      
      if (cyclomaticComplexity > 10) {
        complexity.highComplexityFiles.push({
          file: path.relative(this.projectRoot, file),
          complexity: cyclomaticComplexity,
          lines: lines
        });
      }
    });

    complexity.avgComplexity = complexity.totalFiles > 0 ? 
      (complexity.totalLines / complexity.totalFiles) : 0;

    return complexity;
  }

  calculateCyclomaticComplexity(code) {
    // Simple cyclomatic complexity calculation
    const patterns = [
      /\bif\s*\(/g,
      /\belse\s*if\s*\(/g,
      /\bwhile\s*\(/g,
      /\bfor\s*\(/g,
      /\bswitch\s*\(/g,
      /\bcase\s+/g,
      /\bcatch\s*\(/g,
      /\?\s*.*\s*:/g, // ternary operators
      /&&|\|\|/g // logical operators
    ];

    let complexity = 1; // Base complexity

    patterns.forEach(pattern => {
      const matches = code.match(pattern);
      if (matches) {
        complexity += matches.length;
      }
    });

    return complexity;
  }

  generateTechnicalDebtReport(analysis) {
    const timestamp = new Date().toISOString();
    const reportData = {
      timestamp,
      summary: this.generateSummary(analysis),
      eslint: analysis.eslint,
      coverage: analysis.coverage,
      bundle: analysis.bundle,
      complexity: analysis.complexity,
      recommendations: this.generateRecommendations(analysis),
      metrics: this.calculateHealthMetrics(analysis)
    };

    // Save detailed report
    const reportFile = path.join(
      this.reportDir, 
      `technical-debt-${timestamp.split('T')[0]}.json`
    );
    fs.writeFileSync(reportFile, JSON.stringify(reportData, null, 2));

    // Save historical data for trending
    const historyFile = path.join(
      this.previousReportsDir,
      `${Date.now()}.json`
    );
    fs.writeFileSync(historyFile, JSON.stringify({
      timestamp,
      summary: reportData.summary,
      metrics: reportData.metrics
    }, null, 2));

    return reportData;
  }

  generateSummary(analysis) {
    return {
      totalDebtIssues: analysis.eslint.totalIssues,
      criticalIssues: analysis.eslint.CRITICAL.length,
      highPriorityIssues: analysis.eslint.HIGH.length,
      testCoveragePercentage: analysis.coverage.lines?.percentage || 0,
      bundleSizeMB: parseFloat((analysis.bundle.totalSize / (1024 * 1024)).toFixed(2)),
      highComplexityFiles: analysis.complexity.highComplexityFiles.length,
      debtScore: this.calculateDebtScore(analysis)
    };
  }

  calculateDebtScore(analysis) {
    // Technical debt score (0-100, lower is better)
    let score = 0;
    
    // ESLint issues weight
    score += analysis.eslint.CRITICAL.length * 10;
    score += analysis.eslint.HIGH.length * 3;
    score += analysis.eslint.MEDIUM.length * 1;
    score += analysis.eslint.LOW.length * 0.1;
    
    // Coverage penalty
    const coveragePercentage = analysis.coverage.lines?.percentage || 0;
    if (coveragePercentage < 80) {
      score += (80 - coveragePercentage) * 2;
    }
    
    // Bundle size penalty (penalize if over 2MB)
    const bundleSizeMB = analysis.bundle.totalSize / (1024 * 1024);
    if (bundleSizeMB > 2) {
      score += (bundleSizeMB - 2) * 5;
    }
    
    // Complexity penalty
    score += analysis.complexity.highComplexityFiles.length * 2;
    
    return Math.min(Math.round(score), 100);
  }

  generateRecommendations(analysis) {
    const recommendations = [];

    // Critical issues first
    if (analysis.eslint.CRITICAL.length > 0) {
      recommendations.push({
        priority: 'CRITICAL',
        category: 'Code Quality',
        issue: `${analysis.eslint.CRITICAL.length} critical ESLint errors found`,
        action: 'Fix critical ESLint errors immediately - these may cause runtime failures',
        effort: 'High',
        impact: 'High',
        files: analysis.eslint.CRITICAL.slice(0, 5).map(issue => issue.file)
      });
    }

    // High priority issues
    if (analysis.eslint.HIGH.length > 10) {
      recommendations.push({
        priority: 'HIGH',
        category: 'Code Quality',
        issue: `${analysis.eslint.HIGH.length} high-priority ESLint issues`,
        action: 'Address unused variables and imports to improve maintainability',
        effort: 'Medium',
        impact: 'Medium',
        files: analysis.eslint.HIGH.slice(0, 10).map(issue => issue.file)
      });
    }

    // Test coverage
    const coveragePercentage = analysis.coverage.lines?.percentage || 0;
    if (coveragePercentage < 80) {
      recommendations.push({
        priority: 'HIGH',
        category: 'Test Coverage',
        issue: `Test coverage is ${coveragePercentage.toFixed(1)}% (target: 80%+)`,
        action: 'Add unit tests for critical components and services',
        effort: 'High',
        impact: 'High'
      });
    }

    // Bundle size
    const bundleSizeMB = analysis.bundle.totalSize / (1024 * 1024);
    if (bundleSizeMB > 2) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'Performance',
        issue: `Bundle size is ${bundleSizeMB.toFixed(1)}MB (target: <2MB)`,
        action: 'Implement code splitting and remove unused dependencies',
        effort: 'Medium',
        impact: 'Medium'
      });
    }

    // Code complexity
    if (analysis.complexity.highComplexityFiles.length > 5) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'Code Complexity',
        issue: `${analysis.complexity.highComplexityFiles.length} files have high cyclomatic complexity`,
        action: 'Refactor complex functions into smaller, more maintainable units',
        effort: 'High',
        impact: 'Medium',
        files: analysis.complexity.highComplexityFiles.slice(0, 5).map(file => file.file)
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { 'CRITICAL': 1, 'HIGH': 2, 'MEDIUM': 3, 'LOW': 4 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  calculateHealthMetrics(analysis) {
    const codeQualityScore = Math.max(0, 100 - (analysis.eslint.totalIssues * 0.5));
    const testCoverageScore = analysis.coverage.lines?.percentage || 0;
    const performanceScore = Math.max(0, 100 - ((analysis.bundle.totalSize / (1024 * 1024)) * 10));
    const maintainabilityScore = Math.max(0, 100 - (analysis.complexity.highComplexityFiles.length * 5));
    const overallHealthScore = this.calculateOverallHealth({
      codeQualityScore,
      testCoverageScore, 
      performanceScore,
      maintainabilityScore
    });
    
    return {
      codeQualityScore,
      testCoverageScore,
      performanceScore,
      maintainabilityScore,
      overallHealthScore
    };
  }

  calculateOverallHealth(metrics) {
    const weights = {
      codeQualityScore: 0.4,
      testCoverageScore: 0.3,
      performanceScore: 0.2,
      maintainabilityScore: 0.1
    };

    let weightedScore = 0;
    Object.entries(weights).forEach(([metric, weight]) => {
      weightedScore += (metrics[metric] || 0) * weight;
    });

    return Math.round(weightedScore);
  }

  async run() {
    console.log('🚀 Starting Technical Debt Analysis...\n');
    const startTime = Date.now();

    try {
      // Run all analyses
      const analysis = {
        eslint: await this.analyzeESLint(),
        coverage: await this.analyzeTestCoverage(),
        bundle: await this.analyzeBundleSize(),
        complexity: await this.analyzeCodeComplexity()
      };

      // Generate comprehensive report
      const report = this.generateTechnicalDebtReport(analysis);
      
      // Output summary to console
      this.printSummary(report);
      
      const endTime = Date.now();
      console.log(`\n✅ Analysis completed in ${((endTime - startTime) / 1000).toFixed(1)}s`);
      console.log(`📄 Detailed report saved to: ${this.reportDir}`);
      
      // Exit with appropriate code based on debt score
      const exitCode = report.summary.debtScore > 50 ? 1 : 0;
      if (exitCode === 1) {
        console.log('⚠️  Technical debt score is high - consider prioritizing debt reduction');
      }
      
      return exitCode;
      
    } catch (error) {
      console.error('❌ Technical debt analysis failed:', error.message);
      console.error(error.stack);
      return 1;
    }
  }

  printSummary(report) {
    console.log('📋 TECHNICAL DEBT SUMMARY');
    console.log('=' + '='.repeat(50));
    console.log(`🏥 Overall Health Score: ${report.metrics.overallHealthScore}/100`);
    console.log(`🚨 Technical Debt Score: ${report.summary.debtScore}/100 (lower is better)`);
    console.log();
    
    console.log('📊 KEY METRICS');
    console.log('-'.repeat(30));
    console.log(`ESLint Issues: ${report.summary.totalDebtIssues} (${report.summary.criticalIssues} critical)`);
    console.log(`Test Coverage: ${report.summary.testCoveragePercentage.toFixed(1)}%`);
    console.log(`Bundle Size: ${report.summary.bundleSizeMB}MB`);
    console.log(`Complex Files: ${report.summary.highComplexityFiles}`);
    console.log();

    if (report.recommendations.length > 0) {
      console.log('🎯 TOP RECOMMENDATIONS');
      console.log('-'.repeat(30));
      report.recommendations.slice(0, 3).forEach((rec, index) => {
        console.log(`${index + 1}. [${rec.priority}] ${rec.issue}`);
        console.log(`   Action: ${rec.action}`);
        console.log(`   Effort: ${rec.effort} | Impact: ${rec.impact}`);
        console.log();
      });
    }
  }
}

// Run the analyzer if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const analyzer = new TechnicalDebtAnalyzer();
  analyzer.run().then(exitCode => {
    process.exit(exitCode);
  }).catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
}

export default TechnicalDebtAnalyzer;