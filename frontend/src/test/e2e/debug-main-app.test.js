import { test, expect } from '@playwright/test';

test('debug main app loading', async ({ page }) => {
  // Listen for console messages and errors
  const messages = [];
  const errors = [];

  page.on('console', msg => {
    messages.push(`${msg.type()}: ${msg.text()}`);
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  page.on('pageerror', error => {
    errors.push(`Page error: ${error.message}`);
  });

  // Load the main page
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');

  // Check page title
  const title = await page.title();
  console.log('Page title:', title);

  // Check page content
  const bodyText = await page.textContent('body');
  console.log('Body text length:', bodyText.length);
  console.log('Body text preview:', bodyText.substring(0, 200));

  // Check if neo-app element exists
  const neoApp = page.locator('neo-app');
  const neoAppExists = await neoApp.count() > 0;
  console.log('neo-app element exists:', neoAppExists);

  // Check all custom elements
  const allElements = await page.evaluate(() => {
    const elements = document.querySelectorAll('*');
    const tagNames = [];
    for (let el of elements) {
      if (el.tagName.includes('-')) {
        tagNames.push(el.tagName.toLowerCase());
      }
    }
    return [...new Set(tagNames)];
  });

  console.log('Custom elements found:', allElements);

  // Check if neo-app is defined in customElements
  const neoAppDefined = await page.evaluate(() => {
    return customElements.get('neo-app') !== undefined;
  });

  console.log('neo-app defined in customElements:', neoAppDefined);

  // Check scripts loaded
  const scripts = await page.evaluate(() => {
    const scriptElements = document.querySelectorAll('script');
    return Array.from(scriptElements).map(script => script.src || 'inline script');
  });

  console.log('Scripts loaded:', scripts);

  // Report errors
  if (errors.length > 0) {
    console.log('JavaScript errors:', errors);
  }

  console.log('All console messages:', messages.slice(-5)); // Last 5 messages
});