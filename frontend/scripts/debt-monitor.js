#!/usr/bin/env node
/**
 * Technical Debt Monitoring and Alerting System
 * 
 * This script provides continuous monitoring of technical debt by:
 * - Running regular debt analysis and trend tracking
 * - Setting up alerts for debt threshold violations
 * - Generating automated recommendations based on trends
 * - Integration with CI/CD pipelines for automated quality gates
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import TechnicalDebtAnalyzer from './analyze-technical-debt.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class TechnicalDebtMonitor {
  constructor(options = {}) {
    this.projectRoot = path.resolve(__dirname, '..');
    this.reportDir = path.join(this.projectRoot, 'reports', 'technical-debt');
    this.historyDir = path.join(this.reportDir, 'history');
    this.configFile = path.join(this.reportDir, 'monitor-config.json');
    
    // Default thresholds
    this.defaultConfig = {
      thresholds: {
        debtScore: {
          warning: 30,
          critical: 50
        },
        eslintIssues: {
          warning: 50,
          critical: 100
        },
        criticalIssues: {
          warning: 1,
          critical: 5
        },
        testCoverage: {
          warning: 75,
          critical: 60
        },
        bundleSize: {
          warning: 2, // MB
          critical: 5  // MB
        }
      },
      trending: {
        lookbackDays: 30,
        alertOnIncreasingTrend: true,
        trendThreshold: 0.1 // 10% increase triggers alert
      },
      notifications: {
        console: true,
        file: true,
        github: false, // Can be enabled for GitHub Actions
        email: false   // Can be configured with email service
      }
    };
    
    this.config = this.loadConfig();
  }

  loadConfig() {
    if (fs.existsSync(this.configFile)) {
      try {
        const userConfig = JSON.parse(fs.readFileSync(this.configFile, 'utf8'));
        return { ...this.defaultConfig, ...userConfig };
      } catch (error) {
        console.warn('⚠️  Failed to load monitor config, using defaults:', error.message);
      }
    }
    
    this.saveConfig(this.defaultConfig);
    return this.defaultConfig;
  }

  saveConfig(config) {
    if (!fs.existsSync(this.reportDir)) {
      fs.mkdirSync(this.reportDir, { recursive: true });
    }
    fs.writeFileSync(this.configFile, JSON.stringify(config, null, 2));
  }

  async monitor() {
    console.log('🔍 Technical Debt Monitor Starting...\n');
    
    try {
      // Run technical debt analysis
      const analyzer = new TechnicalDebtAnalyzer();
      const exitCode = await analyzer.run();
      
      // Load the latest report
      const latestReport = this.getLatestReport();
      if (!latestReport) {
        console.error('❌ No report data available for monitoring');
        return 1;
      }
      
      // Analyze trends
      const trends = this.analyzeTrends();
      
      // Check thresholds and generate alerts
      const alerts = this.checkThresholds(latestReport, trends);
      
      // Process notifications
      await this.processNotifications(alerts, latestReport, trends);
      
      // Generate monitoring summary
      this.generateMonitoringSummary(latestReport, trends, alerts);
      
      return alerts.some(alert => alert.level === 'critical') ? 1 : 0;
      
    } catch (error) {
      console.error('❌ Technical debt monitoring failed:', error.message);
      return 1;
    }
  }

  getLatestReport() {
    try {
      const reportFiles = fs.readdirSync(this.reportDir)
        .filter(file => file.startsWith('technical-debt-') && file.endsWith('.json'))
        .sort()
        .reverse();
      
      if (reportFiles.length === 0) {
        return null;
      }
      
      const latestFile = path.join(this.reportDir, reportFiles[0]);
      return JSON.parse(fs.readFileSync(latestFile, 'utf8'));
      
    } catch (error) {
      console.error('❌ Failed to load latest report:', error.message);
      return null;
    }
  }

  analyzeTrends() {
    try {
      const historyFiles = fs.readdirSync(this.historyDir)
        .filter(file => file.endsWith('.json'))
        .sort()
        .reverse();
      
      if (historyFiles.length < 2) {
        return { insufficient_data: true };
      }
      
      // Get data from the last N days
      const cutoffDate = Date.now() - (this.config.trending.lookbackDays * 24 * 60 * 60 * 1000);
      
      const recentHistory = historyFiles
        .map(file => {
          const filePath = path.join(this.historyDir, file);
          try {
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            data.timestamp_ms = parseInt(path.parse(file).name);
            return data;
          } catch (error) {
            return null;
          }
        })
        .filter(data => data && data.timestamp_ms > cutoffDate)
        .sort((a, b) => a.timestamp_ms - b.timestamp_ms);
      
      if (recentHistory.length < 2) {
        return { insufficient_data: true };
      }
      
      return this.calculateTrends(recentHistory);
      
    } catch (error) {
      console.error('❌ Failed to analyze trends:', error.message);
      return { error: error.message };
    }
  }

  calculateTrends(history) {
    const latest = history[history.length - 1];
    const baseline = history[0];
    
    const trends = {
      period_days: Math.ceil((latest.timestamp_ms - baseline.timestamp_ms) / (24 * 60 * 60 * 1000)),
      data_points: history.length,
      metrics: {}
    };
    
    // Calculate percentage change for key metrics
    const metrics = [
      'totalDebtIssues',
      'criticalIssues',
      'highPriorityIssues',
      'testCoveragePercentage',
      'bundleSizeMB',
      'debtScore'
    ];
    
    metrics.forEach(metric => {
      const latestValue = latest.summary?.[metric] || 0;
      const baselineValue = baseline.summary?.[metric] || 0;
      
      if (baselineValue !== 0) {
        const percentChange = ((latestValue - baselineValue) / baselineValue) * 100;
        trends.metrics[metric] = {
          current: latestValue,
          baseline: baselineValue,
          change: latestValue - baselineValue,
          percentChange: Math.round(percentChange * 100) / 100,
          improving: this.isImprovingMetric(metric, percentChange)
        };
      } else {
        trends.metrics[metric] = {
          current: latestValue,
          baseline: baselineValue,
          change: latestValue,
          percentChange: null,
          improving: null
        };
      }
    });
    
    return trends;
  }

  isImprovingMetric(metric, percentChange) {
    // Lower values are better for these metrics
    const lowerIsBetter = [
      'totalDebtIssues',
      'criticalIssues', 
      'highPriorityIssues',
      'bundleSizeMB',
      'debtScore'
    ];
    
    // Higher values are better for these metrics  
    const higherIsBetter = [
      'testCoveragePercentage'
    ];
    
    if (lowerIsBetter.includes(metric)) {
      return percentChange < 0;
    } else if (higherIsBetter.includes(metric)) {
      return percentChange > 0;
    }
    
    return null;
  }

  checkThresholds(report, trends) {
    const alerts = [];
    const summary = report.summary;
    const thresholds = this.config.thresholds;
    
    // Check debt score thresholds
    if (summary.debtScore >= thresholds.debtScore.critical) {
      alerts.push({
        level: 'critical',
        metric: 'debtScore',
        current: summary.debtScore,
        threshold: thresholds.debtScore.critical,
        message: `Technical debt score (${summary.debtScore}) exceeds critical threshold (${thresholds.debtScore.critical})`
      });
    } else if (summary.debtScore >= thresholds.debtScore.warning) {
      alerts.push({
        level: 'warning',
        metric: 'debtScore',
        current: summary.debtScore,
        threshold: thresholds.debtScore.warning,
        message: `Technical debt score (${summary.debtScore}) exceeds warning threshold (${thresholds.debtScore.warning})`
      });
    }
    
    // Check critical issues
    if (summary.criticalIssues >= thresholds.criticalIssues.critical) {
      alerts.push({
        level: 'critical',
        metric: 'criticalIssues',
        current: summary.criticalIssues,
        threshold: thresholds.criticalIssues.critical,
        message: `Critical issues (${summary.criticalIssues}) exceed critical threshold (${thresholds.criticalIssues.critical})`
      });
    } else if (summary.criticalIssues >= thresholds.criticalIssues.warning) {
      alerts.push({
        level: 'warning',
        metric: 'criticalIssues',
        current: summary.criticalIssues,
        threshold: thresholds.criticalIssues.warning,
        message: `Critical issues (${summary.criticalIssues}) exceed warning threshold (${thresholds.criticalIssues.warning})`
      });
    }
    
    // Check total ESLint issues
    if (summary.totalDebtIssues >= thresholds.eslintIssues.critical) {
      alerts.push({
        level: 'critical',
        metric: 'eslintIssues',
        current: summary.totalDebtIssues,
        threshold: thresholds.eslintIssues.critical,
        message: `ESLint issues (${summary.totalDebtIssues}) exceed critical threshold (${thresholds.eslintIssues.critical})`
      });
    } else if (summary.totalDebtIssues >= thresholds.eslintIssues.warning) {
      alerts.push({
        level: 'warning',
        metric: 'eslintIssues', 
        current: summary.totalDebtIssues,
        threshold: thresholds.eslintIssues.warning,
        message: `ESLint issues (${summary.totalDebtIssues}) exceed warning threshold (${thresholds.eslintIssues.warning})`
      });
    }
    
    // Check test coverage
    if (summary.testCoveragePercentage < thresholds.testCoverage.critical) {
      alerts.push({
        level: 'critical',
        metric: 'testCoverage',
        current: summary.testCoveragePercentage,
        threshold: thresholds.testCoverage.critical,
        message: `Test coverage (${summary.testCoveragePercentage.toFixed(1)}%) below critical threshold (${thresholds.testCoverage.critical}%)`
      });
    } else if (summary.testCoveragePercentage < thresholds.testCoverage.warning) {
      alerts.push({
        level: 'warning',
        metric: 'testCoverage',
        current: summary.testCoveragePercentage,
        threshold: thresholds.testCoverage.warning,
        message: `Test coverage (${summary.testCoveragePercentage.toFixed(1)}%) below warning threshold (${thresholds.testCoverage.warning}%)`
      });
    }
    
    // Check bundle size
    if (summary.bundleSizeMB >= thresholds.bundleSize.critical) {
      alerts.push({
        level: 'critical',
        metric: 'bundleSize',
        current: summary.bundleSizeMB,
        threshold: thresholds.bundleSize.critical,
        message: `Bundle size (${summary.bundleSizeMB}MB) exceeds critical threshold (${thresholds.bundleSize.critical}MB)`
      });
    } else if (summary.bundleSizeMB >= thresholds.bundleSize.warning) {
      alerts.push({
        level: 'warning',
        metric: 'bundleSize',
        current: summary.bundleSizeMB,
        threshold: thresholds.bundleSize.warning,
        message: `Bundle size (${summary.bundleSizeMB}MB) exceeds warning threshold (${thresholds.bundleSize.warning}MB)`
      });
    }
    
    // Check trending alerts
    if (!trends.insufficient_data && !trends.error && this.config.trending.alertOnIncreasingTrend) {
      const trendAlerts = this.checkTrendAlerts(trends);
      alerts.push(...trendAlerts);
    }
    
    return alerts;
  }

  checkTrendAlerts(trends) {
    const alerts = [];
    const threshold = this.config.trending.trendThreshold;
    
    // Check for concerning trends
    Object.entries(trends.metrics).forEach(([metric, data]) => {
      if (data.percentChange !== null && !data.improving) {
        const absChange = Math.abs(data.percentChange);
        if (absChange >= (threshold * 100)) {
          alerts.push({
            level: 'warning',
            metric: `${metric}_trend`,
            current: data.current,
            change: data.percentChange,
            message: `${metric} is trending worse: ${data.percentChange > 0 ? '+' : ''}${data.percentChange}% over ${trends.period_days} days`
          });
        }
      }
    });
    
    return alerts;
  }

  async processNotifications(alerts, report, trends) {
    if (alerts.length === 0) {
      return;
    }
    
    const notifications = this.config.notifications;
    
    if (notifications.console) {
      this.sendConsoleNotifications(alerts);
    }
    
    if (notifications.file) {
      this.sendFileNotifications(alerts, report, trends);
    }
    
    if (notifications.github && process.env.GITHUB_ACTIONS) {
      this.sendGitHubNotifications(alerts);
    }
    
    // Additional notification methods can be added here
  }

  sendConsoleNotifications(alerts) {
    console.log('\n🚨 TECHNICAL DEBT ALERTS');
    console.log('=' + '='.repeat(50));
    
    alerts.forEach((alert, index) => {
      const icon = alert.level === 'critical' ? '🔥' : '⚠️';
      console.log(`${icon} ${alert.level.toUpperCase()}: ${alert.message}`);
    });
  }

  sendFileNotifications(alerts, report, trends) {
    const alertsFile = path.join(this.reportDir, 'latest-alerts.json');
    const alertData = {
      timestamp: new Date().toISOString(),
      alerts: alerts,
      summary: report.summary,
      trends: trends
    };
    
    fs.writeFileSync(alertsFile, JSON.stringify(alertData, null, 2));
  }

  sendGitHubNotifications(alerts) {
    // GitHub Actions workflow commands
    const criticalAlerts = alerts.filter(alert => alert.level === 'critical');
    const warningAlerts = alerts.filter(alert => alert.level === 'warning');
    
    criticalAlerts.forEach(alert => {
      console.log(`::error title=Technical Debt Critical::${alert.message}`);
    });
    
    warningAlerts.forEach(alert => {
      console.log(`::warning title=Technical Debt Warning::${alert.message}`);
    });
    
    // Set output for use in subsequent workflow steps
    if (criticalAlerts.length > 0) {
      console.log(`::set-output name=debt-critical::${criticalAlerts.length}`);
    }
    if (warningAlerts.length > 0) {
      console.log(`::set-output name=debt-warnings::${warningAlerts.length}`);
    }
  }

  generateMonitoringSummary(report, trends, alerts) {
    console.log('\n📊 MONITORING SUMMARY');
    console.log('=' + '='.repeat(50));
    
    const summary = report.summary;
    console.log(`Overall Health: ${report.metrics.overallHealthScore}/100`);
    console.log(`Debt Score: ${summary.debtScore}/100`);
    console.log(`Total Issues: ${summary.totalDebtIssues} (${summary.criticalIssues} critical)`);
    console.log(`Test Coverage: ${summary.testCoveragePercentage.toFixed(1)}%`);
    
    if (!trends.insufficient_data && !trends.error) {
      console.log('\n📈 TRENDS (' + trends.period_days + ' days)');
      console.log('-'.repeat(30));
      
      Object.entries(trends.metrics).forEach(([metric, data]) => {
        if (data.percentChange !== null) {
          const trendIcon = data.improving ? '📈' : '📉';
          const changeStr = data.percentChange > 0 ? '+' + data.percentChange : data.percentChange;
          console.log(`${trendIcon} ${metric}: ${changeStr}%`);
        }
      });
    }
    
    if (alerts.length > 0) {
      const criticalCount = alerts.filter(a => a.level === 'critical').length;
      const warningCount = alerts.filter(a => a.level === 'warning').length;
      
      console.log(`\n🚨 ACTIVE ALERTS: ${alerts.length}`);
      console.log(`   Critical: ${criticalCount}, Warnings: ${warningCount}`);
    } else {
      console.log('\n✅ No alerts - all metrics within thresholds');
    }
  }

  async generateCIConfig() {
    const ciConfig = {
      'github-actions': {
        workflow: `
name: Technical Debt Monitoring

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]
  schedule:
    - cron: '0 9 * * 1' # Weekly on Mondays at 9 AM

jobs:
  debt-analysis:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run Technical Debt Analysis
        id: debt-analysis
        run: |
          cd frontend
          node scripts/debt-monitor.js
          
      - name: Upload Reports
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: technical-debt-reports
          path: frontend/reports/technical-debt/
          
      - name: Comment on PR
        if: github.event_name == 'pull_request' && steps.debt-analysis.outputs.debt-critical
        uses: actions/github-script@v7
        with:
          script: |
            const criticalCount = process.env.DEBT_CRITICAL || '0';
            const warningCount = process.env.DEBT_WARNINGS || '0';
            
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: \`⚠️ **Technical Debt Alert**
              
This PR introduces technical debt concerns:
- Critical issues: \${criticalCount}
- Warning issues: \${warningCount}

Please review the technical debt report and consider addressing these issues before merging.\`
            });
`
      }
    };
    
    const outputFile = path.join(this.reportDir, 'ci-integration.yml');
    fs.writeFileSync(outputFile, ciConfig['github-actions'].workflow);
    
    console.log(`\n🔧 CI/CD Integration config generated: ${outputFile}`);
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];
  const monitor = new TechnicalDebtMonitor();
  
  switch (command) {
    case 'init':
      console.log('🚀 Initializing Technical Debt Monitor...');
      monitor.saveConfig(monitor.defaultConfig);
      monitor.generateCIConfig();
      console.log('✅ Monitor initialized successfully');
      console.log(`📄 Configuration saved to: ${monitor.configFile}`);
      break;
      
    case 'run':
    default:
      monitor.monitor().then(exitCode => {
        process.exit(exitCode);
      }).catch(error => {
        console.error('❌ Monitor failed:', error.message);
        process.exit(1);
      });
      break;
  }
}

export default TechnicalDebtMonitor;