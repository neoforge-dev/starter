import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Configuration for different page types and their expected violations
const pageTests = [
  {
    path: '/',
    name: 'Home Page',
    description: 'Landing page with hero section and navigation'
  },
  {
    path: '/login',
    name: 'Login Page',
    description: 'Authentication form with email and password fields'
  },
  {
    path: '/dashboard',
    name: 'Dashboard Page',
    description: 'Main application interface with data tables and charts'
  },
  {
    path: '/components',
    name: 'Components Page',
    description: 'Component library showcase page'
  },
  {
    path: '/docs',
    name: 'Documentation Page',
    description: 'Documentation with navigation and code examples'
  }
];

// WCAG 2.1 AA compliance configuration
const axeConfig = {
  rules: {
    // Core accessibility rules
    'color-contrast': { enabled: true },
    'color-contrast-enhanced': { enabled: false }, // AAA level
    'focus-order-semantics': { enabled: true },
    'tabindex': { enabled: true },
    'aria-label': { enabled: true },
    'aria-labelledby': { enabled: true },
    'aria-describedby': { enabled: true },
    'button-name': { enabled: true },
    'form-field-multiple-labels': { enabled: true },
    'label': { enabled: true },
    'link-name': { enabled: true },
    'heading-order': { enabled: true },
    'landmark-one-main': { enabled: true },
    'page-has-heading-one': { enabled: true },
    'region': { enabled: true },
    
    // Touch target rules
    'target-size': { enabled: true },
    
    // Skip some rules that might be overly strict for development
    'landmark-unique': { enabled: false }, // Can be too strict
    'region': { enabled: false } // Can flag legitimate content outside landmarks
  },
  tags: ['wcag2a', 'wcag2aa', 'wcag21aa'],
  level: 'AA'
};

