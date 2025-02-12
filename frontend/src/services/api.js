import { Logger } from "../utils/logger.js";
import { authService } from "./auth.js";

class ApiService {
  constructor() {
    this.baseUrl = "/api";
    this.defaultHeaders = {
      "Content-Type": "application/json",
    };
  }

  async request(endpoint, options = {}) {
    try {
      const token = authService.getToken();
      const headers = {
        ...this.defaultHeaders,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      };

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
      });

      // Handle 401 Unauthorized
      if (response.status === 401) {
        Logger.warn("Unauthorized request, logging out");
        await authService.logout();
        throw new Error("Unauthorized");
      }

      // Handle other error responses
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "API request failed");
      }

      return await response.json();
    } catch (error) {
      Logger.error(`API request failed: ${error.message}`, error);
      throw error;
    }
  }

  // Health check endpoint
  async healthCheck() {
    return this.request("/health");
  }

  // Documentation endpoints
  async getDocumentation(type = "frontend") {
    return this.request(`/docs/${type}`);
  }

  // Project endpoints
  async getProjects(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/projects?${queryString}`);
  }

  async getProject(id) {
    return this.request(`/projects/${id}`);
  }

  async createProject(data) {
    return this.request("/projects", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateProject(id, data) {
    return this.request(`/projects/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteProject(id) {
    return this.request(`/projects/${id}`, {
      method: "DELETE",
    });
  }

  // User profile endpoints
  async getUserProfile() {
    return this.request("/users/profile");
  }

  async updateUserProfile(data) {
    return this.request("/users/profile", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  // Support endpoints
  async submitSupportTicket(data) {
    return this.request("/support/tickets", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getSupportTickets() {
    return this.request("/support/tickets");
  }

  // Community endpoints
  async getCommunityPosts(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/community/posts?${queryString}`);
  }

  async createCommunityPost(data) {
    return this.request("/community/posts", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Error reporting
  async reportError(error) {
    return this.request("/errors", {
      method: "POST",
      body: JSON.stringify({
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      }),
    });
  }
}

// Export a singleton instance
export const apiService = new ApiService();
