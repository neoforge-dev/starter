/**
 * E2E Test Fixtures and Utilities
 * Provides reusable helpers for E2E testing
 */

import { test as base, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Extended test with E2E-specific fixtures
 */
const test = base.extend({
  // Authenticated page fixture
  authenticatedPage: async ({ page }, use) => {
    // Set up authentication before test
    await setupAuthentication(page);
    await use(page);
    // Clean up after test
    await cleanupAuthentication(page);
  },

  // API client fixture
  apiClient: async ({}, use) => {
    const client = new E2EApiClient();
    await use(client);
  },

  // Test data fixture
  testData: async ({}, use) => {
    const data = loadTestData();
    await use(data);
  },

  // Tenant context fixture
  tenantContext: async ({}, use) => {
    const context = {
      tenantId: process.env.TEST_TENANT_ID || 'test-tenant',
      apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:8000',
      frontendBaseUrl: process.env.FRONTEND_BASE_URL || 'http://localhost:3000'
    };
    await use(context);
  }
});

/**
 * E2E API Client for backend interactions
 */
class E2EApiClient {
  constructor() {
    this.baseUrl = process.env.API_BASE_URL || 'http://localhost:8000';
    this.tenantId = process.env.TEST_TENANT_ID || 'test-tenant';
    this.authToken = null;
  }

  /**
   * Make authenticated API request
   */
  async request(method, endpoint, data = null, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'X-Tenant-ID': this.tenantId,
      ...options.headers
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    const requestOptions = {
      method,
      headers,
      ...options
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      requestOptions.body = JSON.stringify(data);
    }

    const response = await fetch(url, requestOptions);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json();
  }

  /**
   * Authenticate and store token
   */
  async authenticate(email, password) {
    const response = await this.request('POST', '/api/v1/auth/login', {
      email,
      password
    });

    this.authToken = response.access_token;
    return response;
  }

  /**
   * Create test user
   */
  async createUser(userData) {
    return this.request('POST', '/api/v1/auth/register', userData);
  }

  /**
   * Create test organization
   */
  async createOrganization(orgData) {
    return this.request('POST', '/api/v1/organizations', orgData);
  }

  /**
   * Create test item
   */
  async createItem(itemData) {
    return this.request('POST', '/api/v1/items', itemData);
  }

  /**
   * Clean up test data
   */
  async cleanup() {
    // Implementation for cleaning up test data
    this.authToken = null;
  }
}

/**
 * Authentication helpers for E2E tests
 */
async function setupAuthentication(page) {
  // Navigate to login page
  await page.goto('/login');

  // Get test user credentials
  const testData = loadTestData();
  const testUser = testData.users.find(u => u.role === 'user');

  if (!testUser) {
    throw new Error('No test user found in test data');
  }

  // Fill login form
  await page.fill('[data-testid="login-email"], input[type="email"]', testUser.email);
  await page.fill('[data-testid="login-password"], input[type="password"]', testUser.password);

  // Submit login
  await page.click('[data-testid="login-button"], button[type="submit"]');

  // Wait for successful login
  await page.waitForURL('**/dashboard', { timeout: 10000 });

  // Verify we're authenticated
  await expect(page.locator('[data-testid="user-menu"], .user-name')).toBeVisible();
}

async function cleanupAuthentication(page) {
  try {
    // Logout if logged in
    const logoutButton = page.locator('[data-testid="logout-button"], button:has-text("logout")').first();
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
      await page.waitForURL('**/login', { timeout: 5000 });
    }
  } catch (error) {
    // Ignore cleanup errors
    console.log('Warning: Authentication cleanup failed:', error.message);
  }
}

/**
 * Test data management
 */
function loadTestData() {
  const testDataPath = path.join(__dirname, 'test-data.json');

  if (!fs.existsSync(testDataPath)) {
    // Return default test data if file doesn't exist
    return {
      users: [
        {
          email: 'testuser@example.com',
          password: 'password123',
          full_name: 'Test User',
          role: 'user'
        },
        {
          email: 'admin@example.com',
          password: 'admin123',
          full_name: 'Admin User',
          role: 'admin'
        }
      ],
      organizations: [
        {
          name: 'Test Organization',
          description: 'Organization for E2E testing'
        }
      ],
      items: [
        {
          title: 'Test Item 1',
          description: 'First test item'
        }
      ]
    };
  }

  return JSON.parse(fs.readFileSync(testDataPath, 'utf8'));
}

/**
 * Page object helpers
 */
class PageObjects {
  static async waitForLoading(page) {
    // Wait for loading indicators to disappear
    await page.waitForFunction(() => {
      const loaders = document.querySelectorAll('.loading, .spinner, [data-loading="true"]');
      return loaders.length === 0;
    }, { timeout: 10000 });
  }

  static async waitForNetworkIdle(page) {
    // Wait for network to be idle
    await page.waitForLoadState('networkidle', { timeout: 10000 });
  }

  static async fillFormField(page, fieldName, value, options = {}) {
    const selectors = [
      `[data-testid="${fieldName}-input"]`,
      `input[name="${fieldName}"]`,
      `input[placeholder*="${fieldName}" i]`,
      `textarea[name="${fieldName}"]`,
      `#${fieldName}`
    ];

    for (const selector of selectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 1000 })) {
          await element.fill(value);
          return element;
        }
      } catch (error) {
        continue;
      }
    }

    throw new Error(`Could not find form field: ${fieldName}`);
  }

  static async clickButton(page, buttonText, options = {}) {
    const selectors = [
      `[data-testid="${buttonText.toLowerCase()}-button"]`,
      `button:has-text("${buttonText}")`,
      `input[type="submit"]:has-text("${buttonText}")`,
      `a:has-text("${buttonText}")`,
      `.btn:has-text("${buttonText}")`
    ];

    for (const selector of selectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 1000 })) {
          await element.click();
          return element;
        }
      } catch (error) {
        continue;
      }
    }

    throw new Error(`Could not find button: ${buttonText}`);
  }

  static async assertToastMessage(page, message, type = 'success') {
    const toastSelector = `.toast, .notification, .alert, [data-testid="toast"]`;
    await expect(page.locator(toastSelector)).toContainText(message);

    if (type) {
      await expect(page.locator(toastSelector)).toHaveClass(new RegExp(type, 'i'));
    }
  }

  static async assertErrorMessage(page, message) {
    const errorSelectors = [
      '.error',
      '.error-message',
      '[data-testid="error"]',
      '.validation-error',
      '.alert-danger'
    ];

    for (const selector of errorSelectors) {
      try {
        const element = page.locator(selector);
        if (await element.isVisible({ timeout: 1000 })) {
          await expect(element).toContainText(message);
          return;
        }
      } catch (error) {
        continue;
      }
    }

    throw new Error(`Could not find error message: ${message}`);
  }
}

/**
 * Test data generators
 */
class TestDataGenerator {
  static generateUser(overrides = {}) {
    const timestamp = Date.now();
    return {
      email: `testuser${timestamp}@example.com`,
      password: 'TestPassword123!',
      full_name: `Test User ${timestamp}`,
      ...overrides
    };
  }

  static generateOrganization(overrides = {}) {
    const timestamp = Date.now();
    return {
      name: `Test Organization ${timestamp}`,
      description: `Organization for testing ${timestamp}`,
      ...overrides
    };
  }

  static generateItem(overrides = {}) {
    const timestamp = Date.now();
    return {
      title: `Test Item ${timestamp}`,
      description: `Test item description ${timestamp}`,
      status: 'active',
      ...overrides
    };
  }
}

export {
  test,
  expect,
  E2EApiClient,
  PageObjects,
  TestDataGenerator
};