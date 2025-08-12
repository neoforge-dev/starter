import { Logger } from "../utils/logger.js";
import { authService } from "./auth.js";
import { pwaService } from "./pwa.js";
import { dynamicConfig } from "../config/dynamic-config.js";

class ApiService {
  constructor() {
    // Lazy-initialized from backend config; fallback kept for resilience
    this.baseUrl = "/api/v1";
    this._initialized = false;
    this.defaultHeaders = {
      "Content-Type": "application/json",
    };
    this.retryConfig = {
      maxRetries: 3,
      retryDelay: 1000,
      retryMethods: ['GET', 'PUT', 'DELETE']
    };
  }

  async request(endpoint, options = {}) {
    // Lazy initialize configuration once
    if (!this._initialized) {
      try {
        const apiBase = await dynamicConfig.getApiBaseUrl();
        if (apiBase) {
          this.baseUrl = apiBase;
        }
      } catch (e) {
        Logger.warn("Falling back to default API base URL", e?.message || e);
      } finally {
        this._initialized = true;
      }
    }

    const { retryCount = 0, params, ...requestOptions } = options;
    const method = requestOptions.method || 'GET';
    
    // Build URL with query parameters if provided
    let url = `${this.baseUrl}${endpoint}`;
    if (params) {
      const queryString = new URLSearchParams(params).toString();
      url = `${url}${queryString ? `?${queryString}` : ""}`;
    }
    
    try {
      const token = authService.getToken();
      const headers = {
        ...this.defaultHeaders,
        Accept: "application/json", // Add Accept header from api-client
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...requestOptions.headers,
      };

      // Add idempotency key for non-GET requests to make offline replays safe
      if (method !== 'GET' && !headers['Idempotency-Key']) {
        const key = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
        headers['Idempotency-Key'] = key;
      }

      const response = await fetch(url, {
        ...requestOptions,
        headers,
      });

      // Handle 401 Unauthorized
      if (response.status === 401) {
        Logger.warn("Unauthorized request, logging out");
        await authService.logout();
        throw new Error("Unauthorized");
      }

      // Handle rate limiting with retry
      if (response.status === 429 && retryCount < this.retryConfig.maxRetries) {
        const retryAfter = response.headers.get('Retry-After') || this.retryConfig.retryDelay;
        Logger.warn(`Rate limited, retrying after ${retryAfter}ms`);
        // Retry-After may be seconds per RFC; support ms fallback
        const delayMs = String(retryAfter).match(/^\d+$/) ? Number(retryAfter) * 1000 : Number(retryAfter);
        await this._delay(Number.isFinite(delayMs) ? delayMs : this.retryConfig.retryDelay);
        return this.request(endpoint, { ...options, retryCount: retryCount + 1 });
      }

      // Handle server errors with retry for certain methods
      if (response.status >= 500 && 
          this.retryConfig.retryMethods.includes(method) && 
          retryCount < this.retryConfig.maxRetries) {
        Logger.warn(`Server error ${response.status}, retrying (${retryCount + 1}/${this.retryConfig.maxRetries})`);
        await this._delay(this.retryConfig.retryDelay * Math.pow(2, retryCount));
        return this.request(endpoint, { ...options, retryCount: retryCount + 1 });
      }

      // Handle other error responses
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: `HTTP ${response.status}` }));
        throw new Error(error.message || "API request failed");
      }

      return await response.json();
    } catch (error) {
      // Handle network errors
      if (error.name === 'TypeError' || error.message.includes('fetch')) {
        Logger.warn(`Network error for ${method} ${endpoint}:`, error.message);
        
        // Try to get cached data for GET requests
        if (method === 'GET') {
          try {
            const cachedData = await pwaService.getOfflineData(`api:${endpoint}`);
            if (cachedData) {
              Logger.info(`Serving cached data for ${endpoint}`);
              return cachedData;
            }
          } catch (cacheError) {
            Logger.debug('No cached data available', cacheError);
          }
        }
        
        // Queue non-GET requests for later
        if (method !== 'GET' && !navigator.onLine) {
          Logger.info(`Queueing offline action: ${method} ${endpoint}`);
          await pwaService.queueOfflineAction({
            url: `${this.baseUrl}${endpoint}`,
            method,
            headers: requestOptions.headers,
            body: requestOptions.body
          });
          throw new Error('Request queued for when online');
        }
      }

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

  // Status endpoints for the status page
  async getSystemStatus() {
    return this.request("/status");
  }

  async getServiceStatus(serviceId) {
    return this.request(`/status/services/${serviceId}`);
  }

  async subscribeToStatusUpdates(email) {
    return this.request("/status/subscribe", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  }

  // Analytics endpoints
  async getAnalytics(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/analytics?${queryString}`);
  }

  async trackEvent(event) {
    return this.request("/analytics/events", {
      method: "POST",
      body: JSON.stringify(event),
    });
  }

  // Utility methods
  async _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Request with caching for GET requests
  async requestWithCache(endpoint, options = {}, ttl = 300000) { // 5 minutes default
    const method = options.method || 'GET';
    
    if (method === 'GET') {
      const cacheKey = `api:${endpoint}`;
      
      try {
        const cached = await pwaService.getOfflineData(cacheKey);
        if (cached) {
          Logger.debug(`Cache hit for ${endpoint}`);
          return cached;
        }
      } catch (error) {
        Logger.debug(`Cache miss for ${endpoint}`);
      }
    }

    const data = await this.request(endpoint, options);
    
    // Cache successful GET responses
    if (method === 'GET' && data) {
      try {
        await pwaService.storeOfflineData(`api:${endpoint}`, data, ttl);
        Logger.debug(`Cached response for ${endpoint}`);
      } catch (error) {
        Logger.warn(`Failed to cache response for ${endpoint}:`, error);
      }
    }

    return data;
  }

  // Bulk operations with progress tracking
  async bulkRequest(requests, onProgress) {
    const results = [];
    const total = requests.length;
    
    for (let i = 0; i < requests.length; i++) {
      try {
        const result = await this.request(requests[i].endpoint, requests[i].options);
        results.push({ success: true, data: result, index: i });
      } catch (error) {
        results.push({ success: false, error: error.message, index: i });
      }
      
      if (onProgress) {
        onProgress({
          completed: i + 1,
          total,
          percentage: Math.round(((i + 1) / total) * 100)
        });
      }
    }
    
    return results;
  }

  // Request timeout handling
  async requestWithTimeout(endpoint, options = {}, timeout = 30000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const result = await this.request(endpoint, {
        ...options,
        signal: controller.signal
      });
      return result;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

// Export a singleton instance
export const apiService = new ApiService();
