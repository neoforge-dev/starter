// import { AppError, ErrorType } from "../../services/error-service.js";

export class MockApiClient {
  constructor() {
    this.responses = new Map();
    this.errors = new Map();
  }

  setResponse(endpoint, response) {
    this.responses.set(endpoint, response);
  }

  setError(endpoint, error) {
    this.errors.set(endpoint, error);
  }

  async _fetch(endpoint) {
    if (this.errors.has(endpoint)) {
      throw this.errors.get(endpoint);
    }

    if (this.responses.has(endpoint)) {
      return this.responses.get(endpoint);
    }

    // Default mock response
    return { success: true };
  }

  async get(endpoint, options = {}) {
    return this._fetch(endpoint, { ...options, method: "GET" });
  }

  async post(endpoint, data, options = {}) {
    // Store the call for spying
    if (!this._calls) {
      this._calls = [];
    }
    this._calls.push({ endpoint, data, options });

    return this._fetch(endpoint, {
      ...options,
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async put(endpoint, data, options = {}) {
    return this._fetch(endpoint, {
      ...options,
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async patch(endpoint, data, options = {}) {
    return this._fetch(endpoint, {
      ...options,
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async delete(endpoint, options = {}) {
    return this._fetch(endpoint, { ...options, method: "DELETE" });
  }

  async uploadFile(endpoint, file) {
    return this._fetch(endpoint, {
      method: "POST",
      body: file,
    });
  }
}

export const mockApiClient = new MockApiClient();
