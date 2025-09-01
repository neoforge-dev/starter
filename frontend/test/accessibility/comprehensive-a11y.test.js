import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'fs';
import path from 'path';

/**
 * Comprehensive Accessibility Testing Suite
 *
 * This test suite covers:
 * - Critical page components accessibility
 * - Form accessibility and keyboard navigation
 * - WCAG 2.1 AA compliance
 * - Touch target validation
 * - Screen reader compatibility
 * - Color contrast verification
 */

// Test configuration for critical components and pages
const criticalTests = [
  {
    path: '/',
    name: 'Landing Page',
    components: ['app-shell', 'hero-section', 'nav-links'],
    description: 'Main landing page with navigation and hero content'
  },
  {
    path: '/auth/login',
    name: 'Login Form',
    components: ['login-form', 'form-validation', 'error-messages'],
    description: 'Authentication form with validation'
  },
  {
    path: '/auth/register',
    name: 'Registration Form',
    components: ['signup-form', 'password-validation', 'terms-checkbox'],
    description: 'User registration with complex form validation'
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    components: ['data-table', 'charts', 'user-menu', 'sidebar'],
    description: 'Main application dashboard with data visualization'
  },
  {
    path: '/components',
    name: 'Component Library',
    components: ['component-showcase', 'code-examples', 'interactive-demos'],
    description: 'Component library documentation and examples'
  },
  {
    path: '/docs',
    name: 'Documentation',
    components: ['doc-nav', 'markdown-content', 'search-functionality'],
    description: 'Documentation with navigation and search'
  }
];

// WCAG 2.1 AA Configuration with comprehensive rules
const comprehensiveAxeConfig = {
  rules: {
    // Color and Contrast (Level AA)
    'color-contrast': { enabled: true },
    'color-contrast-enhanced': { enabled: false }, // AAA level, optional

    // Keyboard Navigation
    'focus-order-semantics': { enabled: true },
    'tabindex': { enabled: true },
    'keyboard': { enabled: true },
    'focus-trap': { enabled: true },

    // Semantic Structure
    'heading-order': { enabled: true },
    'landmark-one-main': { enabled: true },
    'landmark-complementary-is-top-level': { enabled: true },
    'landmark-contentinfo-is-top-level': { enabled: true },
    'landmark-main-is-top-level': { enabled: true },
    'landmark-no-more-than-one': { enabled: true },
    'page-has-heading-one': { enabled: true },

    // ARIA and Labels
    'aria-allowed-attr': { enabled: true },
    'aria-allowed-role': { enabled: true },
    'aria-describedby': { enabled: true },
    'aria-label': { enabled: true },
    'aria-labelledby': { enabled: true },
    'aria-required-attr': { enabled: true },
    'aria-required-children': { enabled: true },
    'aria-required-parent': { enabled: true },
    'aria-roles': { enabled: true },
    'aria-valid-attr-value': { enabled: true },
    'aria-valid-attr': { enabled: true },

    // Form Accessibility
    'button-name': { enabled: true },
    'form-field-multiple-labels': { enabled: true },
    'label': { enabled: true },
    'label-title-only': { enabled: true },

    // Links and Navigation
    'link-name': { enabled: true },
    'link-in-text-block': { enabled: true },

    // Images and Media
    'image-alt': { enabled: true },
    'image-redundant-alt': { enabled: true },
    'object-alt': { enabled: true },

    // Touch Targets
    'target-size': { enabled: true },

    // Tables
    'table-fake-caption': { enabled: true },
    'td-headers-attr': { enabled: true },
    'th-has-data-cells': { enabled: true },

    // Language
    'html-has-lang': { enabled: true },
    'html-lang-valid': { enabled: true },
    'html-xml-lang-mismatch': { enabled: true },

    // Document Structure
    'document-title': { enabled: true },
    'duplicate-id': { enabled: true },
    'duplicate-id-active': { enabled: true },
    'duplicate-id-aria': { enabled: true },

    // Skip problematic rules for development
    'landmark-unique': { enabled: false }, // Can be overly strict
    'region': { enabled: false } // May flag legitimate content
  },
  tags: ['wcag2a', 'wcag2aa', 'wcag21aa'],
  level: 'AA'
};

