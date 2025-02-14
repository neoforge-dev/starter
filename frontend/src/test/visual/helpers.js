import { expect } from "@playwright/test";

/**
 * Compare screenshot with baseline
 * @param {import('@playwright/test').Page} page
 * @param {string} name
 * @param {Object} options
 */
export async function compareScreenshot(page, name, options = {}) {
  const defaultOptions = {
    threshold: 0.2,
    maxDiffPixels: 100,
    ...options,
  };

  await expect(page).toHaveScreenshot(`${name}.png`, defaultOptions);
}

/**
 * Wait for all animations to complete
 * @param {import('@playwright/test').Page} page
 */
export async function waitForAnimations(page) {
  await page.evaluate(() => {
    return Promise.all(
      document.getAnimations().map((animation) => animation.finished)
    );
  });
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
      .dynamic-content {
        visibility: hidden !important;
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

  // Additional wait for rendering
  await page.waitForTimeout(100);
}
