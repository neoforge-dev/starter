// @ts-check
import { test, expect } from '@playwright/test';

/**
 * Visual Regression Tests for NeoForge Web Components
 * 
 * This test suite captures screenshots of all 33 components in various states
 * and compares them against baseline images to detect visual regressions.
 * 
 * Test Structure:
 * - Each component is tested in isolation
 * - Multiple states are tested (default, hover, active, disabled, error)
 * - Both desktop and mobile viewports are tested
 * - Baseline images are stored in ./baselines/ directory
 */

// Component registry for systematic testing
const componentRegistry = {
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

// Test states for interactive components
const testStates = {
  default: {},
  hover: { hover: true },
  focus: { focus: true },
  disabled: { disabled: true },
  error: { error: true },
  loading: { loading: true }
};

// Setup test environment
test.beforeEach(async ({ page }) => {
  // Navigate to playground
  await page.goto('/playground/advanced-playground.html');
  
  // Wait for playground to load
  await page.waitForSelector('[data-component-playground]', { timeout: 30000 });
  
  // Disable animations for consistent screenshots
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
      }
    `
  });
  
  // Wait for fonts to load
  await page.evaluate(() => document.fonts.ready);
});

// Test each component category
Object.entries(componentRegistry).forEach(([category, components]) => {
  test.describe(`${category.charAt(0).toUpperCase() + category.slice(1)} Components`, () => {
    
    components.forEach(componentName => {
      test.describe(componentName, () => {
        
        // Test component in default state
        test(`${componentName} - default state`, async ({ page }) => {
          await selectComponent(page, componentName);
          await waitForComponentRender(page, componentName);
          
          const componentArea = page.locator('[data-component-area]');
          await expect(componentArea).toHaveScreenshot(`${componentName}-default.png`);
        });
        
        // Test interactive states for applicable components
        if (isInteractiveComponent(componentName)) {
          Object.entries(testStates).forEach(([stateName, stateConfig]) => {
            if (stateName === 'default') return;
            
            test(`${componentName} - ${stateName} state`, async ({ page }) => {
              await selectComponent(page, componentName);
              await waitForComponentRender(page, componentName);
              
              if (stateConfig.hover) {
                await page.locator('[data-component-area] [data-testid], [data-component-area] button, [data-component-area] input').first().hover();
              }
              
              if (stateConfig.focus) {
                await page.locator('[data-component-area] [data-testid], [data-component-area] button, [data-component-area] input').first().focus();
              }
              
              if (stateConfig.disabled) {
                await setComponentProperty(page, 'disabled', true);
              }
              
              if (stateConfig.error) {
                await setComponentProperty(page, 'error', true);
              }
              
              if (stateConfig.loading) {
                await setComponentProperty(page, 'loading', true);
              }
              
              // Wait for state change to apply
              await page.waitForTimeout(100);
              
              const componentArea = page.locator('[data-component-area]');
              await expect(componentArea).toHaveScreenshot(`${componentName}-${stateName}.png`);
            });
          });
        }
        
        // Test component with different props/configurations
        test(`${componentName} - with props`, async ({ page }) => {
          await selectComponent(page, componentName);
          await waitForComponentRender(page, componentName);
          
          // Apply common props based on component type
          await applyTestProps(page, componentName);
          
          const componentArea = page.locator('[data-component-area]');
          await expect(componentArea).toHaveScreenshot(`${componentName}-with-props.png`);
        });
        
        // Test responsive behavior on mobile
        test(`${componentName} - mobile responsive`, async ({ page }) => {
          // Switch to mobile viewport
          await page.setViewportSize({ width: 375, height: 667 });
          
          await selectComponent(page, componentName);
          await waitForComponentRender(page, componentName);
          
          const componentArea = page.locator('[data-component-area]');
          await expect(componentArea).toHaveScreenshot(`${componentName}-mobile.png`);
        });
      });
    });
  });
});

// Test theme variations
test.describe('Theme Variations', () => {
  const themes = ['light', 'dark', 'auto'];
  const sampleComponents = ['button', 'form', 'data-table', 'dashboard-page'];
  
  themes.forEach(theme => {
    sampleComponents.forEach(componentName => {
      test(`${componentName} - ${theme} theme`, async ({ page }) => {
        // Set theme before loading component
        await page.goto(`/playground/advanced-playground.html?theme=${theme}`);
        await page.waitForSelector('[data-component-playground]');
        
        // Apply theme styles
        if (theme === 'dark') {
          await page.addStyleTag({
            content: `
              :root {
                --primary-color: #ffffff;
                --background-color: #1a1a1a;
                --text-color: #ffffff;
              }
              body { background-color: var(--background-color); color: var(--text-color); }
            `
          });
        }
        
        await selectComponent(page, componentName);
        await waitForComponentRender(page, componentName);
        
        const componentArea = page.locator('[data-component-area]');
        await expect(componentArea).toHaveScreenshot(`${componentName}-${theme}-theme.png`);
      });
    });
  });
});

// Test accessibility variations
test.describe('Accessibility Variations', () => {
  const a11yComponents = ['button', 'form', 'input', 'tabs', 'data-table'];
  
  a11yComponents.forEach(componentName => {
    test(`${componentName} - high contrast`, async ({ page }) => {
      await page.goto('/playground/advanced-playground.html');
      
      // Apply high contrast theme
      await page.addStyleTag({
        content: `
          :root {
            --contrast-ratio: 7:1;
          }
          * {
            border-color: #000000 !important;
          }
          button, input, select {
            border: 2px solid #000000 !important;
          }
        `
      });
      
      await selectComponent(page, componentName);
      await waitForComponentRender(page, componentName);
      
      const componentArea = page.locator('[data-component-area]');
      await expect(componentArea).toHaveScreenshot(`${componentName}-high-contrast.png`);
    });
    
    test(`${componentName} - large text`, async ({ page }) => {
      await page.goto('/playground/advanced-playground.html');
      
      // Apply large text styles
      await page.addStyleTag({
        content: `
          * {
            font-size: 1.5em !important;
            line-height: 1.6 !important;
          }
        `
      });
      
      await selectComponent(page, componentName);
      await waitForComponentRender(page, componentName);
      
      const componentArea = page.locator('[data-component-area]');
      await expect(componentArea).toHaveScreenshot(`${componentName}-large-text.png`);
    });
  });
});

// Helper functions
async function selectComponent(page, componentName) {
  // Use smart search to find and select component
  const searchInput = page.locator('[data-search-input]');
  await searchInput.fill(componentName);
  
  // Wait for search results
  await page.waitForTimeout(500);
  
  // Click on the first matching component
  const componentOption = page.locator(`[data-component-option="${componentName}"]`).first();
  await componentOption.click();
  
  // Wait for component to be selected
  await page.waitForTimeout(1000);
}

async function waitForComponentRender(page, componentName) {
  // Wait for component to be rendered in the preview area
  await page.waitForSelector('[data-component-area]', { timeout: 10000 });
  
  // Wait for specific component element if it has a standard tag pattern
  const componentSelector = getComponentSelector(componentName);
  if (componentSelector) {
    await page.waitForSelector(componentSelector, { timeout: 5000 }).catch(() => {
      // Fallback: wait for any content in component area
      console.log(`Could not find specific selector for ${componentName}, using generic wait`);
    });
  }
  
  // Wait for any loading states to complete
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
}

async function setComponentProperty(page, property, value) {
  // Use the property editor in the playground
  const propertyInput = page.locator(`[data-property="${property}"]`);
  
  if (await propertyInput.count() > 0) {
    if (typeof value === 'boolean') {
      if (value) {
        await propertyInput.check();
      } else {
        await propertyInput.uncheck();
      }
    } else {
      await propertyInput.fill(String(value));
    }
  }
}

async function applyTestProps(page, componentName) {
  // Apply component-specific test props based on component type
  const propSets = {
    'button': { text: 'Test Button', variant: 'primary' },
    'input': { placeholder: 'Test input', value: 'Sample text' },
    'badge': { text: 'New', variant: 'success' },
    'spinner': { size: 'medium', message: 'Loading...' },
    'data-table': { 
      data: JSON.stringify([
        { id: 1, name: 'John Doe', email: 'john@example.com' },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
      ])
    },
    'form': { title: 'Test Form', submitText: 'Submit Test' }
  };
  
  const props = propSets[componentName];
  if (props) {
    for (const [key, value] of Object.entries(props)) {
      await setComponentProperty(page, key, value);
    }
    // Wait for props to apply
    await page.waitForTimeout(300);
  }
}

function isInteractiveComponent(componentName) {
  const interactiveComponents = [
    'button', 'input', 'checkbox', 'radio', 'select', 'dropdown',
    'tabs', 'file-upload', 'form', 'pagination', 'rich-text-editor'
  ];
  return interactiveComponents.includes(componentName);
}

function getComponentSelector(componentName) {
  // Map component names to their likely DOM selectors
  const selectorMap = {
    'button': 'button, [role="button"]',
    'input': 'input, textarea',
    'checkbox': 'input[type="checkbox"]',
    'radio': 'input[type="radio"]',
    'form': 'form',
    'data-table': 'table, [role="table"]',
    'tabs': '[role="tablist"]',
    'modal': '[role="dialog"]',
    'spinner': '.spinner, [role="status"]'
  };
  
  return selectorMap[componentName] || `[data-component="${componentName}"]`;
}