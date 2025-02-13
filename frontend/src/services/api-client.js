import { AppError, ErrorType } from "./error-service.js";

const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

class ApiClient {
  constructor() {
    this._baseUrl = API_BASE_URL;
    this._defaultHeaders = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
  }

  /**
   * Make an API request
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Request options
   * @returns {Promise<any>}
   * @private
   */
  async _fetch(endpoint, options = {}) {
    const url = `${this._baseUrl}${endpoint}`;
    const token = localStorage.getItem("neo-auth-token");

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
        localStorage.removeItem("neo-auth-token");
        window.dispatchEvent(new CustomEvent("auth-expired"));
        throw new AppError("Authentication expired", ErrorType.AUTH);
      }

      let data;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        throw new AppError(
          data.message || "API request failed",
          ErrorType.API,
          {
            status: response.status,
            statusText: response.statusText,
            data,
          }
        );
      }

      return data;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      // Handle network errors
      if (
        error.name === "TypeError" &&
        error.message.includes("Failed to fetch")
      ) {
        throw new AppError(
          "Network error. Please check your connection.",
          ErrorType.NETWORK,
          { originalError: error }
        );
      }

      // Handle other errors
      throw new AppError(error.message || "API request failed", ErrorType.API, {
        originalError: error,
      });
    }
  }

  /**
   * Make a GET request
   * @param {string} endpoint
   * @param {Object} options
   */
  async get(endpoint, options = {}) {
    return this._fetch(endpoint, {
      ...options,
      method: "GET",
    });
  }

  /**
   * Make a POST request
   * @param {string} endpoint
   * @param {Object} data
   * @param {Object} options
   */
  async post(endpoint, data, options = {}) {
    return this._fetch(endpoint, {
      ...options,
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  /**
   * Make a PUT request
   * @param {string} endpoint
   * @param {Object} data
   * @param {Object} options
   */
  async put(endpoint, data, options = {}) {
    return this._fetch(endpoint, {
      ...options,
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  /**
   * Make a PATCH request
   * @param {string} endpoint
   * @param {Object} data
   * @param {Object} options
   */
  async patch(endpoint, data, options = {}) {
    return this._fetch(endpoint, {
      ...options,
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  /**
   * Make a DELETE request
   * @param {string} endpoint
   * @param {Object} options
   */
  async delete(endpoint, options = {}) {
    return this._fetch(endpoint, {
      ...options,
      method: "DELETE",
    });
  }

  // File upload
  async uploadFile(endpoint, file, onProgress) {
    const formData = new FormData();
    formData.append("file", file);

    return this._fetch(endpoint, {
      method: "POST",
      headers: {
        // Let the browser set the content type for FormData
        "Content-Type": undefined,
      },
      body: formData,
      onUploadProgress: onProgress,
    });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
