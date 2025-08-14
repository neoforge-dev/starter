import { Logger } from "../utils/logger.js";
import type {
  User,
  LoginRequest,
  SignupRequest,
  AuthResponse,
  PasswordResetRequest,
  PasswordResetConfirm,
  PasswordUpdateRequest,
  EmailVerificationRequest,
  EmailVerificationResponse,
  ResendVerificationRequest,
  ProfileUpdateRequest,
  ApiResponse
} from "../types/api.d.ts";

type AuthChangeListener = (user: User | null) => void;

export class AuthService {
  private baseUrl: string;
  private user: User | null;
  private listeners: Set<AuthChangeListener>;
  private token: string | null;

  constructor() {
    this.baseUrl = "/api/auth";
    this.user = null;
    this.listeners = new Set();
    this.token = localStorage.getItem("auth_token");
  }

  addListener(callback: AuthChangeListener): () => void {
    this.listeners.add(callback);
    // Immediately call with current state
    callback(this.user);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners(): void {
    this.listeners.forEach((callback) => callback(this.user));
  }

  async initialize(): Promise<void> {
    if (this.token) {
      try {
        await this.validateToken();
      } catch (error) {
        Logger.warn("Token validation failed:", error);
        this.logout();
      }
    }
  }

  async validateToken(): Promise<void> {
    if (!this.token) {
      throw new Error("No token available");
    }

    try {
      const response = await fetch(`${this.baseUrl}/validate`, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Invalid token");
      }

      const data: ApiResponse<{ user: User }> = await response.json();
      this.user = data.data.user;
      this.notifyListeners();
    } catch (error) {
      Logger.error("Token validation failed:", error);
      throw error;
    }
  }

  async login(email: string, password: string, remember_me?: boolean): Promise<User> {
    try {
      const loginData: LoginRequest = { 
        email, 
        password,
        ...(remember_me !== undefined && { remember_me })
      };

      const response = await fetch(`${this.baseUrl}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(loginData),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Login failed" }));
        throw new Error(error.message || "Login failed");
      }

      const data: AuthResponse = await response.json();
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

  async signup(email: string, password: string, userData: Partial<SignupRequest> = {}): Promise<ApiResponse> {
    try {
      const signupData: SignupRequest = {
        email,
        password,
        ...userData,
      };

      const response = await fetch(`${this.baseUrl}/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(signupData),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Signup failed" }));
        throw new Error(error.message || "Signup failed");
      }

      const data: ApiResponse = await response.json();
      // Don't set token and user until email is verified
      Logger.info("Signup successful, verification email sent");
      return data;
    } catch (error) {
      Logger.error("Signup failed:", error);
      throw error;
    }
  }

  async logout(): Promise<void> {
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

  async updateProfile(profileData: ProfileUpdateRequest): Promise<User> {
    if (!this.token) {
      throw new Error("No authentication token available");
    }

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
        const error = await response.json().catch(() => ({ message: "Profile update failed" }));
        throw new Error(error.message || "Profile update failed");
      }

      const data: ApiResponse<{ user: User }> = await response.json();
      this.user = { ...this.user!, ...data.data.user };
      this.notifyListeners();

      Logger.info("Profile updated successfully");
      return this.user;
    } catch (error) {
      Logger.error("Profile update failed:", error);
      throw error;
    }
  }

  async updatePassword(currentPassword: string, newPassword: string): Promise<void> {
    if (!this.token) {
      throw new Error("No authentication token available");
    }

    try {
      const passwordData: PasswordUpdateRequest = {
        currentPassword,
        newPassword,
      };

      const response = await fetch(`${this.baseUrl}/password`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(passwordData),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Password update failed" }));
        throw new Error(error.message || "Password update failed");
      }

      Logger.info("Password updated successfully");
    } catch (error) {
      Logger.error("Password update failed:", error);
      throw error;
    }
  }

  async resetPassword(email: string): Promise<void> {
    try {
      const resetData: PasswordResetRequest = { email };

      const response = await fetch(`${this.baseUrl}/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(resetData),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Password reset request failed" }));
        throw new Error(error.message || "Password reset request failed");
      }

      Logger.info("Password reset email sent");
    } catch (error) {
      Logger.error("Password reset request failed:", error);
      throw error;
    }
  }

  async confirmPasswordReset(token: string, newPassword: string): Promise<void> {
    try {
      const confirmData: PasswordResetConfirm = { token, newPassword };

      const response = await fetch(`${this.baseUrl}/reset-password/confirm`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(confirmData),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Password reset confirmation failed" }));
        throw new Error(error.message || "Password reset confirmation failed");
      }

      Logger.info("Password reset successfully");
    } catch (error) {
      Logger.error("Password reset confirmation failed:", error);
      throw error;
    }
  }

  isAuthenticated(): boolean {
    return !!this.token && !!this.user;
  }

  getUser(): User | null {
    return this.user;
  }

  getToken(): string | null {
    return this.token;
  }

  // Add new methods for email verification
  async verifyEmail(token: string): Promise<EmailVerificationResponse> {
    try {
      const verifyData: EmailVerificationRequest = { token };

      const response = await fetch(`${this.baseUrl}/verify-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(verifyData),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Email verification failed" }));
        throw new Error(error.message || "Email verification failed");
      }

      const data: EmailVerificationResponse = await response.json();
      Logger.info("Email verification successful");
      return data;
    } catch (error) {
      Logger.error("Email verification failed:", error);
      throw error;
    }
  }

  async resendVerification(email: string): Promise<void> {
    try {
      const resendData: ResendVerificationRequest = { email };

      const response = await fetch(`${this.baseUrl}/resend-verification`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(resendData),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Failed to resend verification email" }));
        throw new Error(error.message || "Failed to resend verification email");
      }

      Logger.info("Verification email resent successfully");
    } catch (error) {
      Logger.error("Failed to resend verification email:", error);
      throw error;
    }
  }

  // Add method to check email verification status
  async checkEmailVerification(email: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/check-verification?email=${encodeURIComponent(email)}`);
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Failed to check verification status" }));
        throw new Error(error.message || "Failed to check verification status");
      }

      const data: ApiResponse<{ verified: boolean }> = await response.json();
      return data.data.verified;
    } catch (error) {
      Logger.error("Failed to check email verification status:", error);
      throw error;
    }
  }
}

// Export a singleton instance
export const authService = new AuthService();