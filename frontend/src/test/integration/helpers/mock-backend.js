/**
 * Mock Backend Server for Integration Testing
 * 
 * This module provides realistic backend responses that match the actual FastAPI backend
 * authentication endpoints. It simulates real HTTP communication patterns including:
 * - JWT token structure and validation
 * - Error responses with proper status codes
 * - Rate limiting scenarios
 * - Network timeout conditions
 * - Email verification flows
 */

// Mock JWT token structure matching backend
const createMockJWT = (payload, expiresIn = 3600) => {
  const header = { alg: "HS256", typ: "JWT" };
  const exp = Math.floor(Date.now() / 1000) + expiresIn;
  const tokenPayload = { ...payload, exp, iat: Math.floor(Date.now() / 1000) };
  
  // Simple base64 encoding for mock token (not secure, just for testing)
  const headerB64 = btoa(JSON.stringify(header));
  const payloadB64 = btoa(JSON.stringify(tokenPayload));
  const signature = "mock_signature_" + Math.random().toString(36).substr(2, 9);
  
  return `${headerB64}.${payloadB64}.${signature}`;
};

// Mock user database
const mockUsers = new Map([
  ['test@example.com', {
    id: 1,
    email: 'test@example.com',
    full_name: 'Test User',
    hashed_password: '$2b$12$mockhashedpassword', // represents bcrypt hash of 'password123'
    is_active: true,
    is_verified: true,
    created_at: '2024-01-01T00:00:00.000Z'
  }],
  ['unverified@example.com', {
    id: 2,
    email: 'unverified@example.com',
    full_name: 'Unverified User',
    hashed_password: '$2b$12$mockhashedpassword2',
    is_active: true,
    is_verified: false,
    created_at: '2024-01-01T00:00:00.000Z'
  }],
  ['inactive@example.com', {
    id: 3,
    email: 'inactive@example.com',
    full_name: 'Inactive User',
    hashed_password: '$2b$12$mockhashedpassword3',
    is_active: false,
    is_verified: true,
    created_at: '2024-01-01T00:00:00.000Z'
  }]
]);

// Mock password reset tokens
const mockResetTokens = new Map();

// Rate limiting tracking
const rateLimitTracking = new Map();

/**
 * Mock Backend API responses that match the FastAPI backend structure
 */
export class MockBackendServer {
  constructor() {
    this.networkDelay = 100; // Simulate network latency
    this.shouldFailNetwork = false;
    this.rateLimitEnabled = true;
    this.rateLimitThreshold = 5; // requests per minute
  }

  /**
   * Configure mock server behavior for testing different scenarios
   */
  configure({ 
    networkDelay = 100, 
    shouldFailNetwork = false, 
    rateLimitEnabled = true, 
    rateLimitThreshold = 5 
  }) {
    this.networkDelay = networkDelay;
    this.shouldFailNetwork = shouldFailNetwork;
    this.rateLimitEnabled = rateLimitEnabled;
    this.rateLimitThreshold = rateLimitThreshold;
  }

  /**
   * Simulate network delay
   */
  async _delay() {
    if (this.shouldFailNetwork) {
      throw new Error('Network Error: fetch');
    }
    await new Promise(resolve => setTimeout(resolve, this.networkDelay));
  }

  /**
   * Check rate limiting for an endpoint
   */
  _checkRateLimit(endpoint, identifier = 'default') {
    if (!this.rateLimitEnabled) return false;

    const key = `${endpoint}:${identifier}`;
    const now = Date.now();
    const minute = Math.floor(now / 60000);
    
    if (!rateLimitTracking.has(key)) {
      rateLimitTracking.set(key, new Map());
    }
    
    const endpointLimits = rateLimitTracking.get(key);
    const currentMinuteRequests = endpointLimits.get(minute) || 0;
    
    if (currentMinuteRequests >= this.rateLimitThreshold) {
      return true; // Rate limited
    }
    
    endpointLimits.set(minute, currentMinuteRequests + 1);
    
    // Clean up old entries
    for (const [min] of endpointLimits.entries()) {
      if (min < minute - 1) {
        endpointLimits.delete(min);
      }
    }
    
    return false;
  }

