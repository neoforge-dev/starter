/**
 * AuthService Integration Tests
 * 
 * Tests the AuthService integration with backend APIs including:
 * - Login/logout flows with token management
 * - Token refresh and auto-refresh mechanisms
 * - Registration and email verification
 * - Password reset flows
 * - Error handling and edge cases
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AuthService } from '../../services/auth.js';

// Mock localStorage
const localStorageMock = {
  store: {},
  getItem: vi.fn((key) => localStorageMock.store[key] || null),
  setItem: vi.fn((key, value) => {
    localStorageMock.store[key] = value;
  }),
  removeItem: vi.fn((key) => {
    delete localStorageMock.store[key];
  }),
  clear: vi.fn(() => {
    localStorageMock.store = {};
  })
};

// Mock fetch for API calls
const mockFetch = vi.fn();

// Setup global mocks
global.localStorage = localStorageMock;
global.fetch = mockFetch;

describe('AuthService Integration Tests', () => {
  let authService;

  beforeEach(() => {
    // Clear all mocks and storage
    vi.clearAllMocks();
    localStorageMock.clear();
    mockFetch.mockClear();

    // Create fresh AuthService instance
    authService = new AuthService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Login Flow', () => {
    it('should successfully login with valid credentials', async () => {
      // Mock successful login response
      const mockLoginResponse = {
        access_token: 'mock_access_token',
        refresh_token: 'mock_refresh_token',
        token_type: 'bearer'
      };

      const mockUserResponse = {
        id: 1,
        email: 'test@example.com',
        full_name: 'Test User',
        is_active: true,
        is_verified: true
      };

      // Mock login API call
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockLoginResponse)
        })
        // Mock user profile fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockUserResponse)
        });

      const result = await authService.login('test@example.com', 'password123');

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockFetch).toHaveBeenNthCalledWith(1, '/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com', password: 'password123' })
      });

      expect(result).toEqual(mockUserResponse);
      expect(authService.token).toBe('mock_access_token');
      expect(authService.refreshToken).toBe('mock_refresh_token');
      expect(authService.isAuthenticated()).toBe(true);
      
      // Check localStorage was updated
      expect(localStorage.setItem).toHaveBeenCalledWith('auth_token', 'mock_access_token');
      expect(localStorage.setItem).toHaveBeenCalledWith('refresh_token', 'mock_refresh_token');
    });

    it('should handle login failure with proper error message', async () => {
      const mockErrorResponse = {
        detail: 'Incorrect email or password'
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve(mockErrorResponse)
      });

      await expect(authService.login('test@example.com', 'wrong_password'))
        .rejects.toThrow('Incorrect email or password');

      expect(authService.token).toBeNull();
      expect(authService.isAuthenticated()).toBe(false);
    });
  });

  describe('Registration Flow', () => {
    it('should successfully register new user', async () => {
      const mockRegisterResponse = {
        message: 'User registered successfully',
        user: {
          id: 1,
          email: 'test@example.com',
          full_name: 'Test User',
          is_active: true,
          is_verified: false
        },
        access_token: 'mock_access_token',
        refresh_token: 'mock_refresh_token'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRegisterResponse)
      });

      const result = await authService.signup('test@example.com', 'password123', {
        full_name: 'Test User'
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
          full_name: 'Test User'
        })
      });

      expect(result).toEqual(mockRegisterResponse);
    });

    it('should handle registration failure for duplicate email', async () => {
      const mockErrorResponse = {
        detail: 'Email already registered'
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve(mockErrorResponse)
      });

      await expect(authService.signup('existing@example.com', 'password123'))
        .rejects.toThrow('Email already registered');
    });
  });

  describe('Token Refresh Flow', () => {
    beforeEach(() => {
      // Setup authenticated state
      authService.token = 'old_access_token';
      authService.refreshToken = 'valid_refresh_token';
      localStorage.setItem('auth_token', 'old_access_token');
      localStorage.setItem('refresh_token', 'valid_refresh_token');
    });

    it('should successfully refresh access token', async () => {
      const mockRefreshResponse = {
        access_token: 'new_access_token',
        refresh_token: 'new_refresh_token',
        token_type: 'bearer'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRefreshResponse)
      });

      const result = await authService.refreshAccessToken();

      expect(mockFetch).toHaveBeenCalledWith('/api/v1/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: 'valid_refresh_token' })
      });

      expect(authService.token).toBe('new_access_token');
      expect(authService.refreshToken).toBe('new_refresh_token');
      expect(localStorage.setItem).toHaveBeenCalledWith('auth_token', 'new_access_token');
      expect(localStorage.setItem).toHaveBeenCalledWith('refresh_token', 'new_refresh_token');
    });

    it('should logout user when refresh token is invalid', async () => {
      const mockErrorResponse = {
        detail: 'Invalid or expired refresh token'
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve(mockErrorResponse)
      });

      await expect(authService.refreshAccessToken())
        .rejects.toThrow('Invalid or expired refresh token');

      // Should have logged out the user
      expect(authService.token).toBeNull();
      expect(authService.refreshToken).toBeNull();
      expect(authService.user).toBeNull();
      expect(localStorage.removeItem).toHaveBeenCalledWith('auth_token');
      expect(localStorage.removeItem).toHaveBeenCalledWith('refresh_token');
    });

    it('should prevent concurrent refresh attempts', async () => {
      const mockRefreshResponse = {
        access_token: 'new_access_token',
        refresh_token: 'new_refresh_token',
        token_type: 'bearer'
      };

      // Mock slow response for first call
      let resolveFirst;
      const firstPromise = new Promise((resolve) => {
        resolveFirst = () => resolve({
          ok: true,
          json: () => Promise.resolve(mockRefreshResponse)
        });
      });

      mockFetch.mockReturnValueOnce(firstPromise);

      // Start multiple refresh attempts
      const refresh1 = authService.refreshAccessToken();
      const refresh2 = authService.refreshAccessToken();
      const refresh3 = authService.refreshAccessToken();

      // Resolve the first request
      resolveFirst();

      const results = await Promise.all([refresh1, refresh2, refresh3]);

      // Should only make one API call
      expect(mockFetch).toHaveBeenCalledTimes(1);
      
      // All promises should resolve to the same result
      results.forEach(result => {
        expect(result).toEqual(mockRefreshResponse);
      });
    });
  });

  describe('Auto-Refresh with makeAuthenticatedRequest', () => {
    beforeEach(() => {
      authService.token = 'valid_access_token';
      authService.refreshToken = 'valid_refresh_token';
    });

    it('should automatically refresh token on 401 and retry request', async () => {
      const mockRefreshResponse = {
        access_token: 'new_access_token',
        refresh_token: 'new_refresh_token',
        token_type: 'bearer'
      };

      const mockProtectedResponse = {
        data: 'protected_data'
      };

      mockFetch
        // First call fails with 401
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: () => Promise.resolve({ detail: 'Token expired' })
        })
        // Refresh token call succeeds
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockRefreshResponse)
        })
        // Retry of original request succeeds
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockProtectedResponse)
        });

      const response = await authService.makeAuthenticatedRequest('/api/v1/auth/me');

      expect(mockFetch).toHaveBeenCalledTimes(3);
      
      // Verify refresh was called
      expect(mockFetch).toHaveBeenNthCalledWith(2, '/api/v1/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: 'valid_refresh_token' })
      });

      // Verify retry used new token
      expect(mockFetch).toHaveBeenNthCalledWith(3, '/api/v1/auth/me', {
        headers: {
          Authorization: 'Bearer new_access_token'
        }
      });

      const responseData = await response.json();
      expect(responseData).toEqual(mockProtectedResponse);
    });

    it('should not auto-refresh if already refreshing', async () => {
      // Start a refresh manually
      authService.isRefreshing = true;

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ detail: 'Token expired' })
      });

      const response = await authService.makeAuthenticatedRequest('/api/v1/auth/me');

      // Should not attempt refresh since already refreshing
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(response.status).toBe(401);
    });
  });

  describe('Password Reset Flow', () => {
    it('should successfully request password reset', async () => {
      const mockResetResponse = {
        message: 'If the email address is registered, you will receive a password reset link shortly.'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResetResponse)
      });

      await authService.resetPassword('test@example.com');

      expect(mockFetch).toHaveBeenCalledWith('/api/v1/auth/reset-password-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com' })
      });
    });

    it('should successfully confirm password reset', async () => {
      const mockConfirmResponse = {
        message: 'Password has been successfully reset. You can now log in with your new password.'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockConfirmResponse)
      });

      await authService.confirmPasswordReset('reset_token', 'new_password123');

      expect(mockFetch).toHaveBeenCalledWith('/api/v1/auth/reset-password-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: 'reset_token', new_password: 'new_password123' })
      });
    });
  });

  describe('Email Verification Flow', () => {
    it('should successfully verify email', async () => {
      const mockVerifyResponse = {
        message: 'Email address has been successfully verified. Welcome to our platform!'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockVerifyResponse)
      });

      const result = await authService.verifyEmail('verification_token');

      expect(mockFetch).toHaveBeenCalledWith('/api/v1/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: 'verification_token' })
      });

      expect(result).toEqual(mockVerifyResponse);
    });

    it('should successfully resend verification email', async () => {
      const mockResendResponse = {
        message: 'If the email address is registered and not yet verified, you will receive a verification link shortly.'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResendResponse)
      });

      await authService.resendVerification('test@example.com');

      expect(mockFetch).toHaveBeenCalledWith('/api/v1/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com' })
      });
    });
  });

  describe('Logout Flow', () => {
    beforeEach(() => {
      authService.token = 'valid_access_token';
      authService.refreshToken = 'valid_refresh_token';
      authService.user = { id: 1, email: 'test@example.com' };
      localStorage.setItem('auth_token', 'valid_access_token');
      localStorage.setItem('refresh_token', 'valid_refresh_token');
    });

    it('should successfully logout user', async () => {
      const mockLogoutResponse = {
        message: 'Successfully logged out'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockLogoutResponse)
      });

      await authService.logout();

      expect(mockFetch).toHaveBeenCalledWith('/api/v1/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: 'valid_refresh_token' })
      });

      // Verify state cleared
      expect(authService.token).toBeNull();
      expect(authService.refreshToken).toBeNull();
      expect(authService.user).toBeNull();
      expect(authService.isAuthenticated()).toBe(false);
      
      // Verify localStorage cleared
      expect(localStorage.removeItem).toHaveBeenCalledWith('auth_token');
      expect(localStorage.removeItem).toHaveBeenCalledWith('refresh_token');
    });

    it('should clear local state even if logout API fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ detail: 'Server error' })
      });

      await authService.logout();

      // Should still clear local state
      expect(authService.token).toBeNull();
      expect(authService.refreshToken).toBeNull();
      expect(authService.user).toBeNull();
      expect(localStorage.removeItem).toHaveBeenCalledWith('auth_token');
      expect(localStorage.removeItem).toHaveBeenCalledWith('refresh_token');
    });
  });

  describe('Token Validation', () => {
    beforeEach(() => {
      authService.token = 'valid_access_token';
    });

    it('should successfully validate token and fetch user profile', async () => {
      const mockValidateResponse = {
        valid: true,
        user_id: 1,
        email: 'test@example.com'
      };

      const mockUserResponse = {
        id: 1,
        email: 'test@example.com',
        full_name: 'Test User'
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockValidateResponse)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockUserResponse)
        });

      await authService.validateToken();

      expect(authService.user).toEqual(mockUserResponse);
    });

    it('should handle invalid token during validation', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ detail: 'Invalid token' })
      });

      await expect(authService.validateToken()).rejects.toThrow('Invalid token');
    });
  });

  describe('Initialization', () => {
    it('should initialize with stored tokens and validate them', async () => {
      // Setup localStorage with tokens
      localStorage.setItem('auth_token', 'stored_token');
      localStorage.setItem('refresh_token', 'stored_refresh_token');

      const mockValidateResponse = {
        valid: true,
        user_id: 1,
        email: 'test@example.com'
      };

      const mockUserResponse = {
        id: 1,
        email: 'test@example.com',
        full_name: 'Test User'
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockValidateResponse)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockUserResponse)
        });

      // Create new auth service (simulates page reload)
      const newAuthService = new AuthService();
      expect(newAuthService.token).toBe('stored_token');
      expect(newAuthService.refreshToken).toBe('stored_refresh_token');

      await newAuthService.initialize();

      expect(newAuthService.user).toEqual(mockUserResponse);
    });

    it('should logout on initialization if token validation fails', async () => {
      localStorage.setItem('auth_token', 'invalid_token');
      localStorage.setItem('refresh_token', 'invalid_refresh_token');

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ detail: 'Invalid token' })
      });

      const newAuthService = new AuthService();
      await newAuthService.initialize();

      // Should have cleared tokens
      expect(newAuthService.token).toBeNull();
      expect(newAuthService.refreshToken).toBeNull();
      expect(localStorage.removeItem).toHaveBeenCalledWith('auth_token');
      expect(localStorage.removeItem).toHaveBeenCalledWith('refresh_token');
    });
  });

  describe('Event Listeners', () => {
    it('should notify listeners when authentication state changes', async () => {
      const listener = vi.fn();
      const unsubscribe = authService.addListener(listener);

      // Should be called immediately with current state (null)
      expect(listener).toHaveBeenCalledWith(null);

      // Mock login
      const mockLoginResponse = {
        access_token: 'token',
        refresh_token: 'refresh',
        token_type: 'bearer'
      };

      const mockUserResponse = {
        id: 1,
        email: 'test@example.com'
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockLoginResponse)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockUserResponse)
        });

      await authService.login('test@example.com', 'password');

      // Should be called with user data
      expect(listener).toHaveBeenCalledWith(mockUserResponse);

      // Clean up
      unsubscribe();
    });
  });
});