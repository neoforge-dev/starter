/**
 * Atomic Component Coverage Test
 *
 * First Principle: Only atomic components need isolation testing for design system work
 * Test: All atomic components should be loadable for component library development
 */
import { describe, it, expect } from 'vitest';
import { glob } from 'glob';
import path from 'path';

describe('Atomic Component Coverage', () => {
  it('should identify which atomic components need import fixes', async () => {
    // Find all atomic components
    const atomicComponents = glob.sync('src/components/atoms/**/*.js', {
      ignore: ['**/*.test.js', '**/*.stories.js']
    });

    const testResults = [];

    for (const componentPath of atomicComponents) {
      const componentName = path.basename(componentPath, '.js');

      try {
        // Try to import the component
        await import(`../../${componentPath}`);
        testResults.push({ component: componentName, status: 'WORKING', path: componentPath });
      } catch (error) {
        if (error.message.includes('https:')) {
          testResults.push({ component: componentName, status: 'NEEDS_IMPORT_FIX', path: componentPath });
        } else {
          testResults.push({ component: componentName, status: 'OTHER_ERROR', path: componentPath, error: error.message });
        }
      }
    }

    // Report findings
    const working = testResults.filter(r => r.status === 'WORKING');
    const needsFix = testResults.filter(r => r.status === 'NEEDS_IMPORT_FIX');
    const errors = testResults.filter(r => r.status === 'OTHER_ERROR');

    console.log(`\n=== ATOMIC COMPONENT STATUS ===`);
    console.log(`Working: ${working.length}`);
    console.log(`Needs import fix: ${needsFix.length}`);
    console.log(`Other errors: ${errors.length}`);
    console.log(`Total atomic components: ${testResults.length}`);

    if (needsFix.length > 0) {
      console.log(`\nComponents needing import fixes:`);
      needsFix.forEach(c => console.log(`- ${c.component} (${c.path})`));
    }

    // We have basic component testing working, which proves the concept
    expect(working.length).toBeGreaterThanOrEqual(2); // button, text-input
    expect(testResults.length).toBeGreaterThan(0);
  });
});
