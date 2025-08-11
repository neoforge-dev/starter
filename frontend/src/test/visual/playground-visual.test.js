/**
 * Playground-Focused Visual Regression Tests
 * 
 * Tests visual rendering specifically through the playground system
 * to catch regressions in live component rendering.
 */
import { test, expect } from '@playwright/test';
import { compareScreenshot, waitForWebComponents, waitForAnimations } from './helpers.js';

// High-priority components that should always work in playground
const PRIORITY_COMPONENTS = [
  { category: 'atoms', name: 'button', tagName: 'neo-button' },
  { category: 'atoms', name: 'text-input', tagName: 'neo-text-input' },
  { category: 'atoms', name: 'badge', tagName: 'neo-badge' },
  { category: 'atoms', name: 'spinner', tagName: 'neo-spinner' },
  { category: 'molecules', name: 'alert', tagName: 'neo-alert' },
  { category: 'molecules', name: 'card', tagName: 'neo-card' }
];

test.describe('Playground Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/playground.html');
    
    // Wait for playground to initialize
    await page.waitForSelector('#component-showcase', { timeout: 15000 });
    await page.waitForFunction(() => window.playgroundApp !== undefined);
  });

  test('playground interface - initial load', async ({ page }) => {
    await waitForAnimations(page);
    
    // Hide dynamic elements that might cause flaky tests
    await page.addStyleTag({
      content: `
        [data-testid="timestamp"], .dynamic-content {
          visibility: hidden !important;
        }
      `
    });
    
    await compareScreenshot(page, 'playground-initial-load', {
      fullPage: true,
      maxDiffPixels: 200
    });
  });

  // Test priority components in playground
  for (const component of PRIORITY_COMPONENTS) {
    test(`playground component: ${component.category}/${component.name}`, async ({ page }) => {
      // Load component via playground
      await page.evaluate(({ category, name }) => {
        return window.playgroundApp.loadComponent(category, name);
      }, component);

      // Wait for component to load
      await page.waitForSelector('#interactive-preview', { timeout: 10000 });
      await waitForWebComponents(page, [component.tagName]);
      await waitForAnimations(page);

      // Test the interactive preview area
      const interactivePreview = page.locator('#interactive-preview');
      await compareScreenshot(interactivePreview, `playground-${component.category}-${component.name}-interactive`);

      // Test the component showcase area
      const showcase = page.locator('#component-showcase');
      await compareScreenshot(showcase, `playground-${component.category}-${component.name}-showcase`);
    });
  }

  test('playground prop editor - button component', async ({ page }) => {
    // Load button component
    await page.evaluate(() => {
      return window.playgroundApp.loadComponent('atoms', 'button');
    });

    await page.waitForSelector('#props-editor-container');
    await waitForAnimations(page);

    // Test props panel
    const propsPanel = page.locator('#props-panel');
    await compareScreenshot(propsPanel, 'playground-props-panel');

    // Test changing a property
    const variantSelect = page.locator('select[data-property="variant"]');
    if (await variantSelect.count() > 0) {
      await variantSelect.selectOption('secondary');
      await waitForAnimations(page);
      
      const interactivePreview = page.locator('#interactive-preview');
      await compareScreenshot(interactivePreview, 'playground-button-variant-secondary');
    }
  });

  test('playground code generation', async ({ page }) => {
    await page.evaluate(() => {
      return window.playgroundApp.loadComponent('atoms', 'button');
    });

    // Show code panel
    await page.click('#toggle-code-view');
    await waitForAnimations(page);

    const codePanel = page.locator('#code-panel');
    await compareScreenshot(codePanel, 'playground-code-panel');

    // Test different code formats
    const litTab = page.locator('[data-tab="lit"]');
    if (await litTab.count() > 0) {
      await litTab.click();
      await waitForAnimations(page);
      await compareScreenshot(codePanel, 'playground-code-panel-lit');
    }
  });

  test('playground responsive testing', async ({ page }) => {
    await page.evaluate(() => {
      return window.playgroundApp.loadComponent('molecules', 'card');
    });

    // Show responsive panel
    const responsiveToggle = page.locator('#responsive-toggle');
    if (await responsiveToggle.count() > 0) {
      await responsiveToggle.click();
      await waitForAnimations(page);

      const responsivePanel = page.locator('#responsive-panel');
      await compareScreenshot(responsivePanel, 'playground-responsive-panel');

      // Test mobile viewport
      const mobileBtn = page.locator('[data-width="375"]');
      if (await mobileBtn.count() > 0) {
        await mobileBtn.click();
        await waitForAnimations(page);

        const showcase = page.locator('#component-showcase');
        await compareScreenshot(showcase, 'playground-mobile-viewport');
      }
    }
  });
});

