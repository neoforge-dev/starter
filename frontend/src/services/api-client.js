const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

class ApiClient {
  constructor() {
    this._baseUrl = API_BASE_URL;
    this._defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  async _fetch(endpoint, options = {}) {
    const url = `${this._baseUrl}${endpoint}`;
    const token = localStorage.getItem('neo-auth-token');
    
    const headers = {
      ...this._defaultHeaders,
      ...options.headers,
      ...(token && { Authorization: `Bearer ${token}` }),
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Handle 401 Unauthorized
      if (response.status === 401) {
        localStorage.removeItem('neo-auth-token');
        window.dispatchEvent(new CustomEvent('auth-expired'));
        throw new Error('Authentication expired');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'API request failed');
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // GET request
  async get(endpoint, options = {}) {
    return this._fetch(endpoint, {
      ...options,
      method: 'GET',
    });
  }

  // POST request
  async post(endpoint, data, options = {}) {
    return this._fetch(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // PUT request
  async put(endpoint, data, options = {}) {
    return this._fetch(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // DELETE request
  async delete(endpoint, options = {}) {
    return this._fetch(endpoint, {
      ...options,
      method: 'DELETE',
    });
  }

  // File upload
  async uploadFile(endpoint, file, onProgress) {
    const formData = new FormData();
    formData.append('file', file);

    return this._fetch(endpoint, {
      method: 'POST',
      headers: {
        // Let the browser set the content type for FormData
        'Content-Type': undefined,
      },
      body: formData,
      onUploadProgress: onProgress,
    });
  }
}

// Export singleton instance
export const apiClient = new ApiClient(); 