import { test, expect } from '@playwright/test';

test('check routing and page loading', async ({ page }) => {
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

  // First check the root page
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');

  // Wait for neo-app component to be defined
  await page.waitForFunction(() => {
    return customElements.get('neo-app') !== undefined;
  }, { timeout: 10000 }).catch(() => {
    console.log('neo-app component was not defined within timeout');
  });

  if (errors.length > 0) {
    console.log('JavaScript errors found:', errors);
  }

  console.log('All console messages:', messages.slice(-10)); // Last 10 messages

  let pageContent = await page.textContent('body');
  console.log('Root page content:', pageContent.substring(0, 200));

  // Try navigating to register
  await page.goto('http://localhost:3000/register');
  await page.waitForLoadState('networkidle');

  // Check URL
  const currentUrl = page.url();
  console.log('Current URL:', currentUrl);

  // Check page content again
  pageContent = await page.textContent('body');
  console.log('Register page content:', pageContent.substring(0, 500));

  // Take a screenshot
  await page.screenshot({ path: 'register-page-debug.png', fullPage: true });

  // Check if there are any custom elements
  const customElements = await page.evaluate(() => {
    const elements = document.querySelectorAll('*');
    const customElementNames = [];
    for (let el of elements) {
      if (el.tagName.includes('-')) {
        customElementNames.push(el.tagName.toLowerCase());
      }
    }
    return [...new Set(customElementNames)];
  });

  console.log('Custom elements found:', customElements);

  // Check if neo-app element exists
  const neoApp = page.locator('neo-app');
  console.log('NeoApp element exists:', await neoApp.count() > 0);

  // Check if router-outlet exists
  const routerOutlet = page.locator('#router-outlet');
  console.log('Router outlet exists:', await routerOutlet.count() > 0);

  // Check if registration-page element exists
  const registrationPage = page.locator('registration-page');
  console.log('Registration page element exists:', await registrationPage.count() > 0);

  // Check all scripts on the page
  const scripts = await page.evaluate(() => {
    const scriptElements = document.querySelectorAll('script');
    const scriptSources = [];
    for (let script of scriptElements) {
      scriptSources.push(script.src || 'inline script');
    }
    return scriptSources;
  });

  console.log('Scripts loaded:', scripts);

  // Check all custom elements on the page
  const allCustomElements = await page.evaluate(() => {
    const elements = document.querySelectorAll('*');
    const customElementNames = [];
    for (let el of elements) {
      if (el.tagName.includes('-')) {
        customElementNames.push(el.tagName.toLowerCase());
      }
    }
    return [...new Set(customElementNames)];
  });

  console.log('All custom elements:', allCustomElements);

  if (await registrationPage.count() > 0) {
    console.log('✅ Registration page component found');
  } else {
    console.log('❌ Registration page component not found');
  }
});