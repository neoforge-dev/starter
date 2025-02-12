import { Logger } from "../utils/logger.js";

export class AuthService {
  constructor() {
    this.baseUrl = "/api/auth";
    this.user = null;
    this.listeners = new Set();
    this.token = localStorage.getItem("auth_token");
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
      const response = await fetch(`${this.baseUrl}/validate`, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Invalid token");
      }

      const data = await response.json();
      this.user = data.user;
      this.notifyListeners();
    } catch (error) {
      Logger.error("Token validation failed:", error);
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
        throw new Error(error.message || "Login failed");
      }

      const data = await response.json();
      this.token = data.token;
      this.user = data.user;

      localStorage.setItem("auth_token", this.token);
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
      const response = await fetch(`${this.baseUrl}/signup`, {
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
        throw new Error(error.message || "Signup failed");
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
      if (this.token) {
        await fetch(`${this.baseUrl}/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
        });
      }
    } catch (error) {
      Logger.warn("Logout request failed:", error);
    } finally {
      this.token = null;
      this.user = null;
      localStorage.removeItem("auth_token");
      this.notifyListeners();
      Logger.info("Logout successful");
    }
  }

  async updateProfile(profileData) {
    try {
      const response = await fetch(`${this.baseUrl}/profile`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Profile update failed");
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
      const response = await fetch(`${this.baseUrl}/password`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Password update failed");
      }

      Logger.info("Password updated successfully");
    } catch (error) {
      Logger.error("Password update failed:", error);
      throw error;
    }
  }

  async resetPassword(email) {
    try {
      const response = await fetch(`${this.baseUrl}/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Password reset request failed");
      }

      Logger.info("Password reset email sent");
    } catch (error) {
      Logger.error("Password reset request failed:", error);
      throw error;
    }
  }

  async confirmPasswordReset(token, newPassword) {
    try {
      const response = await fetch(`${this.baseUrl}/reset-password/confirm`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, newPassword }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Password reset confirmation failed");
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
        throw new Error(error.message || "Email verification failed");
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
        throw new Error(error.message || "Failed to resend verification email");
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
        throw new Error(error.message || "Failed to check verification status");
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
