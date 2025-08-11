import { expect } from "@playwright/test";

/**
 * Compare screenshot with baseline - supports both page and locator
 * @param {import('@playwright/test').Page|import('@playwright/test').Locator} target
 * @param {string} name
 * @param {Object} options
 */
export async function compareScreenshot(target, name, options = {}) {
  const defaultOptions = {
    threshold: 0.15,
    maxDiffPixels: 150,
    animations: 'disabled',
    ...options,
  };

  await expect(target).toHaveScreenshot(`${name}.png`, defaultOptions);
}

/**
 * Wait for all animations to complete
 * @param {import('@playwright/test').Page} page
 */
export async function waitForAnimations(page) {
  // Wait for CSS animations and transitions
  await page.evaluate(() => {
    return Promise.all([
      ...document.getAnimations().map((animation) => animation.finished),
    ]);
  });
  
  // Additional wait for component updates
  await page.waitForTimeout(200);
}

/**
 * Set viewport size
 * @param {import('@playwright/test').Page} page
 * @param {Object} size
 */
export async function setViewport(page, { width = 1280, height = 720 } = {}) {
  await page.setViewportSize({ width, height });
}

/**
 * Hide dynamic elements that may cause flaky tests
 * @param {import('@playwright/test').Page} page
 */
export async function hideDynamicElements(page) {
  await page.addStyleTag({
    content: `
      [data-testid="timestamp"],
      [data-testid="random"],
      .dynamic-content,
      .loading-animation,
      .pulse-animation {
        visibility: hidden !important;
      }
      
      /* Disable CSS animations for consistent screenshots */
      *, *:before, *:after {
        animation-duration: 0.01ms !important;
        animation-delay: 0ms !important;
        transition-duration: 0.01ms !important;
        transition-delay: 0ms !important;
      }
    `,
  });
}

/**
 * Wait for web components to be defined and rendered
 * @param {import('@playwright/test').Page} page
 * @param {string[]} tagNames
 */
export async function waitForWebComponents(page, tagNames) {
  await page.evaluate((components) => {
    return Promise.all(
      components.map((tag) => customElements.whenDefined(tag))
    );
  }, tagNames);

  // Wait for components to fully render
  await page.waitForTimeout(300);
  
  // Ensure all components have completed their update cycle
  await page.evaluate((components) => {
    const elements = components.map(tag => document.querySelector(tag)).filter(Boolean);
    return Promise.all(
      elements.map(el => el.updateComplete || Promise.resolve())
    );
  }, tagNames);
}

/**
 * Wait for playground to initialize
 * @param {import('@playwright/test').Page} page
 */
export async function waitForPlayground(page) {
  await page.waitForFunction(() => {
    return window.playgroundApp && window.playgroundApp.loadComponent;
  }, { timeout: 15000 });
}

/**
 * Load component in playground and wait for render
 * @param {import('@playwright/test').Page} page
 * @param {string} category
 * @param {string} name
 * @param {string} tagName
 */
export async function loadPlaygroundComponent(page, category, name, tagName) {
  await page.evaluate(({ category, name }) => {
    return window.playgroundApp.loadComponent(category, name);
  }, { category, name });

  // Wait for the component to be loaded and rendered
  await page.waitForSelector('#interactive-preview', { timeout: 10000 });
  if (tagName) {
    await waitForWebComponents(page, [tagName]);
  }
  await waitForAnimations(page);
}

/**
 * Prepare page for consistent visual testing
 * @param {import('@playwright/test').Page} page
 */
export async function preparePageForVisualTest(page) {
  await hideDynamicElements(page);
  await waitForAnimations(page);
  
  // Ensure fonts are loaded
  await page.evaluate(() => {
    return document.fonts.ready;
  });
}
