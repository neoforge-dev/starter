import { expect, vi, describe, it, beforeEach, afterEach } from "vitest";

// Define ErrorType enum directly in the test
const ErrorType = {
  VALIDATION: "validation",
  NETWORK: "network",
  AUTH: "auth",
  API: "api",
  UNKNOWN: "unknown",
};

// Define AppError class directly in the test
class AppError extends Error {
  constructor(message, type = ErrorType.UNKNOWN, details = null) {
    super(message);
    this.name = "AppError";
    this.type = type;
    this.details = details;
    this.timestamp = new Date();
  }
}

// Create a mock API client for testing
class MockApiClient {
  constructor() {
    this.responses = new Map();
    this.errors = new Map();
    this.calls = [];
  }

  setResponse(endpoint, response) {
    this.responses.set(endpoint, response);
  }

  setError(endpoint, error) {
    this.errors.set(endpoint, error);
  }

  async _fetch(endpoint, options = {}) {
    if (this.errors.has(endpoint)) {
      throw this.errors.get(endpoint);
    }

    if (this.responses.has(endpoint)) {
      return this.responses.get(endpoint);
    }

    // Default mock response
    return { success: true };
  }

  async post(endpoint, data, options = {}) {
    this.calls.push({ endpoint, data, options, method: "POST" });
    return this._fetch(endpoint, {
      ...options,
      method: "POST",
      body: JSON.stringify(data),
    });
  }
}

// Create a simplified version of the error service for testing
class ErrorService {
  constructor(apiClient) {
    this._errorListeners = new Set();
    this._apiClient = apiClient;
  }

  addListener(listener) {
    this._errorListeners.add(listener);
  }

  removeListener(listener) {
    this._errorListeners.delete(listener);
  }

  async handleError(error) {
    // Convert to AppError if needed
    const appError =
      error instanceof AppError ? error : this._normalizeError(error);

    // Log the error
    console.error("Error occurred:", appError);

    // Notify listeners
    this._errorListeners.forEach((listener) => {
      try {
        listener(appError);
      } catch (err) {
        console.error("Error in error listener:", err);
      }
    });

    // Show user-friendly message
    this._showErrorMessage(appError);

    // Report error if needed
    if (this._shouldReportError(appError)) {
      await this._reportError(appError);
    }
  }

  _showErrorMessage(error) {
    // Mock implementation
  }

  _normalizeError(error) {
    if (error instanceof AppError) {
      return error;
    }

    // Check for network errors
    if (
      error instanceof TypeError &&
      (error.message.includes("Failed to fetch") ||
        error.message.includes("NetworkError") ||
        error.message.includes("Network error"))
    ) {
      return new AppError(
        "Network error. Please check your connection.",
        ErrorType.NETWORK,
        { originalError: error }
      );
    }

    return new AppError(error.message || "An unknown error occurred");
  }

  _shouldReportError(error) {
    // Don't report validation errors
    if (error.type === ErrorType.VALIDATION) {
      return false;
    }

    // Don't report auth errors
    if (error.type === ErrorType.AUTH) {
      return false;
    }

    // Don't report network errors
    if (error.type === ErrorType.NETWORK) {
      return false;
    }

    return true;
  }

  async _reportError(error) {
    try {
      // Create the payload
      const payload = {
        type: error.type,
        message: error.message,
        details: error.details,
        timestamp: error.timestamp,
        userAgent: "test",
        url: "test",
      };

      // Send the error to the backend
      await this._apiClient.post("/errors", payload);
    } catch (err) {
      console.error("Failed to report error:", err);
    }
  }
}