  /**
   * Mock authentication endpoints
   */
  async mockLogin(email, password) {
    await this._delay();

    // Check rate limiting
    if (this._checkRateLimit('login', email)) {
      return {
        ok: false,
        status: 429,
        json: async () => ({ 
          message: "Too many login attempts. Please try again later.",
          detail: "Too many login attempts. Please try again later.",
          retry_after: 60
        }),
        headers: new Map([['Retry-After', '60']])
      };
    }

    const user = mockUsers.get(email);
    
    if (!user) {
      return {
        ok: false,
        status: 401,
        json: async () => ({ message: "Incorrect email or password", detail: "Incorrect email or password" })
      };
    }

    if (!user.is_active) {
      return {
        ok: false,
        status: 400,
        json: async () => ({ detail: "Account is inactive" })
      };
    }

    // Simulate password verification (in real backend this would use bcrypt.verify)
    if (password !== 'password123') {
      return {
        ok: false,
        status: 401,
        json: async () => ({ message: "Incorrect email or password", detail: "Incorrect email or password" })
      };
    }

    const token = createMockJWT({ sub: user.id, email: user.email });

    return {
      ok: true,
      status: 200,
      json: async () => ({
        token,
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          is_active: user.is_active,
          is_verified: user.is_verified,
          created_at: user.created_at
        }
      })
    };
  }

  async mockRegister(userData) {
    await this._delay();

    const { email, password, full_name } = userData;

    // Check if user already exists
    if (mockUsers.has(email)) {
      return {
        ok: false,
        status: 400,
        json: async () => ({ message: "Email already registered", detail: "Email already registered" })
      };
    }

    // Create new user
    const newUserId = mockUsers.size + 1;
    const newUser = {
      id: newUserId,
      email,
      full_name,
      hashed_password: '$2b$12$mockhash', // Mock bcrypt hash
      is_active: true,
      is_verified: false, // New users start unverified
      created_at: new Date().toISOString()
    };

    mockUsers.set(email, newUser);

    const accessToken = createMockJWT({ sub: newUser.id, email: newUser.email });

    return {
      ok: true,
      status: 200,
      json: async () => ({
        message: "Registration successful",
        user: {
          id: newUser.id,
          email: newUser.email,
          full_name: newUser.full_name,
          is_active: newUser.is_active,
          is_verified: newUser.is_verified,
          created_at: newUser.created_at
        },
        access_token: accessToken,
        token_type: "bearer"
      })
    };
  }

  async mockValidateToken(token) {
    await this._delay();

    if (!token || !token.startsWith('Bearer ')) {
      return {
        ok: false,
        status: 401,
        json: async () => ({ detail: "Invalid token format" })
      };
    }

    const jwtToken = token.substring(7); // Remove 'Bearer ' prefix

    try {
      // Simple token validation (in real backend this would use JWT verify)
      const parts = jwtToken.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid token structure');
      }

      const payload = JSON.parse(atob(parts[1]));
      
      // Check expiration
      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        return {
          ok: false,
          status: 401,
          json: async () => ({ detail: "Token has expired" })
        };
      }

      const user = Array.from(mockUsers.values()).find(u => u.id === payload.sub);
      
      if (!user) {
        return {
          ok: false,
          status: 401,
          json: async () => ({ detail: "Invalid token" })
        };
      }

      return {
        ok: true,
        status: 200,
        json: async () => ({ user })
      };
    } catch {
      return {
        ok: false,
        status: 401,
        json: async () => ({ detail: "Invalid token" })
      };
    }
  }

  async mockPasswordReset(email) {
    await this._delay();

    // Check rate limiting
    if (this._checkRateLimit('password-reset', email)) {
      return {
        ok: false,
        status: 429,
        json: async () => ({ 
          message: "Too many password reset requests. Please try again later.",
          detail: "Too many password reset requests. Please try again later.",
          retry_after: 300
        }),
        headers: new Map([['Retry-After', '300']])
      };
    }

    // Always return success to prevent email enumeration (matches backend behavior)
    // Use a predictable token for testing, but random for non-test scenarios
    const resetToken = email === 'test@example.com' ? 'mock_reset_token_12345' : 
                      (Math.random().toString(36).substring(2, 15) + 
                       Math.random().toString(36).substring(2, 15));
    
    // Store reset token if user exists
    const user = mockUsers.get(email);
    if (user) {
      mockResetTokens.set(resetToken, {
        userId: user.id,
        expires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
        used: false
      });
    }

    return {
      ok: true,
      status: 200,
      json: async () => ({
        message: "If the email address is registered, you will receive a password reset link shortly."
      })
    };
  }

  async mockConfirmPasswordReset(token, newPassword) {
    await this._delay();

    const resetData = mockResetTokens.get(token);
    
    if (!resetData) {
      return {
        ok: false,
        status: 400,
        json: async () => ({ detail: "Invalid or expired reset token" })
      };
    }

    if (resetData.expires < Date.now() || resetData.used) {
      return {
        ok: false,
        status: 400,
        json: async () => ({ detail: "Invalid or expired reset token" })
      };
    }

    // Mark token as used
    resetData.used = true;

    // Update user password (in reality this would hash the password)
    const user = Array.from(mockUsers.values()).find(u => u.id === resetData.userId);
    if (user) {
      user.hashed_password = '$2b$12$newhash'; // Mock new hash
    }

    return {
      ok: true,
      status: 200,
      json: async () => ({
        message: "Password has been successfully reset. You can now log in with your new password."
      })
    };
  }

  async mockVerifyEmail(token) {
    await this._delay();

    try {
      // Simple token validation for email verification
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid token structure');
      }

      const payload = JSON.parse(atob(parts[1]));
      
      // Check expiration
      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        return {
          ok: false,
          status: 400,
          json: async () => ({ detail: "Invalid or expired verification token" })
        };
      }

      const user = Array.from(mockUsers.values()).find(u => u.id === payload.sub);
      
      if (!user) {
        return {
          ok: false,
          status: 400,
          json: async () => ({ detail: "Invalid or expired verification token" })
        };
      }

      if (user.is_verified) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ message: "Email address is already verified." })
        };
      }

      // Mark as verified
      user.is_verified = true;

      return {
        ok: true,
        status: 200,
        json: async () => ({
          message: "Email address has been successfully verified. Welcome to our platform!"
        })
      };
    } catch {
      return {
        ok: false,
        status: 400,
        json: async () => ({ detail: "Invalid or expired verification token" })
      };
    }
  }

  async mockResendVerification(email) {
    await this._delay();

    // Check rate limiting
    if (this._checkRateLimit('resend-verification', email)) {
      return {
        ok: false,
        status: 429,
        json: async () => ({ 
          message: "Too many verification requests. Please try again later.",
          detail: "Too many verification requests. Please try again later.",
          retry_after: 300
        })
      };
    }

    // Always return success to prevent email enumeration
    return {
      ok: true,
      status: 200,
      json: async () => ({
        message: "If the email address is registered and not yet verified, you will receive a verification link shortly."
      })
    };
  }

  /**
   * Mock server error scenarios for testing error handling
   */
  async mockServerError(endpoint = 'unknown') {
    await this._delay();

    return {
      ok: false,
      status: 500,
      json: async () => ({ 
        detail: "Internal server error",
        endpoint: endpoint
      })
    };
  }

  /**
   * Reset mock state for clean test runs
   */
  reset() {
    mockResetTokens.clear();
    rateLimitTracking.clear();
    this.configure({ networkDelay: 100, shouldFailNetwork: false });

    // Reset users to initial state
    const originalUsers = [
      ['test@example.com', {
        id: 1,
        email: 'test@example.com',
        full_name: 'Test User',
        hashed_password: '$2b$12$mockhashedpassword',
        is_active: true,
        is_verified: true,
        created_at: '2024-01-01T00:00:00.000Z'
      }],
      ['unverified@example.com', {
        id: 2,
        email: 'unverified@example.com',
        full_name: 'Unverified User',
        hashed_password: '$2b$12$mockhashedpassword2',
        is_active: true,
        is_verified: false,
        created_at: '2024-01-01T00:00:00.000Z'
      }]
    ];

    mockUsers.clear();
    originalUsers.forEach(([email, user]) => {
      mockUsers.set(email, user);
    });
  }
}

// Export singleton instance
export const mockBackend = new MockBackendServer();