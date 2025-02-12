import { router } from "../router.js";

class AuthService {
  constructor() {
    this._token = localStorage.getItem("auth_token");
    this._user = JSON.parse(localStorage.getItem("auth_user"));

    // Bind methods
    this.login = this.login.bind(this);
    this.register = this.register.bind(this);
    this.logout = this.logout.bind(this);
  }

  get isAuthenticated() {
    return !!this._token;
  }

  get user() {
    return this._user;
  }

  get token() {
    return this._token;
  }

  async login(email, password) {
    try {
      const response = await fetch("/api/auth/login", {
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

      this._token = data.token;
      this._user = data.user;

      localStorage.setItem("auth_token", this._token);
      localStorage.setItem("auth_user", JSON.stringify(this._user));

      // Dispatch event
      window.dispatchEvent(
        new CustomEvent("auth-changed", {
          detail: { authenticated: true, user: this._user },
        })
      );

      // Navigate to dashboard
      router.navigate("/dashboard");

      return data;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  }

  async register(email, password, name) {
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, name }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Registration failed");
      }

      const data = await response.json();

      this._token = data.token;
      this._user = data.user;

      localStorage.setItem("auth_token", this._token);
      localStorage.setItem("auth_user", JSON.stringify(this._user));

      // Dispatch event
      window.dispatchEvent(
        new CustomEvent("auth-changed", {
          detail: { authenticated: true, user: this._user },
        })
      );

      // Navigate to dashboard
      router.navigate("/dashboard");

      return data;
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  }

  logout() {
    this._token = null;
    this._user = null;

    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");

    // Dispatch event
    window.dispatchEvent(
      new CustomEvent("auth-changed", {
        detail: { authenticated: false, user: null },
      })
    );

    // Navigate to home
    router.navigate("/");
  }

  // Helper method to get auth headers
  getAuthHeaders() {
    return this._token
      ? {
          Authorization: `Bearer ${this._token}`,
        }
      : {};
  }
}

// Export singleton instance
export const authService = new AuthService();
