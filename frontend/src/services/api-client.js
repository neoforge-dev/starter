import { AppError, ErrorType } from "./error-service.js";

const DEFAULT_API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

export class ApiClient {
  constructor(baseUrl = DEFAULT_API_BASE_URL) {
    this._baseUrl = baseUrl;
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
    let url = `${this._baseUrl}${endpoint}`;
    const token = localStorage.getItem("neo-auth-token");

    // Add query parameters if provided
    if (options.params) {
      const queryString = new URLSearchParams(options.params).toString();
      url = `${url}${queryString ? `?${queryString}` : ""}`;
      // Remove params from options to avoid sending them in the request body
      delete options.params;
    }

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
        try {
          window.dispatchEvent(new CustomEvent("auth-expired"));
        } catch (e) {
          console.warn("Could not dispatch auth-expired event:", e);
        }
        throw new AppError(
          "Your session has expired. Please log in again.",
          ErrorType.AUTH
        );
      }

      let data;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        try {
          data = await response.json();
        } catch (error) {
          throw new AppError(
            "API request failed: Invalid JSON response",
            ErrorType.API,
            {
              originalError: error,
              status: response.status,
              statusText: response.statusText,
            }
          );
        }
      } else {
        // For non-JSON responses, get the raw text
        data = await response.text();
      }

      if (!response.ok) {
        throw new AppError(
          typeof data === "object"
            ? data.message || "API request failed"
            : data,
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
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Request options
   * @returns {Promise<any>}
   */
  async get(endpoint, options = {}) {
    return this._fetch(endpoint, {
      ...options,
      method: "GET",
    });
  }

  /**
   * Make a POST request
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request body
   * @param {Object} options - Request options
   * @returns {Promise<any>}
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
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request body
   * @param {Object} options - Request options
   * @returns {Promise<any>}
   */
  async put(endpoint, data, options = {}) {
    return this._fetch(endpoint, {
      ...options,
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  /**
   * Make a DELETE request
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Request options
   * @returns {Promise<any>}
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
