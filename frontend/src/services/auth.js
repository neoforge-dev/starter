import { Logger } from "../utils/logger.js";

export class AuthService {
  constructor() {
    this.baseUrl = "/api/v1/auth";
    this.user = null;
    this.listeners = new Set();
    this.token = localStorage.getItem("auth_token");
    this.refreshToken = localStorage.getItem("refresh_token");
    this.refreshPromise = null;
    this.isRefreshing = false;
  }

  addListener(callback) {
    this.listeners.add(callback);
    // Immediately call with current state
    callback(this.user);
    return () => this.listeners.delete(callback);
  }

  notifyListeners() {
    this.listeners.forEach((callback) => callback(this.user));
  }

  async initialize() {
    if (this.token) {
      try {
        await this.validateToken();
      } catch (error) {
        Logger.warn("Token validation failed:", error);
        this.logout();
      }
    }
  }

  async validateToken() {
    try {
      const response = await this.makeAuthenticatedRequest(`${this.baseUrl}/validate`);

      if (!response.ok) {
        throw new Error("Invalid token");
      }

      const data = await response.json();
      if (data.valid) {
        await this.fetchUserProfile();
      } else {
        throw new Error("Invalid token");
      }
    } catch (error) {
      Logger.error("Token validation failed:", error);
      throw error;
    }
  }

  async fetchUserProfile() {
    try {
      const response = await this.makeAuthenticatedRequest(`${this.baseUrl}/me`);

      if (!response.ok) {
        throw new Error("Failed to fetch user profile");
      }

      this.user = await response.json();
      this.notifyListeners();
    } catch (error) {
      Logger.error("Failed to fetch user profile:", error);
      throw error;
    }
  }

  async login(email, password) {
    try {
      const response = await fetch(`${this.baseUrl}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Login failed");
      }

      const data = await response.json();
      this.token = data.access_token;
      this.refreshToken = data.refresh_token;

      // Fetch user profile after successful login
      await this.fetchUserProfile();

      localStorage.setItem("auth_token", this.token);
      localStorage.setItem("refresh_token", this.refreshToken);
      this.notifyListeners();

      Logger.info("Login successful");
      return this.user;
    } catch (error) {
      Logger.error("Login failed:", error);
      throw error;
    }
  }

  async signup(email, password, userData = {}) {
    try {
      const response = await fetch(`${this.baseUrl}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          ...userData,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Signup failed");
      }

      const data = await response.json();
      // Don't set token and user until email is verified
      Logger.info("Signup successful, verification email sent");
      return data;
    } catch (error) {
      Logger.error("Signup failed:", error);
      throw error;
    }
  }

