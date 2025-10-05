// API Client for NeoForge Frontend
// Handles all communication with the backend API

import { Logger } from '../utils/logger.js';

class ApiClient {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  // Generic request method
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: { ...this.defaultHeaders, ...options.headers },
      ...options,
    };

    // Add auth token if available
    const token = this.getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, config);

      // Handle different response types
      if (response.status === 204) {
        return { success: true };
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || data.message || `HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      Logger.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // GET request
  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    return this.request(url, { method: 'GET' });
  }

  // POST request
  async post(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // PUT request
  async put(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // DELETE request
  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  // Authentication methods
  async login(credentials) {
    try {
      const response = await this.post('/api/v1/auth/login', credentials);
      if (response.access_token) {
        this.setAuthToken(response.access_token);
      }
      return response;
    } catch (error) {
      throw new Error('Login failed: ' + error.message);
    }
  }

  async register(userData) {
    try {
      const response = await this.post('/api/v1/auth/register', userData);
      return response;
    } catch (error) {
      throw new Error('Registration failed: ' + error.message);
    }
  }

  async logout() {
    try {
      await this.post('/api/v1/auth/logout');
    } finally {
      this.clearAuthToken();
    }
  }

  async getCurrentUser() {
    try {
      return await this.get('/api/v1/auth/me');
    } catch (error) {
      this.clearAuthToken();
      throw error;
    }
  }

  // Token management
  getAuthToken() {
    return localStorage.getItem('auth_token');
  }

  setAuthToken(token) {
    localStorage.setItem('auth_token', token);
  }

  clearAuthToken() {
    localStorage.removeItem('auth_token');
  }

  // Health check
  async healthCheck() {
    try {
      const response = await fetch(`${this.baseURL}/health`);
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  // Error handling
  handleApiError(error) {
    if (error.message.includes('401')) {
      this.clearAuthToken();
      // Redirect to login if needed
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    throw error;
  }
}

// Create and export singleton instance
export const apiClient = new ApiClient();

// Export class for testing
export { ApiClient };