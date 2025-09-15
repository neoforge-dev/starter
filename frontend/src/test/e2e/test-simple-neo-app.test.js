import { test, expect } from '@playwright/test';

test('test simplified neo-app component', async ({ page }) => {
  // Monitor network requests
  const requests = [];
  page.on('request', request => {
    if (request.url().includes('.js')) {
      requests.push(request.url());
    }
  });

  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');

  console.log('JavaScript files requested:');
  requests.forEach(url => console.log(' -', url));

  // Check page content
  const bodyText = await page.textContent('body');
  console.log('Page content preview:', bodyText.substring(0, 300));

  // Check if neo-app component is defined
  const neoAppDefined = await page.evaluate(() => {
    return customElements.get('neo-app') !== undefined;
  });

  console.log('neo-app defined:', neoAppDefined);

  // Check if neo-app element exists in DOM
  const neoAppElement = await page.evaluate(() => {
    return document.querySelector('neo-app') !== null;
  });

  console.log('neo-app element exists in DOM:', neoAppElement);

  if (neoAppDefined && neoAppElement) {
    // Check if router outlet exists
    const routerOutlet = page.locator('#router-outlet');
    const outletExists = await routerOutlet.count() > 0;
    console.log('Router outlet exists:', outletExists);

    if (outletExists) {
      console.log('✅ Simplified neo-app component is working');
    } else {
      console.log('❌ Router outlet not found');
    }
  } else {
    console.log('❌ neo-app component not working');
  }
});