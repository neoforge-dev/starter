/**
 * Authentication Testing Utilities
 * 
 * This module provides utility functions for testing authentication flows,
 * including session management, token handling, and user state management.
 */

import { vi } from 'vitest';

/**
 * Mock localStorage implementation for testing
 */
export class MockLocalStorage {
  constructor() {
    this.store = new Map();
  }

  getItem(key) {
    return this.store.get(key) || null;
  }

  setItem(key, value) {
    this.store.set(key, String(value));
  }

  removeItem(key) {
    this.store.delete(key);
  }

  clear() {
    this.store.clear();
  }

  key(index) {
    const keys = Array.from(this.store.keys());
    return keys[index] || null;
  }

  get length() {
    return this.store.size;
  }
}

/**
 * Mock sessionStorage implementation for testing
 */
export class MockSessionStorage extends MockLocalStorage {}

/**
 * Authentication test utilities
 */
export class AuthTestUtils {
  constructor() {
    this.mockLocalStorage = new MockLocalStorage();
    this.mockSessionStorage = new MockSessionStorage();
    this.originalFetch = global.fetch;
    this.fetchMocks = new Map();
  }

  /**
   * Setup authentication testing environment
   */
  setup() {
    // Mock localStorage and sessionStorage BEFORE any services are instantiated
    Object.defineProperty(window, 'localStorage', {
      value: this.mockLocalStorage,
      writable: true,
      configurable: true
    });
    
    Object.defineProperty(global, 'localStorage', {
      value: this.mockLocalStorage,
      writable: true,
      configurable: true
    });
    
    Object.defineProperty(window, 'sessionStorage', {
      value: this.mockSessionStorage,
      writable: true,
      configurable: true
    });
    
    Object.defineProperty(global, 'sessionStorage', {
      value: this.mockSessionStorage,
      writable: true,
      configurable: true
    });

    // Mock fetch
    global.fetch = vi.fn();
    
    return this;
  }

  /**
   * Cleanup after tests
   */
  cleanup() {
    this.mockLocalStorage.clear();
    this.mockSessionStorage.clear();
    this.fetchMocks.clear();
    
    if (this.originalFetch) {
      global.fetch = this.originalFetch;
    }
  }

  /**
   * Setup fetch mock for specific URL patterns
   */
  setupFetchMock(urlPattern, mockResponse) {
    this.fetchMocks.set(urlPattern, mockResponse);
    
    global.fetch.mockImplementation(async (url, options = {}) => {
      for (const [pattern, response] of this.fetchMocks.entries()) {
        if (url.includes(pattern)) {
          if (typeof response === 'function') {
            return response(url, options);
          }
          return response;
        }
      }
      
      // Default mock response for unmatched URLs
      return {
        ok: false,
        status: 404,
        json: async () => ({ detail: 'Not found' })
      };
    });
  }

  /**
   * Create a mock authenticated user session
   */
  createAuthenticatedSession(user = null) {
    const defaultUser = {
      id: 1,
      email: 'test@example.com',
      full_name: 'Test User',
      is_active: true,
      is_verified: true,
      created_at: '2024-01-01T00:00:00.000Z'
    };

    const mockUser = user || defaultUser;
    const token = this.createMockJWT(mockUser);

    this.mockLocalStorage.setItem('auth_token', token);
    
    return { user: mockUser, token };
  }

  /**
   * Create a mock JWT token for testing
   */
  createMockJWT(user, expiresIn = 3600) {
    const header = { alg: "HS256", typ: "JWT" };
    const exp = Math.floor(Date.now() / 1000) + expiresIn;
    const payload = { 
      sub: user.id, 
      email: user.email,
      exp, 
      iat: Math.floor(Date.now() / 1000) 
    };
    
    const headerB64 = btoa(JSON.stringify(header));
    const payloadB64 = btoa(JSON.stringify(payload));
    const signature = "mock_signature_" + Math.random().toString(36).substr(2, 9);
    
    return `${headerB64}.${payloadB64}.${signature}`;
  }

  /**
   * Create an expired JWT token for testing
   */
  createExpiredJWT(user) {
    return this.createMockJWT(user, -3600); // Expired 1 hour ago
  }

  /**
   * Simulate user login flow
   */
  async simulateLogin(authService, email = 'test@example.com', password = 'password123') {
    // Setup successful login response
    this.setupFetchMock('/api/auth/login', {
      ok: true,
      status: 200,
      json: async () => ({
        token: this.createMockJWT({ id: 1, email }),
        user: {
          id: 1,
          email,
          full_name: 'Test User',
          is_active: true,
          is_verified: true
        }
      })
    });

    return await authService.login(email, password);
  }

  /**
   * Simulate user logout flow
   */
  async simulateLogout(authService) {
    // Setup logout response
    this.setupFetchMock('/api/auth/logout', {
      ok: true,
      status: 200,
      json: async () => ({ message: 'Logged out successfully' })
    });

    return await authService.logout();
  }

