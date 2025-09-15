import { test, expect } from '@playwright/test';

test.describe('NeoForge Main Application', () => {
  test('should load main application and neo-app component', async ({ page }) => {
    // Navigate to the main application
    await page.goto('http://localhost:3001/');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check page title
    await expect(page).toHaveTitle('NeoForge - Modern Full-Stack Starter Kit');

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

    // Check initial content (should show home page)
    await expect(routerOutlet).toContainText('Home');
    await expect(routerOutlet).toContainText('This is a simplified version for debugging');
  });

  test('should navigate to registration page', async ({ page }) => {
    // Navigate to the main application
    await page.goto('http://localhost:3001/');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Navigate to registration page
    await page.evaluate(() => {
      window.history.pushState(null, '', '/register');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });

    // Wait for route to be handled
    await page.waitForTimeout(500);

    // Check URL
    expect(page.url()).toContain('/register');

    // Check registration page title
    const pageTitle = page.locator('h2');
    await expect(pageTitle).toContainText('Registration Page');

    // Check all form elements with data-testid attributes
    const nameInput = page.locator('[data-testid="name-input"]');
    const emailInput = page.locator('[data-testid="email-input"]');
    const passwordInput = page.locator('[data-testid="password-input"]');
    const confirmPasswordInput = page.locator('[data-testid="confirm-password-input"]');
    const registerButton = page.locator('[data-testid="register-button"]');

    await expect(nameInput).toBeVisible();
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(confirmPasswordInput).toBeVisible();
    await expect(registerButton).toBeVisible();
  });

  test('should handle 404 for unknown routes', async ({ page }) => {
    // Navigate to the main application
    await page.goto('http://localhost:3001/');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Navigate to unknown route
    await page.evaluate(() => {
      window.history.pushState(null, '', '/unknown-route');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });

    // Wait for route to be handled
    await page.waitForTimeout(500);

    // Check that 404 content is shown
    const routerOutlet = page.locator('#router-outlet');
    await expect(routerOutlet).toContainText('Page Not Found');
    await expect(routerOutlet).toContainText('The requested page could not be found');
  });
});