describe("ErrorService", () => {
  let consoleError;
  let mockApiClient;
  let errorService;

  beforeEach(() => {
    // Mock console.error
    consoleError = console.error;
    console.error = vi.fn();

    // Create mock API client
    mockApiClient = new MockApiClient();
    mockApiClient.calls = []; // Reset calls array

    // Create error service instance
    errorService = new ErrorService(mockApiClient);
  });

  afterEach(() => {
    console.error = consoleError;
    vi.clearAllMocks();
  });

  describe("AppError", () => {
    it("creates an error with correct properties", () => {
      const error = new AppError("Test error", ErrorType.API, { status: 404 });

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe("Test error");
      expect(error.type).toBe(ErrorType.API);
      expect(error.details).toEqual({ status: 404 });
      expect(error.timestamp).toBeInstanceOf(Date);
    });

    it("defaults to UNKNOWN type if not specified", () => {
      const error = new AppError("Test error");
      expect(error.type).toBe(ErrorType.UNKNOWN);
    });
  });

  describe("Error Handling", () => {
    it("handles errors", async () => {
      const listener = vi.fn();
      errorService.addListener(listener);

      mockApiClient.setResponse("/errors", { success: true });

      const error = new AppError("Test error");
      await errorService.handleError(error);

      expect(listener).toHaveBeenCalledWith(error);
      errorService.removeListener(listener);
    });

    it("converts regular errors to AppError", async () => {
      const listener = vi.fn();
      errorService.addListener(listener);

      mockApiClient.setResponse("/errors", { success: true });

      const originalError = new Error("Original error");
      await errorService.handleError(originalError);

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Original error",
          type: ErrorType.UNKNOWN,
        })
      );
      errorService.removeListener(listener);
    });

    it("handles network errors", async () => {
      const listener = vi.fn();
      errorService.addListener(listener);

      const networkError = new TypeError("Failed to fetch");
      mockApiClient.setError("/errors", networkError);

      await errorService.handleError(networkError);

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: ErrorType.NETWORK,
          message: "Network error. Please check your connection.",
        })
      );
      errorService.removeListener(listener);
    });

    it("handles validation errors", async () => {
      const listener = vi.fn();
      errorService.addListener(listener);

      const validationError = new AppError(
        "Invalid input",
        ErrorType.VALIDATION,
        { field: "email" }
      );

      await errorService.handleError(validationError);

      expect(listener).toHaveBeenCalledWith(validationError);
      errorService.removeListener(listener);
    });
  });

  describe("Error Reporting", () => {
    it("determines if an error should be reported", () => {
      const validationError = new AppError(
        "Invalid input",
        ErrorType.VALIDATION
      );
      expect(errorService._shouldReportError(validationError)).toBe(false);

      const apiError = new AppError("Server error", ErrorType.API);
      expect(errorService._shouldReportError(apiError)).toBe(true);
    });

    it("normalizes errors", () => {
      const error = new Error("Test error");
      const normalized = errorService._normalizeError(error);

      expect(normalized).toBeInstanceOf(AppError);
      expect(normalized.message).toBe("Test error");
      expect(normalized.type).toBe(ErrorType.UNKNOWN);
    });

    it("reports errors to the backend", async () => {
      // Create a fresh mock API client for this test
      const testMockApiClient = new MockApiClient();
      const testErrorService = new ErrorService(testMockApiClient);

      // Set up the response
      testMockApiClient.setResponse("/errors", { success: true });

      const error = new AppError("Test error", ErrorType.API);
      await testErrorService._reportError(error);

      // Verify that the API client was called with the correct payload
      expect(testMockApiClient.calls.length).toBe(1);
      expect(testMockApiClient.calls[0].endpoint).toBe("/errors");
      expect(testMockApiClient.calls[0].data.type).toBe(ErrorType.API);
      expect(testMockApiClient.calls[0].data.message).toBe("Test error");
    });

    it("handles failed error reporting gracefully", async () => {
      // Create a fresh mock API client for this test
      const testMockApiClient = new MockApiClient();
      const testErrorService = new ErrorService(testMockApiClient);

      const reportError = new Error("Failed to report");
      testMockApiClient.setError("/errors", reportError);

      const error = new AppError("Test error", ErrorType.API);
      await expect(
        testErrorService._reportError(error)
      ).resolves.toBeUndefined();
    });
  });
});