test.describe('Page Accessibility Audit', () => {
  test.beforeEach(async ({ page }) => {
    // Set viewport for consistent testing
    await page.setViewportSize({ width: 1280, height: 720 });
    
    // Wait for any web components to load
    await page.waitForFunction(() => {
      return window.customElements && window.customElements.whenDefined;
    });
  });

  // Test each page for accessibility compliance
  for (const pageTest of pageTests) {
    test(`${pageTest.name} should have no critical accessibility violations`, async ({ page }) => {
      await page.goto(pageTest.path);
      
      // Wait for page to be fully loaded
      await page.waitForLoadState('networkidle');
      
      // Wait for any animations or dynamic content
      await page.waitForTimeout(2000);
      
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .exclude('.storybook-root') // Exclude Storybook specific elements if present
        .analyze();
      
      // Log violations for debugging
      if (accessibilityScanResults.violations.length > 0) {
        console.log(`\n❌ Accessibility violations found on ${pageTest.name}:`);
        accessibilityScanResults.violations.forEach((violation, index) => {
          console.log(`\n${index + 1}. ${violation.help}`);
          console.log(`   Impact: ${violation.impact}`);
          console.log(`   Elements: ${violation.nodes.length}`);
          console.log(`   Tags: ${violation.tags.join(', ')}`);
          console.log(`   Learn more: ${violation.helpUrl}`);
          
          // Show first few affected elements
          violation.nodes.slice(0, 3).forEach(node => {
            console.log(`   - ${node.target.join(' > ')}`);
          });
        });
      } else {
        console.log(`✅ No accessibility violations found on ${pageTest.name}`);
      }
      
      // Assert no critical or serious violations
      const criticalViolations = accessibilityScanResults.violations.filter(
        violation => violation.impact === 'critical' || violation.impact === 'serious'
      );
      
      expect(criticalViolations, 
        `Found ${criticalViolations.length} critical/serious accessibility violations on ${pageTest.name}. See console for details.`
      ).toHaveLength(0);
    });

    test(`${pageTest.name} should have proper keyboard navigation`, async ({ page }) => {
      await page.goto(pageTest.path);
      await page.waitForLoadState('networkidle');
      
      // Test Tab navigation
      const focusableElements = await page.locator(
        'button, a, input, select, textarea, [tabindex="0"], [tabindex="1"], [tabindex="2"], [tabindex="3"], [tabindex="4"], [tabindex="5"]'
      ).all();
      
      if (focusableElements.length > 0) {
        // Focus first element
        await page.keyboard.press('Tab');
        
        // Check that focus is visible
        const focusedElement = await page.locator(':focus').first();
        await expect(focusedElement).toBeVisible();
        
        // Test that we can navigate through all focusable elements
        for (let i = 1; i < Math.min(focusableElements.length, 10); i++) {
          await page.keyboard.press('Tab');
          const currentFocused = await page.locator(':focus').first();
          await expect(currentFocused).toBeVisible();
        }
      }
    });

    test(`${pageTest.name} should have proper touch target sizes`, async ({ page }) => {
      await page.goto(pageTest.path);
      await page.waitForLoadState('networkidle');
      
      // Check touch target sizes for interactive elements
      const interactiveElements = await page.locator(
        'button, a, input[type="button"], input[type="submit"], [role="button"]'
      ).all();
      
      const smallTargets = [];
      
      for (const element of interactiveElements) {
        const box = await element.boundingBox();
        if (box && (box.width < 44 || box.height < 44)) {
          const selector = await element.evaluate(el => {
            if (el.id) return `#${el.id}`;
            if (el.className) return `.${el.className.split(' ')[0]}`;
            return el.tagName.toLowerCase();
          });
          
          smallTargets.push({
            selector,
            size: `${Math.round(box.width)}x${Math.round(box.height)}px`
          });
        }
      }
      
      if (smallTargets.length > 0) {
        console.log(`\n⚠️  Small touch targets found on ${pageTest.name}:`);
        smallTargets.forEach(target => {
          console.log(`   - ${target.selector}: ${target.size} (should be 44x44px)`);
        });
      }
      
      expect(smallTargets, 
        `Found ${smallTargets.length} touch targets smaller than 44px on ${pageTest.name}`
      ).toHaveLength(0);
    });
  }

  test('Full application accessibility audit', async ({ page }) => {
    const auditResults = {
      totalPages: pageTests.length,
      violations: [],
      passes: [],
      summary: {
        critical: 0,
        serious: 0,
        moderate: 0,
        minor: 0
      }
    };
    
    for (const pageTest of pageTests) {
      await page.goto(pageTest.path);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();
      
      auditResults.violations.push({
        page: pageTest.name,
        path: pageTest.path,
        violations: results.violations,
        violationCount: results.violations.length
      });
      
      auditResults.passes.push({
        page: pageTest.name,
        passCount: results.passes.length
      });
      
      // Count violations by impact level
      results.violations.forEach(violation => {
        auditResults.summary[violation.impact] += 1;
      });
    }
    
    // Generate comprehensive report
    console.log('\n🔍 COMPREHENSIVE ACCESSIBILITY AUDIT REPORT');
    console.log('='.repeat(50));
    console.log(`Pages tested: ${auditResults.totalPages}`);
    console.log(`Total violations: ${auditResults.violations.reduce((sum, page) => sum + page.violationCount, 0)}`);
    console.log(`Critical: ${auditResults.summary.critical}`);
    console.log(`Serious: ${auditResults.summary.serious}`);
    console.log(`Moderate: ${auditResults.summary.moderate}`);
    console.log(`Minor: ${auditResults.summary.minor}`);
    
    auditResults.violations.forEach(pageResult => {
      if (pageResult.violationCount > 0) {
        console.log(`\n📄 ${pageResult.page} (${pageResult.path}): ${pageResult.violationCount} violations`);
        pageResult.violations.forEach(violation => {
          console.log(`   - ${violation.help} (${violation.impact})`);
        });
      }
    });
    
    // Save detailed report to artifacts
    await page.evaluate((results) => {
      const report = {
        timestamp: new Date().toISOString(),
        ...results
      };
      
      // In a real implementation, this would save to artifacts directory
      console.log('Detailed audit results:', JSON.stringify(report, null, 2));
    }, auditResults);
    
    // Fail if there are critical or serious violations
    const criticalAndSerious = auditResults.summary.critical + auditResults.summary.serious;
    expect(criticalAndSerious, 
      `Found ${criticalAndSerious} critical/serious accessibility violations across all pages`
    ).toBe(0);
  });

  test('Mobile accessibility compliance', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    for (const pageTest of pageTests.slice(0, 3)) { // Test first 3 pages for mobile
      await page.goto(pageTest.path);
      await page.waitForLoadState('networkidle');
      
      // Mobile-specific accessibility checks
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();
      
      // Check for mobile-specific issues
      const mobileViolations = results.violations.filter(violation => 
        violation.id.includes('target-size') || 
        violation.id.includes('color-contrast') ||
        violation.help.toLowerCase().includes('touch')
      );
      
      console.log(`📱 Mobile accessibility check for ${pageTest.name}: ${mobileViolations.length} mobile-specific violations`);
      
      expect(mobileViolations).toHaveLength(0);
    }
  });
});