#!/usr/bin/env node

/**
 * Bundle Size Monitoring Script for NeoForge Component Library
 * 
 * Features:
 * - Analyzes bundle sizes after build
 * - Compares against performance targets
 * - Generates size reports with recommendations
 * - CI/CD integration for size regression detection
 * - Component-level size breakdown
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { readdir, stat } from 'fs/promises';
import { join, extname } from 'path';
import { gzip } from 'zlib';
import { promisify } from 'util';

const gzipAsync = promisify(gzip);

// Performance targets in bytes
const PERFORMANCE_TARGETS = {
  total: {
    js: 50 * 1024,      // 50KB total JS
    css: 5 * 1024,      // 5KB total CSS  
    critical: 50 * 1024  // 50KB critical path
  },
  atoms: 5 * 1024,      // 5KB per atom component
  molecules: 15 * 1024,  // 15KB per molecule
  organisms: 30 * 1024,  // 30KB per organism
  vendor: 30 * 1024     // 30KB vendor bundle
};

class BundleSizeMonitor {
  constructor(distPath = './dist', reportPath = './bundle-size-report.json') {
    this.distPath = distPath;
    this.reportPath = reportPath;
    this.assets = [];
    this.report = {
      timestamp: new Date().toISOString(),
      performance: 'unknown',
      totalSize: 0,
      gzipSize: 0,
      assets: [],
      violations: [],
      recommendations: [],
      comparison: null
    };
  }

  /**
   * Get file size in bytes
   */
  async getFileSize(filePath) {
    try {
      const stats = await stat(filePath);
      return stats.size;
    } catch (error) {
      console.warn(`Could not get size for ${filePath}:`, error.message);
      return 0;
    }
  }

  /**
   * Get gzipped size of file
   */
  async getGzipSize(filePath) {
    try {
      const content = readFileSync(filePath);
      const gzipped = await gzipAsync(content);
      return gzipped.length;
    } catch (error) {
      console.warn(`Could not gzip ${filePath}:`, error.message);
      return 0;
    }
  }

  /**
   * Analyze all assets in dist directory
   */
  async analyzeAssets() {
    if (!existsSync(this.distPath)) {
      throw new Error(`Dist directory not found: ${this.distPath}`);
    }

    const assetsDir = join(this.distPath, 'assets');
    if (!existsSync(assetsDir)) {
      throw new Error(`Assets directory not found: ${assetsDir}`);
    }

    const files = await readdir(assetsDir);
    
    for (const file of files) {
      const filePath = join(assetsDir, file);
      const ext = extname(file).toLowerCase();
      
      if (ext === '.js' || ext === '.css') {
        const size = await this.getFileSize(filePath);
        const gzipSize = await this.getGzipSize(filePath);
        
        const asset = {
          name: file,
          path: filePath,
          type: ext.slice(1),
          size,
          gzipSize,
          category: this.categorizeAsset(file)
        };
        
        this.assets.push(asset);
        this.report.assets.push(asset);
      }
    }

    // Sort by size (descending)
    this.assets.sort((a, b) => b.size - a.size);
  }

  /**
   * Categorize asset based on filename
   */
  categorizeAsset(filename) {
    if (filename.includes('vendor')) return 'vendor';
    if (filename.includes('main')) return 'main';
    if (filename.includes('app-core')) return 'core';
    if (filename.includes('components-atoms')) return 'atoms';
    if (filename.includes('components-molecules')) return 'molecules';
    if (filename.includes('components-organisms')) return 'organisms';
    if (filename.includes('services')) return 'services';
    if (filename.includes('utils')) return 'utils';
    return 'other';
  }

  /**
   * Calculate total sizes by type and category
   */
  calculateTotals() {
    const totals = {
      js: { size: 0, gzipSize: 0, count: 0 },
      css: { size: 0, gzipSize: 0, count: 0 },
      categories: {}
    };

    for (const asset of this.assets) {
      // By file type
      totals[asset.type].size += asset.size;
      totals[asset.type].gzipSize += asset.gzipSize;
      totals[asset.type].count++;

      // By category
      if (!totals.categories[asset.category]) {
        totals.categories[asset.category] = { size: 0, gzipSize: 0, count: 0 };
      }
      totals.categories[asset.category].size += asset.size;
      totals.categories[asset.category].gzipSize += asset.gzipSize;
      totals.categories[asset.category].count++;
    }

    this.report.totalSize = totals.js.size + totals.css.size;
    this.report.gzipSize = totals.js.gzipSize + totals.css.gzipSize;
    this.report.totals = totals;

    return totals;
  }

  /**
   * Check performance against targets
   */
  checkPerformance() {
    const totals = this.report.totals;
    const violations = [];
    const recommendations = [];

    // Check total JS size
    if (totals.js.size > PERFORMANCE_TARGETS.total.js) {
      const excess = totals.js.size - PERFORMANCE_TARGETS.total.js;
      const percentOver = Math.round((excess / PERFORMANCE_TARGETS.total.js) * 100);
      violations.push({
        type: 'total_js_size',
        severity: 'high',
        message: `Total JS size ${this.formatBytes(totals.js.size)} exceeds target ${this.formatBytes(PERFORMANCE_TARGETS.total.js)} by ${percentOver}%`,
        excess,
        target: PERFORMANCE_TARGETS.total.js,
        actual: totals.js.size
      });
      
      recommendations.push({
        type: 'js_optimization',
        priority: 'high',
        message: 'Consider code splitting, tree shaking, or component lazy loading',
        potentialSavings: Math.round(excess * 0.3) // Estimated 30% reduction possible
      });
    }

    // Check total CSS size  
    if (totals.css.size > PERFORMANCE_TARGETS.total.css) {
      const excess = totals.css.size - PERFORMANCE_TARGETS.total.css;
      const percentOver = Math.round((excess / PERFORMANCE_TARGETS.total.css) * 100);
      violations.push({
        type: 'total_css_size',
        severity: 'medium',
        message: `Total CSS size ${this.formatBytes(totals.css.size)} exceeds target ${this.formatBytes(PERFORMANCE_TARGETS.total.css)} by ${percentOver}%`,
        excess,
        target: PERFORMANCE_TARGETS.total.css,
        actual: totals.css.size
      });

      recommendations.push({
        type: 'css_optimization',
        priority: 'medium', 
        message: 'Consider CSS purging, critical CSS extraction, or component-specific styles',
        potentialSavings: Math.round(excess * 0.4) // Estimated 40% reduction possible
      });
    }

    // Check vendor bundle size
    const vendorCategory = totals.categories.vendor;
    if (vendorCategory && vendorCategory.size > PERFORMANCE_TARGETS.vendor) {
      const excess = vendorCategory.size - PERFORMANCE_TARGETS.vendor;
      recommendations.push({
        type: 'vendor_optimization',
        priority: 'low',
        message: `Vendor bundle is large (${this.formatBytes(vendorCategory.size)}). Consider splitting or updating dependencies.`,
        potentialSavings: Math.round(excess * 0.2)
      });
    }

    // Overall performance assessment
    const totalExcess = Math.max(0, this.report.totalSize - PERFORMANCE_TARGETS.total.critical);
    if (totalExcess === 0) {
      this.report.performance = 'excellent';
    } else if (totalExcess < PERFORMANCE_TARGETS.total.critical * 0.1) {
      this.report.performance = 'good';
    } else if (totalExcess < PERFORMANCE_TARGETS.total.critical * 0.25) {
      this.report.performance = 'needs_improvement';
    } else {
      this.report.performance = 'poor';
    }

    this.report.violations = violations;
    this.report.recommendations = recommendations;
  }

  /**
   * Compare with previous report
   */
  compareWithPrevious() {
    try {
      const previousReport = JSON.parse(readFileSync(this.reportPath, 'utf8'));
      const sizeDiff = this.report.totalSize - previousReport.totalSize;
      const gzipDiff = this.report.gzipSize - previousReport.gzipSize;
      
      this.report.comparison = {
        previousSize: previousReport.totalSize,
        previousGzipSize: previousReport.gzipSize,
        sizeDiff,
        gzipDiff,
        percentChange: previousReport.totalSize > 0 ? 
          Math.round((sizeDiff / previousReport.totalSize) * 100) : 0,
        trend: sizeDiff > 1024 ? 'increased' : sizeDiff < -1024 ? 'decreased' : 'stable'
      };
    } catch (error) {
      // No previous report or error reading it
      this.report.comparison = null;
    }
  }

  /**
   * Format bytes to human readable string
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Generate detailed report
   */
  generateReport() {
    console.log('\n📊 Bundle Size Analysis Report');
    console.log('=' .repeat(50));
    
    // Overall summary
    console.log(`\n🎯 Performance: ${this.report.performance.toUpperCase()}`);
    console.log(`📦 Total Size: ${this.formatBytes(this.report.totalSize)}`);
    console.log(`🗜️  Gzipped: ${this.formatBytes(this.report.gzipSize)}`);
    
    if (this.report.comparison) {
      const diff = this.report.comparison.sizeDiff;
      const icon = diff > 0 ? '📈' : diff < 0 ? '📉' : '📊';
      const sign = diff > 0 ? '+' : '';
      console.log(`${icon} Change: ${sign}${this.formatBytes(Math.abs(diff))} (${this.report.comparison.percentChange}%)`);
    }

    // Violations
    if (this.report.violations.length > 0) {
      console.log('\n🚨 Performance Violations:');
      this.report.violations.forEach(violation => {
        const severity = violation.severity === 'high' ? '🔴' : violation.severity === 'medium' ? '🟡' : '🟢';
        console.log(`   ${severity} ${violation.message}`);
      });
    }

    // Top assets
    console.log('\n📋 Largest Assets:');
    this.assets.slice(0, 8).forEach(asset => {
      console.log(`   ${asset.name.padEnd(30)} ${this.formatBytes(asset.size).padStart(8)} (${asset.category})`);
    });

    // Recommendations
    if (this.report.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      this.report.recommendations.forEach((rec, i) => {
        const priority = rec.priority === 'high' ? '🔥' : rec.priority === 'medium' ? '⚡' : '💎';
        console.log(`   ${priority} ${rec.message}`);
        if (rec.potentialSavings) {
          console.log(`      Potential savings: ${this.formatBytes(rec.potentialSavings)}`);
        }
      });
    }

    // Category breakdown
    console.log('\n📁 Size by Category:');
    Object.entries(this.report.totals.categories).forEach(([category, totals]) => {
      console.log(`   ${category.padEnd(15)} ${this.formatBytes(totals.size).padStart(8)} (${totals.count} files)`);
    });

    console.log('\n' + '='.repeat(50));
  }

  /**
   * Save report to file
   */
  saveReport() {
    writeFileSync(this.reportPath, JSON.stringify(this.report, null, 2));
    console.log(`\n💾 Report saved to: ${this.reportPath}`);
  }

  /**
   * Check if build meets CI requirements
   */
  checkCI() {
    const hasHighViolations = this.report.violations.some(v => v.severity === 'high');
    const hasRegression = this.report.comparison?.sizeDiff > 5 * 1024; // 5KB regression threshold
    
    if (hasHighViolations) {
      console.error('\n❌ Build failed: Bundle size exceeds performance targets');
      process.exit(1);
    }
    
    if (hasRegression) {
      console.error('\n❌ Build failed: Significant size regression detected');
      process.exit(1);
    }
    
    console.log('\n✅ Bundle size check passed');
  }

  /**
   * Run complete analysis
   */
  async run(options = {}) {
    try {
      console.log('🔍 Analyzing bundle sizes...');
      
      await this.analyzeAssets();
      this.calculateTotals();
      this.checkPerformance();
      this.compareWithPrevious();
      this.generateReport();
      this.saveReport();
      
      if (options.ci) {
        this.checkCI();
      }
    } catch (error) {
      console.error('❌ Bundle analysis failed:', error.message);
      process.exit(1);
    }
  }
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const monitor = new BundleSizeMonitor();
  const isCI = process.argv.includes('--ci');
  await monitor.run({ ci: isCI });
}

export default BundleSizeMonitor;