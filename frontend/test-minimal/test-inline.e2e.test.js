import { test, expect } from '@playwright/test';

test.describe('NeoForge Inline Component Test', () => {
  test('should load inline neo-app component and router outlet', async ({ page }) => {
    // Navigate to the inline test page
    await page.goto('http://localhost:8084/inline-test.html');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Navigate to root path to trigger home route
    await page.evaluate(() => {
      window.history.pushState(null, '', '/');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });

    // Wait for route to be handled
    await page.waitForTimeout(500);

    // Check page title (router updates it to "Home - NeoForge")
    await expect(page).toHaveTitle('Home - NeoForge');

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

    // Check initial content (router renders home page)
    await expect(routerOutlet).toContainText('Home');
    await expect(routerOutlet).toContainText('This is a simplified version for debugging');
  });

  test('should navigate to registration page and show form', async ({ page }) => {
    // Navigate to the inline test page
    await page.goto('http://localhost:8084/inline-test.html');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Navigate to root path to trigger home route
    await page.evaluate(() => {
      window.history.pushState(null, '', '/');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });

    // Wait for route to be handled
    await page.waitForTimeout(500);

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
    await page.goto('http://localhost:8084/inline-test.html');
    await page.waitForLoadState('networkidle');

    // Navigate to unknown route
    await page.evaluate(() => {
      window.history.pushState(null, '', '/unknown-route');
      // Trigger popstate event
      window.dispatchEvent(new PopStateEvent('popstate'));
    });

    // Wait a bit for the route to be handled
    await page.waitForTimeout(500);

    // Check that 404 content is shown
    const routerOutlet = page.locator('#router-outlet');
    await expect(routerOutlet).toContainText('Page Not Found');
    await expect(routerOutlet).toContainText('The requested page could not be found');
  });

  test('should maintain neo-app component structure', async ({ page }) => {
    // Navigate to the inline test page
    await page.goto('http://localhost:8084/inline-test.html');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Navigate to root path to trigger home route
    await page.evaluate(() => {
      window.history.pushState(null, '', '/');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });

    // Wait for route to be handled
    await page.waitForTimeout(500);

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