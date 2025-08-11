#!/usr/bin/env node

/**
 * Visual Baseline Management Tool
 * 
 * This script manages visual regression test baselines for the NeoForge playground.
 * It can update, validate, and organize baseline images for consistent testing.
 * 
 * Usage:
 *   node manage-visual-baselines.js update [component-name]
 *   node manage-visual-baselines.js validate
 *   node manage-visual-baselines.js clean
 *   node manage-visual-baselines.js organize
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const baselinesDir = path.join(projectRoot, 'src/test/visual/baselines');
const testResultsDir = path.join(projectRoot, 'test-results/visual-artifacts');

class VisualBaselineManager {
  constructor() {
    this.componentRegistry = {
      atoms: [
        'badge', 'button', 'checkbox', 'dropdown', 'input', 'radio', 'spinner'
      ],
      molecules: [
        'breadcrumbs', 'date-picker', 'language-selector', 'phone-input', 'select', 'tabs'
      ],
      organisms: [
        'charts', 'data-table', 'file-upload', 'form', 'form-validation',
        'neo-data-grid', 'neo-form-builder', 'neo-table', 'pagination', 'rich-text-editor'
      ],
      pages: [
        'blog-page', 'community-page', 'components-page', 'contact-page', 'dashboard-page',
        'docs-page', 'examples-page', 'home-page', 'landing-page', 'login-page',
        'not-found-page', 'profile-page', 'settings-page', 'status-page', 'tutorials-page'
      ]
    };
    
    this.testStates = ['default', 'hover', 'focus', 'disabled', 'error', 'loading', 'with-props', 'mobile'];
    this.themes = ['light', 'dark', 'auto'];
    this.a11yVariations = ['high-contrast', 'large-text'];
  }

  async ensureDirectories() {
    try {
      await fs.mkdir(baselinesDir, { recursive: true });
      
      // Create organized subdirectories
      for (const category of Object.keys(this.componentRegistry)) {
        await fs.mkdir(path.join(baselinesDir, category), { recursive: true });
      }
      
      await fs.mkdir(path.join(baselinesDir, 'themes'), { recursive: true });
      await fs.mkdir(path.join(baselinesDir, 'accessibility'), { recursive: true });
      
      console.log('✅ Baseline directories created');
    } catch (error) {
      console.error('❌ Error creating directories:', error.message);
      throw error;
    }
  }

  async updateBaselines(specificComponent = null) {
    console.log('🔄 Updating visual baselines...');
    
    try {
      // Ensure directories exist
      await this.ensureDirectories();
      
      // Run Playwright visual tests with --update-snapshots
      const command = specificComponent 
        ? `npx playwright test --config=playwright.visual.config.js --update-snapshots --grep="${specificComponent}"`
        : 'npx playwright test --config=playwright.visual.config.js --update-snapshots';
      
      console.log(`Running: ${command}`);
      execSync(command, { 
        stdio: 'inherit', 
        cwd: projectRoot 
      });
      
      // Organize updated baselines
      await this.organizeBaselines();
      
      console.log('✅ Baselines updated successfully');
      
      // Generate baseline report
      await this.generateBaselineReport();
      
    } catch (error) {
      console.error('❌ Error updating baselines:', error.message);
      throw error;
    }
  }

  async validateBaselines() {
    console.log('🔍 Validating visual baselines...');
    
    const issues = [];
    const allComponents = Object.values(this.componentRegistry).flat();
    
    for (const component of allComponents) {
      // Check for missing baseline images
      const expectedBaselines = this.getExpectedBaselines(component);
      
      for (const baseline of expectedBaselines) {
        const baselinePath = path.join(baselinesDir, baseline);
        
        try {
          await fs.access(baselinePath);
        } catch (error) {
          issues.push({
            type: 'missing',
            component,
            baseline,
            path: baselinePath
          });
        }
      }
    }
    
    // Check for orphaned baseline images
    const orphanedBaselines = await this.findOrphanedBaselines();
    issues.push(...orphanedBaselines);
    
    // Report validation results
    if (issues.length === 0) {
      console.log('✅ All baselines are valid');
      return true;
    } else {
      console.log(`❌ Found ${issues.length} baseline issues:`);
      
      for (const issue of issues) {
        switch (issue.type) {
          case 'missing':
            console.log(`  📄 Missing: ${issue.component} - ${issue.baseline}`);
            break;
          case 'orphaned':
            console.log(`  🗑️  Orphaned: ${issue.path}`);
            break;
        }
      }
      
      return false;
    }
  }

  async cleanBaselines() {
    console.log('🧹 Cleaning baseline directories...');
    
    try {
      // Find and remove orphaned baselines
      const orphanedBaselines = await this.findOrphanedBaselines();
      
      for (const orphaned of orphanedBaselines) {
        await fs.unlink(orphaned.path);
        console.log(`🗑️ Removed orphaned baseline: ${orphaned.path}`);
      }
      
      // Remove empty directories
      await this.removeEmptyDirectories(baselinesDir);
      
      console.log(`✅ Cleaned ${orphanedBaselines.length} orphaned baselines`);
      
    } catch (error) {
      console.error('❌ Error cleaning baselines:', error.message);
      throw error;
    }
  }

  async organizeBaselines() {
    console.log('📁 Organizing baseline images...');
    
    try {
      const testResultsBaselines = path.join(testResultsDir, 'test-results');
      
      // Check if test results directory exists
      try {
        await fs.access(testResultsBaselines);
      } catch (error) {
        console.log('ℹ️  No test results to organize');
        return;
      }
      
      // Move baselines to organized structure
      const files = await this.getAllFiles(testResultsBaselines);
      
      for (const file of files) {
        if (file.endsWith('.png') && file.includes('baseline')) {
          await this.moveBaselineToOrganizedLocation(file);
        }
      }
      
      console.log('✅ Baselines organized');
      
    } catch (error) {
      console.error('❌ Error organizing baselines:', error.message);
      throw error;
    }
  }

  async generateBaselineReport() {
    console.log('📊 Generating baseline report...');
    
    const report = {
      timestamp: new Date().toISOString(),
      components: {},
      summary: {
        totalComponents: 0,
        totalBaselines: 0,
        missingBaselines: 0,
        orphanedBaselines: 0
      }
    };
    
    // Analyze each component
    const allComponents = Object.values(this.componentRegistry).flat();
    report.summary.totalComponents = allComponents.length;
    
    for (const component of allComponents) {
      const expectedBaselines = this.getExpectedBaselines(component);
      const existingBaselines = await this.getExistingBaselines(component);
      
      report.components[component] = {
        expected: expectedBaselines.length,
        existing: existingBaselines.length,
        missing: expectedBaselines.filter(b => !existingBaselines.includes(b)),
        coverage: Math.round((existingBaselines.length / expectedBaselines.length) * 100)
      };
      
      report.summary.totalBaselines += existingBaselines.length;
      report.summary.missingBaselines += report.components[component].missing.length;
    }
    
    // Find orphaned baselines
    const orphaned = await this.findOrphanedBaselines();
    report.summary.orphanedBaselines = orphaned.length;
    
    // Write report to file
    const reportPath = path.join(projectRoot, 'test-results/visual-baseline-report.json');
    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    // Generate summary
    console.log('📊 Baseline Coverage Summary:');
    console.log(`  📦 Total Components: ${report.summary.totalComponents}`);
    console.log(`  📸 Total Baselines: ${report.summary.totalBaselines}`);
    console.log(`  ❌ Missing Baselines: ${report.summary.missingBaselines}`);
    console.log(`  🗑️ Orphaned Baselines: ${report.summary.orphanedBaselines}`);
    
    const overallCoverage = Math.round((report.summary.totalBaselines / (report.summary.totalBaselines + report.summary.missingBaselines)) * 100);
    console.log(`  ✅ Overall Coverage: ${overallCoverage}%`);
    
    return report;
  }

  getExpectedBaselines(component) {
    const baselines = [];
    
    // Standard states
    for (const state of this.testStates) {
      baselines.push(`${component}-${state}.png`);
    }
    
    // Theme variations for sample components
    const sampleComponents = ['button', 'form', 'data-table', 'dashboard-page'];
    if (sampleComponents.includes(component)) {
      for (const theme of this.themes) {
        baselines.push(`${component}-${theme}-theme.png`);
      }
    }
    
    // Accessibility variations for relevant components
    const a11yComponents = ['button', 'form', 'input', 'tabs', 'data-table'];
    if (a11yComponents.includes(component)) {
      for (const variation of this.a11yVariations) {
        baselines.push(`${component}-${variation}.png`);
      }
    }
    
    return baselines;
  }

  async getExistingBaselines(component) {
    const baselines = [];
    
    try {
      const files = await this.getAllFiles(baselinesDir);
      
      for (const file of files) {
        if (file.includes(component) && file.endsWith('.png')) {
          baselines.push(path.basename(file));
        }
      }
    } catch (error) {
      // Directory might not exist yet
    }
    
    return baselines;
  }

  async findOrphanedBaselines() {
    const orphaned = [];
    const allComponents = Object.values(this.componentRegistry).flat();
    
    try {
      const files = await this.getAllFiles(baselinesDir);
      
      for (const file of files) {
        if (!file.endsWith('.png')) continue;
        
        const filename = path.basename(file);
        let isOrphaned = true;
        
        // Check if this baseline belongs to any known component
        for (const component of allComponents) {
          if (filename.includes(component)) {
            isOrphaned = false;
            break;
          }
        }
        
        if (isOrphaned) {
          orphaned.push({
            type: 'orphaned',
            path: file
          });
        }
      }
    } catch (error) {
      // Directory might not exist yet
    }
    
    return orphaned;
  }

  async moveBaselineToOrganizedLocation(sourceFile) {
    const filename = path.basename(sourceFile);
    const allComponents = Object.values(this.componentRegistry).flat();
    
    // Find which component this baseline belongs to
    let targetDir = baselinesDir;
    
    for (const [category, components] of Object.entries(this.componentRegistry)) {
      for (const component of components) {
        if (filename.includes(component)) {
          targetDir = path.join(baselinesDir, category);
          break;
        }
      }
    }
    
    // Handle theme and a11y variations
    if (filename.includes('-theme.png')) {
      targetDir = path.join(baselinesDir, 'themes');
    } else if (filename.includes('-high-contrast.png') || filename.includes('-large-text.png')) {
      targetDir = path.join(baselinesDir, 'accessibility');
    }
    
    // Ensure target directory exists
    await fs.mkdir(targetDir, { recursive: true });
    
    // Move file
    const targetPath = path.join(targetDir, filename);
    await fs.rename(sourceFile, targetPath);
  }

  async getAllFiles(dir) {
    const files = [];
    
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          const subFiles = await this.getAllFiles(fullPath);
          files.push(...subFiles);
        } else {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Directory might not exist
    }
    
    return files;
  }

  async removeEmptyDirectories(dir) {
    try {
      const entries = await fs.readdir(dir);
      
      // Recursively remove empty subdirectories
      for (const entry of entries) {
        const fullPath = path.join(dir, entry);
        const stat = await fs.stat(fullPath);
        
        if (stat.isDirectory()) {
          await this.removeEmptyDirectories(fullPath);
          
          // Check if directory is now empty
          const subEntries = await fs.readdir(fullPath);
          if (subEntries.length === 0) {
            await fs.rmdir(fullPath);
            console.log(`🗑️ Removed empty directory: ${fullPath}`);
          }
        }
      }
    } catch (error) {
      // Directory might not exist or might not be empty
    }
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const componentName = args[1];
  
  const manager = new VisualBaselineManager();
  
  try {
    switch (command) {
      case 'update':
        await manager.updateBaselines(componentName);
        break;
        
      case 'validate':
        const isValid = await manager.validateBaselines();
        process.exit(isValid ? 0 : 1);
        break;
        
      case 'clean':
        await manager.cleanBaselines();
        break;
        
      case 'organize':
        await manager.organizeBaselines();
        break;
        
      case 'report':
        await manager.generateBaselineReport();
        break;
        
      default:
        console.log(`
Usage: node manage-visual-baselines.js <command> [options]

Commands:
  update [component]   Update visual baselines (optionally for specific component)
  validate            Validate baseline completeness and consistency
  clean               Remove orphaned baseline images
  organize            Organize baselines into structured directories  
  report              Generate baseline coverage report

Examples:
  node manage-visual-baselines.js update
  node manage-visual-baselines.js update button
  node manage-visual-baselines.js validate
  node manage-visual-baselines.js clean
        `);
        process.exit(1);
    }
  } catch (error) {
    console.error('❌ Command failed:', error.message);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { VisualBaselineManager };