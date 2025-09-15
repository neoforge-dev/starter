/**
 * API Integration Tests
 * Tests frontend-backend communication and data flow
 */

import { test, expect } from '../../tests/e2e-fixtures';

test.describe('API Integration Tests', () => {
  test.describe('Authentication API Integration', () => {
    test('login API call returns correct response format', async ({
      page,
      apiClient
    }) => {
      // Navigate to login page
      await page.goto('/login');

      // Fill login form
      await page.fill('[data-testid="login-email"]', 'testuser@example.com');
      await page.fill('[data-testid="login-password"]', 'password123');

      // Intercept API call
      const loginRequest = page.waitForRequest('**/api/v1/auth/login');
      const loginResponse = page.waitForResponse('**/api/v1/auth/login');

      // Submit form
      await page.click('[data-testid="login-button"]');

      // Verify API request
      const request = await loginRequest;
      expect(request.method()).toBe('POST');
      expect(request.headers()['x-tenant-id']).toBe('test-tenant');

      const requestData = JSON.parse(request.postData());
      expect(requestData).toHaveProperty('email', 'testuser@example.com');
      expect(requestData).toHaveProperty('password', 'password123');

      // Verify API response
      const response = await loginResponse;
      expect(response.status()).toBe(200);

      const responseData = await response.json();
      expect(responseData).toHaveProperty('access_token');
      expect(responseData).toHaveProperty('token_type', 'bearer');
    });

    test('registration API integration works correctly', async ({
      page
    }) => {
      const timestamp = Date.now();
      const testUser = {
        name: `API Test User ${timestamp}`,
        email: `api-test${timestamp}@example.com`,
        password: 'SecurePassword123!'
      };

      await page.goto('/register');

      // Fill registration form
      await page.fill('[data-testid="name-input"]', testUser.name);
      await page.fill('[data-testid="email-input"]', testUser.email);
      await page.fill('[data-testid="password-input"]', testUser.password);
      await page.fill('[data-testid="confirm-password-input"]', testUser.password);

      // Intercept registration API call
      const registerResponse = page.waitForResponse('**/api/v1/auth/register');

      // Submit form
      await page.click('[data-testid="register-button"]');

      // Verify API response
      const response = await registerResponse;
      expect([200, 201, 409]).toContain(response.status()); // Success or user exists

      if (response.status() === 200 || response.status() === 201) {
        const responseData = await response.json();
        expect(responseData).toHaveProperty('message');
        expect(responseData.message).toMatch(/success|created|registered/i);
      }
    });
  });

  test.describe('Data Fetching and Caching', () => {
    test('dashboard loads user data correctly', async ({
      authenticatedPage: page
    }) => {
      await page.goto('/dashboard');

      // Intercept API calls for user data
      const apiCalls = [];
      await page.route('**/api/**', route => {
        apiCalls.push({
          url: route.request().url(),
          method: route.request().method()
        });
        route.continue();
      });

      // Wait for page to load completely
      await page.waitForLoadState('networkidle');

      // Verify essential API calls were made
      const userCalls = apiCalls.filter(call =>
        call.url.includes('/api/v1/users/me') ||
        call.url.includes('/api/v1/auth/me')
      );
      expect(userCalls.length).toBeGreaterThan(0);

      // Verify user data is displayed
      await expect(page.locator('[data-testid="user-name"], .user-name')).toBeVisible();
      await expect(page.locator('[data-testid="user-email"], .user-email')).toBeVisible();
    });

    test('items list loads and displays data correctly', async ({
      authenticatedPage: page
    }) => {
      await page.goto('/items');

      // Intercept items API call
      const itemsResponse = page.waitForResponse('**/api/v1/items*');

      // Wait for items to load
      await page.waitForLoadState('networkidle');

      const response = await itemsResponse;
      expect(response.status()).toBe(200);

      const responseData = await response.json();

      // Verify response structure
      expect(responseData).toHaveProperty('items');
      expect(Array.isArray(responseData.items)).toBe(true);

      // Verify UI displays items
      if (responseData.items.length > 0) {
        await expect(page.locator('[data-testid="item-card"], .item-card')).toBeVisible();
      } else {
        // No items case
        await expect(page.locator('[data-testid="no-items"], .no-items')).toBeVisible();
      }
    });
  });

  test.describe('Real-time Data Updates', () => {
    test('form submissions update UI immediately', async ({
      authenticatedPage: page
    }) => {
      await page.goto('/items');

      // Click create item
      await page.click('[data-testid="create-item-button"]');

      // Fill form
      const itemTitle = `Real-time Test ${Date.now()}`;
      await page.fill('[data-testid="item-title"]', itemTitle);
      await page.fill('[data-testid="item-description"]', 'Testing real-time updates');

      // Intercept API call
      const createResponse = page.waitForResponse('**/api/v1/items');

      // Submit form
      await page.click('[data-testid="save-item-button"]');

      // Verify API response
      const response = await createResponse;
      expect([200, 201]).toContain(response.status());

      // Verify UI updates immediately (optimistic update)
      await expect(page.locator(`text=${itemTitle}`)).toBeVisible({
        timeout: 5000
      });

      // Verify success message
      await expect(page.locator('.success, .toast-success')).toBeVisible();
    });

    test('error states are handled gracefully', async ({
      authenticatedPage: page
    }) => {
      await page.goto('/items');

      // Mock API failure
      await page.route('**/api/v1/items', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            detail: 'Internal server error'
          })
        });
      });

      // Try to create item
      await page.click('[data-testid="create-item-button"]');
      await page.fill('[data-testid="item-title"]', 'Error Test Item');
      await page.click('[data-testid="save-item-button"]');

      // Verify error handling
      await expect(page.locator('.error, .error-message')).toBeVisible();
      await expect(page.locator('.error')).toContainText(/error|failed/i);
    });
  });

  test.describe('Component-API Integration', () => {
    test('data table component integrates with API', async ({
      authenticatedPage: page
    }) => {
      await page.goto('/items');

      // Wait for data table to load
      await page.waitForSelector('[data-testid="items-table"], .data-table, table');

      // Verify table structure
      await expect(page.locator('thead, .table-header')).toBeVisible();
      await expect(page.locator('tbody, .table-body')).toBeVisible();

      // Test sorting functionality
      const sortButton = page.locator('[data-testid="sort-title"], .sort-button').first();
      if (await sortButton.isVisible()) {
        await sortButton.click();

        // Verify API call for sorting
        const sortResponse = page.waitForResponse('**/api/v1/items*');
        const response = await sortResponse;
        expect(response.status()).toBe(200);

        // Verify URL contains sort parameter
        const url = response.url();
        expect(url).toMatch(/[?&]sort=|order=/);
      }

      // Test pagination
      const nextButton = page.locator('[data-testid="next-page"], .next-button');
      if (await nextButton.isVisible()) {
        await nextButton.click();

        // Verify pagination API call
        const paginationResponse = page.waitForResponse('**/api/v1/items*');
        const response = await paginationResponse;
        expect(response.status()).toBe(200);

        // Verify URL contains page parameter
        const url = response.url();
        expect(url).toMatch(/[?&]page=/);
      }
    });

    test('search functionality works with API', async ({
      authenticatedPage: page
    }) => {
      await page.goto('/items');

      // Find search input
      const searchInput = page.locator('[data-testid="search-input"], input[type="search"]');

      if (await searchInput.isVisible()) {
        // Type search query
        await searchInput.fill('test');

        // Wait for debounced API call
        await page.waitForTimeout(500);

        // Verify search API call
        const searchResponse = page.waitForResponse('**/api/v1/items*');
        const response = await searchResponse;
        expect(response.status()).toBe(200);

        // Verify URL contains search parameter
        const url = response.url();
        expect(url).toMatch(/[?&]search=|query=/);

        // Verify results are filtered
        const items = page.locator('[data-testid="item-card"], .item-card');
        const itemCount = await items.count();

        // Should show filtered results or no results message
        if (itemCount === 0) {
          await expect(page.locator('[data-testid="no-results"], .no-results')).toBeVisible();
        }
      }
    });

    test('form validation integrates with API constraints', async ({
      authenticatedPage: page
    }) => {
      await page.goto('/items');

      await page.click('[data-testid="create-item-button"]');

      // Test required field validation
      await page.click('[data-testid="save-item-button"]');

      // Should show validation errors
      await expect(page.locator('.error, .validation-error')).toBeVisible();

      // Test field length validation
      const longTitle = 'a'.repeat(300); // Assuming max length is less than 300
      await page.fill('[data-testid="item-title"]', longTitle);
      await page.click('[data-testid="save-item-button"]');

      // Should show length validation error
      await expect(page.locator('.error')).toContainText(/too long|maximum|length/i);

      // Test valid input
      await page.fill('[data-testid="item-title"]', 'Valid Test Item');
      await page.fill('[data-testid="item-description"]', 'Valid description');

      // Intercept successful API call
      const successResponse = page.waitForResponse('**/api/v1/items');

      await page.click('[data-testid="save-item-button"]');

      const response = await successResponse;
      expect([200, 201]).toContain(response.status());
    });
  });

  test.describe('Loading States and Performance', () => {
    test('loading states are shown during API calls', async ({
      authenticatedPage: page
    }) => {
      await page.goto('/items');

      // Click create item
      await page.click('[data-testid="create-item-button"]');

      // Fill form
      await page.fill('[data-testid="item-title"]', 'Loading Test Item');
      await page.fill('[data-testid="item-description"]', 'Testing loading states');

      // Submit form
      await page.click('[data-testid="save-item-button"]');

      // Verify loading state appears
      await expect(page.locator('.loading, .spinner, [data-loading="true"]')).toBeVisible();

      // Wait for API call to complete
      await page.waitForResponse('**/api/v1/items');

      // Verify loading state disappears
      await expect(page.locator('.loading, .spinner, [data-loading="true"]')).not.toBeVisible();
    });

    test('skeleton loading is shown for data tables', async ({
      authenticatedPage: page
    }) => {
      await page.goto('/items');

      // Verify skeleton loading appears initially
      await expect(page.locator('.skeleton, .loading-skeleton, [data-skeleton="true"]')).toBeVisible();

      // Wait for data to load
      await page.waitForResponse('**/api/v1/items');

      // Verify skeleton disappears and real data appears
      await expect(page.locator('.skeleton, .loading-skeleton')).not.toBeVisible();
      await expect(page.locator('[data-testid="items-table"], .data-table')).toBeVisible();
    });
  });

  test.describe('Error Recovery and Retry Logic', () => {
    test('retry mechanism works for failed API calls', async ({
      authenticatedPage: page
    }) => {
      await page.goto('/items');

      // Mock network failure
      await page.route('**/api/v1/items', route => route.abort(), { times: 1 });

      // Trigger API call
      await page.click('[data-testid="refresh-button"], button:has-text("Refresh")');

      // Verify error state
      await expect(page.locator('.error, .network-error')).toBeVisible();

      // Verify retry button appears
      await expect(page.locator('[data-testid="retry-button"], button:has-text("Retry")')).toBeVisible();

      // Click retry
      await page.click('[data-testid="retry-button"]');

      // Verify retry API call succeeds
      const retryResponse = await page.waitForResponse('**/api/v1/items');
      expect(retryResponse.status()).toBe(200);

      // Verify error state clears
      await expect(page.locator('.error, .network-error')).not.toBeVisible();
    });

    test('offline mode shows appropriate messaging', async ({
      authenticatedPage: page
    }) => {
      await page.goto('/items');

      // Mock all API calls to fail (simulate offline)
      await page.route('**/api/**', route => route.abort());

      // Trigger API call
      await page.click('[data-testid="create-item-button"]');

      // Verify offline error message
      await expect(page.locator('.offline, .network-error')).toBeVisible();
      await expect(page.locator('.offline')).toContainText(/offline|network|connection/i);
    });
  });
});