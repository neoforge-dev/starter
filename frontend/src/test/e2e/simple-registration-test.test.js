import { test, expect } from '@playwright/test';

test('test registration page component directly', async ({ page }) => {
  // Load the test HTML file directly
  await page.goto('http://localhost:3000/test-registration.html');
  await page.waitForLoadState('networkidle');

  // Wait for the registration page component to be defined
  await page.waitForFunction(() => {
    return customElements.get('registration-page') !== undefined;
  }, { timeout: 10000 });

  // Check if the component is rendered
  const registrationPage = page.locator('registration-page');
  await expect(registrationPage).toBeVisible();

  // Check for data-testid elements
  await expect(page.locator('[data-testid="name-input"]')).toBeVisible();
  await expect(page.locator('[data-testid="email-input"]')).toBeVisible();
  await expect(page.locator('[data-testid="password-input"]')).toBeVisible();
  await expect(page.locator('[data-testid="confirm-password-input"]')).toBeVisible();
  await expect(page.locator('[data-testid="register-button"]')).toBeVisible();

  console.log('✅ Registration page component works correctly with data-testid attributes');
});