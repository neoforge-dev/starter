import { test, expect } from '@playwright/test';

test.describe('NeoForge Minimal Setup Verification', () => {
  test('should load neo-app component and router outlet', async ({ page }) => {
    // Navigate to the minimal test page
    await page.goto('http://localhost:8084/');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check page title
    await expect(page).toHaveTitle('NeoForge Minimal Test');

    // Check if neo-app component is defined
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
  });

  test('should navigate to registration page and show form', async ({ page }) => {
    // Navigate to the minimal test page
    await page.goto('http://localhost:8084/');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Click the register link
    const registerLink = page.locator('a[href="/register"]');
    await expect(registerLink).toBeVisible();
    await registerLink.click();

    // Wait for navigation
    await page.waitForURL('**/register');

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

    // Verify input types
    await expect(nameInput).toHaveAttribute('type', 'text');
    await expect(emailInput).toHaveAttribute('type', 'email');
    await expect(passwordInput).toHaveAttribute('type', 'password');
    await expect(confirmPasswordInput).toHaveAttribute('type', 'password');
    await expect(registerButton).toHaveAttribute('type', 'submit');
  });

  test('should handle 404 for unknown routes', async ({ page }) => {
    // Navigate to a non-existent route
    await page.goto('http://localhost:8084/unknown-route');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check that 404 content is shown
    const routerOutlet = page.locator('#router-outlet');
    await expect(routerOutlet).toContainText('Page Not Found');
    await expect(routerOutlet).toContainText('The requested page could not be found');
  });

  test('should maintain neo-app component structure', async ({ page }) => {
    // Navigate to the minimal test page
    await page.goto('http://localhost:8084/');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check neo-app component structure
    const neoApp = page.locator('neo-app');
    const header = neoApp.locator('header');
    const main = neoApp.locator('main');
    const footer = neoApp.locator('footer');

    await expect(header).toBeVisible();
    await expect(main).toHaveAttribute('id', 'router-outlet');
    await expect(footer).toBeVisible();

    // Check header content
    await expect(header).toContainText('NeoForge');

    // Check footer content
    await expect(footer).toContainText('NeoForge');
  });
});