  async logout() {
    try {
      if (this.token && this.refreshToken) {
        await fetch(`${this.baseUrl}/logout`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ refresh_token: this.refreshToken }),
        });
      }
    } catch (error) {
      Logger.warn("Logout request failed:", error);
    } finally {
      this.token = null;
      this.refreshToken = null;
      this.user = null;
      localStorage.removeItem("auth_token");
      localStorage.removeItem("refresh_token");
      this.notifyListeners();
      Logger.info("Logout successful");
    }
  }

  async updateProfile(profileData) {
    try {
      const response = await this.makeAuthenticatedRequest(`${this.baseUrl}/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || error.message || "Profile update failed");
      }

      const data = await response.json();
      this.user = { ...this.user, ...data.user };
      this.notifyListeners();

      Logger.info("Profile updated successfully");
      return this.user;
    } catch (error) {
      Logger.error("Profile update failed:", error);
      throw error;
    }
  }

  async updatePassword(currentPassword, newPassword) {
    try {
      const response = await this.makeAuthenticatedRequest(`${this.baseUrl}/password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || error.message || "Password update failed");
      }

      Logger.info("Password updated successfully");
    } catch (error) {
      Logger.error("Password update failed:", error);
      throw error;
    }
  }

  async resetPassword(email) {
    try {
      const response = await fetch(`${this.baseUrl}/reset-password-request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Password reset request failed");
      }

      Logger.info("Password reset email sent");
    } catch (error) {
      Logger.error("Password reset request failed:", error);
      throw error;
    }
  }

  async confirmPasswordReset(token, newPassword) {
    try {
      const response = await fetch(`${this.baseUrl}/reset-password-confirm`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, new_password: newPassword }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Password reset confirmation failed");
      }

      Logger.info("Password reset successfully");
    } catch (error) {
      Logger.error("Password reset confirmation failed:", error);
      throw error;
    }
  }

  isAuthenticated() {
    return !!this.token && !!this.user;
  }

  getUser() {
    return this.user;
  }

  getToken() {
    return this.token;
  }

  /**
   * Refresh the access token using the refresh token
   */
  async refreshAccessToken() {
    if (!this.refreshToken) {
      throw new Error("No refresh token available");
    }

    // Prevent multiple concurrent refresh attempts
    if (this.isRefreshing) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = this._performTokenRefresh();

    try {
      const result = await this.refreshPromise;
      return result;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  async _performTokenRefresh() {
    try {
      const response = await fetch(`${this.baseUrl}/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh_token: this.refreshToken }),
      });

      if (!response.ok) {
        const error = await response.json();
        Logger.warn("Token refresh failed:", error);
        // If refresh fails, logout the user
        this.logout();
        throw new Error(error.detail || "Token refresh failed");
      }

      const data = await response.json();
      this.token = data.access_token;
      this.refreshToken = data.refresh_token;

      // Update localStorage with new tokens
      localStorage.setItem("auth_token", this.token);
      localStorage.setItem("refresh_token", this.refreshToken);

      Logger.info("Token refreshed successfully");
      return data;
    } catch (error) {
      Logger.error("Token refresh failed:", error);
      this.logout();
      throw error;
    }
  }

  /**
   * Make an authenticated request with automatic token refresh
   */
  async makeAuthenticatedRequest(url, options = {}) {
    if (!this.token) {
      throw new Error("Not authenticated");
    }

    // Add authorization header
    const requestOptions = {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${this.token}`,
      },
    };

    // Make the initial request
    let response = await fetch(url, requestOptions);

    // If we get a 401 and have a refresh token, try to refresh and retry
    if (response.status === 401 && this.refreshToken && !this.isRefreshing) {
      try {
        await this.refreshAccessToken();
        
        // Retry the request with the new token
        requestOptions.headers.Authorization = `Bearer ${this.token}`;
        response = await fetch(url, requestOptions);
      } catch (refreshError) {
        Logger.error("Auto-refresh failed:", refreshError);
        // The logout was already handled in refreshAccessToken
        throw refreshError;
      }
    }

    return response;
  }

  // Add new methods for email verification
  async verifyEmail(token) {
    try {
      const response = await fetch(`${this.baseUrl}/verify-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || error.message || "Email verification failed");
      }

      const data = await response.json();
      Logger.info("Email verification successful");
      return data;
    } catch (error) {
      Logger.error("Email verification failed:", error);
      throw error;
    }
  }

  async resendVerification(email) {
    try {
      const response = await fetch(`${this.baseUrl}/resend-verification`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || error.message || "Failed to resend verification email");
      }

      Logger.info("Verification email resent successfully");
    } catch (error) {
      Logger.error("Failed to resend verification email:", error);
      throw error;
    }
  }

  // Add method to check email verification status
  async checkEmailVerification(email) {
    try {
      const response = await fetch(`${this.baseUrl}/check-verification?email=${encodeURIComponent(email)}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || error.message || "Failed to check verification status");
      }

      const data = await response.json();
      return data.verified;
    } catch (error) {
      Logger.error("Failed to check email verification status:", error);
      throw error;
    }
  }
}

// Export a singleton instance
export const authService = new AuthService();