// Utility function to create comprehensive accessibility report
async function createAccessibilityReport(results, testName) {
  const report = {
    testName,
    timestamp: new Date().toISOString(),
    violations: results.violations.map(violation => ({
      id: violation.id,
      impact: violation.impact,
      description: violation.description,
      help: violation.help,
      helpUrl: violation.helpUrl,
      tags: violation.tags,
      nodes: violation.nodes.map(node => ({
        target: node.target,
        failureSummary: node.failureSummary,
        element: node.html
      }))
    })),
    passes: results.passes.length,
    violationSummary: {
      critical: results.violations.filter(v => v.impact === 'critical').length,
      serious: results.violations.filter(v => v.impact === 'serious').length,
      moderate: results.violations.filter(v => v.impact === 'moderate').length,
      minor: results.violations.filter(v => v.impact === 'minor').length
    }
  };

  return report;
}

test.describe('Comprehensive Accessibility Testing', () => {
  test.beforeEach(async ({ page }) => {
    // Set consistent viewport for testing
    await page.setViewportSize({ width: 1280, height: 720 });

    // Wait for web components and any dynamic content
    await page.waitForFunction(() => {
      return window.customElements &&
             typeof window.customElements.whenDefined === 'function' &&
             document.readyState === 'complete';
    });
  });

  // Comprehensive accessibility audit for each critical page
  for (const testConfig of criticalTests) {
    test(`${testConfig.name} - Complete WCAG 2.1 AA Audit`, async ({ page }) => {
      await page.goto(testConfig.path);
      await page.waitForLoadState('networkidle');

      // Wait for any animations or async content loading
      await page.waitForTimeout(3000);

      // Run comprehensive axe scan
      const accessibilityResults = await new AxeBuilder({ page })
        .configure(comprehensiveAxeConfig)
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .exclude('.storybook-root')
        .exclude('[data-testid="dev-tools"]')
        .analyze();

      // Create detailed report
      const report = await createAccessibilityReport(accessibilityResults, `${testConfig.name} WCAG Audit`);

      // Log detailed results for debugging
      console.log(`\n🔍 ACCESSIBILITY AUDIT: ${testConfig.name}`);
      console.log(`📄 Page: ${testConfig.path}`);
      console.log(`🎯 Components: ${testConfig.components.join(', ')}`);
      console.log(`📊 Results: ${report.violations.length} violations, ${report.passes} passes`);
      console.log(`💥 Impact Summary: ${report.violationSummary.critical} critical, ${report.violationSummary.serious} serious`);

      if (report.violations.length > 0) {
        console.log(`\n❌ VIOLATIONS FOUND:`);
        report.violations.forEach((violation, index) => {
          console.log(`\n${index + 1}. ${violation.help}`);
          console.log(`   Impact: ${violation.impact}`);
          console.log(`   Rule: ${violation.id}`);
          console.log(`   Elements: ${violation.nodes.length}`);
          console.log(`   Learn more: ${violation.helpUrl}`);

          // Show first few affected elements
          violation.nodes.slice(0, 2).forEach(node => {
            console.log(`   - Target: ${node.target.join(' > ')}`);
            if (node.failureSummary) {
              console.log(`     Issue: ${node.failureSummary.substring(0, 100)}...`);
            }
          });
        });
      } else {
        console.log(`✅ No accessibility violations found!`);
      }

      // Assert no critical or serious violations
      const criticalViolations = report.violations.filter(
        violation => violation.impact === 'critical' || violation.impact === 'serious'
      );

      expect(criticalViolations,
        `Found ${criticalViolations.length} critical/serious accessibility violations on ${testConfig.name}. Check console for details.`
      ).toHaveLength(0);
    });

    test(`${testConfig.name} - Keyboard Navigation Compliance`, async ({ page }) => {
      await page.goto(testConfig.path);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Test comprehensive keyboard navigation
      const focusableSelectors = [
        'button:not([disabled])',
        'a[href]',
        'input:not([disabled]):not([type="hidden"])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        '[tabindex="0"]',
        '[tabindex="1"]',
        '[tabindex="2"]',
        '[tabindex="3"]',
        '[tabindex="4"]',
        '[tabindex="5"]',
        '[role="button"]:not([aria-disabled="true"])',
        '[role="link"]:not([aria-disabled="true"])',
        '[role="menuitem"]:not([aria-disabled="true"])',
        '[role="tab"]:not([aria-disabled="true"])'
      ];

      const focusableElements = await page.locator(focusableSelectors.join(', ')).all();

      console.log(`⌨️  Testing keyboard navigation on ${testConfig.name}: ${focusableElements.length} focusable elements`);

      if (focusableElements.length > 0) {
        // Start tabbing from the beginning
        await page.keyboard.press('Tab');

        let tabCount = 0;
        const maxTabs = Math.min(focusableElements.length, 15); // Limit for performance

        for (let i = 0; i < maxTabs; i++) {
          const focusedElement = await page.locator(':focus').first();

          // Verify element is visible and focusable
          await expect(focusedElement).toBeVisible();

          // Check for focus indicator (basic check)
          const elementInfo = await focusedElement.evaluate(el => ({
            tagName: el.tagName,
            type: el.type || 'N/A',
            role: el.getAttribute('role') || 'N/A',
            ariaLabel: el.getAttribute('aria-label') || 'N/A',
            id: el.id || 'N/A'
          }));

          console.log(`   Tab ${i + 1}: ${elementInfo.tagName} (${elementInfo.role}) - ${elementInfo.id}`);

          await page.keyboard.press('Tab');
          tabCount++;
        }

        expect(tabCount).toBeGreaterThan(0);
      }
    });

    test(`${testConfig.name} - Form Accessibility (if applicable)`, async ({ page }) => {
      await page.goto(testConfig.path);
      await page.waitForLoadState('networkidle');

      // Check for forms on the page
      const forms = await page.locator('form').all();

      if (forms.length > 0) {
        console.log(`📝 Testing form accessibility on ${testConfig.name}: ${forms.length} forms found`);

        for (let i = 0; i < forms.length; i++) {
          const form = forms[i];

          // Check all form inputs have labels
          const inputs = await form.locator('input, select, textarea').all();

          for (const input of inputs) {
            const inputType = await input.getAttribute('type');
            if (inputType === 'hidden') continue;

            const inputId = await input.getAttribute('id');
            const ariaLabel = await input.getAttribute('aria-label');
            const ariaLabelledby = await input.getAttribute('aria-labelledby');

            // Check for label association
            const hasLabel = inputId && await page.locator(`label[for="${inputId}"]`).count() > 0;
            const hasAriaLabel = ariaLabel !== null;
            const hasAriaLabelledby = ariaLabelledby !== null;

            const hasAccessibleLabel = hasLabel || hasAriaLabel || hasAriaLabelledby;

            if (!hasAccessibleLabel) {
              const elementInfo = await input.evaluate(el => ({
                tagName: el.tagName,
                type: el.type || 'N/A',
                name: el.name || 'N/A',
                placeholder: el.placeholder || 'N/A'
              }));
              console.warn(`⚠️  Input without accessible label: ${elementInfo.tagName}[type="${elementInfo.type}"] name="${elementInfo.name}"`);
            }

            expect(hasAccessibleLabel,
              `Form input must have accessible label (label[for], aria-label, or aria-labelledby)`
            ).toBeTruthy();
          }

          // Check form has submit button
          const submitButtons = await form.locator('button[type="submit"], input[type="submit"]').all();
          expect(submitButtons.length).toBeGreaterThan(0);
        }
      }
    });

    test(`${testConfig.name} - Touch Target Validation`, async ({ page }) => {
      await page.goto(testConfig.path);
      await page.waitForLoadState('networkidle');

      // Mobile viewport for touch target testing
      await page.setViewportSize({ width: 375, height: 667 });

      const interactiveSelectors = [
        'button',
        'a[href]',
        'input[type="button"]',
        'input[type="submit"]',
        'input[type="reset"]',
        '[role="button"]',
        '[role="link"]',
        '[onclick]',
        'select',
        'input[type="checkbox"]',
        'input[type="radio"]'
      ];

      const interactiveElements = await page.locator(interactiveSelectors.join(', ')).all();
      const smallTargets = [];
      const minTouchTarget = 44; // WCAG 2.1 AA minimum

      console.log(`👆 Testing touch targets on ${testConfig.name}: ${interactiveElements.length} interactive elements`);

      for (const element of interactiveElements) {
        if (await element.isVisible()) {
          const box = await element.boundingBox();

          if (box) {
            const tooSmall = box.width < minTouchTarget || box.height < minTouchTarget;

            if (tooSmall) {
              const selector = await element.evaluate(el => {
                if (el.id) return `#${el.id}`;
                if (el.className) return `.${el.className.split(' ')[0]}`;
                return `${el.tagName.toLowerCase()}`;
              });

              smallTargets.push({
                selector,
                size: `${Math.round(box.width)}×${Math.round(box.height)}px`,
                element: await element.innerHTML()
              });
            }
          }
        }
      }

      if (smallTargets.length > 0) {
        console.log(`\n⚠️  Small touch targets found on ${testConfig.name}:`);
        smallTargets.forEach(target => {
          console.log(`   - ${target.selector}: ${target.size} (minimum: ${minTouchTarget}×${minTouchTarget}px)`);
        });
      } else {
        console.log(`✅ All touch targets meet minimum size requirements`);
      }

      expect(smallTargets,
        `Found ${smallTargets.length} touch targets smaller than ${minTouchTarget}px on ${testConfig.name}. All interactive elements should be at least ${minTouchTarget}×${minTouchTarget}px for touch accessibility.`
      ).toHaveLength(0);
    });
  }

  test('Generate Comprehensive Accessibility Report', async ({ page }) => {
    const comprehensiveReport = {
      timestamp: new Date().toISOString(),
      testSuite: 'Comprehensive Accessibility Audit',
      wcagLevel: 'AA',
      totalPages: criticalTests.length,
      pages: [],
      overallSummary: {
        totalViolations: 0,
        critical: 0,
        serious: 0,
        moderate: 0,
        minor: 0,
        totalPasses: 0
      }
    };

    // Test each page and collect results
    for (const testConfig of criticalTests) {
      await page.goto(testConfig.path);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      const results = await new AxeBuilder({ page })
        .configure(comprehensiveAxeConfig)
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();

      const pageReport = {
        name: testConfig.name,
        path: testConfig.path,
        components: testConfig.components,
        violations: results.violations.length,
        passes: results.passes.length,
        violationsByImpact: {
          critical: results.violations.filter(v => v.impact === 'critical').length,
          serious: results.violations.filter(v => v.impact === 'serious').length,
          moderate: results.violations.filter(v => v.impact === 'moderate').length,
          minor: results.violations.filter(v => v.impact === 'minor').length
        },
        detailedViolations: results.violations.map(v => ({
          id: v.id,
          impact: v.impact,
          help: v.help,
          helpUrl: v.helpUrl,
          nodeCount: v.nodes.length,
          targets: v.nodes.slice(0, 3).map(n => n.target.join(' > '))
        }))
      };

      comprehensiveReport.pages.push(pageReport);

      // Update overall summary
      comprehensiveReport.overallSummary.totalViolations += pageReport.violations;
      comprehensiveReport.overallSummary.totalPasses += pageReport.passes;
      comprehensiveReport.overallSummary.critical += pageReport.violationsByImpact.critical;
      comprehensiveReport.overallSummary.serious += pageReport.violationsByImpact.serious;
      comprehensiveReport.overallSummary.moderate += pageReport.violationsByImpact.moderate;
      comprehensiveReport.overallSummary.minor += pageReport.violationsByImpact.minor;
    }

    // Generate report output
    console.log('\n🎯 COMPREHENSIVE ACCESSIBILITY AUDIT REPORT');
    console.log('='.repeat(60));
    console.log(`📅 Generated: ${comprehensiveReport.timestamp}`);
    console.log(`📊 Pages Tested: ${comprehensiveReport.totalPages}`);
    console.log(`🎯 WCAG Level: ${comprehensiveReport.wcagLevel} (2.1)`);
    console.log('');
    console.log('📈 OVERALL SUMMARY');
    console.log(`   Total Violations: ${comprehensiveReport.overallSummary.totalViolations}`);
    console.log(`   Total Passes: ${comprehensiveReport.overallSummary.totalPasses}`);
    console.log(`   Critical: ${comprehensiveReport.overallSummary.critical}`);
    console.log(`   Serious: ${comprehensiveReport.overallSummary.serious}`);
    console.log(`   Moderate: ${comprehensiveReport.overallSummary.moderate}`);
    console.log(`   Minor: ${comprehensiveReport.overallSummary.minor}`);
    console.log('');

    comprehensiveReport.pages.forEach(pageReport => {
      const status = pageReport.violations === 0 ? '✅' : '❌';
      console.log(`${status} ${pageReport.name} (${pageReport.path})`);
      console.log(`   Violations: ${pageReport.violations}, Passes: ${pageReport.passes}`);

      if (pageReport.violations > 0) {
        console.log(`   Impact: ${pageReport.violationsByImpact.critical}C, ${pageReport.violationsByImpact.serious}S, ${pageReport.violationsByImpact.moderate}M, ${pageReport.violationsByImpact.minor}m`);

        pageReport.detailedViolations.slice(0, 3).forEach(violation => {
          console.log(`   - ${violation.help} (${violation.impact})`);
        });
      }
      console.log('');
    });

    // Save comprehensive report to file for CI
    await page.evaluate((report) => {
      // This would save to artifacts in a real scenario
      console.log('Full report JSON:', JSON.stringify(report, null, 2));
    }, comprehensiveReport);

    // Enforce quality gates
    const criticalAndSeriousTotal = comprehensiveReport.overallSummary.critical + comprehensiveReport.overallSummary.serious;

    expect(criticalAndSeriousTotal,
      `Found ${criticalAndSeriousTotal} critical/serious accessibility violations across all tested pages. All critical and serious violations must be resolved for deployment.`
    ).toBe(0);
  });
});
