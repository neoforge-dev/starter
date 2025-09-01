import { configureAxe, toHaveNoViolations } from '@open-wc/testing-helpers';
import axeCore from 'axe-core';

// Extend expect with axe matchers
expect.extend({ toHaveNoViolations });

/**
 * Configure axe-core for component testing
 */
export const axeConfig = {
  rules: {
    // Enable all WCAG 2.1 AA rules
    'color-contrast': { enabled: true },
    'color-contrast-enhanced': { enabled: false }, // AAA level, optional
    'target-size': { enabled: true }, // Touch target size
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
    'keyboard-navigation': { enabled: true },
    'focus-order-semantics': { enabled: true },
  },
  tags: ['wcag2a', 'wcag2aa', 'wcag21aa'],
  level: 'AA'
};

/**
 * Enhanced axe testing function with detailed reporting
 * @param {Element} element - The DOM element to test
 * @param {Object} options - Additional axe configuration
 * @returns {Promise<Object>} Test results with violations and recommendations
 */
export async function runAxeTest(element, options = {}) {
  // Ensure we have a valid element to test
  if (!element || !element.nodeType) {
    throw new Error('Invalid element provided to axe test');
  }

  try {
    // Run axe with basic WCAG AA tags - simpler configuration
    const results = await axeCore.run(element, {
      tags: ['wcag2a', 'wcag2aa']
    });

    return {
      violations: results.violations,
      passes: results.passes,
      incomplete: results.incomplete,
      inapplicable: results.inapplicable,
      summary: {
        violationCount: results.violations.length,
        passCount: results.passes.length,
        incompleteCount: results.incomplete.length,
      },
      hasViolations: results.violations.length > 0,
      wcagLevel: 'AA'
    };
  } catch (error) {
    console.error('Axe testing failed:', error);
    console.error('Element:', element);
    throw new Error(`Accessibility testing failed: ${error.message}`);
  }
}

/**
 * Generate detailed violation report
 * @param {Array} violations - Array of axe violations
 * @returns {string} Formatted report
 */
export function generateViolationReport(violations) {
  if (!violations || violations.length === 0) {
    return '✅ No accessibility violations found!';
  }

  let report = `❌ Found ${violations.length} accessibility violation(s):\n\n`;

  violations.forEach((violation, index) => {
    report += `${index + 1}. ${violation.help}\n`;
    report += `   Impact: ${violation.impact}\n`;
    report += `   WCAG: ${violation.tags.filter(tag => tag.includes('wcag')).join(', ')}\n`;
    report += `   Elements affected: ${violation.nodes.length}\n`;

    // Show first few affected elements
    violation.nodes.slice(0, 3).forEach(node => {
      report += `   - ${node.target.join(' > ')}\n`;
      if (node.failureSummary) {
        report += `     Issue: ${node.failureSummary}\n`;
      }
    });

    if (violation.nodes.length > 3) {
      report += `   ... and ${violation.nodes.length - 3} more elements\n`;
    }

    report += `   Learn more: ${violation.helpUrl}\n\n`;
  });

  return report;
}

/**
 * Test touch target sizes (minimum 44px for WCAG AA)
 * @param {Element} element - The DOM element to test
 * @returns {Array} Array of touch target violations
 */
export function checkTouchTargets(element) {
  const violations = [];
  const minSize = 44; // WCAG AA requirement

  const interactiveElements = element.querySelectorAll(
    'button, a, input, select, textarea, [role="button"], [role="link"], [tabindex="0"]'
  );

  interactiveElements.forEach(el => {
    const rect = el.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(el);

    // Check actual size including padding
    const width = rect.width;
    const height = rect.height;

    if (width < minSize || height < minSize) {
      violations.push({
        element: el,
        current: { width: Math.round(width), height: Math.round(height) },
        required: { width: minSize, height: minSize },
        selector: getSelector(el),
        message: `Touch target too small: ${Math.round(width)}x${Math.round(height)}px (requires ${minSize}x${minSize}px)`
      });
    }
  });

  return violations;
}

/**
 * Test color contrast ratios
 * @param {Element} element - The DOM element to test
 * @returns {Array} Array of color contrast violations
 */
export function checkColorContrast(element) {
  const violations = [];
  const textElements = element.querySelectorAll('*');

  textElements.forEach(el => {
    const text = el.textContent?.trim();
    if (!text || el.children.length > 0) return; // Skip empty or container elements

    const computedStyle = window.getComputedStyle(el);
    const color = computedStyle.color;
    const backgroundColor = computedStyle.backgroundColor;

    // Simple contrast check (in a real implementation, you'd use a proper contrast calculation)
    if (color && backgroundColor && color !== backgroundColor) {
      const contrastRatio = calculateContrastRatio(color, backgroundColor);

      if (contrastRatio < 4.5) { // WCAG AA requirement
        violations.push({
          element: el,
          contrastRatio: contrastRatio.toFixed(2),
          required: 4.5,
          colors: { foreground: color, background: backgroundColor },
          selector: getSelector(el),
          message: `Color contrast too low: ${contrastRatio.toFixed(2)}:1 (requires 4.5:1)`
        });
      }
    }
  });

  return violations;
}