test.describe('Component State Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/playground.html');
    await page.waitForFunction(() => window.playgroundApp !== undefined);
  });

  test('button component - all variants matrix', async ({ page }) => {
    // Create a comprehensive button test page
    await page.evaluate(() => {
      // Create test container
      const testContainer = document.createElement('div');
      testContainer.id = 'visual-test-container';
      testContainer.style.cssText = `
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 1rem;
        padding: 2rem;
        background: white;
        max-width: 800px;
        margin: 2rem auto;
      `;

      // Button variants to test
      const variants = [
        { variant: 'primary', size: 'sm', label: 'Primary Small' },
        { variant: 'primary', size: 'md', label: 'Primary Medium' },
        { variant: 'primary', size: 'lg', label: 'Primary Large' },
        { variant: 'secondary', size: 'md', label: 'Secondary' },
        { variant: 'tertiary', size: 'md', label: 'Tertiary' },
        { variant: 'danger', size: 'md', label: 'Danger' },
        { variant: 'ghost', size: 'md', label: 'Ghost' },
        { variant: 'text', size: 'md', label: 'Text' }
      ];

      variants.forEach(config => {
        const button = document.createElement('neo-button');
        button.variant = config.variant;
        button.size = config.size;
        button.textContent = config.label;
        testContainer.appendChild(button);
      });

      // Add disabled and loading states
      const disabledBtn = document.createElement('neo-button');
      disabledBtn.variant = 'primary';
      disabledBtn.disabled = true;
      disabledBtn.textContent = 'Disabled';
      testContainer.appendChild(disabledBtn);

      const loadingBtn = document.createElement('neo-button');
      loadingBtn.variant = 'primary';
      loadingBtn.loading = true;
      loadingBtn.textContent = 'Loading';
      testContainer.appendChild(loadingBtn);

      document.body.appendChild(testContainer);
    });

    await waitForWebComponents(page, ['neo-button']);
    await waitForAnimations(page);

    const testContainer = page.locator('#visual-test-container');
    await compareScreenshot(testContainer, 'button-variants-matrix');
  });

  test('form components - input states', async ({ page }) => {
    await page.evaluate(() => {
      const container = document.createElement('div');
      container.id = 'form-test-container';
      container.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: 1rem;
        padding: 2rem;
        background: white;
        max-width: 400px;
        margin: 2rem auto;
      `;

      // Text input variations
      const textInput = document.createElement('neo-text-input');
      textInput.label = 'Default Input';
      textInput.placeholder = 'Enter text...';
      container.appendChild(textInput);

      const filledInput = document.createElement('neo-text-input');
      filledInput.label = 'Filled Input';
      filledInput.value = 'Sample text';
      container.appendChild(filledInput);

      const errorInput = document.createElement('neo-text-input');
      errorInput.label = 'Error Input';
      errorInput.error = 'This field is required';
      container.appendChild(errorInput);

      const disabledInput = document.createElement('neo-text-input');
      disabledInput.label = 'Disabled Input';
      disabledInput.disabled = true;
      container.appendChild(disabledInput);

      document.body.appendChild(container);
    });

    await waitForWebComponents(page, ['neo-text-input']);
    await waitForAnimations(page);

    const container = page.locator('#form-test-container');
    await compareScreenshot(container, 'form-inputs-states');
  });
});