import { test, expect } from '@playwright/test';

test.describe('Authentication Complete Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Start from the homepage
    await page.goto('/');
  });

  test('complete user registration, verification, and login flow', async ({ page }) => {
    // Generate unique test user data
    const timestamp = Date.now();
    const testUser = {
      name: `Test User ${timestamp}`,
      email: `test${timestamp}@example.com`,
      password: 'SecurePassword123!'
    };

    // 1. Navigate to registration page
    await page.click('text=Sign Up');
    await expect(page).toHaveURL(/.*\/register/);

    // 2. Fill registration form
    await page.fill('[data-testid="name-input"], input[type="text"][placeholder*="name" i]', testUser.name);
    await page.fill('[data-testid="email-input"], input[type="email"]', testUser.email);
    await page.fill('[data-testid="password-input"], input[type="password"]:first-of-type', testUser.password);
    await page.fill('[data-testid="confirm-password-input"], input[type="password"]:last-of-type', testUser.password);

    // 3. Submit registration form
    await page.click('[data-testid="register-button"], button[type="submit"]');

    // 4. Verify registration success message appears
    await expect(page.getByText(/registration successful|check your email|verification/i)).toBeVisible({
      timeout: 10000
    });

    // 5. Simulate email verification (in real E2E, this would require email service integration)
    // For now, we'll verify the verification page exists and can be accessed
    const verificationUrl = `/verify-email?token=test-token-${timestamp}`;
    await page.goto(verificationUrl);
    
    // Check if verification page loads (even if token is invalid for test)
    await expect(page.locator('h1, h2, .title')).toContainText(/verify|confirmation/i);

    // 6. Navigate to login page
    await page.goto('/login');
    await expect(page).toHaveURL(/.*\/login/);

    // 7. Fill login form with registered credentials
    await page.fill('[data-testid="login-email"], input[type="email"]', testUser.email);
    await page.fill('[data-testid="login-password"], input[type="password"]', testUser.password);

    // 8. Submit login form
    await page.click('[data-testid="login-button"], button[type="submit"]');

    // 9. Verify successful login and redirect to dashboard
    await expect(page).toHaveURL(/.*\/(dashboard|home|profile)/, { timeout: 10000 });

    // 10. Verify user is authenticated (check for user-specific content)
    await expect(page.locator('[data-testid="user-menu"], .user-name, .profile-menu')).toBeVisible({
      timeout: 5000
    });
  });

  test('login to dashboard access and logout flow', async ({ page }) => {
    // Use a pre-existing test user for login flow
    const existingUser = {
      email: 'testuser@example.com',
      password: 'password123'
    };

    // 1. Navigate to login page
    await page.goto('/login');

    // 2. Fill login form
    await page.fill('[data-testid="login-email"], input[type="email"]', existingUser.email);
    await page.fill('[data-testid="login-password"], input[type="password"]', existingUser.password);

    // 3. Submit login
    await page.click('[data-testid="login-button"], button[type="submit"]');

    // 4. Verify redirect to dashboard/protected area
    await expect(page).toHaveURL(/.*\/(dashboard|home|profile)/, { timeout: 10000 });

    // 5. Verify access to protected content
    await expect(page.locator('main, .dashboard, .content')).toBeVisible();

    // 6. Verify user can navigate to protected pages
    const dashboardLink = page.locator('a[href*="dashboard"], nav a:has-text("Dashboard")').first();
    if (await dashboardLink.isVisible()) {
      await dashboardLink.click();
      await expect(page).toHaveURL(/.*\/dashboard/);
    }

    // 7. Perform logout
    const logoutButton = page.locator('[data-testid="logout-button"], button:has-text("logout"), a:has-text("logout")').first();
    await logoutButton.click();

    // 8. Verify redirect after logout
    await expect(page).toHaveURL(/.*\/(|login|home)/, { timeout: 5000 });

    // 9. Verify cannot access protected routes after logout
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/.*\/(login|unauthorized)/, { timeout: 5000 });
  });

  test('authentication guards protect routes correctly', async ({ page }) => {
    // 1. Attempt to access protected route while unauthenticated
    await page.goto('/dashboard');
    
    // 2. Verify redirect to login page
    await expect(page).toHaveURL(/.*\/(login|auth)/, { timeout: 5000 });

    // 3. Login with valid credentials
    await page.fill('[data-testid="login-email"], input[type="email"]', 'testuser@example.com');
    await page.fill('[data-testid="login-password"], input[type="password"]', 'password123');
    await page.click('[data-testid="login-button"], button[type="submit"]');

    // 4. Verify access is now granted to protected route
    await expect(page).toHaveURL(/.*\/(dashboard|home|profile)/, { timeout: 10000 });

    // 5. Test guest-only routes redirect authenticated users
    await page.goto('/login');
    // Should redirect authenticated users away from login
    await page.waitForTimeout(2000);
    await expect(page).not.toHaveURL(/.*\/login$/);
  });

  test('login error handling and validation', async ({ page }) => {
    await page.goto('/login');

    // 1. Test empty form submission
    await page.click('[data-testid="login-button"], button[type="submit"]');
    await expect(page.locator('.error, .validation-error, [data-testid="error"]')).toBeVisible();

    // 2. Test invalid email format
    await page.fill('[data-testid="login-email"], input[type="email"]', 'invalid-email');
    await page.click('[data-testid="login-button"], button[type="submit"]');
    await expect(page.locator('.error, .validation-error')).toContainText(/email|invalid/i);

    // 3. Test invalid credentials
    await page.fill('[data-testid="login-email"], input[type="email"]', 'nonexistent@example.com');
    await page.fill('[data-testid="login-password"], input[type="password"]', 'wrongpassword');
    await page.click('[data-testid="login-button"], button[type="submit"]');
    
    // Should show error message for invalid credentials
    await expect(page.locator('.error, .error-message, [data-testid="error"]')).toBeVisible({
      timeout: 10000
    });
  });

  test('registration form validation', async ({ page }) => {
    await page.goto('/register');

    // 1. Test empty form submission
    await page.click('[data-testid="register-button"], button[type="submit"]');
    await expect(page.locator('.error, .validation-error')).toBeVisible();

    // 2. Test password mismatch
    await page.fill('[data-testid="name-input"], input[type="text"]', 'Test User');
    await page.fill('[data-testid="email-input"], input[type="email"]', 'test@example.com');
    await page.fill('[data-testid="password-input"], input[type="password"]:first-of-type', 'password123');
    await page.fill('[data-testid="confirm-password-input"], input[type="password"]:last-of-type', 'different123');
    
    await page.click('[data-testid="register-button"], button[type="submit"]');
    await expect(page.locator('.error')).toContainText(/password.*match|confirm.*password/i);

    // 3. Test invalid email format
    await page.fill('[data-testid="email-input"], input[type="email"]', 'invalid-email');
    await page.click('[data-testid="register-button"], button[type="submit"]');
    await expect(page.locator('.error')).toContainText(/email|invalid/i);
  });
});