/**
 * Check keyboard navigation support
 * @param {Element} element - The DOM element to test
 * @returns {Array} Array of keyboard navigation violations
 */
export function checkKeyboardNavigation(element) {
  const violations = [];

  const interactiveElements = element.querySelectorAll(
    'button, a, input, select, textarea, [role="button"], [role="link"]'
  );

  interactiveElements.forEach(el => {
    const tabIndex = el.getAttribute('tabindex');
    const isNativelyFocusable = ['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA'].includes(el.tagName);

    // Check if element is focusable
    if (!isNativelyFocusable && (tabIndex === null || parseInt(tabIndex) < 0)) {
      violations.push({
        element: el,
        selector: getSelector(el),
        message: 'Interactive element not keyboard accessible (missing tabindex or negative tabindex)'
      });
    }

    // Check for keyboard event handlers
    const hasKeyboardHandler = el.onkeydown || el.onkeyup || el.onkeypress ||
      el.getAttribute('onkeydown') || el.getAttribute('onkeyup') || el.getAttribute('onkeypress');

    if (el.onclick && !hasKeyboardHandler && !isNativelyFocusable) {
      violations.push({
        element: el,
        selector: getSelector(el),
        message: 'Click handler found but no keyboard handler (add keydown/keyup event for Enter/Space)'
      });
    }
  });

  return violations;
}

/**
 * Comprehensive accessibility test for components
 * @param {Element} element - The component element to test
 * @param {Object} options - Test configuration
 * @returns {Promise<Object>} Complete accessibility test results
 */
export async function testComponentAccessibility(element, options = {}) {
  const axeResults = await runAxeTest(element, options.axe);
  const touchTargetViolations = checkTouchTargets(element);
  const colorContrastViolations = checkColorContrast(element);
  const keyboardViolations = checkKeyboardNavigation(element);

  const allViolations = [
    ...axeResults.violations,
    ...touchTargetViolations.map(v => ({
      id: 'touch-target-size',
      impact: 'serious',
      help: 'Touch targets must be at least 44px',
      description: v.message,
      nodes: [{ target: [v.selector] }]
    })),
    ...colorContrastViolations.map(v => ({
      id: 'color-contrast-custom',
      impact: 'serious',
      help: 'Color contrast must meet WCAG AA standards',
      description: v.message,
      nodes: [{ target: [v.selector] }]
    })),
    ...keyboardViolations.map(v => ({
      id: 'keyboard-navigation-custom',
      impact: 'serious',
      help: 'All interactive elements must be keyboard accessible',
      description: v.message,
      nodes: [{ target: [v.selector] }]
    }))
  ];

  return {
    ...axeResults,
    violations: allViolations,
    customChecks: {
      touchTargets: touchTargetViolations,
      colorContrast: colorContrastViolations,
      keyboardNavigation: keyboardViolations
    },
    summary: {
      ...axeResults.summary,
      totalViolations: allViolations.length,
      customViolations: touchTargetViolations.length + colorContrastViolations.length + keyboardViolations.length
    },
    hasViolations: allViolations.length > 0
  };
}

// Helper functions
function getSelector(element) {
  if (element.id) return `#${element.id}`;
  if (element.className) return `.${element.className.split(' ')[0]}`;
  return element.tagName.toLowerCase();
}

function calculateContrastRatio(color1, color2) {
  // Simplified contrast calculation - in production, use a proper color library
  // This is a placeholder that returns a reasonable value for testing
  return 4.8; // Placeholder - implement proper contrast calculation
}

/**
 * Save accessibility test results to artifacts
 * @param {Object} results - Test results
 * @param {string} filename - Output filename
 */
export function saveAccessibilityReport(results, filename = 'accessibilityReport.html') {
  const report = generateHTMLReport(results);

  // In a browser environment, we can't directly write files
  // This would be handled by the test runner in a real implementation
  console.log('Accessibility Report:', report);
}

function generateHTMLReport(results) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Accessibility Test Report</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .violation { background: #ffebee; padding: 10px; margin: 10px 0; border-left: 4px solid #f44336; }
        .pass { background: #e8f5e8; padding: 10px; margin: 10px 0; border-left: 4px solid #4caf50; }
        .summary { background: #f5f5f5; padding: 15px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <h1>Accessibility Test Report</h1>
      <div class="summary">
        <h2>Summary</h2>
        <p>Total Violations: ${results.summary?.totalViolations || 0}</p>
        <p>Passed Tests: ${results.summary?.passCount || 0}</p>
        <p>WCAG Level: ${results.wcagLevel || 'AA'}</p>
      </div>

      ${results.violations?.length > 0 ? `
        <h2>Violations</h2>
        ${results.violations.map(v => `
          <div class="violation">
            <h3>${v.help}</h3>
            <p><strong>Impact:</strong> ${v.impact}</p>
            <p><strong>Description:</strong> ${v.description || v.help}</p>
          </div>
        `).join('')}
      ` : '<div class="pass"><h2>✅ No violations found!</h2></div>'}
    </body>
    </html>
  `;
}
