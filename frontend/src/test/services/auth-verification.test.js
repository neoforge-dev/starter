import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock fetch globally
global.fetch = vi.fn();

// Mock Logger
vi.mock('../../utils/logger.js', () => ({
  Logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn()
  }
}));

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};
Object.defineProperty(global, 'localStorage', {
  value: mockLocalStorage,
  writable: true
});

// Import after mocking
import { AuthService } from '../../services/auth.js';
import { Logger } from '../../utils/logger.js';

describe('AuthService Email Verification Tests', () => {
  let authService;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    fetch.mockClear();
    
    // Create fresh instance
    authService = new AuthService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('verifyEmail', () => {
    it('should successfully verify email with valid token', async () => {
      // Arrange
      const mockResponse = {
        success: true,
        message: 'Email verified successfully'
      };
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      // Act
      const result = await authService.verifyEmail('valid-token-123');

      // Assert
      expect(fetch).toHaveBeenCalledWith('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token: 'valid-token-123' })
      });
      
      expect(result).toEqual(mockResponse);
      expect(Logger.info).toHaveBeenCalledWith('Email verification successful');
    });

    it('should handle server error during verification', async () => {
      // Arrange
      const errorResponse = {
        message: 'Invalid or expired token'
      };
      
      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => errorResponse
      });

      // Act & Assert
      await expect(authService.verifyEmail('invalid-token')).rejects.toThrow('Invalid or expired token');
      
      expect(fetch).toHaveBeenCalledWith('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token: 'invalid-token' })
      });
      
      expect(Logger.error).toHaveBeenCalledWith('Email verification failed:', expect.any(Error));
    });

    it('should handle network error during verification', async () => {
      // Arrange
      fetch.mockRejectedValueOnce(new Error('Network error'));

      // Act & Assert
      await expect(authService.verifyEmail('some-token')).rejects.toThrow('Network error');
      
      expect(Logger.error).toHaveBeenCalledWith('Email verification failed:', expect.any(Error));
    });

    it('should handle server error without message', async () => {
      // Arrange
      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({}) // No message in response
      });

      // Act & Assert
      await expect(authService.verifyEmail('token')).rejects.toThrow('Email verification failed');
    });
  });

  describe('resendVerification', () => {
    it('should successfully resend verification email', async () => {
      // Arrange
      const mockResponse = {
        success: true,
        message: 'Verification email sent'
      };
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      // Act
      await authService.resendVerification('test@example.com');

      // Assert
      expect(fetch).toHaveBeenCalledWith('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: 'test@example.com' })
      });
      
      expect(Logger.info).toHaveBeenCalledWith('Verification email resent successfully');
    });

    it('should handle error when resending verification email', async () => {
      // Arrange
      const errorResponse = {
        message: 'Email not found'
      };
      
      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => errorResponse
      });

      // Act & Assert
      await expect(authService.resendVerification('notfound@example.com')).rejects.toThrow('Email not found');
      
      expect(Logger.error).toHaveBeenCalledWith('Failed to resend verification email:', expect.any(Error));
    });

    it('should handle network error when resending verification', async () => {
      // Arrange
      fetch.mockRejectedValueOnce(new Error('Network timeout'));

      // Act & Assert
      await expect(authService.resendVerification('test@example.com')).rejects.toThrow('Network timeout');
      
      expect(Logger.error).toHaveBeenCalledWith('Failed to resend verification email:', expect.any(Error));
    });

    it('should handle server error without message when resending', async () => {
      // Arrange
      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({}) // No message in response
      });

      // Act & Assert
      await expect(authService.resendVerification('test@example.com')).rejects.toThrow('Failed to resend verification email');
    });
  });

  describe('checkEmailVerification', () => {
    it('should successfully check email verification status', async () => {
      // Arrange
      const mockResponse = {
        verified: true
      };
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      // Act
      const result = await authService.checkEmailVerification('test@example.com');

      // Assert
      expect(fetch).toHaveBeenCalledWith('/api/auth/check-verification?email=test%40example.com');
      expect(result).toBe(true);
    });

    it('should return false for unverified email', async () => {
      // Arrange
      const mockResponse = {
        verified: false
      };
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      // Act
      const result = await authService.checkEmailVerification('unverified@example.com');

      // Assert
      expect(result).toBe(false);
    });

    it('should handle error when checking verification status', async () => {
      // Arrange
      const errorResponse = {
        message: 'Invalid email format'
      };
      
      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => errorResponse
      });

      // Act & Assert
      await expect(authService.checkEmailVerification('invalid-email')).rejects.toThrow('Invalid email format');
      
      expect(Logger.error).toHaveBeenCalledWith('Failed to check email verification status:', expect.any(Error));
    });

    it('should properly encode email addresses with special characters', async () => {
      // Arrange
      const mockResponse = { verified: true };
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      // Act
      await authService.checkEmailVerification('user+test@example.com');

      // Assert
      expect(fetch).toHaveBeenCalledWith('/api/auth/check-verification?email=user%2Btest%40example.com');
    });

    it('should handle network error when checking verification status', async () => {
      // Arrange
      fetch.mockRejectedValueOnce(new Error('Connection failed'));

      // Act & Assert
      await expect(authService.checkEmailVerification('test@example.com')).rejects.toThrow('Connection failed');
      
      expect(Logger.error).toHaveBeenCalledWith('Failed to check email verification status:', expect.any(Error));
    });

    it('should handle server error without message when checking verification', async () => {
      // Arrange
      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({}) // No message in response
      });

      // Act & Assert
      await expect(authService.checkEmailVerification('test@example.com')).rejects.toThrow('Failed to check verification status');
    });
  });

  describe('Integration with existing auth methods', () => {
    it('should not interfere with existing login functionality', async () => {
      // Arrange
      const loginResponse = {
        token: 'auth-token-123',
        user: { id: 1, email: 'test@example.com', name: 'Test User' }
      };
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => loginResponse
      });

      // Act
      const result = await authService.login('test@example.com', 'password123');

      // Assert
      expect(fetch).toHaveBeenCalledWith('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: 'test@example.com', password: 'password123' })
      });
      
      expect(result).toEqual(loginResponse.user);
      expect(authService.token).toBe('auth-token-123');
      expect(authService.user).toEqual(loginResponse.user);
    });

    it('should not interfere with existing signup functionality', async () => {
      // Arrange
      const signupResponse = {
        success: true,
        message: 'Registration successful, please verify your email'
      };
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => signupResponse
      });

      // Act
      const result = await authService.signup('newuser@example.com', 'password123', { name: 'New User' });

      // Assert
      expect(fetch).toHaveBeenCalledWith('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: 'newuser@example.com',
          password: 'password123',
          name: 'New User'
        })
      });
      
      expect(result).toEqual(signupResponse);
      
      // Should not set token/user until email is verified
      expect(authService.token).toBeFalsy();
      expect(authService.user).toBeFalsy();
    });
  });
});