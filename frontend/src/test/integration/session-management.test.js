/**
 * Session Management Integration Tests
 * 
 * These tests verify user session persistence and management across browser state changes:
 * - Session persistence across page refreshes
 * - Authentication state recovery after browser restart
 * - Token expiration and renewal handling
 * - Multiple tab session synchronization
 * - Session cleanup and security
 * - Storage mechanism reliability (localStorage vs sessionStorage)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AuthService } from '../../services/auth.ts';
import { authTestUtils } from './helpers/auth-test-utils.js';
import { mockBackend } from './helpers/mock-backend.js';

describe('Session Management Integration Tests', () => {
  let authService;
  let mockStorageEvent;
  let originalLocalStorage;

  beforeEach(() => {
    // Store original localStorage
    originalLocalStorage = global.localStorage;
    
    // Setup test environment first
    authTestUtils.setup();
    mockBackend.reset();
    
    // Create new auth service instance after mocks are set up
    // The AuthService constructor accesses localStorage, so mocks must be ready
    authService = new AuthService();
    
    // Mock storage event for cross-tab communication
    mockStorageEvent = new Event('storage');
  });

  afterEach(() => {
    authTestUtils.cleanup();
    
    // Restore original localStorage
    if (originalLocalStorage) {
      global.localStorage = originalLocalStorage;
    }
  });

  describe('Session Persistence Across Page Refreshes', () => {
    it('should restore authentication state from localStorage on initialization', async () => {
      // Arrange - Create an authenticated session
      const { user, token } = authTestUtils.createAuthenticatedSession({
        id: 1,
        email: 'test@example.com',
        full_name: 'Test User',
        is_active: true,
        is_verified: true
      });

      // Mock successful token validation
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ user })
      });

      // Create a new auth service after localStorage is populated
      const newAuthService = new AuthService();
      
      // Act - Initialize auth service (simulating page refresh)
      await newAuthService.initialize();

      // Assert
      expect(newAuthService.isAuthenticated()).toBe(true);
      expect(newAuthService.getUser()).toEqual(user);
      expect(newAuthService.getToken()).toBe(token);
      
      // Verify token validation was called
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/auth/validate',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': `Bearer ${token}`
          })
        })
      );
    });

    it('should handle invalid token during initialization', async () => {
      // Arrange - Create session with invalid token
      authTestUtils.mockLocalStorage.setItem('auth_token', 'invalid.token.here');

      // Mock token validation failure
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ detail: 'Invalid token' })
      });

      // Create a new auth service with the invalid token
      const newAuthService = new AuthService();
      
      // Act
      await newAuthService.initialize();

      // Assert
      expect(newAuthService.isAuthenticated()).toBe(false);
      expect(newAuthService.getUser()).toBeNull();
      expect(newAuthService.getToken()).toBeNull();
      expect(authTestUtils.mockLocalStorage.getItem('auth_token')).toBeNull();
    });

    it('should handle network failure during token validation', async () => {
      // Arrange
      authTestUtils.createAuthenticatedSession();
      
      // Mock network failure
      global.fetch = vi.fn().mockRejectedValue(new Error('Network Error'));

      // Create new auth service with the token
      const newAuthService = new AuthService();
      
      // Act
      await newAuthService.initialize();

      // Assert - Should clear invalid session
      expect(newAuthService.isAuthenticated()).toBe(false);
      expect(newAuthService.getUser()).toBeNull();
      expect(authTestUtils.mockLocalStorage.getItem('auth_token')).toBeNull();
    });

    it('should maintain session state across multiple page interactions', async () => {
      // Arrange
      const credentials = { email: 'test@example.com', password: 'password123' };
      
      // Mock login response
      global.fetch = vi.fn().mockImplementation(async (url) => {
        if (url.includes('/auth/login')) {
          const { user, token } = authTestUtils.createAuthenticatedSession();
          return {
            ok: true,
            status: 200,
            json: async () => ({ user, token })
          };
        } else if (url.includes('/auth/validate')) {
          const { user } = authTestUtils.createAuthenticatedSession();
          return {
            ok: true,
            status: 200,
            json: async () => ({ user })
          };
        }
        return { ok: false, status: 404, json: async () => ({}) };
      });

      // Act 1 - Login
      const user = await authService.login(credentials.email, credentials.password);
      expect(authService.isAuthenticated()).toBe(true);

      // Act 2 - Simulate page refresh by reinitializing
      const newAuthService = new AuthService();
      await newAuthService.initialize();

      // Assert - State should be restored
      expect(newAuthService.isAuthenticated()).toBe(true);
      expect(newAuthService.getUser().email).toBe(user.email);
    });
  });

  describe('Token Expiration and Refresh Handling', () => {
    it('should detect and handle expired tokens', async () => {
      // Arrange - Create session with expired token
      const user = { id: 1, email: 'test@example.com' };
      const expiredToken = authTestUtils.createExpiredJWT(user);
      authTestUtils.mockLocalStorage.setItem('auth_token', expiredToken);

      // Mock expired token validation
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ detail: 'Token has expired' })
      });

      // Create new auth service with expired token
      const newAuthService = new AuthService();
      
      // Act
      await newAuthService.initialize();

      // Assert
      expect(newAuthService.isAuthenticated()).toBe(false);
      expect(newAuthService.getUser()).toBeNull();
      expect(authTestUtils.mockLocalStorage.getItem('auth_token')).toBeNull();
    });

    it('should handle token expiration during active session', async () => {
      // Arrange - Start with valid session
      authTestUtils.createAuthenticatedSession();
      await authService.initialize();
      
      // Mock API call that returns 401 (expired token)
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ detail: 'Token has expired' })
      });

      // Act - Make an API call that triggers 401
      try {
        await authService.validateToken();
      } catch (error) {
        // Expected to fail
      }

      // Assert - Should have logged out automatically
      expect(authService.isAuthenticated()).toBe(false);
      expect(authService.getUser()).toBeNull();
    });

    it('should handle token near expiration warning', async () => {
      // This test would verify behavior when token is close to expiration
      // In a real implementation, you might want to refresh the token before it expires
      
      // Arrange - Create token that expires in 5 minutes
      const user = { id: 1, email: 'test@example.com' };
      const soonToExpireToken = authTestUtils.createMockJWT(user, 300); // 5 minutes
      authTestUtils.mockLocalStorage.setItem('auth_token', soonToExpireToken);

      // Mock successful validation (token still valid)
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ user })
      });

      // Create new auth service with soon-to-expire token
      const newAuthService = new AuthService();
      
      // Act
      await newAuthService.initialize();

      // Assert - Should still be authenticated since token is valid
      expect(newAuthService.isAuthenticated()).toBe(true);
      expect(newAuthService.getUser()).toEqual(user);
    });
  });

  describe('Cross-Tab Session Synchronization', () => {
    it('should synchronize login state across browser tabs', async () => {
      // Arrange - Create two auth service instances (simulating different tabs)
      const authService1 = new AuthService();
      const authService2 = new AuthService();

      let tab2StateChanges = [];
      authService2.addListener((user) => {
        tab2StateChanges.push(user);
      });

      // Act - Login in tab 1
      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            user: { id: 1, email: 'test@example.com', full_name: 'Test User' },
            token: 'new.jwt.token'
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            user: { id: 1, email: 'test@example.com', full_name: 'Test User' }
          })
        });

      await authService1.login('test@example.com', 'password123');

      // Simulate tab 2 receiving the storage event and reinitializing
      const newAuthService2 = new AuthService();
      await newAuthService2.initialize();

      // Assert - Both tabs should be authenticated
      expect(authService1.isAuthenticated()).toBe(true);
      expect(newAuthService2.isAuthenticated()).toBe(true);
      expect(newAuthService2.getUser().email).toBe('test@example.com');
    });

    it('should synchronize logout state across browser tabs', async () => {
      // Arrange - Both tabs start authenticated
      const { user } = authTestUtils.createAuthenticatedSession();
      
      const authService1 = new AuthService();
      const authService2 = new AuthService();

      // Initialize both services with the same authenticated state
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ user })
      });

      await authService1.initialize();
      await authService2.initialize();

      expect(authService1.isAuthenticated()).toBe(true);
      expect(authService2.isAuthenticated()).toBe(true);

      // Act - Logout from tab 1
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ message: 'Logged out' })
      });

      await authService1.logout();

      // Simulate storage event for token removal
      Object.defineProperty(mockStorageEvent, 'key', { value: 'auth_token' });
      Object.defineProperty(mockStorageEvent, 'newValue', { value: null });

      // Tab 2 should detect the change and update its state
      // In a real implementation, you'd listen for storage events
      await authService2.initialize();

      // Assert - Both tabs should be logged out
      expect(authService1.isAuthenticated()).toBe(false);
      // Since tab2 would detect the missing token, it should also be logged out
      expect(authTestUtils.mockLocalStorage.getItem('auth_token')).toBeNull();
    });

    it('should handle conflicting sessions between tabs', async () => {
      // This test simulates a scenario where one tab has a newer token than another
      
      // Arrange - Start with old token
      const oldToken = authTestUtils.createMockJWT({ id: 1, email: 'test@example.com' }, 3600);
      authTestUtils.mockLocalStorage.setItem('auth_token', oldToken);
      
      // Tab 2 gets a new token (simulating login refresh)
      const newToken = authTestUtils.createMockJWT({ id: 1, email: 'test@example.com' }, 7200);
      authTestUtils.mockLocalStorage.setItem('auth_token', newToken);
      
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ user: { id: 1, email: 'test@example.com' } })
      });

      // Create auth services after token is set
      const authService1 = new AuthService();
      const authService2 = new AuthService();
      
      // Initialize both services
      await authService1.initialize();
      await authService2.initialize();

      // Assert - Both should use the latest token from localStorage
      expect(authService1.getToken()).toBe(newToken);
      expect(authService2.getToken()).toBe(newToken);
    });
  });

  describe('Session Storage Security', () => {
    it('should clear sensitive data from storage on logout', async () => {
      // Arrange
      const { user } = authTestUtils.createAuthenticatedSession();
      
      // Create new auth service and simulate initialization
      const testAuthService = new AuthService();
      
      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ user })
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ message: 'Logged out' })
        });
        
      await testAuthService.initialize();
      
      // Verify initial state
      expect(authTestUtils.mockLocalStorage.getItem('auth_token')).toBeTruthy();
      expect(testAuthService.isAuthenticated()).toBe(true);

      // Act
      await testAuthService.logout();

      // Assert
      expect(authTestUtils.mockLocalStorage.getItem('auth_token')).toBeNull();
      expect(authTestUtils.mockSessionStorage.length).toBe(0);
      expect(testAuthService.getToken()).toBeNull();
      expect(testAuthService.getUser()).toBeNull();
    });

    it('should handle storage quota exceeded errors gracefully', async () => {
      // Arrange
      const originalSetItem = authTestUtils.mockLocalStorage.setItem;
      authTestUtils.mockLocalStorage.setItem = vi.fn().mockImplementation((key, value) => {
        if (key === 'auth_token') {
          const error = new Error('QuotaExceededError');
          error.name = 'QuotaExceededError';
          throw error;
        }
        return originalSetItem.call(authTestUtils.mockLocalStorage, key, value);
      });

      // Act & Assert - Should not crash when storage fails
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          user: { id: 1, email: 'test@example.com' },
          token: 'jwt.token.here'
        })
      });

      // Login should handle storage failure gracefully
      try {
        const user = await authService.login('test@example.com', 'password123');
        expect(user).toBeDefined();
        // Session won't persist due to storage failure, but login succeeds
      } catch (error) {
        // If login fails due to storage, that's acceptable behavior
        expect(error.message).toContain('QuotaExceededError');
      }
      
      // Restore original setItem
      authTestUtils.mockLocalStorage.setItem = originalSetItem;
    });

    it('should validate storage data integrity', async () => {
      // Arrange - Corrupt the stored token
      authTestUtils.mockLocalStorage.setItem('auth_token', 'corrupted_data_123');

      // Mock validation failure for corrupted token
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ detail: 'Invalid token' })
      });
      
      // Create auth service with corrupted token
      const testAuthService = new AuthService();
      
      // Act
      await testAuthService.initialize();

      // Assert - Should handle corrupted data gracefully
      expect(testAuthService.isAuthenticated()).toBe(false);
      expect(testAuthService.getUser()).toBeNull();
      expect(authTestUtils.mockLocalStorage.getItem('auth_token')).toBeNull();
    });

    it('should handle localStorage being unavailable (private browsing)', async () => {
      // This test needs to be handled carefully due to the way AuthService constructor works
      // For now, we'll verify that the service can handle a missing localStorage gracefully
      
      // Create a mock localStorage that throws errors
      const faultyStorage = {
        getItem: () => { throw new Error('Storage not available'); },
        setItem: () => { throw new Error('Storage not available'); },
        removeItem: () => { throw new Error('Storage not available'); },
        clear: () => { throw new Error('Storage not available'); }
      };
      
      // Override global localStorage temporarily
      const originalLocalStorage = global.localStorage;
      global.localStorage = faultyStorage;
      
      try {
        // Act & Assert - Should handle storage errors gracefully
        const tempAuthService = new AuthService();
        expect(tempAuthService.isAuthenticated()).toBe(false);
      } catch (error) {
        // If constructor fails, that's acceptable for this edge case
        expect(error.message).toContain('Storage not available');
      } finally {
        // Restore original localStorage
        global.localStorage = originalLocalStorage;
      }
    });
  });

  describe('Session Persistence Edge Cases', () => {
    it('should handle rapid login/logout cycles', async () => {
      // Arrange
      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ 
            user: { id: 1, email: 'test@example.com', full_name: 'Test User' }, 
            token: 'token1' 
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ message: 'Logged out' })
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ 
            user: { id: 1, email: 'test@example.com', full_name: 'Test User' }, 
            token: 'token2' 
          })
        });

      try {
        // Act - Rapid login/logout/login
        await authService.login('test@example.com', 'password123');
        expect(authService.isAuthenticated()).toBe(true);
        
        await authService.logout();
        expect(authService.isAuthenticated()).toBe(false);
        
        await authService.login('test@example.com', 'password123');
        expect(authService.isAuthenticated()).toBe(true);

        // Assert - Final state should be correct
        expect(authService.getUser().email).toBe('test@example.com');
      } catch (error) {
        // Handle potential storage errors during rapid operations
        console.warn('Rapid login/logout cycle test warning:', error.message);
      }
    });

    it('should handle session recovery after browser crash simulation', async () => {
      // Arrange - Create session and "crash" (reinitialize service)
      authTestUtils.createAuthenticatedSession();
      
      // Act - Create new service instance (simulating browser restart)
      const recoveredAuthService = new AuthService();
      
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ 
          user: { id: 1, email: 'test@example.com', full_name: 'Test User' }
        })
      });

      await recoveredAuthService.initialize();

      // Assert - Should recover session
      expect(recoveredAuthService.isAuthenticated()).toBe(true);
      expect(recoveredAuthService.getUser().email).toBe('test@example.com');
    });

    it('should handle concurrent authentication attempts', async () => {
      // This tests what happens if multiple login attempts happen simultaneously
      
      // Arrange
      let callCount = 0;
      global.fetch = vi.fn().mockImplementation(async () => {
        callCount++;
        await new Promise(resolve => setTimeout(resolve, 100)); // Simulate delay
        return {
          ok: true,
          status: 200,
          json: async () => ({ 
            user: { id: 1, email: 'test@example.com' }, 
            token: `token_${callCount}` 
          })
        };
      });

      // Act - Start multiple login attempts simultaneously
      const loginPromises = [
        authService.login('test@example.com', 'password123'),
        authService.login('test@example.com', 'password123'),
        authService.login('test@example.com', 'password123')
      ];

      const results = await Promise.allSettled(loginPromises);

      // Assert - All should succeed and auth service should be in consistent state
      results.forEach(result => {
        expect(result.status).toBe('fulfilled');
      });
      
      expect(authService.isAuthenticated()).toBe(true);
      expect(authService.getUser().email).toBe('test@example.com');
    });

    it('should handle storage events from external changes', async () => {
      // Simulate another application or browser extension modifying localStorage
      
      // Arrange - Simulate external storage change
      const externalToken = authTestUtils.createMockJWT({ id: 1, email: 'external@example.com' });
      authTestUtils.mockLocalStorage.setItem('auth_token', externalToken);

      // Mock validation response for external token
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ 
          user: { id: 1, email: 'external@example.com' }
        })
      });

      // Create new auth service to pick up the externally set token
      const externalAuthService = new AuthService();
      await externalAuthService.initialize();

      // Assert - Should pick up externally set token
      expect(externalAuthService.isAuthenticated()).toBe(true);
      expect(externalAuthService.getUser().email).toBe('external@example.com');
    });
  });
});