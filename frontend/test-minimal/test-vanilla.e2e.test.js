import { test, expect } from '@playwright/test';

test.describe('NeoForge Vanilla Component Test', () => {
  test('should load vanilla neo-app component', async ({ page }) => {
    // Navigate to the vanilla test page
    await page.goto('http://localhost:8084/vanilla-test.html');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check page title
    await expect(page).toHaveTitle('NeoForge Vanilla Test');

    // Check if neo-app custom element is defined
    const neoAppDefined = await page.evaluate(() => {
      return customElements.get('neo-app') !== undefined;
    });
    expect(neoAppDefined).toBe(true);

    // Check if neo-app element exists in DOM
    const neoAppElement = page.locator('neo-app');
    await expect(neoAppElement).toBeVisible();

    // Check if router outlet exists
    const routerOutlet = page.locator('#router-outlet');
    await expect(routerOutlet).toBeVisible();

    // Check initial content
    await expect(routerOutlet).toContainText('Welcome to NeoForge');
    await expect(routerOutlet).toContainText('The router outlet is ready');

    // Check register link
    const registerLink = page.locator('a[href="/register"]');
    await expect(registerLink).toBeVisible();

    // Check component structure
    const header = neoAppElement.locator('header');
    const footer = neoAppElement.locator('footer');

    await expect(header).toBeVisible();
    await expect(footer).toBeVisible();

    // Check header content
    await expect(header).toContainText('NeoForge');

    // Check footer content
    await expect(footer).toContainText('NeoForge');
  });
});