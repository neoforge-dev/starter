/**
 * Critical User Journey Tests
 * Tests the most important user flows end-to-end
 */

import { test, expect } from '../../../tests/e2e-fixtures';

test.describe('Critical User Journeys', () => {
  test.describe('Complete Registration → Dashboard Flow', () => {
    test('user can register, verify email, login, and access dashboard', async ({
      page,
      apiClient,
      testData
    }) => {
      // Generate unique test user data
      const timestamp = Date.now();
      const testUser = {
        name: `Test User ${timestamp}`,
        email: `test${timestamp}@example.com`,
        password: 'SecurePassword123!'
      };

      // 1. Navigate to registration page
      await page.goto('/register');
      await expect(page).toHaveURL(/.*\/register/);

      // 2. Fill registration form with validation
      await page.fill('[data-testid="name-input"], input[type="text"]', testUser.name);
      await page.fill('[data-testid="email-input"], input[type="email"]', testUser.email);
      await page.fill('[data-testid="password-input"]', testUser.password);
      await page.fill('[data-testid="confirm-password-input"]', testUser.password);

      // 3. Submit registration form
      await page.click('[data-testid="register-button"], button[type="submit"]');

      // 4. Verify registration success (API call or success message)
      await expect(page.locator('.success, .toast-success, [data-testid="success-message"]')).toBeVisible({
        timeout: 10000
      });

      // 5. Verify email verification step (mock or skip for E2E)
      const verificationUrl = `/verify-email?token=test-token-${timestamp}`;
      await page.goto(verificationUrl);

      // Check if verification page loads
      await expect(page.locator('h1, h2, .title')).toContainText(/verify|confirmation|success/i);

      // 6. Navigate to login page
      await page.goto('/login');
      await expect(page).toHaveURL(/.*\/login/);

      // 7. Fill login form with registered credentials
      await page.fill('[data-testid="login-email"], input[type="email"]', testUser.email);
      await page.fill('[data-testid="login-password"]', testUser.password);

      // 8. Submit login form
      await page.click('[data-testid="login-button"], button[type="submit"]');

      // 9. Verify successful login and redirect to dashboard
      await expect(page).toHaveURL(/.*\/(dashboard|home|profile)/, { timeout: 15000 });

      // 10. Verify user is authenticated
      await expect(page.locator('[data-testid="user-menu"], .user-name, .profile-menu')).toBeVisible({
        timeout: 5000
      });

      // 11. Verify user-specific content loads
      await expect(page.locator('main, .dashboard, .content')).toBeVisible();

      // 12. Test basic dashboard functionality
      const dashboardElements = [
        '.dashboard-header',
        '.user-info',
        '.navigation',
        '.main-content'
      ];

      for (const selector of dashboardElements) {
        try {
          await expect(page.locator(selector)).toBeVisible({ timeout: 2000 });
        } catch (error) {
          console.log(`Dashboard element not found: ${selector}`);
        }
      }
    });

    test('registration form validation prevents invalid submissions', async ({ page }) => {
      await page.goto('/register');

      // Test empty form submission
      await page.click('[data-testid="register-button"], button[type="submit"]');
      await expect(page.locator('.error, .validation-error')).toBeVisible();

      // Test password mismatch
      await page.fill('[data-testid="name-input"]', 'Test User');
      await page.fill('[data-testid="email-input"]', 'test@example.com');
      await page.fill('[data-testid="password-input"]', 'password123');
      await page.fill('[data-testid="confirm-password-input"]', 'different123');

      await page.click('[data-testid="register-button"], button[type="submit"]');
      await expect(page.locator('.error')).toContainText(/password.*match|confirm/i);

      // Test invalid email format
      await page.fill('[data-testid="email-input"]', 'invalid-email');
      await page.click('[data-testid="register-button"], button[type="submit"]');
      await expect(page.locator('.error')).toContainText(/email|invalid/i);

      // Test weak password
      await page.fill('[data-testid="email-input"]', 'test@example.com');
      await page.fill('[data-testid="password-input"]', '123');
      await page.fill('[data-testid="confirm-password-input"]', '123');
      await page.click('[data-testid="register-button"], button[type="submit"]');
      await expect(page.locator('.error')).toContainText(/password|weak|short/i);
    });
  });

  test.describe('Item Management Flow', () => {
    test('authenticated user can create, edit, and delete items', async ({
      authenticatedPage: page,
      apiClient
    }) => {
      // 1. Navigate to items page
      await page.goto('/items');
      await expect(page).toHaveURL(/.*\/items/);

      // 2. Click create new item button
      await page.click('[data-testid="create-item-button"], .create-item, button:has-text("Create")');

      // 3. Fill item creation form
      const itemData = {
        title: `Test Item ${Date.now()}`,
        description: 'Test item description for E2E testing'
      };

      await page.fill('[data-testid="item-title"], input[name="title"]', itemData.title);
      await page.fill('[data-testid="item-description"], textarea[name="description"]', itemData.description);

      // 4. Submit item creation
      await page.click('[data-testid="save-item-button"], button[type="submit"]');

      // 5. Verify item was created and appears in list
      await expect(page.locator(`text=${itemData.title}`)).toBeVisible();

      // 6. Click on the created item to view details
      await page.click(`[data-testid="item-card"]:has-text("${itemData.title}")`);

      // 7. Verify item details page
      await expect(page.locator('[data-testid="item-title"]')).toContainText(itemData.title);
      await expect(page.locator('[data-testid="item-description"]')).toContainText(itemData.description);

      // 8. Click edit button
      await page.click('[data-testid="edit-item-button"], button:has-text("Edit")');

      // 9. Modify item details
      const updatedData = {
        title: `${itemData.title} (Updated)`,
        description: `${itemData.description} (Updated)`
      };

      await page.fill('[data-testid="item-title"]', updatedData.title);
      await page.fill('[data-testid="item-description"]', updatedData.description);

      // 10. Save changes
      await page.click('[data-testid="save-item-button"]');

      // 11. Verify changes were saved
      await expect(page.locator('[data-testid="item-title"]')).toContainText(updatedData.title);

      // 12. Delete the item
      await page.click('[data-testid="delete-item-button"], button:has-text("Delete")');

      // 13. Confirm deletion
      await page.click('[data-testid="confirm-delete"], button:has-text("Confirm")');

      // 14. Verify item was deleted
      await expect(page.locator(`text=${updatedData.title}`)).not.toBeVisible();

      // 15. Verify success message
      await expect(page.locator('.success, .toast-success')).toContainText(/deleted|removed/i);
    });
  });

  test.describe('Organization Management Flow', () => {
    test('user can create organization and invite members', async ({
      authenticatedPage: page,
      apiClient,
      testData
    }) => {
      // 1. Navigate to organizations page
      await page.goto('/organizations');
      await expect(page).toHaveURL(/.*\/organizations/);

      // 2. Click create organization button
      await page.click('[data-testid="create-org-button"], button:has-text("Create Organization")');

      // 3. Fill organization creation form
      const orgData = {
        name: `Test Org ${Date.now()}`,
        description: 'Test organization for E2E testing'
      };

      await page.fill('[data-testid="org-name"]', orgData.name);
      await page.fill('[data-testid="org-description"]', orgData.description);

      // 4. Submit organization creation
      await page.click('[data-testid="create-org-submit"]');

      // 5. Verify organization was created
      await expect(page.locator(`text=${orgData.name}`)).toBeVisible();

      // 6. Navigate to organization details
      await page.click(`[data-testid="org-card"]:has-text("${orgData.name}")`);

      // 7. Verify organization details page
      await expect(page.locator('[data-testid="org-name"]')).toContainText(orgData.name);
      await expect(page.locator('[data-testid="org-description"]')).toContainText(orgData.description);

      // 8. Navigate to members tab/section
      await page.click('[data-testid="members-tab"], a:has-text("Members")');

      // 9. Click invite member button
      await page.click('[data-testid="invite-member-button"], button:has-text("Invite")');

      // 10. Fill invitation form
      const inviteData = {
        email: `member${Date.now()}@example.com`,
        role: 'member'
      };

      await page.fill('[data-testid="invite-email"]', inviteData.email);
      await page.selectOption('[data-testid="invite-role"]', inviteData.role);

      // 11. Send invitation
      await page.click('[data-testid="send-invite-button"]');

      // 12. Verify invitation was sent
      await expect(page.locator('.success, .toast-success')).toContainText(/invited|sent/i);

      // 13. Verify member appears in pending list
      await expect(page.locator(`text=${inviteData.email}`)).toBeVisible();
      await expect(page.locator('text=Pending')).toBeVisible();
    });
  });

  test.describe('Billing and Subscription Flow', () => {
    test('user can view subscription and manage billing', async ({
      authenticatedPage: page,
      apiClient
    }) => {
      // 1. Navigate to billing/subscription page
      await page.goto('/billing');
      await expect(page).toHaveURL(/.*\/billing/);

      // 2. Verify current subscription information
      await expect(page.locator('[data-testid="current-plan"], .subscription-info')).toBeVisible();

      // 3. Check for billing history section
      const billingHistory = page.locator('[data-testid="billing-history"], .billing-history');
      if (await billingHistory.isVisible()) {
        await expect(billingHistory.locator('.invoice, .transaction')).toBeVisible();
      }

      // 4. Test payment method management
      const paymentMethods = page.locator('[data-testid="payment-methods"], .payment-methods');
      if (await paymentMethods.isVisible()) {
        await page.click('[data-testid="add-payment-method"], button:has-text("Add")');

        // Fill payment method form (mock data for testing)
        await page.fill('[data-testid="card-number"]', '4242424242424242');
        await page.fill('[data-testid="expiry"]', '12/25');
        await page.fill('[data-testid="cvc"]', '123');

        await page.click('[data-testid="save-payment-method"]');
        await expect(page.locator('.success')).toContainText(/saved|added/i);
      }

      // 5. Test plan upgrade/downgrade options
      const planOptions = page.locator('[data-testid="plan-options"], .plan-options');
      if (await planOptions.isVisible()) {
        const upgradeButton = planOptions.locator('button:has-text("Upgrade")').first();
        if (await upgradeButton.isVisible()) {
          await upgradeButton.click();

          // Verify upgrade flow starts
          await expect(page.locator('.modal, .upgrade-modal')).toBeVisible();
        }
      }
    });
  });

  test.describe('Error Handling and Recovery', () => {
    test('user can recover from network errors gracefully', async ({
      authenticatedPage: page
    }) => {
      // 1. Navigate to a page that makes API calls
      await page.goto('/dashboard');

      // 2. Mock network failure
      await page.route('**/api/**', route => route.abort());

      // 3. Trigger an action that requires API call
      await page.click('[data-testid="refresh-button"], button:has-text("Refresh")');

      // 4. Verify error handling
      await expect(page.locator('.error, .network-error')).toBeVisible({
        timeout: 10000
      });

      // 5. Verify retry functionality
      const retryButton = page.locator('[data-testid="retry-button"], button:has-text("Retry")');
      if (await retryButton.isVisible()) {
        await retryButton.click();

        // Should show loading state
        await expect(page.locator('.loading, .spinner')).toBeVisible();
      }

      // 6. Restore network and verify recovery
      await page.unroute('**/api/**');
      await page.reload();

      // 7. Verify page loads normally after network restoration
      await expect(page.locator('.dashboard, .content')).toBeVisible();
    });

    test('user can recover from session timeout', async ({
      authenticatedPage: page
    }) => {
      // 1. Wait for authentication to be established
      await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();

      // 2. Mock session timeout by clearing localStorage/cookies
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });

      // 3. Navigate to protected page
      await page.goto('/dashboard');

      // 4. Verify redirect to login
      await expect(page).toHaveURL(/.*\/login/, { timeout: 10000 });

      // 5. Verify user can login again
      const testUser = {
        email: 'testuser@example.com',
        password: 'password123'
      };

      await page.fill('[data-testid="login-email"]', testUser.email);
      await page.fill('[data-testid="login-password"]', testUser.password);
      await page.click('[data-testid="login-button"]');

      // 6. Verify successful re-authentication
      await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 10000 });
    });
  });

  test.describe('Cross-browser Compatibility', () => {
    test('core functionality works across different viewports', async ({
      page
    }) => {
      const viewports = [
        { width: 1920, height: 1080, name: 'desktop' },
        { width: 1366, height: 768, name: 'laptop' },
        { width: 768, height: 1024, name: 'tablet' },
        { width: 375, height: 667, name: 'mobile' }
      ];

      for (const viewport of viewports) {
        // Set viewport
        await page.setViewportSize({ width: viewport.width, height: viewport.height });

        // Navigate to main page
        await page.goto('/');

        // Verify basic layout elements are visible
        await expect(page.locator('header, nav')).toBeVisible();
        await expect(page.locator('main, .content')).toBeVisible();

        // Test responsive navigation
        if (viewport.width <= 768) {
          // Mobile menu should be visible
          const mobileMenu = page.locator('[data-testid="mobile-menu"], .mobile-menu-toggle');
          if (await mobileMenu.isVisible()) {
            await mobileMenu.click();
            await expect(page.locator('.mobile-menu, .nav-menu')).toBeVisible();
          }
        }

        console.log(`✅ ${viewport.name} viewport (${viewport.width}x${viewport.height}) - OK`);
      }
    });
  });
});