  /**
   * Wait for component to be fully rendered
   */
  async waitForComponentRender(component, additionalWait = 100) {
    if (component.updateComplete) {
      await component.updateComplete;
    }
    
    // Additional wait for DOM rendering
    await new Promise(resolve => setTimeout(resolve, additionalWait));
  }

  /**
   * Get form input values from a component
   */
  getFormInputs(component) {
    const shadowRoot = component.shadowRoot;
    if (!shadowRoot) return {};

    const inputs = shadowRoot.querySelectorAll('input');
    const values = {};
    
    inputs.forEach(input => {
      if (input.name) {
        values[input.name] = input.value;
      } else if (input.id) {
        values[input.id] = input.value;
      }
    });

    return values;
  }

  /**
   * Fill form inputs in a component
   */
  async fillFormInputs(component, data) {
    const shadowRoot = component.shadowRoot;
    if (!shadowRoot) return;

    for (const [key, value] of Object.entries(data)) {
      const input = shadowRoot.querySelector(`input[name="${key}"], input[id="${key}"], [data-testid="${key}"]`);
      if (input) {
        input.value = value;
        // Trigger input events
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }

    // Wait for any reactive updates
    await this.waitForComponentRender(component, 50);
  }

  /**
   * Submit a form in a component
   */
  async submitForm(component, formSelector = 'form') {
    const shadowRoot = component.shadowRoot;
    if (!shadowRoot) return;

    const form = shadowRoot.querySelector(formSelector);
    if (form) {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      await this.waitForComponentRender(component, 50);
    }
  }

  /**
   * Check if component shows loading state
   */
  isComponentLoading(component) {
    const shadowRoot = component.shadowRoot;
    if (!shadowRoot) return false;

    const loadingIndicator = shadowRoot.querySelector('.loading-spinner, [data-testid="loading"]');
    const disabledButton = shadowRoot.querySelector('button[disabled]');
    
    return !!(loadingIndicator || disabledButton || component.isLoading);
  }

  /**
   * Get error messages from component
   */
  getComponentErrors(component) {
    const shadowRoot = component.shadowRoot;
    if (!shadowRoot) return [];

    const errorElements = shadowRoot.querySelectorAll('.error-message, [data-testid="error"], .field-error');
    return Array.from(errorElements).map(el => el.textContent.trim()).filter(Boolean);
  }

  /**
   * Wait for specific condition to be met
   */
  async waitForCondition(condition, timeout = 5000, interval = 100) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      if (await condition()) {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, interval));
    }
    
    throw new Error(`Condition not met within ${timeout}ms`);
  }

  /**
   * Create event listener promise for component events
   */
  createEventPromise(component, eventName, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        component.removeEventListener(eventName, handler);
        reject(new Error(`Event '${eventName}' not fired within ${timeout}ms`));
      }, timeout);

      const handler = (event) => {
        clearTimeout(timer);
        component.removeEventListener(eventName, handler);
        resolve(event);
      };

      component.addEventListener(eventName, handler);
    });
  }

  /**
   * Mock network conditions (slow, offline, etc.)
   */
  mockNetworkConditions(condition) {
    switch (condition) {
      case 'slow':
        this.networkDelay = 2000;
        break;
      case 'offline':
        global.fetch.mockRejectedValue(new Error('Network Error: fetch'));
        break;
      case 'timeout':
        global.fetch.mockImplementation(() => new Promise(() => {})); // Never resolves
        break;
      default:
        this.networkDelay = 100;
    }
  }

  /**
   * Assert authentication state
   */
  assertAuthenticationState(authService, expectedState) {
    const { isAuthenticated, user, token } = expectedState;
    
    if (isAuthenticated !== undefined) {
      expect(authService.isAuthenticated()).toBe(isAuthenticated);
    }
    
    if (user !== undefined) {
      expect(authService.getUser()).toEqual(user);
    }
    
    if (token !== undefined) {
      expect(authService.getToken()).toBe(token);
    }
  }

  /**
   * Create test user data for different scenarios
   */
  createTestUserData(scenario = 'default') {
    const baseUser = {
      email: 'test@example.com',
      full_name: 'Test User',
      password: 'password123',
      password_confirm: 'password123'
    };

    switch (scenario) {
      case 'invalid-email':
        return { ...baseUser, email: 'invalid-email' };
      case 'weak-password':
        return { ...baseUser, password: '123', password_confirm: '123' };
      case 'password-mismatch':
        return { ...baseUser, password_confirm: 'different123' };
      case 'existing-user':
        return { ...baseUser, email: 'existing@example.com' };
      case 'long-name':
        return { ...baseUser, full_name: 'A'.repeat(300) };
      default:
        return baseUser;
    }
  }
}

// Export singleton instance for convenience
export const authTestUtils = new AuthTestUtils();